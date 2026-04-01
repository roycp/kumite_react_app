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

async function injectAuthWithRegistration(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'test-user-1', email: 'test@test.com', passwordHash: 'abc123',
      role: 'athlete', fullName: 'Test Athlete', country: 'Costa Rica',
      age: '25', gender: 'Masculino', academy: 'Test Academy',
      weight: '70', beltGrade: 'Azul', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    const reg = {
      id: 'reg-1', userId: 'test-user-1', tournamentId: '1',
      tournamentName: 'Copa Nacional Kumite 2026', athleteName: 'Test Athlete',
      modalities: [
        { discipline: 'Kumite', weightDivision: '60–70 kg', gender: 'Masculino', ageGroup: 'Adulto' },
      ],
      timestamp: '2026-03-01T10:00:00.000Z', synced: false,
    };
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([reg]));
  });
}

test.describe('Tournament History Screen', () => {
  test('should show empty state when no registrations', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-history-screen"]')).toBeVisible();
    await expect(page.getByText(/No tienes torneos registrados/).first()).toBeVisible();
  });

  test('should show history list with tournament name', async ({ page }) => {
    await injectAuthWithRegistration(page);
    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="history-list"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-item-0"]')).toBeVisible();
    await expect(page.getByText('Copa Nacional Kumite 2026').first()).toBeVisible();
    await expect(page.locator('[data-testid="history-item-0"]').getByText('Kumite', { exact: true })).toBeVisible();
  });

  test('should show sidebar navigation', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="sidebar-history"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-search"]').first()).toBeVisible();
  });

  test('should redirect unauthenticated users to HomeScreen', async ({ page }) => {
    await page.goto('/screens/TournamentHistory');
    await page.waitForURL(/HomeScreen/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });
});
