import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const TOURNAMENTS = [
  { id: '1', name: 'Copa Nacional Kumite 2026',   date: '2026-05-15', location: 'San José, CR',         logo: '🥋' },
  { id: '2', name: 'Panamerican Open Judo',        date: '2026-06-20', location: 'Ciudad de México, MX', logo: '🥋' },
  { id: '3', name: 'World Grappling Championship', date: '2026-07-10', location: 'Miami, FL',             logo: '🥋' },
  { id: '4', name: 'Central America Gi Open',      date: '2026-08-05', location: 'Guatemala City, GT',   logo: '🥋' },
];

export default function TournamentSearch() {
  const router = useRouter();
  const { t } = useTranslation();

  const s: any = {
    page:   { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif' },
    header: { maxWidth: 900, margin: '0 auto 20px', paddingTop: 8 },
    title:  { fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
    sub:    { color: '#666', fontSize: 14 },
    grid:   { maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    tile:   { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'pointer', border: '1px solid #e8e8e8', transition: 'all 0.2s' },
    logo:   { fontSize: 48, marginBottom: 12, display: 'block' },
    name:   { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
    meta:   { fontSize: 13, color: '#666', marginBottom: 4 },
    btn:    { marginTop: 12, padding: '8px 16px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  };

  return (
    <div data-testid="tournament-search-screen" style={s.page}>
      <div style={s.header}>
        <div style={s.title}>{t('search.title')}</div>
        <div style={s.sub}>{t('search.subtitle')}</div>
      </div>

      <div style={s.grid}>
        {TOURNAMENTS.map(t2 => (
          <div
            key={t2.id}
            data-testid={`tournament-tile-${t2.id}`}
            style={s.tile}
            onClick={() => router.push(`/screens/TournamentDetail?id=${t2.id}&name=${encodeURIComponent(t2.name)}` as any)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(103,80,164,0.3)'; (e.currentTarget as HTMLElement).style.borderColor = '#6750a4'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8'; }}
          >
            <span style={s.logo}>{t2.logo}</span>
            <div style={s.name}>{t2.name}</div>
            <div style={s.meta}>📅 {t('search.date')}: {t2.date}</div>
            <div style={s.meta}>📍 {t('search.location')}: {t2.location}</div>
            <button style={s.btn} type="button"
              onClick={e => { e.stopPropagation(); router.push(`/screens/TournamentDetail?id=${t2.id}&name=${encodeURIComponent(t2.name)}` as any); }}>
              {t('search.viewDetails')} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
