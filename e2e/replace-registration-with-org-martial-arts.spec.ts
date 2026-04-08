/**
 * e2e/replace-registration-with-org-martial-arts.spec.ts
 *
 * Tests that DB-created tournaments (with martial arts) appear in TournamentSearch
 * and can be used for registration via the simplified DB wizard flow.
 */

import { test, expect, Page } from '@playwright/test';

const ART_ID   = 'art-karate-001';
const TOURN_ID = 'db-tourn-001';

const MARTIAL_ART = {
  id: ART_ID, name: 'Karate', logo: '🥋',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const DB_TOURNAMENT = {
  id: TOURN_ID, name: 'Copa Karate CR 2026',
  date: '2026-09-01', location: 'San José, CR',
  logo: '🏆', description: 'Torneo oficial de Karate',
  status: 'upcoming', martialArtIds: [ART_ID],
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-org-reg-test', email: 'athlete.orgreg@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta Karate', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo CR', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function inject(page: Page) {
  await page.addInitScript(({ user, art, tournament }) => {
    localStorage.setItem('db:users',              JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',    user.id);
    localStorage.setItem('db:martial_arts',       JSON.stringify([art]));
    localStorage.setItem('db:tournaments',        JSON.stringify([tournament]));
    localStorage.setItem('db:registrations',      JSON.stringify([]));
    localStorage.setItem('db:user_martial_art_ranks', JSON.stringify([]));
  }, { user: ATHLETE_USER, art: MARTIAL_ART, tournament: DB_TOURNAMENT });
}

test.setTimeout(120000);

test('DB tournament appears in TournamentSearch with martial art as discipline', async ({ page }) => {
  await inject(page);
  await page.goto('/screens/TournamentSearch');

  const screen = page.locator('[data-testid="tournament-search-screen"]');
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // DB tournament tile should appear
  const tile = page.locator(`[data-testid="tournament-tile-${TOURN_ID}"]`);
  await expect(tile).toBeVisible({ timeout: 10000 });
  await expect(tile).toContainText('Copa Karate CR 2026');
  // Should show 'Karate' as a discipline tag
  await expect(tile).toContainText('Karate');
});

test('DB tournament registration flow: info → discipline → success', async ({ page }) => {
  await inject(page);
  await page.goto('/screens/TournamentSearch');

  const screen = page.locator('[data-testid="tournament-search-screen"]');
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Click the DB tournament tile
  await page.locator(`[data-testid="tournament-tile-${TOURN_ID}"]`).click();

  // TournamentDetail screen
  const detail = page.locator('[data-testid="tournament-detail-screen"]');
  await detail.waitFor({ state: 'visible', timeout: 10000 });
  await expect(page.locator('[data-testid="detail-name"]')).toContainText('Copa Karate CR 2026');

  // Click register button
  await page.locator('[data-testid="btn-syncup-tournament"]').click();

  // FormScreen info phase
  await page.locator('[data-testid="academy-input"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('[data-testid="academy-input"]').fill('Mi Dojo');
  await page.locator('[data-testid="btn-next-info"]').click();

  // Modality grid with Karate tile
  const modalityGrid = page.locator('[data-testid="modality-grid"]');
  await modalityGrid.waitFor({ state: 'visible', timeout: 8000 });
  await expect(modalityGrid).toContainText('Karate');

  // Click Karate tile
  await page.locator('[data-testid="modality-tile-karate"]').click();

  // Success screen
  const success = page.locator('[data-testid="success-message"]');
  await success.waitFor({ state: 'visible', timeout: 8000 });
  await expect(success).toContainText('Copa Karate CR 2026');
  await expect(success).toContainText('Karate');
});
