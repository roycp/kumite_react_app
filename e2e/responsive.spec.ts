import { test, expect, Page } from '@playwright/test';

// Inject a minimal auth session into localStorage
async function injectAuth(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'resp-user', email: 'resp@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Resp Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo Test',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
  });
}

// Viewports to test
const VIEWPORTS = [
  { name: 'Small Mobile 320',  width: 320,  height: 568  },
  { name: 'Small Mobile 360',  width: 360,  height: 640  },
  { name: 'Medium Mobile 375', width: 375,  height: 812  },
  { name: 'Medium Mobile 390', width: 390,  height: 844  },
  { name: 'Tablet Landscape',  width: 1024, height: 768  },
  { name: 'Tablet Wide',       width: 1280, height: 800  },
];

// Helper: check that there is no horizontal scrollbar
async function hasNoHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

// Helper: check that all key elements are visible (in viewport)
async function allVisible(page: Page, selectors: string[]): Promise<void> {
  for (const sel of selectors) {
    await expect(page.locator(sel).first()).toBeVisible({ timeout: 5000 });
  }
}

// ── Scroll helper (uses the sidebar-content div as the scroll container) ──────
async function canScrollToBottom(page: Page, screenTestId: string): Promise<void> {
  await page.waitForSelector(`[data-testid="${screenTestId}"]`, { timeout: 20000 });

  const scrollable = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="sidebar-content"]') as HTMLElement | null;
    if (el) return el.scrollHeight > el.clientHeight;
    return document.documentElement.scrollHeight > window.innerHeight;
  });
  expect(scrollable).toBe(true);
}

async function injectAuthWithManyRegistrations(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'scroll-user', email: 'scroll@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Scroll Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo Scroll',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    const regs = Array.from({ length: 6 }, (_, i) => ({
      id: `reg-${i}`,
      userId: 'scroll-user',
      tournamentId: String((i % 4) + 1),
      tournamentName: `Torneo de Prueba ${i + 1}`,
      athleteName: 'Scroll Tester',
      modalities: [{ discipline: 'Kumite', weightDivision: '60–70 kg', gender: 'Masculino', ageGroup: 'Adulto' }],
      timestamp: new Date(2028, i, 1).toISOString(), // far future so they appear as active
      synced: false,
    }));
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify(regs));
  });
}

test.describe('Scroll — screens can scroll to show all content', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 568 });
  });

  test('TournamentHistory — vertical scroll enabled', async ({ page }) => {
    await injectAuthWithManyRegistrations(page);
    // Fast-forward date so all registrations appear as past in history
    await page.addInitScript(() => {
      const RealDate = Date;
      const FAKE = new RealDate('2030-01-01T00:00:00Z').getTime();
      class FD extends RealDate {
        constructor(...a: any[]) { if (a.length === 0) super(FAKE); else super(...(a as [any])); }
        static now() { return FAKE; }
        static parse(s: string) { return RealDate.parse(s); }
      }
      (window as any).Date = FD;
    });
    await page.goto('/screens/TournamentHistory');
    await canScrollToBottom(page, 'tournament-history-screen');
  });

  test('ProfileScreen — vertical scroll enabled', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/ProfileScreen');
    await canScrollToBottom(page, 'profile-screen');
  });

  test('TournamentSearch — vertical scroll enabled', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentSearch');
    await canScrollToBottom(page, 'tournament-search-screen');
  });

  test('MainScreen — vertical scroll enabled', async ({ page }) => {
    await injectAuthWithManyRegistrations(page);
    await page.goto('/screens/MainScreen');
    await canScrollToBottom(page, 'main-screen');
  });
});

for (const vp of VIEWPORTS) {
  test.describe(`Responsive — ${vp.name} (${vp.width}×${vp.height})`, () => {

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
    });

    test('MainScreen — no horizontal scroll, all tiles visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/MainScreen');
      await page.waitForSelector('[data-testid="main-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, [
        '[data-testid="nav-search"]',
        '[data-testid="nav-history"]',
        '[data-testid="nav-profile"]',
        '[data-testid="nav-management"]',
      ]);
    });

    test('TournamentSearch — no horizontal scroll, search bar visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/TournamentSearch');
      await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, [
        '[data-testid="search-input"]',
        '[data-testid="tournament-tile-1"]',
        '[data-testid="tournament-tile-3"]',
      ]);
    });

    test('ProfileScreen — no horizontal scroll, edit button visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/ProfileScreen');
      await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, [
        '[data-testid="btn-edit-profile"]',
      ]);
    });

    test('TournamentManagement — no horizontal scroll', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/TournamentManagement');
      await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    test('TournamentHistory — no horizontal scroll', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/TournamentHistory');
      await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    test('FormScreen — no horizontal scroll, info step visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/FormScreen?tournamentId=3&tournamentName=Kyokushin');
      await page.waitForSelector('#academy-input', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, ['#academy-input', '#grade-input']);
    });

    test('HomeScreen — no horizontal scroll', async ({ page }) => {
      await page.goto('/screens/HomeScreen');
      await page.waitForSelector('[data-testid="home-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    });

  });
}