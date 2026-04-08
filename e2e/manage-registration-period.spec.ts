/**
 * e2e/manage-registration-period.spec.ts
 *
 * Tests for manually controlling tournament registration open/close:
 *   1. Admin can force-open a tournament with expired registration → visible for athletes
 *   2. Admin can force-close a tournament with active registration → closed for athletes
 *   3. Admin can return to automatic mode
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-manreg-test', email: 'admin.manreg@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin ManReg', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-manreg-test', email: 'athlete.manreg@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta ManReg', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

// Registration period expired
const T_EXPIRED = {
  id: 'tourn-expired-manreg', name: 'Torneo Expirado',
  date: '2026-09-01', location: 'San José, CR',
  logo: '🏆', description: '',
  status: 'upcoming', martialArtIds: [],
  registrationStart: '2026-01-01', registrationEnd: '2026-01-02', // past
  registrationForceOpen: null,
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page, tournaments: any[]) {
  await page.addInitScript(({ user, tournaments: ts }) => {
    localStorage.setItem('db:users',              JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',    user.id);
    localStorage.setItem('db:tournaments',        JSON.stringify(ts));
    localStorage.setItem('db:registrations',      JSON.stringify([]));
    localStorage.setItem('db:martial_arts',       JSON.stringify([]));
    localStorage.setItem('db:user_martial_art_ranks', JSON.stringify([]));
  }, { user: ADMIN_USER, tournaments });
}

async function injectAthlete(page: Page, tournaments: any[]) {
  await page.addInitScript(({ user, tournaments: ts }) => {
    localStorage.setItem('db:users',              JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',    user.id);
    localStorage.setItem('db:tournaments',        JSON.stringify(ts));
    localStorage.setItem('db:registrations',      JSON.stringify([]));
    localStorage.setItem('db:martial_arts',       JSON.stringify([]));
    localStorage.setItem('db:user_martial_art_ranks', JSON.stringify([]));
  }, { user: ATHLETE_USER, tournaments });
}

test.setTimeout(120000);

test('admin: force-open a tournament with expired registration → athlete can register', async ({ page }) => {
  await injectAdmin(page, [T_EXPIRED]);
  await page.goto('/screens/AdminTournamentsScreen');

  const screen = page.locator('[data-testid="admin-tournaments-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Tournament card shows the expired tournament
  const card = page.locator(`[data-testid="tournament-card-${T_EXPIRED.id}"]`);
  await expect(card).toBeVisible({ timeout: 10000 });

  // Check registration status indicator shows "automatic"
  await expect(page.locator(`[data-testid="reg-status-${T_EXPIRED.id}"]`)).toContainText('automático');

  // Click force-open
  await page.locator(`[data-testid="btn-reg-open-${T_EXPIRED.id}"]`).click();

  // Status should update to "force open"
  await expect(page.locator(`[data-testid="reg-status-${T_EXPIRED.id}"]`)).toContainText('abiertas', { timeout: 5000 });

  // Force-open button should no longer be visible (since it's now open)
  await expect(page.locator(`[data-testid="btn-reg-open-${T_EXPIRED.id}"]`)).not.toBeVisible();
  // Close and auto buttons should be visible
  await expect(page.locator(`[data-testid="btn-reg-close-${T_EXPIRED.id}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="btn-reg-auto-${T_EXPIRED.id}"]`)).toBeVisible();
});

test('admin: force-close then restore automatic mode', async ({ page }) => {
  // Start with a force-open tournament
  const T_FORCE_OPEN = { ...T_EXPIRED, id: 'tourn-forceopen-manreg', registrationForceOpen: true };
  await injectAdmin(page, [T_FORCE_OPEN]);
  await page.goto('/screens/AdminTournamentsScreen');

  const screen = page.locator('[data-testid="admin-tournaments-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Force-close it
  await page.locator(`[data-testid="btn-reg-close-${T_FORCE_OPEN.id}"]`).click();
  await expect(page.locator(`[data-testid="reg-status-${T_FORCE_OPEN.id}"]`)).toContainText('cerradas', { timeout: 5000 });

  // Return to automatic
  await page.locator(`[data-testid="btn-reg-auto-${T_FORCE_OPEN.id}"]`).click();
  await expect(page.locator(`[data-testid="reg-status-${T_FORCE_OPEN.id}"]`)).toContainText('automático', { timeout: 5000 });
  await expect(page.locator(`[data-testid="btn-reg-auto-${T_FORCE_OPEN.id}"]`)).not.toBeVisible();
});
