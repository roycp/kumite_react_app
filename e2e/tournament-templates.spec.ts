/**
 * e2e/tournament-templates.spec.ts
 *
 * Tests for TournamentTemplatesScreen (admin-only):
 *   1. Admin can add a template with name + modalities → verify displayed
 *   2. Admin can edit a template name → verify updated
 *   3. Admin can delete a template → empty state
 *   4. Athlete is redirected away
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-tpl-test', email: 'admin.tpl@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Plantillas', country: 'CR', age: '35', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-tpl-test', email: 'athlete.tpl@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Athlete Plantillas', country: 'CR', age: '22', gender: 'Femenino',
  academy: 'Dojo', weight: '55', beltGrade: '5° Kyu', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users',               JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',     user.id);
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
  }, { user: ADMIN_USER });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('db:users',               JSON.stringify([user]));
    localStorage.setItem('db:session_user_id',     user.id);
    localStorage.setItem('db:tournament_templates', JSON.stringify([]));
  }, { user: ATHLETE_USER });
}

const URL = '/screens/TournamentTemplatesScreen';

test.setTimeout(120000);

test('admin: add, edit, and delete a tournament template', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(URL);

  const screen = page.locator('[data-testid="templates-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // Empty state visible initially
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

  // ── Fill add form ─────────────────────────────────────────────────────────────
  await page.locator('[data-testid="input-new-name"]').fill('Plantilla Karate Adultos 2026');
  await page.locator('[data-testid="input-new-description"]').fill('Plantilla de prueba para adultos');

  // Check Kata and Kumite modalities
  await page.locator('[data-testid="input-new-modality-kata"]').check();
  await page.locator('[data-testid="input-new-modality-kumite"]').check();

  // Submit
  await page.locator('[data-testid="btn-add-template"]').click();

  // Template card should appear
  const list = page.locator('[data-testid="templates-list"]');
  await list.waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.locator('[data-testid="empty-state"]')).not.toBeVisible();

  const card = page.locator('[data-testid^="template-card-"]').first();
  await expect(card).toBeVisible();

  // Name is displayed
  const nameEl = page.locator('[data-testid^="template-name-"]').first();
  await expect(nameEl).toContainText('Plantilla Karate Adultos 2026');

  // Modality chips are shown
  const chips = page.locator('[data-testid^="template-modalities-"]').first();
  await expect(chips).toContainText('Kata');
  await expect(chips).toContainText('Kumite');

  // ── Edit the template ─────────────────────────────────────────────────────────
  await page.locator('[data-testid^="btn-edit-"]').first().click();
  const editName = page.locator('[data-testid="input-edit-name"]');
  await editName.waitFor({ state: 'visible', timeout: 5000 });
  await editName.fill('Plantilla Karate Adultos 2026 Editada');
  await page.locator('[data-testid="btn-save-edit"]').click();

  await expect(page.locator('[data-testid^="template-name-"]').first()).toContainText(
    'Plantilla Karate Adultos 2026 Editada',
    { timeout: 5000 }
  );
  await expect(page.locator('[data-testid="input-edit-name"]')).not.toBeVisible();

  // ── Delete → empty state ──────────────────────────────────────────────────────
  await page.locator('[data-testid^="btn-delete-"]').first().click();
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5000 });
});

test('athlete: redirected away from TournamentTemplatesScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
