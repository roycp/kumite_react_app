/**
 * app/screens/TournamentDashboardScreen.tsx
 *
 * Admin-only dashboard for a specific tournament.
 * Shows: tournament info, assigned template, status controls,
 *        and all registrations grouped by discipline.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { KumiteTheme as T } from '../../constants/theme';

type TStatus = DB.Tournament['status'];

const STATUS_LABELS: Record<TStatus, string> = {
  upcoming:  'Próximo',
  active:    'Activo',
  closed:    'Cerrado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<TStatus, { bg: string; text: string }> = {
  upcoming:  { bg: '#e3f2fd', text: '#1565c0' },
  active:    { bg: T.colors.successLight, text: T.colors.success },
  closed:    { bg: T.colors.borderLight, text: T.colors.textSub },
  cancelled: { bg: T.colors.errorLight, text: T.colors.error },
};

const s = {
  page:        { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
  maxW:        { maxWidth: 860, margin: '0 auto' },
  backBtn:     { background: 'none', border: 'none', color: T.colors.primary, fontSize: T.font.size.base, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'inherit' },
  pageTitle:   { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 4 },
  pageSub:     { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 24 },

  infoCard:    { background: T.colors.card, borderRadius: T.radius.lg, padding: '20px 24px', marginBottom: 20, boxShadow: T.shadow.card },
  infoTitle:   { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
  infoRow:     { display: 'flex', gap: 8, alignItems: 'center', fontSize: T.font.size.base, color: T.colors.text, marginBottom: 6 },
  infoLabel:   { fontWeight: T.font.weight.semibold, color: T.colors.textSub, minWidth: 120 },

  statusBadge: (status: TStatus) => ({
    display: 'inline-block', padding: '3px 12px', borderRadius: T.radius.pill,
    fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold,
    background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text,
  }),

  statusCard:  { background: T.colors.card, borderRadius: T.radius.lg, padding: '20px 24px', marginBottom: 20, boxShadow: T.shadow.card },
  btnRow:      { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 },
  statusBtn:   (active: boolean) => ({
    padding: '7px 18px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: T.font.size.sm,
    background: active ? T.colors.primary : T.colors.card,
    color: active ? T.colors.card : T.colors.textSub,
    fontWeight: active ? T.font.weight.bold : T.font.weight.normal,
  }),

  regCard:     { background: T.colors.card, borderRadius: T.radius.lg, padding: '20px 24px', marginBottom: 20, boxShadow: T.shadow.card },
  regTitle:    { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
  discipline:  { marginBottom: 16 },
  discName:    { fontSize: T.font.size.md, fontWeight: T.font.weight.bold, color: T.colors.primary, marginBottom: 8 },
  discCount:   { fontSize: T.font.size.sm, color: T.colors.muted, marginLeft: 8 },
  athlete:     { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${T.colors.border}`, fontSize: T.font.size.base },
  athleteName: { fontWeight: T.font.weight.semibold, color: T.colors.dark, minWidth: 140 },
  athleteMeta: { color: T.colors.muted, fontSize: T.font.size.sm },

  empty:       { textAlign: 'center' as const, padding: '32px 24px', color: T.colors.muted },
  loading:     { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
} as const;

export default function TournamentDashboardScreen() {
  const router  = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');
  const params  = useLocalSearchParams<{ tournamentId: string }>();
  const tournamentId = String(params.tournamentId ?? '');

  const [tournament,    setTournament]    = useState<DB.Tournament | null>(null);
  const [template,      setTemplate]      = useState<DB.TournamentTemplate | null>(null);
  const [registrations, setRegistrations] = useState<DB.Registration[]>([]);
  const [loadingData,   setLoading]       = useState(true);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    const [t2, regs, templates] = await Promise.all([
      DB.getTournamentById(tournamentId),
      DB.getRegistrationsByTournamentId(tournamentId),
      DB.getAllTemplates(),
    ]);
    setTournament(t2);
    setRegistrations(regs);
    if (t2?.templateId) {
      setTemplate(templates.find(t => t.id === t2.templateId) ?? null);
    }
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status: TStatus) => {
    if (!tournament) return;
    await DB.updateTournament(tournament.id, { status });
    setTournament(prev => prev ? { ...prev, status } : prev);
  };

  // Group registrations by discipline
  const byDiscipline: Record<string, DB.Registration[]> = {};
  for (const reg of registrations) {
    for (const entry of (reg.modalities ?? [])) {
      const disc = entry.discipline || 'Sin disciplina';
      if (!byDiscipline[disc]) byDiscipline[disc] = [];
      byDiscipline[disc].push(reg);
    }
  }
  const disciplines = Object.keys(byDiscipline).sort();

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="tournament-dashboard-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  if (!tournament) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="tournament-dashboard-screen">
          <div style={s.maxW}>
            <button style={s.backBtn} onClick={() => router.back()}>← Volver</button>
            <div style={{ color: T.colors.error }}>Torneo no encontrado.</div>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="tournament-dashboard-screen">
        <div style={s.maxW}>
          <button style={s.backBtn} onClick={() => router.back()}>← Volver a Torneos</button>

          <div style={s.pageTitle}>{tournament.logo} {tournament.name}</div>
          <div style={s.pageSub}>Panel de administración del torneo</div>

          {/* Tournament info */}
          <div style={s.infoCard}>
            <div style={s.infoTitle}>Información del Torneo</div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>📅 Fecha:</span>
              <span data-testid="dash-date">{tournament.date || '—'}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>📍 Lugar:</span>
              <span data-testid="dash-location">{tournament.location || '—'}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>📊 Estado:</span>
              <span style={s.statusBadge(tournament.status)} data-testid="dash-status">
                {STATUS_LABELS[tournament.status]}
              </span>
            </div>
            {template && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>📋 Plantilla:</span>
                <span data-testid="dash-template">{template.name}</span>
              </div>
            )}
            {tournament.registrationEnd && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>🗓️ Cierre inscripción:</span>
                <span>{tournament.registrationEnd}</span>
              </div>
            )}
          </div>

          {/* Status management */}
          <div style={s.statusCard}>
            <div style={s.infoTitle}>Gestionar Estado</div>
            <div style={s.btnRow}>
              {(['upcoming', 'active', 'closed', 'cancelled'] as TStatus[]).map(st => (
                <button
                  key={st}
                  style={s.statusBtn(tournament.status === st)}
                  onClick={() => changeStatus(st)}
                  data-testid={`btn-status-${st}`}
                >
                  {STATUS_LABELS[st]}
                </button>
              ))}
            </div>
          </div>

          {/* Registrations by discipline */}
          <div style={s.regCard}>
            <div style={s.regTitle}>
              Inscripciones
              <span style={s.discCount}>({registrations.length} atleta{registrations.length !== 1 ? 's' : ''})</span>
            </div>

            {registrations.length === 0 ? (
              <div style={s.empty} data-testid="no-registrations">No hay atletas inscritos aún.</div>
            ) : disciplines.length === 0 ? (
              <div style={s.empty} data-testid="no-registrations">No hay atletas inscritos aún.</div>
            ) : (
              <div data-testid="registrations-by-discipline">
                {disciplines.map(disc => (
                  <div key={disc} style={s.discipline} data-testid={`discipline-section-${disc.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div style={s.discName}>
                      {disc}
                      <span style={s.discCount}>({byDiscipline[disc].length})</span>
                    </div>
                    {byDiscipline[disc].map((reg, i) => (
                      <div key={`${reg.id}-${i}`} style={s.athlete} data-testid={`athlete-row-${reg.id}`}>
                        <span style={s.athleteName}>{reg.athleteName}</span>
                        <span style={s.athleteMeta}>
                          {reg.academy && `${reg.academy}`}
                          {reg.grade   && ` · ${reg.grade}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
