/**
 * e2e/user-administrator-page.spec.ts
 *
 * Tests for UsersScreen (admin-only):
 *   1. Admin sees all users with name, email, role badge
 *   2. Admin can edit a user's role
 *   3. Athlete is redirected away
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-usr-test', email: 'admin.usr@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Users', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-usr-test', email: 'athlete.usr@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Carlos Atleta', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo Kyoto', weight: '70', beltGrade: '5° Kyu', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const MANAGER_USER = {
  id: 'manager-usr-test', email: 'manager.usr@test.example.com', passwordHash: 'abc123',
  role: 'manager', fullName: 'María Manager', country: 'CR', age: '30', gender: 'Femenino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_REDIRECT = {
  id: 'athlete-redirect-test', email: 'athlete.redirect@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Redirect Atleta', country: 'CR', age: '20', gender: 'Femenino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ admin, athlete, manager }) => {
    localStorage.setItem('db:users', JSON.stringify([admin, athlete, manager]));
    localStorage.setItem('db:session_user_id', admin.id);
    localStorage.setItem('db:registrations', JSON.stringify([]));
  }, { admin: ADMIN_USER, athlete: ATHLETE_USER, manager: MANAGER_USER });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([]));
  }, { user: ATHLETE_REDIRECT });
}

const USERS_URL = '/screens/UsersScreen';

test.setTimeout(120000);

test('admin: view and edit user roles', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(USERS_URL);

  const screen = page.locator('[data-testid="users-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // ── List is visible ───────────────────────────────────────────────────────────
  const list = page.locator('[data-testid="users-list"]');
  await list.waitFor({ state: 'visible', timeout: 8000 });

  // Admin user row visible
  await expect(page.locator(`[data-testid="user-name-${ADMIN_USER.id}"]`)).toContainText('Admin Users');
  await expect(page.locator(`[data-testid="user-email-${ADMIN_USER.id}"]`)).toContainText('admin.usr@test.example.com');
  await expect(page.locator(`[data-testid="user-role-${ADMIN_USER.id}"]`)).toContainText('Administrador');

  // Athlete user row visible
  await expect(page.locator(`[data-testid="user-name-${ATHLETE_USER.id}"]`)).toContainText('Carlos Atleta');
  await expect(page.locator(`[data-testid="user-role-${ATHLETE_USER.id}"]`)).toContainText('Atleta');

  // Manager user row visible
  await expect(page.locator(`[data-testid="user-name-${MANAGER_USER.id}"]`)).toContainText('María Manager');
  await expect(page.locator(`[data-testid="user-role-${MANAGER_USER.id}"]`)).toContainText('Manager');

  // ── Edit athlete's role to manager ────────────────────────────────────────────
  await page.locator(`[data-testid="btn-edit-${ATHLETE_USER.id}"]`).click();

  const roleSelect = page.locator('[data-testid="input-edit-role"]').last();
  await roleSelect.waitFor({ state: 'visible', timeout: 5000 });
  await roleSelect.selectOption({ value: 'manager' });

  await page.locator('[data-testid="btn-save-role"]').last().click();

  // Role badge now shows Manager
  await expect(page.locator(`[data-testid="user-role-${ATHLETE_USER.id}"]`)).toContainText('Manager', { timeout: 5000 });
  // Edit select is gone
  await expect(page.locator('[data-testid="input-edit-role"]')).not.toBeVisible();
});

test('athlete: redirected away from UsersScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(USERS_URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
