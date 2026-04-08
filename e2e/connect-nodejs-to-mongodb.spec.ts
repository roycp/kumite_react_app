/**
 * e2e/connect-nodejs-to-mongodb.spec.ts
 *
 * Verifies that the Node.js server can connect to MongoDB and perform
 * basic CRUD operations on the Users collection.
 *
 * Uses mongodb-memory-server so no real MongoDB instance is needed.
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

test.describe('Node.js server + MongoDB integration', () => {

  test('GET /health returns 200 with status ok', async ({ request }) => {
    const res = await request.get(`${baseURL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  test('GET /api/users returns empty array initially', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/users`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  test('POST /api/users creates a user and returns 201', async ({ request }) => {
    const payload = {
      email: 'testuser@example.com',
      passwordHash: 'hashedpassword123',
      role: 'athlete',
      fullName: 'Test User',
      country: 'CR',
      age: '25',
      gender: 'Masculino',
      academy: 'Dojo Test',
      weight: '70',
      beltGrade: '1° Kyu',
    };

    const res = await request.post(`${baseURL}/api/users`, { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(payload.email);
    expect(body.fullName).toBe(payload.fullName);
    expect(body.role).toBe('athlete');
    expect(body.passwordHash).toBeUndefined();
    expect(body._id).toBeTruthy();
  });

  test('GET /api/users returns the created user', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/users`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].email).toBe('testuser@example.com');
    expect(body[0].passwordHash).toBeUndefined();
  });

  test('POST /api/users returns 409 for duplicate email', async ({ request }) => {
    const payload = {
      email: 'testuser@example.com',
      passwordHash: 'anotherhash',
      role: 'athlete',
      fullName: 'Duplicate User',
    };
    const res = await request.post(`${baseURL}/api/users`, { data: payload });
    expect(res.status()).toBe(409);
  });

  test('PATCH /api/users/:id updates a user', async ({ request }) => {
    const listRes = await request.get(`${baseURL}/api/users`);
    const users = await listRes.json();
    const id = users[0]._id;

    const res = await request.patch(`${baseURL}/api/users/${id}`, { data: { role: 'manager' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('manager');
  });

  test('DELETE /api/users/:id removes a user', async ({ request }) => {
    const listRes = await request.get(`${baseURL}/api/users`);
    const users = await listRes.json();
    const id = users[0]._id;

    const delRes = await request.delete(`${baseURL}/api/users/${id}`);
    expect(delRes.status()).toBe(204);

    const verifyRes = await request.get(`${baseURL}/api/users`);
    const remaining = await verifyRes.json();
    expect(remaining.length).toBe(0);
  });

});
