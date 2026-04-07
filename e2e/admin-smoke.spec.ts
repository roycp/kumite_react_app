/**
 * e2e/admin-smoke.spec.ts
 *
 * Smoke test for the admin role:
 *   - Injects an admin user directly into localStorage (no signup flow)
 *   - Navigates to MainScreen and verifies the user is recognised as admin
 *   - Checks that the admin nav items are present in the sidebar
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id:           'admin-test-user',
  email:        'admin@test.example.com',
  passwordHash: 'abc123',
  role:         'admin',
  fullName:     'Admin User',
  country:      'Costa Rica',
  age:          '30',
  gender:       'Masculino',
  academy:      '',
  weight:       '',
  beltGrade:    '',
  createdAt:    '2026-01-01T00:00:00.000Z',
  synced:       false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
  }, ADMIN_USER);
}

test.setTimeout(60000);

test('admin: sidebar shows admin nav items', async ({ page }) => {
  await injectAdmin(page);

  await page.goto('/screens/MainScreen');
  await page.locator('[data-testid="main-screen"]').last().waitFor({ state: 'visible', timeout: 20000 });

  // User is recognised as the admin
  await expect(page.getByText(ADMIN_USER.fullName).first()).toBeVisible();

  // Admin-specific nav items are present (first = desktop sidebar)
  await expect(page.locator('[data-testid="sidebar-martial-arts"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="sidebar-organizations"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="sidebar-admin-tournaments"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="sidebar-users"]').first()).toBeVisible();

  // Athlete-only items are NOT present for admin
  await expect(page.locator('[data-testid="sidebar-active"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="sidebar-history"]')).not.toBeVisible();
});
