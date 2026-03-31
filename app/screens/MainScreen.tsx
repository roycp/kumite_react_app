import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function MainScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const s: any = {
    page:    { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Roboto, sans-serif' },
    logo:    { fontSize: 72, marginBottom: 8 },
    title:   { fontSize: 42, fontWeight: 800, color: '#ffffff', marginBottom: 4, letterSpacing: 2 },
    subtitle:{ fontSize: 16, color: '#a0b4c8', marginBottom: 48, textAlign: 'center' },
    grid:    { display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 },
    card:    { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', color: '#ffffff' },
    cardIcon:{ fontSize: 32 },
    cardText:{ display: 'flex', flexDirection: 'column' },
    cardTitle:{ fontSize: 18, fontWeight: 700, marginBottom: 2 },
    cardSub: { fontSize: 13, color: '#a0b4c8' },
    arrow:   { marginLeft: 'auto', fontSize: 20, color: '#6750a4' },
  };

  const cards = [
    { testId: 'nav-syncup',      icon: '👤', route: '/screens/SyncUpScreen',        title: t('main.syncup'),     sub: t('syncup.title') },
    { testId: 'nav-search',      icon: '🏆', route: '/screens/TournamentSearch',     title: t('main.search'),    sub: t('search.subtitle') },
    { testId: 'nav-management',  icon: '📋', route: '/screens/TournamentManagement', title: t('main.management'),sub: t('management.subtitle') },
  ];

  return (
    <div data-testid="main-screen" style={s.page}>
      <div style={s.logo}>🥋</div>
      <div style={s.title}>{t('app.title')}</div>
      <div style={s.subtitle}>{t('main.subtitle')}</div>

      <div style={s.grid}>
        {cards.map(c => (
          <div
            key={c.testId}
            data-testid={c.testId}
            style={s.card}
            onClick={() => router.push(c.route as any)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(103,80,164,0.3)'; (e.currentTarget as HTMLElement).style.borderColor = '#6750a4'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            <span style={s.cardIcon}>{c.icon}</span>
            <div style={s.cardText}>
              <span style={s.cardTitle}>{c.title}</span>
              <span style={s.cardSub}>{c.sub}</span>
            </div>
            <span style={s.arrow}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
