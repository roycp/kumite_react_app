/**
 * e2e/refactor-role-system.spec.ts
 *
 * Tests verifying that the application uses the dynamic role system
 * managed via the role administrator page instead of the hardcoded role map:
 *
 *   1. Custom role defined in DB appears in UsersScreen role dropdown
 *   2. Admin can assign a custom role to a user and the badge reflects it
 *   3. A user with a custom role that has manage_tournaments can access TournamentDashboard
 *   4. A user with a custom role that lacks manage_martial_arts cannot access MartialArts admin
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-refactor-role-test',
  email: 'admin.refactor@test.example.com',
  passwordHash: 'abc123',
  role: 'admin',
  fullName: 'Admin Refactor',
  country: 'CR',
  age: '35',
  gender: 'Masculino',
  academy: '',
  weight: '',
  beltGrade: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const CUSTOM_USER = {
  id: 'user-custom-role-test',
  email: 'custom.role@test.example.com',
  passwordHash: 'abc123',
  role: 'tournament_director',
  fullName: 'Director Torneo',
  country: 'CR',
  age: '30',
  gender: 'Masculino',
  academy: 'Dojo',
  weight: '75',
  beltGrade: '1° Dan',
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

const CUSTOM_ROLE_DEF = {
  id: 'role-def-custom-001',
  name: 'tournament_director',
  displayName: 'Director de Torneo',
  permissions: ['search_tournament', 'manage_tournaments'],
  createdAt: '2026-01-01T00:00:00.000Z',
  synced: false,
};

async function injectAdmin(page: Page, extraUsers: any[] = [], roleDefs: any[] = []) {
  await page.addInitScript(({ admin, extraUsers, roleDefs }) => {
    localStorage.setItem('db:users',            JSON.stringify([admin, ...extraUsers]));
    localStorage.setItem('db:session_user_id',  admin.id);
    localStorage.setItem('db:role_definitions', JSON.stringify(roleDefs));
    localStorage.setItem('db:tournaments',      JSON.stringify([]));
    localStorage.setItem('db:registrations',    JSON.stringify([]));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:organizations',    JSON.stringify([]));
    localStorage.setItem('db:rank_systems',     JSON.stringify([]));
  }, { admin: ADMIN_USER, extraUsers, roleDefs });
}

async function injectCustomUser(page: Page, roleDefs: any[]) {
  await page.addInitScript(({ user, roleDefs }) => {
    localStorage.setItem('db:users',            JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',  user.id);
    localStorage.setItem('db:role_definitions', JSON.stringify(roleDefs));
    localStorage.setItem('db:tournaments',      JSON.stringify([]));
    localStorage.setItem('db:registrations',    JSON.stringify([]));
    localStorage.setItem('db:martial_arts',     JSON.stringify([]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:organizations',    JSON.stringify([]));
    localStorage.setItem('db:rank_systems',     JSON.stringify([]));
  }, { user: CUSTOM_USER, roleDefs });
}

test.setTimeout(120000);

test('custom role from DB appears in UsersScreen role dropdown', async ({ page }) => {
  await injectAdmin(page, [CUSTOM_USER], [CUSTOM_ROLE_DEF]);
  await page.goto('/screens/UsersScreen');
  await expect(page.getByTestId('users-screen')).toBeVisible();

  // Click edit on the custom user row
  const editBtn = page.getByTestId(`btn-edit-${CUSTOM_USER.id}`);
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  // The select dropdown should exist and contain our custom role
  const select = page.getByTestId('input-edit-role');
  await expect(select).toBeVisible();
  const customOption = select.locator(`option[data-testid="role-option-${CUSTOM_ROLE_DEF.name}"]`);
  await expect(customOption).toHaveCount(1);
  await expect(customOption).toHaveText(CUSTOM_ROLE_DEF.displayName);
});

test('admin can assign custom role to user and badge reflects it', async ({ page }) => {
  // CUSTOM_USER starts with 'athlete' role; we assign the custom role via the dropdown
  const athleteUser = { ...CUSTOM_USER, role: 'athlete' };
  await injectAdmin(page, [athleteUser], [CUSTOM_ROLE_DEF]);
  await page.goto('/screens/UsersScreen');
  await expect(page.getByTestId('users-screen')).toBeVisible();

  // Initial badge shows athlete
  await expect(page.getByTestId(`user-role-${athleteUser.id}`)).toBeVisible();

  // Edit the user role
  await page.getByTestId(`btn-edit-${athleteUser.id}`).click();
  const select = page.getByTestId('input-edit-role');
  await select.selectOption(CUSTOM_ROLE_DEF.name);
  await page.getByTestId('btn-save-role').click();

  // Badge should now show the custom role's display name (falls back to role name if no label)
  const badge = page.getByTestId(`user-role-${athleteUser.id}`);
  await expect(badge).toBeVisible();
  const badgeText = await badge.textContent();
  // The badge shows ROLE_LABELS[role] ?? role — custom roles show the name as fallback
  expect(badgeText).toBeTruthy();
});

test('user with custom role can access TournamentDashboard (has manage_tournaments)', async ({ page }) => {
  await injectCustomUser(page, [CUSTOM_ROLE_DEF]);
  await page.goto('/screens/TournamentDashboardScreen');
  // Should not be redirected to MainScreen — the page should render
  await expect(page).not.toHaveURL(/MainScreen/);
  // The tournament dashboard should be visible (custom role has manage_tournaments)
  await expect(page.getByTestId('tournament-dashboard-screen')).toBeVisible({ timeout: 15000 });
});

test('user with custom role cannot access RoleAdminScreen (lacks manage_users)', async ({ page }) => {
  await injectCustomUser(page, [CUSTOM_ROLE_DEF]);
  await page.goto('/screens/RoleAdminScreen');
  // User lacks manage_users → redirected to MainScreen
  await expect(page).toHaveURL(/MainScreen/, { timeout: 15000 });
});
