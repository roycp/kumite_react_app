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

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  athleteName: string;
  email: string;
  academy?: string;           // captured at registration / edit time
  grade?: string;             // captured at registration / edit time
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
  status: 'upcoming' | 'active' | 'closed' | 'cancelled';
  martialArtIds: string[];
  registrationStart: string | null;
  registrationEnd: string | null;
  createdAt: string;
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

const OrganizationSchema: Realm.ObjectSchema = {
  name: 'Organization', primaryKey: 'id',
  properties: {
    id: 'string', name: 'string', acronym: 'string', description: 'string',
    logo: 'string', martialArtId: 'string', createdAt: 'string',
    synced: { type: 'bool', default: false },
  },
};

const RankSystemSchema: Realm.ObjectSchema = {
  name: 'RankSystem', primaryKey: 'id',
  properties: {
    id: 'string', martialArtId: 'string', name: 'string', description: 'string',
    rank: 'int', classification: 'string', applicableTo: 'string',
    createdAt: 'string', synced: { type: 'bool', default: false },
  },
};

const MartialArtSchema: Realm.ObjectSchema = {
  name: 'MartialArt', primaryKey: 'id',
  properties: {
    id: 'string', name: 'string', logo: 'string', createdAt: 'string',
    synced: { type: 'bool', default: false },
  },
};

const TournamentTemplateSchema: Realm.ObjectSchema = {
  name: 'TournamentTemplate', primaryKey: 'id',
  properties: {
    id: 'string', name: 'string', description: 'string',
    modalitiesStr:    { type: 'string', default: '' },  // JSON array string
    weightClassesStr: { type: 'string', default: '' },  // JSON array string
    categoriesStr:    { type: 'string', default: '' },  // JSON array string
    createdAt: 'string', synced: { type: 'bool', default: false },
  },
};

const TournamentSchema: Realm.ObjectSchema = {
  name: 'Tournament', primaryKey: 'id',
  properties: {
    id: 'string', name: 'string', date: 'string', location: 'string',
    logo: 'string', description: 'string', status: 'string',
    martialArtIdsStr:   { type: 'string', default: '' }, // comma-separated IDs
    registrationStart:  { type: 'string', default: '' }, // ISO date or ''
    registrationEnd:    { type: 'string', default: '' }, // ISO date or ''
    createdAt: 'string', synced: { type: 'bool', default: false },
  },
};

const UserMartialArtRankSchema: Realm.ObjectSchema = {
  name: 'UserMartialArtRank', primaryKey: 'id',
  properties: {
    id: 'string', userId: 'string', martialArtId: 'string', rankSystemId: 'string',
    createdAt: 'string', synced: { type: 'bool', default: false },
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
    schema: [UserSchema, RegistrationSchema, CoachAssignmentSchema, OrganizationSchema, RankSystemSchema, MartialArtSchema, UserMartialArtRankSchema, TournamentTemplateSchema, TournamentSchema, SessionSchema],
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

export async function getAllUsers(): Promise<User[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('User')).map((u: any) => toPlain<User>(u));
}

export async function getAllAthletes(): Promise<User[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('User').filtered('role == "athlete"')).map((u: any) => toPlain<User>(u));
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const realm = await getRealm();
  const predicate = ids.map((_: string, i: number) => `id == $${i}`).join(' OR ');
  return Array.from(realm.objects('User').filtered(predicate, ...ids)).map((u: any) => toPlain<User>(u));
}

export async function getRegistrationsByAthleteIds(athleteIds: string[]): Promise<Registration[]> {
  if (athleteIds.length === 0) return [];
  const realm = await getRealm();
  const predicate = athleteIds.map((_: string, i: number) => `userId == $${i}`).join(' OR ');
  return Array.from(realm.objects('Registration').filtered(predicate, ...athleteIds)).map((r: any) => toPlain<Registration>(r));
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

export async function getRegisteredTournamentIds(userId: string): Promise<string[]> {
  const realm = await getRealm();
  const regs = Array.from(realm.objects('Registration').filtered('userId == $0', userId)) as any[];
  return [...new Set(regs.map((r: any) => r.tournamentId))];
}

export async function updateRegistration(id: string, updates: Partial<Omit<Registration, 'id' | 'synced'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Registration', id);
  if (obj) realm.write(() => { Object.assign(obj, updates); });
}

export async function deleteRegistration(id: string): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Registration', id);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── Martial Arts ──────────────────────────────────────────────────────────────

export async function createMartialArt(data: Pick<MartialArt, 'name' | 'logo'>): Promise<MartialArt> {
  const realm = await getRealm();
  let art!: any;
  realm.write(() => {
    art = realm.create('MartialArt', { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false });
  });
  return toPlain<MartialArt>(art);
}

export async function getAllMartialArts(): Promise<MartialArt[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('MartialArt')).map((a: any) => toPlain<MartialArt>(a));
}

export async function updateMartialArt(id: string, updates: Partial<Pick<MartialArt, 'name' | 'logo'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('MartialArt', id);
  if (obj) realm.write(() => { Object.assign(obj, updates); });
}

export async function deleteMartialArt(id: string): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('MartialArt', id);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── Rank Systems ──────────────────────────────────────────────────────────────

export async function createRankSystem(data: Omit<RankSystem, 'id' | 'createdAt' | 'synced'>): Promise<RankSystem> {
  const realm = await getRealm();
  let r!: any;
  realm.write(() => {
    r = realm.create('RankSystem', { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false });
  });
  return toPlain<RankSystem>(r);
}

export async function getRankSystemsByMartialArtId(martialArtId: string): Promise<RankSystem[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('RankSystem').filtered('martialArtId == $0', martialArtId))
    .map((r: any) => toPlain<RankSystem>(r))
    .sort((a, b) => a.rank - b.rank);
}

export async function updateRankSystem(id: string, updates: Partial<Omit<RankSystem, 'id' | 'martialArtId' | 'createdAt' | 'synced'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('RankSystem', id);
  if (obj) realm.write(() => { Object.assign(obj, updates); });
}

export async function deleteRankSystem(id: string): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('RankSystem', id);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── Organizations ─────────────────────────────────────────────────────────────

export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'synced'>): Promise<Organization> {
  const realm = await getRealm();
  let o!: any;
  realm.write(() => {
    o = realm.create('Organization', { ...data, id: generateId(), createdAt: new Date().toISOString(), synced: false });
  });
  return toPlain<Organization>(o);
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('Organization')).map((o: any) => toPlain<Organization>(o));
}

export async function updateOrganization(id: string, updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Organization', id);
  if (obj) realm.write(() => { Object.assign(obj, updates); });
}

export async function deleteOrganization(id: string): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Organization', id);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── Tournament Templates ──────────────────────────────────────────────────────

function templateFromRealm(t: any): TournamentTemplate {
  const plain = toPlain<any>(t);
  return {
    ...plain,
    modalities:    plain.modalitiesStr    ? JSON.parse(plain.modalitiesStr)    : [],
    weightClasses: plain.weightClassesStr ? JSON.parse(plain.weightClassesStr) : [],
    categories:    plain.categoriesStr    ? JSON.parse(plain.categoriesStr)    : [],
  };
}

export async function createTemplate(data: Omit<TournamentTemplate, 'id' | 'createdAt' | 'synced'>): Promise<TournamentTemplate> {
  const realm = await getRealm();
  let t!: any;
  const { modalities, weightClasses, categories, ...rest } = data;
  realm.write(() => {
    t = realm.create('TournamentTemplate', {
      ...rest,
      modalitiesStr:    JSON.stringify(modalities ?? []),
      weightClassesStr: JSON.stringify(weightClasses ?? []),
      categoriesStr:    JSON.stringify(categories ?? []),
      id: generateId(), createdAt: new Date().toISOString(), synced: false,
    });
  });
  return templateFromRealm(t);
}

export async function getAllTemplates(): Promise<TournamentTemplate[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('TournamentTemplate')).map((t: any) => templateFromRealm(t));
}

export async function updateTemplate(id: string, updates: Partial<Omit<TournamentTemplate, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('TournamentTemplate', id);
  if (obj) {
    const { modalities, weightClasses, categories, ...rest } = updates;
    realm.write(() => {
      Object.assign(obj, rest);
      if (modalities !== undefined)    (obj as any).modalitiesStr    = JSON.stringify(modalities);
      if (weightClasses !== undefined) (obj as any).weightClassesStr = JSON.stringify(weightClasses);
      if (categories !== undefined)    (obj as any).categoriesStr    = JSON.stringify(categories);
    });
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('TournamentTemplate', id);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── Tournaments ───────────────────────────────────────────────────────────────

function tournamentFromRealm(t: any): Tournament {
  const plain = toPlain<any>(t);
  return {
    ...plain,
    martialArtIds:     plain.martialArtIdsStr ? plain.martialArtIdsStr.split(',').filter(Boolean) : [],
    registrationStart: plain.registrationStart || null,
    registrationEnd:   plain.registrationEnd   || null,
  };
}

export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'synced'>): Promise<Tournament> {
  const realm = await getRealm();
  let t!: any;
  const { martialArtIds, registrationStart, registrationEnd, ...rest } = data;
  realm.write(() => {
    t = realm.create('Tournament', {
      ...rest,
      martialArtIdsStr:   (martialArtIds ?? []).join(','),
      registrationStart:  registrationStart ?? '',
      registrationEnd:    registrationEnd   ?? '',
      id: generateId(), createdAt: new Date().toISOString(), synced: false,
    });
  });
  return tournamentFromRealm(t);
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('Tournament')).map((t: any) => tournamentFromRealm(t));
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Tournament', id);
  return obj ? tournamentFromRealm(obj) : null;
}

export async function updateTournament(id: string, updates: Partial<Omit<Tournament, 'id' | 'createdAt' | 'synced'>>): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Tournament', id);
  if (obj) {
    const { martialArtIds, registrationStart, registrationEnd, ...rest } = updates;
    realm.write(() => {
      Object.assign(obj, rest);
      if (martialArtIds !== undefined)    (obj as any).martialArtIdsStr  = martialArtIds.join(',');
      if (registrationStart !== undefined)(obj as any).registrationStart = registrationStart ?? '';
      if (registrationEnd   !== undefined)(obj as any).registrationEnd   = registrationEnd   ?? '';
    });
  }
}

export async function deleteTournament(id: string): Promise<void> {
  const realm = await getRealm();
  const obj = realm.objectForPrimaryKey('Tournament', id);
  if (obj) realm.write(() => { realm.delete(obj); });
}

// ── User Martial Art Ranks ────────────────────────────────────────────────────

export async function getUserMartialArtRanks(userId: string): Promise<UserMartialArtRank[]> {
  const realm = await getRealm();
  return Array.from(realm.objects('UserMartialArtRank').filtered('userId == $0', userId))
    .map((r: any) => toPlain<UserMartialArtRank>(r));
}

export async function upsertUserMartialArtRank(userId: string, martialArtId: string, rankSystemId: string): Promise<void> {
  const realm = await getRealm();
  const existing = realm.objects('UserMartialArtRank').filtered('userId == $0 AND martialArtId == $1', userId, martialArtId);
  realm.write(() => {
    if (existing.length > 0) {
      (existing[0] as any).rankSystemId = rankSystemId;
    } else {
      realm.create('UserMartialArtRank', { id: generateId(), userId, martialArtId, rankSystemId, createdAt: new Date().toISOString(), synced: false });
    }
  });
}

export async function removeUserMartialArtRank(userId: string, martialArtId: string): Promise<void> {
  const realm = await getRealm();
  const results = realm.objects('UserMartialArtRank').filtered('userId == $0 AND martialArtId == $1', userId, martialArtId);
  if (results.length > 0) realm.write(() => { realm.delete(results); });
}

// ── Manager assignments ───────────────────────────────────────────────────────

export async function assignAthleteToManager(managerId: string, athleteId: string): Promise<void> {
  return assignAthleteToCoach(managerId, athleteId);
}
export async function removeAthleteFromManager(managerId: string, athleteId: string): Promise<void> {
  return removeAthleteFromCoach(managerId, athleteId);
}
export async function getAthletesByManagerId(managerId: string): Promise<User[]> {
  return getAthletesByCoachId(managerId);
}

/** @deprecated */
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
