/**
 * db/database.web.ts
 * All data operations are proxied to the Node.js server via services/api.ts.
 * AsyncStorage is no longer used for collection data — only 'session:jwt'
 * (managed by services/api.ts) persists across sessions.
 */

import { apiGet, apiPost, apiPatch, apiPut, apiDelete, ApiError } from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  fullName: string;
  country: string;
  age: string;
  gender: string;
  academy: string;
  weight: string;
  beltGrade: string;
  createdAt: string;
  synced: boolean;
}

export interface ModalityEntry {
  discipline: string;
  weightDivision: string | null;
  gender: string;
  ageGroup: string;
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  athleteName: string;
  email?: string;
  academy?: string;
  grade?: string;
  modalities: ModalityEntry[];
  timestamp: string;
  synced: boolean;
}

export interface MartialArt {
  id: string;
  name: string;
  logo: string;
  createdAt: string;
  synced: boolean;
}

export interface RankSystem {
  id: string;
  martialArtId: string;
  name: string;
  description: string;
  rank: number;
  classification: 'beginner' | 'advanced';
  applicableTo: 'children' | 'adults' | 'both';
  createdAt: string;
  synced: boolean;
}

export interface Organization {
  id: string;
  name: string;
  acronym: string;
  description: string;
  logo: string;
  martialArtId: string;
  createdAt: string;
  synced: boolean;
}

export interface CoachAssignment {
  id: string;
  coachId: string;
  athleteId: string;
  createdAt: string;
  synced: boolean;
}

export interface WeightClass {
  id: string;
  label: string;
  minKg: number | null;
  maxKg: number | null;
}

export interface TemplateCategory {
  id: string;
  name: string;
  discipline: string;
  gender: string;
  ageGroup: string;
  rankRange: string;
}

export interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  modalities: string[];
  weightClasses: WeightClass[];
  categories: TemplateCategory[];
  createdAt: string;
  synced: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  logo: string;
  description: string;
  status: 'upcoming' | 'active' | 'closed' | 'cancelled' | 'created' | 'registration_open' | 'registration_closed' | 'weigh_in_open' | 'weigh_in_closed' | 'tournament_start' | 'tournament_finish';
  martialArtIds: string[];
  registrationStart: string | null;
  registrationEnd: string | null;
  registrationForceOpen: boolean | null;
  templateId: string | null;
  createdAt: string;
  synced: boolean;
}

export interface RoleDefinition {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  createdAt: string;
  synced: boolean;
}

export interface WeighInResult {
  id: string;
  tournamentId: string;
  registrationId: string;
  athleteName: string;
  discipline: string;
  weightDivision: string | null;
  actualWeightKg: number;
  status: 'meets_weight' | 'lost_weight';
  timestamp: string;
  synced: boolean;
}

export interface UserMartialArtRank {
  id: string;
  userId: string;
  martialArtId: string;
  rankSystemId: string;
  createdAt: string;
  synced: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Left for backward compatibility — password hashing is now server-side. */
export function hashPassword(_password: string): string {
  return '';
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'synced'>): Promise<User> {
  const user = await apiPost<User>('/api/users', data);
  return { ...user, synced: true };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await apiGet<User[]>(`/api/users?email=${encodeURIComponent(email)}`);
    return users[0] ? { ...users[0], synced: true } : null;
  } catch {
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await apiGet<User>(`/api/users/${id}`);
    return { ...user, synced: true };
  } catch {
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  const users = await apiGet<User[]>('/api/users');
  return users.map(u => ({ ...u, synced: true }));
}

export async function getAllAthletes(): Promise<User[]> {
  const users = await apiGet<User[]>('/api/users?role=athlete');
  return users.map(u => ({ ...u, synced: true }));
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const all = await apiGet<User[]>('/api/users');
  return all.filter(u => ids.includes(u.id)).map(u => ({ ...u, synced: true }));
}

export async function getRegistrationsByAthleteIds(athleteIds: string[]): Promise<Registration[]> {
  if (athleteIds.length === 0) return [];
  const all = await apiGet<Registration[]>('/api/registrations');
  return all.filter(r => athleteIds.includes(r.userId)).map(r => ({ ...r, synced: true }));
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<void> {
  await apiPatch(`/api/users/${id}`, updates);
}

// ── Session stubs (token management is in services/api.ts) ────────────────────

export async function setSession(_userId: string): Promise<void> {}
export async function getSessionUserId(): Promise<string | null> { return null; }
export async function clearSession(): Promise<void> {}

// ── Registrations ─────────────────────────────────────────────────────────────

export async function addRegistration(data: Omit<Registration, 'id' | 'synced'>): Promise<Registration> {
  const reg = await apiPost<Registration>('/api/registrations', data);
  return { ...reg, synced: true };
}

export async function getRegistrationsByUserId(userId: string): Promise<Registration[]> {
  const regs = await apiGet<Registration[]>(`/api/registrations?userId=${encodeURIComponent(userId)}`);
  return regs.map(r => ({ ...r, synced: true }));
}

export async function getRegistrationsByTournamentId(tournamentId: string): Promise<Registration[]> {
  const regs = await apiGet<Registration[]>(`/api/registrations?tournamentId=${encodeURIComponent(tournamentId)}`);
  return regs.map(r => ({ ...r, synced: true }));
}

export async function getRegisteredTournamentIds(userId: string): Promise<string[]> {
  const regs = await apiGet<Registration[]>(`/api/registrations?userId=${encodeURIComponent(userId)}`);
  return [...new Set(regs.map(r => r.tournamentId))];
}

export async function updateRegistration(id: string, updates: Partial<Omit<Registration, 'id' | 'synced'>>): Promise<void> {
  await apiPatch(`/api/registrations/${id}`, updates);
}

export async function deleteRegistration(id: string): Promise<void> {
  await apiDelete(`/api/registrations/${id}`);
}

// ── Martial Arts ──────────────────────────────────────────────────────────────

export async function createMartialArt(data: Pick<MartialArt, 'name' | 'logo'>): Promise<MartialArt> {
  const art = await apiPost<MartialArt>('/api/martial-arts', data);
  return { ...art, synced: true };
}

export async function getAllMartialArts(): Promise<MartialArt[]> {
  const arts = await apiGet<MartialArt[]>('/api/martial-arts');
  return arts.map(a => ({ ...a, synced: true }));
}

export async function updateMartialArt(id: string, updates: Partial<Pick<MartialArt, 'name' | 'logo'>>): Promise<void> {
  await apiPatch(`/api/martial-arts/${id}`, updates);
}

export async function deleteMartialArt(id: string): Promise<void> {
  await apiDelete(`/api/martial-arts/${id}`);
}

// ── Rank Systems ──────────────────────────────────────────────────────────────

export async function createRankSystem(data: Omit<RankSystem, 'id' | 'createdAt' | 'synced'>): Promise<RankSystem> {
  const rank = await apiPost<RankSystem>('/api/rank-systems', data);
  return { ...rank, synced: true };
}

export async function getRankSystemsByMartialArtId(martialArtId: string): Promise<RankSystem[]> {
  const ranks = await apiGet<RankSystem[]>(`/api/rank-systems?martialArtId=${encodeURIComponent(martialArtId)}`);
  return ranks.sort((a, b) => a.rank - b.rank).map(r => ({ ...r, synced: true }));
}

export async function updateRankSystem(id: string, updates: Partial<Omit<RankSystem, 'id' | 'martialArtId' | 'createdAt' | 'synced'>>): Promise<void> {
  await apiPatch(`/api/rank-systems/${id}`, updates);
}

export async function deleteRankSystem(id: string): Promise<void> {
  await apiDelete(`/api/rank-systems/${id}`);
}

// ── Organizations ─────────────────────────────────────────────────────────────

export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'synced'>): Promise<Organization> {
  const org = await apiPost<Organization>('/api/organizations', data);
  return { ...org, synced: true };
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const orgs = await apiGet<Organization[]>('/api/organizations');
  return orgs.map(o => ({ ...o, synced: true }));
}

export async function updateOrganization(id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  await apiPatch(`/api/organizations/${id}`, updates);
}

export async function deleteOrganization(id: string): Promise<void> {
  await apiDelete(`/api/organizations/${id}`);
}

// ── Tournament Templates ──────────────────────────────────────────────────────

export async function createTemplate(data: Omit<TournamentTemplate, 'id' | 'createdAt' | 'synced'>): Promise<TournamentTemplate> {
  const template = await apiPost<TournamentTemplate>('/api/tournament-templates', data);
  return { ...template, synced: true };
}

export async function getAllTemplates(): Promise<TournamentTemplate[]> {
  const templates = await apiGet<TournamentTemplate[]>('/api/tournament-templates');
  return templates.map(t => ({ ...t, synced: true }));
}

export async function updateTemplate(id: string, updates: Partial<Omit<TournamentTemplate, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  await apiPatch(`/api/tournament-templates/${id}`, updates);
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiDelete(`/api/tournament-templates/${id}`);
}

// ── Tournaments ───────────────────────────────────────────────────────────────

export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'synced'>): Promise<Tournament> {
  const tournament = await apiPost<Tournament>('/api/tournaments', data);
  return { ...tournament, synced: true };
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const tournaments = await apiGet<Tournament[]>('/api/tournaments');
  return tournaments.map(t => ({ ...t, synced: true }));
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  try {
    const tournament = await apiGet<Tournament>(`/api/tournaments/${id}`);
    return { ...tournament, synced: true };
  } catch {
    return null;
  }
}

export async function updateTournament(id: string, updates: Partial<Omit<Tournament, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  await apiPatch(`/api/tournaments/${id}`, updates);
}

export async function deleteTournament(id: string): Promise<void> {
  await apiDelete(`/api/tournaments/${id}`);
}

// ── User Martial Art Ranks ────────────────────────────────────────────────────

export async function getUserMartialArtRanks(userId: string): Promise<UserMartialArtRank[]> {
  const ranks = await apiGet<UserMartialArtRank[]>(`/api/user-martial-art-ranks?userId=${encodeURIComponent(userId)}`);
  return ranks.map(r => ({ ...r, synced: true }));
}

export async function upsertUserMartialArtRank(userId: string, martialArtId: string, rankSystemId: string): Promise<void> {
  await apiPost('/api/user-martial-art-ranks', { userId, martialArtId, rankSystemId });
}

export async function removeUserMartialArtRank(userId: string, martialArtId: string): Promise<void> {
  const ranks = await apiGet<UserMartialArtRank[]>(
    `/api/user-martial-art-ranks?userId=${encodeURIComponent(userId)}&martialArtId=${encodeURIComponent(martialArtId)}`,
  );
  if (ranks[0]) await apiDelete(`/api/user-martial-art-ranks/${ranks[0].id}`);
}

// ── Coach / Manager Assignments ───────────────────────────────────────────────

export async function assignAthleteToManager(managerId: string, athleteId: string): Promise<void> {
  try {
    await apiPost('/api/coach-assignments', { coachId: managerId, athleteId });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return; // already assigned
    throw err;
  }
}

export async function removeAthleteFromManager(managerId: string, athleteId: string): Promise<void> {
  const all = await apiGet<CoachAssignment[]>(`/api/coach-assignments?coachId=${encodeURIComponent(managerId)}`);
  const match = all.find(a => a.athleteId === athleteId);
  if (match) await apiDelete(`/api/coach-assignments/${match.id}`);
}

export async function getAthletesByManagerId(managerId: string): Promise<User[]> {
  const assignments = await apiGet<CoachAssignment[]>(`/api/coach-assignments?coachId=${encodeURIComponent(managerId)}`);
  const ids = assignments.map(a => a.athleteId);
  return getUsersByIds(ids);
}

/** @deprecated Use assignAthleteToManager */
export const assignAthleteToCoach = assignAthleteToManager;
/** @deprecated Use removeAthleteFromManager */
export const removeAthleteFromCoach = removeAthleteFromManager;
/** @deprecated Use getAthletesByManagerId */
export const getAthletesByCoachId = getAthletesByManagerId;

// ── Sync helpers (no-ops — server is source of truth) ────────────────────────

export async function getUnsyncedData() {
  return { users: [], registrations: [], assignments: [] };
}

export async function markAllSynced(): Promise<void> {}

// ── Role Definitions ──────────────────────────────────────────────────────────

export async function getAllRoleDefinitions(): Promise<RoleDefinition[]> {
  const defs = await apiGet<RoleDefinition[]>('/api/role-definitions');
  return defs.map(d => ({ ...d, synced: true }));
}

export async function createRoleDefinition(
  data: Pick<RoleDefinition, 'name' | 'displayName' | 'permissions'>,
): Promise<RoleDefinition> {
  const def = await apiPost<RoleDefinition>('/api/role-definitions', data);
  return { ...def, synced: true };
}

export async function updateRoleDefinition(
  id: string,
  patch: Partial<Pick<RoleDefinition, 'name' | 'displayName' | 'permissions'>>,
): Promise<void> {
  await apiPatch(`/api/role-definitions/${id}`, patch);
}

export async function deleteRoleDefinition(id: string): Promise<void> {
  await apiDelete(`/api/role-definitions/${id}`);
}

// ── Bracket Seeds ─────────────────────────────────────────────────────────────

export async function getBracketSeeds(tournamentId: string): Promise<Record<string, string[]>> {
  try {
    const res = await apiGet<{ tournamentId: string; seeds: Record<string, string[]> }>(
      `/api/bracket-seeds/${encodeURIComponent(tournamentId)}`,
    );
    return res.seeds ?? {};
  } catch {
    return {};
  }
}

export async function saveBracketSeeds(tournamentId: string, seeds: Record<string, string[]>): Promise<void> {
  await apiPut(`/api/bracket-seeds/${encodeURIComponent(tournamentId)}`, { seeds });
}

// ── Weigh-In Results ──────────────────────────────────────────────────────────

export async function saveWeighInResult(
  data: Omit<WeighInResult, 'id' | 'timestamp' | 'synced'>,
): Promise<WeighInResult> {
  const result = await apiPost<WeighInResult>('/api/weigh-in-results', data);
  return { ...result, synced: true };
}

export async function getWeighInResultsByTournamentId(tournamentId: string): Promise<WeighInResult[]> {
  const results = await apiGet<WeighInResult[]>(`/api/weigh-in-results?tournamentId=${encodeURIComponent(tournamentId)}`);
  return results.map(r => ({ ...r, synced: true }));
}
