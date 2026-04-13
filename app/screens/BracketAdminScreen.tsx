/**
 * app/screens/BracketAdminScreen.tsx
 *
 * Admin interface for managing bracket seeding per category.
 * Allows admins to reorder athletes using up/down buttons or drag-and-drop.
 * Persists the seed order via DB.saveBracketSeeds().
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';
import { groupByCategory, type BracketCategory as Category } from '../../utils/bracketUtils';
import { BracketParticipantCard } from '../../components/BracketParticipantCard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ── Styles ────────────────────────────────────────────────────────────────────

// ── Screen ────────────────────────────────────────────────────────────────────

export default function BracketAdminScreen() {
  const T = useKumiteTheme();
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 860, margin: '0 auto' },
    backBtn:    { background: 'none', border: 'none', color: T.colors.primary, fontSize: T.font.size.base, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 4 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    saveRow:    { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
    saveBtn:    { padding: '10px 28px', border: 'none', borderRadius: T.radius.xl, cursor: 'pointer', fontFamily: 'inherit', fontSize: T.font.size.base, background: T.colors.primary, color: '#fff', fontWeight: T.font.weight.bold },
    savedMsg:   { fontSize: T.font.size.sm, color: T.colors.success, fontWeight: T.font.weight.semibold },
  
    catCard:    { background: T.colors.card, borderRadius: T.radius.lg, padding: '20px 24px', marginBottom: 20, boxShadow: T.shadow.card },
    catTitle:   { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.primary, marginBottom: 4 },
    catCount:   { fontSize: T.font.size.sm, color: T.colors.muted, marginBottom: 16 },
  
    athleteRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: T.radius.md, marginBottom: 6, background: T.colors.background, border: `1px solid ${T.colors.border}`, cursor: 'grab' },
    athleteRowDragging: { opacity: 0.4 },
    seed:       { fontSize: T.font.size.sm, color: T.colors.mutedLight, minWidth: 24, fontWeight: T.font.weight.bold, textAlign: 'center' as const },
    name:       { flex: 1, fontSize: T.font.size.base, color: T.colors.dark, fontWeight: T.font.weight.semibold },
    arrowBtn:   { background: 'none', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, cursor: 'pointer', padding: '2px 8px', fontSize: T.font.size.sm, color: T.colors.textSub, lineHeight: 1.5 },
  
    empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  } as const;


  const router    = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');
  const params    = useLocalSearchParams<{ tournamentId: string }>();
  const tournamentId = String(params.tournamentId ?? '');

  const [tournament,  setTournament] = useState<DB.Tournament | null>(null);
  const [categories,  setCategories] = useState<Category[]>([]);
  const [loadingData, setLoading]    = useState(true);
  const [saved,       setSaved]      = useState(false);

  // drag state
  const dragItem = useRef<{ catKey: string; idx: number } | null>(null);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage, router]);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    const [t, regs, seeds, users] = await Promise.all([
      DB.getTournamentById(tournamentId),
      DB.getRegistrationsByTournamentId(tournamentId),
      DB.getBracketSeeds(tournamentId),
      DB.getAllUsers(),
    ]);
    setTournament(t);
    const uMap = Object.fromEntries(users.map(u => [u.id, u]));
    const cats = groupByCategory(regs, uMap);
    const seeded = cats.map(cat => {
      const savedOrder = seeds[cat.key];
      if (!savedOrder || savedOrder.length === 0) return cat;
      const orderMap = new Map(savedOrder.map((name, i) => [name, i]));
      const sorted = [...cat.participants].sort((a, b) => {
        const ia = orderMap.has(a.name) ? orderMap.get(a.name)! : Infinity;
        const ib = orderMap.has(b.name) ? orderMap.get(b.name)! : Infinity;
        return ia - ib;
      });
      return { ...cat, participants: sorted };
    });
    setCategories(seeded);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const moveParticipant = (catKey: string, from: number, to: number) => {
    setSaved(false);
    setCategories(prev =>
      prev.map(cat =>
        cat.key === catKey
          ? { ...cat, participants: moveItem(cat.participants, from, to) }
          : cat,
      ),
    );
  };

  const handleSave = async () => {
    const seeds: Record<string, string[]> = {};
    for (const cat of categories) seeds[cat.key] = cat.participants.map(p => p.name);
    await DB.saveBracketSeeds(tournamentId, seeds);
    setSaved(true);
  };

  // DnD handlers
  const onDragStart = (catKey: string, idx: number) => { dragItem.current = { catKey, idx }; };
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop      = (catKey: string, idx: number) => {
    if (!dragItem.current || dragItem.current.catKey !== catKey) return;
    const from = dragItem.current.idx;
    dragItem.current = null;
    if (from !== idx) moveParticipant(catKey, from, idx);
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="bracket-admin-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="bracket-admin-screen">
        <div style={s.maxW}>
          <button style={s.backBtn} onClick={() => router.back()}>← Volver</button>

          <div style={s.pageTitle}>
            {tournament ? `${tournament.logo} ${tournament.name}` : 'Seeding'}
          </div>
          <div style={s.pageSub}>Ordena los atletas por categoría · Ronda 1 usa este orden</div>

          <div style={s.saveRow}>
            <button style={s.saveBtn} onClick={handleSave} data-testid="btn-save-seeding">
              Guardar Seeding
            </button>
            {saved && <span style={s.savedMsg} data-testid="saved-confirmation">✓ Guardado</span>}
          </div>

          {categories.length === 0 ? (
            <div style={s.empty} data-testid="bracket-admin-empty">
              No hay participantes inscritos aún.
            </div>
          ) : (
            categories.map(cat => {
              const catTestId = `seeding-category-${cat.key.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <div key={cat.key} style={s.catCard} data-testid={catTestId}>
                  <div style={s.catTitle}>{cat.label}</div>
                  <div style={s.catCount}>
                    {cat.participants.length} participante{cat.participants.length !== 1 ? 's' : ''}
                  </div>

                  {cat.participants.map((p, idx) => (
                    <div
                      key={`${p.name}-${idx}`}
                      style={s.athleteRow}
                      draggable
                      onDragStart={() => onDragStart(cat.key, idx)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(cat.key, idx)}
                      data-testid={`athlete-seed-row-${catTestId}-${idx}`}
                    >
                      <span style={s.seed}>{idx + 1}</span>
                      <BracketParticipantCard
                        name={p.name}
                        org={p.org}
                        country={p.country}
                        data-testid={`seed-name-${catTestId}-${idx}`}
                      />

                      <button
                        style={s.arrowBtn}
                        disabled={idx === 0}
                        onClick={() => moveParticipant(cat.key, idx, idx - 1)}
                        data-testid={`btn-move-up-${catTestId}-${idx}`}
                        aria-label={`Mover ${p.name} arriba`}
                      >
                        ▲
                      </button>
                      <button
                        style={s.arrowBtn}
                        disabled={idx === cat.participants.length - 1}
                        onClick={() => moveParticipant(cat.key, idx, idx + 1)}
                        data-testid={`btn-move-down-${catTestId}-${idx}`}
                        aria-label={`Mover ${p.name} abajo`}
                      >
                        ▼
                      </button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Sidebar>
  );
}
