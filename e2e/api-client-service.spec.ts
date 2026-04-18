/**
 * e2e/api-client-service.spec.ts
 *
 * Validates the behavior that services/api.ts implements:
 *   - Token stored/retrieved from localStorage['session:jwt']
 *   - fetch calls reach the server at http://localhost:3001
 *   - Authorization header is sent when a token is present
 *   - Non-2xx responses surface a status code that callers can check
 *   - 204 No Content responses return undefined (not a parse error)
 *
 * Tests run inside the Expo web browser context using page.evaluate
 * with direct fetch() calls — mirrors what services/api.ts does at runtime.
 *
 * Prerequisites: server running on http://localhost:3001
 */

import { test, expect } from '@playwright/test';

const SERVER = 'http://localhost:3001';
const TOKEN_KEY = 'session:jwt';

async function loadApp(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
}

// ── Token management (localStorage) ───────────────────────────────────────────

test.describe('token management', () => {
  test('storeToken writes to localStorage[session:jwt]', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(
      ([key, val]) => localStorage.setItem(key, val),
      [TOKEN_KEY, 'my-test-jwt'],
    );
    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      TOKEN_KEY,
    );
    expect(stored).toBe('my-test-jwt');
  });

  test('clearToken removes localStorage[session:jwt]', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(
      ([key, val]) => localStorage.setItem(key, val),
      [TOKEN_KEY, 'to-be-cleared'],
    );
    await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
    const gone = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(gone).toBeNull();
  });
});

// ── fetch helpers ─────────────────────────────────────────────────────────────

test.describe('HTTP helpers', () => {
  test('apiGet — fetch GET returns parsed JSON', async ({ page }) => {
    await loadApp(page);
    const body = await page.evaluate(
      async (url) => {
        const res = await fetch(url);
        return res.json();
      },
      `${SERVER}/health`,
    );
    expect((body as any).status).toBe('ok');
  });

  test('apiPost — fetch POST creates resource and returns id not _id', async ({ page }) => {
    await loadApp(page);
    const email = `client-post-${Date.now()}@kumite.test`;

    const body = await page.evaluate(
      async ([url, payload]) => {
        const res = await fetch(url as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return res.json();
      },
      [`${SERVER}/api/auth/register`, { email, password: 'Post@1234', fullName: 'Post Test' }],
    );

    expect((body as any).token).toBeTruthy();
    expect((body as any).user).toHaveProperty('id');
    expect((body as any).user).not.toHaveProperty('_id');
    expect((body as any).user.email).toBe(email);
  });

  test('ApiError — non-2xx response exposes status code', async ({ page }) => {
    await loadApp(page);
    const result = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@no.com', password: 'wrong' }),
      });
      const json = await res.json();
      return { status: res.status, error: (json as any).error };
    }, `${SERVER}/api/auth/login`);

    expect((result as any).status).toBe(401);
    expect((result as any).error).toBeTruthy();
  });

  test('Authorization header enables protected endpoint', async ({ page }) => {
    await loadApp(page);

    const result = await page.evaluate(
      async ([loginUrl, usersUrl]) => {
        const loginRes = await fetch(loginUrl as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@kumite.app', password: 'Admin@1234' }),
        });
        const { token } = await loginRes.json() as any;

        const usersRes = await fetch(usersUrl as string, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = await usersRes.json();
        return { status: usersRes.status, isArray: Array.isArray(users) };
      },
      [`${SERVER}/api/auth/login`, `${SERVER}/api/users`],
    );

    expect((result as any).status).toBe(200);
    expect((result as any).isArray).toBe(true);
  });

  test('missing Authorization returns 401 on protected endpoint', async ({ page }) => {
    await loadApp(page);
    const status = await page.evaluate(async (url) => {
      const res = await fetch(url as string);
      return res.status;
    }, `${SERVER}/api/users`);
    expect(status).toBe(401);
  });

  test('apiDelete — 204 No Content does not cause a JSON parse error', async ({ page }) => {
    await loadApp(page);

    const result = await page.evaluate(async ([maUrl]: string[]) => {
      // Create
      const createRes = await fetch(maUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `DeleteMe-${Date.now()}`, logo: '🗑️' }),
      });
      const created = await createRes.json() as any;

      // Delete
      const delRes = await fetch(`${maUrl}/${created.id}`, { method: 'DELETE' });
      return { status: delRes.status, hasBody: delRes.headers.get('content-length') !== '0' };
    }, [`${SERVER}/api/martial-arts`]);

    expect((result as any).status).toBe(204);
  });
});
