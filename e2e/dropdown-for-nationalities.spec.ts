/**
 * e2e/dropdown-for-nationalities.spec.ts
 *
 * Verifies country dropdown is present and functional:
 * 1. OnboardingScreen info step shows a <select> for country
 * 2. Dropdown contains expected country options with flags
 * 3. Selected country value is persisted to user profile
 * 4. ProfileScreen shows country dropdown when editing
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-countries-test', email: 'admin.countries@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Countries', country: 'Japan', age: '35', gender: 'Masculino',
  academy: 'Dojo', weight: '75', beltGrade: '2° Dan',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ admin }) => {
    localStorage.setItem('db:users',                JSON.stringify([admin]));
    localStorage.setItem('db:session_user_id',      admin.id);
    localStorage.setItem('db:tournaments',          JSON.stringify([]));
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
    localStorage.setItem('db:registrations',        JSON.stringify([]));
    localStorage.setItem('db:martial_arts',         JSON.stringify([]));
  }, { admin: ADMIN_USER });
}

test.setTimeout(120000);

test('nationality: OnboardingScreen shows country dropdown on info step', async ({ page }) => {
  await page.goto('/screens/OnboardingScreen');
  const screen = page.locator('[data-testid="onboarding-screen"]');
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Advance from role step to info step
  await page.locator('[data-testid="role-card-athlete"]').click();
  await page.getByText('Siguiente →').click();

  // Country select should be visible
  const countrySelect = page.locator('[data-testid="select-country"]');
  await expect(countrySelect).toBeVisible();

  // Should have options
  const options = await countrySelect.locator('option').count();
  expect(options).toBeGreaterThan(100);
});

test('nationality: country dropdown includes Costa Rica with flag', async ({ page }) => {
  await page.goto('/screens/OnboardingScreen');
  await page.locator('[data-testid="onboarding-screen"]').waitFor({ state: 'visible', timeout: 20000 });

  await page.locator('[data-testid="role-card-athlete"]').click();
  await page.getByText('Siguiente →').click();

  const countrySelect = page.locator('[data-testid="select-country"]');
  await expect(countrySelect).toBeVisible();

  // Select Costa Rica
  await countrySelect.selectOption('Costa Rica');
  await expect(countrySelect).toHaveValue('Costa Rica');

  // Verify the option text includes the flag emoji
  const costaRicaOption = countrySelect.locator('option[value="Costa Rica"]');
  const optionText = await costaRicaOption.textContent();
  expect(optionText).toContain('Costa Rica');
  expect(optionText).toContain('🇨🇷');
});

test('nationality: selected country persists through form submission', async ({ page }) => {
  await page.goto('/screens/OnboardingScreen');
  await page.locator('[data-testid="onboarding-screen"]').waitFor({ state: 'visible', timeout: 20000 });

  // Step 1: role
  await page.locator('[data-testid="role-card-athlete"]').click();
  await page.getByText('Siguiente →').click();

  // Step 2: info — fill in all fields
  await page.getByPlaceholder('Ej: Juan Pérez').fill('Test Nationality User');
  await page.locator('[data-testid="select-country"]').selectOption('Japan');
  await page.getByPlaceholder('Ej: 25').fill('22');
  await page.locator('select').filter({ hasText: 'Masculino' }).selectOption('Masculino');
  await page.getByText('Siguiente →').click();

  // Step 3: sports details
  await page.getByPlaceholder('Nombre de tu academia').fill('Test Dojo');
  await page.getByPlaceholder('Ej: 70').fill('70');
  await page.locator('select').filter({ hasText: 'Negro' }).last().selectOption('Negro');
  await page.getByText('Siguiente →').click();

  // Step 4: account
  await page.getByPlaceholder('tu@correo.com').fill('nattest@test.example.com');
  await page.getByPlaceholder('••••••••').first().fill('password123');
  await page.getByPlaceholder('••••••••').last().fill('password123');
  await page.getByText('✓ Completar Registro').click();

  // Should navigate to MainScreen after successful registration
  await page.waitForURL('**/MainScreen', { timeout: 20000 });

  // Verify stored user has Japan as country
  const users = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('db:users') ?? '[]')
  );
  const newUser = users.find((u: any) => u.email === 'nattest@test.example.com');
  expect(newUser).toBeTruthy();
  expect(newUser.country).toBe('Japan');
});

test('nationality: ProfileScreen shows country dropdown when editing', async ({ page }) => {
  await injectAdmin(page);
  await page.goto('/screens/ProfileScreen');

  const screen = page.locator('[data-testid="profile-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Enter edit mode
  const editBtn = page.getByText('Editar');
  await editBtn.click();

  // Country should now be a select dropdown
  const countrySelect = screen.locator('select').filter({ hasText: 'Japan' });
  await expect(countrySelect).toBeVisible();

  // Select a different country
  await countrySelect.selectOption('Mexico');
  await expect(countrySelect).toHaveValue('Mexico');
});
