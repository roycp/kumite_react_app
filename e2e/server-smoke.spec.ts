/**
 * e2e/server-smoke.spec.ts
 *
 * Verifies the Node.js server is running, connected to MongoDB, and
 * persisting data correctly. Uses Playwright's request fixture (no browser).
 *
 * Prerequisites:
 *   1. MongoDB must be running on localhost:27017
 *   2. Server must be running: cd server && npm run dev
 *      (listens on http://localhost:3001 by default)
 */

import { test, expect } from '@playwright/test';

const SERVER = 'http://localhost:3001';

// ── Health ─────────────────────────────────────────────────────────────────────

test('GET /health returns ok', async ({ request }) => {
  const res = await request.get(`${SERVER}/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body).toHaveProperty('timestamp');
});

// ── Auth / Registration ────────────────────────────────────────────────────────

test('POST /api/auth/register creates user and returns JWT', async ({ request }) => {
  const email = `smoke-reg-${Date.now()}@kumite.test`;

  const res = await request.post(`${SERVER}/api/auth/register`, {
    data: {
      email,
      password:  'Smoke@1234',
      fullName:  'Smoke Register',
      role:      'athlete',
      country:   'Costa Rica',
      age:       '25',
      gender:    'Masculino',
      academy:   'Dojo Test',
      weight:    '70',
      beltGrade: '5° Kyu',
    },
  });

  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body).toHaveProperty('token');
  expect(typeof body.token).toBe('string');
  expect(body.user.email).toBe(email);
  expect(body.user.role).toBe('athlete');
  // passwordHash must never be exposed
  expect(body.user).not.toHaveProperty('passwordHash');
});

test('POST /api/auth/register rejects duplicate email with 409', async ({ request }) => {
  const email = `smoke-dup-${Date.now()}@kumite.test`;
  const payload = { email, password: 'Dup@1234', fullName: 'Dup User' };

  const first = await request.post(`${SERVER}/api/auth/register`, { data: payload });
  expect(first.status()).toBe(201);

  const second = await request.post(`${SERVER}/api/auth/register`, { data: payload });
  expect(second.status()).toBe(409);
});

// ── Login ──────────────────────────────────────────────────────────────────────

test('POST /api/auth/login returns JWT for valid credentials', async ({ request }) => {
  const email = `smoke-login-${Date.now()}@kumite.test`;

  // Register
  await request.post(`${SERVER}/api/auth/register`, {
    data: { email, password: 'Login@1234', fullName: 'Login Test' },
  });

  // Login
  const res = await request.post(`${SERVER}/api/auth/login`, {
    data: { email, password: 'Login@1234' },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('token');
  expect(body.user.email).toBe(email);
  expect(body.user).not.toHaveProperty('passwordHash');
});

test('POST /api/auth/login rejects wrong password with 401', async ({ request }) => {
  const email = `smoke-bad-${Date.now()}@kumite.test`;
  await request.post(`${SERVER}/api/auth/register`, {
    data: { email, password: 'Correct@1234', fullName: 'Bad Pass Test' },
  });

  const res = await request.post(`${SERVER}/api/auth/login`, {
    data: { email, password: 'Wrong@1234' },
  });
  expect(res.status()).toBe(401);
});

// ── Seeded admin user ──────────────────────────────────────────────────────────

test('seeded admin@kumite.app can login with default password', async ({ request }) => {
  const res = await request.post(`${SERVER}/api/auth/login`, {
    data: { email: 'admin@kumite.app', password: 'Admin@1234' },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.user.role).toBe('admin');
  expect(body.user.fullName).toBe('Administrator');
});

// ── GET /api/users (protected) ─────────────────────────────────────────────────

test('GET /api/users requires auth header', async ({ request }) => {
  const res = await request.get(`${SERVER}/api/users`);
  expect(res.status()).toBe(401);
});

test('GET /api/users returns user list with valid token', async ({ request }) => {
  const loginRes = await request.post(`${SERVER}/api/auth/login`, {
    data: { email: 'admin@kumite.app', password: 'Admin@1234' },
  });
  const { token } = await loginRes.json();

  const res = await request.get(`${SERVER}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const users = await res.json();
  expect(Array.isArray(users)).toBe(true);
  expect(users.length).toBeGreaterThan(0);
  // passwordHash must never be exposed
  users.forEach((u: any) => expect(u).not.toHaveProperty('passwordHash'));
});

// ── Data shape ─────────────────────────────────────────────────────────────────

test('registered user response has id not _id', async ({ request }) => {
  const email = `smoke-id-${Date.now()}@kumite.test`;
  const res = await request.post(`${SERVER}/api/auth/register`, {
    data: { email, password: 'Id@1234', fullName: 'ID Shape Test' },
  });
  const body = await res.json();
  expect(body.user).toHaveProperty('id');
  expect(body.user).not.toHaveProperty('_id');
});
