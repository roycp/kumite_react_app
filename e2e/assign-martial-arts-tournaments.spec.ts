/**
 * e2e/assign-martial-arts-tournaments.spec.ts
 *
 * Tests that tournaments can have martial arts assigned and displayed:
 *   1. Admin can add a tournament with a martial art and see the badge
 *   2. Admin can edit the tournament to change martial arts
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-art-tourn', email: 'admin.arttourn@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Art Tourn', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const SEED_ART = {
  id: 'art-karate-tourn', name: 'Karate', logo: '🥋',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ user, art }) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
    localStorage.setItem('db:tournaments',     JSON.stringify([]));
    localStorage.setItem('db:martial_arts',    JSON.stringify([art]));
  }, { user: ADMIN_USER, art: SEED_ART });
}

test.setTimeout(120000);

test('admin: add tournament with martial art and see badge', async ({ page }) => {
  await injectAdmin(page);
  await page.goto('/screens/AdminTournamentsScreen');

  const screen = page.locator('[data-testid="admin-tournaments-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // ── Add a tournament and check the martial art checkbox ───────────────────────
  await page.locator('[data-testid="input-new-name"]').last().fill('Torneo Karate 2026');

  // Check the martial art checkbox
  await page.locator(`[data-testid="input-new-art-${SEED_ART.id}"]`).last().check();

  await page.locator('[data-testid="btn-add-tournament"]').click();

  const list = page.locator('[data-testid="tournaments-list"]');
  await list.waitFor({ state: 'visible', timeout: 8000 });

  // Martial art badge appears on the card
  const artBadge = page.locator(`[data-testid="tournament-art-badge-${SEED_ART.id}"]`).first();
  await expect(artBadge).toBeVisible({ timeout: 5000 });
  await expect(artBadge).toContainText('Karate');

  // ── Edit: uncheck the martial art ────────────────────────────────────────────
  await page.locator('[data-testid^="btn-edit-"]').first().click();
  await page.locator('[data-testid="input-edit-name"]').last().waitFor({ state: 'visible', timeout: 5000 });

  // Uncheck the martial art
  await page.locator(`[data-testid="input-edit-art-${SEED_ART.id}"]`).last().uncheck();
  await page.locator('[data-testid="btn-save-edit"]').last().click();

  // Badge is no longer visible
  await expect(page.locator(`[data-testid="tournament-art-badge-${SEED_ART.id}"]`)).not.toBeVisible({ timeout: 5000 });
});
