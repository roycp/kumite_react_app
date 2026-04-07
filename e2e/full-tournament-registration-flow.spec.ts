/**
 * e2e/full-tournament-registration-flow.spec.ts
 *
 * Complete end-to-end lifecycle for tournament registration:
 *   1.  Sign in to the application
 *   2.  Browse to a tournament with multiple modalities (Kyokushin: Kata + Kumite)
 *   3.  Choose Kata as first modality
 *   4.  Complete registration immediately (decline to add more)
 *   5.  Tournament appears in active tournaments on MainScreen
 *   6.  Navigate to active tournaments (TournamentManagement)
 *   7.  Open the Edit Modalities modal — data pre-loaded
 *   8.  Click "Edit Registration" → wizard opens at Info step with pre-filled values
 *   9.  Proceed past Info → Modalities step shows Kata pre-loaded → add Kumite
 *   10. Both modalities appear in active tournament
 *   11. Open Edit modal again — remove Kata (staged) → Save Changes
 *   12. Kata no longer shown in active tournament
 *   13. Open Edit modal again — only Kumite shown
 *   14. Click "Edit Registration" → wizard opens at Info step → proceed to Modalities
 *   15. Click "Save Changes" → Review step → Confirm & Save → success
 *   16. Navigate to active tournaments — Kumite registration confirmed
 *   17. Cancel participation in the tournament
 *   18. Tournament is available again in search
 */

import { test, expect, Page } from '@playwright/test';

// ── Slow down for human-readable video ───────────────────────────────────────

test.use({
  launchOptions: { slowMo: 600 },
  viewport:      { width: 1280, height: 800 },
  video:         'on',
  screenshot:    'on',
});

const PAUSE = {
  short:  800,
  medium: 1500,
  long:   2500,
};

// ── Test user ─────────────────────────────────────────────────────────────────

const KYOKUSHIN_USER = {
  id:           'kyo-full-flow-user',
  email:        'kenji.full@test.example.com',
  passwordHash: 'abc123',
  role:         'athlete',
  fullName:     'Kenji Sato',
  country:      'Japón',
  age:          '25',
  gender:       'Masculino',
  academy:      'Dojo Kyokushin',
  weight:       '75',
  beltGrade:    '3° Kyu',
  createdAt:    '2026-01-01T00:00:00.000Z',
  synced:       false,
};

async function injectUser(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
  }, KYOKUSHIN_USER);
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

// ── Test ──────────────────────────────────────────────────────────────────────

test.setTimeout(600000);

test('full tournament registration lifecycle', async ({ page }) => {

  await injectUser(page);

  // ── Step 1: Sign in ─────────────────────────────────────────────────────────
  await page.goto('/screens/MainScreen');
  await page.locator('[data-testid="main-screen"]').last().waitFor({ state: 'visible', timeout: 20000 });
  await expect(page.getByText(KYOKUSHIN_USER.fullName).first()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 2: Browse to Kyokushin tournament (id=3, has Kata + Kumite) ─────────
  await page.locator('[data-testid="nav-search"]').last().click();
  await page.locator('[data-testid="tournament-search-screen"]').last().waitFor({ state: 'visible', timeout: 10000 });
  await expect(page.locator('[data-testid="tournament-tile-3"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="tournament-tile-3"]').click();
  await page.locator('[data-testid="tournament-detail-screen"]').last().waitFor({ state: 'visible', timeout: 10000 });
  await expect(page.locator('[data-testid="detail-name"]')).toContainText('Kyokushin');
  await page.waitForTimeout(PAUSE.long);

  // ── Step 3: Start registration wizard — Info step ────────────────────────────
  await page.locator('[data-testid="btn-syncup-tournament"]').click();
  await page.locator('#academy-input').last().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(PAUSE.medium);

  // Academy pre-filled from user profile
  expect(await getInputValue(page, 'academy-input')).toBe(KYOKUSHIN_USER.academy);
  await page.waitForTimeout(PAUSE.long);

  await setSelect(page, 'grade-input', '3° Kyu');
  await page.waitForTimeout(PAUSE.medium);

  await page.getByRole('button', { name: /siguiente/i }).click();
  await page.locator('[data-testid="modality-grid"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  await expect(page.locator('[data-testid="modality-tile-kata"]')).toBeVisible();
  await expect(page.locator('[data-testid="modality-tile-kumite"]')).toBeVisible();

  await page.locator('[data-testid="modality-tile-kata"]').click();
  await page.waitForTimeout(PAUSE.medium);

  // ── Step 4: Decline to add another — complete with just Kata ─────────────────
  await page.locator('[data-testid="btn-finish-now"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await expect(page.locator('[data-testid="btn-add-another"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // New registration path: btn-finish-now saves directly (no review step)
  await page.locator('[data-testid="btn-finish-now"]').last().click();

  await page.locator('[data-testid="success-message"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.getByText(/Inscripción Exitosa/)).toBeVisible();
  await expect(page.locator('[data-testid="success-message"]').getByText('Kata')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 5: Tournament appears in active tournaments on MainScreen ────────────
  await page.locator('[data-testid="btn-volver-inicio"]').click();
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  const mainScreen = page.locator('[data-testid="main-screen"]').last();
  await mainScreen.waitFor({ state: 'visible', timeout: 10000 });
  await expect(mainScreen.getByText('Copa Centroamericana Kyokushin 2026')).toBeVisible();
  await expect(mainScreen.getByText('Kata').first()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 6: Navigate to active tournaments ────────────────────────────────────
  await page.locator('[data-testid="nav-management"]').last().click();
  await page.waitForURL('**/TournamentManagement', { timeout: 10000 });
  const mgmt6 = page.locator('[data-testid="tournament-management-screen"]').last();
  await mgmt6.waitFor({ state: 'visible', timeout: 10000 });

  await expect(mgmt6.locator('[data-testid="registration-list"]')).toBeVisible();
  await expect(mgmt6.locator('[data-testid="modality-entry-0-0"]').getByText('Kata')).toBeVisible();
  await expect(mgmt6.locator('[data-testid="modality-entry-0-1"]')).not.toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 7: Open Edit Modalities modal — Kata pre-loaded ─────────────────────
  await mgmt6.locator('[data-testid="btn-edit-reg-0"]').click();
  await page.locator('[data-testid="btn-edit-registration"]').last().waitFor({ state: 'visible', timeout: 10000 });

  // Modal shows Kata with a staged-remove button
  await expect(page.locator('[data-testid="edit-modal-item-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-staged-remove-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-edit-modal-back"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-edit-modal-save"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-edit-registration"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 8: Click "Edit Registration" → wizard opens at Info step ─────────────
  await page.locator('[data-testid="btn-edit-registration"]').last().click();
  await page.waitForURL('**/FormScreen**', { timeout: 15000 });

  // Wizard now opens at Info step with academy/grade pre-filled from saved registration
  await page.locator('#academy-input').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.medium);

  expect(await getInputValue(page, 'academy-input')).toBe(KYOKUSHIN_USER.academy);
  expect(await getInputValue(page, 'grade-input')).toBe('3° Kyu');
  await page.waitForTimeout(PAUSE.long);

  // Advance past Info step
  await page.getByRole('button', { name: /siguiente/i }).last().click();

  // ── Step 8 continued: Modalities step shows Kata pre-loaded ───────────────────
  await page.locator('text=Gestiona tus Modalidades').last().waitFor({ state: 'visible', timeout: 10000 });

  await expect(page.locator('[data-testid="btn-remove-modality-0"]')).toBeVisible();
  await expect(page.getByText('Kata').last()).toBeVisible();
  await expect(page.locator('[data-testid="btn-add-another"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 9: Add Kumite modality ───────────────────────────────────────────────
  await page.locator('[data-testid="btn-add-another"]').last().click();

  await page.locator('[data-testid="modality-tile-kumite"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.locator('[data-testid="modality-tile-kata"]').last()).not.toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="modality-tile-kumite"]').last().click();

  await page.locator('[data-testid="weight-grid"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="weight-tile-w70_80"]').last().click();

  // All modalities exhausted → auto-saves directly → success (no review step on this path)
  await page.locator('[data-testid="success-message"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.getByText(/Inscripción Actualizada/)).toBeVisible();
  await expect(page.locator('[data-testid="success-message"]').getByText('Kata')).toBeVisible();
  await expect(page.locator('[data-testid="success-message"]').getByText('Kumite')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 10: Both modalities visible in active tournament ─────────────────────
  await page.locator('[data-testid="btn-volver-inicio"]').click();
  await page.waitForURL('**/TournamentManagement', { timeout: 15000 });
  const mgmt10 = page.locator('[data-testid="tournament-management-screen"]').last();
  await mgmt10.waitFor({ state: 'visible', timeout: 10000 });

  await expect(mgmt10.locator('[data-testid="modality-entry-0-0"]').getByText('Kata')).toBeVisible();
  await expect(mgmt10.locator('[data-testid="modality-entry-0-1"]').getByText('Kumite')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 11: Open Edit modal — remove Kata (staged) → Save Changes ───────────
  await mgmt10.locator('[data-testid="btn-edit-reg-0"]').click();
  await page.locator('[data-testid="btn-edit-registration"]').last().waitFor({ state: 'visible', timeout: 10000 });

  // Both Kata (0) and Kumite (1) shown with staged-remove buttons
  await expect(page.locator('[data-testid="edit-modal-item-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="edit-modal-item-1"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // Remove Kata (index 0 — it's the first/oldest entry)
  await page.locator('[data-testid="btn-staged-remove-0"]').last().click();
  await page.waitForTimeout(PAUSE.medium);

  // Only one item remains (Kumite at index 0 after re-render)
  await expect(page.locator('[data-testid="edit-modal-item-1"]')).not.toBeVisible();
  await page.waitForTimeout(PAUSE.medium);

  // Save the staged deletion
  await page.locator('[data-testid="btn-edit-modal-save"]').last().click();
  await page.waitForTimeout(PAUSE.medium);

  // ── Step 12: Kata no longer shown in active tournament ─────────────────────────
  await expect(mgmt10).toBeVisible({ timeout: 8000 });

  await expect(mgmt10.locator('[data-testid="modality-entry-0-0"]').getByText('Kumite')).toBeVisible();
  await expect(mgmt10.locator('[data-testid="modality-entry-0-1"]')).not.toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 13: Open Edit modal — only Kumite shown ─────────────────────────────
  await mgmt10.locator('[data-testid="btn-edit-reg-0"]').click();
  await page.locator('[data-testid="btn-edit-registration"]').last().waitFor({ state: 'visible', timeout: 10000 });

  // Only Kumite remains
  await expect(page.locator('[data-testid="edit-modal-item-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="edit-modal-item-1"]')).not.toBeVisible();
  await expect(page.getByText('Kumite').last()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 14: Click "Edit Registration" → wizard opens at Info step ────────────
  await page.locator('[data-testid="btn-edit-registration"]').last().click();
  await page.waitForURL('**/FormScreen**', { timeout: 15000 });

  // Wizard opens at Info step — academy and grade pre-filled
  await page.locator('#academy-input').last().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(PAUSE.medium);

  expect(await getInputValue(page, 'academy-input')).toBe(KYOKUSHIN_USER.academy);
  expect(await getInputValue(page, 'grade-input')).toBe('3° Kyu');
  await page.waitForTimeout(PAUSE.long);

  // Advance past Info step
  await page.getByRole('button', { name: /siguiente/i }).last().click();

  // Modalities step — Kumite shown, Kata still available to add
  await page.locator('text=Gestiona tus Modalidades').last().waitFor({ state: 'visible', timeout: 10000 });

  await expect(page.locator('[data-testid="btn-remove-modality-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-remove-modality-1"]').last()).not.toBeVisible();
  await expect(page.locator('[data-testid="btn-add-another"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-finish-now"]')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 15: Save from wizard → Review step → Confirm & Save → success ────────
  await page.locator('[data-testid="btn-finish-now"]').last().click();

  // In edit mode, btn-finish-now routes to the Review confirmation step
  await page.locator('[data-testid="btn-review-confirm"]').last().waitFor({ state: 'visible', timeout: 8000 });

  // Review step shows the modality (Kumite) with its remove button disabled (only 1)
  await expect(page.locator('[data-testid="btn-review-remove-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="btn-review-remove-0"]')).toBeDisabled();
  await page.waitForTimeout(PAUSE.long);

  // Confirm and save
  await page.locator('[data-testid="btn-review-confirm"]').last().click();

  await page.locator('[data-testid="success-message"]').last().waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.getByText(/Inscripción Actualizada/)).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 16: Active tournaments — Kumite confirmed ────────────────────────────
  await page.locator('[data-testid="btn-volver-inicio"]').click();
  await page.waitForURL('**/TournamentManagement', { timeout: 15000 });
  const mgmt16 = page.locator('[data-testid="tournament-management-screen"]').last();
  await mgmt16.waitFor({ state: 'visible', timeout: 10000 });

  await expect(mgmt16.locator('[data-testid="registration-list"]')).toBeVisible();
  await expect(mgmt16.locator('[data-testid="modality-entry-0-0"]').getByText('Kumite')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  // ── Step 17: Cancel participation ────────────────────────────────────────────
  await mgmt16.locator('[data-testid="btn-cancel-reg-0"]').click();

  await page.locator('[data-testid="btn-confirm-cancel"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await expect(mgmt16.getByText('Copa Centroamericana Kyokushin 2026').first()).toBeVisible();
  await page.waitForTimeout(PAUSE.long);

  await page.locator('[data-testid="btn-confirm-cancel"]').last().click();
  await page.waitForTimeout(PAUSE.medium);

  await expect(mgmt16.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(PAUSE.long);

  // ── Step 18: Tournament available again in search ─────────────────────────────
  await page.goto('/screens/TournamentSearch');
  const searchScreen = page.locator('[data-testid="tournament-search-screen"]').last();
  await searchScreen.waitFor({ state: 'visible', timeout: 15000 });

  await expect(searchScreen.locator('[data-testid="tournament-tile-3"]')).toBeVisible();
  await expect(searchScreen.locator('[data-testid="enrolled-badge-3"]')).not.toBeVisible();
  await expect(searchScreen.locator('[data-testid="tournament-tile-3"]').getByRole('button')).toBeVisible();
  await page.waitForTimeout(PAUSE.long);
});
