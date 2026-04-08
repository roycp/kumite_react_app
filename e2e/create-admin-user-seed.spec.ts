/**
 * e2e/create-admin-user-seed.spec.ts
 *
 * Verifies the admin user seed runs on server start:
 * 1. Admin user is created with correct credentials
 * 2. Seed is idempotent — calling it twice creates only one admin user
 */

import { test, expect } from '@playwright/test';
import { startTestServer, stopTestServer } from '../server/src/test-server';
import { seedAdmin } from '../server/src/seed';
import { User } from '../server/src/models/User';

const ADMIN_EMAIL    = 'admin@kumite.app';
const ADMIN_PASSWORD = 'Admin@1234';

let baseURL: string;

test.beforeAll(async () => {
  // runSeed=true mirrors what server.ts does after connectDB()
  baseURL = await startTestServer(0, true);
});

test.afterAll(async () => {
  await stopTestServer();
});

test.describe('Admin user seed', () => {

  test('admin user exists in DB after server start', async () => {
    const admin = await User.findOne({ email: ADMIN_EMAIL }).lean();
    expect(admin).not.toBeNull();
    expect(admin!.role).toBe('admin');
    expect(admin!.fullName).toBe('Administrator');
  });

  test('admin can log in with seeded credentials', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    expect(body.user.role).toBe('admin');
    expect(body.user.passwordHash).toBeUndefined();
  });

  test('seed is idempotent — running it twice keeps only one admin user', async () => {
    // Run seed again on the same connected DB
    await seedAdmin();

    const count = await User.countDocuments({ email: ADMIN_EMAIL });
    expect(count).toBe(1);
  });

});
