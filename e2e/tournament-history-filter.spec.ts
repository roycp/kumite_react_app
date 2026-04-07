import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Override Date so the browser thinks it is 2027-01-01 — all 2026 tournaments become past
async function fastForwardDateTo2027(page: Page) {
  await page.addInitScript(() => {
    const RealDate = Date;
    const FAKE_NOW = new RealDate('2027-01-01T12:00:00.000Z').getTime();
    class FakeDate extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) super(FAKE_NOW);
        else super(...(args as [any]));
      }
      static now() { return FAKE_NOW; }
      static parse(s: string) { return RealDate.parse(s); }
    }
    (window as any).Date = FakeDate;
  });
}

async function injectWithFutureRegistration(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'hist-user', email: 'hist@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Hist Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    // Tournament '3' = Copa Centroamericana Kyokushin → date 2026-07-12 (future from 2026-04-05)
    const regs = [{
      id: 'reg-future', userId: 'hist-user', tournamentId: '3',
      tournamentName: 'Copa Centroamericana Kyokushin 2026',
      athleteName: 'Hist Tester',
      modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'Masculino', ageGroup: 'Adulto' }],
      timestamp: '2026-04-01T10:00:00.000Z', synced: false,
    }];
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify(regs));
  });
}

async function injectWithMixedRegistrations(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'hist-user2', email: 'hist2@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Mixed Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2025-01-01T00:00:00.000Z', synced: false,
    };
    // Two registrations — both 2026 tournaments (future from 2026-04-05, past from 2027)
    const regs = [
      {
        id: 'reg-1', userId: 'hist-user2', tournamentId: '1',
        tournamentName: 'Copa Nacional Kumite 2026',
        athleteName: 'Mixed Tester',
        modalities: [{ discipline: 'Kumite', weightDivision: '60–70 kg', gender: 'Masculino', ageGroup: 'Adulto' }],
        timestamp: '2026-03-01T10:00:00.000Z', synced: false,
      },
      {
        id: 'reg-2', userId: 'hist-user2', tournamentId: '2',
        tournamentName: 'Panamerican Open Judo',
        athleteName: 'Mixed Tester',
        modalities: [],
        timestamp: '2026-01-01T10:00:00.000Z', synced: false,
      },
    ];
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify(regs));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TournamentHistory — filter: only past tournaments', () => {

  test('shows empty state when all registrations are for future tournaments', async ({ page }) => {
    // Real date is 2026-04-05 → tournament '3' on 2026-07-12 is still future
    await injectWithFutureRegistration(page);
    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    await expect(page.getByText(/No tienes torneos completados/)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="history-list"]')).not.toBeVisible();
  });

  test('shows past tournaments when date is simulated to 2027', async ({ page }) => {
    // Override Date FIRST so the filter logic sees 2027 as "now"
    await fastForwardDateTo2027(page);
    await injectWithMixedRegistrations(page);

    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    // All 2026 tournaments are now past → both appear
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="history-item-0"]')).toBeVisible();
    await expect(page.getByText('Copa Nacional Kumite 2026').first()).toBeVisible();
    await expect(page.getByText('Panamerican Open Judo').first()).toBeVisible();
  });

});

test.describe('TournamentManagement — filter: only future tournaments', () => {

  test('shows active registrations for future tournaments', async ({ page }) => {
    await injectWithFutureRegistration(page);
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    // Tournament '3' (2026-07-12) is future → appears as active
    await expect(page.locator('[data-testid="registration-list"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Copa Centroamericana Kyokushin 2026').first()).toBeVisible();
  });

  test('shows empty state when all tournaments are in the past', async ({ page }) => {
    await fastForwardDateTo2027(page);
    await injectWithMixedRegistrations(page);

    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    // All 2026 tournaments are past in 2027 → no active registrations
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="registration-list"]')).not.toBeVisible();
  });

});
