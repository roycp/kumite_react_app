import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_BASE_URL } from '../constants/serverConfig';

const TOKEN_KEY = 'session:jwt';

// ── Token helpers ──────────────────────────────────────────────────────────────

export async function storeToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ── Error type ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── _id normalizer ─────────────────────────────────────────────────────────────
// Server already normalizes _id → id (ticket 01), but this guards against
// any response that slips through without normalization.

function normalizeDoc(doc: unknown): unknown {
  if (!doc || typeof doc !== 'object') return doc;
  if (Array.isArray(doc)) return (doc as unknown[]).map(normalizeDoc);
  const obj = doc as Record<string, unknown>;
  if ('_id' in obj) {
    const { _id, __v, ...rest } = obj;
    return { id: String(_id), ...rest };
  }
  return obj;
}

// ── Core fetch ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await loadToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${SERVER_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, (json as any)?.error ?? res.statusText);
  }

  return normalizeDoc(json) as T;
}

// ── Public helpers ─────────────────────────────────────────────────────────────

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path: string): Promise<void> {
  return apiFetch<void>(path, { method: 'DELETE' });
}
