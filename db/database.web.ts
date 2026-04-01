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
  role: 'athlete' | 'coach';
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
  modalities: ModalityEntry[];
  timestamp: string;
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

// ── Coach assignments ─────────────────────────────────────────────────────────

export async function assignAthleteToCoach(coachId: string, athleteId: string): Promise<void> {
  const assignments = await readCollection<CoachAssignment>(KEYS.ASSIGNMENTS);
  if (!assignments.some(a => a.coachId === coachId && a.athleteId === athleteId)) {
    assignments.push({ id: generateId(), coachId, athleteId, createdAt: new Date().toISOString(), synced: false });
    await writeCollection(KEYS.ASSIGNMENTS, assignments);
  }
}

export async function removeAthleteFromCoach(coachId: string, athleteId: string): Promise<void> {
  const assignments = await readCollection<CoachAssignment>(KEYS.ASSIGNMENTS);
  await writeCollection(KEYS.ASSIGNMENTS, assignments.filter(a => !(a.coachId === coachId && a.athleteId === athleteId)));
}

export async function getAthletesByCoachId(coachId: string): Promise<User[]> {
  const assignments = await readCollection<CoachAssignment>(KEYS.ASSIGNMENTS);
  const ids = assignments.filter(a => a.coachId === coachId).map(a => a.athleteId);
  const users = await readCollection<User>(KEYS.USERS);
  return users.filter(u => ids.includes(u.id));
}

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
