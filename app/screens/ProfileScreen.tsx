import React, { useCallback, useEffect, useState } from 'react';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { KumiteTheme as T } from '../../constants/theme';
import { COUNTRIES } from '../../constants/countries';

export default function ProfileScreen() {
  const { currentUser, isLoading } = useAuthGuard();

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
    // Load rank systems for arts that have user ranks
    const artIds = [...new Set(ranks.map(r => r.martialArtId))];
    const entries = await Promise.all(
      artIds.map(id => DB.getRankSystemsByMartialArtId(id).then(rs => [id, rs] as [string, DB.RankSystem[]]))
    );
    setArtRankMap(Object.fromEntries(entries));
  }, [currentUser]);

  useEffect(() => { loadMartialArts(); }, [loadMartialArts]);

  if (isLoading || !currentUser) return null;

  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  // Martial art rank handlers
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

  const s: any = {
    page:       { minHeight: '100%', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 640, margin: '0 auto' },
    heading:    { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
    avatar:     { width: 72, height: 72, borderRadius: '50%', background: '#6750a4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 },
    hTitle:     { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 2 },
    hSub:       { fontSize: 14, color: '#888' },
    card:       { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.09)', marginBottom: 20 },
    sectionLbl: { fontSize: 12, fontWeight: 700, color: '#6750a4', letterSpacing: 1.2, marginBottom: 16 },
    row:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 },
    field:      { marginBottom: 16 },
    label:      { display: 'block', fontSize: 12, color: '#888', marginBottom: 4, fontWeight: 500 },
    value:      { fontSize: 15, color: '#1a1a2e', fontWeight: 500, padding: '4px 0' },
    input:      { width: '100%', height: 46, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', background: '#fafafa' },
    select:     { width: '100%', height: 46, border: '1px solid #ddd', borderRadius: 8, paddingLeft: 12, fontSize: 15, boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit' },
    errorBox:   { color: '#b3261e', fontSize: 13, padding: '10px 14px', background: '#fce8e6', borderRadius: 8, marginBottom: 16 },
    savedBox:   { color: '#2e7d32', fontSize: 13, padding: '10px 14px', background: '#e8f5e9', borderRadius: 8, marginBottom: 16 },
    actions:    { display: 'flex', gap: 12, marginTop: 4 },
    btnEdit:    { flex: 1, padding: '12px 0', background: '#6750a4', border: 'none', borderRadius: 24, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    btnSave:    { flex: 2, padding: '12px 0', background: '#2e7d32', border: 'none', borderRadius: 24, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 },
    btnCancel:  { flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid #ccc', borderRadius: 24, color: '#666', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    divider:    { border: 'none', borderTop: '1px solid #f0f0f0', margin: '8px 0 16px' },
    readonlyCard: { background: '#f9f5ff', borderRadius: 14, padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 20 },

    // Martial arts section
    artRow:     { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' },
    artLogo:    { fontSize: 22, width: 28, textAlign: 'center' as const, flexShrink: 0 },
    artName:    { flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
    rankBadge:  { fontSize: 12, padding: '2px 10px', borderRadius: 12, background: T.colors.primaryLight, color: T.colors.primary, fontWeight: 600 },
    artEditBtn: { padding: '3px 10px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: 16, color: T.colors.primary, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
    artDelBtn:  { padding: '3px 10px', background: 'transparent', border: '1px solid #e0e0e0', borderRadius: 16, color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
    addRow:     { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' as const, alignItems: 'center' },
    smSelect:   { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fafafa', outline: 'none', flex: 1, minWidth: 120 },
    smBtn:      { padding: '7px 16px', background: T.colors.primary, border: 'none', borderRadius: 16, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    emptyArts:  { fontSize: 13, color: '#aaa', padding: '8px 0', fontStyle: 'italic' as const },
  };

  const Field = ({ label, k, type = 'text', options, optionLabels }: { label: string; k: string; type?: string; options?: string[]; optionLabels?: string[] }) => (
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
        <div style={s.value}>{(form as any)[k] || <span style={{ color: '#ccc' }}>—</span>}</div>
      )}
    </div>
  );

  return (
    <Sidebar>
      <style>{`
        @media (max-width: 600px) {
          .kb-profile-page { padding: 16px 12px !important; }
          .kb-profile-row  { grid-template-columns: 1fr !important; }
          .kb-profile-card { padding: 16px !important; }
        }
      `}</style>
      <div data-testid="profile-screen" className="kb-profile-page" style={s.page}>
        <div style={s.maxW}>
          {/* Header */}
          <div style={s.heading}>
            <div style={s.avatar}>🥋</div>
            <div>
              <div style={s.hTitle}>{form.fullName || currentUser.fullName}</div>
              <div style={s.hSub}>{currentUser.email}</div>
            </div>
          </div>

          {saved  && <div style={s.savedBox}>✓ Perfil actualizado exitosamente</div>}
          {error  && <div style={s.errorBox}>{error}</div>}

          {/* Personal info */}
          <div className="kb-profile-card" style={s.card}>
            <div style={s.sectionLbl}>INFORMACIÓN PERSONAL</div>
            <hr style={s.divider} />
            <div className="kb-profile-row" style={s.row}>
              <Field label="Nombre Completo" k="fullName" />
              <Field label="País"            k="country" options={COUNTRIES.map(c => c.name)} optionLabels={COUNTRIES.map(c => `${c.flag} ${c.name}`)} />
            </div>
            <div className="kb-profile-row" style={s.row}>
              <Field label="Edad"   k="age"    type="number" />
              <Field label="Género" k="gender" options={['Masculino', 'Femenino', 'Otro']} />
            </div>
          </div>

          {/* Sports info */}
          <div className="kb-profile-card" style={s.card}>
            <div style={s.sectionLbl}>INFORMACIÓN DEPORTIVA</div>
            <hr style={s.divider} />
            <div className="kb-profile-row" style={s.row}>
              <Field label="Academia"         k="academy" />
              <Field label="Peso (kg)"        k="weight" type="number" />
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
              <div style={s.sectionLbl}>ARTES MARCIALES</div>
              <hr style={s.divider} />

              {/* Assigned arts */}
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

              {/* Add a new art */}
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
            <div style={s.sectionLbl}>CUENTA</div>
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
