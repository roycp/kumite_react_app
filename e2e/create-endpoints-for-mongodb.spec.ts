/**
 * e2e/create-endpoints-for-mongodb.spec.ts
 *
 * Verifies all RESTful endpoints for MongoDB persistence:
 * registrations, tournaments, martial arts, organizations, rank systems, role definitions.
 *
 * Each resource is tested for: create (201), list (200), update (200), delete (204).
 */

import { test, expect } from '@playwright/test';
import { startTestServer, stopTestServer } from '../server/src/test-server';

let baseURL: string;

test.beforeAll(async () => {
  baseURL = await startTestServer();
});

test.afterAll(async () => {
  await stopTestServer();
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function crudCycle(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
  endpoint: string,
  createBody: Record<string, unknown>,
  updateBody: Record<string, unknown>,
  updateCheck: (body: Record<string, unknown>) => void,
) {
  // List — starts empty
  const listEmpty = await request.get(`${baseURL}${endpoint}`);
  expect(listEmpty.status()).toBe(200);
  expect(await listEmpty.json()).toEqual([]);

  // Create
  const create = await request.post(`${baseURL}${endpoint}`, { data: createBody });
  expect(create.status()).toBe(201);
  const created: any = await create.json();
  expect(created._id).toBeTruthy();

  // List — one item
  const list = await request.get(`${baseURL}${endpoint}`);
  expect((await list.json()).length).toBe(1);

  // Update
  const patch = await request.patch(`${baseURL}${endpoint}/${created._id}`, { data: updateBody });
  expect(patch.status()).toBe(200);
  updateCheck(await patch.json());

  // Delete
  const del = await request.delete(`${baseURL}${endpoint}/${created._id}`);
  expect(del.status()).toBe(204);

  // List — empty again
  const listAfter = await request.get(`${baseURL}${endpoint}`);
  expect((await listAfter.json()).length).toBe(0);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('Registrations CRUD', async ({ request }) => {
  await crudCycle(
    request,
    '/api/registrations',
    { userId: 'u1', tournamentId: 't1', tournamentName: 'Copa Test', athleteName: 'Juan', modalities: [{ discipline: 'Kumite', weightDivision: '-70kg', gender: 'M', ageGroup: 'Adulto' }] },
    { athleteName: 'Pedro' },
    body => expect((body as any).athleteName).toBe('Pedro'),
  );
});

test('Tournaments CRUD', async ({ request }) => {
  await crudCycle(
    request,
    '/api/tournaments',
    { name: 'Copa Regional', date: '2026-06-01', location: 'San José', status: 'upcoming' },
    { status: 'active' },
    body => expect((body as any).status).toBe('active'),
  );
});

test('Martial Arts CRUD', async ({ request }) => {
  await crudCycle(
    request,
    '/api/martial-arts',
    { name: 'Karate', logo: '🥋' },
    { logo: '🏅' },
    body => expect((body as any).logo).toBe('🏅'),
  );
});

test('Organizations CRUD', async ({ request }) => {
  await crudCycle(
    request,
    '/api/organizations',
    { name: 'Federación Nacional', acronym: 'FN', martialArtId: 'ma1' },
    { acronym: 'FNAK' },
    body => expect((body as any).acronym).toBe('FNAK'),
  );
});

test('Rank Systems CRUD', async ({ request }) => {
  await crudCycle(
    request,
    '/api/rank-systems',
    { martialArtId: 'ma1', name: '10° Kyu', description: 'White belt', rank: 1, classification: 'beginner', applicableTo: 'both' },
    { description: 'Cinturón blanco' },
    body => expect((body as any).description).toBe('Cinturón blanco'),
  );
});

test('Role Definitions CRUD', async ({ request }) => {
  await crudCycle(
    request,
    '/api/role-definitions',
    { name: 'referee', displayName: 'Árbitro', permissions: ['search_tournament'] },
    { permissions: ['search_tournament', 'manage_tournaments'] },
    body => expect((body as any).permissions).toContain('manage_tournaments'),
  );
});

test('Role Definitions: duplicate name returns 409', async ({ request }) => {
  await request.post(`${baseURL}/api/role-definitions`, { data: { name: 'coach', displayName: 'Entrenador', permissions: [] } });
  const dup = await request.post(`${baseURL}/api/role-definitions`, { data: { name: 'coach', displayName: 'Coach', permissions: [] } });
  expect(dup.status()).toBe(409);
  // cleanup
  const list = await request.get(`${baseURL}/api/role-definitions`);
  const items: any[] = await list.json();
  const coach = items.find(i => i.name === 'coach');
  if (coach) await request.delete(`${baseURL}/api/role-definitions/${coach._id}`);
});
