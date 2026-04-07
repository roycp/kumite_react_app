import React from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import { getTournamentById } from '../../data/tournaments';
import Sidebar from '../../components/Sidebar';
import ModalityCard from '../../components/ModalityCard';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useRegistrations } from '../../hooks/useRegistrations';
import { KumiteTheme as T } from '../../constants/theme';

const s = {
  page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
  maxW:       { maxWidth: 820, margin: '0 auto' },
  pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
  pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  empty:      { textAlign: 'center' as const, padding: '60px 24px', color: T.colors.muted },
  emptyIcon:  { fontSize: 60, display: 'block', marginBottom: 16 },
  emptyTxt:   { fontSize: T.font.size.xl, marginBottom: 8 },
  emptyBtn:   { marginTop: 20, padding: '10px 24px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, cursor: 'pointer', fontFamily: 'inherit' },
  card:       { background: T.colors.card, borderRadius: T.radius.lg, padding: 24, marginBottom: 16, boxShadow: T.shadow.card },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  cardIcon:   { fontSize: 36, lineHeight: 1 },
  cardMeta:   { flex: 1 },
  cardName:   { fontSize: 17, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 3 },
  cardDate:   { fontSize: T.font.size.md, color: T.colors.muted },
  detailRow:  { display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 12, fontSize: T.font.size.md, color: T.colors.textSub },
  detailItem: { display: 'flex', gap: 4, alignItems: 'center' },
  modalGrid:  { display: 'flex', flexWrap: 'wrap' as const, gap: 10 },
  statusBadge:{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: T.radius.md, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold },
} as const;

function StatusBadge({ tournamentId }: { tournamentId: string }) {
  const t = getTournamentById(tournamentId);
  if (!t) return null;
  const isPast = new Date(t.date) < new Date();
  return (
    <span style={{
      ...s.statusBadge,
      background: isPast ? T.colors.errorLight : T.colors.successLight,
      color:      isPast ? T.colors.error      : T.colors.success,
    }}>
      {isPast ? '✓ Completado' : '⚡ Próximo'}
    </span>
  );
}

export default function TournamentHistory() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const { registrations, loadingData } = useRegistrations({ filter: 'past' });

  if (isLoading || !currentUser) return null;

  return (
    <Sidebar>
      <style>{`
        @media (max-width: 600px) {
          .kb-hist-page       { padding: 16px 12px !important; }
          .kb-hist-card       { padding: 14px !important; }
          .kb-hist-modal-card { min-width: 120px !important; }
        }
      `}</style>
      <div data-testid="tournament-history-screen" className="kb-hist-page" style={s.page}>
        <div style={s.maxW}>
          <div style={s.pageTitle}>📜 Historial de Torneos</div>
          <div style={s.pageSub}>Torneos en los que ya has participado</div>

          {loadingData ? (
            <div style={s.loading}>Cargando…</div>
          ) : registrations.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>📜</span>
              <div style={s.emptyTxt}>No tienes torneos completados aún</div>
              <button style={s.emptyBtn} onClick={() => router.push('/screens/TournamentSearch' as any)}>
                Buscar Torneos →
              </button>
            </div>
          ) : (
            <div data-testid="history-list">
              {registrations.map((reg: DB.Registration, i: number) => {
                const t = getTournamentById(reg.tournamentId);
                return (
                  <div key={reg.id ?? i} className="kb-hist-card" style={s.card} data-testid={`history-item-${i}`}>
                    <div style={s.cardHeader}>
                      <span style={s.cardIcon}>{t?.logo ?? '🥋'}</span>
                      <div style={s.cardMeta}>
                        <div style={s.cardName}>{reg.tournamentName}</div>
                        <div style={s.cardDate}>
                          Inscrito: {new Date(reg.timestamp).toLocaleDateString('es-CR')}
                          {t && ` · Fecha del torneo: ${t.date}`}
                        </div>
                      </div>
                      <StatusBadge tournamentId={reg.tournamentId} />
                    </div>

                    {t && (
                      <div style={s.detailRow}>
                        <span style={s.detailItem}>📍 {t.location}</span>
                        <span style={s.detailItem}>🥋 {t.martialArt}</span>
                        {t.disciplines.length > 0 && (
                          <span style={s.detailItem}>⚔️ {t.disciplines.join(', ')}</span>
                        )}
                      </div>
                    )}

                    {reg.modalities && reg.modalities.length > 0 && (
                      <div style={s.modalGrid}>
                        {reg.modalities.map((m: DB.ModalityEntry, j: number) => (
                          <ModalityCard key={j} modality={m} className="kb-hist-modal-card" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
