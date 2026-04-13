/**
 * app/screens/OrganizationsScreen.tsx
 *
 * Admin-only screen for managing organizations.
 * Each organization has: logo, name, acronym, description, and a linked martial art.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';

const EMPTY_FORM = { logo: '🏛️', name: '', acronym: '', description: '', martialArtId: '' };

type FormState = typeof EMPTY_FORM;

export default function OrganizationsScreen() {
  const T = useKumiteTheme();
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 800, margin: '0 auto' },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    formCard:   { background: T.colors.card, borderRadius: T.radius.lg, padding: 20, marginBottom: 24, boxShadow: T.shadow.card },
    formTitle:  { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 14 },
    formGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 12 } as any,
    inputWrap:  { display: 'flex', flexDirection: 'column' as const, gap: 4 },
    label:      { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub },
    input:      { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    textarea:   { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: 64 },
    logoInput:  { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: 22, fontFamily: 'inherit', outline: 'none', width: 72, textAlign: 'center' as const },
    select:     { padding: '8px 10px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', background: T.colors.card, width: '100%', boxSizing: 'border-box' as const },
    btnPrimary: { padding: '9px 22px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    btnGhost:   { padding: '8px 16px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    orgCard:    { background: T.colors.card, borderRadius: T.radius.lg, padding: '16px 20px', marginBottom: 12, boxShadow: T.shadow.card },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 },
    orgLogo:    { fontSize: 32, width: 44, textAlign: 'center' as const, flexShrink: 0 },
    orgInfo:    { flex: 1 },
    orgName:    { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark },
    acronym:    { display: 'inline-block', padding: '2px 10px', background: T.colors.primaryLight, color: T.colors.primary, borderRadius: T.radius.pill, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, marginLeft: 8 },
    orgDesc:    { fontSize: T.font.size.md, color: T.colors.muted, marginBottom: 6 },
    artBadge:   { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: T.colors.borderLight, borderRadius: T.radius.pill, fontSize: T.font.size.sm, color: T.colors.textSub, marginBottom: 10 },
    btnRow:     { display: 'flex', gap: 8 },
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
  const canManage = usePermission('manage_organizations');

  const [orgs, setOrgs]           = useState<DB.Organization[]>([]);
  const [arts, setArts]           = useState<DB.MartialArt[]>([]);
  const [loadingData, setLoading] = useState(true);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editForm, setEditForm]   = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    const [orgData, artData] = await Promise.all([DB.getAllOrganizations(), DB.getAllMartialArts()]);
    setOrgs(orgData);
    setArts(artData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const val = (e: any) => (e.target as HTMLInputElement).value;

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await DB.createOrganization({
      logo: form.logo.trim() || '🏛️',
      name: form.name.trim(),
      acronym: form.acronym.trim(),
      description: form.description.trim(),
      martialArtId: form.martialArtId,
    });
    setForm(EMPTY_FORM);
    load();
  };

  const startEdit = (o: DB.Organization) => {
    setEditId(o.id);
    setEditForm({ logo: o.logo, name: o.name, acronym: o.acronym, description: o.description, martialArtId: o.martialArtId });
  };

  const handleEditSave = async () => {
    if (!editId || !editForm.name.trim()) return;
    await DB.updateOrganization(editId, {
      logo: editForm.logo.trim() || '🏛️',
      name: editForm.name.trim(),
      acronym: editForm.acronym.trim(),
      description: editForm.description.trim(),
      martialArtId: editForm.martialArtId,
    });
    setEditId(null);
    load();
  };

  const artName = (id: string) => arts.find(a => a.id === id)?.name ?? '—';

  const renderForm = (f: FormState, set: (f: FormState) => void, prefix: string) => (
    <div style={s.formGrid}>
      <div style={s.inputWrap}>
        <label style={s.label}>Logo (emoji)</label>
        <input style={s.logoInput} value={f.logo} onChange={e => set({ ...f, logo: val(e) })} maxLength={4} data-testid={`${prefix}-logo`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Nombre</label>
        <input style={s.input} value={f.name} onChange={e => set({ ...f, name: val(e) })} placeholder="Nombre completo" data-testid={`${prefix}-name`} />
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Acrónimo</label>
        <input style={s.input} value={f.acronym} onChange={e => set({ ...f, acronym: val(e) })} placeholder="Ej. WKF" data-testid={`${prefix}-acronym`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 4' } as any}>
        <label style={s.label}>Descripción</label>
        <textarea style={s.textarea} value={f.description} onChange={e => set({ ...f, description: val(e) })} placeholder="Descripción breve" data-testid={`${prefix}-description`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Arte Marcial</label>
        <select style={s.select} value={f.martialArtId} onChange={e => set({ ...f, martialArtId: val(e) })} data-testid={`${prefix}-martial-art`}>
          <option value="">— Sin asignar —</option>
          {arts.map(a => <option key={a.id} value={a.id}>{a.logo} {a.name}</option>)}
        </select>
      </div>
    </div>
  );

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="organizations-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="organizations-screen">
        <div style={s.maxW}>
          <div style={s.pageTitle}>Organizaciones</div>
          <div style={s.pageSub}>Gestiona las organizaciones deportivas registradas en la plataforma.</div>

          {/* ── Add form ── */}
          <div style={s.formCard} data-testid="add-org-form">
            <div style={s.formTitle}>Agregar organización</div>
            {renderForm(form, setForm, 'input-new')}
            <button style={s.btnPrimary} onClick={handleAdd} data-testid="btn-add-org">Agregar</button>
          </div>

          {/* ── List ── */}
          <div style={s.listTitle}>
            {orgs.length > 0 ? `${orgs.length} organización${orgs.length !== 1 ? 'es' : ''}` : ''}
          </div>

          {orgs.length === 0 ? (
            <div style={s.empty} data-testid="empty-state">
              <span style={s.emptyIcon}>🏛️</span>
              <div style={s.emptyTxt}>No hay organizaciones aún.</div>
            </div>
          ) : (
            <div data-testid="organizations-list">
              {orgs.map(org => (
                <div key={org.id} style={s.orgCard} data-testid={`org-card-${org.id}`}>
                  {editId === org.id ? (
                    <>
                      {renderForm(editForm, setEditForm, 'input-edit')}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={s.btnPrimary} onClick={handleEditSave} data-testid="btn-save-edit">Guardar</button>
                        <button style={s.btnGhost}   onClick={() => setEditId(null)} data-testid="btn-cancel-edit">Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={s.cardHeader}>
                        <div style={s.orgLogo}>{org.logo}</div>
                        <div style={s.orgInfo}>
                          <span style={s.orgName} data-testid={`org-name-${org.id}`}>{org.name}</span>
                          {org.acronym && <span style={s.acronym} data-testid={`org-acronym-${org.id}`}>{org.acronym}</span>}
                        </div>
                      </div>
                      {org.description && <div style={s.orgDesc} data-testid={`org-desc-${org.id}`}>{org.description}</div>}
                      {org.martialArtId && (
                        <div style={s.artBadge} data-testid={`org-art-${org.id}`}>
                          {arts.find(a => a.id === org.martialArtId)?.logo ?? ''} {artName(org.martialArtId)}
                        </div>
                      )}
                      <div style={s.btnRow}>
                        <button style={s.editBtn}   onClick={() => startEdit(org)} data-testid={`btn-edit-${org.id}`}>Editar</button>
                        <button style={s.deleteBtn} onClick={() => DB.deleteOrganization(org.id).then(load)} data-testid={`btn-delete-${org.id}`}>Eliminar</button>
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
