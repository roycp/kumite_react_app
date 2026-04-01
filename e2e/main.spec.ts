import { test, expect, Page } from '@playwright/test';

async function injectAuth(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'test-user-1', email: 'test@test.com', passwordHash: 'abc123',
      role: 'athlete', fullName: 'Test Athlete', country: 'Costa Rica',
      age: '25', gender: 'Masculino', academy: 'Test Academy',
      weight: '70', beltGrade: 'Azul', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
  });
}

test.describe('Main Screen', () => {
  test('should load the main screen with welcome banner and quick tiles', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="main-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="main-screen"]')).toBeVisible();
    await expect(page.getByText('Test Athlete').first()).toBeVisible();

    // Quick-action tiles
    await expect(page.locator('[data-testid="nav-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-profile"]')).toBeVisible();
  });

  test('should navigate to Tournament Search from nav tile', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="nav-search"]', { timeout: 20000 });
    await page.locator('[data-testid="nav-search"]').click();
    await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="tournament-search-screen"]')).toBeVisible();
  });

  test('should navigate to Tournament Management from nav tile', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="nav-management"]', { timeout: 20000 });
    await page.locator('[data-testid="nav-management"]').click();
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="tournament-management-screen"]')).toBeVisible();
  });

  test('should redirect unauthenticated users to HomeScreen', async ({ page }) => {
    await page.goto('/screens/MainScreen');
    await page.waitForURL(/HomeScreen/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });

  test('should show logout in sidebar and return to HomeScreen on click', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="main-screen"]', { timeout: 20000 });

    // Desktop sidebar is the first copy; click the first "Cerrar Sesión" text
    await page.getByText('Cerrar Sesión').first().click();
    await page.waitForURL(/HomeScreen/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });
});
