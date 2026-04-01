import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as DB from '../../db/database';
import {
  getTournamentById,
  getAvailableModalities,
  getWeightDivisionsForModality,
  modalityHasWeights,
  Tournament,
  WeightClass,
} from '../../data/tournaments';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'info' | 'modality' | 'weight' | 'another' | 'success';

// ── Shared styles ─────────────────────────────────────────────────────────────

const S: any = {
  page:         { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
  card:         { maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' },
  // Breadcrumb
  crumbs:       { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  crumb:        (active: boolean, done: boolean) => ({
    fontSize: 12, padding: '3px 10px', borderRadius: 12,
    background: done ? '#6750a4' : active ? '#ede7f6' : '#f0f0f0',
    color: done ? '#fff' : active ? '#6750a4' : '#aaa',
    fontWeight: active || done ? 700 : 400,
  }),
  crumbArrow:   { color: '#ccc', fontSize: 12 },
  // Content
  title:        { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
  sub:          { color: '#666', fontSize: 14, marginBottom: 24 },
  field:        { marginBottom: 18 },
  label:        { display: 'block', fontSize: 13, color: '#555', marginBottom: 5, fontWeight: 500 },
  input:        { width: '100%', height: 48, border: '1px solid #ddd', borderRadius: 8, padding: '0 14px', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  select:       { width: '100%', height: 48, border: '1px solid #ddd', borderRadius: 8, paddingLeft: 14, fontSize: 15, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' },
  errorBox:     { color: '#b3261e', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: '#fce8e6', borderRadius: 8 },
  // Tile grids
  grid2:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 },
  grid3:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 },
  tile:         (selected: boolean) => ({
    padding: '18px 14px', border: `2px solid ${selected ? '#6750a4' : '#e0e0e0'}`,
    borderRadius: 12, cursor: 'pointer', background: selected ? '#f3eeff' : '#fafafa',
    transition: 'all 0.15s', textAlign: 'center',
  }),
  tileIcon:     { fontSize: 36, marginBottom: 8, display: 'block' },
  tileName:     { fontSize: 15, fontWeight: 700, color: '#1a1a2e' },
  tileSub:      { fontSize: 12, color: '#888', marginTop: 4 },
  // Chosen list
  chosenBox:    { background: '#f3eeff', borderRadius: 10, padding: '12px 16px', marginBottom: 20 },
  chosenTitle:  { fontSize: 13, fontWeight: 700, color: '#6750a4', marginBottom: 8 },
  chosenItem:   { fontSize: 13, color: '#333', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' },
  chosenBadge:  { background: '#6750a4', color: '#fff', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  // Action buttons
  actions:      { display: 'flex', gap: 12, marginTop: 24 },
  btnBack:      { flex: 1, padding: 14, background: 'transparent', border: '1px solid #ccc', borderRadius: 24, color: '#666', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary:   { flex: 2, padding: 14, background: '#6750a4', border: 'none', borderRadius: 24, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { flex: 1, padding: 14, background: 'transparent', border: '2px solid #6750a4', borderRadius: 24, color: '#6750a4', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  // Success
  successWrap:  { textAlign: 'center' as const },
  successIcon:  { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: 800, color: '#2e7d32', marginBottom: 8 },
  successSub:   { color: '#555', fontSize: 15, marginBottom: 20 },
  successCard:  { background: '#f9f9f9', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' as const },
  successRow:   { fontSize: 14, color: '#333', marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
  successLabel: { fontWeight: 700, color: '#6750a4', minWidth: 80, display: 'inline-block' },
  homeBtn:      { padding: '14px 32px', background: '#6750a4', border: 'none', borderRadius: 24, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
};

const DISCIPLINE_ICONS: Record<string, string> = {
  Kata:    '🥋',
  Kumite:  '⚔️',
  Gi:      '🏆',
  'No-Gi': '🤼',
  Judo:    '🥋',
};
function disciplineIcon(d: string) { return DISCIPLINE_ICONS[d] ?? '🥋'; }

// ── Breadcrumb helper ─────────────────────────────────────────────────────────

function Breadcrumbs({ phase, hasCategories }: { phase: Phase; hasCategories: boolean }) {
  if (!hasCategories) return null;
  const steps = ['info', 'modality', 'weight', 'success'] as Phase[];
  const labels: Record<Phase, string> = {
    info:     'Información',
    modality: 'Modalidad',
    weight:   'Peso',
    another:  'Modalidad',
    success:  'Confirmación',
  };
  const currentIdx = phase === 'another' ? 2 : steps.indexOf(phase);

  return (
    <div style={S.crumbs}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span style={S.crumbArrow}>›</span>}
          <span style={S.crumb(i === currentIdx, i < currentIdx)}>{labels[s]}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

function WebWizard({ currentUser, tournament }: { currentUser: DB.User; tournament: Tournament | null }) {
  const router = useRouter();
  const hasCategories = (tournament?.categories.length ?? 0) > 0;

  const ageGroup = parseInt(currentUser.age) < 18 ? 'Sub-18' : 'Adulto';

  const [phase,             setPhase]            = useState<Phase>('info');
  const [academy,           setAcademy]          = useState(currentUser.academy   || '');
  const [grade,             setGrade]            = useState(currentUser.beltGrade || '');
  const [chosenModalities,  setChosenModalities] = useState<DB.ModalityEntry[]>([]);
  const [currentDiscipline, setCurrentDiscipline] = useState<string | null>(null);
  const [error,             setError]            = useState('');

  // All disciplines available for this athlete's profile
  const allModalities: string[] = tournament && hasCategories
    ? getAvailableModalities(tournament, grade, currentUser.gender, parseInt(currentUser.age) || 25)
    : [];

  // Disciplines not yet chosen
  const remainingModalities = allModalities.filter(
    d => !chosenModalities.some(m => m.discipline === d),
  );

  // Weight divisions for the discipline currently being configured
  const weightDivisions: WeightClass[] = tournament && currentDiscipline
    ? getWeightDivisionsForModality(tournament, currentDiscipline, grade, currentUser.gender, parseInt(currentUser.age) || 25)
    : [];

  const saveAndFinish = (modalities: DB.ModalityEntry[]) => {
    DB.addRegistration({
      userId:         currentUser.id,
      tournamentId:   tournament?.id        ?? 'unknown',
      tournamentName: tournament?.name       ?? '',
      athleteName:    currentUser.fullName,
      modalities,
      timestamp:      new Date().toISOString(),
    });
    setPhase('success');
  };

  // ── Phase handlers ──────────────────────────────────────────────────────────

  const submitInfo = () => {
    setError('');
    if (!academy.trim())                   { setError('Academia es requerida');         return; }
    if (tournament?.grades.length && !grade) { setError('Grado es requerido');            return; }
    if (!hasCategories) {
      saveAndFinish([]);
    } else {
      setPhase('modality');
    }
  };

  const pickModality = (discipline: string) => {
    setError('');
    setCurrentDiscipline(discipline);
    const hasW = tournament ? modalityHasWeights(tournament, discipline, grade, currentUser.gender, parseInt(currentUser.age) || 25) : false;
    if (hasW) {
      setPhase('weight');
    } else {
      // No weight division — add directly
      const entry: DB.ModalityEntry = { discipline, weightDivision: null, gender: currentUser.gender, ageGroup };
      const updated = [...chosenModalities, entry];
      setChosenModalities(updated);
      const remaining = allModalities.filter(d => !updated.some(m => m.discipline === d));
      if (remaining.length === 0) {
        saveAndFinish(updated);
      } else {
        setPhase('another');
      }
    }
  };

  const pickWeight = (wc: WeightClass) => {
    setError('');
    const entry: DB.ModalityEntry = { discipline: currentDiscipline!, weightDivision: wc.label, gender: currentUser.gender, ageGroup };
    const updated = [...chosenModalities, entry];
    setChosenModalities(updated);
    const remaining = allModalities.filter(d => !updated.some(m => m.discipline === d));
    if (remaining.length === 0) {
      saveAndFinish(updated);
    } else {
      setPhase('another');
    }
  };

  const addAnother = () => {
    setCurrentDiscipline(null);
    setPhase('modality');
  };

  const finishNow = () => {
    saveAndFinish(chosenModalities);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <div style={S.card}>
        <Breadcrumbs phase={phase} hasCategories={hasCategories} />

        {/* ── INFO ─────────────────────────────────────────────────────────── */}
        {phase === 'info' && (
          <>
            <div style={S.title}>🥋 Información del Atleta</div>
            <div style={S.sub}>{tournament ? `Inscripción: ${tournament.name}` : 'Inscripción al Torneo'}</div>
            {error && <div style={S.errorBox}>{error}</div>}

            <div style={S.field}>
              <label style={S.label} htmlFor="academy-input">Tu Academia *</label>
              <input
                id="academy-input"
                data-testid="academy-input"
                style={S.input}
                placeholder="Nombre de tu academia"
                value={academy}
                onChange={(e: any) => setAcademy(e.target.value)}
              />
            </div>

            {tournament && tournament.grades.length > 0 && (
              <div style={S.field}>
                <label style={S.label} htmlFor="grade-input">Grado *</label>
                <select
                  id="grade-input"
                  data-testid="grade-input"
                  style={S.select}
                  value={grade}
                  onChange={(e: any) => setGrade(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {tournament.grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}

            <div style={S.actions}>
              <button style={S.btnBack} type="button" onClick={() => router.back()}>← Atrás</button>
              <button style={S.btnPrimary} type="button" onClick={submitInfo}>
                {hasCategories ? 'Siguiente →' : 'Inscribirse →'}
              </button>
            </div>
          </>
        )}

        {/* ── MODALITY ─────────────────────────────────────────────────────── */}
        {phase === 'modality' && (
          <>
            <div style={S.title}>🏅 Elige tu Modalidad</div>
            <div style={S.sub}>
              {remainingModalities.length > 0
                ? `${remainingModalities.length} modalidad${remainingModalities.length > 1 ? 'es' : ''} disponible${remainingModalities.length > 1 ? 's' : ''}`
                : 'No hay más modalidades disponibles'}
            </div>

            {chosenModalities.length > 0 && (
              <div style={S.chosenBox}>
                <div style={S.chosenTitle}>Ya inscrito en:</div>
                {chosenModalities.map((m, i) => (
                  <div key={i} style={S.chosenItem}>
                    <span style={S.chosenBadge}>{m.discipline}</span>
                    {m.weightDivision && <span>{m.weightDivision}</span>}
                    <span style={{ color: '#aaa' }}>· {m.gender} · {m.ageGroup}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <div style={S.errorBox}>{error}</div>}

            <div style={S.grid2} data-testid="modality-grid">
              {remainingModalities.map(d => (
                <div
                  key={d}
                  data-testid={`modality-tile-${d.toLowerCase().replace(/\s+/g, '-')}`}
                  style={S.tile(false)}
                  onClick={() => pickModality(d)}
                >
                  <span style={S.tileIcon}>{disciplineIcon(d)}</span>
                  <div style={S.tileName}>{d}</div>
                  <div style={S.tileSub}>
                    {tournament && modalityHasWeights(tournament, d, grade, currentUser.gender, parseInt(currentUser.age) || 25)
                      ? 'Con división de peso'
                      : 'Sin división de peso'}
                  </div>
                </div>
              ))}
            </div>

            <div style={S.actions}>
              <button style={S.btnBack} type="button" onClick={() => {
                if (chosenModalities.length > 0) setPhase('another');
                else setPhase('info');
              }}>← Atrás</button>
            </div>
          </>
        )}

        {/* ── WEIGHT ───────────────────────────────────────────────────────── */}
        {phase === 'weight' && (
          <>
            <div style={S.title}>⚖️ División de Peso</div>
            <div style={S.sub}>
              Modalidad: <strong>{currentDiscipline}</strong> · {currentUser.gender} · {ageGroup}
            </div>

            {error && <div style={S.errorBox}>{error}</div>}

            <div style={S.grid3} data-testid="weight-grid">
              {weightDivisions.map(wc => (
                <div
                  key={wc.id}
                  data-testid={`weight-tile-${wc.id}`}
                  style={S.tile(false)}
                  onClick={() => pickWeight(wc)}
                >
                  <span style={S.tileIcon}>⚖️</span>
                  <div style={S.tileName}>{wc.label}</div>
                </div>
              ))}
            </div>

            <div style={S.actions}>
              <button style={S.btnBack} type="button" onClick={() => setPhase('modality')}>← Atrás</button>
            </div>
          </>
        )}

        {/* ── ANOTHER? ─────────────────────────────────────────────────────── */}
        {phase === 'another' && (
          <>
            <div style={S.title}>✅ Modalidad Agregada</div>
            <div style={S.sub}>¿Deseas inscribirte en otra modalidad?</div>

            <div style={S.chosenBox}>
              <div style={S.chosenTitle}>Modalidades seleccionadas:</div>
              {chosenModalities.map((m, i) => (
                <div key={i} style={S.chosenItem}>
                  <span style={S.chosenBadge}>{m.discipline}</span>
                  {m.weightDivision && <span>{m.weightDivision}</span>}
                  <span style={{ color: '#aaa' }}>· {m.gender} · {m.ageGroup}</span>
                </div>
              ))}
            </div>

            {remainingModalities.length > 0 ? (
              <>
                <div style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>
                  Modalidades disponibles: <strong>{remainingModalities.join(', ')}</strong>
                </div>
                <div style={S.actions}>
                  <button
                    data-testid="btn-finish-now"
                    style={S.btnSecondary}
                    type="button"
                    onClick={finishNow}
                  >
                    No, finalizar
                  </button>
                  <button
                    data-testid="btn-add-another"
                    style={S.btnPrimary}
                    type="button"
                    onClick={addAnother}
                  >
                    Sí, agregar otra →
                  </button>
                </div>
              </>
            ) : (
              <div style={S.actions}>
                <button
                  data-testid="btn-finish-now"
                  style={S.btnPrimary}
                  type="button"
                  onClick={finishNow}
                >
                  Finalizar inscripción →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
        {phase === 'success' && (
          <div data-testid="success-message" style={S.successWrap}>
            <div style={S.successIcon}>🏆</div>
            <div style={S.successTitle}>✓ ¡Inscripción Exitosa!</div>
            <div style={S.successSub}>
              {tournament ? `Has sido inscrito en ${tournament.name}` : 'Has sido inscrito exitosamente'}
            </div>

            {chosenModalities.length > 0 && (
              <div style={S.successCard}>
                <div style={{ fontWeight: 700, color: '#6750a4', fontSize: 14, marginBottom: 12 }}>
                  Modalidades inscritas:
                </div>
                {chosenModalities.map((m, i) => (
                  <div key={i} style={{ ...S.successRow, paddingBottom: 10, borderBottom: i < chosenModalities.length - 1 ? '1px solid #eee' : 'none', marginBottom: 10 }}>
                    <span style={S.successLabel}>Modalidad</span>
                    <strong>{m.discipline}</strong>
                    {m.weightDivision && (
                      <>
                        <span style={S.successLabel}>Peso</span>
                        <span>{m.weightDivision}</span>
                      </>
                    )}
                    <span style={S.successLabel}>Género</span>
                    <span>{m.gender}</span>
                    <span style={S.successLabel}>Categoría</span>
                    <span>{m.ageGroup}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              data-testid="btn-volver-inicio"
              style={S.homeBtn}
              type="button"
              onClick={() => router.replace('/screens/MainScreen' as any)}
            >
              🏠 Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function FormScreen() {
  const router  = useRouter();
  const { currentUser, isLoading } = useAuth();
  const params  = useLocalSearchParams<{ tournamentId?: string; tournamentName?: string }>();

  const tournament = params.tournamentId ? getTournamentById(String(params.tournamentId)) ?? null : null;

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/screens/HomeScreen');
    }
  }, [currentUser, isLoading]);

  if (isLoading || !currentUser) return null;
  return <WebWizard currentUser={currentUser} tournament={tournament} />;
}
