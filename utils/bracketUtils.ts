/**
 * utils/bracketUtils.ts
 * Shared helpers for tournament bracket features.
 */
import type * as DB from '../db/database';

export interface BracketParticipant {
  name: string;
  org?: string;     // academy / organization name
  country?: string; // country name (e.g. 'Japan') for flag lookup
}

export interface BracketCategory {
  key: string;      // e.g. 'Kata-Femenino-Adulto'
  label: string;    // e.g. 'Kata — Femenino — Adulto'
  participants: BracketParticipant[];
}

/**
 * Groups registrations into bracket categories.
 * Optionally accepts a userMap (id → User) to populate country per participant.
 */
export function groupByCategory(
  registrations: DB.Registration[],
  userMap?: Record<string, DB.User>,
): BracketCategory[] {
  const map: Record<string, BracketParticipant[]> = {};
  for (const reg of registrations) {
    for (const entry of (reg.modalities ?? [])) {
      const disc     = entry.discipline || 'Sin disciplina';
      const gender   = entry.gender     || 'General';
      const ageGroup = entry.ageGroup   || 'General';
      const key = `${disc}-${gender}-${ageGroup}`;
      if (!map[key]) map[key] = [];
      map[key].push({
        name:    reg.athleteName || 'Atleta',
        org:     reg.academy     || undefined,
        country: userMap?.[reg.userId]?.country || undefined,
      });
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, participants]) => {
      const [disc, gender, ageGroup] = key.split('-');
      return { key, label: `${disc} — ${gender} — ${ageGroup}`, participants };
    });
}
