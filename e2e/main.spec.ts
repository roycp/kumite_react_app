import { test, expect } from '@playwright/test';

test.describe('Main Screen', () => {
  test('should load the main screen with title and nav cards', async ({ page }) => {
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="main-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="main-screen"]')).toBeVisible();
    await expect(page.getByText('KumiteApp')).toBeVisible();

    await expect(page.locator('[data-testid="nav-syncup"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-management"]')).toBeVisible();
  });

  test('should navigate to SyncUp screen from nav card', async ({ page }) => {
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="nav-syncup"]', { timeout: 20000 });
    await page.locator('[data-testid="nav-syncup"]').click();
    await page.waitForSelector('[data-testid="syncup-screen"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="syncup-screen"]')).toBeVisible();
  });

  test('should navigate to Tournament Search from nav card', async ({ page }) => {
    await page.goto('/screens/MainScreen');
    await page.waitForSelector('[data-testid="nav-search"]', { timeout: 20000 });
    await page.locator('[data-testid="nav-search"]').click();
    await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="tournament-search-screen"]')).toBeVisible();
  });
});
