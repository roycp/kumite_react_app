/**
 * e2e/apply-ai-designs.spec.ts
 *
 * Tests the AI design theme update on ProfileScreen:
 * 1. Profile page renders with AI design aesthetics
 * 2. Dark/light mode toggle switches theme
 * 3. Theme preference persists in localStorage
 * 4. Edit/save flow works correctly in both modes
 */

import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const SEED_USER = {
  id: 'ai-design-user-1',
  email: 'aidesign@test.example.com',
  passwordHash: 'abc123',
  role: 'athlete',
  fullName: 'Kenji Kumite',
  country: 'Japan',
  age: '25',
  gender: 'Masculino',
  academy: 'Tiger Dojo',
  weight: '70',
  beltGrade: '1° Dan',
  createdAt: '2024-01-01T00:00:00.000Z',
  synced: false,
};


test.describe('AI Design Themes — Profile Page', () => {

  test('profile page renders with AI design aesthetic', async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem('db:users',           JSON.stringify([user]));
      localStorage.setItem('db:session_user_id', user.id);
      localStorage.setItem('db:tournaments',     JSON.stringify([]));
      localStorage.setItem('db:registrations',   JSON.stringify([]));
      localStorage.setItem('db:martial_arts',    JSON.stringify([]));
      localStorage.setItem('db:templates',       JSON.stringify([]));
      localStorage.setItem('db:roles',           JSON.stringify([]));
      localStorage.setItem('db:organizations',   JSON.stringify([]));
      localStorage.setItem('db:role_definitions', JSON.stringify([]));
    }, { user: SEED_USER });

    await page.goto('/screens/ProfileScreen');
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 30000 });

    // Profile screen is visible
    const screen = page.locator('[data-testid="profile-screen"]');
    await expect(screen).toBeVisible();

    // User's full name appears in the header
    await expect(screen).toContainText(SEED_USER.fullName);

    // Theme toggle button is present
    const toggleBtn = page.locator('[data-testid="btn-theme-toggle"]');
    await expect(toggleBtn).toBeVisible();

    // Edit button is visible
    const editBtn = page.locator('[data-testid="btn-edit-profile"]');
    await expect(editBtn).toBeVisible();

    // Default mode is light (data-theme attribute confirms)
    await expect(screen).toHaveAttribute('data-theme', 'light');
  });

  test('toggle switches to dark mode and back to light', async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem('db:users',           JSON.stringify([user]));
      localStorage.setItem('db:session_user_id', user.id);
      localStorage.setItem('db:tournaments',     JSON.stringify([]));
      localStorage.setItem('db:registrations',   JSON.stringify([]));
      localStorage.setItem('db:martial_arts',    JSON.stringify([]));
      localStorage.setItem('db:templates',       JSON.stringify([]));
      localStorage.setItem('db:roles',           JSON.stringify([]));
      localStorage.setItem('db:organizations',   JSON.stringify([]));
      localStorage.setItem('db:role_definitions', JSON.stringify([]));
    }, { user: SEED_USER });

    await page.goto('/screens/ProfileScreen');
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 30000 });

    const screen    = page.locator('[data-testid="profile-screen"]');
    const toggleBtn = page.locator('[data-testid="btn-theme-toggle"]');

    // Initially light mode — toggle shows moon emoji
    await expect(toggleBtn).toContainText('🌙');

    // Switch to dark mode
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('☀️');

    // data-theme attribute confirms dark mode is active
    await expect(screen).toHaveAttribute('data-theme', 'dark');

    // localStorage should have the preference saved
    const stored = await page.evaluate(() => localStorage.getItem('kumite-theme'));
    expect(stored).toBe('dark');

    // Switch back to light mode
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('🌙');

    await expect(screen).toHaveAttribute('data-theme', 'light');
  });

  test('theme preference persists across page reloads', async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem('db:users',           JSON.stringify([user]));
      localStorage.setItem('db:session_user_id', user.id);
      localStorage.setItem('db:tournaments',     JSON.stringify([]));
      localStorage.setItem('db:registrations',   JSON.stringify([]));
      localStorage.setItem('db:martial_arts',    JSON.stringify([]));
      localStorage.setItem('db:templates',       JSON.stringify([]));
      localStorage.setItem('db:roles',           JSON.stringify([]));
      localStorage.setItem('db:organizations',   JSON.stringify([]));
      localStorage.setItem('db:role_definitions', JSON.stringify([]));
      // Pre-set dark mode preference
      localStorage.setItem('kumite-theme', 'dark');
    }, { user: SEED_USER });

    await page.goto('/screens/ProfileScreen');
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 30000 });

    const screen    = page.locator('[data-testid="profile-screen"]');
    const toggleBtn = page.locator('[data-testid="btn-theme-toggle"]');

    // Should load in dark mode because of stored preference
    await expect(toggleBtn).toContainText('☀️');
    await expect(screen).toHaveAttribute('data-theme', 'dark');
  });

  test('edit and save profile works with AI themed form', async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem('db:users',           JSON.stringify([user]));
      localStorage.setItem('db:session_user_id', user.id);
      localStorage.setItem('db:tournaments',     JSON.stringify([]));
      localStorage.setItem('db:registrations',   JSON.stringify([]));
      localStorage.setItem('db:martial_arts',    JSON.stringify([]));
      localStorage.setItem('db:templates',       JSON.stringify([]));
      localStorage.setItem('db:roles',           JSON.stringify([]));
      localStorage.setItem('db:organizations',   JSON.stringify([]));
      localStorage.setItem('db:role_definitions', JSON.stringify([]));
    }, { user: SEED_USER });

    await page.goto('/screens/ProfileScreen');
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 30000 });

    // Click edit
    await page.locator('[data-testid="btn-edit-profile"]').click();

    // Save button is now visible
    await expect(page.locator('[data-testid="btn-save-profile"]')).toBeVisible();

    // Save without changes (valid form)
    await page.locator('[data-testid="btn-save-profile"]').click();

    // Success message appears
    await expect(page.locator('text=Perfil actualizado exitosamente')).toBeVisible();
  });

});
