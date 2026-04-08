/**
 * utils/bracketUtils.ts
 * Shared helpers for tournament bracket features.
 */
import type * as DB from '../db/database';

export interface BracketCategory {
  key: string;      // e.g. 'Kata-Femenino-Adulto'
  label: string;    // e.g. 'Kata — Femenino — Adulto'
  participants: string[];
}

export function groupByCategory(registrations: DB.Registration[]): BracketCategory[] {
  const map: Record<string, string[]> = {};
  for (const reg of registrations) {
    for (const entry of (reg.modalities ?? [])) {
      const disc     = entry.discipline || 'Sin disciplina';
      const gender   = entry.gender     || 'General';
      const ageGroup = entry.ageGroup   || 'General';
      const key = `${disc}-${gender}-${ageGroup}`;
      if (!map[key]) map[key] = [];
      map[key].push(reg.athleteName || 'Atleta');
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, participants]) => {
      const [disc, gender, ageGroup] = key.split('-');
      return { key, label: `${disc} — ${gender} — ${ageGroup}`, participants };
    });
}
