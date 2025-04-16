const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
const { app } = require('../src/index');

test('responses carry security headers and photos may be embedded cross-origin', async () => {
  const response = await request(app).get('/uploads/missing.png').set('Origin', 'http://localhost:5173');
  assert.equal(response.status, 404);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['cross-origin-resource-policy'], 'cross-origin');
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('the health check answers without authentication', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('invalid signup bodies are rejected before touching the database', async () => {
  const response = await request(app).post('/api/auth/signup').send({ email: 'not-an-email', password: 'short' });
  assert.equal(response.status, 400);
});

test('oversized JSON bodies are refused', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'a@b.test', password: 'x'.repeat(20000) });
  assert.equal(response.status, 413);
});

test('malformed JSON is a client error', async () => {
  const response = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
  assert.equal(response.status, 400);
});
