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
      modalities: [], timestamp: new Date().toISOString(), synced: false,
    };
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([reg]));
  });
}

test.describe('Tournament Search Screen', () => {
  test('should load and show all 4 tournament tiles', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 20000 });

    await expect(page.locator('[data-testid="tournament-tile-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-4"]')).toBeVisible();
  });

  test('should show correct tournament names', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-tile-1"]', { timeout: 20000 });

    await expect(page.getByText('Copa Nacional Kumite 2026')).toBeVisible();
    await expect(page.getByText('Panamerican Open Judo')).toBeVisible();
    await expect(page.getByText('Copa Centroamericana Kyokushin 2026')).toBeVisible();
    await expect(page.getByText('Central America Gi Open')).toBeVisible();
  });

  test('should filter tournaments by name', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="search-input"]', { timeout: 20000 });

    await page.locator('[data-testid="search-input"]').fill('Kyokushin');
    await expect(page.locator('[data-testid="tournament-tile-3"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="tournament-tile-1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="tournament-tile-4"]')).not.toBeVisible();
  });

  test('should show no-results message for unknown search', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="search-input"]', { timeout: 20000 });

    await page.locator('[data-testid="search-input"]').fill('xyznotexist');
    await expect(page.getByText(/No se encontraron torneos/)).toBeVisible({ timeout: 3000 });
  });

  test('should navigate to tournament detail on tile click', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-tile-1"]', { timeout: 20000 });

    await page.locator('[data-testid="tournament-tile-1"]').click();
    await page.waitForSelector('[data-testid="tournament-detail-screen"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="tournament-detail-screen"]')).toBeVisible();
  });

  test('should show enrolled badge for registered tournament', async ({ page }) => {
    await injectAuthWithRegistration(page);
    await page.goto('/screens/TournamentSearch');
    await page.waitForSelector('[data-testid="tournament-tile-1"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="enrolled-badge-1"]')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('✓ Ya estás inscrito').first()).toBeVisible();
    await expect(page.locator('[data-testid="enrolled-badge-2"]')).not.toBeVisible();
  });

  test('should redirect unauthenticated users to HomeScreen', async ({ page }) => {
    await page.goto('/screens/TournamentSearch');
    await page.waitForURL(/HomeScreen/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  });
});
