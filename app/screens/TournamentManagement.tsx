import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Registration {
  tournamentId: string;
  tournamentName: string;
  athleteName: string;
  timestamp: string;
}

export default function TournamentManagement() {
  const router = useRouter();
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('kumite_registrations').then(raw => {
      if (raw) {
        try { setRegistrations(JSON.parse(raw)); } catch { setRegistrations([]); }
      }
      setLoading(false);
    });
  }, []);

  const s: any = {
    page:    { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif' },
    header:  { maxWidth: 760, margin: '0 auto 20px', paddingTop: 8 },
    title:   { fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
    sub:     { color: '#666', fontSize: 14 },
    card:    { maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    empty:   { textAlign: 'center', padding: '48px 24px', color: '#666' },
    emptyIcon:{ fontSize: 56, display: 'block', marginBottom: 16 },
    emptyTxt:{ fontSize: 16, marginBottom: 8 },
    emptyHint:{ fontSize: 13, color: '#aaa' },
    item:    { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid #f0f0f0' },
    icon:    { fontSize: 32 },
    info:    { flex: 1 },
    tname:   { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
    ameta:   { fontSize: 13, color: '#666' },
    searchBtn:{ marginTop: 16, padding: '10px 24px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  };

  return (
    <div data-testid="tournament-management-screen" style={s.page}>
      <div style={s.header}>
        <div style={s.title}>{t('management.title')}</div>
        <div style={s.sub}>{t('management.subtitle')}</div>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>{t('app.loading')}</div>
        ) : registrations.length === 0 ? (
          <div data-testid="empty-state" style={s.empty}>
            <span style={s.emptyIcon}>📋</span>
            <div style={s.emptyTxt}>{t('management.empty')}</div>
            <div style={s.emptyHint}>{t('management.emptyHint')}</div>
            <button style={s.searchBtn} type="button" onClick={() => router.push('/screens/TournamentSearch' as any)}>
              {t('main.search')} →
            </button>
          </div>
        ) : (
          <div data-testid="registration-list">
            {registrations.map((reg, i) => (
              <div key={i} style={s.item}>
                <span style={s.icon}>🥋</span>
                <div style={s.info}>
                  <div style={s.tname}>{reg.tournamentName}</div>
                  <div style={s.ameta}>
                    {t('management.athlete')}: {reg.athleteName} · {t('management.registered')}: {new Date(reg.timestamp).toLocaleDateString('es-CR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
