const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { issueToken, tokenIdentity, validCredentials, imageExtension, asyncRoute } = require('../src/security');
const { upload } = require('../src/middleware/uploadMiddleware');

test('signing boundary and credentials are bounded', () => {
  delete process.env.JWT_SECRET;
  assert.throws(() => issueToken('member'));
  process.env.JWT_SECRET = 'test-only-signing-key-'.repeat(3);
  const token = issueToken('member');
  assert.equal(tokenIdentity(token), 'member');
  const value = jwt.decode(token);
  assert.equal(value.exp - value.iat, 3600);
  assert.throws(() => tokenIdentity(jwt.sign({ userId: 42 }, process.env.JWT_SECRET)));
  assert.throws(() => tokenIdentity(jwt.sign({ userId: 'member' }, process.env.JWT_SECRET, { algorithm: 'HS384' })));
  assert.equal(validCredentials(null), false);
  assert.equal(validCredentials({ email: 'demo@example.com', password: 'a'.repeat(73) }), false);
  assert.equal(validCredentials({ email: 'demo@example.com', password: 'valid-local-test' }), true);
  assert.equal(imageExtension(Buffer.from('<svg>active markup</svg>')), null);
});
test('upload rejects spoofed/oversize files and stores a PNG under a generated name', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'member-upload-test-'));
  process.env.UPLOAD_DIR = directory;
  const app = express();
  app.post('/profile', upload.single('photo'), (req, res) => res.json({ name: req.file.filename }));
  const fields = (call) => call.field('name', 'Synthetic Member').field('headline', 'Testing').field('bio', 'Synthetic').field('interests', 'testing');
  try {
    const spoofed = await fields(request(app).post('/profile')).attach('photo', Buffer.from('<html>active</html>'), 'avatar.png');
    assert.equal(spoofed.status, 400);
    assert.equal(fs.readdirSync(directory).length, 0);
    const huge = await fields(request(app).post('/profile')).attach('photo', Buffer.alloc(2 * 1024 * 1024 + 1), 'avatar.png');
    assert.equal(huge.status, 400);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n1cAAAAASUVORK5CYII=', 'base64');
    const saved = await fields(request(app).post('/profile')).attach('photo', png, 'original.svg');
    assert.equal(saved.status, 200);
    assert.match(saved.body.name, /^[0-9a-f-]{36}\.png$/);
    assert.deepEqual(fs.readFileSync(path.join(directory, saved.body.name)), png);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('async route sends rejected promises to the Express error handler', async () => {
  const app = express();
  app.get('/', asyncRoute(async () => { throw new Error('private database detail'); }));
  app.use((_error, _req, res, _next) => res.status(500).json({ error: 'Request failed' }));
  const result = await request(app).get('/');
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'Request failed');
});
