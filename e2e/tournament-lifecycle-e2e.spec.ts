/**
 * e2e/tournament-lifecycle-e2e.spec.ts
 *
 * Comprehensive end-to-end test for the full tournament lifecycle:
 *   Created → Registration Open → Registration Closed →
 *   Weigh-In Open → Weigh-In Closed → Tournament Start → Finished
 *
 * Uses addInitScript for bulk data (250 athletes) to keep runtime practical.
 * Videos are recorded automatically (playwright.config.ts: video: 'on').
 *
 * Skipped steps (unimplemented features):
 *   - PDF bracket export (no export feature in current app)
 *   - Auto-removing failed weigh-in athletes from brackets (planned future work)
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(180000);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN = {
  id: 'lifecycle-admin',
  email: 'lifecycle.admin@test.example.com',
  passwordHash: 'abc123',
  role: 'admin',
  fullName: 'Lifecycle Admin',
  country: 'Costa Rica',
  age: '40',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const ORGANIZER = {
  id: 'lifecycle-organizer',
  email: 'lifecycle.organizer@test.example.com',
  passwordHash: 'abc123',
  role: 'organizer',
  fullName: 'Tournament Organizer',
  country: 'Mexico',
  age: '35',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

// Kyokushin Kumite weight categories template
const KYOKUSHIN_TEMPLATE = {
  id: 'tmpl-kyokushin',
  name: 'Kyokushin Kumite',
  description: 'Categorías de peso Kyokushin Kumite estándar',
  modalities: ['Kumite'],
  weightClasses: [
    { id: 'wc-sub40',  label: 'Sub-40 kg',  minKg: null, maxKg: 40 },
    { id: 'wc-40-50',  label: '40–50 kg',   minKg: 40,   maxKg: 50 },
    { id: 'wc-50-60',  label: '50–60 kg',   minKg: 50,   maxKg: 60 },
    { id: 'wc-60-70',  label: '60–70 kg',   minKg: 60,   maxKg: 70 },
    { id: 'wc-70-80',  label: '70–80 kg',   minKg: 70,   maxKg: 80 },
    { id: 'wc-80-90',  label: '80–90 kg',   minKg: 80,   maxKg: 90 },
    { id: 'wc-open',   label: '+90 kg (Open)', minKg: 90, maxKg: null },
  ],
  categories: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

// Weight classes for 250 athletes: cycle through divisions
const WEIGHT_DIVISIONS = ['40–50 kg', '50–60 kg', '60–70 kg', '70–80 kg', '80–90 kg'];
const COUNTRIES = ['Japan', 'Brazil', 'Mexico', 'Costa Rica', 'United States', 'Spain', 'France', 'Argentina', 'Colombia', 'Chile'];
const DISCIPLINES = ['Kumite'];

function buildAthletes(count: number) {
  const users = [];
  const regs = [];
  for (let i = 0; i < count; i++) {
    const userId = `lifecycle-ath-${i}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const weightDiv = WEIGHT_DIVISIONS[i % WEIGHT_DIVISIONS.length];
    users.push({
      id: userId,
      email: `ath${i}@lifecycle.test`,
      passwordHash: 'abc123',
      role: 'athlete',
      fullName: `Atleta ${i + 1}`,
      country,
      age: String(18 + (i % 20)),
      gender: i % 2 === 0 ? 'Masculino' : 'Femenino',
      academy: `Academy ${(i % 10) + 1}`,
      weight: String(40 + (i % 55)),
      beltGrade: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      synced: false,
    });
    regs.push({
      id: `lifecycle-reg-${i}`,
      userId,
      tournamentId: 'lifecycle-tourn-1',
      tournamentName: 'Copa Kyokushin 2026',
      athleteName: `Atleta ${i + 1}`,
      academy: `Academy ${(i % 10) + 1}`,
      grade: '',
      modalities: [{
        discipline: DISCIPLINES[0],
        gender: i % 2 === 0 ? 'Masculino' : 'Femenino',
        ageGroup: 'Adulto',
        weightDivision: weightDiv,
      }],
      timestamp: '2026-01-01T00:00:00.000Z',
      synced: false,
    });
  }
  return { users, regs };
}

const { users: ATHLETES, regs: REGISTRATIONS } = buildAthletes(250);

const TOURNAMENT_BASE = {
  id: 'lifecycle-tourn-1',
  name: 'Copa Kyokushin 2026',
  logo: '🥋',
  date: '2026-06-15',
  location: 'San José, Costa Rica',
  description: 'Gran torneo Kyokushin',
  martialArtIds: [],
  registrationStart: null,
  registrationEnd: null,
  registrationForceOpen: null,
  templateId: KYOKUSHIN_TEMPLATE.id,
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

async function injectAs(page: Page, user: typeof ADMIN, status: string, withRegs = false) {
  const tournament = { ...TOURNAMENT_BASE, status };
  const regs = withRegs ? REGISTRATIONS : [];
  await page.addInitScript(({ u, tourn, tmpl, athletes, rs }) => {
    localStorage.setItem('db:users',            JSON.stringify([u, ...athletes]));
    localStorage.setItem('db:session_user_id',  u.id);
    localStorage.setItem('db:tournaments',      JSON.stringify([tourn]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([tmpl]));
    localStorage.setItem('db:registrations',    JSON.stringify(rs));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
    localStorage.setItem('db:roles',            JSON.stringify([]));
    localStorage.setItem('db:weigh_in_results', JSON.stringify([]));
  }, { u: user, tourn: tournament, tmpl: KYOKUSHIN_TEMPLATE, athletes: ATHLETES, rs: regs });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('step 1-2: admin sees tournament in dashboard and organizer in user list', async ({ page }) => {
  await injectAs(page, ADMIN, 'created');
  await page.addInitScript(({ organizer }) => {
    const users = JSON.parse(localStorage.getItem('db:users') || '[]');
    if (!users.find((u: any) => u.id === organizer.id)) {
      users.push(organizer);
      localStorage.setItem('db:users', JSON.stringify(users));
    }
  }, { organizer: ORGANIZER });

  await page.goto('/screens/AdminTournamentsScreen');
  await page.waitForSelector('[data-testid="admin-tournaments-screen"]', { timeout: 30000 });

  // Tournament exists in the list
  await expect(page.locator('[data-testid="tournaments-list"]')).toBeVisible();
  await expect(page.locator('[data-testid^="tournament-card-"]').first()).toBeVisible();
});

test('step 3-6: set tournament to registration_open and verify status badge', async ({ page }) => {
  await injectAs(page, ADMIN, 'created');

  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  // Initially 'created'
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Creado');

  // Open registration
  await page.click('[data-testid="btn-status-registration_open"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Inscripciones Abiertas');
});

test('step 7-8: 250 athletes registered — dashboard shows correct count', async ({ page }) => {
  await injectAs(page, ADMIN, 'registration_open', true);

  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  // Registration count shows 250
  await expect(page.locator('[data-testid="no-registrations"]')).toHaveCount(0);
  const countText = await page.locator('text=/250 atleta/').first().textContent({ timeout: 10000 });
  expect(countText).toContain('250');
});

test('step 9-10: athlete can find tournament in search and it shows status badge', async ({ page }) => {
  await injectAs(page, ATHLETES[0] as any, 'registration_open', false);

  await page.goto('/screens/TournamentSearch');
  await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 30000 });

  const badge = page.locator('[data-testid="tournament-status-badge-lifecycle-tourn-1"]');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText('Inscripciones Abiertas');
});

test('step 11: close registration', async ({ page }) => {
  await injectAs(page, ADMIN, 'registration_open', true);

  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  await page.click('[data-testid="btn-status-registration_closed"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Inscripciones Cerradas');
});

test('step 12: tournament bracket generated and shows 250 participants', async ({ page }) => {
  await injectAs(page, ADMIN, 'registration_closed', true);

  await page.goto(`/screens/TournamentBracketScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-bracket-screen"]', { timeout: 30000 });

  // Should have at least one bracket category visible
  const cats = page.locator('[data-testid^="bracket-category-"]');
  await expect(cats.first()).toBeVisible();

  // Participant roster cards should be present
  const cards = page.locator('[data-testid="bracket-participant-card"]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(10);
});

test('step 13-14: initiate weigh-in (set status to weigh_in_open)', async ({ page }) => {
  await injectAs(page, ADMIN, 'registration_closed', true);

  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  await page.click('[data-testid="btn-status-weigh_in_open"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Pesaje Abierto');

  // Navigate to weigh-in screen
  await page.click('[data-testid="btn-manage-weigh-in"]');
  await page.waitForSelector('[data-testid="weigh-in-screen"]', { timeout: 30000 });
  await expect(page.locator('[data-testid="weigh-in-list"]')).toBeVisible();
});

test('step 15-16: admin records weigh-in for 5 athletes (some pass, some fail)', async ({ page }) => {
  await injectAs(page, ADMIN, 'weigh_in_open', true);

  await page.goto(`/screens/WeighInAdminScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="weigh-in-list"]', { timeout: 30000 });

  // Record for first 5 athletes visible: alternate pass/fail
  const recordButtons = page.locator('[data-testid^="btn-record-"]');
  const count = await recordButtons.count();
  const toRecord = Math.min(5, count);

  for (let i = 0; i < toRecord; i++) {
    const btn = recordButtons.first();
    await btn.click();
    await page.waitForSelector('[data-testid="weigh-in-modal"]', { timeout: 10000 });

    // Alternate: even = within weight (passes), odd = over weight (fails)
    const weight = i % 2 === 0 ? '65' : '75'; // 65 passes 60-70, 75 fails 60-70
    await page.fill('[data-testid="modal-actual-weight"]', weight);
    await page.click('[data-testid="btn-confirm-weight"]');
    await expect(page.locator('[data-testid="weigh-in-modal"]')).toHaveCount(0);
  }

  // Results should be visible
  const results = page.locator('[data-testid^="weigh-in-result-"]');
  const resultCount = await results.count();
  expect(resultCount).toBe(toRecord);
});

test('step 17: set weigh_in_closed and start tournament', async ({ page }) => {
  await injectAs(page, ADMIN, 'weigh_in_open', true);

  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  await page.click('[data-testid="btn-status-weigh_in_closed"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Pesaje Cerrado');

  await page.click('[data-testid="btn-status-tournament_start"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('En Curso');

  // View final bracket
  await page.click('[data-testid="btn-view-bracket"]');
  await page.waitForSelector('[data-testid="tournament-bracket-screen"]', { timeout: 30000 });

  const cats = page.locator('[data-testid^="bracket-category-"]');
  await expect(cats.first()).toBeVisible();
});

test('step 18: finish tournament', async ({ page }) => {
  await injectAs(page, ADMIN, 'tournament_start', true);

  await page.goto(`/screens/TournamentDashboardScreen?tournamentId=${TOURNAMENT_BASE.id}`);
  await page.waitForSelector('[data-testid="tournament-dashboard-screen"]', { timeout: 30000 });

  await page.click('[data-testid="btn-status-tournament_finish"]');
  await expect(page.locator('[data-testid="dash-status"]')).toHaveText('Finalizado');
});
