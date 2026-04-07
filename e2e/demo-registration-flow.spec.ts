/**
 * e2e/demo-registration-flow.spec.ts
 *
 * Visual demo of the full tournament registration lifecycle.
 * Designed for video recording: every action has generous pauses so the
 * flow is easy to follow at human reading speed.
 *
 * Run with:
 *   npx playwright test e2e/demo-registration-flow.spec.ts
 *
 * The video is saved to:
 *   test-results/demo-[hash]/video.webm
 */

import { test, expect, Page } from '@playwright/test';

// ── Slow down all browser interactions ───────────────────────────────────────

test.use({
  launchOptions: { slowMo: 600 },
  viewport:      { width: 1280, height: 800 },
  video:         'on',
  screenshot:    'on',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAUSE = {
  short:  800,   // between related actions (e.g. type → click)
  medium: 1500,  // between distinct sub-steps
  long:   2500,  // between major steps so the viewer can read the screen
};

const DEMO_USER = {
  id:           'demo-video-user',
  email:        'maria.demo@test.example.com',
  passwordHash: 'abc123',
  role:         'athlete',
  fullName:     'María Rodríguez',
  country:      'Costa Rica',
  age:          '22',
  gender:       'Femenino',
  academy:      'Academia Cobra Kai',
  weight:       '58',
  beltGrade:    '3° Kyu',
  createdAt:    '2026-01-01T00:00:00.000Z',
  synced:       false,
};

async function injectUser(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
  }, DEMO_USER);
}

async function setSelect(page: Page, id: string, value: string) {
  await page.evaluate(({ id, value }) => {
    const el = document.getElementById(id) as HTMLSelectElement | null;
    if (el) { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, { id, value });
}

async function getInputValue(page: Page, id: string): Promise<string> {
  return page.evaluate(
    (id) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '',
    id,
  );
}

// ── Demo test ─────────────────────────────────────────────────────────────────

test.setTimeout(600000);

test('demo: full tournament registration lifecycle', async ({ page }) => {

  await injectUser(page);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 1 — Home screen: welcome banner and quick-action tiles
  // ═══════════════════════════════════════════════════════════════

  await page.goto('/screens/MainScreen');
  await page.locator('[data-testid="main-screen"]').last().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(PAUSE.long);

  // Show the user is logged in
  await expect(page.getByText(DEMO_USER.fullName).first()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 2 — Navigate to Tournament Search
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="nav-search"]').last().click();
  await page.locator('[data-testid="tournament-search-screen"]').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  // Let the viewer read the tournament list
  await expect(page.locator('[data-testid="tournament-tile-3"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 3 — Open tournament detail (Kyokushin)
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="tournament-tile-3"]').click();
  await page.locator('[data-testid="tournament-detail-screen"]').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(page.locator('[data-testid="detail-name"]')).toContainText('Kyokushin');
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 4 — Registration wizard: Info step
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="btn-syncup-tournament"]').click();
  await page.locator('#academy-input').last().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(PAUSE.medium);

  // Academy is pre-filled — let the viewer read it
  await expect(page.locator('#academy-input').last()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // Select grade
  await setSelect(page, 'grade-input', '3° Kyu');
  await page.waitForTimeout(PAUSE.long);

  // Click Next
  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.locator('[data-testid="modality-grid"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 5 — Registration wizard: pick Kata modality
  // ═══════════════════════════════════════════════════════════════

  await expect(page.locator('[data-testid="modality-tile-kata"]')).toBeVisible();
  await expect(page.locator('[data-testid="modality-tile-kumite"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="modality-tile-kata"]').click();
  await page.waitForTimeout(PAUSE.medium);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 6 — "Another modality?" step — decline and finish
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="btn-finish-now"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="btn-finish-now"]').last().click();

  // ═══════════════════════════════════════════════════════════════
  // SCENE 7 — Success screen
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="success-message"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(page.getByText(/Inscripción Exitosa/)).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 8 — Return home: active tournament appears
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="btn-volver-inicio"]').click();
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  const mainScreen = page.locator('[data-testid="main-screen"]').last();
  await mainScreen.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(mainScreen.getByText('Copa Centroamericana Kyokushin 2026')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 9 — Navigate to Tournament Management
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="nav-management"]').last().click();
  await page.waitForURL('**/TournamentManagement', { timeout: 10000 });
  const mgmt = page.locator('[data-testid="tournament-management-screen"]').last();
  await mgmt.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(mgmt.locator('[data-testid="registration-list"]')).toBeVisible();
  await expect(mgmt.locator('[data-testid="modality-entry-0-0"]').getByText('Kata')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 10 — Open Edit modal for the registration
  // ═══════════════════════════════════════════════════════════════

  await mgmt.locator('[data-testid="btn-edit-reg-0"]').click();
  await page.locator('[data-testid="btn-edit-registration"]').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  // Let viewer see the modal with Kata entry and all three buttons
  await expect(page.locator('[data-testid="edit-modal-item-0"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 11 — Enter wizard via "Edit Registration"
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="btn-edit-registration"]').last().click();
  await page.waitForURL('**/FormScreen**', { timeout: 15000 });

  // Info step — academy & grade pre-filled
  await page.locator('#academy-input').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  // Show pre-filled values to the viewer
  await expect(page.locator('#academy-input').last()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // Advance past Info
  await page.getByRole('button', { name: /siguiente/i }).last().click();
  await page.locator('text=Gestiona tus Modalidades').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 12 — Add Kumite modality
  // ═══════════════════════════════════════════════════════════════

  // Show existing Kata entry
  await expect(page.locator('[data-testid="btn-remove-modality-0"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // Click Add Another
  await page.locator('[data-testid="btn-add-another"]').last().click();
  await page.locator('[data-testid="modality-tile-kumite"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  // Pick Kumite
  await page.locator('[data-testid="modality-tile-kumite"]').last().click();
  await page.locator('[data-testid="weight-grid"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(PAUSE.long);

  // Pick weight division
  await page.locator('[data-testid="weight-tile-w70_80"]').last().click();
  await page.waitForTimeout(PAUSE.medium);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 13 — Success: both Kata + Kumite registered
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="success-message"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(page.getByText(/Inscripción Actualizada/)).toBeVisible();
  await expect(page.locator('[data-testid="success-message"]').getByText('Kata')).toBeVisible();
  await expect(page.locator('[data-testid="success-message"]').getByText('Kumite')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 14 — Active tournaments: both modalities shown
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="btn-volver-inicio"]').click();
  await page.waitForURL('**/TournamentManagement', { timeout: 15000 });
  const mgmt2 = page.locator('[data-testid="tournament-management-screen"]').last();
  await mgmt2.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(mgmt2.locator('[data-testid="modality-entry-0-0"]').getByText('Kata')).toBeVisible();
  await expect(mgmt2.locator('[data-testid="modality-entry-0-1"]').getByText('Kumite')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 15 — Edit wizard: save changes through Review step
  // ═══════════════════════════════════════════════════════════════

  await mgmt2.locator('[data-testid="btn-edit-reg-0"]').click();
  await page.locator('[data-testid="btn-edit-registration"]').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="btn-edit-registration"]').last().click();
  await page.waitForURL('**/FormScreen**', { timeout: 15000 });
  await page.locator('#academy-input').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await page.getByRole('button', { name: /siguiente/i }).last().click();
  await page.locator('text=Gestiona tus Modalidades').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  // Click "Save Changes" → goes to Review step
  await page.locator('[data-testid="btn-finish-now"]').last().click();
  await page.locator('[data-testid="btn-review-confirm"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  // Let the viewer read the Review step
  await page.waitForTimeout(PAUSE.long);

  // Confirm & Save
  await page.locator('[data-testid="btn-review-confirm"]').last().click();
  await page.locator('[data-testid="success-message"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 16 — Cancel participation
  // ═══════════════════════════════════════════════════════════════

  await page.locator('[data-testid="btn-volver-inicio"]').click();
  await page.waitForURL('**/TournamentManagement', { timeout: 15000 });
  const mgmt3 = page.locator('[data-testid="tournament-management-screen"]').last();
  await mgmt3.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.long);

  await mgmt3.locator('[data-testid="btn-cancel-reg-0"]').click();
  await page.locator('[data-testid="btn-confirm-cancel"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="btn-confirm-cancel"]').last().click();
  await page.waitForTimeout(PAUSE.medium);

  // ═══════════════════════════════════════════════════════════════
  // SCENE 17 — Empty state + tournament available again in search
  // ═══════════════════════════════════════════════════════════════

  await expect(mgmt3.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  await page.goto('/screens/TournamentSearch');
  const searchScreen = page.locator('[data-testid="tournament-search-screen"]').last();
  await searchScreen.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(searchScreen.locator('[data-testid="tournament-tile-3"]')).toBeVisible();
  await expect(searchScreen.locator('[data-testid="enrolled-badge-3"]')).not.toBeVisible();
  await page.waitForTimeout(PAUSE.long);
});
