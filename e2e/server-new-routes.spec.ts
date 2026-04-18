/**
 * e2e/server-new-routes.spec.ts
 *
 * Verifies the new server routes added in ticket 01:
 *   - coach-assignments (CRUD + duplicate 409)
 *   - tournament-templates (CRUD)
 *   - user-martial-art-ranks (upsert + filter by userId)
 *   - bracket-seeds (GET empty, PUT, GET populated)
 *   - weigh-in-results (POST + GET with ?tournamentId filter)
 *
 * Also verifies _id → id normalization on all responses and
 * query-param filtering on existing routes (registrations, rank-systems).
 *
 * Prerequisites: server running on http://localhost:3001
 */

import { test, expect } from '@playwright/test';

const SERVER = 'http://localhost:3001';

// ── Coach Assignments ──────────────────────────────────────────────────────────

test.describe('coach-assignments', () => {
  test('POST creates assignment and GET filters by coachId', async ({ request }) => {
    const coachId   = `coach-${Date.now()}`;
    const athleteId = `athlete-${Date.now()}`;

    const post = await request.post(`${SERVER}/api/coach-assignments`, {
      data: { coachId, athleteId },
    });
    expect(post.status()).toBe(201);
    const body = await post.json();
    expect(body).toHaveProperty('id');
    expect(body).not.toHaveProperty('_id');
    expect(body.coachId).toBe(coachId);

    const get = await request.get(`${SERVER}/api/coach-assignments?coachId=${coachId}`);
    expect(get.status()).toBe(200);
    const list = await get.json();
    expect(list.length).toBe(1);
    expect(list[0].athleteId).toBe(athleteId);
  });

  test('POST duplicate returns 409', async ({ request }) => {
    const coachId   = `coach-dup-${Date.now()}`;
    const athleteId = `athlete-dup-${Date.now()}`;
    const payload   = { coachId, athleteId };

    await request.post(`${SERVER}/api/coach-assignments`, { data: payload });
    const dup = await request.post(`${SERVER}/api/coach-assignments`, { data: payload });
    expect(dup.status()).toBe(409);
  });

  test('DELETE removes assignment', async ({ request }) => {
    const coachId   = `coach-del-${Date.now()}`;
    const athleteId = `athlete-del-${Date.now()}`;

    const post = await request.post(`${SERVER}/api/coach-assignments`, {
      data: { coachId, athleteId },
    });
    const { id } = await post.json();

    const del = await request.delete(`${SERVER}/api/coach-assignments/${id}`);
    expect(del.status()).toBe(204);

    const get = await request.get(`${SERVER}/api/coach-assignments?coachId=${coachId}`);
    const list = await get.json();
    expect(list.length).toBe(0);
  });
});

// ── Tournament Templates ───────────────────────────────────────────────────────

test.describe('tournament-templates', () => {
  test('full CRUD cycle', async ({ request }) => {
    const ts = Date.now();
    // Create
    const post = await request.post(`${SERVER}/api/tournament-templates`, {
      data: {
        name:        `Template ${ts}`,
        description: 'Test template',
        modalities:  ['Kata', 'Kumite'],
        weightClasses: [{ id: 'w1', label: '-60kg', minKg: null, maxKg: 60 }],
        categories:  [{ id: 'c1', name: 'Open', discipline: 'Kumite', gender: 'M', ageGroup: 'Adult', rankRange: 'All' }],
      },
    });
    expect(post.status()).toBe(201);
    const created = await post.json();
    expect(created).toHaveProperty('id');
    expect(created).not.toHaveProperty('_id');
    expect(created.name).toBe(`Template ${ts}`);

    // Read
    const get = await request.get(`${SERVER}/api/tournament-templates/${created.id}`);
    expect(get.status()).toBe(200);
    expect((await get.json()).name).toBe(`Template ${ts}`);

    // Update
    const patch = await request.patch(`${SERVER}/api/tournament-templates/${created.id}`, {
      data: { name: `Template ${ts} Updated` },
    });
    expect(patch.status()).toBe(200);
    expect((await patch.json()).name).toBe(`Template ${ts} Updated`);

    // Delete
    const del = await request.delete(`${SERVER}/api/tournament-templates/${created.id}`);
    expect(del.status()).toBe(204);

    const gone = await request.get(`${SERVER}/api/tournament-templates/${created.id}`);
    expect(gone.status()).toBe(404);
  });
});

// ── User Martial Art Ranks ─────────────────────────────────────────────────────

test.describe('user-martial-art-ranks', () => {
  test('POST upserts rank and GET filters by userId', async ({ request }) => {
    const userId       = `user-rank-${Date.now()}`;
    const martialArtId = `ma-${Date.now()}`;
    const rankSystemId = `rs-1`;

    // Create
    const post = await request.post(`${SERVER}/api/user-martial-art-ranks`, {
      data: { userId, martialArtId, rankSystemId },
    });
    expect(post.status()).toBe(201);
    const body = await post.json();
    expect(body).toHaveProperty('id');
    expect(body.rankSystemId).toBe(rankSystemId);

    // Upsert with different rankSystemId
    const upsert = await request.post(`${SERVER}/api/user-martial-art-ranks`, {
      data: { userId, martialArtId, rankSystemId: 'rs-2' },
    });
    expect(upsert.status()).toBe(201);
    expect((await upsert.json()).rankSystemId).toBe('rs-2');

    // Filter by userId — should return exactly 1 (upserted, not duplicated)
    const get = await request.get(`${SERVER}/api/user-martial-art-ranks?userId=${userId}`);
    const list = await get.json();
    expect(list.length).toBe(1);
    expect(list[0].rankSystemId).toBe('rs-2');
  });
});

// ── Bracket Seeds ──────────────────────────────────────────────────────────────

test.describe('bracket-seeds', () => {
  test('GET returns empty seeds for unknown tournament', async ({ request }) => {
    const res = await request.get(`${SERVER}/api/bracket-seeds/unknown-tid-${Date.now()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.seeds).toEqual({});
  });

  test('PUT saves seeds and GET returns them', async ({ request }) => {
    const tid   = `bracket-tid-${Date.now()}`;
    const seeds = { 'Kumite -60kg M': ['alice', 'bob'], 'Kata M': ['charlie'] };

    const put = await request.put(`${SERVER}/api/bracket-seeds/${tid}`, { data: { seeds } });
    expect(put.status()).toBe(200);

    const get = await request.get(`${SERVER}/api/bracket-seeds/${tid}`);
    expect(get.status()).toBe(200);
    const body = await get.json();
    expect(body.seeds['Kumite -60kg M']).toEqual(['alice', 'bob']);
    expect(body.seeds['Kata M']).toEqual(['charlie']);
  });
});

// ── Weigh-In Results ──────────────────────────────────────────────────────────

test.describe('weigh-in-results', () => {
  test('POST creates result and GET filters by tournamentId', async ({ request }) => {
    const tournamentId   = `t-weigh-${Date.now()}`;
    const registrationId = `reg-${Date.now()}`;

    const post = await request.post(`${SERVER}/api/weigh-in-results`, {
      data: {
        tournamentId,
        registrationId,
        athleteName:    'Ana García',
        discipline:     'Kumite',
        weightDivision: '-55kg',
        actualWeightKg: 54.2,
        status:         'meets_weight',
      },
    });
    expect(post.status()).toBe(201);
    const body = await post.json();
    expect(body).toHaveProperty('id');
    expect(body).not.toHaveProperty('_id');
    expect(body.status).toBe('meets_weight');

    const get = await request.get(`${SERVER}/api/weigh-in-results?tournamentId=${tournamentId}`);
    expect(get.status()).toBe(200);
    const list = await get.json();
    expect(list.length).toBe(1);
    expect(list[0].athleteName).toBe('Ana García');
  });
});

// ── _id → id normalization on existing routes ──────────────────────────────────

test.describe('_id normalization on existing routes', () => {
  test('GET /api/martial-arts returns id not _id', async ({ request }) => {
    // Create one to ensure list is non-empty
    await request.post(`${SERVER}/api/martial-arts`, {
      data: { name: `Karate-${Date.now()}`, logo: '🥋' },
    });
    const res = await request.get(`${SERVER}/api/martial-arts`);
    const list = await res.json();
    if (list.length > 0) {
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).not.toHaveProperty('_id');
    }
  });

  test('GET /api/tournaments returns id not _id', async ({ request }) => {
    await request.post(`${SERVER}/api/tournaments`, {
      data: { name: `T-${Date.now()}`, date: '2026-06-01', status: 'upcoming', martialArtIds: [], registrationStart: null, registrationEnd: null, registrationForceOpen: null, templateId: null },
    });
    const res = await request.get(`${SERVER}/api/tournaments`);
    const list = await res.json();
    if (list.length > 0) {
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).not.toHaveProperty('_id');
    }
  });
});

// ── Query-param filtering on existing routes ──────────────────────────────────

test.describe('query-param filtering', () => {
  test('GET /api/rank-systems?martialArtId= filters correctly', async ({ request }) => {
    const martialArtId = `ma-filter-${Date.now()}`;

    // Create rank under specific martialArtId
    await request.post(`${SERVER}/api/rank-systems`, {
      data: { martialArtId, name: '10° Kyu', description: 'White belt', rank: 1, classification: 'beginner', applicableTo: 'both' },
    });

    const res = await request.get(`${SERVER}/api/rank-systems?martialArtId=${martialArtId}`);
    const list = await res.json();
    expect(list.length).toBeGreaterThan(0);
    list.forEach((r: any) => expect(r.martialArtId).toBe(martialArtId));
  });

  test('GET /api/registrations?tournamentId= filters correctly', async ({ request }) => {
    const tournamentId = `t-reg-filter-${Date.now()}`;

    await request.post(`${SERVER}/api/registrations`, {
      data: {
        userId: 'u1', tournamentId, tournamentName: 'Test', athleteName: 'Test Athlete',
        modalities: [{ discipline: 'Kata', weightDivision: null, gender: 'M', ageGroup: 'Adult' }],
        timestamp: new Date().toISOString(),
      },
    });

    const res = await request.get(`${SERVER}/api/registrations?tournamentId=${tournamentId}`);
    const list = await res.json();
    expect(list.length).toBe(1);
    expect(list[0].tournamentId).toBe(tournamentId);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).not.toHaveProperty('_id');
  });
});
