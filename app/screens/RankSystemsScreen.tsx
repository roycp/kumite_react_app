/**
 * app/screens/RankSystemsScreen.tsx
 *
 * Admin-only screen for managing rank systems of a specific martial art.
 * URL params: martialArtId, martialArtName
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';

type Classification = 'beginner' | 'advanced';
type ApplicableTo   = 'children' | 'adults' | 'both';

const CLASSIFICATION_LABELS: Record<Classification, string> = {
  beginner: 'Principiante',
  advanced: 'Avanzado',
};

const APPLICABLE_LABELS: Record<ApplicableTo, string> = {
  children: 'Niños',
  adults:   'Adultos',
  both:     'Todos',
};

const EMPTY_FORM = { name: '', description: '', rank: '', classification: 'beginner' as Classification, applicableTo: 'both' as ApplicableTo };

export default function RankSystemsScreen() {
  const T = useKumiteTheme();

  const CHIP_COLORS: Record<string, { bg: string; color: string }> = {
    beginner: { bg: T.colors.successLight,  color: T.colors.success },
    advanced: { bg: T.colors.primaryAlt,    color: T.colors.primary },
    children: { bg: '#fff3e0',              color: '#e65100' },
    adults:   { bg: '#e3f2fd',              color: '#1565c0' },
    both:     { bg: T.colors.borderLight,   color: T.colors.muted },
  };
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 760, margin: '0 auto' },
    breadcrumb: { fontSize: T.font.size.sm, color: T.colors.muted, marginBottom: 8, cursor: 'pointer' as const, display: 'inline-block' as const },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 4 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    formCard:   { background: T.colors.card, borderRadius: T.radius.lg, padding: 20, marginBottom: 24, boxShadow: T.shadow.card },
    formTitle:  { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 14 },
    formGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 12 } as any,
    inputWrap:  { display: 'flex', flexDirection: 'column' as const, gap: 4 },
    label:      { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub },
    input:      { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    select:     { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', background: T.colors.card, width: '100%', boxSizing: 'border-box' as const },
    btnPrimary: { padding: '9px 22px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    btnGhost:   { padding: '8px 16px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    rankCard:   { background: T.colors.card, borderRadius: T.radius.lg, padding: '14px 18px', marginBottom: 10, boxShadow: T.shadow.card },
    rankHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
    rankNum:    { width: 32, height: 32, borderRadius: '50%', background: T.colors.primaryLight, color: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: T.font.weight.bold, fontSize: T.font.size.sm, flexShrink: 0 } as any,
    rankName:   { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, flex: 1 },
    rankDesc:   { fontSize: T.font.size.md, color: T.colors.muted, marginBottom: 8, marginLeft: 44 },
    chipRow:    { display: 'flex', gap: 6, marginLeft: 44, flexWrap: 'wrap' as const, marginBottom: 8 },
    chip:       (key: string): any => ({ padding: '3px 10px', borderRadius: T.radius.pill, fontSize: T.font.size.xs, fontWeight: T.font.weight.semibold, ...(CHIP_COLORS[key] ?? { bg: T.colors.borderLight, color: T.colors.muted }), background: (CHIP_COLORS[key] ?? {}).bg }),
    btnRow:     { display: 'flex', gap: 8, marginLeft: 44 },
    editBtn:    { padding: '4px 12px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    deleteBtn:  { padding: '4px 12px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    listTitle:  { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
    empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    emptyIcon:  { fontSize: 48, display: 'block', marginBottom: 14 },
    emptyTxt:   { fontSize: T.font.size.xl },
    loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  } as const;


  const router = useRouter();
  const { martialArtId = '', martialArtName = 'Arte Marcial' } = useLocalSearchParams<{ martialArtId: string; martialArtName: string }>();

  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_rank_systems');

  const [ranks, setRanks]         = useState<DB.RankSystem[]>([]);
  const [loadingData, setLoading] = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editForm, setEditForm]   = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) {
      router.replace('/screens/MainScreen');
    }
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    if (!martialArtId) return;
    setLoading(true);
    setRanks(await DB.getRankSystemsByMartialArtId(martialArtId));
    setLoading(false);
  }, [martialArtId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const name = form.name.trim();
    const rankNum = parseInt(form.rank, 10);
    if (!name || isNaN(rankNum)) return;
    await DB.createRankSystem({
      martialArtId,
      name,
      description: form.description.trim(),
      rank: rankNum,
      classification: form.classification,
      applicableTo: form.applicableTo,
    });
    setForm(EMPTY_FORM);
    load();
  };

  const startEdit = (r: DB.RankSystem) => {
    setEditId(r.id);
    setEditForm({ name: r.name, description: r.description, rank: String(r.rank), classification: r.classification, applicableTo: r.applicableTo });
  };

  const handleEditSave = async () => {
    if (!editId || !editForm.name.trim()) return;
    const rankNum = parseInt(editForm.rank, 10);
    if (isNaN(rankNum)) return;
    await DB.updateRankSystem(editId, {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      rank: rankNum,
      classification: editForm.classification,
      applicableTo: editForm.applicableTo,
    });
    setEditId(null);
    load();
  };

  const val = (e: any) => (e.target as HTMLInputElement).value;

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="rank-systems-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  const renderFormFields = (f: typeof EMPTY_FORM, set: (f: typeof EMPTY_FORM) => void, prefix: string) => (
    <div style={s.formGrid}>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Nombre del rango</label>
        <input style={s.input} value={f.name} onChange={e => set({ ...f, name: val(e) })} placeholder="Ej. 10° Kyu" data-testid={`${prefix}-name`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Descripción</label>
        <input style={s.input} value={f.description} onChange={e => set({ ...f, description: val(e) })} placeholder="Ej. Cinturón blanco" data-testid={`${prefix}-description`} />
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Nº de orden</label>
        <input style={s.input} type="number" min="1" value={f.rank} onChange={e => set({ ...f, rank: val(e) })} placeholder="1" data-testid={`${prefix}-rank`} />
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Clasificación</label>
        <select style={s.select} value={f.classification} onChange={e => set({ ...f, classification: val(e) as Classification })} data-testid={`${prefix}-classification`}>
          <option value="beginner">Principiante</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Aplica a</label>
        <select style={s.select} value={f.applicableTo} onChange={e => set({ ...f, applicableTo: val(e) as ApplicableTo })} data-testid={`${prefix}-applicable`}>
          <option value="both">Todos</option>
          <option value="children">Niños</option>
          <option value="adults">Adultos</option>
        </select>
      </div>
    </div>
  );

  return (
    <Sidebar>
      <div style={s.page} data-testid="rank-systems-screen">
        <div style={s.maxW}>
          <div style={s.breadcrumb} onClick={() => router.push('/screens/MartialArtsScreen')} data-testid="breadcrumb-back">
            ← Artes Marciales
          </div>
          <div style={s.pageTitle}>{String(martialArtName)}</div>
          <div style={s.pageSub}>Gestiona los rangos y cinturones de este arte marcial.</div>

          {/* ── Add form ── */}
          <div style={s.formCard} data-testid="add-rank-form">
            <div style={s.formTitle}>Agregar rango</div>
            {renderFormFields(form, setForm, 'input-new')}
            <button style={s.btnPrimary} onClick={handleAdd} data-testid="btn-add-rank">Agregar</button>
          </div>

          {/* ── List ── */}
          <div style={s.listTitle}>
            {ranks.length > 0 ? `${ranks.length} rango${ranks.length !== 1 ? 's' : ''}` : ''}
          </div>

          {ranks.length === 0 ? (
            <div style={s.empty} data-testid="empty-state">
              <span style={s.emptyIcon}>🏅</span>
              <div style={s.emptyTxt}>No hay rangos para este arte marcial.</div>
            </div>
          ) : (
            <div data-testid="rank-list">
              {ranks.map(r => (
                <div key={r.id} style={s.rankCard} data-testid={`rank-card-${r.id}`}>
                  {editId === r.id ? (
                    <>
                      {renderFormFields(editForm, setEditForm, 'input-edit')}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={s.btnPrimary} onClick={handleEditSave} data-testid="btn-save-edit">Guardar</button>
                        <button style={s.btnGhost}   onClick={() => setEditId(null)} data-testid="btn-cancel-edit">Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={s.rankHeader}>
                        <div style={s.rankNum}>{r.rank}</div>
                        <div style={s.rankName} data-testid={`rank-name-${r.id}`}>{r.name}</div>
                      </div>
                      {r.description && <div style={s.rankDesc} data-testid={`rank-desc-${r.id}`}>{r.description}</div>}
                      <div style={s.chipRow}>
                        <span style={s.chip(r.classification)} data-testid={`chip-class-${r.id}`}>{CLASSIFICATION_LABELS[r.classification]}</span>
                        <span style={s.chip(r.applicableTo)}   data-testid={`chip-applicable-${r.id}`}>{APPLICABLE_LABELS[r.applicableTo]}</span>
                      </div>
                      <div style={s.btnRow}>
                        <button style={s.editBtn}   onClick={() => startEdit(r)} data-testid={`btn-edit-${r.id}`}>Editar</button>
                        <button style={s.deleteBtn} onClick={() => DB.deleteRankSystem(r.id).then(load)} data-testid={`btn-delete-${r.id}`}>Eliminar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
