import { expect, test, Page } from '@playwright/test';

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

// ── Tournament 4 = Central America Gi Open (BJJ, has categories) ──────────────

test.describe('Registration Wizard — tournament WITH categories (BJJ)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/FormScreen?tournamentId=4&tournamentName=Central%20America%20Gi%20Open');
    await page.waitForSelector('#academy-input', { timeout: 30000 });
    await page.waitForTimeout(300);
  });

  test('should load Step 1 with pre-filled academy and grade', async ({ page }) => {
    await expect(page.locator('#academy-input')).toBeVisible();
    await expect(page.locator('#grade-input')).toBeVisible();
    await expect(page.getByText(/Central America Gi Open/)).toBeVisible();

    const academyVal = await page.evaluate(() => (document.getElementById('academy-input') as HTMLInputElement)?.value);
    const gradeVal   = await page.evaluate(() => (document.getElementById('grade-input')   as HTMLSelectElement)?.value);
    expect(academyVal).toBe('Team Ares');
    expect(gradeVal).toBe('Azul');
  });

  test('should advance to modality selection on next', async ({ page }) => {
    await page.getByRole('button', { name: /siguiente/i }).click();
    await expect(page.locator('[data-testid="modality-grid"]')).toBeVisible({ timeout: 8000 });
    // BJJ has only one discipline: Gi
    await expect(page.locator('[data-testid="modality-tile-gi"]')).toBeVisible();
  });

  test('should show weight grid after picking a weighted modality (Gi)', async ({ page }) => {
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('[data-testid="modality-tile-gi"]', { timeout: 8000 });
    await page.locator('[data-testid="modality-tile-gi"]').click();

    await expect(page.locator('[data-testid="weight-grid"]')).toBeVisible({ timeout: 5000 });
    // Athlete is 75 kg → tile w70_80 should be visible
    await expect(page.locator('[data-testid="weight-tile-w70_80"]')).toBeVisible();
  });

  test('should reach success after info → modality → weight → finish', async ({ page }) => {
    // Step 1 → modality
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('[data-testid="modality-tile-gi"]', { timeout: 8000 });

    // Pick Gi
    await page.locator('[data-testid="modality-tile-gi"]').click();

    // Pick weight (70-80 kg)
    await page.waitForSelector('[data-testid="weight-tile-w70_80"]', { timeout: 5000 });
    await page.locator('[data-testid="weight-tile-w70_80"]').click();

    // Only one modality → goes straight to success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Inscripción Exitosa/)).toBeVisible();
    await expect(page.locator('[data-testid="btn-volver-inicio"]')).toBeVisible();
  });

  test('should navigate back: weight → modality → info', async ({ page }) => {
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('[data-testid="modality-grid"]', { timeout: 8000 });
    await page.locator('[data-testid="modality-tile-gi"]').click();
    await page.waitForSelector('[data-testid="weight-grid"]', { timeout: 5000 });

    // Back from weight → modality
    await page.getByRole('button', { name: /atrás/i }).click();
    await expect(page.locator('[data-testid="modality-grid"]')).toBeVisible({ timeout: 5000 });

    // Back from modality → info
    await page.getByRole('button', { name: /atrás/i }).click();
    await expect(page.locator('#academy-input')).toBeVisible({ timeout: 5000 });
  });
});

// ── Tournament 3 = Kyokushin (has Kata + Kumite) ──────────────────────────────
// User beltGrade 'Azul' is NOT in Kyokushin grade list → modality screen won't
// match. We need a user with a Kyokushin grade. Override in this describe block.

async function injectAuthKyokushin(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'test-user-kyo', email: 'kyo@example.com', passwordHash: 'abc123',
      role: 'athlete', fullName: 'Kenji Sato', country: 'Japón',
      age: '25', gender: 'Masculino', academy: 'Dojo Kyokushin',
      weight: '75', beltGrade: '3° Kyu', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    localStorage.setItem('db:users', JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
  });
}

test.describe('Registration Wizard — Kyokushin (Kata + Kumite)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthKyokushin(page);
    await page.goto('/screens/FormScreen?tournamentId=3&tournamentName=Copa%20Centroamericana%20Kyokushin%202026');
    await page.waitForSelector('#academy-input', { timeout: 30000 });
    await page.waitForTimeout(300);
  });

  test('should show both Kata and Kumite modality tiles', async ({ page }) => {
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('[data-testid="modality-grid"]', { timeout: 8000 });

    await expect(page.locator('[data-testid="modality-tile-kata"]')).toBeVisible();
    await expect(page.locator('[data-testid="modality-tile-kumite"]')).toBeVisible();
  });

  test('Kata (no weight) → "another?" screen shown → can add Kumite', async ({ page }) => {
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('[data-testid="modality-grid"]', { timeout: 8000 });

    // Pick Kata (no weight)
    await page.locator('[data-testid="modality-tile-kata"]').click();

    // Should land on "another?" screen (not weight screen)
    await expect(page.locator('[data-testid="btn-add-another"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="btn-finish-now"]')).toBeVisible();

    // Say yes → pick Kumite
    await page.locator('[data-testid="btn-add-another"]').click();
    await page.waitForSelector('[data-testid="modality-tile-kumite"]', { timeout: 5000 });
    await page.locator('[data-testid="modality-tile-kumite"]').click();

    // Kumite has weight → pick a weight
    await page.waitForSelector('[data-testid="weight-grid"]', { timeout: 5000 });
    await page.locator('[data-testid="weight-tile-w70_80"]').click();

    // No more modalities → success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Inscripción Exitosa/)).toBeVisible();
  });

  test('finish after just Kata (no more) → success', async ({ page }) => {
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.waitForSelector('[data-testid="modality-grid"]', { timeout: 8000 });

    await page.locator('[data-testid="modality-tile-kata"]').click();

    // "another?" screen — choose to finish
    await page.locator('[data-testid="btn-finish-now"]').click();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 8000 });
  });
});

// ── Tournament 1 = Copa Nacional Kumite (no categories) ──────────────────────

test.describe('Registration Wizard — tournament WITHOUT categories', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/screens/FormScreen?tournamentId=1&tournamentName=Copa%20Nacional%20Kumite%202026');
    await page.waitForSelector('#academy-input', { timeout: 30000 });
    await page.waitForTimeout(300);
  });

  test('should show no grade select and go straight to success on next', async ({ page }) => {
    await expect(page.locator('#academy-input')).toBeVisible();
    await expect(page.locator('#grade-input')).not.toBeVisible();

    await page.getByRole('button', { name: /inscribirse/i }).click();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="btn-volver-inicio"]')).toBeVisible();
  });
});

// ── Auth guard ────────────────────────────────────────────────────────────────

test('Form auth guard: should redirect unauthenticated users to HomeScreen', async ({ browser }) => {
  const ctx = await browser.newContext();
  const pg  = await ctx.newPage();
  try {
    await pg.goto('http://localhost:8082/screens/FormScreen');
    await pg.waitForURL(/HomeScreen/, { timeout: 20000 });
    await expect(pg.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 15000 });
  } finally {
    await ctx.close();
  }
});
