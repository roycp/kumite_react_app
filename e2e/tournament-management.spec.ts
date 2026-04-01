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
    const registration = {
      id: 'reg-1',
      userId: 'test-user-1',
      tournamentId: '1',
      tournamentName: 'Copa Nacional Kumite 2026',
      athleteName: 'Test Athlete',
      modalities: [
        { discipline: 'Kumite', weightDivision: '60–70 kg', gender: 'Masculino', ageGroup: 'Adulto' },
      ],
      timestamp: new Date().toISOString(),
      synced: false,
    };
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([registration]));
  });
}

test.describe('Tournament Management Screen', () => {
  test('should load and show empty state when no registrations', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-management-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('should show registration list with modality details', async ({ page }) => {
    await injectAuthWithRegistration(page);
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="registration-list"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Copa Nacional Kumite 2026').first()).toBeVisible();
    await expect(page.getByText('Test Athlete').first()).toBeVisible();

    // Modality card details
    const modalCard = page.locator('[data-testid="modality-entry-0-0"]');
    await expect(modalCard).toBeVisible({ timeout: 5000 });
    await expect(modalCard.getByText('Kumite')).toBeVisible();
    await expect(modalCard.getByText('60–70 kg')).toBeVisible();
    await expect(modalCard.getByText('Masculino')).toBeVisible();
    await expect(modalCard.getByText('Adulto')).toBeVisible();
  });

  test('should redirect unauthenticated users to HomeScreen', async ({ page }) => {
    await page.goto('/screens/TournamentManagement');
    await page.waitForURL(/HomeScreen/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });

  test('empty state should have a link to tournament search', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="empty-state"]', { timeout: 20000 });

    await page.locator('[data-testid="empty-state"] button').click();
    await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="tournament-search-screen"]')).toBeVisible();
  });
});
