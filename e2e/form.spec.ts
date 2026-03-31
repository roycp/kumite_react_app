import { expect, test, Page } from '@playwright/test';

// Use DOM evaluate for fills — Playwright fill() is unreliable with Expo web static output
async function typeInto(page: Page, id: string, text: string) {
  await page.evaluate(({ id, text }) => {
    const el = document.getElementById(id) as HTMLInputElement;
    if (el) { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); }
  }, { id, text });
}

async function selectDropdown(page: Page, id: string, option: string) {
  await page.evaluate(({ id, option }) => {
    const el = document.getElementById(id) as HTMLSelectElement;
    if (el) { el.value = option; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, { id, option });
}

async function clickButton(page: Page, name: RegExp) {
  await page.evaluate((nameStr) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => nameStr.test(b.textContent || ''));
    if (btn) btn.scrollIntoView({ block: 'center' });
  }, name);
  await page.waitForTimeout(200);
  const btn = page.getByRole('button', { name });
  await btn.click({ force: true });
}

async function expectFieldError(page: Page, testId: string, message: string) {
  const el = page.locator(`[data-testid="${testId}-error"]`).first();
  await expect(el).toHaveText(message, { timeout: 8000 });
}

// Spanish option values (form uses Spanish)
const validForm = {
  fullName:     'Roy Cruz',
  email:        'roy@example.com',
  country:      'Costa Rica',
  age:          '25',
  gender:       'Masculino',
  academy:      'Team Ares',
  weight:       '75',
  athleteGrade: 'Azul',
  categoryType: 'Gi',
  eventName:    'Campeonato Nacional 2026',
  coachName:    'Coach Silva',
};

async function fillFullForm(page: Page) {
  await typeInto(page, 'fullName-input',  validForm.fullName);
  await typeInto(page, 'email-input',     validForm.email);
  await typeInto(page, 'country-input',   validForm.country);
  await typeInto(page, 'age-input',       validForm.age);
  await typeInto(page, 'academy-input',   validForm.academy);
  await typeInto(page, 'weight-input',    validForm.weight);
  await typeInto(page, 'eventName-input', validForm.eventName);
  await typeInto(page, 'coachName-input', validForm.coachName);
  await selectDropdown(page, 'gender-input',       validForm.gender);
  await selectDropdown(page, 'athleteGrade-input', validForm.athleteGrade);
  await selectDropdown(page, 'categoryType-input', validForm.categoryType);
}

test.describe('Tournament Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/screens/FormScreen');
    await page.waitForSelector('#fullName-input', { timeout: 30000 });
    await page.waitForTimeout(500); // let useEffect pre-fill settle
  });

  test('should load the form with all fields', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

    await expect(page.getByText('🏆 Inscripción al Torneo').first()).toBeVisible();
    await expect(page.getByText('Formulario de Inscripción de Atleta')).toBeVisible();
    await expect(page.getByText('INFORMACIÓN DEL ATLETA')).toBeVisible();
    await expect(page.getByText('DETALLES DE INSCRIPCIÓN')).toBeVisible();
    await expect(page.getByText('EVENTO Y ENTRENADOR')).toBeVisible();

    for (const id of [
      'fullName-input','email-input','country-input','age-input',
      'gender-input','academy-input','weight-input',
      'athleteGrade-input','categoryType-input',
      'eventName-input','coachName-input',
    ]) {
      await expect(page.locator(`#${id}`).first()).toBeVisible();
    }

    await expect(page.getByRole('button', { name: /registrar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /limpiar/i })).toBeVisible();
    expect(jsErrors).toHaveLength(0);
  });

  test('should fill all fields and submit successfully', async ({ page }) => {
    await fillFullForm(page);

    // Verify via DOM (not fill/toHaveValue which is unreliable with Expo web)
    const fullNameVal = await page.evaluate(() => (document.getElementById('fullName-input') as HTMLInputElement)?.value);
    const emailVal    = await page.evaluate(() => (document.getElementById('email-input') as HTMLInputElement)?.value);
    const genderVal   = await page.evaluate(() => (document.getElementById('gender-input') as HTMLSelectElement)?.value);
    expect(fullNameVal).toBe(validForm.fullName);
    expect(emailVal).toBe(validForm.email);
    expect(genderVal).toBe(validForm.gender);

    await clickButton(page, /registrar/i);
    await expect(page.getByTestId('success-message')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('✓ Athlete registered successfully!')).toBeVisible();
  });

  test('should show validation errors for all empty required fields', async ({ page }) => {
    await clickButton(page, /registrar/i);

    await expectFieldError(page, 'fullName-input',     'Full name is required');
    await expectFieldError(page, 'email-input',        'Email is required');
    await expectFieldError(page, 'country-input',      'Country is required');
    await expectFieldError(page, 'age-input',          'Age is required');
    await expectFieldError(page, 'gender-input',       'Gender is required');
    await expectFieldError(page, 'academy-input',      'Academy is required');
    await expectFieldError(page, 'weight-input',       'Weight is required');
    await expectFieldError(page, 'athleteGrade-input', 'Grade is required');
    await expectFieldError(page, 'categoryType-input', 'Category type is required');
    await expectFieldError(page, 'eventName-input',    'Event name is required');
    await expectFieldError(page, 'coachName-input',    'Coach name is required');
  });

  test('should reset the form and allow re-submission', async ({ page }) => {
    await typeInto(page, 'fullName-input', 'Initial Name');
    await typeInto(page, 'academy-input',  'Initial Academy');

    await clickButton(page, /limpiar/i);
    await page.waitForTimeout(300);

    const fullNameVal = await page.evaluate(() => (document.getElementById('fullName-input') as HTMLInputElement)?.value);
    const academyVal  = await page.evaluate(() => (document.getElementById('academy-input') as HTMLInputElement)?.value);
    expect(fullNameVal).toBe('');
    expect(academyVal).toBe('');

    await fillFullForm(page);
    await clickButton(page, /registrar/i);
    await expect(page.getByTestId('success-message')).toBeVisible({ timeout: 8000 });
  });
});
