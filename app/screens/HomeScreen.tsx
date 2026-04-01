import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { currentUser, isLoading, login } = useAuth();

  const [mode, setMode] = useState<'home' | 'login'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, go straight to main screen
  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/screens/MainScreen');
    }
  }, [isLoading, currentUser]);

  const s: any = {
    page:       { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    logo:       { fontSize: 72, marginBottom: 8 },
    title:      { fontSize: 42, fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: 2 },
    subtitle:   { fontSize: 16, color: '#a0b4c8', marginBottom: 48, textAlign: 'center', maxWidth: 340 },
    btnPrimary: { width: '100%', padding: 16, background: '#6750a4', border: 'none', borderRadius: 28, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', marginBottom: 14, fontFamily: 'inherit', letterSpacing: 0.5 },
    btnOutline: { width: '100%', padding: 16, background: 'transparent', border: '2px solid #6750a4', borderRadius: 28, color: '#c4b5fd', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5 },
    divider:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, width: '100%', maxWidth: 400 },
    divLine:    { flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' },
    divText:    { color: '#a0b4c8', fontSize: 13 },
    card:       { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 18, padding: 32, width: '100%', maxWidth: 400 },
    cardTitle:  { fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 },
    cardSub:    { fontSize: 14, color: '#a0b4c8', marginBottom: 24 },
    label:      { display: 'block', color: '#a0b4c8', fontSize: 13, marginBottom: 5, fontWeight: 500 },
    input:      { width: '100%', height: 50, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '0 16px', fontSize: 15, background: 'rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit', outline: 'none' },
    errorBox:   { color: '#ff8a80', fontSize: 13, marginBottom: 14, padding: '10px 14px', background: 'rgba(179,38,30,0.2)', borderRadius: 8, border: '1px solid rgba(179,38,30,0.4)' },
    backLink:   { color: '#a0b4c8', fontSize: 14, cursor: 'pointer', marginTop: 18, background: 'none', border: 'none', fontFamily: 'inherit', width: '100%', textAlign: 'center' },
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.success) {
      router.replace('/screens/MainScreen');
    } else {
      setError(result.error ?? 'Error al iniciar sesión');
    }
  };

  if (isLoading) return null;

  // ── Login view ──────────────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <div style={s.page}>
        <div style={s.logo}>🥋</div>
        <div style={{ ...s.title, fontSize: 32, marginBottom: 6 }}>KumiteApp</div>
        <div style={{ ...s.subtitle, marginBottom: 32 }}>Inicia sesión en tu cuenta</div>

        <div style={s.card}>
          <div style={s.cardTitle}>Iniciar Sesión</div>
          <div style={s.cardSub}>Ingresa tus credenciales para continuar</div>

          {error && <div style={s.errorBox}>{error}</div>}

          <label style={s.label}>Correo Electrónico</label>
          <input
            type="email"
            style={s.input}
            placeholder="tu@correo.com"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()}
          />

          <label style={s.label}>Contraseña</label>
          <input
            type="password"
            style={s.input}
            placeholder="••••••••"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()}
          />

          <button
            style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1, marginBottom: 0 }}
            onClick={handleLogin}
            disabled={submitting}
          >
            {submitting ? 'Iniciando...' : '🔑 Iniciar Sesión'}
          </button>

          <button style={s.backLink} onClick={() => { setMode('home'); setError(''); }}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Home view ───────────────────────────────────────────────────────────
  return (
    <div data-testid="home-screen" style={s.page}>
      <div style={s.logo}>🥋</div>
      <div style={s.title}>KumiteApp</div>
      <div style={s.subtitle}>La plataforma de torneos de artes marciales</div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <button style={s.btnPrimary} onClick={() => setMode('login')}>
          🔑 Iniciar Sesión
        </button>

        <div style={s.divider}>
          <div style={s.divLine} />
          <span style={s.divText}>o</span>
          <div style={s.divLine} />
        </div>

        <button
          style={s.btnOutline}
          onClick={() => router.push('/screens/OnboardingScreen' as any)}
        >
          ✨ Sync In — Crear Cuenta
        </button>
      </div>
    </div>
  );
}
