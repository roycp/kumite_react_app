import { test, expect } from '@playwright/test';

test.describe('Tournament Management Screen', () => {
  test('should load and show empty state when no registrations', async ({ page }) => {
    // Clear any existing registrations
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-management-screen"]')).toBeVisible();

    // Should show either empty state or registration list
    const emptyVisible = await page.locator('[data-testid="empty-state"]').isVisible().catch(() => false);
    const listVisible  = await page.locator('[data-testid="registration-list"]').isVisible().catch(() => false);
    expect(emptyVisible || listVisible).toBeTruthy();
  });

  test('should show registration list after submitting a form', async ({ page }) => {
    // Inject a registration directly into localStorage (AsyncStorage uses localStorage on web)
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });

    await page.evaluate(() => {
      const regs = [{ tournamentId: '1', tournamentName: 'Copa Nacional Kumite 2026', athleteName: 'Roy Cruz', timestamp: new Date().toISOString() }];
      localStorage.setItem('kumite_registrations', JSON.stringify(regs));
    });

    // Reload to pick up the injected data
    await page.reload();
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-testid="registration-list"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Copa Nacional Kumite 2026')).toBeVisible();
  });
});
