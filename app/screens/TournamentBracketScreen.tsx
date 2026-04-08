/**
 * app/screens/TournamentBracketScreen.tsx
 *
 * Admin/organizer-only bracket view for a tournament.
 * Groups registrations by category (discipline + gender + age group)
 * and renders single-elimination brackets using @g-loot/react-tournament-brackets.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SingleEliminationBracket, Match, SVGViewer } from '@g-loot/react-tournament-brackets';
import type { MatchType } from '@g-loot/react-tournament-brackets';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { KumiteTheme as T } from '../../constants/theme';

// ── Bracket helpers ────────────────────────────────────────────────────────────

function buildGlootMatches(participants: string[]): MatchType[] {
  if (participants.length === 0) return [];

  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(participants.length, 2))));
  const seeded = [...participants];
  while (seeded.length < nextPow2) seeded.push('BYE');

  const totalRounds = Math.log2(nextPow2);

  // Pre-compute match IDs per round (round 0 = first round)
  const rounds: number[][] = [];
  let matchId = 1;
  let roundSize = nextPow2 / 2;
  for (let r = 0; r < totalRounds; r++) {
    const roundIds: number[] = [];
    for (let i = 0; i < roundSize; i++) roundIds.push(matchId++);
    rounds.push(roundIds);
    roundSize = Math.floor(roundSize / 2);
  }

  const matches: MatchType[] = [];
  for (let r = 0; r < totalRounds; r++) {
    const roundIds = rounds[r];
    const nextRound = rounds[r + 1] ?? [];
    for (let i = 0; i < roundIds.length; i++) {
      const id = roundIds[i];
      const nextMatchId = nextRound.length > 0 ? nextRound[Math.floor(i / 2)] : null;
      const pts = r === 0
        ? [
            { id: `p-${id}-0`, name: seeded[i * 2],     resultText: null, isWinner: false, status: null },
            { id: `p-${id}-1`, name: seeded[i * 2 + 1], resultText: null, isWinner: false, status: null },
          ]
        : [
            { id: `p-${id}-0`, name: 'TBD', resultText: null, isWinner: false, status: null },
            { id: `p-${id}-1`, name: 'TBD', resultText: null, isWinner: false, status: null },
          ];
      matches.push({ id, name: `Match ${id}`, nextMatchId, startTime: '', state: 'SCHEDULED', participants: pts });
    }
  }

  return matches;
}

interface Category {
  key: string;
  label: string;
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
  page:        { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
  maxW:        { maxWidth: 960, margin: '0 auto' },
  backBtn:     { background: 'none', border: 'none', color: T.colors.primary, fontSize: T.font.size.base, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' },
  pageTitle:   { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 4 },
  pageSub:     { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  catCard:     { background: T.colors.card, borderRadius: T.radius.lg, padding: '20px 24px', marginBottom: 20, boxShadow: T.shadow.card },
  catTitle:    { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.primary, marginBottom: 4 },
  catCount:    { fontSize: T.font.size.sm, color: T.colors.muted, marginBottom: 16 },
  bracketWrap: { overflowX: 'auto' as const },
  empty:       { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
  emptyIcon:   { fontSize: 52, display: 'block', marginBottom: 14 },
  emptyTxt:    { fontSize: T.font.size.xl },
  loading:     { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
} as const;

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function TournamentBracketScreen() {
  const router    = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');
  const params    = useLocalSearchParams<{ tournamentId: string }>();
  const tournamentId = String(params.tournamentId ?? '');

  const [tournament,  setTournament] = useState<DB.Tournament | null>(null);
  const [categories,  setCategories] = useState<Category[]>([]);
  const [loadingData, setLoading]    = useState(true);

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
              const catTestId = `bracket-category-${cat.key.toLowerCase().replace(/\s+/g, '-')}`;
              const glootMatches = buildGlootMatches(cat.participants);
              return (
                <div key={cat.key} style={s.catCard} data-testid={catTestId}>
                  <div style={s.catTitle}>{cat.label}</div>
                  <div style={s.catCount}>
                    {cat.participants.length} participante{cat.participants.length !== 1 ? 's' : ''}
                  </div>
                  <div style={s.bracketWrap}>
                    <SingleEliminationBracket
                      matches={glootMatches}
                      matchComponent={Match}
                      options={{ style: {} }}
                      svgWrapper={({ children, bracketWidth, bracketHeight }) => (
                        <SVGViewer
                          width={Math.max(bracketWidth, 400)}
                          height={Math.max(bracketHeight, 200)}
                          bracketWidth={bracketWidth}
                          bracketHeight={bracketHeight}
                          startAt={[0, 0]}
                          scaleFactor={1}
                        >
                          {children}
                        </SVGViewer>
                      )}
                    />
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
