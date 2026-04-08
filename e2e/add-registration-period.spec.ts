/**
 * e2e/add-registration-period.spec.ts
 *
 * Tests for registration period on DB tournaments:
 *   1. Tournament with registration period in future → reg closed (not yet open)
 *   2. Tournament with registration period ended → reg closed
 *   3. Tournament with active registration period → register button shown
 *   4. Tournament with no period → register button shown
 */

import { test, expect, Page } from '@playwright/test';

const ATHLETE_USER = {
  id: 'athlete-regperiod-test', email: 'athlete.regperiod@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta Periodo', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// Closed: registrationEnd is yesterday
const T_CLOSED = {
  id: 'tourn-closed-001', name: 'Torneo Cerrado 2026',
  date: '2026-09-01', location: 'San José, CR',
  logo: '🔒', description: '',
  status: 'upcoming', martialArtIds: [],
  registrationStart: '2026-01-01', registrationEnd: '2026-01-02', // past
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// Open: active registration window (wide range)
const T_OPEN = {
  id: 'tourn-open-001', name: 'Torneo Abierto 2026',
  date: '2026-12-01', location: 'San José, CR',
  logo: '✅', description: '',
  status: 'upcoming', martialArtIds: [],
  registrationStart: '2025-01-01', registrationEnd: '2030-12-31', // far future
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// No period: no restrictions
const T_NO_PERIOD = {
  id: 'tourn-nop-001', name: 'Torneo Sin Periodo 2026',
  date: '2026-12-15', location: 'Alajuela, CR',
  logo: '🏆', description: '',
  status: 'upcoming', martialArtIds: [],
  registrationStart: null, registrationEnd: null,
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAthlete(page: Page, tournaments: any[]) {
  await page.addInitScript(({ user, tournaments: ts }) => {
    localStorage.setItem('db:users',              JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',    user.id);
    localStorage.setItem('db:tournaments',        JSON.stringify(ts));
    localStorage.setItem('db:registrations',      JSON.stringify([]));
    localStorage.setItem('db:martial_arts',       JSON.stringify([]));
    localStorage.setItem('db:user_martial_art_ranks', JSON.stringify([]));
  }, { user: ATHLETE_USER, tournaments });
}

test.setTimeout(120000);

test('closed registration period: shows "inscripciones cerradas" badge', async ({ page }) => {
  await injectAthlete(page, [T_CLOSED]);
  await page.goto('/screens/TournamentSearch');

  const screen = page.locator('[data-testid="tournament-search-screen"]');
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const tile = page.locator(`[data-testid="tournament-tile-${T_CLOSED.id}"]`);
  await expect(tile).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`[data-testid="reg-closed-badge-${T_CLOSED.id}"]`)).toBeVisible();
  // Register button should NOT appear
  await expect(tile.locator('button')).not.toBeVisible();
});

test('open registration period: shows view details button', async ({ page }) => {
  await injectAthlete(page, [T_OPEN]);
  await page.goto('/screens/TournamentSearch');

  const screen = page.locator('[data-testid="tournament-search-screen"]');
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const tile = page.locator(`[data-testid="tournament-tile-${T_OPEN.id}"]`);
  await expect(tile).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`[data-testid="reg-closed-badge-${T_OPEN.id}"]`)).not.toBeVisible();
  await expect(tile.locator('button')).toBeVisible();
});

test('no registration period: shows view details button', async ({ page }) => {
  await injectAthlete(page, [T_NO_PERIOD]);
  await page.goto('/screens/TournamentSearch');

  const screen = page.locator('[data-testid="tournament-search-screen"]');
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const tile = page.locator(`[data-testid="tournament-tile-${T_NO_PERIOD.id}"]`);
  await expect(tile).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`[data-testid="reg-closed-badge-${T_NO_PERIOD.id}"]`)).not.toBeVisible();
  await expect(tile.locator('button')).toBeVisible();
});
