/**
 * db/database.ts
 * Platform-aware local database.
 *
 * Metro bundler resolution order:
 *   .native.ts  → Android / iOS  (uses Realm)
 *   .web.ts     → Web            (uses AsyncStorage)
 *   .ts         → fallback       (re-exports web implementation)
 *
 * All other files import from '../../db/database' — Metro picks the right file.
 * Never import Realm here; this file is only reached as a last fallback.
 */
export * from './database.web';
