/**
 * e2e/admin-tournaments.spec.ts
 *
 * Tests for AdminTournamentsScreen (admin-only):
 *   1. Admin can add a tournament and see it in the list
 *   2. Admin can edit a tournament
 *   3. Admin can delete a tournament (empty state after)
 *   4. Athlete is redirected away
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-tourn-test', email: 'admin.tourn@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Torneos', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-tourn-test', email: 'athlete.tourn@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Athlete Torneos', country: 'CR', age: '22', gender: 'Femenino',
  academy: 'Dojo', weight: '55', beltGrade: '5° Kyu', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
    localStorage.setItem('db:tournaments',     JSON.stringify([]));
  }, { user: ADMIN_USER });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
    localStorage.setItem('db:tournaments',     JSON.stringify([]));
  }, { user: ATHLETE_USER });
}

const URL = '/screens/AdminTournamentsScreen';

test.setTimeout(120000);

test('admin: add, edit, and delete a tournament', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(URL);

  const screen = page.locator('[data-testid="admin-tournaments-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Empty state
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

  // ── Add a tournament ──────────────────────────────────────────────────────────
  await page.locator('[data-testid="input-new-name"]').last().fill('Copa Nacional Karate 2026');
  await page.locator('[data-testid="input-new-date"]').last().fill('2026-06-15');
  await page.locator('[data-testid="input-new-location"]').last().fill('San José, CR');

  await page.locator('[data-testid="btn-add-tournament"]').click();

  const list = page.locator('[data-testid="tournaments-list"]');
  await list.waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.locator('[data-testid="empty-state"]')).not.toBeVisible();

  const card = page.locator('[data-testid^="tournament-card-"]').first();
  await expect(card).toBeVisible();
  await expect(page.locator('[data-testid^="tournament-name-"]').first()).toContainText('Copa Nacional Karate 2026');
  await expect(page.locator('[data-testid^="tournament-meta-"]').first()).toContainText('2026-06-15');
  await expect(page.locator('[data-testid^="tournament-meta-"]').first()).toContainText('San José, CR');
  await expect(page.locator('[data-testid^="tournament-status-"]').first()).toContainText('Próximo');

  // ── Edit the tournament ───────────────────────────────────────────────────────
  await page.locator('[data-testid^="btn-edit-"]').first().click();
  await page.locator('[data-testid="input-edit-name"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-testid="input-edit-name"]').last().fill('Copa Nacional 2026 Editado');
  await page.locator('[data-testid="btn-save-edit"]').last().click();

  await expect(page.locator('[data-testid^="tournament-name-"]').first()).toContainText('Copa Nacional 2026 Editado', { timeout: 5000 });
  await expect(page.locator('[data-testid="input-edit-name"]')).not.toBeVisible();

  // ── Delete → empty state ──────────────────────────────────────────────────────
  await page.locator('[data-testid^="btn-delete-"]').first().click();
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5000 });
});

test('athlete: redirected away from AdminTournamentsScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
