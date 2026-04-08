/**
 * e2e/create-admin-bracket-page.spec.ts
 *
 * Tests for BracketAdminScreen:
 * 1. Admin can view athletes grouped by category
 * 2. Up/down buttons reorder athletes within a category
 * 3. Save persists seed order to the DB
 * 4. TournamentBracketScreen applies saved seed order
 * 5. Athlete is redirected away (manage_tournaments required)
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-bracketadmin-test', email: 'admin.bracketadmin@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin SeedTest', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-bracketadmin-test', email: 'athlete.bracketadmin@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta SeedTest', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const TOURNAMENT = {
  id: 'tourn-seeding-001', name: 'Copa Seeding 2026',
  date: '2026-11-01', location: 'San José, CR',
  logo: '🎯', description: '',
  status: 'active', martialArtIds: [],
  registrationStart: null, registrationEnd: null, registrationForceOpen: null,
  templateId: null, createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// Kata category: Alice, Bob, Carol (order: Alice first, Bob second, Carol third)
const REGS = [
  {
    id: 'sr-01', userId: 'u1', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Alice Kata', academy: 'Dojo A', grade: '2° Kyu',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-10T00:00:00.000Z', synced: false,
  },
  {
    id: 'sr-02', userId: 'u2', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Bob Kata', academy: 'Dojo B', grade: '1° Dan',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-11T00:00:00.000Z', synced: false,
  },
  {
    id: 'sr-03', userId: 'u3', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Carol Kata', academy: 'Dojo C', grade: '3° Kyu',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-12T00:00:00.000Z', synced: false,
  },
];

const ADMIN_URL    = `/screens/BracketAdminScreen?tournamentId=${TOURNAMENT.id}`;
const BRACKET_URL  = `/screens/TournamentBracketScreen?tournamentId=${TOURNAMENT.id}`;
const CAT_TESTID   = 'seeding-category-kata-femenino-adulto';

async function injectAdmin(page: Page, regs: any[], bracketSeeds?: any) {
  await page.addInitScript(({ admin, tournament, regs, seeds }) => {
    localStorage.setItem('db:users',                JSON.stringify([admin]));
    localStorage.setItem('db:session_user_id',      admin.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([tournament]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',        JSON.stringify(regs));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
    if (seeds) localStorage.setItem('db:bracket_seeds', JSON.stringify(seeds));
  }, { admin: ADMIN_USER, tournament: TOURNAMENT, regs, seeds: bracketSeeds ?? null });
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

test('bracket-admin: shows athletes grouped by category', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(ADMIN_URL);

  const screen = page.locator('[data-testid="bracket-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const cat = page.locator(`[data-testid="${CAT_TESTID}"]`);
  await expect(cat).toBeVisible();
  await expect(cat).toContainText('Alice Kata');
  await expect(cat).toContainText('Bob Kata');
  await expect(cat).toContainText('Carol Kata');
});

test('bracket-admin: up/down buttons reorder athletes', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(ADMIN_URL);

  const screen = page.locator('[data-testid="bracket-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Initial order: Alice(0), Bob(1), Carol(2)
  const name0 = page.locator(`[data-testid="seed-name-${CAT_TESTID}-0"]`);
  await expect(name0).toContainText('Alice Kata');

  // Click "move down" on Alice → Bob should be first
  await page.locator(`[data-testid="btn-move-down-${CAT_TESTID}-0"]`).click();
  await expect(page.locator(`[data-testid="seed-name-${CAT_TESTID}-0"]`)).toContainText('Bob Kata');
  await expect(page.locator(`[data-testid="seed-name-${CAT_TESTID}-1"]`)).toContainText('Alice Kata');
});

test('bracket-admin: save persists seed order', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(ADMIN_URL);

  const screen = page.locator('[data-testid="bracket-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Move Bob up to first position: Bob(0), Alice(1), Carol(2)
  await page.locator(`[data-testid="btn-move-up-${CAT_TESTID}-1"]`).click();

  // Save
  await page.locator('[data-testid="btn-save-seeding"]').click();
  await expect(page.locator('[data-testid="saved-confirmation"]')).toBeVisible();

  // Verify localStorage was updated
  const seeds = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('db:bracket_seeds') ?? '[]')
  );
  const record = seeds.find((r: any) => r.tournamentId === 'tourn-seeding-001');
  expect(record).toBeTruthy();
  const catSeeds: string[] = record.seeds['Kata-Femenino-Adulto'];
  expect(catSeeds[0]).toBe('Bob Kata');
  expect(catSeeds[1]).toBe('Alice Kata');
});

test('bracket-admin: bracket view applies saved seed order', async ({ page }) => {
  // Pre-inject saved seeds: Carol first, Alice second, Bob third
  const preSavedSeeds = [
    { tournamentId: TOURNAMENT.id, seeds: { 'Kata-Femenino-Adulto': ['Carol Kata', 'Alice Kata', 'Bob Kata'] } },
  ];
  await injectAdmin(page, REGS, preSavedSeeds);
  await page.goto(BRACKET_URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // The bracket should render Carol first (seed 1 = top of first match)
  const catDiv = page.locator('[data-testid="bracket-category-kata-femenino-adulto"]');
  await expect(catDiv).toBeVisible();
  // Carol should appear before Alice in the SVG text content
  const text = await catDiv.textContent();
  expect(text).toBeTruthy();
  const carolIdx = text!.indexOf('Carol Kata');
  const aliceIdx = text!.indexOf('Alice Kata');
  expect(carolIdx).toBeGreaterThanOrEqual(0);
  expect(aliceIdx).toBeGreaterThanOrEqual(0);
  expect(carolIdx).toBeLessThan(aliceIdx);
});

test('bracket-admin: empty state when no registrations', async ({ page }) => {
  await injectAdmin(page, []);
  await page.goto(ADMIN_URL);

  const screen = page.locator('[data-testid="bracket-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  await expect(page.locator('[data-testid="bracket-admin-empty"]')).toBeVisible();
});

test('bracket-admin: athlete is redirected away', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(ADMIN_URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
