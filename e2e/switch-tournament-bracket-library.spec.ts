/**
 * e2e/switch-tournament-bracket-library.spec.ts
 *
 * Verifies that the @g-loot/react-tournament-brackets library is fully integrated:
 * 1. Bracket renders participant names via the new library's SVG output
 * 2. BYE is shown for categories with an odd participant count
 * 3. Multiple categories each render their own bracket
 * 4. Single-participant category still renders (padded to 2 with BYE)
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-gloot-test', email: 'admin.gloot@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin GLoot', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const TOURNAMENT = {
  id: 'tourn-gloot-001', name: 'Copa GLoot 2026',
  date: '2026-11-01', location: 'San José, CR',
  logo: '🥋', description: '',
  status: 'active', martialArtIds: [],
  registrationStart: null, registrationEnd: null, registrationForceOpen: null,
  templateId: null, createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// Kata: 2 participants (no BYE), Kobudo: 3 participants (1 BYE), Bojutsu: 1 participant (1 BYE)
const REGS = [
  {
    id: 'gr-01', userId: 'u1', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Alice Kata', academy: 'Dojo A', grade: '2° Kyu',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-10T00:00:00.000Z', synced: false,
  },
  {
    id: 'gr-02', userId: 'u2', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Bob Kata', academy: 'Dojo B', grade: '1° Dan',
    modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-11T00:00:00.000Z', synced: false,
  },
  {
    id: 'gr-03', userId: 'u3', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Carol Kobudo', academy: 'Dojo C', grade: '3° Kyu',
    modalities: [{ discipline: 'Kobudo', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-12T00:00:00.000Z', synced: false,
  },
  {
    id: 'gr-04', userId: 'u4', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Dave Kobudo', academy: 'Dojo D', grade: '2° Kyu',
    modalities: [{ discipline: 'Kobudo', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-13T00:00:00.000Z', synced: false,
  },
  {
    id: 'gr-05', userId: 'u5', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Eve Kobudo', academy: 'Dojo E', grade: '1° Kyu',
    modalities: [{ discipline: 'Kobudo', weightDivision: null, gender: 'Femenino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-14T00:00:00.000Z', synced: false,
  },
  {
    id: 'gr-06', userId: 'u6', tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name, athleteName: 'Frank Bojutsu', academy: 'Dojo F', grade: '3° Dan',
    modalities: [{ discipline: 'Bojutsu', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
    timestamp: '2026-01-15T00:00:00.000Z', synced: false,
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

test.setTimeout(120000);

test('gloot: renders participant names in bracket SVG', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const kataCat = page.locator('[data-testid="bracket-category-kata-femenino-adulto"]');
  await expect(kataCat).toBeVisible();
  await expect(kataCat).toContainText('Alice Kata');
  await expect(kataCat).toContainText('Bob Kata');

  // g-loot renders brackets as SVG — verify SVG elements exist inside a category
  const svg = kataCat.locator('svg').first();
  await expect(svg).toBeVisible();
});

test('gloot: shows BYE for odd participant count (3 → padded to 4)', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const kobudo = page.locator('[data-testid="bracket-category-kobudo-femenino-adulto"]');
  await expect(kobudo).toBeVisible();
  await expect(kobudo).toContainText('Carol Kobudo');
  await expect(kobudo).toContainText('BYE');
});

test('gloot: shows BYE for single participant (1 → padded to 2)', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  const bojutsu = page.locator('[data-testid="bracket-category-bojutsu-masculino-adulto"]');
  await expect(bojutsu).toBeVisible();
  await expect(bojutsu).toContainText('Frank Bojutsu');
  await expect(bojutsu).toContainText('BYE');
});

test('gloot: multiple categories each get their own bracket', async ({ page }) => {
  await injectAdmin(page, REGS);
  await page.goto(URL);

  const screen = page.locator('[data-testid="tournament-bracket-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // All three categories are rendered
  await expect(page.locator('[data-testid="bracket-category-kata-femenino-adulto"]')).toBeVisible();
  await expect(page.locator('[data-testid="bracket-category-kobudo-femenino-adulto"]')).toBeVisible();
  await expect(page.locator('[data-testid="bracket-category-bojutsu-masculino-adulto"]')).toBeVisible();

  // Each category contains its own SVG bracket
  const allSvgs = page.locator('[data-testid^="bracket-category-"] svg');
  const svgCount = await allSvgs.count();
  expect(svgCount).toBeGreaterThanOrEqual(3);
});
