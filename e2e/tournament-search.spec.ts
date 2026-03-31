import { test, expect } from '@playwright/test';

test.describe('Tournament Search Screen', () => {
  test('should load and show all 4 tournament tiles', async ({ page }) => {
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-search-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-4"]')).toBeVisible();
  });

  test('should show tournament names in tiles', async ({ page }) => {
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-tile-1"]', { timeout: 20000 });

    await expect(page.getByText('Copa Nacional Kumite 2026')).toBeVisible();
    await expect(page.getByText('Panamerican Open Judo')).toBeVisible();
    await expect(page.getByText('World Grappling Championship')).toBeVisible();
    await expect(page.getByText('Central America Gi Open')).toBeVisible();
  });

  test('should navigate to tournament detail on tile click', async ({ page }) => {
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-tile-1"]', { timeout: 20000 });

    await page.locator('[data-testid="tournament-tile-1"]').click();
    await page.waitForSelector('[data-testid="tournament-detail-screen"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="tournament-detail-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-name"]')).toBeVisible();
  });
});
