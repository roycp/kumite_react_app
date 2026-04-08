import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getTournamentById as getStaticTournamentById } from '../../data/tournaments';
import * as DB from '../../db/database';

export default function TournamentDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuth();
  const params = useLocalSearchParams<{ id: string; name: string; athleteId?: string; athleteName?: string; source?: string }>();

  const id          = String(params.id || '1');
  const source      = String(params.source || 'static');
  const athleteId   = params.athleteId   ? String(params.athleteId)   : undefined;
  const athleteName = params.athleteName ? decodeURIComponent(String(params.athleteName)) : undefined;

  // DB tournament state
  const [dbTournament,  setDbTournament]  = useState<DB.Tournament | null>(null);
  const [martialArts,   setMartialArts]   = useState<DB.MartialArt[]>([]);

  // Static fallback
  const staticTournament = source === 'static' ? getStaticTournamentById(id) : null;

  const name = params.name
    ? decodeURIComponent(String(params.name))
    : (source === 'db' ? (dbTournament?.name ?? '') : (staticTournament?.name ?? ''));

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/screens/HomeScreen');
    }
  }, [currentUser, isLoading]);

  useEffect(() => {
    if (source !== 'db') return;
    Promise.all([DB.getTournamentById(id), DB.getAllMartialArts()]).then(([t2, arts]) => {
      setDbTournament(t2);
      if (t2) {
        setMartialArts(arts.filter(a => t2.martialArtIds.includes(a.id)));
      }
    });
  }, [id, source]);

  const s: any = {
    page:    { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    card:    { maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    logo:    { fontSize: 80, textAlign: 'center', display: 'block', marginBottom: 20 },
    name:    { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
    metaRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 15, color: '#444' },
    label:   { fontWeight: 700, color: '#6750a4', minWidth: 80 },
    desc:    { marginTop: 20, padding: 16, background: '#f3eeff', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.6 },
    chip:    { display: 'inline-block', background: '#f0ebff', color: '#6750a4', borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600, marginRight: 6 },
    syncBtn: { marginTop: 28, width: '100%', padding: 16, background: '#6750a4', border: 'none', borderRadius: 28, color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    backBtn: { marginTop: 12, width: '100%', padding: 12, background: 'transparent', border: '1px solid #6750a4', borderRadius: 28, color: '#6750a4', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  };

  if (isLoading || !currentUser) return null;

  const logo     = source === 'db' ? (dbTournament?.logo || '🏆') : (staticTournament?.logo ?? '🥋');
  const date     = source === 'db' ? (dbTournament?.date ?? '')    : (staticTournament?.date ?? '');
  const location = source === 'db' ? (dbTournament?.location ?? '') : (staticTournament?.location ?? '');
  const desc     = source === 'db' ? (dbTournament?.description ?? '') : '';
  const disciplines = source === 'db'
    ? martialArts.map(a => a.name)
    : (staticTournament?.disciplines ?? []);

  return (
    <div data-testid="tournament-detail-screen" style={s.page}>
      <div style={s.card}>
        <span style={s.logo}>{logo}</span>
        <div data-testid="detail-name" style={s.name}>{name}</div>

        <div style={s.metaRow}>
          <span style={s.label}>📅 {t('detail.date')}:</span>
          <span data-testid="detail-date">{date}</span>
        </div>
        <div style={s.metaRow}>
          <span style={s.label}>📍 {t('detail.location')}:</span>
          <span data-testid="detail-location">{location}</span>
        </div>

        {disciplines.length > 0 && (
          <div style={s.metaRow}>
            <span style={s.label}>🥋 Disciplinas:</span>
            <span data-testid="detail-disciplines">
              {disciplines.map(d => <span key={d} style={s.chip}>{d}</span>)}
            </span>
          </div>
        )}

        <div style={s.desc}>
          {desc || (<><strong>{t('detail.description')}:</strong> {t('detail.descriptionText')}</>)}
        </div>

        {athleteId && athleteName && (
          <div style={{ background: '#ede7f6', border: '1px solid #d6c8f5', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#6750a4', fontWeight: 600 }}>
            📋 Inscribiendo a: <strong>{athleteName}</strong>
          </div>
        )}

        <button
          data-testid="btn-syncup-tournament"
          style={s.syncBtn}
          type="button"
          onClick={() => {
            const qs = athleteId
              ? `&athleteId=${athleteId}&athleteName=${encodeURIComponent(athleteName ?? '')}`
              : '';
            const sourceParam = source === 'db' ? '&source=db' : '';
            router.push(`/screens/FormScreen?tournamentId=${id}&tournamentName=${encodeURIComponent(name)}${qs}${sourceParam}` as any);
          }}
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
