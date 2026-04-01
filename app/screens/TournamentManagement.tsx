import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import * as DB from '../../db/database';
import { getTournamentById, getAvailableModalities, getWeightDivisionsForModality, modalityHasWeights, WeightClass } from '../../data/tournaments';
import Sidebar from '../../components/Sidebar';

// ── Edit-inscription modal ────────────────────────────────────────────────────

function EditModal({ reg, currentUser, onSave, onClose }: {
  reg: DB.Registration;
  currentUser: DB.User;
  onSave: (updated: DB.ModalityEntry[]) => void;
  onClose: () => void;
}) {
  const tournament = getTournamentById(reg.tournamentId);
  const hasCategories = (tournament?.categories.length ?? 0) > 0;
  const age = parseInt(currentUser.age) || 25;

  const [modalities,         setModalities]         = useState<DB.ModalityEntry[]>(reg.modalities ?? []);
  const [grade,              setGrade]              = useState(currentUser.beltGrade);
  const [phase,              setPhase]              = useState<'list' | 'modality' | 'weight'>('list');
  const [currentDiscipline,  setCurrentDiscipline]  = useState<string | null>(null);

  const ageGroup = age < 18 ? 'Sub-18' : 'Adulto';
  const allModalities = tournament && hasCategories
    ? getAvailableModalities(tournament, grade, currentUser.gender, age) : [];
  const remainingModalities = allModalities.filter(d => !modalities.some(m => m.discipline === d));

  const weightDivisions: WeightClass[] = tournament && currentDiscipline
    ? getWeightDivisionsForModality(tournament, currentDiscipline, grade, currentUser.gender, age) : [];

  const pickModality = (d: string) => {
    setCurrentDiscipline(d);
    if (!tournament) return;
    if (modalityHasWeights(tournament, d, grade, currentUser.gender, age)) {
      setPhase('weight');
    } else {
      const entry: DB.ModalityEntry = { discipline: d, weightDivision: null, gender: currentUser.gender, ageGroup };
      setModalities(prev => [...prev, entry]);
      setPhase('list');
    }
  };

  const pickWeight = (wc: WeightClass) => {
    const entry: DB.ModalityEntry = { discipline: currentDiscipline!, weightDivision: wc.label, gender: currentUser.gender, ageGroup };
    setModalities(prev => [...prev, entry]);
    setPhase('list');
  };

  const removeModality = (idx: number) => {
    setModalities(prev => prev.filter((_, i) => i !== idx));
  };

  const s: any = {
    overlay:     { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal:       { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' as const, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' },
    title:       { fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
    sub:         { fontSize: 13, color: '#888', marginBottom: 20 },
    grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 },
    tile:        { padding: '14px 12px', border: '2px solid #e0e0e0', borderRadius: 10, cursor: 'pointer', textAlign: 'center' as const, background: '#fafafa', transition: 'all 0.15s' },
    tileIcon:    { fontSize: 28, marginBottom: 6, display: 'block' },
    tileName:    { fontSize: 13, fontWeight: 700, color: '#1a1a2e' },
    // Current list
    listItem:    { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f3eeff', borderRadius: 8, marginBottom: 8 },
    listName:    { flex: 1, fontSize: 13, fontWeight: 600, color: '#6750a4' },
    removeBt:    { background: 'none', border: 'none', color: '#b3261e', cursor: 'pointer', fontSize: 16, padding: '0 4px' },
    actions:     { display: 'flex', gap: 12, marginTop: 20 },
    btnSave:     { flex: 2, padding: 12, background: '#6750a4', border: 'none', borderRadius: 24, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    btnCancel:   { flex: 1, padding: 12, background: 'transparent', border: '1px solid #ccc', borderRadius: 24, color: '#666', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    addBtn:      { width: '100%', padding: '10px 0', background: 'transparent', border: '1px dashed #6750a4', borderRadius: 10, color: '#6750a4', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 },
    backBtn:     { marginBottom: 16, background: 'none', border: 'none', color: '#6750a4', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e: any) => e.stopPropagation()}>
        {phase === 'list' && (
          <>
            <div style={s.title}>✏️ Editar Inscripción</div>
            <div style={s.sub}>{reg.tournamentName}</div>

            {modalities.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>Sin modalidades — agrega al menos una</div>
            ) : modalities.map((m, i) => (
              <div key={i} style={s.listItem}>
                <span style={s.listName}>{m.discipline}{m.weightDivision ? ` · ${m.weightDivision}` : ''} · {m.gender} · {m.ageGroup}</span>
                <button style={s.removeBt} title="Eliminar" onClick={() => removeModality(i)}>✕</button>
              </div>
            ))}

            {hasCategories && remainingModalities.length > 0 && (
              <button style={s.addBtn} onClick={() => setPhase('modality')}>+ Agregar modalidad</button>
            )}

            <div style={s.actions}>
              <button style={s.btnCancel} onClick={onClose}>Cancelar</button>
              <button style={s.btnSave} onClick={() => onSave(modalities)}>Guardar Cambios</button>
            </div>
          </>
        )}

        {phase === 'modality' && (
          <>
            <button style={s.backBtn} onClick={() => setPhase('list')}>← Volver</button>
            <div style={s.title}>Elige Modalidad</div>
            <div style={s.grid}>
              {remainingModalities.map(d => (
                <div key={d} style={s.tile} onClick={() => pickModality(d)}>
                  <span style={s.tileIcon}>🥋</span>
                  <div style={s.tileName}>{d}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {phase === 'weight' && (
          <>
            <button style={s.backBtn} onClick={() => setPhase('modality')}>← Volver</button>
            <div style={s.title}>División de Peso</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Modalidad: <strong>{currentDiscipline}</strong></div>
            <div style={s.grid}>
              {weightDivisions.map(wc => (
                <div key={wc.id} style={s.tile} onClick={() => pickWeight(wc)}>
                  <span style={s.tileIcon}>⚖️</span>
                  <div style={s.tileName}>{wc.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TournamentManagement() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuth();

  const [registrations, setRegistrations] = useState<DB.Registration[]>([]);
  const [loadingData,   setLoadingData]   = useState(true);
  const [editingReg,    setEditingReg]    = useState<DB.Registration | null>(null);

  useEffect(() => {
    if (!isLoading && !currentUser) router.replace('/screens/HomeScreen');
  }, [currentUser, isLoading]);

  const loadData = () => {
    if (!currentUser) return;
    DB.getRegistrationsByUserId(currentUser.id).then(data => {
      setRegistrations(data);
      setLoadingData(false);
    });
  };

  useEffect(() => { loadData(); }, [currentUser]);

  const handleSaveEdit = async (updated: DB.ModalityEntry[]) => {
    if (!editingReg) return;
    await DB.updateRegistration(editingReg.id, { modalities: updated });
    setEditingReg(null);
    loadData();
  };

  const s: any = {
    page:       { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    maxW:       { maxWidth: 820, margin: '0 auto' },
    pageTitle:  { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 },
    pageSub:    { fontSize: 14, color: '#888', marginBottom: 28 },
    empty:      { textAlign: 'center', padding: '60px 24px', color: '#888', background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
    emptyIcon:  { fontSize: 56, display: 'block', marginBottom: 16 },
    emptyTxt:   { fontSize: 16, marginBottom: 8 },
    emptyBtn:   { marginTop: 16, padding: '10px 24px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    card:       { background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
    cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
    cardIcon:   { fontSize: 36, lineHeight: 1 },
    cardMeta:   { flex: 1 },
    tname:      { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 },
    dateLine:   { fontSize: 13, color: '#888' },
    editBtn:    { padding: '6px 16px', background: 'transparent', border: '1px solid #6750a4', borderRadius: 16, color: '#6750a4', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    modalGrid:  { display: 'flex', flexWrap: 'wrap', gap: 10 },
    modalCard:  { background: '#f3eeff', border: '1px solid #d6c8f5', borderRadius: 10, padding: '10px 14px', minWidth: 150 },
    modalName:  { fontSize: 13, fontWeight: 700, color: '#6750a4', marginBottom: 6 },
    modalRow:   { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', marginBottom: 3 },
    modalLabel: { fontWeight: 600, color: '#aaa', minWidth: 52 },
    noModal:    { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
  };

  if (isLoading || !currentUser) return null;

  return (
    <Sidebar>
      <div data-testid="tournament-management-screen" style={s.page}>
        <div style={s.maxW}>
          <div style={s.pageTitle}>⚡ Torneos Activos</div>
          <div style={s.pageSub}>Gestiona tus inscripciones actuales</div>

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>Cargando…</div>
          ) : registrations.length === 0 ? (
            <div data-testid="empty-state" style={s.empty}>
              <span style={s.emptyIcon}>📋</span>
              <div style={s.emptyTxt}>{t('management.empty')}</div>
              <div style={{ fontSize: 13, color: '#aaa' }}>{t('management.emptyHint')}</div>
              <button style={s.emptyBtn} onClick={() => router.push('/screens/TournamentSearch' as any)}>
                {t('main.search')} →
              </button>
            </div>
          ) : (
            <div data-testid="registration-list">
              {registrations.map((reg, i) => {
                const t2 = getTournamentById(reg.tournamentId);
                return (
                  <div key={reg.id ?? i} style={s.card}>
                    <div style={s.cardHeader}>
                      <span style={s.cardIcon}>{t2?.logo ?? '🥋'}</span>
                      <div style={s.cardMeta}>
                        <div style={s.tname}>{reg.tournamentName}</div>
                        <div style={s.dateLine}>
                          {reg.athleteName} · {new Date(reg.timestamp).toLocaleDateString('es-CR')}
                          {t2 && ` · ${t2.date} · ${t2.location}`}
                        </div>
                      </div>
                      <button
                        data-testid={`btn-edit-reg-${i}`}
                        style={s.editBtn}
                        onClick={() => setEditingReg(reg)}
                      >
                        ✏️ Editar
                      </button>
                    </div>

                    {reg.modalities && reg.modalities.length > 0 ? (
                      <div style={s.modalGrid}>
                        {reg.modalities.map((m, j) => (
                          <div key={j} style={s.modalCard} data-testid={`modality-entry-${i}-${j}`}>
                            <div style={s.modalName}>{m.discipline}</div>
                            {m.weightDivision && (
                              <div style={s.modalRow}><span style={s.modalLabel}>Peso</span><span>{m.weightDivision}</span></div>
                            )}
                            <div style={s.modalRow}><span style={s.modalLabel}>Género</span><span>{m.gender}</span></div>
                            <div style={s.modalRow}><span style={s.modalLabel}>Categoría</span><span>{m.ageGroup}</span></div>
                          </div>
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

      {editingReg && currentUser && (
        <EditModal
          reg={editingReg}
          currentUser={currentUser}
          onSave={handleSaveEdit}
          onClose={() => setEditingReg(null)}
        />
      )}
    </Sidebar>
  );
}
