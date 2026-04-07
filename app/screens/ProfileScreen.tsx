import React, { useEffect, useState } from 'react';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';

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

  if (isLoading || !currentUser) return null;

  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

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
  };

  const Field = ({ label, k, type = 'text', options }: { label: string; k: string; type?: string; options?: string[] }) => (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {editing ? (
        options ? (
          <select style={s.select} value={(form as any)[k]} onChange={set(k)}>
            <option value="">-- Seleccionar --</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
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
              <Field label="País"            k="country" />
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
