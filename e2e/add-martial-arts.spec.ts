/**
 * e2e/add-martial-arts.spec.ts
 *
 * Tests for the MartialArtsScreen (admin-only):
 *   1. Admin can add a martial art and see it in the list
 *   2. Admin can edit a martial art name and logo
 *   3. Admin can delete a martial art (empty state shown after)
 *   4. Non-admin (athlete) is redirected away from the screen
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id:           'admin-ma-test',
  email:        'admin.ma@test.example.com',
  passwordHash: 'abc123',
  role:         'admin',
  fullName:     'Admin MA',
  country:      'Costa Rica',
  age:          '30',
  gender:       'Masculino',
  academy:      '',
  weight:       '',
  beltGrade:    '',
  createdAt:    '2026-01-01T00:00:00.000Z',
  synced:       false,
};

const ATHLETE_USER = {
  id:           'athlete-ma-test',
  email:        'athlete.ma@test.example.com',
  passwordHash: 'abc123',
  role:         'athlete',
  fullName:     'Athlete MA',
  country:      'Costa Rica',
  age:          '22',
  gender:       'Femenino',
  academy:      'Dojo Test',
  weight:       '55',
  beltGrade:    '5° Kyu',
  createdAt:    '2026-01-01T00:00:00.000Z',
  synced:       false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
    localStorage.setItem('db:martial_arts',    JSON.stringify([]));
  }, ADMIN_USER);
}

async function injectAthlete(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
    localStorage.setItem('db:martial_arts',    JSON.stringify([]));
  }, ATHLETE_USER);
}

async function fillInput(page: Page, testId: string, value: string) {
  const el = page.locator(`[data-testid="${testId}"]`).last();
  await el.fill('');
  await el.type(value);
}

test.setTimeout(120000);

test('admin: add, edit, and delete a martial art', async ({ page }) => {
  await injectAdmin(page);
  await page.goto('/screens/MartialArtsScreen');

  const screen = page.locator('[data-testid="martial-arts-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // ── Empty state ──────────────────────────────────────────────────────────────
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

  // ── Add a martial art ────────────────────────────────────────────────────────
  await fillInput(page, 'input-new-logo', '🥋');
  await fillInput(page, 'input-new-name', 'Karate');
  await page.locator('[data-testid="btn-add-martial-art"]').click();

  // Card appears, empty state gone
  await page.locator('[data-testid="martial-arts-list"]').waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.locator('[data-testid="empty-state"]')).not.toBeVisible();
  await expect(page.getByText('Karate').first()).toBeVisible();
  await expect(page.getByText('🥋').first()).toBeVisible();

  // ── Add a second martial art ──────────────────────────────────────────────
  await fillInput(page, 'input-new-name', 'Judo');
  await fillInput(page, 'input-new-logo', '🟦');
  await page.locator('[data-testid="btn-add-martial-art"]').click();
  await expect(page.getByText('Judo').first()).toBeVisible({ timeout: 5000 });

  // ── Edit the first martial art ────────────────────────────────────────────
  // Find Karate's card and click its Edit button
  const editBtn = page.locator('[data-testid^="btn-edit-"]').first();
  await editBtn.click();

  // Inline edit fields appear
  await page.locator('[data-testid="input-edit-name"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await fillInput(page, 'input-edit-name', 'Karate Kyokushin');
  await page.locator('[data-testid="btn-save-edit"]').last().click();

  // Updated name shown
  await expect(page.getByText('Karate Kyokushin').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="input-edit-name"]')).not.toBeVisible();

  // ── Delete Judo ───────────────────────────────────────────────────────────
  const deleteBtns = page.locator('[data-testid^="btn-delete-"]');
  // Click the second delete button (Judo)
  await deleteBtns.last().click();
  await expect(page.getByText('Judo')).not.toBeVisible({ timeout: 5000 });
  // Karate Kyokushin still there
  await expect(page.getByText('Karate Kyokushin').first()).toBeVisible();

  // ── Delete the last martial art → empty state ──────────────────────────────
  await page.locator('[data-testid^="btn-delete-"]').first().click();
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5000 });
});

test('athlete: redirected away from MartialArtsScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto('/screens/MartialArtsScreen');

  // Should end up on MainScreen, not on the martial arts screen
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
