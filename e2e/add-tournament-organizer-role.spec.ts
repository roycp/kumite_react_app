/**
 * e2e/add-tournament-organizer-role.spec.ts
 *
 * Tests for the 'organizer' role:
 *   1. Organizer can access TournamentManagement screen
 *   2. Organizer cannot access UsersScreen (redirected to MainScreen)
 *   3. Admin can assign organizer role via UsersScreen
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-org-test', email: 'admin.org@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Organizer', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ORGANIZER_USER = {
  id: 'organizer-test', email: 'organizer@test.example.com', passwordHash: 'abc123',
  role: 'organizer', fullName: 'Carlos Organizer', country: 'CR', age: '30', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-org-test', email: 'athlete.org@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta Org', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectOrganizer(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users',            JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',  user.id);
    localStorage.setItem('db:tournaments',      JSON.stringify([]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',    JSON.stringify([]));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
  }, { user: ORGANIZER_USER });
}

async function injectAdmin(page: Page, extraUsers: any[] = []) {
  await page.addInitScript(({ admin, extras }) => {
    localStorage.setItem('db:users',            JSON.stringify([admin, ...extras]));
    localStorage.setItem('db:session_user_id',  admin.id);
    localStorage.setItem('db:tournaments',      JSON.stringify([]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',    JSON.stringify([]));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
  }, { admin: ADMIN_USER, extras: extraUsers });
}

test.setTimeout(120000);

test('organizer: can access TournamentManagement screen', async ({ page }) => {
  await injectOrganizer(page);
  await page.goto('/screens/TournamentManagement');

  const screen = page.locator('[data-testid="tournament-management-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });
  await expect(screen).toBeVisible();
});

test('organizer: cannot access UsersScreen (redirected to MainScreen)', async ({ page }) => {
  await injectOrganizer(page);
  await page.goto('/screens/UsersScreen');
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});

test('admin: can assign organizer role to a user via UsersScreen', async ({ page }) => {
  await injectAdmin(page, [ATHLETE_USER]);
  await page.goto('/screens/UsersScreen');

  const screen = page.locator('[data-testid="users-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Current role is 'Atleta'
  await expect(page.locator(`[data-testid="user-role-${ATHLETE_USER.id}"]`)).toContainText('Atleta');

  // Click Edit
  await page.locator(`[data-testid="btn-edit-${ATHLETE_USER.id}"]`).click();

  // Select 'organizer' from dropdown
  const select = page.locator('[data-testid="input-edit-role"]');
  await select.selectOption('organizer');

  // Save
  await page.locator('[data-testid="btn-save-role"]').click();

  // Badge should now show 'Organizador'
  await expect(page.locator(`[data-testid="user-role-${ATHLETE_USER.id}"]`)).toContainText('Organizador', { timeout: 5000 });
});
