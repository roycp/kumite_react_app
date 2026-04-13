/**
 * app/screens/WeighInAdminScreen.tsx
 *
 * Admin screen for recording athlete weigh-in results.
 * Only accessible when tournament status is 'weigh_in_open'.
 * Entries are final once recorded.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { BracketParticipantCard } from '../../components/BracketParticipantCard';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Flat athlete entry: one row per modality per registration. */
interface AthleteEntry {
  registrationId: string;
  athleteName: string;
  org?: string;
  country?: string;
  discipline: string;
  weightDivision: string | null;
  entryKey: string; // `${registrationId}-${discipline}`
}

/** Extracts a simple key used for search. */
function matchesSearch(entry: AthleteEntry, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  return (
    entry.athleteName.toLowerCase().includes(lower) ||
    (entry.org ?? '').toLowerCase().includes(lower) ||
    entry.discipline.toLowerCase().includes(lower)
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WeighInAdminScreen() {
  const T = useKumiteTheme();
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 860, margin: '0 auto' },
    backBtn:    { background: 'none', border: 'none', color: T.colors.primary, fontSize: T.font.size.base, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 4 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 24 },
  
    searchWrap: { position: 'relative' as const, marginBottom: 20 },
    searchIcon: { position: 'absolute' as const, left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' as const },
    searchInput:{ width: '100%', height: 44, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, paddingLeft: 40, paddingRight: 14, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', background: T.colors.card, boxSizing: 'border-box' as const },
  
    row:        { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.colors.card, borderRadius: T.radius.md, marginBottom: 8, boxShadow: T.shadow.card },
    divBadge:   { display: 'inline-block', padding: '2px 8px', borderRadius: T.radius.pill, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, background: T.colors.primaryLight, color: T.colors.primary, whiteSpace: 'nowrap' as const, flexShrink: 0 },
    recordBtn:  { padding: '6px 14px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' as const },
  
    meetsBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: T.radius.pill, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: '#2e7d32', flexShrink: 0, whiteSpace: 'nowrap' as const },
    lostBadge:  { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fce8e6', border: '1px solid #f4b8b5', borderRadius: T.radius.pill, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: '#b3261e', flexShrink: 0, whiteSpace: 'nowrap' as const },
  
    // Modal overlay
    overlay:    { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
    modal:      { background: T.colors.card, borderRadius: T.radius.lg, padding: '28px 32px', width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    modalTitle: { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 16 },
    infoRow:    { display: 'flex', gap: 8, fontSize: T.font.size.base, color: T.colors.text, marginBottom: 8 },
    infoLabel:  { fontWeight: T.font.weight.semibold, color: T.colors.textSub, minWidth: 130 },
    label:      { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub, marginBottom: 4, marginTop: 16 },
    input:      { padding: '9px 12px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    btnRow:     { display: 'flex', gap: 8, marginTop: 20 },
    btnPrimary: { padding: '9px 22px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    btnGhost:   { padding: '8px 16px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    locked:     { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.error, background: '#fff5f5', borderRadius: T.radius.lg, boxShadow: T.shadow.card, border: `1px solid ${T.colors.error}` },
    loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  } as const;


  const router    = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');
  const params    = useLocalSearchParams<{ tournamentId: string }>();
  const tournamentId = String(params.tournamentId ?? '');

  const [tournament,    setTournament]  = useState<DB.Tournament | null>(null);
  const [entries,       setEntries]     = useState<AthleteEntry[]>([]);
  const [results,       setResults]     = useState<Record<string, DB.WeighInResult>>({});
  const [loadingData,   setLoading]     = useState(true);
  const [query,         setQuery]       = useState('');

  // Modal state
  const [modal, setModal] = useState<{ entry: AthleteEntry } | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [modalError,   setModalError]  = useState('');

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage, router]);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    const [t, regs, users, existingResults] = await Promise.all([
      DB.getTournamentById(tournamentId),
      DB.getRegistrationsByTournamentId(tournamentId),
      DB.getAllUsers(),
      DB.getWeighInResultsByTournamentId(tournamentId),
    ]);
    setTournament(t);

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Build one entry per modality per registration
    const built: AthleteEntry[] = [];
    for (const reg of regs) {
      const user = userMap[reg.userId];
      for (const mod of (reg.modalities ?? [])) {
        if (mod.weightDivision === null) continue; // skip non-weight disciplines
        built.push({
          registrationId: reg.id,
          athleteName:    reg.athleteName,
          org:            reg.academy,
          country:        user?.country,
          discipline:     mod.discipline,
          weightDivision: mod.weightDivision,
          entryKey:       `${reg.id}-${mod.discipline}`,
        });
      }
    }
    setEntries(built);

    const resultMap: Record<string, DB.WeighInResult> = {};
    for (const r of existingResults) {
      resultMap[`${r.registrationId}-${r.discipline}`] = r;
    }
    setResults(resultMap);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const openModal = (entry: AthleteEntry) => {
    setModal({ entry });
    setActualWeight('');
    setModalError('');
  };

  const closeModal = () => setModal(null);

  const handleRecord = async () => {
    if (!modal) return;
    const kg = parseFloat(actualWeight.replace(',', '.'));
    if (isNaN(kg) || kg <= 0) {
      setModalError('Ingresa un peso válido en kg.');
      return;
    }

    const entry = modal.entry;
    // Determine result: parse maxKg from weight division string
    // e.g. "Sub-40 kg" → 40, "40–50 kg" → 50, "+90 kg (Open)" → null
    let maxKg: number | null = null;
    const match = entry.weightDivision?.match(/[\u2013\-]?\s*(\d+)\s*kg/i);
    if (match) {
      // Take the last number (upper bound)
      const nums = entry.weightDivision?.match(/\d+/g);
      if (nums) maxKg = parseFloat(nums[nums.length - 1]);
    }

    const status: DB.WeighInResult['status'] =
      maxKg === null ? 'meets_weight' : (kg <= maxKg ? 'meets_weight' : 'lost_weight');

    await DB.saveWeighInResult({
      tournamentId,
      registrationId: entry.registrationId,
      athleteName:    entry.athleteName,
      discipline:     entry.discipline,
      weightDivision: entry.weightDivision,
      actualWeightKg: kg,
      status,
    });

    setResults(prev => ({
      ...prev,
      [entry.entryKey]: {
        id: '', tournamentId, registrationId: entry.registrationId,
        athleteName: entry.athleteName, discipline: entry.discipline,
        weightDivision: entry.weightDivision, actualWeightKg: kg,
        status, timestamp: new Date().toISOString(), synced: false,
      },
    }));
    closeModal();
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="weigh-in-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  // Access guard: only when status is weigh_in_open
  if (!tournament || tournament.status !== 'weigh_in_open') {
    return (
      <Sidebar>
        <div style={s.page} data-testid="weigh-in-screen">
          <div style={s.maxW}>
            <button style={s.backBtn} onClick={() => router.back()}>← Volver</button>
            <div style={s.locked} data-testid="weigh-in-locked">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <div style={{ fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, marginBottom: 8 }}>
                Pesaje no disponible
              </div>
              <div>El torneo debe estar en estado «Pesaje Abierto» para registrar pesos.</div>
              {tournament && (
                <div style={{ marginTop: 8, fontSize: T.font.size.sm, color: T.colors.muted }}>
                  Estado actual: {tournament.status}
                </div>
              )}
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  const filtered = entries.filter(e => matchesSearch(e, query));

  return (
    <Sidebar>
      <div style={s.page} data-testid="weigh-in-screen">
        <div style={s.maxW}>
          <button style={s.backBtn} onClick={() => router.back()}>← Volver</button>
          <div style={s.pageTitle}>{tournament.logo} Pesaje</div>
          <div style={s.pageSub}>{tournament.name} · Registra los pesos de los atletas</div>

          {/* Search */}
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Buscar atleta, organización o disciplina…"
              value={query}
              onChange={(e: any) => setQuery((e.target as HTMLInputElement).value)}
              data-testid="weigh-in-search"
            />
          </div>

          {entries.length === 0 ? (
            <div style={s.empty} data-testid="weigh-in-empty">
              No hay atletas inscritos con categorías de peso.
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty} data-testid="weigh-in-no-results">
              No se encontraron atletas para «{query}».
            </div>
          ) : (
            <div data-testid="weigh-in-list">
              {filtered.map(entry => {
                const recorded = results[entry.entryKey];
                return (
                  <div key={entry.entryKey} style={s.row} data-testid={`weigh-in-row-${entry.entryKey}`}>
                    <BracketParticipantCard
                      name={entry.athleteName}
                      org={entry.org}
                      country={entry.country}
                    />
                    <span style={s.divBadge} data-testid={`weigh-in-division-${entry.entryKey}`}>
                      {entry.discipline} · {entry.weightDivision}
                    </span>
                    {recorded ? (
                      <span
                        style={recorded.status === 'meets_weight' ? s.meetsBadge : s.lostBadge}
                        data-testid={`weigh-in-result-${entry.entryKey}`}
                      >
                        {recorded.status === 'meets_weight' ? '✓ Pesa' : '✗ No pesa'}
                        {' '}({recorded.actualWeightKg} kg)
                      </span>
                    ) : (
                      <button
                        style={s.recordBtn}
                        onClick={() => openModal(entry)}
                        data-testid={`btn-record-${entry.entryKey}`}
                      >
                        Registrar Peso
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Weigh-in modal */}
      {modal && (
        <div style={s.overlay} data-testid="weigh-in-modal">
          <div style={s.modal}>
            <div style={s.modalTitle}>Registrar Peso</div>
            <BracketParticipantCard
              name={modal.entry.athleteName}
              org={modal.entry.org}
              country={modal.entry.country}
              style={{ marginBottom: 12 }}
            />
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Disciplina:</span>
              <span>{modal.entry.discipline}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Categoría de peso:</span>
              <span data-testid="modal-weight-division">{modal.entry.weightDivision ?? '—'}</span>
            </div>
            <div style={s.label}>Peso real (kg)</div>
            <input
              style={s.input}
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 68.5"
              value={actualWeight}
              onChange={(e: any) => { setActualWeight((e.target as HTMLInputElement).value); setModalError(''); }}
              data-testid="modal-actual-weight"
              autoFocus
            />
            {modalError && (
              <div style={{ color: T.colors.error, fontSize: T.font.size.sm, marginTop: 6 }} data-testid="modal-error">
                {modalError}
              </div>
            )}
            <div style={s.btnRow}>
              <button style={s.btnPrimary} onClick={handleRecord} data-testid="btn-confirm-weight">
                Confirmar
              </button>
              <button style={s.btnGhost} onClick={closeModal} data-testid="btn-cancel-weight">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
