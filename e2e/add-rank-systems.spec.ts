/**
 * e2e/add-rank-systems.spec.ts
 *
 * Tests for RankSystemsScreen (admin-only):
 *   1. Admin can add a rank and see it in the list with chips
 *   2. Admin can edit a rank
 *   3. Admin can delete a rank (empty state after)
 *   4. Athlete is redirected away
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-rs-test', email: 'admin.rs@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin RS', country: 'CR', age: '30', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-rs-test', email: 'athlete.rs@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Athlete RS', country: 'CR', age: '22', gender: 'Femenino',
  academy: 'Dojo', weight: '55', beltGrade: '5° Kyu', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const SEED_ART = {
  id: 'art-karate-test', name: 'Karate', logo: '🥋',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ user, art }) => {
    localStorage.setItem('db:users',        JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([]));
    localStorage.setItem('db:martial_arts',  JSON.stringify([art]));
    localStorage.setItem('db:rank_systems',  JSON.stringify([]));
  }, { user: ADMIN_USER, art: SEED_ART });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user, art }) => {
    localStorage.setItem('db:users',        JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([]));
    localStorage.setItem('db:martial_arts',  JSON.stringify([art]));
    localStorage.setItem('db:rank_systems',  JSON.stringify([]));
  }, { user: ATHLETE_USER, art: SEED_ART });
}

const RANK_URL = `/screens/RankSystemsScreen?martialArtId=${SEED_ART.id}&martialArtName=Karate`;

test.setTimeout(120000);

test('admin: add, edit, and delete a rank', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(RANK_URL);

  const screen = page.locator('[data-testid="rank-systems-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // ── Empty state ──────────────────────────────────────────────────────────────
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

  // ── Add a rank ───────────────────────────────────────────────────────────────
  await page.locator('[data-testid="input-new-name"]').last().fill('10° Kyu');
  await page.locator('[data-testid="input-new-description"]').last().fill('Cinturón blanco');
  await page.locator('[data-testid="input-new-rank"]').last().fill('1');
  // classification defaults to beginner, applicableTo defaults to both
  await page.locator('[data-testid="btn-add-rank"]').click();

  await page.locator('[data-testid="rank-list"]').waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.locator('[data-testid="empty-state"]')).not.toBeVisible();
  await expect(page.getByText('10° Kyu').first()).toBeVisible();
  await expect(page.getByText('Cinturón blanco').first()).toBeVisible();
  // Classification chip visible
  await expect(page.locator('[data-testid^="chip-class-"]').first()).toContainText('Principiante');
  await expect(page.locator('[data-testid^="chip-applicable-"]').first()).toContainText('Todos');

  // ── Edit the rank ─────────────────────────────────────────────────────────────
  await page.locator('[data-testid^="btn-edit-"]').first().click();
  await page.locator('[data-testid="input-edit-name"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-testid="input-edit-name"]').last().fill('9° Kyu');
  await page.locator('[data-testid="btn-save-edit"]').last().click();

  await expect(page.getByText('9° Kyu').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="input-edit-name"]')).not.toBeVisible();

  // ── Delete the rank → empty state ─────────────────────────────────────────────
  await page.locator('[data-testid^="btn-delete-"]').first().click();
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5000 });
});

test('athlete: redirected away from RankSystemsScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(RANK_URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
