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

test.describe('Tournament Detail Screen', () => {
  test('should load detail with tournament name and sync up button', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentDetail?id=1&name=Copa%20Nacional%20Kumite%202026');
    await page.waitForSelector('[data-testid="tournament-detail-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-detail-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-syncup-tournament"]')).toBeVisible();
  });

  test('should show correct tournament name from URL param', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentDetail?id=2&name=Panamerican%20Open%20Judo');
    await page.waitForSelector('[data-testid="detail-name"]', { timeout: 20000 });

    const name = await page.locator('[data-testid="detail-name"]').textContent();
    expect(name).toContain('Panamerican Open Judo');
  });

  test('should show date and location for the tournament', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentDetail?id=1&name=Copa%20Nacional%20Kumite%202026');
    await page.waitForSelector('[data-testid="detail-date"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="detail-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-location"]')).toBeVisible();
  });

  test('should navigate to form screen on sync up click', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentDetail?id=1&name=Copa%20Nacional%20Kumite%202026');
    await page.waitForSelector('[data-testid="btn-syncup-tournament"]', { timeout: 20000 });

    await page.locator('[data-testid="btn-syncup-tournament"]').click();
    await page.waitForSelector('#academy-input', { timeout: 10000 });

    await expect(page.locator('#academy-input')).toBeVisible();
    await expect(page.getByRole('button', { name: /siguiente|inscribirse/i })).toBeVisible();
  });

  test('should redirect unauthenticated users to HomeScreen', async ({ page }) => {
    await page.goto('/screens/TournamentDetail?id=1&name=Copa%20Nacional%20Kumite%202026');
    await page.waitForURL(/HomeScreen/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });
});
