/**
 * app/screens/AdminTournamentsScreen.tsx
 *
 * Admin-only screen for managing tournaments.
 * Each tournament has: logo, name, date, location, description, and status.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { KumiteTheme as T } from '../../constants/theme';
import { STATUS_LABELS, STATUS_COLORS, LIFECYCLE_STATUSES, type TournamentStatus } from '../../constants/tournamentStatus';

type TStatus = TournamentStatus;

const EMPTY_FORM = { logo: '🏆', name: '', date: '', location: '', description: '', status: 'created' as TStatus, martialArtIds: [] as string[], registrationStart: '', registrationEnd: '', templateId: '' };
type FormState = typeof EMPTY_FORM;

const s = {
  page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
  maxW:       { maxWidth: 860, margin: '0 auto' },
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

  tournCard:  { background: T.colors.card, borderRadius: T.radius.lg, padding: '16px 20px', marginBottom: 12, boxShadow: T.shadow.card },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 },
  tLogo:      { fontSize: 32, width: 44, textAlign: 'center' as const, flexShrink: 0 },
  tInfo:      { flex: 1 },
  tName:      { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark },
  tMeta:      { fontSize: T.font.size.sm, color: T.colors.muted, marginTop: 2 },
  tDesc:      { fontSize: T.font.size.md, color: T.colors.muted, marginBottom: 6 },
  statusBadge:(status: TStatus) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: T.radius.pill,
    fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold,
    background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text, marginBottom: 10,
  }),
  btnRow:     { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  editBtn:    { padding: '5px 14px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
  deleteBtn:  { padding: '5px 14px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  openBtn:    { padding: '5px 14px', background: '#e8f5e9', border: '1px solid #66bb6a', borderRadius: T.radius.xl, color: '#2e7d32', fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
  closeBtn:   { padding: '5px 14px', background: '#fce8e6', border: '1px solid #ef9a9a', borderRadius: T.radius.xl, color: '#b3261e', fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
  regStatus:  (open: boolean) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: open ? '#2e7d32' : '#b3261e', marginBottom: 8 }),

  artBadges:  { display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 },
  artBadge:   { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: T.colors.borderLight, borderRadius: T.radius.pill, fontSize: T.font.size.sm, color: T.colors.textSub },
  checkRow:   { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginTop: 4 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: T.font.size.base, color: T.colors.text, cursor: 'pointer' },
  listTitle:  { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
  empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
  emptyIcon:  { fontSize: 52, display: 'block', marginBottom: 14 },
  emptyTxt:   { fontSize: T.font.size.xl },
  loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
} as const;

export default function AdminTournamentsScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_tournaments');

  const [tournaments, setTournaments] = useState<DB.Tournament[]>([]);
  const [arts, setArts]               = useState<DB.MartialArt[]>([]);
  const [templates, setTemplates]     = useState<DB.TournamentTemplate[]>([]);
  const [loadingData, setLoading]     = useState(true);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId]           = useState<string | null>(null);
  const [editForm, setEditForm]       = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    const [ts, as, tpls] = await Promise.all([DB.getAllTournaments(), DB.getAllMartialArts(), DB.getAllTemplates()]);
    setTournaments(ts);
    setArts(as);
    setTemplates(tpls);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const val = (e: any) => (e.target as HTMLInputElement).value;

  const toggleArt = (f: FormState, set: (f: FormState) => void, artId: string) => {
    const ids = f.martialArtIds.includes(artId)
      ? f.martialArtIds.filter(id => id !== artId)
      : [...f.martialArtIds, artId];
    set({ ...f, martialArtIds: ids });
  };

  const renderForm = (f: FormState, set: (f: FormState) => void, prefix: string) => (
    <div style={s.formGrid}>
      <div style={s.inputWrap}>
        <label style={s.label}>Logo</label>
        <input style={s.logoInput} value={f.logo} onChange={e => set({ ...f, logo: val(e) })} maxLength={4} data-testid={`${prefix}-logo`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Nombre</label>
        <input style={s.input} value={f.name} onChange={e => set({ ...f, name: val(e) })} placeholder="Nombre del torneo" data-testid={`${prefix}-name`} />
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Fecha</label>
        <input style={s.input} type="date" value={f.date} onChange={e => set({ ...f, date: val(e) })} data-testid={`${prefix}-date`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Lugar</label>
        <input style={s.input} value={f.location} onChange={e => set({ ...f, location: val(e) })} placeholder="Ciudad, País" data-testid={`${prefix}-location`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 4' } as any}>
        <label style={s.label}>Descripción</label>
        <textarea style={s.textarea} value={f.description} onChange={e => set({ ...f, description: val(e) })} placeholder="Descripción breve" data-testid={`${prefix}-description`} />
      </div>
      <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
        <label style={s.label}>Estado</label>
        <select style={s.select} value={f.status} onChange={e => set({ ...f, status: val(e) as TStatus })} data-testid={`${prefix}-status`}>
          {LIFECYCLE_STATUSES.map(st => (
            <option key={st} value={st}>{STATUS_LABELS[st]}</option>
          ))}
        </select>
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Inicio de Inscripciones</label>
        <input style={s.input} type="date" value={f.registrationStart} onChange={e => set({ ...f, registrationStart: val(e) })} data-testid={`${prefix}-reg-start`} />
      </div>
      <div style={s.inputWrap}>
        <label style={s.label}>Cierre de Inscripciones</label>
        <input style={s.input} type="date" value={f.registrationEnd} onChange={e => set({ ...f, registrationEnd: val(e) })} data-testid={`${prefix}-reg-end`} />
      </div>
      {templates.length > 0 && (
        <div style={{ ...s.inputWrap, gridColumn: 'span 2' } as any}>
          <label style={s.label}>Plantilla</label>
          <select style={s.select} value={f.templateId} onChange={e => set({ ...f, templateId: val(e) })} data-testid={`${prefix}-template`}>
            <option value="">— Sin plantilla —</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      {arts.length > 0 && (
        <div style={{ ...s.inputWrap, gridColumn: 'span 4' } as any}>
          <label style={s.label}>Artes Marciales</label>
          <div style={s.checkRow}>
            {arts.map(a => (
              <label key={a.id} style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={f.martialArtIds.includes(a.id)}
                  onChange={() => toggleArt(f, set, a.id)}
                  data-testid={`${prefix}-art-${a.id}`}
                />
                {a.logo} {a.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await DB.createTournament({
      logo: form.logo.trim() || '🏆',
      name: form.name.trim(),
      date: form.date,
      location: form.location.trim(),
      description: form.description.trim(),
      status: form.status,
      martialArtIds: form.martialArtIds,
      registrationStart:     form.registrationStart || null,
      registrationEnd:       form.registrationEnd   || null,
      registrationForceOpen: null,
      templateId:            form.templateId || null,
    });
    setForm(EMPTY_FORM);
    load();
  };

  const startEdit = (t: DB.Tournament) => {
    setEditId(t.id);
    setEditForm({ logo: t.logo, name: t.name, date: t.date, location: t.location, description: t.description, status: t.status, martialArtIds: t.martialArtIds ?? [], registrationStart: t.registrationStart ?? '', registrationEnd: t.registrationEnd ?? '', templateId: t.templateId ?? '' });
  };

  const handleEditSave = async () => {
    if (!editId || !editForm.name.trim()) return;
    await DB.updateTournament(editId, {
      logo: editForm.logo.trim() || '🏆',
      name: editForm.name.trim(),
      date: editForm.date,
      location: editForm.location.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
      martialArtIds: editForm.martialArtIds,
      registrationStart: editForm.registrationStart || null,
      registrationEnd:   editForm.registrationEnd   || null,
      templateId:        editForm.templateId || null,
    });
    setEditId(null);
    load();
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="admin-tournaments-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="admin-tournaments-screen">
        <div style={s.maxW}>
          <div style={s.pageTitle}>Torneos</div>
          <div style={s.pageSub}>Gestiona los torneos de la plataforma.</div>

          {/* Add form */}
          <div style={s.formCard} data-testid="add-tournament-form">
            <div style={s.formTitle}>Agregar torneo</div>
            {renderForm(form, setForm, 'input-new')}
            <button style={s.btnPrimary} onClick={handleAdd} data-testid="btn-add-tournament">Agregar</button>
          </div>

          {/* List */}
          <div style={s.listTitle}>
            {tournaments.length > 0 ? `${tournaments.length} torneo${tournaments.length !== 1 ? 's' : ''}` : ''}
          </div>

          {tournaments.length === 0 ? (
            <div style={s.empty} data-testid="empty-state">
              <span style={s.emptyIcon}>🏆</span>
              <div style={s.emptyTxt}>No hay torneos aún.</div>
            </div>
          ) : (
            <div data-testid="tournaments-list">
              {tournaments.map(t => (
                <div key={t.id} style={s.tournCard} data-testid={`tournament-card-${t.id}`}>
                  {editId === t.id ? (
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
                        <div style={s.tLogo}>{t.logo}</div>
                        <div style={s.tInfo}>
                          <div style={s.tName} data-testid={`tournament-name-${t.id}`}>{t.name}</div>
                          <div style={s.tMeta} data-testid={`tournament-meta-${t.id}`}>{t.date && `📅 ${t.date}`}{t.location && ` · 📍 ${t.location}`}</div>
                        </div>
                      </div>
                      {t.description && <div style={s.tDesc} data-testid={`tournament-desc-${t.id}`}>{t.description}</div>}
                      {t.martialArtIds && t.martialArtIds.length > 0 && (
                        <div style={s.artBadges} data-testid={`tournament-arts-${t.id}`}>
                          {t.martialArtIds.map(artId => {
                            const art = arts.find(a => a.id === artId);
                            return art ? (
                              <span key={artId} style={s.artBadge} data-testid={`tournament-art-badge-${artId}`}>{art.logo} {art.name}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <div style={s.statusBadge(t.status)} data-testid={`tournament-status-${t.id}`}>{STATUS_LABELS[t.status]}</div>
                      {/* Registration period override */}
                      {(() => {
                        const fo = t.registrationForceOpen;
                        return (
                          <div style={s.regStatus(fo === true)} data-testid={`reg-status-${t.id}`}>
                            {fo === true  && '🟢 Inscripciones abiertas (manual)'}
                            {fo === false && '🔴 Inscripciones cerradas (manual)'}
                            {fo == null   && '🔵 Inscripciones: modo automático'}
                          </div>
                        );
                      })()}
                      <div style={s.btnRow}>
                        <button style={s.editBtn}   onClick={() => startEdit(t)} data-testid={`btn-edit-${t.id}`}>Editar</button>
                        <button style={s.editBtn}   onClick={() => router.push(`/screens/TournamentDashboardScreen?tournamentId=${t.id}` as any)} data-testid={`btn-dashboard-${t.id}`}>Dashboard</button>
                        <button style={s.deleteBtn} onClick={() => DB.deleteTournament(t.id).then(load)} data-testid={`btn-delete-${t.id}`}>Eliminar</button>
                        {t.registrationForceOpen !== true && (
                          <button style={s.openBtn} onClick={() => DB.updateTournament(t.id, { registrationForceOpen: true }).then(load)} data-testid={`btn-reg-open-${t.id}`}>
                            🔓 Abrir Inscripciones
                          </button>
                        )}
                        {t.registrationForceOpen !== false && (
                          <button style={s.closeBtn} onClick={() => DB.updateTournament(t.id, { registrationForceOpen: false }).then(load)} data-testid={`btn-reg-close-${t.id}`}>
                            🔒 Cerrar Inscripciones
                          </button>
                        )}
                        {t.registrationForceOpen != null && (
                          <button style={s.btnGhost} onClick={() => DB.updateTournament(t.id, { registrationForceOpen: null }).then(load)} data-testid={`btn-reg-auto-${t.id}`}>
                            🔵 Modo automático
                          </button>
                        )}
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
