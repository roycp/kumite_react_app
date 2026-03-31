import { test, expect } from '@playwright/test';

test.describe('Tournament Detail Screen', () => {
  test('should load detail with tournament name and sync up button', async ({ page }) => {
    await page.goto('/screens/TournamentDetail?id=1&name=Copa%20Nacional%20Kumite%202026');
    await page.waitForSelector('[data-testid="tournament-detail-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-detail-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-syncup-tournament"]')).toBeVisible();
  });

  test('should show correct tournament name from URL param', async ({ page }) => {
    await page.goto('/screens/TournamentDetail?id=2&name=Panamerican%20Open%20Judo');
    await page.waitForSelector('[data-testid="detail-name"]', { timeout: 20000 });

    const name = await page.locator('[data-testid="detail-name"]').textContent();
    expect(name).toContain('Panamerican Open Judo');
  });

  test('should navigate to form screen on sync up click', async ({ page }) => {
    await page.goto('/screens/TournamentDetail?id=1&name=Copa%20Nacional%20Kumite%202026');
    await page.waitForSelector('[data-testid="btn-syncup-tournament"]', { timeout: 20000 });

    await page.locator('[data-testid="btn-syncup-tournament"]').click();
    await page.waitForSelector('#eventName-input', { timeout: 10000 });

    // Form screen loaded — registration form is visible with required fields
    await expect(page.locator('#fullName-input')).toBeVisible();
    await expect(page.locator('#eventName-input')).toBeVisible();
  });
});
