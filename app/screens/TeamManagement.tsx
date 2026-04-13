/**
 * screens/TeamManagement.tsx
 *
 * Manager-only screen. Shows all athletes assigned to the current manager
 * and their active tournament registrations. The manager can:
 *   - View their full team roster
 *   - Register a new athlete (via TournamentSearch with athleteId param)
 *   - Remove an athlete from the team
 *   - View/edit an athlete's active registrations
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import { getTournamentById } from '../../data/tournaments';
import Sidebar from '../../components/Sidebar';
import ModalityCard from '../../components/ModalityCard';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useKumiteTheme } from '../../context/ThemeContext';

type Tab = 'team' | 'add';

export default function TeamManagement() {
  const T = useKumiteTheme();
  const s = {
    page:        { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:        { maxWidth: 860, margin: '0 auto' },
    pageTitle:   { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
    pageSub:     { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 24 },
    tabs:        { display: 'flex', borderBottom: `2px solid ${T.colors.border}`, marginBottom: 24 },
    tab:         (active: boolean): any => ({
      padding: '10px 22px', background: 'none', border: 'none',
      borderBottom: active ? `2px solid ${T.colors.primary}` : '2px solid transparent',
      color: active ? T.colors.primary : T.colors.textLight,
      fontWeight: active ? T.font.weight.bold : T.font.weight.normal,
      cursor: 'pointer', fontSize: T.font.size.lg, fontFamily: 'inherit', marginBottom: -2,
    }),
    // Athlete card
    athleteCard: { background: T.colors.card, borderRadius: T.radius.lg, padding: 20, marginBottom: 14, boxShadow: T.shadow.card },
    cardHeader:  { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 },
    avatar:      { width: 48, height: 48, borderRadius: '50%', background: T.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
    athleteMeta: { flex: 1 },
    athleteName: { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 2 },
    athleteSub:  { fontSize: T.font.size.md, color: T.colors.muted },
    btnRow:      { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
    enrollBtn:   { padding: '6px 14px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    removeBtn:   { padding: '6px 14px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
    // Registrations inside athlete card
    regsLabel:   { fontSize: T.font.size.md, fontWeight: T.font.weight.semibold, color: T.colors.muted, marginBottom: 8 },
    modalGrid:   { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
    noRegs:      { fontSize: T.font.size.md, color: T.colors.mutedLight, fontStyle: 'italic' },
    // Add athlete tab
    addCard:     { background: T.colors.card, borderRadius: T.radius.lg, padding: 20, marginBottom: 12, boxShadow: T.shadow.card, display: 'flex', alignItems: 'center', gap: 14 },
    addBtn:      { padding: '7px 18px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.md, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    alreadyBadge:{ padding: '6px 14px', background: T.colors.successLight, border: `1px solid #a5d6a7`, borderRadius: T.radius.xl, color: T.colors.success, fontSize: T.font.size.md, fontWeight: T.font.weight.semibold },
    // Empty / loading
    loading:     { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
    empty:       { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    emptyIcon:   { fontSize: 52, display: 'block', marginBottom: 14 },
    emptyTxt:    { fontSize: T.font.size.xl, marginBottom: 8 },
  } as const;


  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();

  const [tab,          setTab]          = useState<Tab>('team');
  const [myAthletes,   setMyAthletes]   = useState<DB.User[]>([]);
  const [allAthletes,  setAllAthletes]  = useState<DB.User[]>([]);
  // registrations keyed by athleteId
  const [regsByAthlete, setRegsByAthlete] = useState<Record<string, DB.Registration[]>>({});
  const [loadingData,  setLoadingData]  = useState(true);

  // Redirect non-managers
  useEffect(() => {
    if (!isLoading && currentUser && currentUser.role !== 'manager') {
      router.replace('/screens/MainScreen');
    }
  }, [currentUser, isLoading]);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);

    const [mine, all] = await Promise.all([
      DB.getAthletesByManagerId(currentUser.id),
      DB.getAllAthletes(),
    ]);

    const mineIds = new Set(mine.map(a => a.id));
    setMyAthletes(mine);
    setAllAthletes(all.filter(a => !mineIds.has(a.id)));

    // Load each athlete's active registrations
    if (mine.length > 0) {
      const regs = await DB.getRegistrationsByAthleteIds(mine.map(a => a.id));
      const today = new Date(new Date().toDateString());
      const map: Record<string, DB.Registration[]> = {};
      mine.forEach(a => { map[a.id] = []; });
      regs.forEach(r => {
        const t = getTournamentById(r.tournamentId);
        if (!t || new Date(t.date) >= today) {
          map[r.userId] = [...(map[r.userId] ?? []), r];
        }
      });
      setRegsByAthlete(map);
    }

    setLoadingData(false);
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const addToTeam = async (athleteId: string) => {
    if (!currentUser) return;
    await DB.assignAthleteToManager(currentUser.id, athleteId);
    await loadData();
  };

  const removeFromTeam = async (athleteId: string) => {
    if (!currentUser) return;
    await DB.removeAthleteFromManager(currentUser.id, athleteId);
    await loadData();
  };

  const enrollAthlete = (athlete: DB.User) => {
    // Navigate to TournamentSearch with the athlete's id pre-selected
    router.push(`/screens/TournamentSearch?athleteId=${athlete.id}&athleteName=${encodeURIComponent(athlete.fullName)}` as any);
  };

  if (isLoading || !currentUser || currentUser.role !== 'manager') return null;

  return (
    <Sidebar>
      <style>{`
        @media (max-width: 600px) {
          .kb-team-page { padding: 16px 12px !important; }
          .kb-team-card { padding: 14px !important; }
          .kb-team-btnrow { flex-direction: column !important; }
          .kb-team-btnrow button { width: 100% !important; box-sizing: border-box; }
        }
      `}</style>
      <div data-testid="team-management-screen" className="kb-team-page" style={s.page}>
        <div style={s.maxW}>
          <div style={s.pageTitle}>👥 Mi Equipo</div>
          <div style={s.pageSub}>Gestiona los atletas bajo tu dirección</div>

          <div style={s.tabs}>
            <button style={s.tab(tab === 'team')} onClick={() => setTab('team')}>
              Mi Equipo ({myAthletes.length})
            </button>
            <button style={s.tab(tab === 'add')} onClick={() => setTab('add')}>
              Agregar Atleta ({allAthletes.length})
            </button>
          </div>

          {loadingData ? (
            <div style={s.loading}>Cargando…</div>
          ) : tab === 'team' ? (
            myAthletes.length === 0 ? (
              <div style={s.empty}>
                <span style={s.emptyIcon}>👥</span>
                <div style={s.emptyTxt}>No tienes atletas en tu equipo aún</div>
                <div style={{ fontSize: T.font.size.base, color: T.colors.mutedLight }}>Ve a «Agregar Atleta» para incorporar atletas a tu equipo</div>
              </div>
            ) : (
              myAthletes.map(athlete => {
                const regs = regsByAthlete[athlete.id] ?? [];
                return (
                  <div key={athlete.id} className="kb-team-card" style={s.athleteCard} data-testid={`athlete-card-${athlete.id}`}>
                    <div style={s.cardHeader}>
                      <div style={s.avatar}>🥋</div>
                      <div style={s.athleteMeta}>
                        <div style={s.athleteName}>{athlete.fullName}</div>
                        <div style={s.athleteSub}>
                          {athlete.academy} · {athlete.country}
                          {athlete.beltGrade ? ` · ${athlete.beltGrade}` : ''}
                          {athlete.weight ? ` · ${athlete.weight} kg` : ''}
                        </div>
                      </div>
                      <div className="kb-team-btnrow" style={s.btnRow}>
                        <button
                          data-testid={`btn-enroll-${athlete.id}`}
                          style={s.enrollBtn}
                          type="button"
                          onClick={() => enrollAthlete(athlete)}
                        >
                          + Inscribir en torneo
                        </button>
                        <button
                          data-testid={`btn-remove-${athlete.id}`}
                          style={s.removeBtn}
                          type="button"
                          onClick={() => removeFromTeam(athlete.id)}
                        >
                          Quitar del equipo
                        </button>
                      </div>
                    </div>

                    <div style={s.regsLabel}>
                      Torneos activos ({regs.length}):
                    </div>
                    {regs.length === 0 ? (
                      <div style={s.noRegs}>Sin inscripciones activas</div>
                    ) : (
                      regs.map(reg => {
                        const t = getTournamentById(reg.tournamentId);
                        return (
                          <div key={reg.id} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: T.font.size.md, fontWeight: T.font.weight.semibold, color: T.colors.dark, marginBottom: 6 }}>
                              {t?.logo ?? '🥋'} {reg.tournamentName}
                              {t && <span style={{ color: T.colors.muted, fontWeight: T.font.weight.normal }}> · {t.date}</span>}
                            </div>
                            {reg.modalities && reg.modalities.length > 0 && (
                              <div style={s.modalGrid}>
                                {reg.modalities.map((m: DB.ModalityEntry, j: number) => (
                                  <ModalityCard key={j} modality={m} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })
            )
          ) : (
            // Add athlete tab
            allAthletes.length === 0 ? (
              <div style={s.empty}>
                <span style={s.emptyIcon}>🔍</span>
                <div style={s.emptyTxt}>No hay atletas disponibles</div>
                <div style={{ fontSize: T.font.size.base, color: T.colors.mutedLight }}>Los atletas aparecen aquí cuando se registran en la app</div>
              </div>
            ) : (
              allAthletes.map(athlete => (
                <div key={athlete.id} className="kb-team-card" style={s.addCard} data-testid={`available-athlete-${athlete.id}`}>
                  <div style={s.avatar}>🥋</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.athleteName}>{athlete.fullName}</div>
                    <div style={s.athleteSub}>
                      {athlete.academy} · {athlete.country}
                      {athlete.beltGrade ? ` · ${athlete.beltGrade}` : ''}
                    </div>
                  </div>
                  <button
                    data-testid={`btn-add-${athlete.id}`}
                    style={s.addBtn}
                    type="button"
                    onClick={() => addToTeam(athlete.id)}
                  >
                    + Agregar
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </Sidebar>
  );
}
