import React, { useCallback, useEffect, useState } from 'react';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme, aiTheme } from '../../context/ThemeContext';
import { COUNTRIES } from '../../constants/countries';

export default function ProfileScreen() {
  const { currentUser, isLoading } = useAuthGuard();
  const { isDark, toggle } = useTheme();
  const c = isDark ? aiTheme.dark : aiTheme.light;

  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [error,   setError]     = useState('');

  const [form, setForm] = useState({
    fullName: '', country: '', age: '', gender: '',
    academy: '', weight: '', beltGrade: '',
  });

  // Martial art ranks
  const [allArts, setAllArts]         = useState<DB.MartialArt[]>([]);
  const [userRanks, setUserRanks]     = useState<DB.UserMartialArtRank[]>([]);
  const [artRankMap, setArtRankMap]   = useState<Record<string, DB.RankSystem[]>>({});
  const [addArtId, setAddArtId]       = useState('');
  const [addRankId, setAddRankId]     = useState('');
  const [editRankArtId, setEditRankArtId] = useState<string | null>(null);
  const [editRankId, setEditRankId]   = useState('');

  useEffect(() => {
    if (currentUser) {
      setForm({
        fullName:  currentUser.fullName,
        country:   currentUser.country,
        age:       currentUser.age,
        gender:    currentUser.gender,
        academy:   currentUser.academy,
        weight:    currentUser.weight,
        beltGrade: currentUser.beltGrade,
      });
    }
  }, [currentUser]);

  const loadMartialArts = useCallback(async () => {
    if (!currentUser) return;
    const [arts, ranks] = await Promise.all([
      DB.getAllMartialArts(),
      DB.getUserMartialArtRanks(currentUser.id),
    ]);
    setAllArts(arts);
    setUserRanks(ranks);
    const artIds = [...new Set(ranks.map(r => r.martialArtId))];
    const entries = await Promise.all(
      artIds.map(id => DB.getRankSystemsByMartialArtId(id).then(rs => [id, rs] as [string, DB.RankSystem[]]))
    );
    setArtRankMap(Object.fromEntries(entries));
  }, [currentUser]);

  useEffect(() => { loadMartialArts(); }, [loadMartialArts]);

  if (isLoading || !currentUser) return null;

  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleAddRank = async () => {
    if (!addArtId || !addRankId) return;
    await DB.upsertUserMartialArtRank(currentUser.id, addArtId, addRankId);
    setAddArtId('');
    setAddRankId('');
    loadMartialArts();
  };

  const startEditRank = async (artId: string, rankSystemId: string) => {
    setEditRankArtId(artId);
    setEditRankId(rankSystemId);
    if (!artRankMap[artId]) {
      const rs = await DB.getRankSystemsByMartialArtId(artId);
      setArtRankMap(m => ({ ...m, [artId]: rs }));
    }
  };

  const handleEditRankSave = async () => {
    if (!editRankArtId || !editRankId) return;
    await DB.upsertUserMartialArtRank(currentUser.id, editRankArtId, editRankId);
    setEditRankArtId(null);
    loadMartialArts();
  };

  const handleRemoveRank = async (artId: string) => {
    await DB.removeUserMartialArtRank(currentUser.id, artId);
    loadMartialArts();
  };

  const unassignedArts = allArts.filter(a => !userRanks.some(r => r.martialArtId === a.id));

  const loadAddArtRanks = async (artId: string) => {
    setAddArtId(artId);
    setAddRankId('');
    if (artId && !artRankMap[artId]) {
      const rs = await DB.getRankSystemsByMartialArtId(artId);
      setArtRankMap(m => ({ ...m, [artId]: rs }));
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.fullName.trim())                                             { setError('El nombre es requerido'); return; }
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 5)     { setError('Edad válida es requerida'); return; }
    if (!form.weight || isNaN(Number(form.weight)))                        { setError('Peso válido es requerido'); return; }
    setSaving(true);
    await DB.updateUser(currentUser.id, {
      fullName:  form.fullName.trim(),
      country:   form.country.trim(),
      age:       form.age,
      gender:    form.gender,
      academy:   form.academy.trim(),
      weight:    form.weight,
      beltGrade: form.beltGrade,
    });
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const s: any = {
    page: {
      minHeight: '100%',
      background: c.background,
      padding: '32px 24px',
      fontFamily: "'Space Grotesk', Roboto, sans-serif",
      boxSizing: 'border-box' as const,
      transition: 'background 0.25s, color 0.25s',
    },
    maxW: { maxWidth: 680, margin: '0 auto' },

    // Header bar
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28,
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    avatar: {
      width: 72, height: 72, borderRadius: 20,
      background: c.primary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 32, flexShrink: 0, color: c.onPrimary,
      boxShadow: `0 4px 16px ${c.primary}40`,
    },
    hTitle:  { fontSize: 26, fontWeight: 800, color: c.onSurface, marginBottom: 2, letterSpacing: -0.5 },
    hSub:    { fontSize: 13, color: c.onSurfaceVariant },

    // Theme toggle
    toggleBtn: {
      width: 44, height: 44, borderRadius: 14,
      background: c.surfaceContainer,
      border: `1px solid ${c.outlineVariant}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: 20,
      transition: 'background 0.2s',
    },

    // Cards
    card: {
      background: c.surface,
      borderRadius: 24,
      padding: 28,
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.35)' : '0 4px 20px rgba(44,47,48,0.07)',
      marginBottom: 20,
      transition: 'background 0.25s',
    },
    sectionLbl: {
      fontSize: 11, fontWeight: 700,
      color: c.primary,
      letterSpacing: 1.4, marginBottom: 16,
      textTransform: 'uppercase' as const,
    },
    row:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    field:  { marginBottom: 16 },
    label:  { display: 'block', fontSize: 11, color: c.onSurfaceVariant, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 },
    value:  { fontSize: 15, color: c.onSurface, fontWeight: 500, padding: '4px 0' },
    input:  {
      width: '100%', height: 46,
      border: `1px solid ${c.outlineVariant}`,
      borderRadius: 12, padding: '0 14px', fontSize: 15,
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit', outline: 'none',
      background: c.surfaceContainerLow,
      color: c.onSurface,
      transition: 'border-color 0.15s',
    },
    select: {
      width: '100%', height: 46,
      border: `1px solid ${c.outlineVariant}`,
      borderRadius: 12, paddingLeft: 14, fontSize: 15,
      boxSizing: 'border-box' as const,
      background: c.surfaceContainerLow,
      color: c.onSurface,
      fontFamily: 'inherit',
    },

    // Feedback
    errorBox:  { color: isDark ? c.error : '#b3261e', fontSize: 13, padding: '10px 16px', background: isDark ? c.errorContainer : '#fce8e6', borderRadius: 12, marginBottom: 16 },
    savedBox:  { color: isDark ? c.success : '#2e7d32', fontSize: 13, padding: '10px 16px', background: isDark ? c.successContainer : '#e8f5e9', borderRadius: 12, marginBottom: 16 },
    divider:   { border: 'none', borderTop: `1px solid ${c.outlineVariant}30`, margin: '8px 0 16px' },

    // Account card (tinted)
    readonlyCard: {
      background: isDark ? '#1a1e29' : '#f0ecff',
      borderRadius: 24,
      padding: 28,
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.35)' : '0 4px 20px rgba(44,47,48,0.05)',
      marginBottom: 20,
    },

    // Action buttons
    actions:   { display: 'flex', gap: 12, marginTop: 4 },
    btnEdit:   {
      flex: 1, padding: '13px 0',
      background: c.primary, border: 'none', borderRadius: 32,
      color: c.onPrimary, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: `0 4px 16px ${c.primary}40`,
      transition: 'opacity 0.15s',
    },
    btnSave:   {
      flex: 2, padding: '13px 0',
      background: isDark ? '#81c784' : '#2e7d32',
      border: 'none', borderRadius: 32,
      color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      opacity: saving ? 0.7 : 1,
    },
    btnCancel: {
      flex: 1, padding: '13px 0',
      background: 'transparent',
      border: `1px solid ${c.outlineVariant}`,
      borderRadius: 32, color: c.onSurfaceVariant, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    },

    // Martial arts rows
    artRow:    { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${c.outlineVariant}30` },
    artLogo:   { fontSize: 22, width: 28, textAlign: 'center' as const, flexShrink: 0 },
    artName:   { flex: 1, fontSize: 14, fontWeight: 600, color: c.onSurface },
    rankBadge: {
      fontSize: 12, padding: '3px 12px', borderRadius: 16,
      background: isDark ? c.primaryContainer : '#ede9fe',
      color: isDark ? '#e5deff' : c.primary,
      fontWeight: 700,
    },
    artEditBtn: {
      padding: '4px 12px',
      background: isDark ? c.primaryContainer : '#ede9fe',
      border: 'none', borderRadius: 16,
      color: isDark ? '#e5deff' : c.primary,
      fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    },
    artDelBtn:  {
      padding: '4px 12px', background: 'transparent',
      border: `1px solid ${c.outlineVariant}`,
      borderRadius: 16, color: c.onSurfaceVariant, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    },
    addRow:    { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' as const, alignItems: 'center' },
    smSelect:  {
      padding: '7px 12px',
      border: `1px solid ${c.outlineVariant}`,
      borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
      background: c.surfaceContainerLow,
      color: c.onSurface,
      outline: 'none', flex: 1, minWidth: 120,
    },
    smBtn: {
      padding: '8px 18px',
      background: c.primary, border: 'none', borderRadius: 16,
      color: c.onPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      whiteSpace: 'nowrap' as const,
    },
    emptyArts: { fontSize: 13, color: c.onSurfaceVariant, padding: '8px 0', fontStyle: 'italic' as const },
  };

  const Field = ({ label, k, type = 'text', options, optionLabels }: {
    label: string; k: string; type?: string; options?: string[]; optionLabels?: string[];
  }) => (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {editing ? (
        options ? (
          <select style={s.select} value={(form as any)[k]} onChange={set(k)}>
            <option value="">-- Seleccionar --</option>
            {options.map((o, i) => <option key={o} value={o}>{optionLabels ? optionLabels[i] : o}</option>)}
          </select>
        ) : (
          <input style={s.input} type={type} value={(form as any)[k]} onChange={set(k)} />
        )
      ) : (
        <div style={s.value}>{(form as any)[k] || <span style={{ color: c.outlineVariant }}>—</span>}</div>
      )}
    </div>
  );

  return (
    <Sidebar>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        @media (max-width: 600px) {
          .kb-profile-page { padding: 16px 12px !important; }
          .kb-profile-row  { grid-template-columns: 1fr !important; }
          .kb-profile-card { padding: 16px !important; }
        }
      `}</style>
      <div data-testid="profile-screen" data-theme={isDark ? 'dark' : 'light'} className="kb-profile-page" style={s.page}>
        <div style={s.maxW}>

          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.avatar}>🥋</div>
              <div>
                <div style={s.hTitle}>{form.fullName || currentUser.fullName}</div>
                <div style={s.hSub}>{currentUser.email}</div>
              </div>
            </div>
            {/* Dark / Light toggle */}
            <button
              data-testid="btn-theme-toggle"
              style={s.toggleBtn}
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          {saved  && <div style={s.savedBox}>✓ Perfil actualizado exitosamente</div>}
          {error  && <div style={s.errorBox}>{error}</div>}

          {/* Personal info */}
          <div className="kb-profile-card" style={s.card}>
            <div style={s.sectionLbl}>Información Personal</div>
            <hr style={s.divider} />
            <div className="kb-profile-row" style={s.row}>
              <Field label="Nombre Completo" k="fullName" />
              <Field label="País"            k="country" options={COUNTRIES.map(co => co.name)} optionLabels={COUNTRIES.map(co => `${co.flag} ${co.name}`)} />
            </div>
            <div className="kb-profile-row" style={s.row}>
              <Field label="Edad"   k="age"    type="number" />
              <Field label="Género" k="gender" options={['Masculino', 'Femenino', 'Otro']} />
            </div>
          </div>

          {/* Sports info */}
          <div className="kb-profile-card" style={s.card}>
            <div style={s.sectionLbl}>Información Deportiva</div>
            <hr style={s.divider} />
            <div className="kb-profile-row" style={s.row}>
              <Field label="Academia"  k="academy" />
              <Field label="Peso (kg)" k="weight" type="number" />
            </div>
            <Field
              label="Grado / Cinturón"
              k="beltGrade"
              options={['Blanco', 'Azul', 'Morado', 'Café', 'Negro',
                        '10° Kyu', '9° Kyu', '8° Kyu', '7° Kyu', '6° Kyu',
                        '5° Kyu', '4° Kyu', '3° Kyu', '2° Kyu', '1° Kyu',
                        '1° Dan', '2° Dan+']}
            />
          </div>

          {/* Martial arts ranks */}
          {allArts.length > 0 && (
            <div className="kb-profile-card" style={s.card} data-testid="martial-arts-section">
              <div style={s.sectionLbl}>Artes Marciales</div>
              <hr style={s.divider} />

              {userRanks.length === 0 ? (
                <div style={s.emptyArts} data-testid="no-arts-assigned">Sin artes marciales asignadas.</div>
              ) : (
                userRanks.map(ur => {
                  const art  = allArts.find(a => a.id === ur.martialArtId);
                  const rank = (artRankMap[ur.martialArtId] ?? []).find(r => r.id === ur.rankSystemId);
                  return (
                    <div key={ur.martialArtId} style={s.artRow} data-testid={`art-rank-row-${ur.martialArtId}`}>
                      <span style={s.artLogo}>{art?.logo ?? '🥋'}</span>
                      <span style={s.artName}>{art?.name ?? ur.martialArtId}</span>
                      {editRankArtId === ur.martialArtId ? (
                        <>
                          <select
                            style={{ ...s.smSelect, flex: 'none', width: 160 }}
                            value={editRankId}
                            onChange={e => setEditRankId((e.target as HTMLSelectElement).value)}
                            data-testid="input-edit-rank"
                          >
                            <option value="">— Rango —</option>
                            {(artRankMap[ur.martialArtId] ?? []).map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <button style={s.artEditBtn} onClick={handleEditRankSave} data-testid="btn-save-rank">Guardar</button>
                          <button style={s.artDelBtn}  onClick={() => setEditRankArtId(null)} data-testid="btn-cancel-rank-edit">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <span style={s.rankBadge} data-testid={`rank-badge-${ur.martialArtId}`}>{rank?.name ?? '—'}</span>
                          <button style={s.artEditBtn} onClick={() => startEditRank(ur.martialArtId, ur.rankSystemId)} data-testid={`btn-edit-rank-${ur.martialArtId}`}>Editar</button>
                          <button style={s.artDelBtn}  onClick={() => handleRemoveRank(ur.martialArtId)} data-testid={`btn-remove-rank-${ur.martialArtId}`}>Quitar</button>
                        </>
                      )}
                    </div>
                  );
                })
              )}

              {unassignedArts.length > 0 && (
                <div style={s.addRow} data-testid="add-art-row">
                  <select
                    style={s.smSelect}
                    value={addArtId}
                    onChange={e => loadAddArtRanks((e.target as HTMLSelectElement).value)}
                    data-testid="select-add-art"
                  >
                    <option value="">— Arte marcial —</option>
                    {unassignedArts.map(a => <option key={a.id} value={a.id}>{a.logo} {a.name}</option>)}
                  </select>
                  {addArtId && (
                    <select
                      style={s.smSelect}
                      value={addRankId}
                      onChange={e => setAddRankId((e.target as HTMLSelectElement).value)}
                      data-testid="select-add-rank"
                    >
                      <option value="">— Rango —</option>
                      {(artRankMap[addArtId] ?? []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}
                  <button style={s.smBtn} onClick={handleAddRank} disabled={!addArtId || !addRankId} data-testid="btn-add-art-rank">
                    Agregar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Readonly account info */}
          <div className="kb-profile-card" style={s.readonlyCard}>
            <div style={s.sectionLbl}>Cuenta</div>
            <hr style={s.divider} />
            <div style={s.field}>
              <label style={s.label}>Correo Electrónico</label>
              <div style={s.value}>{currentUser.email}</div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Miembro desde</label>
              <div style={s.value}>{new Date(currentUser.createdAt).toLocaleDateString('es-CR')}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={s.actions}>
            {editing ? (
              <>
                <button style={s.btnCancel} onClick={() => { setEditing(false); setError(''); }}>Cancelar</button>
                <button
                  data-testid="btn-save-profile"
                  style={s.btnSave}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : '✓ Guardar Cambios'}
                </button>
              </>
            ) : (
              <button
                data-testid="btn-edit-profile"
                style={s.btnEdit}
                onClick={() => setEditing(true)}
              >
                ✏️ Editar Perfil
              </button>
            )}
          </div>

        </div>
      </div>
    </Sidebar>
  );
}
