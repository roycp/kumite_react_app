/**
 * e2e/tournament-status-display.spec.ts
 *
 * Verifies all tournament statuses display correctly in:
 * 1. TournamentDashboardScreen — status badge + management buttons
 * 2. TournamentSearch — status badge on tiles
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(120000);

const ADMIN_USER = {
  id: 'admin-status-1',
  email: 'statusadmin@test.example.com',
  passwordHash: 'abc123',
  role: 'admin',
  fullName: 'Status Admin',
  country: 'CR',
  age: '35',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const REGULAR_USER = {
  id: 'user-status-1',
  email: 'statususer@test.example.com',
  passwordHash: 'abc123',
  role: 'athlete',
  fullName: 'Status User',
  country: 'CR',
  age: '22',
  gender: 'Femenino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const STATUSES = [
  { value: 'created',              label: 'Creado' },
  { value: 'registration_open',    label: 'Inscripciones Abiertas' },
  { value: 'registration_closed',  label: 'Inscripciones Cerradas' },
  { value: 'weigh_in_open',        label: 'Pesaje Abierto' },
  { value: 'weigh_in_closed',      label: 'Pesaje Cerrado' },
  { value: 'tournament_start',     label: 'En Curso' },
  { value: 'tournament_finish',    label: 'Finalizado' },
  { value: 'cancelled',            label: 'Cancelado' },
];

async function injectAdmin(page: Page, tournaments: object[]) {
  await page.addInitScript(({ user, tournaments: ts }) => {
    localStorage.setItem('db:users',                JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',      user.id);
    localStorage.setItem('db:tournaments',          JSON.stringify(ts));
    localStorage.setItem('db:registrations',        JSON.stringify([]));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
    localStorage.setItem('db:templates',            JSON.stringify([]));
    localStorage.setItem('db:roles',                JSON.stringify([]));
  }, { user: ADMIN_USER, tournaments });
}

async function injectUser(page: Page, tournaments: object[]) {
  await page.addInitScript(({ user, tournaments: ts }) => {
    localStorage.setItem('db:users',                JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',      user.id);
    localStorage.setItem('db:tournaments',          JSON.stringify(ts));
    localStorage.setItem('db:registrations',        JSON.stringify([]));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
    localStorage.setItem('db:templates',            JSON.stringify([]));
    localStorage.setItem('db:roles',                JSON.stringify([]));
  }, { user: REGULAR_USER, tournaments });
}

function makeTournament(id: string, name: string, status: string) {
  return {
    id,
    name,
    logo: '🏆',
    date: '2025-08-01',
    location: 'Test City',
    description: '',
    status,
    martialArtIds: [],
    registrationStart: null,
    registrationEnd: null,
    registrationForceOpen: null,
    templateId: null,
  };
}

test('dashboard shows all 8 lifecycle status buttons', async ({ page }) => {
  const tournament = makeTournament('tourn-lifecycle-1', 'Lifecycle Test', 'created');

  await injectAdmin(page, [tournament]);
  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=tourn-lifecycle-1`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  for (const { value, label } of STATUSES) {
    const btn = page.locator(`[data-testid="btn-status-${value}"]`);
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText(label);
  }
});

test('dashboard status badge updates when a lifecycle button is clicked', async ({ page }) => {
  const tournament = makeTournament('tourn-lifecycle-2', 'Status Click Test', 'created');

  await injectAdmin(page, [tournament]);
  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=tourn-lifecycle-2`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  // Initially 'created'
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Creado');

  // Click registration_open
  await page.click('[data-testid="btn-status-registration_open"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Inscripciones Abiertas');

  // Click tournament_start
  await page.click('[data-testid="btn-status-tournament_start"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('En Curso');

  // Click tournament_finish
  await page.click('[data-testid="btn-status-tournament_finish"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Finalizado');
});

test('tournament search tiles show status badge for all 8 statuses', async ({ page }) => {
  const tournaments = STATUSES.map(({ value }, i) =>
    makeTournament(`tourn-search-${i}`, `Torneo ${value}`, value)
  );

  await injectUser(page, tournaments);
  await page.goto('/screens/TournamentSearch');
  await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 30000 });

  for (let i = 0; i < STATUSES.length; i++) {
    const { label } = STATUSES[i];
    const badge = page.locator(`[data-testid="tournament-status-badge-tourn-search-${i}"]`);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(label);
  }
});

test('legacy statuses (upcoming, active, closed) display correctly in search', async ({ page }) => {
  const legacyTournaments = [
    makeTournament('leg-1', 'Upcoming T', 'upcoming'),
    makeTournament('leg-2', 'Active T',   'active'),
    makeTournament('leg-3', 'Closed T',   'closed'),
  ];

  await injectUser(page, legacyTournaments);
  await page.goto('/screens/TournamentSearch');
  await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 30000 });

  await expect(page.locator('[data-testid="tournament-status-badge-leg-1"]')).toHaveText('Próximo');
  await expect(page.locator('[data-testid="tournament-status-badge-leg-2"]')).toHaveText('Activo');
  await expect(page.locator('[data-testid="tournament-status-badge-leg-3"]')).toHaveText('Cerrado');
});
