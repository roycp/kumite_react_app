/**
 * e2e/role-administrator-page.spec.ts
 *
 * Tests for RoleAdminScreen:
 *   1. Admin can create a custom role with permissions
 *   2. Admin can edit an existing role
 *   3. Admin can delete a role
 *   4. Non-admin is redirected to MainScreen
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-role-admin-test', email: 'admin.role@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Roles', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-role-admin-test', email: 'athlete.role@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Atleta Role', country: 'CR', age: '22', gender: 'Masculino',
  academy: 'Dojo', weight: '70', beltGrade: '3° Kyu',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const EXISTING_ROLE = {
  id: 'role-def-001', name: 'referee', displayName: 'Árbitro',
  permissions: ['search_tournament'],
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page, roleDefs: any[] = []) {
  await page.addInitScript(({ admin, roleDefs }) => {
    localStorage.setItem('db:users',            JSON.stringify([admin]));
    localStorage.setItem('db:session_user_id',  admin.id);
    localStorage.setItem('db:role_definitions', JSON.stringify(roleDefs));
    localStorage.setItem('db:tournaments',      JSON.stringify([]));
    localStorage.setItem('db:registrations',    JSON.stringify([]));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
  }, { admin: ADMIN_USER, roleDefs });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users',            JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',  user.id);
    localStorage.setItem('db:role_definitions', JSON.stringify([]));
    localStorage.setItem('db:tournaments',      JSON.stringify([]));
    localStorage.setItem('db:registrations',    JSON.stringify([]));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
  }, { user: ATHLETE_USER });
}

const URL = '/screens/RoleAdminScreen';

test.setTimeout(120000);

test('admin: can create a custom role with permissions', async ({ page }) => {
  await injectAdmin(page, []);
  await page.goto(URL);

  const screen = page.locator('[data-testid="role-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // No roles yet
  await expect(page.locator('[data-testid="roles-empty"]')).toBeVisible();

  // Click show add form
  await page.locator('[data-testid="btn-show-add-form"]').click();
  await expect(page.locator('[data-testid="add-role-form"]')).toBeVisible();

  // Fill in display name and slug
  await page.locator('[data-testid="input-add-display-name"]').fill('Árbitro');
  await page.locator('[data-testid="input-add-name"]').fill('referee');

  // Check a permission
  await page.locator('[data-testid="add-perm-search_tournament"]').check();

  // Submit
  await page.locator('[data-testid="btn-create-role"]').click();

  // Form should close and new role appear
  await expect(page.locator('[data-testid="add-role-form"]')).not.toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="roles-list"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="roles-list"]')).toContainText('Árbitro');
  await expect(page.locator('[data-testid="roles-list"]')).toContainText('referee');
});

test('admin: can edit an existing role', async ({ page }) => {
  await injectAdmin(page, [EXISTING_ROLE]);
  await page.goto(URL);

  const screen = page.locator('[data-testid="role-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Role is listed
  await expect(page.locator(`[data-testid="role-display-name-${EXISTING_ROLE.id}"]`)).toContainText('Árbitro');

  // Click edit
  await page.locator(`[data-testid="btn-edit-role-${EXISTING_ROLE.id}"]`).click();

  // Change display name
  const displayInput = page.locator('[data-testid="input-edit-display-name"]');
  await displayInput.fill('Árbitro Principal');

  // Add another permission
  await page.locator('[data-testid="edit-perm-manage_tournaments"]').check();

  // Save
  await page.locator('[data-testid="btn-save-role"]').click();

  // Updated name shown
  await expect(page.locator(`[data-testid="role-display-name-${EXISTING_ROLE.id}"]`)).toContainText('Árbitro Principal', { timeout: 5000 });
  await expect(page.locator(`[data-testid="role-perm-tag-${EXISTING_ROLE.id}-manage_tournaments"]`)).toBeVisible({ timeout: 5000 });
});

test('admin: can delete a role', async ({ page }) => {
  await injectAdmin(page, [EXISTING_ROLE]);
  await page.goto(URL);

  const screen = page.locator('[data-testid="role-admin-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  await expect(page.locator(`[data-testid="role-row-${EXISTING_ROLE.id}"]`)).toBeVisible();

  // Delete
  await page.locator(`[data-testid="btn-delete-role-${EXISTING_ROLE.id}"]`).click();

  // Role row gone
  await expect(page.locator(`[data-testid="role-row-${EXISTING_ROLE.id}"]`)).not.toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="roles-empty"]')).toBeVisible({ timeout: 5000 });
});

test('athlete: redirected away from RoleAdminScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
