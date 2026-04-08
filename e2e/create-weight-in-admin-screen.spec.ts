/**
 * e2e/create-weight-in-admin-screen.spec.ts
 *
 * Tests the WeighInAdminScreen:
 * 1. Only accessible when tournament status is 'weigh_in_open'
 * 2. Search athletes by name/org/discipline
 * 3. Record weigh-in result (meets/lost weight)
 * 4. Results are final (no re-record button after save)
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(120000);

const ADMIN_USER = {
  id: 'admin-wi-1',
  email: 'weighin@test.example.com',
  passwordHash: 'abc123',
  role: 'admin',
  fullName: 'Weigh-In Admin',
  country: 'CR',
  age: '35',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const ATHLETE_1 = {
  id: 'ath-wi-1',
  email: 'ath1wi@test.example.com',
  passwordHash: 'abc123',
  role: 'athlete',
  fullName: 'Carlos Kumite',
  country: 'Japan',
  age: '22',
  gender: 'Masculino',
  academy: '',
  weight: '68',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const ATHLETE_2 = {
  id: 'ath-wi-2',
  email: 'ath2wi@test.example.com',
  passwordHash: 'abc123',
  role: 'athlete',
  fullName: 'Ana Pesaje',
  country: 'Brazil',
  age: '20',
  gender: 'Femenino',
  academy: 'Dojo Santos',
  weight: '55',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

function makeTournament(status: string) {
  return {
    id: 'tourn-wi-1',
    name: 'Weigh-In Tournament',
    logo: '⚖️',
    date: '2025-10-01',
    location: 'Test Arena',
    description: '',
    status,
    martialArtIds: [],
    registrationStart: null,
    registrationEnd: null,
    registrationForceOpen: null,
    templateId: null,
  };
}

function makeReg(id: string, userId: string, name: string, discipline: string, weightDivision: string) {
  return {
    id,
    userId,
    tournamentId: 'tourn-wi-1',
    tournamentName: 'Weigh-In Tournament',
    athleteName: name,
    academy: userId === ATHLETE_2.id ? 'Dojo Santos' : '',
    grade: '',
    modalities: [{ discipline, gender: 'General', ageGroup: 'Adulto', weightDivision }],
    timestamp: '2026-01-01T00:00:00.000Z',
    synced: false,
  };
}

async function inject(page: Page, status: string, existingResults: object[] = []) {
  const tournament = makeTournament(status);
  const regs = [
    makeReg('reg-wi-1', ATHLETE_1.id, 'Carlos Kumite', 'Kumite', '60–70 kg'),
    makeReg('reg-wi-2', ATHLETE_2.id, 'Ana Pesaje',    'Kumite', 'Sub-60 kg'),
  ];

  await page.addInitScript(({ admin, ath1, ath2, tournament: t, regs: rs, results }) => {
    localStorage.setItem('db:users',            JSON.stringify([admin, ath1, ath2]));
    localStorage.setItem('db:session_user_id',  admin.id);
    localStorage.setItem('db:tournaments',      JSON.stringify([t]));
    localStorage.setItem('db:registrations',    JSON.stringify(rs));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
    localStorage.setItem('db:templates',        JSON.stringify([]));
    localStorage.setItem('db:roles',            JSON.stringify([]));
    if (results.length > 0) {
      localStorage.setItem('db:weigh_in_results', JSON.stringify(results));
    }
  }, { admin: ADMIN_USER, ath1: ATHLETE_1, ath2: ATHLETE_2, tournament, regs, results: existingResults });
}

test('weigh-in screen is locked when status is not weigh_in_open', async ({ page }) => {
  await inject(page, 'registration_open');
  await page.goto('/screens/WeighInAdminScreen?tournamentId=tourn-wi-1');
  await page.waitForSelector('[data-testid="weigh-in-screen"]', { timeout: 30000 });

  await expect(page.locator('[data-testid="weigh-in-locked"]')).toBeVisible();
  await expect(page.locator('[data-testid="weigh-in-list"]')).toHaveCount(0);
});

test('weigh-in screen shows athletes when status is weigh_in_open', async ({ page }) => {
  await inject(page, 'weigh_in_open');
  await page.goto('/screens/WeighInAdminScreen?tournamentId=tourn-wi-1');
  await page.waitForSelector('[data-testid="weigh-in-screen"]', { timeout: 30000 });

  await expect(page.locator('[data-testid="weigh-in-list"]')).toBeVisible();

  const rows = page.locator('[data-testid^="weigh-in-row-"]');
  await expect(rows).toHaveCount(2);
});

test('weigh-in search filters athletes by name', async ({ page }) => {
  await inject(page, 'weigh_in_open');
  await page.goto('/screens/WeighInAdminScreen?tournamentId=tourn-wi-1');
  await page.waitForSelector('[data-testid="weigh-in-list"]', { timeout: 30000 });

  await page.fill('[data-testid="weigh-in-search"]', 'Carlos');

  const rows = page.locator('[data-testid^="weigh-in-row-"]');
  await expect(rows).toHaveCount(1);

  await expect(page.locator('[data-testid="participant-name"]').first()).toHaveText('Carlos Kumite');
});

test('admin can record meets-weight result', async ({ page }) => {
  await inject(page, 'weigh_in_open');
  await page.goto('/screens/WeighInAdminScreen?tournamentId=tourn-wi-1');
  await page.waitForSelector('[data-testid="weigh-in-list"]', { timeout: 30000 });

  // Click "Registrar Peso" for Carlos (reg-wi-1 / Kumite / 60–70 kg)
  await page.click('[data-testid="btn-record-reg-wi-1-Kumite"]');
  await page.waitForSelector('[data-testid="weigh-in-modal"]', { timeout: 10000 });

  // Check modal shows weight division
  await expect(page.locator('[data-testid="modal-weight-division"]')).toHaveText('60–70 kg');

  // Enter 68kg (within 60-70 range → meets weight)
  await page.fill('[data-testid="modal-actual-weight"]', '68');
  await page.click('[data-testid="btn-confirm-weight"]');

  // Modal closes
  await expect(page.locator('[data-testid="weigh-in-modal"]')).toHaveCount(0);

  // Row now shows result badge
  const result = page.locator('[data-testid="weigh-in-result-reg-wi-1-Kumite"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Pesa');
  await expect(result).toContainText('68');
});

test('admin can record lost-weight result and entry is final', async ({ page }) => {
  await inject(page, 'weigh_in_open');
  await page.goto('/screens/WeighInAdminScreen?tournamentId=tourn-wi-1');
  await page.waitForSelector('[data-testid="weigh-in-list"]', { timeout: 30000 });

  // Record lost-weight for Ana (Sub-60 kg, enter 62 kg → over limit)
  await page.click('[data-testid="btn-record-reg-wi-2-Kumite"]');
  await page.waitForSelector('[data-testid="weigh-in-modal"]', { timeout: 10000 });

  await page.fill('[data-testid="modal-actual-weight"]', '62');
  await page.click('[data-testid="btn-confirm-weight"]');

  const result = page.locator('[data-testid="weigh-in-result-reg-wi-2-Kumite"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('No pesa');

  // No record button — entry is final
  await expect(page.locator('[data-testid="btn-record-reg-wi-2-Kumite"]')).toHaveCount(0);
});
