/**
 * e2e/add-organizations.spec.ts
 *
 * Tests for OrganizationsScreen (admin-only):
 *   1. Admin can add an organization and see it in the list
 *   2. Admin can edit an organization
 *   3. Admin can delete an organization (empty state after)
 *   4. Athlete is redirected away
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_USER = {
  id: 'admin-org-test', email: 'admin.org@test.example.com', passwordHash: 'abc123',
  role: 'admin', fullName: 'Admin Org', country: 'CR', age: '30', gender: 'Masculino',
  academy: '', weight: '', beltGrade: '', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const ATHLETE_USER = {
  id: 'athlete-org-test', email: 'athlete.org@test.example.com', passwordHash: 'abc123',
  role: 'athlete', fullName: 'Athlete Org', country: 'CR', age: '22', gender: 'Femenino',
  academy: 'Dojo', weight: '55', beltGrade: '5° Kyu', createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

const SEED_ART = {
  id: 'art-karate-org-test', name: 'Karate', logo: '🥋',
  createdAt: '2026-01-01T00:00:00.000Z', synced: false,
};

async function injectAdmin(page: Page) {
  await page.addInitScript(({ user, art }) => {
    localStorage.setItem('db:users',         JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([]));
    localStorage.setItem('db:martial_arts',  JSON.stringify([art]));
    localStorage.setItem('db:organizations', JSON.stringify([]));
  }, { user: ADMIN_USER, art: SEED_ART });
}

async function injectAthlete(page: Page) {
  await page.addInitScript(({ user, art }) => {
    localStorage.setItem('db:users',         JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations', JSON.stringify([]));
    localStorage.setItem('db:martial_arts',  JSON.stringify([art]));
    localStorage.setItem('db:organizations', JSON.stringify([]));
  }, { user: ATHLETE_USER, art: SEED_ART });
}

const ORG_URL = '/screens/OrganizationsScreen';

test.setTimeout(120000);

test('admin: add, edit, and delete an organization', async ({ page }) => {
  await injectAdmin(page);
  await page.goto(ORG_URL);

  const screen = page.locator('[data-testid="organizations-screen"]').last();
  await screen.waitFor({ state: 'visible', timeout: 20000 });

  // ── Empty state ──────────────────────────────────────────────────────────────
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

  // ── Add an organization ───────────────────────────────────────────────────────
  await page.locator('[data-testid="input-new-name"]').last().fill('World Karate Federation');
  await page.locator('[data-testid="input-new-acronym"]').last().fill('WKF');
  await page.locator('[data-testid="input-new-description"]').last().fill('Global governing body for karate.');

  // Select the seeded martial art
  await page.locator('[data-testid="input-new-martial-art"]').last().selectOption({ value: SEED_ART.id });

  await page.locator('[data-testid="btn-add-org"]').click();

  // Org appears in list
  const list = page.locator('[data-testid="organizations-list"]');
  await list.waitFor({ state: 'visible', timeout: 8000 });
  await expect(page.locator('[data-testid="empty-state"]')).not.toBeVisible();

  // Name visible
  const orgCard = page.locator('[data-testid^="org-card-"]').first();
  await expect(orgCard).toBeVisible();
  await expect(page.locator('[data-testid^="org-name-"]').first()).toContainText('World Karate Federation');

  // Acronym chip visible
  await expect(page.locator('[data-testid^="org-acronym-"]').first()).toContainText('WKF');

  // Martial art badge visible
  await expect(page.locator('[data-testid^="org-art-"]').first()).toContainText('Karate');

  // ── Edit the organization ─────────────────────────────────────────────────────
  await page.locator('[data-testid^="btn-edit-"]').first().click();
  await page.locator('[data-testid="input-edit-name"]').last().waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-testid="input-edit-name"]').last().fill('WKF Internacional');
  await page.locator('[data-testid="btn-save-edit"]').last().click();

  await expect(page.locator('[data-testid^="org-name-"]').first()).toContainText('WKF Internacional', { timeout: 5000 });
  await expect(page.locator('[data-testid="input-edit-name"]')).not.toBeVisible();

  // ── Delete the organization → empty state ─────────────────────────────────────
  await page.locator('[data-testid^="btn-delete-"]').first().click();
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5000 });
});

test('athlete: redirected away from OrganizationsScreen', async ({ page }) => {
  await injectAthlete(page);
  await page.goto(ORG_URL);
  await page.waitForURL('**/MainScreen', { timeout: 15000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 10000 });
});
