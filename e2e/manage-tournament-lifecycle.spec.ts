/**
 * e2e/manage-tournament-lifecycle.spec.ts
 *
 * Tests for lifecycle controls on TournamentDashboardScreen:
 *   1. Organizer can start an upcoming tournament (→ active)
 *   2. Organizer can end an active tournament (→ closed)
 *   3. End button is disabled when tournament is not active
 */

import { test, expect, Page } from '@playwright/test';

const ORGANIZER_USER = {
  id: 'org-lifecycle-test', email: 'org.lifecycle@test.example.com', passwordHash: 'abc123',
  role: 'organizer', fullName: 'Org Lifecycle', country: 'CR', age: '30', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const UPCOMING_TOURNAMENT = {
  id: 'tourn-lifecycle-001', name: 'Copa Lifecycle 2026',
  date: '2026-10-01', location: 'San José, CR',
  logo: '🏆', description: '',
  status: 'upcoming', martialArtIds: [],
  registrationStart: null, registrationEnd: null, registrationForceOpen: null,
  templateId: null,
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ACTIVE_TOURNAMENT = {
  ...UPCOMING_TOURNAMENT,
  id: 'tourn-lifecycle-002',
  status: 'active',
};

async function injectOrganizer(page: Page, tournament: any) {
  await page.addInitScript(({ user, tourn }) => {
    localStorage.setItem('db:users',                JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',      user.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([tourn]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',        JSON.stringify([]));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
  }, { user: ORGANIZER_USER, tourn: tournament });
}

test.setTimeout(120000);

test('organizer: can start an upcoming tournament', async ({ page }) => {
  await injectOrganizer(page, UPCOMING_TOURNAMENT);
  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${UPCOMING_TOURNAMENT.id}`);

  const screen = page.locator('[data-testid="tournament-dashboard-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Status should be Próximo
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Próximo');

  // Start button is present (tournament is upcoming)
  await expect(page.locator('[data-testid="btn-start-tournament"]')).toBeVisible();

  // Click Start
  await page.locator('[data-testid="btn-start-tournament"]').click();

  // Status should now be Activo
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Activo', { timeout: 5000 });

  // Start button disappears (no longer upcoming)
  await expect(page.locator('[data-testid="btn-start-tournament"]')).not.toBeVisible({ timeout: 3000 });
});

test('organizer: can end an active tournament', async ({ page }) => {
  await injectOrganizer(page, ACTIVE_TOURNAMENT);
  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${ACTIVE_TOURNAMENT.id}`);

  const screen = page.locator('[data-testid="tournament-dashboard-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Status should be Activo
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Activo');

  // End button is enabled
  const endBtn = page.locator('[data-testid="btn-end-tournament"]');
  await expect(endBtn).toBeVisible();
  await expect(endBtn).not.toBeDisabled();

  // Click End
  await endBtn.click();

  // Status should now be Cerrado
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Cerrado', { timeout: 5000 });
});

test('organizer: end button is disabled for an upcoming tournament', async ({ page }) => {
  await injectOrganizer(page, UPCOMING_TOURNAMENT);
  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${UPCOMING_TOURNAMENT.id}`);

  const screen = page.locator('[data-testid="tournament-dashboard-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Status is Próximo — end button must be disabled
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Próximo');
  const endBtn = page.locator('[data-testid="btn-end-tournament"]');
  await expect(endBtn).toBeVisible();
  await expect(endBtn).toBeDisabled();
});
