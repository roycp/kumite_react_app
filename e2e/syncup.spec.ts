import { test, expect, Page } from '@playwright/test';

async function gotoOnboarding(page: Page) {
  await page.goto('/screens/OnboardingScreen');
  await page.waitForSelector('[data-testid="onboarding-screen"]', { timeout: 20000 });
}

// OnboardingScreen selects have no id — pick by index within the current step
async function selectNth(page: Page, nthIndex: number, option: string) {
  await page.evaluate(({ nthIndex, option }) => {
    const el = document.querySelectorAll('select')[nthIndex] as HTMLSelectElement;
    if (el) { el.value = option; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, { nthIndex, option });
}

// Shared helper: fill steps 1 and 2 (personal info + sports details)
async function fillAthleteSteps12(page: Page) {
  // Step 1 — personal info
  await page.getByPlaceholder('Ej: Juan Pérez').fill('Roy Cruz');
  await page.getByPlaceholder('Ej: Costa Rica').fill('Costa Rica');
  await page.getByPlaceholder('Ej: 25').fill('25');
  await selectNth(page, 0, 'Masculino'); // gender select (only select on step 1)
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.waitForSelector('text=Paso 2 de 3', { timeout: 5000 });

  // Step 2 — sports details
  await page.getByPlaceholder('Nombre de tu academia').fill('Team Ares');
  await page.getByPlaceholder('Ej: 70').fill('75');
  await selectNth(page, 0, 'Azul'); // belt grade select (only select on step 2)
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.waitForSelector('text=Paso 3 de 3', { timeout: 5000 });
}

test.describe('Onboarding Screen (Registration)', () => {
  test('should load and show personal info on step 1', async ({ page }) => {
    await gotoOnboarding(page);
    await expect(page.locator('[data-testid="onboarding-screen"]')).toBeVisible();
    await expect(page.getByText('Información Personal')).toBeVisible();
    await expect(page.getByText('Paso 1 de 3')).toBeVisible();
  });

  test('athlete flow: advance through all steps and complete registration', async ({ page }) => {
    await gotoOnboarding(page);
    await fillAthleteSteps12(page);

    // Step 3 — account (use random email to avoid conflicts on re-runs)
    const email = `roy.${Math.random().toString(36).slice(2, 8)}@test.example.com`;
    await page.getByPlaceholder('tu@correo.com').fill(email);
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill('password123');
    await pwdInputs.nth(1).fill('password123');
    await page.getByRole('button', { name: /completar registro/i }).click();

    // Should redirect to MainScreen on success
    await page.waitForSelector('[data-testid="main-screen"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="main-screen"]')).toBeVisible();
  });

  test('back button returns to previous step', async ({ page }) => {
    await gotoOnboarding(page);

    // Fill step 1 and advance
    await page.getByPlaceholder('Ej: Juan Pérez').fill('Roy Cruz');
    await page.getByPlaceholder('Ej: Costa Rica').fill('Costa Rica');
    await page.getByPlaceholder('Ej: 25').fill('25');
    await selectNth(page, 0, 'Masculino');
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('text=Paso 2 de 3', { timeout: 5000 });

    // Go back
    await page.getByRole('button', { name: /atrás/i }).click();
    await page.waitForSelector('text=Paso 1 de 3', { timeout: 5000 });
    await expect(page.getByText('Información Personal')).toBeVisible();
  });

  test('account step validates password length and mismatch', async ({ page }) => {
    await gotoOnboarding(page);
    await fillAthleteSteps12(page);

    // Short password
    await page.getByPlaceholder('tu@correo.com').fill('test@test.com');
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill('123');
    await pwdInputs.nth(1).fill('123');
    await page.getByRole('button', { name: /completar registro/i }).click();
    await expect(page.getByText(/al menos 6 caracteres/i)).toBeVisible();

    // Password mismatch
    await pwdInputs.nth(0).fill('password123');
    await pwdInputs.nth(1).fill('different456');
    await page.getByRole('button', { name: /completar registro/i }).click();
    await expect(page.getByText(/no coinciden/i)).toBeVisible();
  });
});
