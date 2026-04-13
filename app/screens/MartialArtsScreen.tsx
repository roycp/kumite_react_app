/**
 * app/screens/MartialArtsScreen.tsx
 *
 * Admin-only screen for managing martial arts.
 * Allows an admin to add, edit, and delete martial arts entries (name + logo emoji).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';

export default function MartialArtsScreen() {
  const T = useKumiteTheme();
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 720, margin: '0 auto' },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    // Add / edit form card
    formCard:   { background: T.colors.card, borderRadius: T.radius.lg, padding: 20, marginBottom: 24, boxShadow: T.shadow.card },
    formTitle:  { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 14 },
    formRow:    { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
    inputWrap:  { display: 'flex', flexDirection: 'column' as const, gap: 4, flex: 1, minWidth: 120 },
    label:      { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub },
    input:      { padding: '9px 12px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    logoInput:  { padding: '9px 12px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: 22, fontFamily: 'inherit', outline: 'none', width: 72, textAlign: 'center' as const },
    btnPrimary: { padding: '9px 22px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.base, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    btnGhost:   { padding: '9px 18px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.base, cursor: 'pointer', fontFamily: 'inherit' },
  
    // Martial art list
    listTitle:  { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
    artCard:    { background: T.colors.card, borderRadius: T.radius.lg, padding: '16px 20px', marginBottom: 10, boxShadow: T.shadow.card, display: 'flex', alignItems: 'center', gap: 14 },
    artLogo:    { fontSize: 32, width: 44, textAlign: 'center' as const, flexShrink: 0 },
    artName:    { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, flex: 1 },
    btnRow:     { display: 'flex', gap: 8 },
    editBtn:    { padding: '5px 14px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    deleteBtn:  { padding: '5px 14px', background: 'transparent', border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    // Empty / loading
    empty:      { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    emptyIcon:  { fontSize: 52, display: 'block', marginBottom: 14 },
    emptyTxt:   { fontSize: T.font.size.xl },
    loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  } as const;


  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_martial_arts');

  const [arts, setArts]           = useState<DB.MartialArt[]>([]);
  const [loadingData, setLoading] = useState(true);

  // Add form state
  const [newName, setNewName]     = useState('');
  const [newLogo, setNewLogo]     = useState('');

  // Edit state
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState('');
  const [editLogo, setEditLogo]   = useState('');

  // Redirect users without manage_martial_arts permission
  useEffect(() => {
    if (!isLoading && currentUser && !canManage) {
      router.replace('/screens/MainScreen');
    }
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await DB.getAllMartialArts();
    setArts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const name = newName.trim();
    const logo = newLogo.trim() || '🥋';
    if (!name) return;
    await DB.createMartialArt({ name, logo });
    setNewName('');
    setNewLogo('');
    load();
  };

  const startEdit = (art: DB.MartialArt) => {
    setEditId(art.id);
    setEditName(art.name);
    setEditLogo(art.logo);
  };

  const handleEditSave = async () => {
    if (!editId || !editName.trim()) return;
    await DB.updateMartialArt(editId, { name: editName.trim(), logo: editLogo.trim() || '🥋' });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await DB.deleteMartialArt(id);
    load();
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="martial-arts-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="martial-arts-screen">
        <div style={s.maxW}>
          <div style={s.pageTitle}>Artes Marciales</div>
          <div style={s.pageSub}>Gestiona las artes marciales disponibles en la plataforma.</div>

          {/* ── Add form ──────────────────────────────────────────────────── */}
          <div style={s.formCard} data-testid="add-martial-art-form">
            <div style={s.formTitle}>Agregar arte marcial</div>
            <div style={s.formRow}>
              <div style={s.inputWrap}>
                <label style={s.label}>Logo (emoji)</label>
                <input
                  style={s.logoInput}
                  value={newLogo}
                  onChange={e => setNewLogo((e.target as HTMLInputElement).value)}
                  placeholder="🥋"
                  maxLength={4}
                  data-testid="input-new-logo"
                />
              </div>
              <div style={{ ...s.inputWrap, flex: 3 }}>
                <label style={s.label}>Nombre</label>
                <input
                  style={s.input}
                  value={newName}
                  onChange={e => setNewName((e.target as HTMLInputElement).value)}
                  placeholder="Ej. Karate, Judo, Taekwondo"
                  data-testid="input-new-name"
                />
              </div>
              <button
                style={s.btnPrimary}
                onClick={handleAdd}
                data-testid="btn-add-martial-art"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* ── List ──────────────────────────────────────────────────────── */}
          <div style={s.listTitle}>
            {arts.length > 0 ? `${arts.length} arte${arts.length !== 1 ? 's' : ''} marcial${arts.length !== 1 ? 'es' : ''}` : ''}
          </div>

          {arts.length === 0 ? (
            <div style={s.empty} data-testid="empty-state">
              <span style={s.emptyIcon}>🥋</span>
              <div style={s.emptyTxt}>No hay artes marciales aún.</div>
            </div>
          ) : (
            <div data-testid="martial-arts-list">
              {arts.map(art => (
                <div key={art.id} style={s.artCard} data-testid={`art-card-${art.id}`}>
                  {editId === art.id ? (
                    /* ── Inline edit row ── */
                    <>
                      <input
                        style={s.logoInput}
                        value={editLogo}
                        onChange={e => setEditLogo((e.target as HTMLInputElement).value)}
                        maxLength={4}
                        data-testid="input-edit-logo"
                      />
                      <input
                        style={{ ...s.input, flex: 1 }}
                        value={editName}
                        onChange={e => setEditName((e.target as HTMLInputElement).value)}
                        data-testid="input-edit-name"
                      />
                      <div style={s.btnRow}>
                        <button style={s.btnPrimary} onClick={handleEditSave} data-testid="btn-save-edit">Guardar</button>
                        <button style={s.btnGhost}   onClick={() => setEditId(null)} data-testid="btn-cancel-edit">Cancelar</button>
                      </div>
                    </>
                  ) : (
                    /* ── Display row ── */
                    <>
                      <div style={s.artLogo} data-testid={`art-logo-${art.id}`}>{art.logo}</div>
                      <div style={s.artName} data-testid={`art-name-${art.id}`}>{art.name}</div>
                      <div style={s.btnRow}>
                        <button style={s.editBtn}   onClick={() => router.push(`/screens/RankSystemsScreen?martialArtId=${art.id}&martialArtName=${encodeURIComponent(art.name)}` as any)} data-testid={`btn-ranks-${art.id}`}>Rangos</button>
                        <button style={s.editBtn}   onClick={() => startEdit(art)} data-testid={`btn-edit-${art.id}`}>Editar</button>
                        <button style={s.deleteBtn} onClick={() => handleDelete(art.id)} data-testid={`btn-delete-${art.id}`}>Eliminar</button>
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
