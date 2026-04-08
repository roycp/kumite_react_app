/**
 * app/screens/TournamentBracketScreen.tsx
 *
 * Admin/organizer-only bracket view for a tournament.
 * Groups registrations by category (discipline + gender + age group)
 * and generates single-elimination bracket matchups for each category.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { KumiteTheme as T } from '../../constants/theme';

// ── Bracket helpers ────────────────────────────────────────────────────────────

interface Match {
  a: string;
  b: string; // 'BYE' if bye
}

function buildBracket(participants: string[]): Match[] {
  if (participants.length === 0) return [];
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(participants.length, 2))));
  const byes = nextPow2 - participants.length;
  const seeded = [...participants];
  // Pad with BYE
  for (let i = 0; i < byes; i++) seeded.push('BYE');

  const matches: Match[] = [];
  for (let i = 0; i < seeded.length; i += 2) {
    matches.push({ a: seeded[i], b: seeded[i + 1] });
  }
  return matches;
}

interface Category {
  key: string;      // e.g. 'Kata-Masculino-Adulto'
  label: string;    // e.g. 'Kata — Masculino — Adulto'
  participants: string[];
}

function groupByCategory(registrations: DB.Registration[]): Category[] {
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

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = {
  page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
  maxW:       { maxWidth: 860, margin: '0 auto' },
  backBtn:    { background: 'none', border: 'none', color: T.colors.primary, fontSize: T.font.size.base, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' },
  pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 4 },
  pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },

  catCard:    { background: T.colors.card, borderRadius: T.radius.lg, padding: '20px 24px', marginBottom: 20, boxShadow: T.shadow.card },
  catTitle:   { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.primary, marginBottom: 4 },
  catCount:   { fontSize: T.font.size.sm, color: T.colors.muted, marginBottom: 16 },
  round:      { marginBottom: 12 },
  roundLabel: { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 },
  match:      { display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: T.colors.background, borderRadius: T.radius.md, marginBottom: 6, border: `1px solid ${T.colors.border}` },
  matchNum:   { fontSize: T.font.size.sm, color: T.colors.mutedLight, minWidth: 24, fontWeight: T.font.weight.bold },
  vsLabel:    { fontSize: T.font.size.sm, color: T.colors.mutedLight, fontWeight: T.font.weight.semibold, padding: '0 4px' },
  athlete:    { fontSize: T.font.size.base, color: T.colors.dark, fontWeight: T.font.weight.semibold },
  bye:        { fontSize: T.font.size.base, color: T.colors.mutedLight, fontStyle: 'italic' as const },

  empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
  emptyIcon:  { fontSize: 52, display: 'block', marginBottom: 14 },
  emptyTxt:   { fontSize: T.font.size.xl },
  loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
} as const;

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function TournamentBracketScreen() {
  const router   = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');
  const params   = useLocalSearchParams<{ tournamentId: string }>();
  const tournamentId = String(params.tournamentId ?? '');

  const [tournament,    setTournament]    = useState<DB.Tournament | null>(null);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [loadingData,   setLoading]       = useState(true);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    const [t, regs] = await Promise.all([
      DB.getTournamentById(tournamentId),
      DB.getRegistrationsByTournamentId(tournamentId),
    ]);
    setTournament(t);
    setCategories(groupByCategory(regs));
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="tournament-bracket-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="tournament-bracket-screen">
        <div style={s.maxW}>
          <button style={s.backBtn} onClick={() => router.back()}>← Volver</button>

          <div style={s.pageTitle}>
            {tournament ? `${tournament.logo} ${tournament.name}` : 'Bracket'}
          </div>
          <div style={s.pageSub}>Bracket por categoría</div>

          {categories.length === 0 ? (
            <div style={s.empty} data-testid="bracket-empty">
              <span style={s.emptyIcon}>🏆</span>
              <div style={s.emptyTxt}>No hay participantes inscritos aún.</div>
            </div>
          ) : (
            categories.map(cat => {
              const matches = buildBracket(cat.participants);
              const catTestId = `bracket-category-${cat.key.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <div key={cat.key} style={s.catCard} data-testid={catTestId}>
                  <div style={s.catTitle}>{cat.label}</div>
                  <div style={s.catCount}>
                    {cat.participants.length} participante{cat.participants.length !== 1 ? 's' : ''}
                  </div>

                  <div style={s.round}>
                    <div style={s.roundLabel}>Ronda 1</div>
                    {matches.map((m, i) => (
                      <div key={i} style={s.match} data-testid={`bracket-match-${catTestId}-${i}`}>
                        <span style={s.matchNum}>{i + 1}</span>
                        <span
                          style={m.a === 'BYE' ? s.bye : s.athlete}
                          data-testid={m.a !== 'BYE' ? `participant-${m.a.replace(/\s+/g, '-')}` : undefined}
                        >
                          {m.a}
                        </span>
                        <span style={s.vsLabel}>vs</span>
                        <span
                          style={m.b === 'BYE' ? s.bye : s.athlete}
                          data-testid={m.b !== 'BYE' ? `participant-${m.b.replace(/\s+/g, '-')}` : undefined}
                        >
                          {m.b}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Sidebar>
  );
}
