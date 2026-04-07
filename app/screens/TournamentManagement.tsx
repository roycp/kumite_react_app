import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as DB from '../../db/database';
import { getTournamentById } from '../../data/tournaments';
import Sidebar from '../../components/Sidebar';
import ModalityCard from '../../components/ModalityCard';
import EditModalitiesModal from '../../components/modals/EditModalitiesModal';
import CancelConfirmModal from '../../components/modals/CancelConfirmModal';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useRegistrations } from '../../hooks/useRegistrations';
import { KumiteTheme as T } from '../../constants/theme';

const s = {
  page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
  maxW:       { maxWidth: 820, margin: '0 auto' },
  pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
  pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  empty:      { textAlign: 'center' as const, padding: '60px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
  emptyIcon:  { fontSize: 56, display: 'block', marginBottom: 16 },
  emptyTxt:   { fontSize: T.font.size.xl, marginBottom: 8 },
  emptyBtn:   { marginTop: 16, padding: '10px 24px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, cursor: 'pointer', fontFamily: 'inherit' },
  card:       { background: T.colors.card, borderRadius: T.radius.lg, padding: 24, marginBottom: 16, boxShadow: T.shadow.card },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, flexWrap: 'wrap' as const },
  cardIcon:   { fontSize: 36, lineHeight: 1 },
  cardMeta:   { flex: 1 },
  tname:      { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 3 },
  dateLine:   { fontSize: T.font.size.md, color: T.colors.muted },
  btnRow:     { display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' as const },
  editBtn:    { padding: '6px 16px', background: 'transparent', border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
  cancelBtn:  { padding: '6px 16px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
  modalGrid:  { display: 'flex', flexWrap: 'wrap' as const, gap: 10 },
  noModal:    { fontSize: T.font.size.md, color: T.colors.mutedLight, fontStyle: 'italic' },
} as const;

export default function TournamentManagement() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuthGuard();
  const { registrations, loadingData, reload } = useRegistrations({ filter: 'active' });

  const [editingReg,    setEditingReg]    = useState<DB.Registration | null>(null);
  const [cancellingReg, setCancellingReg] = useState<DB.Registration | null>(null);

  const handleSaveEdit = async (modalities: DB.ModalityEntry[]) => {
    if (!editingReg) return;
    await DB.updateRegistration(editingReg.id, { modalities });
    setEditingReg(null);
    reload();
  };

  const handleEditRegistration = (staged: DB.ModalityEntry[]) => {
    if (!editingReg) return;
    sessionStorage.setItem(
      `staged_modalities_${editingReg.id}`,
      JSON.stringify(staged),
    );
    setEditingReg(null);
    router.push(
      `/screens/FormScreen?tournamentId=${editingReg.tournamentId}&registrationId=${editingReg.id}` as any,
    );
  };

  const handleConfirmCancel = async () => {
    if (!cancellingReg) return;
    await DB.deleteRegistration(cancellingReg.id);
    setCancellingReg(null);
    reload();
  };

  if (isLoading || !currentUser) return null;

  return (
    <Sidebar>
      <style>{`
        @media (max-width: 600px) {
          .kb-mgmt-page   { padding: 16px 12px !important; }
          .kb-mgmt-card   { padding: 14px !important; }
          .kb-mgmt-btnrow { flex-direction: column !important; }
          .kb-mgmt-btnrow button { width: 100% !important; box-sizing: border-box; }
        }
      `}</style>
      <div data-testid="tournament-management-screen" className="kb-mgmt-page" style={s.page}>
        <div style={s.maxW}>
          <div style={s.pageTitle}>⚡ Torneos Activos</div>
          <div style={s.pageSub}>Gestiona tus inscripciones actuales</div>

          {loadingData ? (
            <div style={s.loading}>Cargando…</div>
          ) : registrations.length === 0 ? (
            <div data-testid="empty-state" style={s.empty}>
              <span style={s.emptyIcon}>📋</span>
              <div style={s.emptyTxt}>{t('management.empty')}</div>
              <div style={{ fontSize: T.font.size.md, color: T.colors.mutedLight }}>{t('management.emptyHint')}</div>
              <button style={s.emptyBtn} onClick={() => router.push('/screens/TournamentSearch' as any)}>
                {t('main.search')} →
              </button>
            </div>
          ) : (
            <div data-testid="registration-list">
              {registrations.map((reg: DB.Registration, i: number) => {
                const t2 = getTournamentById(reg.tournamentId);
                return (
                  <div key={reg.id ?? i} className="kb-mgmt-card" style={s.card}>
                    <div style={s.cardHeader}>
                      <span style={s.cardIcon}>{t2?.logo ?? '🥋'}</span>
                      <div style={s.cardMeta}>
                        <div style={s.tname}>{reg.tournamentName}</div>
                        <div style={s.dateLine}>
                          {reg.athleteName} · {new Date(reg.timestamp).toLocaleDateString('es-CR')}
                          {t2 && ` · ${t2.date} · ${t2.location}`}
                        </div>
                      </div>
                      <div className="kb-mgmt-btnrow" style={s.btnRow}>
                        <button
                          data-testid={`btn-edit-reg-${i}`}
                          style={s.editBtn}
                          type="button"
                          onClick={() => setEditingReg(reg)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          data-testid={`btn-cancel-reg-${i}`}
                          style={s.cancelBtn}
                          type="button"
                          onClick={() => setCancellingReg(reg)}
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </div>

                    {reg.modalities && reg.modalities.length > 0 ? (
                      <div style={s.modalGrid}>
                        {reg.modalities.map((m: DB.ModalityEntry, j: number) => (
                          <ModalityCard
                            key={j}
                            modality={m}
                            testId={`modality-entry-${i}-${j}`}
                            className="kb-mgmt-modal-card"
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={s.noModal}>Sin modalidades específicas</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingReg && (
        <EditModalitiesModal
          reg={editingReg}
          onSave={handleSaveEdit}
          onClose={() => setEditingReg(null)}
          onEditRegistration={handleEditRegistration}
        />
      )}

      {cancellingReg && (
        <CancelConfirmModal
          reg={cancellingReg}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancellingReg(null)}
        />
      )}
    </Sidebar>
  );
}
