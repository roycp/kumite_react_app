import { test, expect, Page } from '@playwright/test';

async function injectAuth(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'test-user-1', email: 'roy@example.com', passwordHash: 'abc123',
      role: 'athlete', fullName: 'Roy Cruz', country: 'Costa Rica',
      age: '25', gender: 'Masculino', academy: 'Team Ares',
      weight: '75', beltGrade: 'Azul', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
  });
}

test.describe('Profile Screen', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/ProfileScreen');
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 20000 });
  });

  test('should load profile with user info', async ({ page }) => {
    await expect(page.locator('[data-testid="profile-screen"]')).toBeVisible();
    await expect(page.getByText('Roy Cruz').first()).toBeVisible();
    await expect(page.getByText('roy@example.com').first()).toBeVisible();
    await expect(page.getByText('Costa Rica').first()).toBeVisible();
    await expect(page.getByText('Team Ares').first()).toBeVisible();
  });

  test('should show edit button and switch to edit mode', async ({ page }) => {
    await expect(page.locator('[data-testid="btn-edit-profile"]')).toBeVisible();
    await page.locator('[data-testid="btn-edit-profile"]').click();
    await expect(page.locator('[data-testid="btn-save-profile"]')).toBeVisible({ timeout: 3000 });
  });

  test('should save profile changes', async ({ page }) => {
    await page.locator('[data-testid="btn-edit-profile"]').click();
    await page.waitForSelector('[data-testid="btn-save-profile"]', { timeout: 3000 });

    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const academy = inputs.find(i => i.value === 'Team Ares');
      if (academy) { academy.value = 'New Academy'; academy.dispatchEvent(new Event('input', { bubbles: true })); }
    });

    await page.locator('[data-testid="btn-save-profile"]').click();
    await expect(page.getByText('✓ Perfil actualizado exitosamente')).toBeVisible({ timeout: 5000 });
  });

  test('should show sidebar with navigation links', async ({ page }) => {
    // Sidebar renders desktop + mobile — use .first() to avoid strict-mode
    await expect(page.locator('[data-testid="sidebar-home"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-search"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-active"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-history"]').first()).toBeVisible();
  });

  test('should redirect unauthenticated users to HomeScreen', async ({ browser }) => {
    const ctx = await browser.newContext();
    const pg  = await ctx.newPage();
    try {
      await pg.goto('http://localhost:8082/screens/ProfileScreen');
      await pg.waitForURL(/HomeScreen/, { timeout: 20000 });
      await expect(pg.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
    } finally {
      await ctx.close();
    }
  });
});
