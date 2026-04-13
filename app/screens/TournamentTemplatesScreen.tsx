/**
 * app/screens/TournamentTemplatesScreen.tsx
 *
 * Admin-only screen for managing tournament templates.
 * Templates define modalities, weight classes, and categories
 * that can be reused when creating tournaments.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';

const MODALITY_OPTIONS = ['Kata', 'Kumite', 'Gi', 'No-Gi'];

const GENDER_OPTIONS  = ['Masculino', 'Femenino', 'Mixto'];
const AGE_OPTIONS     = ['Sub-18', 'Adulto', 'Todos'];

type Template = DB.TournamentTemplate;
type WeightClass = DB.WeightClass;
type Category = DB.TemplateCategory;

const EMPTY_FORM = { name: '', description: '', modalities: [] as string[], weightClasses: [] as WeightClass[], categories: [] as Category[] };
type FormState = typeof EMPTY_FORM;

const EMPTY_WC: Omit<WeightClass, 'id'> = { label: '', minKg: null, maxKg: null };
const EMPTY_CAT: Omit<Category, 'id'>   = { name: '', discipline: 'Kata', gender: 'Mixto', ageGroup: 'Todos', rankRange: '' };

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

export default function TournamentTemplatesScreen() {
  const T = useKumiteTheme();
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 900, margin: '0 auto' },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    formCard:   { background: T.colors.card, borderRadius: T.radius.lg, padding: 20, marginBottom: 24, boxShadow: T.shadow.card },
    formTitle:  { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 14 },
    sectionHd:  { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8, marginTop: 14 },
    inputWrap:  { display: 'flex', flexDirection: 'column' as const, gap: 4, marginBottom: 10 },
    label:      { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub },
    input:      { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    textarea:   { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 56 },
    select:     { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', background: T.colors.card, width: '100%', boxSizing: 'border-box' as const },
    smInput:    { padding: '6px 8px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.sm, fontFamily: 'inherit', outline: 'none', width: 80, boxSizing: 'border-box' as const },
    smSelect:   { padding: '6px 8px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.sm, fontFamily: 'inherit', outline: 'none', background: T.colors.card, flex: 1 },
  
    checkRow:   { display: 'flex', flexWrap: 'wrap' as const, gap: 10 },
    checkLabel: { display: 'flex', alignItems: 'center', gap: 5, fontSize: T.font.size.base, color: T.colors.text, cursor: 'pointer' },
  
    subCard:    { background: T.colors.borderLight, borderRadius: T.radius.md, padding: '10px 12px', marginBottom: 8 },
    subRow:     { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const },
  
    btnPrimary: { padding: '9px 22px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    btnGhost:   { padding: '8px 16px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
    btnAdd:     { padding: '6px 14px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    btnRemove:  { padding: '4px 10px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    tplCard:    { background: T.colors.card, borderRadius: T.radius.lg, padding: '16px 20px', marginBottom: 12, boxShadow: T.shadow.card },
    tplName:    { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 4 },
    tplDesc:    { fontSize: T.font.size.sm, color: T.colors.muted, marginBottom: 8 },
    chips:      { display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 6 },
    chip:       { display: 'inline-block', padding: '2px 10px', background: T.colors.primaryLight, color: T.colors.primary, borderRadius: T.radius.pill, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold },
    metaLine:   { fontSize: T.font.size.sm, color: T.colors.muted, marginBottom: 6 },
    btnRow:     { display: 'flex', gap: 8, marginTop: 8 },
    editBtn:    { padding: '5px 14px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    deleteBtn:  { padding: '5px 14px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    listTitle:  { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
    empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    emptyIcon:  { fontSize: 52, display: 'block', marginBottom: 14 },
    emptyTxt:   { fontSize: T.font.size.xl },
    loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  } as const;


  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');

  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loadingData, setLoading]   = useState(true);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId]         = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    setTemplates(await DB.getAllTemplates());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Form helpers ──────────────────────────────────────────────────────────────

  const toggleModality = (f: FormState, set: (f: FormState) => void, m: string) => {
    const mods = f.modalities.includes(m) ? f.modalities.filter(x => x !== m) : [...f.modalities, m];
    set({ ...f, modalities: mods });
  };

  const addWC = (f: FormState, set: (f: FormState) => void) =>
    set({ ...f, weightClasses: [...f.weightClasses, { id: genId(), ...EMPTY_WC }] });

  const updateWC = (f: FormState, set: (f: FormState) => void, idx: number, field: keyof WeightClass, value: any) => {
    const wcs = [...f.weightClasses];
    wcs[idx] = { ...wcs[idx], [field]: value };
    set({ ...f, weightClasses: wcs });
  };

  const removeWC = (f: FormState, set: (f: FormState) => void, idx: number) =>
    set({ ...f, weightClasses: f.weightClasses.filter((_, i) => i !== idx) });

  const addCat = (f: FormState, set: (f: FormState) => void) =>
    set({ ...f, categories: [...f.categories, { id: genId(), ...EMPTY_CAT }] });

  const updateCat = (f: FormState, set: (f: FormState) => void, idx: number, field: keyof Category, value: string) => {
    const cats = [...f.categories];
    cats[idx] = { ...cats[idx], [field]: value };
    set({ ...f, categories: cats });
  };

  const removeCat = (f: FormState, set: (f: FormState) => void, idx: number) =>
    set({ ...f, categories: f.categories.filter((_, i) => i !== idx) });

  // ── Render form ───────────────────────────────────────────────────────────────

  const renderForm = (f: FormState, set: (f: FormState) => void, prefix: string) => (
    <div>
      {/* Name + description */}
      <div style={s.inputWrap}>
        <label style={s.label}>Nombre de la plantilla</label>
        <input style={s.input} value={f.name} onChange={e => set({ ...f, name: (e.target as HTMLInputElement).value })} placeholder="Ej. Karate Adultos 2026" data-testid={`${prefix}-name`} />
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Descripción</label>
        <textarea style={s.textarea} value={f.description} onChange={e => set({ ...f, description: (e.target as HTMLTextAreaElement).value })} placeholder="Descripción opcional" data-testid={`${prefix}-description`} />
      </div>

      {/* Modalities */}
      <div style={s.sectionHd}>Modalidades</div>
      <div style={s.checkRow} data-testid={`${prefix}-modalities`}>
        {MODALITY_OPTIONS.map(m => (
          <label key={m} style={s.checkLabel}>
            <input type="checkbox" checked={f.modalities.includes(m)} onChange={() => toggleModality(f, set, m)} data-testid={`${prefix}-modality-${m.toLowerCase()}`} />
            {m}
          </label>
        ))}
      </div>

      {/* Weight classes */}
      <div style={s.sectionHd}>Clases de Peso</div>
      {f.weightClasses.map((wc, i) => (
        <div key={wc.id} style={s.subCard} data-testid={`${prefix}-wc-${i}`}>
          <div style={s.subRow}>
            <input style={{ ...s.smInput, flex: 2, width: 'auto' }} value={wc.label} onChange={e => updateWC(f, set, i, 'label', (e.target as HTMLInputElement).value)} placeholder="Etiqueta" data-testid={`${prefix}-wc-label-${i}`} />
            <input style={s.smInput} type="number" value={wc.minKg ?? ''} onChange={e => updateWC(f, set, i, 'minKg', e.target.value ? Number(e.target.value) : null)} placeholder="Min kg" data-testid={`${prefix}-wc-min-${i}`} />
            <input style={s.smInput} type="number" value={wc.maxKg ?? ''} onChange={e => updateWC(f, set, i, 'maxKg', e.target.value ? Number(e.target.value) : null)} placeholder="Max kg" data-testid={`${prefix}-wc-max-${i}`} />
            <button style={s.btnRemove} onClick={() => removeWC(f, set, i)} data-testid={`${prefix}-wc-remove-${i}`}>✕</button>
          </div>
        </div>
      ))}
      <button style={s.btnAdd} onClick={() => addWC(f, set)} data-testid={`${prefix}-add-wc`}>+ Clase de peso</button>

      {/* Categories */}
      <div style={s.sectionHd}>Categorías</div>
      {f.categories.map((cat, i) => (
        <div key={cat.id} style={s.subCard} data-testid={`${prefix}-cat-${i}`}>
          <div style={{ ...s.subRow, marginBottom: 6 }}>
            <input style={{ ...s.smInput, flex: 2, width: 'auto' }} value={cat.name} onChange={e => updateCat(f, set, i, 'name', (e.target as HTMLInputElement).value)} placeholder="Nombre" data-testid={`${prefix}-cat-name-${i}`} />
            <button style={s.btnRemove} onClick={() => removeCat(f, set, i)} data-testid={`${prefix}-cat-remove-${i}`}>✕</button>
          </div>
          <div style={s.subRow}>
            <select style={s.smSelect} value={cat.discipline} onChange={e => updateCat(f, set, i, 'discipline', (e.target as HTMLSelectElement).value)} data-testid={`${prefix}-cat-discipline-${i}`}>
              {MODALITY_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select style={s.smSelect} value={cat.gender} onChange={e => updateCat(f, set, i, 'gender', (e.target as HTMLSelectElement).value)} data-testid={`${prefix}-cat-gender-${i}`}>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select style={s.smSelect} value={cat.ageGroup} onChange={e => updateCat(f, set, i, 'ageGroup', (e.target as HTMLSelectElement).value)} data-testid={`${prefix}-cat-age-${i}`}>
              {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <input style={{ ...s.smInput, flex: 1, width: 'auto' }} value={cat.rankRange} onChange={e => updateCat(f, set, i, 'rankRange', (e.target as HTMLInputElement).value)} placeholder="Rangos (ej. Kyu)" data-testid={`${prefix}-cat-rank-${i}`} />
          </div>
        </div>
      ))}
      <button style={s.btnAdd} onClick={() => addCat(f, set)} data-testid={`${prefix}-add-cat`}>+ Categoría</button>
    </div>
  );

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await DB.createTemplate({ name: form.name.trim(), description: form.description.trim(), modalities: form.modalities, weightClasses: form.weightClasses, categories: form.categories });
    setForm(EMPTY_FORM);
    load();
  };

  const startEdit = (t: Template) => {
    setEditId(t.id);
    setEditForm({ name: t.name, description: t.description, modalities: t.modalities, weightClasses: t.weightClasses, categories: t.categories });
  };

  const handleEditSave = async () => {
    if (!editId || !editForm.name.trim()) return;
    await DB.updateTemplate(editId, { name: editForm.name.trim(), description: editForm.description.trim(), modalities: editForm.modalities, weightClasses: editForm.weightClasses, categories: editForm.categories });
    setEditId(null);
    load();
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="templates-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="templates-screen">
        <div style={s.maxW}>
          <div style={s.pageTitle}>Plantillas de Torneo</div>
          <div style={s.pageSub}>Define estructuras reutilizables de torneos con modalidades, clases de peso y categorías.</div>

          {/* Add form */}
          <div style={s.formCard} data-testid="add-template-form">
            <div style={s.formTitle}>Nueva plantilla</div>
            {renderForm(form, setForm, 'input-new')}
            <div style={{ marginTop: 12 }}>
              <button style={s.btnPrimary} onClick={handleAdd} data-testid="btn-add-template">Agregar plantilla</button>
            </div>
          </div>

          {/* List */}
          <div style={s.listTitle}>
            {templates.length > 0 ? `${templates.length} plantilla${templates.length !== 1 ? 's' : ''}` : ''}
          </div>

          {templates.length === 0 ? (
            <div style={s.empty} data-testid="empty-state">
              <span style={s.emptyIcon}>📋</span>
              <div style={s.emptyTxt}>No hay plantillas aún.</div>
            </div>
          ) : (
            <div data-testid="templates-list">
              {templates.map(t => (
                <div key={t.id} style={s.tplCard} data-testid={`template-card-${t.id}`}>
                  {editId === t.id ? (
                    <>
                      {renderForm(editForm, setEditForm, 'input-edit')}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button style={s.btnPrimary} onClick={handleEditSave} data-testid="btn-save-edit">Guardar</button>
                        <button style={s.btnGhost}   onClick={() => setEditId(null)} data-testid="btn-cancel-edit">Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={s.tplName} data-testid={`template-name-${t.id}`}>{t.name}</div>
                      {t.description && <div style={s.tplDesc}>{t.description}</div>}
                      {t.modalities.length > 0 && (
                        <div style={s.chips} data-testid={`template-modalities-${t.id}`}>
                          {t.modalities.map(m => <span key={m} style={s.chip}>{m}</span>)}
                        </div>
                      )}
                      <div style={s.metaLine}>
                        {t.weightClasses.length > 0 && `⚖️ ${t.weightClasses.length} clase${t.weightClasses.length !== 1 ? 's' : ''} de peso`}
                        {t.weightClasses.length > 0 && t.categories.length > 0 && ' · '}
                        {t.categories.length > 0 && `🗂️ ${t.categories.length} categoría${t.categories.length !== 1 ? 's' : ''}`}
                      </div>
                      <div style={s.btnRow}>
                        <button style={s.editBtn}   onClick={() => startEdit(t)} data-testid={`btn-edit-${t.id}`}>Editar</button>
                        <button style={s.deleteBtn} onClick={() => DB.deleteTemplate(t.id).then(load)} data-testid={`btn-delete-${t.id}`}>Eliminar</button>
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
