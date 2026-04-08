/**
 * e2e/tournament-dashboard.spec.ts
 *
 * Tests for TournamentDashboardScreen:
 *   1. Shows tournament info (date, location, status)
 *   2. Shows assigned template name
 *   3. Shows registrations grouped by discipline
 *   4. Admin can change tournament status
 *   5. Athlete is redirected away
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-dash-test', email: 'admin.dash@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Dashboard', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-dash-test', email: 'athlete.dash@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta Dashboard', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const TEMPLATE = {
  id: 'tpl-dash-001', name: 'Plantilla Karate',
  description: '', modalities: ['Kata', 'Kumite'],
  weightClasses: [], categories: [],
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const TOURNAMENT = {
  id: 'tourn-dash-001', name: 'Copa Dashboard 2026',
  date: '2026-09-01', location: 'San José, CR',
  logo: '🏆', description: '',
  status: 'upcoming', martialArtIds: [],
  registrationStart: null, registrationEnd: null, registrationForceOpen: null,
  templateId: TEMPLATE.id,
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const REG_KATA = {
  id: 'reg-kata-001', userId: 'user-a', tournamentId: TOURNAMENT.id,
  tournamentName: TOURNAMENT.name, athleteName: 'Carlos Kata', academy: 'Dojo A', grade: '3° Kyu',
  modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
  timestamp: '2026-01-10T00:00:00.000Z', synced: false,
};

const REG_KUMITE = {
  id: 'reg-kumite-001', userId: 'user-b', tournamentId: TOURNAMENT.id,
  tournamentName: TOURNAMENT.name, athleteName: 'Ana Kumite', academy: 'Dojo B', grade: '2° Kyu',
  modalities: [{ discipline: 'Kumite', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
  timestamp: '2026-01-11T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ admin, tournament, template, regs }) => {
    localStorage.setItem('db:users',               JSON.stringify([admin]));
    localStorage.setItem('db:session_user_id',     admin.id);
    localStorage.setItem('db:tournaments',         JSON.stringify([tournament]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([template]));
    localStorage.setItem('db:registrations',       JSON.stringify(regs));
    localStorage.setItem('db:martial_arts',        JSON.stringify([]));
  }, { admin: ADMIN_USER, tournament: TOURNAMENT, template: TEMPLATE, regs: [REG_KATA, REG_KUMITE] });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user, tournament }) => {
    localStorage.setItem('db:users',               JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',     user.id);
    localStorage.setItem('db:tournaments',         JSON.stringify([tournament]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',       JSON.stringify([]));
    localStorage.setItem('db:martial_arts',        JSON.stringify([]));
  }, { user: ATHLETE_USER, tournament: TOURNAMENT });
}

const URL = `/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT.id}`;

test.setTimeout(120000);

test('admin: dashboard shows tournament info, template, and registrations by discipline', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-dashboard-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Tournament info
  await expect(page.locator('[data-testid="dash-date"]')).toContainText('2026-09-01');
  await expect(page.locator('[data-testid="dash-location"]')).toContainText('San José, CR');
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Próximo');

  // Template shown
  await expect(page.locator('[data-testid="dash-template"]')).toContainText('Plantilla Karate');

  // Registrations grouped by discipline
  await expect(page.locator('[data-testid="registrations-by-discipline"]')).toBeVisible();
  await expect(page.locator('[data-testid="discipline-section-kata"]')).toContainText('Carlos Kata');
  await expect(page.locator('[data-testid="discipline-section-kumite"]')).toContainText('Ana Kumite');
});

test('admin: can change tournament status', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-dashboard-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Status is currently Próximo
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Próximo');

  // Click "Activo"
  await page.locator('[data-testid="btn-status-active"]').click();
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Activo', { timeout: 5000 });

  // Click "Cerrado"
  await page.locator('[data-testid="btn-status-closed"]').click();
  await expect(page.locator('[data-testid="dash-status"]')).toContainText('Cerrado', { timeout: 5000 });
});

test('athlete: redirected away from TournamentDashboardScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
