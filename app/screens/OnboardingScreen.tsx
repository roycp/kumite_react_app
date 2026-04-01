import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, RegisterData } from '../../context/AuthContext';

type Step = 'info' | 'details' | 'account';

export default function OnboardingScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep]       = useState<Step>('info');
  const [info, setInfo]       = useState({ fullName: '', country: '', age: '', gender: '' });
  const [details, setDetails] = useState({ academy: '', weight: '', beltGrade: '' });
  const [account, setAccount] = useState({ email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const steps: Step[] = ['info', 'details', 'account'];
  const stepIdx = steps.indexOf(step);

  const s: any = {
    page:       { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    card:       { maxWidth: 560, margin: '24px auto', background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' },
    progress:   { display: 'flex', gap: 8, marginBottom: 24 },
    dot:        (active: boolean, done: boolean) => ({ height: 6, flex: 1, borderRadius: 3, background: done ? '#6750a4' : active ? '#9c7dd6' : '#e0e0e0', transition: 'background 0.3s' }),
    title:      { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
    sub:        { color: '#666', fontSize: 14, marginBottom: 24 },
    field:      { marginBottom: 18 },
    label:      { display: 'block', fontSize: 13, color: '#555', marginBottom: 5, fontWeight: 500 },
    input:      { width: '100%', height: 48, border: '1px solid #ddd', borderRadius: 8, padding: '0 14px', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
    select:     { width: '100%', height: 48, border: '1px solid #ddd', borderRadius: 8, paddingLeft: 14, fontSize: 15, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' },
    errorBox:   { color: '#b3261e', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: '#fce8e6', borderRadius: 8 },
    actions:    { display: 'flex', gap: 12, marginTop: 28 },
    btnPrimary: { flex: 2, padding: 14, background: '#6750a4', border: 'none', borderRadius: 24, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    btnBack:    { flex: 1, padding: 14, background: 'transparent', border: '1px solid #ccc', borderRadius: 24, color: '#666', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
    stepNote:   { fontSize: 12, color: '#999', marginBottom: 20 },
  };

  const stepTitles: Record<Step, string> = {
    info:    'Información Personal',
    details: 'Detalles Deportivos',
    account: 'Crear Cuenta',
  };

  const stepSubs: Record<Step, string> = {
    info:    'Cuéntanos sobre ti',
    details: 'Tu información deportiva',
    account: 'Email y contraseña para acceder',
  };

  const goNext = () => {
    setError('');
    if (step === 'info') {
      if (!info.fullName.trim())                                           { setError('El nombre completo es requerido'); return; }
      if (!info.country.trim())                                            { setError('El país es requerido'); return; }
      if (!info.age || isNaN(Number(info.age)) || Number(info.age) < 5)   { setError('Edad válida es requerida (mín. 5)'); return; }
      if (!info.gender)                                                    { setError('El género es requerido'); return; }
      setStep('details');
    } else if (step === 'details') {
      if (!details.academy.trim())                                         { setError('El nombre de la academia es requerido'); return; }
      if (!details.weight || isNaN(Number(details.weight)))               { setError('El peso es requerido'); return; }
      if (!details.beltGrade)                                              { setError('El grado/cinturón es requerido'); return; }
      setStep('account');
    } else {
      handleRegister();
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'info')         router.back();
    else if (step === 'details') setStep('info');
    else if (step === 'account') setStep('details');
  };

  const handleRegister = async () => {
    if (!account.email.trim() || !/\S+@\S+\.\S+/.test(account.email)) {
      setError('Correo electrónico válido es requerido'); return;
    }
    if (account.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    if (account.password !== account.confirm) {
      setError('Las contraseñas no coinciden'); return;
    }

    setLoading(true);
    const data: RegisterData = {
      email:     account.email.trim(),
      password:  account.password,
      role:      'athlete',
      fullName:  info.fullName.trim(),
      country:   info.country.trim(),
      age:       info.age,
      gender:    info.gender,
      academy:   details.academy.trim(),
      weight:    details.weight,
      beltGrade: details.beltGrade,
    };
    const result = await register(data);
    setLoading(false);

    if (result.success) {
      router.replace('/screens/MainScreen');
    } else {
      setError(result.error ?? 'Error al registrarse');
    }
  };

  return (
    <div data-testid="onboarding-screen" style={s.page}>
      <div style={s.card}>
        {/* Progress bar */}
        <div style={s.progress}>
          {steps.map((st, i) => (
            <div key={st} style={s.dot(i === stepIdx, i < stepIdx)} />
          ))}
        </div>
        <div style={s.stepNote}>Paso {stepIdx + 1} de {steps.length}</div>

        <div style={s.title}>{stepTitles[step]}</div>
        <div style={s.sub}>{stepSubs[step]}</div>

        {error && <div style={s.errorBox}>{error}</div>}

        {/* Step 1 — Personal info */}
        {step === 'info' && (
          <>
            <div style={s.field}>
              <label style={s.label}>Nombre Completo *</label>
              <input style={s.input} placeholder="Ej: Juan Pérez" value={info.fullName}
                onChange={(e: any) => setInfo(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>País *</label>
              <input style={s.input} placeholder="Ej: Costa Rica" value={info.country}
                onChange={(e: any) => setInfo(p => ({ ...p, country: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Edad *</label>
              <input style={s.input} type="number" placeholder="Ej: 25" value={info.age}
                onChange={(e: any) => setInfo(p => ({ ...p, age: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Género *</label>
              <select style={s.select} value={info.gender}
                onChange={(e: any) => setInfo(p => ({ ...p, gender: e.target.value }))}>
                <option value="">-- Seleccionar --</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </>
        )}

        {/* Step 2 — Sports details */}
        {step === 'details' && (
          <>
            <div style={s.field}>
              <label style={s.label}>Tu Academia *</label>
              <input style={s.input} placeholder="Nombre de tu academia" value={details.academy}
                onChange={(e: any) => setDetails(p => ({ ...p, academy: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Peso (kg) *</label>
              <input style={s.input} type="number" placeholder="Ej: 70" value={details.weight}
                onChange={(e: any) => setDetails(p => ({ ...p, weight: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Grado / Cinturón *</label>
              <select style={s.select} value={details.beltGrade}
                onChange={(e: any) => setDetails(p => ({ ...p, beltGrade: e.target.value }))}>
                <option value="">-- Seleccionar --</option>
                <option value="Blanco">Blanco</option>
                <option value="Azul">Azul</option>
                <option value="Morado">Morado</option>
                <option value="Café">Café</option>
                <option value="Negro">Negro</option>
              </select>
            </div>
          </>
        )}

        {/* Step 3 — Account */}
        {step === 'account' && (
          <>
            <div style={s.field}>
              <label style={s.label}>Correo Electrónico *</label>
              <input style={s.input} type="email" placeholder="tu@correo.com" value={account.email}
                onChange={(e: any) => setAccount(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Contraseña * (mínimo 6 caracteres)</label>
              <input style={s.input} type="password" placeholder="••••••••" value={account.password}
                onChange={(e: any) => setAccount(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirmar Contraseña *</label>
              <input style={s.input} type="password" placeholder="••••••••" value={account.confirm}
                onChange={(e: any) => setAccount(p => ({ ...p, confirm: e.target.value }))}
                onKeyDown={(e: any) => e.key === 'Enter' && goNext()} />
            </div>
          </>
        )}

        <div style={s.actions}>
          <button style={s.btnBack} onClick={goBack}>
            {step === 'info' ? '✕ Cancelar' : '← Atrás'}
          </button>
          <button
            style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
            onClick={goNext}
            disabled={loading}
          >
            {loading ? 'Guardando...' : step === 'account' ? '✓ Completar Registro' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
