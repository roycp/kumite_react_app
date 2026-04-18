/**
 * e2e/migrate-db-to-server.spec.ts
 *
 * Verifies that database.web.ts now proxies all collection operations through
 * the Node.js server instead of AsyncStorage.
 *
 * Strategy: call the server REST API directly using the Playwright `request`
 * fixture (no browser needed for most tests). This proves the endpoints the
 * new database.web.ts delegates to are working correctly.
 *
 * A small set of UI smoke tests confirm key screens render with server data.
 *
 * Prerequisites: server running on http://localhost:3001
 */

import { test, expect, Page } from '@playwright/test';

const SERVER = 'http://localhost:3001';

async function adminToken(request: any): Promise<string> {
  const res = await request.post(`${SERVER}/api/auth/login`, {
    data: { email: 'admin@kumite.app', password: 'Admin@1234' },
  });
  const body = await res.json();
  return body.token as string;
}

async function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function injectJwt(page: Page, token: string) {
  await page.addInitScript(
    ([key, val]: [string, string]) => localStorage.setItem(key, val),
    ['session:jwt', token],
  );
}

test.setTimeout(120_000);

// ── Users ────────────────────────────────────────────────────────────────────

test('getAllUsers — returns array with id field (not _id)', async ({ request }) => {
  const token = await adminToken(request);
  const res = await request.get(`${SERVER}/api/users`, {
    headers: await authHeaders(token),
  });
  expect(res.status()).toBe(200);
  const users = await res.json();
  expect(Array.isArray(users)).toBe(true);
  expect(users.length).toBeGreaterThan(0);
  expect(users[0]).toHaveProperty('id');
  expect(users[0]).not.toHaveProperty('_id');
});

test('getUserByEmail — filters by ?email= query param', async ({ request }) => {
  const token = await adminToken(request);
  const res = await request.get(`${SERVER}/api/users?email=admin%40kumite.app`, {
    headers: await authHeaders(token),
  });
  const users = await res.json();
  expect(users.length).toBeGreaterThanOrEqual(1);
  expect(users[0].email).toBe('admin@kumite.app');
});

test('getAllAthletes — filters by ?role=athlete', async ({ request }) => {
  const token = await adminToken(request);

  // Create a test athlete first so there is at least one
  const regRes = await request.post(`${SERVER}/api/auth/register`, {
    data: {
      email: `athlete-filter-${Date.now()}@kumite.test`,
      password: 'Test@1234',
      fullName: 'Filter Athlete',
      role: 'athlete',
    },
  });
  expect(regRes.status()).toBe(201);

  const res = await request.get(`${SERVER}/api/users?role=athlete`, {
    headers: await authHeaders(token),
  });
  const athletes = await res.json();
  expect(Array.isArray(athletes)).toBe(true);
  expect(athletes.every((u: any) => u.role === 'athlete')).toBe(true);
});

test('updateUser — PATCH /api/users/:id updates a field', async ({ request }) => {
  const token = await adminToken(request);

  // Create user to update
  const regRes = await request.post(`${SERVER}/api/auth/register`, {
    data: {
      email: `update-user-${Date.now()}@kumite.test`,
      password: 'Test@1234',
      fullName: 'Before Update',
      role: 'athlete',
    },
  });
  const { user } = await regRes.json();

  const patchRes = await request.patch(`${SERVER}/api/users/${user.id}`, {
    headers: await authHeaders(token),
    data: { fullName: 'After Update' },
  });
  expect(patchRes.status()).toBe(200);

  const check = await request.get(`${SERVER}/api/users/${user.id}`, {
    headers: await authHeaders(token),
  });
  const updated = await check.json();
  expect(updated.fullName).toBe('After Update');
});

// ── Registrations ────────────────────────────────────────────────────────────

test('addRegistration / getRegistrationsByTournamentId round-trip', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  // Need a tournament first
  const tRes = await request.post(`${SERVER}/api/tournaments`, {
    headers,
    data: {
      name: `Reg-Test-${Date.now()}`,
      date: '2026-12-01',
      location: 'Test City',
      logo: '',
      description: '',
      status: 'upcoming',
      martialArtIds: [],
      registrationStart: null,
      registrationEnd: null,
      registrationForceOpen: null,
      templateId: null,
    },
  });
  const tournament = await tRes.json();
  expect(tRes.status()).toBe(201);

  // Register an athlete
  const regRes = await request.post(`${SERVER}/api/registrations`, {
    headers,
    data: {
      userId: 'user-123',
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      athleteName: 'Test Athlete',
      email: 'test@kumite.test',
      modalities: [],
      timestamp: new Date().toISOString(),
    },
  });
  expect(regRes.status()).toBe(201);
  const reg = await regRes.json();
  expect(reg).toHaveProperty('id');

  // Fetch by tournamentId
  const listRes = await request.get(
    `${SERVER}/api/registrations?tournamentId=${tournament.id}`,
    { headers },
  );
  const list = await listRes.json();
  expect(Array.isArray(list)).toBe(true);
  expect(list.some((r: any) => r.id === reg.id)).toBe(true);

  // Cleanup
  await request.delete(`${SERVER}/api/registrations/${reg.id}`, { headers });
  await request.delete(`${SERVER}/api/tournaments/${tournament.id}`, { headers });
});

// ── Martial Arts ─────────────────────────────────────────────────────────────

test('martial arts CRUD — create, read, update, delete', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const createRes = await request.post(`${SERVER}/api/martial-arts`, {
    headers,
    data: { name: `TestArt-${Date.now()}`, logo: '' },
  });
  expect(createRes.status()).toBe(201);
  const art = await createRes.json();
  expect(art).toHaveProperty('id');
  expect(art).not.toHaveProperty('_id');

  const patchRes = await request.patch(`${SERVER}/api/martial-arts/${art.id}`, {
    headers,
    data: { name: 'Updated Art' },
  });
  expect(patchRes.status()).toBe(200);

  const delRes = await request.delete(`${SERVER}/api/martial-arts/${art.id}`, { headers });
  expect(delRes.status()).toBe(204);

  const listRes = await request.get(`${SERVER}/api/martial-arts`, { headers });
  const arts = await listRes.json();
  expect(arts.some((a: any) => a.id === art.id)).toBe(false);
});

// ── Rank Systems ─────────────────────────────────────────────────────────────

test('rank systems — create and filter by martialArtId', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const artRes = await request.post(`${SERVER}/api/martial-arts`, {
    headers,
    data: { name: `RankArt-${Date.now()}`, logo: '' },
  });
  const art = await artRes.json();

  const rankRes = await request.post(`${SERVER}/api/rank-systems`, {
    headers,
    data: {
      martialArtId: art.id,
      name: 'White Belt',
      description: '',
      rank: 1,
      classification: 'beginner',
      applicableTo: 'both',
    },
  });
  expect(rankRes.status()).toBe(201);
  const rank = await rankRes.json();
  expect(rank.martialArtId).toBe(art.id);

  const filterRes = await request.get(
    `${SERVER}/api/rank-systems?martialArtId=${art.id}`,
    { headers },
  );
  const ranks = await filterRes.json();
  expect(ranks.some((r: any) => r.id === rank.id)).toBe(true);

  // Cleanup
  await request.delete(`${SERVER}/api/rank-systems/${rank.id}`, { headers });
  await request.delete(`${SERVER}/api/martial-arts/${art.id}`, { headers });
});

// ── Tournaments ───────────────────────────────────────────────────────────────

test('tournaments — create, getTournamentById, update, delete', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const createRes = await request.post(`${SERVER}/api/tournaments`, {
    headers,
    data: {
      name: `T-${Date.now()}`,
      date: '2026-06-01',
      location: 'Arena',
      logo: '',
      description: 'desc',
      status: 'upcoming',
      martialArtIds: [],
      registrationStart: null,
      registrationEnd: null,
      registrationForceOpen: null,
      templateId: null,
    },
  });
  expect(createRes.status()).toBe(201);
  const t = await createRes.json();

  const getRes = await request.get(`${SERVER}/api/tournaments/${t.id}`, { headers });
  expect(getRes.status()).toBe(200);
  const got = await getRes.json();
  expect(got.id).toBe(t.id);

  await request.patch(`${SERVER}/api/tournaments/${t.id}`, {
    headers,
    data: { status: 'active' },
  });
  const after = await (await request.get(`${SERVER}/api/tournaments/${t.id}`, { headers })).json();
  expect(after.status).toBe('active');

  await request.delete(`${SERVER}/api/tournaments/${t.id}`, { headers });
});

// ── Bracket Seeds ─────────────────────────────────────────────────────────────

test('bracket seeds — PUT then GET persists seeds', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const tRes = await request.post(`${SERVER}/api/tournaments`, {
    headers,
    data: {
      name: `Bracket-${Date.now()}`,
      date: '2026-07-01',
      location: 'Test',
      logo: '',
      description: '',
      status: 'upcoming',
      martialArtIds: [],
      registrationStart: null,
      registrationEnd: null,
      registrationForceOpen: null,
      templateId: null,
    },
  });
  const t = await tRes.json();

  const seeds = { 'kata-male': ['user-1', 'user-2'], 'kumite-female': ['user-3'] };
  const putRes = await request.put(`${SERVER}/api/bracket-seeds/${t.id}`, {
    headers,
    data: { seeds },
  });
  expect(putRes.status()).toBe(200);

  const getRes = await request.get(`${SERVER}/api/bracket-seeds/${t.id}`, { headers });
  const body = await getRes.json();
  expect(body.seeds['kata-male']).toEqual(['user-1', 'user-2']);
  expect(body.seeds['kumite-female']).toEqual(['user-3']);

  await request.delete(`${SERVER}/api/tournaments/${t.id}`, { headers });
});

// ── Weigh-In Results ──────────────────────────────────────────────────────────

test('weigh-in results — POST then GET by tournamentId', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const tRes = await request.post(`${SERVER}/api/tournaments`, {
    headers,
    data: {
      name: `WeighIn-${Date.now()}`,
      date: '2026-08-01',
      location: 'Gym',
      logo: '',
      description: '',
      status: 'upcoming',
      martialArtIds: [],
      registrationStart: null,
      registrationEnd: null,
      registrationForceOpen: null,
      templateId: null,
    },
  });
  const t = await tRes.json();

  const wiRes = await request.post(`${SERVER}/api/weigh-in-results`, {
    headers,
    data: {
      tournamentId: t.id,
      registrationId: 'reg-abc',
      athleteName: 'Joe Athlete',
      discipline: 'Kumite',
      weightDivision: '-70kg',
      actualWeightKg: 68.5,
      status: 'meets_weight',
      timestamp: new Date().toISOString(),
    },
  });
  expect(wiRes.status()).toBe(201);
  const wi = await wiRes.json();
  expect(wi).toHaveProperty('id');

  const listRes = await request.get(
    `${SERVER}/api/weigh-in-results?tournamentId=${t.id}`,
    { headers },
  );
  const results = await listRes.json();
  expect(results.some((r: any) => r.id === wi.id)).toBe(true);

  await request.delete(`${SERVER}/api/tournaments/${t.id}`, { headers });
});

// ── Role Definitions ──────────────────────────────────────────────────────────

test('role definitions CRUD', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const createRes = await request.post(`${SERVER}/api/role-definitions`, {
    headers,
    data: {
      name: `test-role-${Date.now()}`,
      displayName: 'Test Role',
      permissions: ['view_tournaments'],
    },
  });
  expect(createRes.status()).toBe(201);
  const role = await createRes.json();
  expect(role).toHaveProperty('id');

  await request.patch(`${SERVER}/api/role-definitions/${role.id}`, {
    headers,
    data: { displayName: 'Updated Role' },
  });

  await request.delete(`${SERVER}/api/role-definitions/${role.id}`, { headers });

  const listRes = await request.get(`${SERVER}/api/role-definitions`, { headers });
  const list = await listRes.json();
  expect(list.some((r: any) => r.id === role.id)).toBe(false);
});

// ── Coach Assignments ─────────────────────────────────────────────────────────

test('coach assignments — assign, fetch, duplicate 409, remove', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const coachId = `coach-${Date.now()}`;
  const athleteId = `athlete-${Date.now()}`;

  const assignRes = await request.post(`${SERVER}/api/coach-assignments`, {
    headers,
    data: { coachId, athleteId },
  });
  expect(assignRes.status()).toBe(201);
  const assignment = await assignRes.json();

  // Duplicate should 409
  const dupRes = await request.post(`${SERVER}/api/coach-assignments`, {
    headers,
    data: { coachId, athleteId },
  });
  expect(dupRes.status()).toBe(409);

  // Fetch by coachId
  const listRes = await request.get(
    `${SERVER}/api/coach-assignments?coachId=${coachId}`,
    { headers },
  );
  const list = await listRes.json();
  expect(list.some((a: any) => a.id === assignment.id)).toBe(true);

  // Delete
  const delRes = await request.delete(
    `${SERVER}/api/coach-assignments/${assignment.id}`,
    { headers },
  );
  expect(delRes.status()).toBe(204);
});

// ── User Martial Art Ranks ────────────────────────────────────────────────────

test('user martial art ranks — upsert and fetch by userId', async ({ request }) => {
  const token = await adminToken(request);
  const headers = await authHeaders(token);

  const userId = `u-${Date.now()}`;
  const martialArtId = `ma-${Date.now()}`;
  const rankSystemId = `rs-${Date.now()}`;

  const postRes = await request.post(`${SERVER}/api/user-martial-art-ranks`, {
    headers,
    data: { userId, martialArtId, rankSystemId },
  });
  expect([200, 201]).toContain(postRes.status());

  // Upsert again (same userId+martialArtId) — should not duplicate
  await request.post(`${SERVER}/api/user-martial-art-ranks`, {
    headers,
    data: { userId, martialArtId, rankSystemId: `rs2-${Date.now()}` },
  });

  const listRes = await request.get(
    `${SERVER}/api/user-martial-art-ranks?userId=${userId}`,
    { headers },
  );
  const list = await listRes.json();
  expect(list.length).toBe(1); // upsert — only one record per userId+martialArtId
});

// ── UI Smoke — MainScreen renders with server data ────────────────────────────

test('MainScreen renders tournament list after JWT login', async ({ page, request }) => {
  const token = await adminToken(request);
  await injectJwt(page, token);

  await page.goto('/');
  await page.waitForURL('**/MainScreen', { timeout: 30_000 });
  await expect(page.locator('[data-testid="main-screen"]').last()).toBeVisible({ timeout: 15_000 });
});

test('AsyncStorage no longer contains db:* keys after app load', async ({ page, request }) => {
  const token = await adminToken(request);
  await injectJwt(page, token);

  await page.goto('/');
  await page.waitForURL('**/MainScreen', { timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  // Give screens a moment to render (which previously would have written db:* keys)
  await page.waitForTimeout(2000);

  const dbKeys = await page.evaluate(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('db:')) keys.push(k);
    }
    return keys;
  });

  expect(dbKeys).toHaveLength(0);
});
