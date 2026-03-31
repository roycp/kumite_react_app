import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

const TOURNAMENTS: Record<string, { name: string; date: string; location: string }> = {
  '1': { name: 'Copa Nacional Kumite 2026',   date: '2026-05-15', location: 'San José, CR' },
  '2': { name: 'Panamerican Open Judo',        date: '2026-06-20', location: 'Ciudad de México, MX' },
  '3': { name: 'World Grappling Championship', date: '2026-07-10', location: 'Miami, FL' },
  '4': { name: 'Central America Gi Open',      date: '2026-08-05', location: 'Guatemala City, GT' },
};

export default function TournamentDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; name: string }>();
  const id = params.id || '1';
  const tournament = TOURNAMENTS[id] || TOURNAMENTS['1'];
  const name = params.name ? decodeURIComponent(String(params.name)) : tournament.name;

  const s: any = {
    page:    { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif' },
    card:    { maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    logo:    { fontSize: 80, textAlign: 'center', display: 'block', marginBottom: 20 },
    name:    { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
    metaRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 15, color: '#444' },
    label:   { fontWeight: 700, color: '#6750a4', minWidth: 80 },
    desc:    { marginTop: 20, padding: 16, background: '#f3eeff', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.6 },
    syncBtn: { marginTop: 28, width: '100%', padding: 16, background: '#6750a4', border: 'none', borderRadius: 28, color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    backBtn: { marginTop: 12, width: '100%', padding: 12, background: 'transparent', border: '1px solid #6750a4', borderRadius: 28, color: '#6750a4', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  };

  const handleSyncUp = () => {
    router.push(`/screens/FormScreen?tournamentId=${id}&tournamentName=${encodeURIComponent(name)}` as any);
  };

  return (
    <div data-testid="tournament-detail-screen" style={s.page}>
      <div style={s.card}>
        <span style={s.logo}>🥋</span>
        <div data-testid="detail-name" style={s.name}>{name}</div>

        <div style={s.metaRow}>
          <span style={s.label}>📅 {t('detail.date')}:</span>
          <span data-testid="detail-date">{tournament.date}</span>
        </div>
        <div style={s.metaRow}>
          <span style={s.label}>📍 {t('detail.location')}:</span>
          <span data-testid="detail-location">{tournament.location}</span>
        </div>

        <div style={s.desc}>
          <strong>{t('detail.description')}:</strong> {t('detail.descriptionText')}
        </div>

        <button data-testid="btn-syncup-tournament" style={s.syncBtn} type="button" onClick={handleSyncUp}>
          🥋 {t('detail.syncup')}
        </button>
        <button style={s.backBtn} type="button" onClick={() => router.back()}>
          ← {t('detail.back')}
        </button>
      </div>
    </div>
  );
}
