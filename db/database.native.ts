/**
 * db/database.native.ts
 * Native (Android / iOS) implementation — Realm.
 * Metro automatically uses this file when bundling for Android/iOS.
 * Run `npx expo prebuild` once to generate native directories.
 */

import Realm from 'realm';

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

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  athleteName: string;
  email: string;
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

// ── Schemas ───────────────────────────────────────────────────────────────────

const UserSchema: Realm.ObjectSchema = {
  name: 'User', primaryKey: 'id',
  properties: {
    id: 'string', email: 'string', passwordHash: 'string', role: 'string',
    fullName: 'string', country: 'string', age: 'string', gender: 'string',
    academy: 'string', weight: 'string', beltGrade: 'string', createdAt: 'string',
    synced: { type: 'bool', default: false },
  },
};

const RegistrationSchema: Realm.ObjectSchema = {
  name: 'Registration', primaryKey: 'id',
  properties: {
    id: 'string', userId: 'string', tournamentId: 'string', tournamentName: 'string',
    athleteName: 'string', email: 'string', timestamp: 'string',
    synced: { type: 'bool', default: false },
  },
};

const CoachAssignmentSchema: Realm.ObjectSchema = {
  name: 'CoachAssignment', primaryKey: 'id',
  properties: {
    id: 'string', coachId: 'string', athleteId: 'string', createdAt: 'string',
    synced: { type: 'bool', default: false },
  },
};

const SessionSchema: Realm.ObjectSchema = {
  name: 'Session', primaryKey: 'key',
  properties: { key: 'string', value: 'string' },
};

// ── Singleton ─────────────────────────────────────────────────────────────────

let _realm: Realm | null = null;

async function getRealm(): Promise<Realm> {
  if (_realm && !_realm.isClosed) return _realm;
  _realm = await Realm.open({
    schema: [UserSchema, RegistrationSchema, CoachAssignmentSchema, SessionSchema],
    schemaVersion: 1,
  });
  return _realm;
}

function toPlain<T>(obj: any): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

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

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'synced'>): Promise<User> {
  const realm = await getRealm();
  let user!: any;
  realm.write(() => {
    user = realm.create('User', { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false });
  });
  return toPlain<User>(user);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const realm = await getRealm();
  const results = realm.objects('User').filtered('email ==[c] $0', email);
  return results.length > 0 ? toPlain<User>(results[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('User', id);
  return obj ? toPlain<User>(obj) : null;
}

export async function getAllAthletes(): Promise<User[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('User').filtered('role == "athlete"')).map((u: any) => toPlain<User>(u));
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('User', id);
  if (obj) realm.write(() => { Object.assign(obj, updates); });
}

// ── Session ───────────────────────────────────────────────────────────────────

const SESSION_KEY = 'currentUserId';

export async function setSession(userId: string): Promise<void> {
  const realm = await getRealm();
  realm.write(() => { realm.create('Session', { key: SESSION_KEY, value: userId }, 'modified'); });
}

export async function getSessionUserId(): Promise<string | null> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Session', SESSION_KEY);
  return obj ? (obj as any).value : null;
}

export async function clearSession(): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Session', SESSION_KEY);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── Registrations ─────────────────────────────────────────────────────────────

export async function addRegistration(data: Omit<Registration, 'id' | 'synced'>): Promise<Registration> {
  const realm = await getRealm();
  let reg!: any;
  realm.write(() => { reg = realm.create('Registration', { ...data, id: generateId(), synced: false }); });
  return toPlain<Registration>(reg);
}

export async function getRegistrationsByUserId(userId: string): Promise<Registration[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('Registration').filtered('userId == $0', userId)).map((r: any) => toPlain<Registration>(r));
}

// ── Coach assignments ─────────────────────────────────────────────────────────

export async function assignAthleteToCoach(coachId: string, athleteId: string): Promise<void> {
  const realm = await getRealm();
  const existing = realm.objects('CoachAssignment').filtered('coachId == $0 AND athleteId == $1', coachId, athleteId);
  if (existing.length === 0) {
    realm.write(() => {
      realm.create('CoachAssignment', { id: generateId(), coachId, athleteId, createdAt: new Date().toISOString(), synced: false });
    });
  }
}

export async function removeAthleteFromCoach(coachId: string, athleteId: string): Promise<void> {
  const realm = await getRealm();
  const results = realm.objects('CoachAssignment').filtered('coachId == $0 AND athleteId == $1', coachId, athleteId);
  if (results.length > 0) realm.write(() => { realm.delete(results); });
}

export async function getAthletesByCoachId(coachId: string): Promise<User[]> {
  const realm = await getRealm();
  const assignments = realm.objects('CoachAssignment').filtered('coachId == $0', coachId);
  const athleteIds = Array.from(assignments).map((a: any) => a.athleteId);
  if (athleteIds.length === 0) return [];
  const predicate = athleteIds.map((_: any, i: number) => `id == $${i}`).join(' OR ');
  return Array.from(realm.objects('User').filtered(predicate, ...athleteIds)).map((u: any) => toPlain<User>(u));
}

// ── Sync helpers ──────────────────────────────────────────────────────────────

export async function getUnsyncedData() {
  const realm = await getRealm();
  return {
    users:         Array.from(realm.objects('User').filtered('synced == false')).map((u: any) => toPlain<User>(u)),
    registrations: Array.from(realm.objects('Registration').filtered('synced == false')).map((r: any) => toPlain<Registration>(r)),
    assignments:   Array.from(realm.objects('CoachAssignment').filtered('synced == false')).map((a: any) => toPlain<CoachAssignment>(a)),
  };
}

export async function markAllSynced(): Promise<void> {
  const realm = await getRealm();
  realm.write(() => {
    realm.objects('User').filtered('synced == false').forEach((u: any) => { u.synced = true; });
    realm.objects('Registration').filtered('synced == false').forEach((r: any) => { r.synced = true; });
    realm.objects('CoachAssignment').filtered('synced == false').forEach((a: any) => { a.synced = true; });
  });
}
