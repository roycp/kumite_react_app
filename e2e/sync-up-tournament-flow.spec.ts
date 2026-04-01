/**
 * e2e/sync-up-tournament-flow.spec.ts
 *
 * Full user journey:
 *   1. Register as a new athlete (3-step onboarding)
 *   2. Auto-login → MainScreen
 *   3. Logout → HomeScreen
 *   4. Login with the created account
 *   5. Search for a tournament
 *   6. Open tournament detail → go through wizard (modality → weight)
 *   7. My Tournaments — registration appears with modality details
 *   8. Tournament Search — the registered tile shows enrolled badge
 *   9. Logout → session cleared
 */

import { test, expect, Page } from '@playwright/test';

async function selectNth(page: Page, nthIndex: number, option: string) {
  await page.evaluate(({ nthIndex, option }) => {
    const selects = document.querySelectorAll('select');
    const el = selects[nthIndex] as HTMLSelectElement;
    if (el) { el.value = option; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, { nthIndex, option });
}

function randomEmail() {
  return `athlete.${Math.random().toString(36).slice(2, 10)}@test.example.com`;
}

const ATHLETE = {
  fullName:  'María Gómez',
  country:   'Costa Rica',
  age:       '23',
  gender:    'Femenino',
  academy:   'Dojo Central',
  weight:    '65',
  beltGrade: 'Morado',
  email:     randomEmail(),
  password:  'testpass123',
};

test.setTimeout(180000);

test('complete athlete journey: register → login → search → sign up for tournament → my tournaments → logout', async ({ page }) => {

  // ── 1: HomeScreen ────────────────────────────────────────────────────────────
  await page.goto('/screens/HomeScreen');
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: /sync in/i })).toBeVisible();

  // ── 2: 3-step Onboarding ─────────────────────────────────────────────────────
  await page.getByRole('button', { name: /sync in/i }).click();
  await page.waitForSelector('[data-testid="onboarding-screen"]', { timeout: 10000 });
  await expect(page.getByText('Paso 1 de 3')).toBeVisible();

  // Step 1 — personal info
  await page.getByPlaceholder('Ej: Juan Pérez').fill(ATHLETE.fullName);
  await page.getByPlaceholder('Ej: Costa Rica').fill(ATHLETE.country);
  await page.getByPlaceholder('Ej: 25').fill(ATHLETE.age);
  await selectNth(page, 0, ATHLETE.gender);
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.waitForSelector('text=Paso 2 de 3', { timeout: 5000 });

  // Step 2 — sports details
  await page.getByPlaceholder('Nombre de tu academia').fill(ATHLETE.academy);
  await page.getByPlaceholder('Ej: 70').fill(ATHLETE.weight);
  await selectNth(page, 0, ATHLETE.beltGrade);
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.waitForSelector('text=Paso 3 de 3', { timeout: 5000 });

  // Step 3 — account
  await page.getByPlaceholder('tu@correo.com').fill(ATHLETE.email);
  const pwdInputs = page.locator('input[type="password"]');
  await pwdInputs.nth(0).fill(ATHLETE.password);
  await pwdInputs.nth(1).fill(ATHLETE.password);
  await page.getByRole('button', { name: /completar registro/i }).click();

  // ── 3: Auto-login → MainScreen ───────────────────────────────────────────────
  await page.waitForSelector('[data-testid="main-screen"]', { timeout: 15000 });
  await expect(page.getByText(ATHLETE.fullName).first()).toBeVisible();

  // ── 4: Logout (via sidebar) ──────────────────────────────────────────────────
  await page.getByText('Cerrar Sesión').first().click();
  await page.waitForURL(/HomeScreen/, { timeout: 15000 });
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });

  // ── 5: Login ─────────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.locator('input[type="email"]').fill(ATHLETE.email);
  await page.locator('input[type="password"]').fill(ATHLETE.password);
  await page.getByRole('button', { name: /iniciar sesión/i }).last().click();

  await page.waitForSelector('[data-testid="main-screen"]', { timeout: 10000 });
  await expect(page.getByText(ATHLETE.fullName).first()).toBeVisible();

  // ── 6: Tournament Search ─────────────────────────────────────────────────────
  await page.locator('[data-testid="nav-search"]').click();
  await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 10000 });

  await expect(page.locator('[data-testid="tournament-tile-1"]')).toBeVisible();
  await expect(page.locator('[data-testid="tournament-tile-4"]')).toBeVisible();

  // ── 7: Open tournament 4 (Central America Gi Open — has categories) ──────────
  await page.locator('[data-testid="tournament-tile-4"]').click();
  await page.waitForSelector('[data-testid="tournament-detail-screen"]', { timeout: 10000 });

  const detailName = await page.locator('[data-testid="detail-name"]').textContent();
  expect(detailName).toContain('Central America Gi Open');
  await expect(page.locator('[data-testid="detail-date"]')).toBeVisible();
  await expect(page.locator('[data-testid="detail-location"]')).toBeVisible();

  // ── 8: Enter registration wizard ────────────────────────────────────────────
  await page.locator('[data-testid="btn-syncup-tournament"]').click();
  await page.waitForSelector('#academy-input', { timeout: 10000 });
  await page.waitForTimeout(300);

  // Pre-filled from profile
  const academyVal = await page.evaluate(() => (document.getElementById('academy-input') as HTMLInputElement)?.value);
  expect(academyVal).toBe(ATHLETE.academy);

  // Grade select: ATHLETE.beltGrade = 'Morado' — must select it in the grade dropdown
  await page.evaluate((grade) => {
    const el = document.getElementById('grade-input') as HTMLSelectElement;
    if (el) { el.value = grade; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, ATHLETE.beltGrade);

  // Step 1 → modality
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.waitForSelector('[data-testid="modality-grid"]', { timeout: 8000 });
  await expect(page.locator('[data-testid="modality-tile-gi"]')).toBeVisible();

  // Pick Gi modality
  await page.locator('[data-testid="modality-tile-gi"]').click();

  // Pick weight: athlete is 65 kg → 60-70 kg bracket
  await page.waitForSelector('[data-testid="weight-grid"]', { timeout: 5000 });
  await page.locator('[data-testid="weight-tile-w60_70"]').click();

  // Single modality in BJJ → success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/Inscripción Exitosa/)).toBeVisible();

  // ── 9: My Tournaments — check modality details ───────────────────────────────
  await page.goto('/screens/TournamentManagement');
  await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
  await page.waitForTimeout(500);

  await expect(page.locator('[data-testid="registration-list"]')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Central America Gi Open')).toBeVisible();
  await expect(page.getByText(ATHLETE.fullName).first()).toBeVisible();
  await expect(page.locator('[data-testid="modality-entry-0-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="modality-entry-0-0"]').getByText('Gi')).toBeVisible();

  // ── 10: Tournament Search — tile 4 should now be disabled (enrolled) ─────────
  await page.goto('/screens/TournamentSearch');
  await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 20000 });
  await page.waitForTimeout(500);

  await expect(page.locator('[data-testid="enrolled-badge-4"]')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('✓ Ya estás inscrito').first()).toBeVisible();

  // ── 11: Logout and confirm session cleared ───────────────────────────────────
  await page.goto('/screens/MainScreen');
  await page.waitForSelector('[data-testid="main-screen"]', { timeout: 15000 });
  await page.getByText('Cerrar Sesión').first().click();
  await page.waitForURL(/HomeScreen/, { timeout: 15000 });
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });

  await page.goto('/screens/MainScreen');
  await page.waitForURL(/HomeScreen/, { timeout: 10000 });
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 10000 });
});
