/**
 * e2e/martial-arts-profile.spec.ts
 *
 * Tests for martial arts section on ProfileScreen:
 *   1. User can add a martial art rank on their profile
 *   2. User can edit their rank
 *   3. User can remove a martial art rank
 */

import { test, expect, Page } from '@playwright/test';

const ATHLETE_USER = {
  id: 'athlete-ma-profile', email: 'athlete.map@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Carlos Karateka', country: 'CR', age: '25', gender: 'Masculino',
  academy: 'Dojo Kyoto', weight: '70', beltGrade: '5° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const SEED_ART = {
  id: 'art-karate-profile', name: 'Karate', logo: '🥋',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const SEED_RANK_1 = {
  id: 'rank-10kyu', martialArtId: 'art-karate-profile', name: '10° Kyu',
  description: 'Cinturón blanco', rank: 1, classification: 'beginner', applicableTo: 'both',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const SEED_RANK_2 = {
  id: 'rank-5kyu', martialArtId: 'art-karate-profile', name: '5° Kyu',
  description: 'Cinturón amarillo', rank: 6, classification: 'beginner', applicableTo: 'both',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user, art, ranks }) => {
    localStorage.setItem('db:users',                  JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',        user.id);
    localStorage.setItem('db:registrations',          JSON.stringify([]));
    localStorage.setItem('db:martial_arts',           JSON.stringify([art]));
    localStorage.setItem('db:rank_systems',           JSON.stringify(ranks));
    localStorage.setItem('db:user_martial_art_ranks', JSON.stringify([]));
  }, { user: ATHLETE_USER, art: SEED_ART, ranks: [SEED_RANK_1, SEED_RANK_2] });
}

test.setTimeout(120000);

test('profile: add, edit, and remove a martial art rank', async ({ page }) => {
  await injectAthlete(page);
  await page.goto('/screens/ProfileScreen');

  const screen = page.locator('[data-testid="profile-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Martial arts section is visible (arts exist in system)
  const section = page.locator('[data-testid="martial-arts-section"]');
  await section.waitFor({ state: 'visible', timeout: 8000 });

  // Initially no arts assigned
  await expect(page.locator('[data-testid="no-arts-assigned"]')).toBeVisible();

  // ── Add a martial art rank ────────────────────────────────────────────────────
  await page.locator('[data-testid="select-add-art"]').last().selectOption({ value: SEED_ART.id });

  // Rank select appears after choosing an art
  const rankSelect = page.locator('[data-testid="select-add-rank"]').last();
  await rankSelect.waitFor({ state: 'visible', timeout: 5000 });
  await rankSelect.selectOption({ value: SEED_RANK_1.id });

  await page.locator('[data-testid="btn-add-art-rank"]').last().click();

  // Row appears with art name and rank badge
  const artRow = page.locator(`[data-testid="art-rank-row-${SEED_ART.id}"]`);
  await artRow.waitFor({ state: 'visible', timeout: 5000 });
  await expect(page.locator(`[data-testid="rank-badge-${SEED_ART.id}"]`)).toContainText('10° Kyu');
  // No longer shows "no arts assigned"
  await expect(page.locator('[data-testid="no-arts-assigned"]')).not.toBeVisible();

  // ── Edit the rank ─────────────────────────────────────────────────────────────
  await page.locator(`[data-testid="btn-edit-rank-${SEED_ART.id}"]`).click();

  const editSelect = page.locator('[data-testid="input-edit-rank"]').last();
  await editSelect.waitFor({ state: 'visible', timeout: 5000 });
  await editSelect.selectOption({ value: SEED_RANK_2.id });
  await page.locator('[data-testid="btn-save-rank"]').last().click();

  await expect(page.locator(`[data-testid="rank-badge-${SEED_ART.id}"]`)).toContainText('5° Kyu', { timeout: 5000 });
  await expect(page.locator('[data-testid="input-edit-rank"]')).not.toBeVisible();

  // ── Remove the rank ───────────────────────────────────────────────────────────
  await page.locator(`[data-testid="btn-remove-rank-${SEED_ART.id}"]`).click();
  await expect(page.locator('[data-testid="no-arts-assigned"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator(`[data-testid="art-rank-row-${SEED_ART.id}"]`)).not.toBeVisible();
});
