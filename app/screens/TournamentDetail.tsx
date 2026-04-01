import React, { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getTournamentById } from '../../data/tournaments';

export default function TournamentDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuth();
  const params = useLocalSearchParams<{ id: string; name: string }>();

  const id         = String(params.id || '1');
  const tournament = getTournamentById(id);
  const name       = params.name ? decodeURIComponent(String(params.name)) : (tournament?.name ?? '');

  // Auth guard
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/screens/HomeScreen');
    }
  }, [currentUser, isLoading]);

  const s: any = {
    page:    { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    card:    { maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    logo:    { fontSize: 80, textAlign: 'center', display: 'block', marginBottom: 20 },
    name:    { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
    metaRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 15, color: '#444' },
    label:   { fontWeight: 700, color: '#6750a4', minWidth: 80 },
    desc:    { marginTop: 20, padding: 16, background: '#f3eeff', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.6 },
    syncBtn: { marginTop: 28, width: '100%', padding: 16, background: '#6750a4', border: 'none', borderRadius: 28, color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    backBtn: { marginTop: 12, width: '100%', padding: 12, background: 'transparent', border: '1px solid #6750a4', borderRadius: 28, color: '#6750a4', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  };

  if (isLoading || !currentUser) return null;

  return (
    <div data-testid="tournament-detail-screen" style={s.page}>
      <div style={s.card}>
        <span style={s.logo}>{tournament?.logo ?? '🥋'}</span>
        <div data-testid="detail-name" style={s.name}>{name}</div>

        <div style={s.metaRow}>
          <span style={s.label}>📅 {t('detail.date')}:</span>
          <span data-testid="detail-date">{tournament?.date ?? ''}</span>
        </div>
        <div style={s.metaRow}>
          <span style={s.label}>📍 {t('detail.location')}:</span>
          <span data-testid="detail-location">{tournament?.location ?? ''}</span>
        </div>

        {tournament?.disciplines && tournament.disciplines.length > 0 && (
          <div style={s.metaRow}>
            <span style={s.label}>🥋 Disciplinas:</span>
            <span>{tournament.disciplines.join(', ')}</span>
          </div>
        )}

        <div style={s.desc}>
          <strong>{t('detail.description')}:</strong> {t('detail.descriptionText')}
        </div>

        <button
          data-testid="btn-syncup-tournament"
          style={s.syncBtn}
          type="button"
          onClick={() => router.push(`/screens/FormScreen?tournamentId=${id}&tournamentName=${encodeURIComponent(name)}` as any)}
        >
          🥋 {t('detail.syncup')}
        </button>
        <button style={s.backBtn} type="button" onClick={() => router.back()}>
          ← {t('detail.back')}
        </button>
      </div>
    </div>
  );
}
