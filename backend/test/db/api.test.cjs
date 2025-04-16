// Runs against a real PostgreSQL database: `npm run test:db` with DATABASE_URL set.
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

process.env.JWT_SECRET = 'test-only-signing-key-'.repeat(3);
const uploads = fs.mkdtempSync(path.join(os.tmpdir(), 'member-api-uploads-'));
process.env.UPLOAD_DIR = uploads;

const { app } = require('../../src/index');
const { prisma } = require('../../src/db');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n1cAAAAASUVORK5CYII=', 'base64');
const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function member(email) {
  const response = await request(app).post('/api/auth/signup').send({ email, password: 'local-test-password' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body;
}

function saveProfile(token, fields = {}) {
  const values = { name: 'Rowan Ellery', headline: 'Ceramicist', bio: 'Throws stoneware.', interests: 'clay, kilns', ...fields };
  let call = request(app).post('/api/profile').set(auth(token));
  for (const [key, value] of Object.entries(values)) call = call.field(key, value);
  return call;
}

before(async () => { await prisma.$connect(); });
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE "Like", "Profile", "User" CASCADE');
  for (const name of fs.readdirSync(uploads)) fs.rmSync(path.join(uploads, name));
});
after(async () => {
  await prisma.$disconnect();
  fs.rmSync(uploads, { recursive: true, force: true });
});

test('signup and login issue tokens; wrong passwords are rejected', async () => {
  const created = await member('rowan@example.test');
  assert.ok(created.token && created.userId);
  const login = await request(app).post('/api/auth/login').send({ email: 'rowan@example.test', password: 'local-test-password' });
  assert.equal(login.status, 200);
  assert.equal(login.body.userId, created.userId);
  const wrong = await request(app).post('/api/auth/login').send({ email: 'rowan@example.test', password: 'not-the-password' });
  assert.equal(wrong.status, 401);
});

test('protected routes need a bearer token', async () => {
  assert.equal((await request(app).get('/api/profile/me')).status, 401);
});

test('a member saves a profile with a photo and reads it back', async () => {
  const { token } = await member('rowan@example.test');
  const saved = await saveProfile(token).attach('photo', PNG, 'avatar.png');
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const me = await request(app).get('/api/profile/me').set(auth(token));
  assert.equal(me.status, 200);
  assert.equal(me.body.name, 'Rowan Ellery');
  assert.deepEqual(me.body.interests, ['clay', 'kilns']);
  assert.match(me.body.photoUrl, /^http:\/\/127\.0\.0\.1:\d+\/uploads\/[0-9a-f-]{36}\.png$/);
  const photo = await request(app).get(new URL(me.body.photoUrl).pathname);
  assert.equal(photo.status, 200);
  assert.equal(photo.headers['content-type'], 'image/png');
});

test('the feed lists other members and counts likes', async () => {
  const rowan = await member('rowan@example.test');
  const tamsin = await member('tamsin@example.test');
  await saveProfile(rowan.token);
  await saveProfile(tamsin.token, { name: 'Tamsin Vale', headline: 'Cartographer' });
  const feed = await request(app).get('/api/profile/feed').set(auth(rowan.token));
  assert.equal(feed.status, 200);
  assert.deepEqual(feed.body.map((item) => item.name), ['Tamsin Vale']);
  const liked = await request(app).post(`/api/profile/${feed.body[0].id}/like`).set(auth(rowan.token));
  assert.equal(liked.status, 200);
  const after = await request(app).get('/api/profile/feed').set(auth(rowan.token));
  assert.equal(after.body[0].likeCount, 1);
  const unliked = await request(app).delete(`/api/profile/${feed.body[0].id}/unlike`).set(auth(rowan.token));
  assert.equal(unliked.status, 200);
});

test('likes are idempotent, never duplicated, and self-likes are refused', async () => {
  const rowan = await member('rowan@example.test');
  const tamsin = await member('tamsin@example.test');
  const own = await saveProfile(rowan.token);
  const target = await saveProfile(tamsin.token, { name: 'Tamsin Vale' });
  const likeUrl = `/api/profile/${target.body.id}/like`;
  const results = await Promise.all([1, 2, 3].map(() => request(app).post(likeUrl).set(auth(rowan.token))));
  for (const result of results) assert.equal(result.status, 200);
  assert.deepEqual(results[2].body, { likeCount: 1, likedByCurrentUser: true });
  assert.equal(await prisma.like.count(), 1);
  const self = await request(app).post(`/api/profile/${own.body.id}/like`).set(auth(rowan.token));
  assert.equal(self.status, 400);
  const unliked = await request(app).delete(`/api/profile/${target.body.id}/unlike`).set(auth(rowan.token));
  assert.deepEqual(unliked.body, { likeCount: 0, likedByCurrentUser: false });
});

test('liking a profile that does not exist is a 404, not a server error', async () => {
  const { token } = await member('rowan@example.test');
  const missing = '00000000-0000-4000-8000-000000000000';
  assert.equal((await request(app).post(`/api/profile/${missing}/like`).set(auth(token))).status, 404);
  assert.equal((await request(app).delete(`/api/profile/${missing}/unlike`).set(auth(token))).status, 404);
});

test('deleting a liked profile removes its likes and its stored photo', async () => {
  const rowan = await member('rowan@example.test');
  const tamsin = await member('tamsin@example.test');
  const target = await saveProfile(tamsin.token).attach('photo', PNG, 'avatar.png');
  await request(app).post(`/api/profile/${target.body.id}/like`).set(auth(rowan.token)).expect(200);
  assert.equal(fs.readdirSync(uploads).length, 1);
  const deleted = await request(app).delete('/api/profile').set(auth(tamsin.token));
  assert.equal(deleted.status, 200);
  assert.equal(await prisma.like.count(), 0);
  assert.equal(fs.readdirSync(uploads).length, 0);
  assert.equal((await request(app).delete('/api/profile').set(auth(tamsin.token))).status, 404);
});
