/**
 * db/database.web.ts
 * Web implementation — AsyncStorage JSON document store.
 * Metro automatically uses this file when bundling for web.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'athlete' | 'manager' | 'admin';
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

/** One discipline entry within a tournament registration. */
export interface ModalityEntry {
  discipline: string;         // e.g. 'Kata', 'Kumite', 'Gi'
  weightDivision: string | null; // null for disciplines without weight (e.g. Kata)
  gender: string;
  ageGroup: string;           // 'Adulto' | 'Sub-18'
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  athleteName: string;
  email?: string;             // optional — not collected in the new wizard
  academy?: string;           // captured at registration / edit time
  grade?: string;             // captured at registration / edit time
  modalities: ModalityEntry[];
  timestamp: string;
  synced: boolean;
}

export interface MartialArt {
  id: string;
  name: string;
  logo: string;   // emoji or short text, e.g. '🥋'
  createdAt: string;
  synced: boolean;
}

export interface RankSystem {
  id: string;
  martialArtId: string;
  name: string;               // e.g. '10° Kyu', '1° Dan'
  description: string;        // e.g. 'White belt'
  rank: number;               // sort order — lower = beginner
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
  logo: string;         // emoji or short text
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

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS = {
  USERS:         'db:users',
  REGISTRATIONS: 'db:registrations',
  ASSIGNMENTS:   'db:coach_assignments',
  MARTIAL_ARTS:  'db:martial_arts',
  RANK_SYSTEMS:  'db:rank_systems',
  ORGANIZATIONS: 'db:organizations',
  SESSION:       'db:session_user_id',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) ^ password.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

async function readCollection<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function writeCollection<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'synced'>): Promise<User> {
  const users = await readCollection<User>(KEYS.USERS);
  const user: User = { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false };
  users.push(user);
  await writeCollection(KEYS.USERS, users);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await readCollection<User>(KEYS.USERS);
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readCollection<User>(KEYS.USERS);
  return users.find(u => u.id === id) ?? null;
}

export async function getAllAthletes(): Promise<User[]> {
  const users = await readCollection<User>(KEYS.USERS);
  return users.filter(u => u.role === 'athlete');
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const users = await readCollection<User>(KEYS.USERS);
  return users.filter(u => ids.includes(u.id));
}

export async function getRegistrationsByAthleteIds(athleteIds: string[]): Promise<Registration[]> {
  if (athleteIds.length === 0) return [];
  const registrations = await readCollection<Registration>(KEYS.REGISTRATIONS);
  return registrations.filter(r => athleteIds.includes(r.userId));
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<void> {
  const users = await readCollection<User>(KEYS.USERS);
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; await writeCollection(KEYS.USERS, users); }
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function setSession(userId: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSION, userId);
}

export async function getSessionUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.SESSION);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SESSION);
}

// ── Registrations ─────────────────────────────────────────────────────────────

export async function addRegistration(data: Omit<Registration, 'id' | 'synced'>): Promise<Registration> {
  const registrations = await readCollection<Registration>(KEYS.REGISTRATIONS);
  const registration: Registration = { ...data, id: generateId(), synced: false };
  registrations.push(registration);
  await writeCollection(KEYS.REGISTRATIONS, registrations);
  return registration;
}

export async function getRegistrationsByUserId(userId: string): Promise<Registration[]> {
  const registrations = await readCollection<Registration>(KEYS.REGISTRATIONS);
  return registrations.filter(r => r.userId === userId);
}

/** Returns unique tournament IDs the user is already registered for. */
export async function getRegisteredTournamentIds(userId: string): Promise<string[]> {
  const registrations = await readCollection<Registration>(KEYS.REGISTRATIONS);
  return [...new Set(registrations.filter(r => r.userId === userId).map(r => r.tournamentId))];
}

/** Update an existing registration (modalities, etc.). */
export async function updateRegistration(id: string, updates: Partial<Omit<Registration, 'id' | 'synced'>>): Promise<void> {
  const registrations = await readCollection<Registration>(KEYS.REGISTRATIONS);
  const idx = registrations.findIndex(r => r.id === id);
  if (idx !== -1) {
    registrations[idx] = { ...registrations[idx], ...updates };
    await writeCollection(KEYS.REGISTRATIONS, registrations);
  }
}

/** Delete a registration by id. */
export async function deleteRegistration(id: string): Promise<void> {
  const registrations = await readCollection<Registration>(KEYS.REGISTRATIONS);
  await writeCollection(KEYS.REGISTRATIONS, registrations.filter(r => r.id !== id));
}

// ── Martial Arts ──────────────────────────────────────────────────────────────

export async function createMartialArt(data: Pick<MartialArt, 'name' | 'logo'>): Promise<MartialArt> {
  const arts = await readCollection<MartialArt>(KEYS.MARTIAL_ARTS);
  const art: MartialArt = { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false };
  arts.push(art);
  await writeCollection(KEYS.MARTIAL_ARTS, arts);
  return art;
}

export async function getAllMartialArts(): Promise<MartialArt[]> {
  return readCollection<MartialArt>(KEYS.MARTIAL_ARTS);
}

export async function updateMartialArt(id: string, updates: Partial<Pick<MartialArt, 'name' | 'logo'>>): Promise<void> {
  const arts = await readCollection<MartialArt>(KEYS.MARTIAL_ARTS);
  const idx = arts.findIndex(a => a.id === id);
  if (idx !== -1) { arts[idx] = { ...arts[idx], ...updates }; await writeCollection(KEYS.MARTIAL_ARTS, arts); }
}

export async function deleteMartialArt(id: string): Promise<void> {
  const arts = await readCollection<MartialArt>(KEYS.MARTIAL_ARTS);
  await writeCollection(KEYS.MARTIAL_ARTS, arts.filter(a => a.id !== id));
}

// ── Rank Systems ──────────────────────────────────────────────────────────────

export async function createRankSystem(data: Omit<RankSystem, 'id' | 'createdAt' | 'synced'>): Promise<RankSystem> {
  const ranks = await readCollection<RankSystem>(KEYS.RANK_SYSTEMS);
  const rank: RankSystem = { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false };
  ranks.push(rank);
  await writeCollection(KEYS.RANK_SYSTEMS, ranks);
  return rank;
}

export async function getRankSystemsByMartialArtId(martialArtId: string): Promise<RankSystem[]> {
  const ranks = await readCollection<RankSystem>(KEYS.RANK_SYSTEMS);
  return ranks.filter(r => r.martialArtId === martialArtId).sort((a, b) => a.rank - b.rank);
}

export async function updateRankSystem(id: string, updates: Partial<Omit<RankSystem, 'id' | 'martialArtId' | 'createdAt' | 'synced'>>): Promise<void> {
  const ranks = await readCollection<RankSystem>(KEYS.RANK_SYSTEMS);
  const idx = ranks.findIndex(r => r.id === id);
  if (idx !== -1) { ranks[idx] = { ...ranks[idx], ...updates }; await writeCollection(KEYS.RANK_SYSTEMS, ranks); }
}

export async function deleteRankSystem(id: string): Promise<void> {
  const ranks = await readCollection<RankSystem>(KEYS.RANK_SYSTEMS);
  await writeCollection(KEYS.RANK_SYSTEMS, ranks.filter(r => r.id !== id));
}

// ── Organizations ─────────────────────────────────────────────────────────────

export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'synced'>): Promise<Organization> {
  const orgs = await readCollection<Organization>(KEYS.ORGANIZATIONS);
  const org: Organization = { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false };
  orgs.push(org);
  await writeCollection(KEYS.ORGANIZATIONS, orgs);
  return org;
}

export async function getAllOrganizations(): Promise<Organization[]> {
  return readCollection<Organization>(KEYS.ORGANIZATIONS);
}

export async function updateOrganization(id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  const orgs = await readCollection<Organization>(KEYS.ORGANIZATIONS);
  const idx = orgs.findIndex(o => o.id === id);
  if (idx !== -1) { orgs[idx] = { ...orgs[idx], ...updates }; await writeCollection(KEYS.ORGANIZATIONS, orgs); }
}

export async function deleteOrganization(id: string): Promise<void> {
  const orgs = await readCollection<Organization>(KEYS.ORGANIZATIONS);
  await writeCollection(KEYS.ORGANIZATIONS, orgs.filter(o => o.id !== id));
}

// ── Manager assignments ───────────────────────────────────────────────────────

export async function assignAthleteToManager(managerId: string, athleteId: string): Promise<void> {
  const assignments = await readCollection<CoachAssignment>(KEYS.ASSIGNMENTS);
  if (!assignments.some(a => a.coachId === managerId && a.athleteId === athleteId)) {
    assignments.push({ id: generateId(), coachId: managerId, athleteId, createdAt: new Date().toISOString(), synced: false });
    await writeCollection(KEYS.ASSIGNMENTS, assignments);
  }
}

export async function removeAthleteFromManager(managerId: string, athleteId: string): Promise<void> {
  const assignments = await readCollection<CoachAssignment>(KEYS.ASSIGNMENTS);
  await writeCollection(KEYS.ASSIGNMENTS, assignments.filter(a => !(a.coachId === managerId && a.athleteId === athleteId)));
}

export async function getAthletesByManagerId(managerId: string): Promise<User[]> {
  const assignments = await readCollection<CoachAssignment>(KEYS.ASSIGNMENTS);
  const ids = assignments.filter(a => a.coachId === managerId).map(a => a.athleteId);
  const users = await readCollection<User>(KEYS.USERS);
  return users.filter(u => ids.includes(u.id));
}

/** @deprecated Use assignAthleteToManager */
export const assignAthleteToCoach = assignAthleteToManager;
/** @deprecated Use removeAthleteFromManager */
export const removeAthleteFromCoach = removeAthleteFromManager;
/** @deprecated Use getAthletesByManagerId */
export const getAthletesByCoachId = getAthletesByManagerId;

// ── Sync helpers ──────────────────────────────────────────────────────────────

export async function getUnsyncedData() {
  const [users, registrations, assignments] = await Promise.all([
    readCollection<User>(KEYS.USERS),
    readCollection<Registration>(KEYS.REGISTRATIONS),
    readCollection<CoachAssignment>(KEYS.ASSIGNMENTS),
  ]);
  return {
    users:         users.filter(u => !u.synced),
    registrations: registrations.filter(r => !r.synced),
    assignments:   assignments.filter(a => !a.synced),
  };
}

export async function markAllSynced(): Promise<void> {
  const mark = <T extends { synced: boolean }>(items: T[]) => items.map(i => ({ ...i, synced: true }));
  const [users, registrations, assignments] = await Promise.all([
    readCollection<User>(KEYS.USERS),
    readCollection<Registration>(KEYS.REGISTRATIONS),
    readCollection<CoachAssignment>(KEYS.ASSIGNMENTS),
  ]);
  await Promise.all([
    writeCollection(KEYS.USERS, mark(users)),
    writeCollection(KEYS.REGISTRATIONS, mark(registrations)),
    writeCollection(KEYS.ASSIGNMENTS, mark(assignments)),
  ]);
}
