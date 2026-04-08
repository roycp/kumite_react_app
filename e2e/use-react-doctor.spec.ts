/**
 * e2e/use-react-doctor.spec.ts
 *
 * Verifies that key screens render without React console errors.
 * Serves as a runtime sanity check after the React Doctor / ESLint audit.
 *
 * Screens tested:
 *   1. HomeScreen (unauthenticated landing)
 *   2. TournamentBracketScreen (admin, with registrations)
 *   3. BracketAdminScreen (admin, with registrations)
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-reactdoctor-test', email: 'admin.rd@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin RD', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const TOURNAMENT = {
  id: 'tourn-rd-001', name: 'Copa RD 2026',
  date: '2026-11-01', location: 'San José, CR',
  logo: '🎯', description: '',
  status: 'active', martialArtIds: [],
  registrationStart: null, registrationEnd: null, registrationForceOpen: null,
  templateId: null, createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const REGS = [
  {
    id: 'rd-01', userId: 'u1', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Alice RD', academy: 'Dojo A', grade: '2° Kyu',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-10T00:00:00.000Z', synced: false,
  },
  {
    id: 'rd-02', userId: 'u2', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Bob RD', academy: 'Dojo B', grade: '1° Dan',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-11T00:00:00.000Z', synced: false,
  },
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function injectAdmin(page: Page) {
  await page.addInitScript(({ admin, tournament, regs }) => {
    localStorage.setItem('db:users',                JSON.stringify([admin]));
    localStorage.setItem('db:session_user_id',      admin.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([tournament]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',        JSON.stringify(regs));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
  }, { admin: ADMIN_USER, tournament: TOURNAMENT, regs: REGS });
}

test.setTimeout(120000);

test('react-doctor: HomeScreen renders without React errors', async ({ page }) => {
  const errors = await collectConsoleErrors(page);
  await page.goto('/screens/HomeScreen');
  await page.locator('[data-testid="home-screen"]').last().waitFor({ state: 'visible', timeout: 20000 });

  const reactErrors = errors.filter(e =>
    e.includes('Warning:') || e.includes('react') || e.includes('React') || e.includes('Uncaught')
  );
  expect(reactErrors).toEqual([]);
});

test('react-doctor: TournamentBracketScreen renders without React errors', async ({ page }) => {
  const errors = await collectConsoleErrors(page);
  await injectAdmin(page);
  await page.goto(`/screens/TournamentBracketScreen?tournamentId=${TOURNAMENT.id}`);
  await page.locator('[data-testid="tournament-bracket-screen"]').last().waitFor({ state: 'visible', timeout: 20000 });

  const reactErrors = errors.filter(e =>
    (e.includes('Warning:') || e.includes('Uncaught')) && !e.includes('styled')
  );
  expect(reactErrors).toEqual([]);
});

test('react-doctor: BracketAdminScreen renders without React errors', async ({ page }) => {
  const errors = await collectConsoleErrors(page);
  await injectAdmin(page);
  await page.goto(`/screens/BracketAdminScreen?tournamentId=${TOURNAMENT.id}`);
  await page.locator('[data-testid="bracket-admin-screen"]').last().waitFor({ state: 'visible', timeout: 20000 });

  const reactErrors = errors.filter(e =>
    (e.includes('Warning:') || e.includes('Uncaught')) && !e.includes('styled')
  );
  expect(reactErrors).toEqual([]);
});
