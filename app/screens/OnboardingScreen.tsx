import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, RegisterData } from '../../context/AuthContext';
import { KumiteTheme as T } from '../../constants/theme';
import { COUNTRIES } from '../../constants/countries';

type Step = 'role' | 'info' | 'details' | 'account';
type Role = 'athlete' | 'manager';

const STEPS: Step[] = ['role', 'info', 'details', 'account'];

const ROLE_CARDS: { role: Role; icon: string; title: string; desc: string }[] = [
  {
    role: 'athlete',
    icon: '🥋',
    title: 'Atleta',
    desc: 'Busca torneos, inscríbete y gestiona tus participaciones.',
  },
  {
    role: 'manager',
    icon: '📋',
    title: 'Manager',
    desc: 'Registra atletas en torneos y gestiona tu equipo.',
  },
];

const s = {
  page:        { minHeight: '100vh', background: T.colors.background, padding: 16, fontFamily: T.font.family, overflowY: 'auto' as const },
  card:        { maxWidth: 560, margin: '24px auto', background: T.colors.card, borderRadius: T.radius.lg, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' },
  progress:    { display: 'flex', gap: 8, marginBottom: 24 },
  dot:         (active: boolean, done: boolean): any => ({
    height: 6, flex: 1, borderRadius: 3,
    background: done ? T.colors.primary : active ? '#9c7dd6' : T.colors.border,
    transition: 'background 0.3s',
  }),
  stepNote:    { fontSize: T.font.size.sm, color: '#999', marginBottom: 20 },
  title:       { fontSize: T.font.size['3xl'], fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 4 },
  sub:         { color: T.colors.textLight, fontSize: T.font.size.base, marginBottom: 24 },
  field:       { marginBottom: 18 },
  label:       { display: 'block', fontSize: T.font.size.md, color: T.colors.textSub, marginBottom: 5, fontWeight: T.font.weight.medium },
  input:       { width: '100%', height: 48, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '0 14px', fontSize: T.font.size.lg, boxSizing: 'border-box' as const, fontFamily: 'inherit', outline: 'none' },
  select:      { width: '100%', height: 48, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, paddingLeft: 14, fontSize: T.font.size.lg, boxSizing: 'border-box' as const, background: T.colors.card, fontFamily: 'inherit' },
  errorBox:    { color: T.colors.error, fontSize: T.font.size.md, marginBottom: 16, padding: '10px 14px', background: T.colors.errorLight, borderRadius: T.radius.sm },
  actions:     { display: 'flex', gap: 12, marginTop: 28 },
  btnPrimary:  { flex: 2, padding: 14, background: T.colors.primary, border: 'none', borderRadius: T.radius.pill, color: T.colors.card, fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, cursor: 'pointer', fontFamily: 'inherit' },
  btnBack:     { flex: 1, padding: 14, background: 'transparent', border: `1px solid #ccc`, borderRadius: T.radius.pill, color: T.colors.textLight, fontSize: T.font.size.lg, cursor: 'pointer', fontFamily: 'inherit' },
  // Role cards
  roleGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 },
  roleCard:    (selected: boolean): any => ({
    padding: '22px 16px', border: `2px solid ${selected ? T.colors.primary : T.colors.border}`,
    borderRadius: T.radius.lg, cursor: 'pointer', textAlign: 'center' as const,
    background: selected ? T.colors.primaryLight : T.colors.card,
    transition: 'all 0.15s',
  }),
  roleIcon:    { fontSize: 40, display: 'block', marginBottom: 10 },
  roleTitle:   { fontSize: T.font.size.lg, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 6 },
  roleDesc:    { fontSize: T.font.size.md, color: T.colors.muted, lineHeight: 1.4 },
} as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step,    setStep]    = useState<Step>('role');
  const [role,    setRole]    = useState<Role | null>(null);
  const [info,    setInfo]    = useState({ fullName: '', country: '', age: '', gender: '' });
  const [details, setDetails] = useState({ academy: '', weight: '', beltGrade: '' });
  const [account, setAccount] = useState({ email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  const stepTitles: Record<Step, string> = {
    role:    'Elige tu rol',
    info:    'Información Personal',
    details: 'Detalles Deportivos',
    account: 'Crear Cuenta',
  };

  const stepSubs: Record<Step, string> = {
    role:    '¿Cómo participarás en KumiteApp?',
    info:    'Cuéntanos sobre ti',
    details: 'Tu información deportiva',
    account: 'Correo y contraseña para acceder',
  };

  const goNext = () => {
    setError('');
    if (step === 'role') {
      if (!role) { setError('Selecciona un rol para continuar'); return; }
      setStep('info');
    } else if (step === 'info') {
      if (!info.fullName.trim())                                         { setError('El nombre completo es requerido'); return; }
      if (!info.country.trim())                                          { setError('El país es requerido'); return; }
      if (!info.age || isNaN(Number(info.age)) || Number(info.age) < 5) { setError('Se requiere una edad válida (mín. 5)'); return; }
      if (!info.gender)                                                  { setError('El género es requerido'); return; }
      setStep('details');
    } else if (step === 'details') {
      if (!details.academy.trim())                          { setError('El nombre de la academia es requerido'); return; }
      if (!details.weight || isNaN(Number(details.weight))){ setError('El peso es requerido'); return; }
      if (!details.beltGrade)                              { setError('El grado/cinturón es requerido'); return; }
      setStep('account');
    } else {
      handleRegister();
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'role')    router.back();
    if (step === 'info')    setStep('role');
    if (step === 'details') setStep('info');
    if (step === 'account') setStep('details');
  };

  const handleRegister = async () => {
    if (!account.email.trim() || !/\S+@\S+\.\S+/.test(account.email)) {
      setError('Se requiere un correo electrónico válido'); return;
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
      role:      role!,
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
          {STEPS.map((st, i) => (
            <div key={st} style={s.dot(i === stepIdx, i < stepIdx)} />
          ))}
        </div>
        <div style={s.stepNote}>Paso {stepIdx + 1} de {STEPS.length}</div>

        <div style={s.title}>{stepTitles[step]}</div>
        <div style={s.sub}>{stepSubs[step]}</div>

        {error && <div style={s.errorBox}>{error}</div>}

        {/* Step 0 — Role selection */}
        {step === 'role' && (
          <div style={s.roleGrid}>
            {ROLE_CARDS.map(rc => (
              <div
                key={rc.role}
                data-testid={`role-card-${rc.role}`}
                style={s.roleCard(role === rc.role)}
                onClick={() => setRole(rc.role)}
              >
                <span style={s.roleIcon}>{rc.icon}</span>
                <div style={s.roleTitle}>{rc.title}</div>
                <div style={s.roleDesc}>{rc.desc}</div>
              </div>
            ))}
          </div>
        )}

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
              <select
                style={s.select}
                value={info.country}
                onChange={(e: any) => setInfo(p => ({ ...p, country: e.target.value }))}
                data-testid="select-country"
              >
                <option value="">-- Seleccionar País --</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
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
              <label style={s.label}>{role === 'manager' ? 'Tu Academia / Club *' : 'Tu Academia *'}</label>
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
                <option value="1° Dan">1° Dan</option>
                <option value="2° Dan+">2° Dan+</option>
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
            {step === 'role' ? '✕ Cancelar' : '← Atrás'}
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
