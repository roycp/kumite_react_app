/**
 * e2e/create-bracket-view-component.spec.ts
 *
 * Tests the BracketParticipantCard component integration in:
 * 1. BracketAdminScreen — card shows name, org acronym, country flag per seeding row
 * 2. TournamentBracketScreen — participant roster per category uses the card
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(120000);

const ADMIN_USER = {
  id: 'admin-bracket-card-1',
  email: 'bracketcard@test.example.com',
  passwordHash: 'abc123',
  role: 'admin',
  fullName: 'Bracket Card Admin',
  country: 'Japan',
  age: '35',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const ATHLETE_USER_1 = {
  id: 'ath-card-1',
  email: 'ath1card@test.example.com',
  passwordHash: 'abc123',
  role: 'athlete',
  fullName: 'Kenji Yamada',
  country: 'Japan',
  age: '24',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const ATHLETE_USER_2 = {
  id: 'ath-card-2',
  email: 'ath2card@test.example.com',
  passwordHash: 'abc123',
  role: 'athlete',
  fullName: 'Maria Santos',
  country: 'Brazil',
  age: '22',
  gender: 'Femenino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const TOURNAMENT = {
  id: 'tourn-bracket-card-1',
  name: 'Card Test Tournament',
  logo: '🥋',
  date: '2025-08-01',
  location: 'Tokyo',
  description: '',
  status: 'tournament_start',
  martialArtIds: [],
  registrationStart: null,
  registrationEnd: null,
  registrationForceOpen: null,
  templateId: null,
};

function makeReg(id: string, userId: string, name: string, academy: string) {
  return {
    id,
    userId,
    tournamentId: TOURNAMENT.id,
    tournamentName: TOURNAMENT.name,
    athleteName: name,
    academy,
    grade: '',
    modalities: [{ discipline: 'Kata', gender: 'General', ageGroup: 'Adulto', weightDivision: null }],
    timestamp: '2026-01-01T00:00:00.000Z',
    synced: false,
  };
}

async function inject(page: Page) {
  const regs = [
    makeReg('reg-card-1', ATHLETE_USER_1.id, 'Kenji Yamada',  'Dojo Ryu Kai'),
    makeReg('reg-card-2', ATHLETE_USER_2.id, 'Maria Santos',  'Santos Academy'),
  ];

  await page.addInitScript(({ admin, ath1, ath2, tournament, regs: rs }) => {
    localStorage.setItem('db:users',                JSON.stringify([admin, ath1, ath2]));
    localStorage.setItem('db:session_user_id',      admin.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([tournament]));
    localStorage.setItem('db:registrations',        JSON.stringify(rs));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
    localStorage.setItem('db:templates',            JSON.stringify([]));
    localStorage.setItem('db:roles',                JSON.stringify([]));
  }, { admin: ADMIN_USER, ath1: ATHLETE_USER_1, ath2: ATHLETE_USER_2, tournament: TOURNAMENT, regs });
}

test('BracketAdminScreen shows participant names in BracketParticipantCard', async ({ page }) => {
  await inject(page);
  await page.goto(`/screens/BracketAdminScreen?tournamentId=${TOURNAMENT.id}`);
  await page.waitForSelector('[data-testid="bracket-admin-screen"]', { timeout: 30000 });

  // Names should be visible via the card's participant-name element
  const names = page.locator('[data-testid="participant-name"]');
  const count = await names.count();
  expect(count).toBeGreaterThanOrEqual(2);

  const nameTexts = await names.allTextContents();
  expect(nameTexts).toContain('Kenji Yamada');
  expect(nameTexts).toContain('Maria Santos');
});

test('BracketAdminScreen card shows organization acronym', async ({ page }) => {
  await inject(page);
  await page.goto(`/screens/BracketAdminScreen?tournamentId=${TOURNAMENT.id}`);
  await page.waitForSelector('[data-testid="bracket-admin-screen"]', { timeout: 30000 });

  const orgLabels = page.locator('[data-testid="participant-org"]');
  const orgTexts = await orgLabels.allTextContents();

  // "Dojo Ryu Kai" → "DRK", "Santos Academy" → "SA"
  expect(orgTexts).toContain('DRK');
  expect(orgTexts).toContain('SA');
});

test('BracketAdminScreen card shows country flag', async ({ page }) => {
  await inject(page);
  await page.goto(`/screens/BracketAdminScreen?tournamentId=${TOURNAMENT.id}`);
  await page.waitForSelector('[data-testid="bracket-admin-screen"]', { timeout: 30000 });

  const flags = page.locator('[data-testid="participant-flag"]');
  const count = await flags.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

test('TournamentBracketScreen shows participant roster with cards', async ({ page }) => {
  await inject(page);
  await page.goto(`/screens/TournamentBracketScreen?tournamentId=${TOURNAMENT.id}`);
  await page.waitForSelector('[data-testid="tournament-bracket-screen"]', { timeout: 30000 });

  // Should have a participant roster
  const roster = page.locator('[data-testid^="participant-roster-"]').first();
  await expect(roster).toBeVisible();

  // Should have bracket participant cards in the roster
  const cards = page.locator('[data-testid="bracket-participant-card"]');
  await expect(cards.first()).toBeVisible();

  const nameTexts = await page.locator('[data-testid="participant-name"]').allTextContents();
  expect(nameTexts).toContain('Kenji Yamada');
  expect(nameTexts).toContain('Maria Santos');
});
