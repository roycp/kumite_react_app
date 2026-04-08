/**
 * e2e/generate-tournament-bracket-view.spec.ts
 *
 * Tests for TournamentBracketScreen:
 *   1. Bracket shows categories with participants (even count — no BYE)
 *   2. Bracket shows BYE for odd participant count
 *   3. Empty state when no registrations
 *   4. Athlete redirected away (manage_tournaments required)
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-bracket-test', email: 'admin.bracket@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Bracket', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-bracket-test', email: 'athlete.bracket@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta Bracket', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const TOURNAMENT = {
  id: 'tourn-bracket-001', name: 'Copa Bracket 2026',
  date: '2026-11-01', location: 'San José, CR',
  logo: '🥋', description: '',
  status: 'active', martialArtIds: [],
  registrationStart: null, registrationEnd: null, registrationForceOpen: null,
  templateId: null, createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// 2 participants in Kata-Masculino-Adulto → no BYE
// 3 participants in Kumite-Masculino-Adulto → 1 BYE
const REGS = [
  {
    id: 'reg-b-01', userId: 'u1', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Carlos Kata', academy: 'Dojo A', grade: '3° Kyu',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-10T00:00:00.000Z', synced: false,
  },
  {
    id: 'reg-b-02', userId: 'u2', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Ana Kata', academy: 'Dojo B', grade: '2° Kyu',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-11T00:00:00.000Z', synced: false,
  },
  {
    id: 'reg-b-03', userId: 'u3', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Luis Kumite', academy: 'Dojo C', grade: '1° Kyu',
    modalities: [{ discipline: 'Kumite', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-12T00:00:00.000Z', synced: false,
  },
  {
    id: 'reg-b-04', userId: 'u4', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'María Kumite', academy: 'Dojo D', grade: '3° Kyu',
    modalities: [{ discipline: 'Kumite', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-13T00:00:00.000Z', synced: false,
  },
  {
    id: 'reg-b-05', userId: 'u5', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Pedro Kumite', academy: 'Dojo E', grade: '2° Dan',
    modalities: [{ discipline: 'Kumite', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-14T00:00:00.000Z', synced: false,
  },
];

const URL = `/screens/TournamentBracketScreen?tournamentId=${TOURNAMENT.id}`;

async function injectAdmin(page: Page, regs: any[]) {
  await page.addInitScript(({ admin, tournament, regs }) => {
    localStorage.setItem('db:users',                JSON.stringify([admin]));
    localStorage.setItem('db:session_user_id',      admin.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([tournament]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',        JSON.stringify(regs));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
  }, { admin: ADMIN_USER, tournament: TOURNAMENT, regs });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user, tournament }) => {
    localStorage.setItem('db:users',                JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',      user.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([tournament]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',        JSON.stringify([]));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
  }, { user: ATHLETE_USER, tournament: TOURNAMENT });
}

test.setTimeout(120000);

test('bracket: shows categories with participants', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Kata category is present
  const kataCat = page.locator('[data-testid="bracket-category-kata-masculino-adulto"]');
  await expect(kataCat).toBeVisible();
  await expect(kataCat).toContainText('Carlos Kata');
  await expect(kataCat).toContainText('Ana Kata');

  // Kumite category is present
  const kumiteCat = page.locator('[data-testid="bracket-category-kumite-masculino-adulto"]');
  await expect(kumiteCat).toBeVisible();
  await expect(kumiteCat).toContainText('Luis Kumite');
});

test('bracket: shows BYE for odd participant count', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Kumite has 3 participants → bracket needs BYE
  const kumiteCat = page.locator('[data-testid="bracket-category-kumite-masculino-adulto"]');
  await expect(kumiteCat).toContainText('BYE');
});

test('bracket: shows empty state when no registrations', async ({ page }) => {
  await injectAdmin(page, []);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  await expect(page.locator('[data-testid="bracket-empty"]')).toBeVisible();
});

test('athlete: redirected away from TournamentBracketScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
