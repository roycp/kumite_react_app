import { test, expect, Page } from '@playwright/test';

async function gotoSyncUp(page: Page) {
  await page.goto('/screens/SyncUpScreen');
  await page.waitForSelector('[data-testid="syncup-screen"]', { timeout: 20000 });
}

test.describe('SyncUp Screen', () => {
  test('should load and show role selection', async ({ page }) => {
    await gotoSyncUp(page);
    await expect(page.locator('[data-testid="syncup-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-athlete"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-coach"]')).toBeVisible();
  });

  test('athlete flow: select athlete, fill form, save', async ({ page }) => {
    await gotoSyncUp(page);

    // Select athlete role
    await page.locator('[data-testid="btn-athlete"]').click();
    await page.waitForSelector('#syncup-fullName', { timeout: 5000 });

    // Fill fields via DOM
    await page.evaluate(() => {
      const set = (id: string, val: string) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val; };
      set('syncup-fullName', 'Roy Cruz');
      set('syncup-email',    'roy@example.com');
      set('syncup-country',  'Costa Rica');
      set('syncup-age',      '25');
      set('syncup-academy',  'Team Ares');
      set('syncup-weight',   '75');
      (document.getElementById('syncup-gender') as HTMLSelectElement).value    = 'Masculino';
      (document.getElementById('syncup-beltGrade') as HTMLSelectElement).value = 'Azul';
    });

    // Verify fields filled
    expect(await page.evaluate(() => (document.getElementById('syncup-fullName') as HTMLInputElement).value)).toBe('Roy Cruz');

    // Save
    await page.locator('[data-testid="btn-save-profile"]').click();
    await page.waitForTimeout(500);

    // Success banner should appear
    await expect(page.locator('[data-testid="syncup-success"]')).toBeVisible({ timeout: 5000 });
  });

  test('coach flow: select coach, see coach form, add athlete sub-form', async ({ page }) => {
    await gotoSyncUp(page);

    // Select coach role
    await page.locator('[data-testid="btn-coach"]').click();
    await page.waitForSelector('#coach-fullName', { timeout: 5000 });

    // Coach fields visible
    await expect(page.locator('#coach-fullName')).toBeVisible();
    await expect(page.locator('#coach-email')).toBeVisible();
    await expect(page.locator('#coach-academy')).toBeVisible();

    // Initial athlete form
    await expect(page.locator('[data-testid="athlete-form-0"]')).toBeVisible();

    // Add another athlete
    await page.locator('[data-testid="btn-add-athlete"]').click();
    await page.waitForTimeout(300);

    // Second athlete form should appear
    await expect(page.locator('[data-testid="athlete-form-1"]')).toBeVisible();
  });
});
