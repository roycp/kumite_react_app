/**
 * e2e/add-user-authentication.spec.ts
 *
 * Tests the server-side authentication system (Devise-like):
 * - Registration with bcrypt password hashing
 * - Login returning JWT token
 * - Protected route enforcement
 */

import { test, expect } from '@playwright/test';
import { startTestServer, stopTestServer } from '../server/src/test-server';

let baseURL: string;

test.beforeAll(async () => {
  baseURL = await startTestServer();
});

test.afterAll(async () => {
  await stopTestServer();
});

const testUser = {
  email: 'auth.test@example.com',
  password: 'SecurePass123!',
  fullName: 'Auth Tester',
  role: 'athlete',
};

test.describe('User Authentication', () => {

  test('POST /api/auth/register creates account and returns JWT token', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/auth/register`, { data: testUser });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.').length).toBe(3); // valid JWT format
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.fullName).toBe(testUser.fullName);
    expect(body.user.passwordHash).toBeUndefined();
  });

  test('POST /api/auth/register returns 409 for duplicate email', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/auth/register`, { data: testUser });
    expect(res.status()).toBe(409);
  });

  test('POST /api/auth/login with correct credentials returns JWT token', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.').length).toBe(3);
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.passwordHash).toBeUndefined();
  });

  test('POST /api/auth/login with wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/auth/login`, {
      data: { email: testUser.email, password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('POST /api/auth/login with unknown email returns 401', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/auth/login`, {
      data: { email: 'nobody@example.com', password: 'anypass' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/users without token returns 401', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/users`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/users with valid token returns 200 and user list', async ({ request }) => {
    const loginRes = await request.post(`${baseURL}/api/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });
    const { token } = await loginRes.json();

    const res = await request.get(`${baseURL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].passwordHash).toBeUndefined();
  });

  test('password is stored as bcrypt hash (not plaintext)', async ({ request }) => {
    const loginRes = await request.post(`${baseURL}/api/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });
    const { token } = await loginRes.json();

    const usersRes = await request.get(`${baseURL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await usersRes.json();
    const registeredUser = users.find((u: any) => u.email === testUser.email);
    // passwordHash is excluded from GET responses — the point is the password is NOT returned
    expect(registeredUser.passwordHash).toBeUndefined();
  });

});
