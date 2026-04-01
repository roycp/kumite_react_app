import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as DB from '../../db/database';
import { getTournamentById } from '../../data/tournaments';
import Sidebar from '../../components/Sidebar';

export default function TournamentHistory() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  const [registrations, setRegistrations] = useState<DB.Registration[]>([]);
  const [loadingData,   setLoadingData]   = useState(true);

  useEffect(() => {
    if (!isLoading && !currentUser) router.replace('/screens/HomeScreen');
  }, [currentUser, isLoading]);

  useEffect(() => {
    if (!currentUser) return;
    DB.getRegistrationsByUserId(currentUser.id).then(data => {
      // History = all registrations (past + present), sorted newest first
      setRegistrations([...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      setLoadingData(false);
    });
  }, [currentUser]);

  if (isLoading || !currentUser) return null;

  const s: any = {
    page:       { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
    maxW:       { maxWidth: 820, margin: '0 auto' },
    pageTitle:  { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 },
    pageSub:    { fontSize: 14, color: '#888', marginBottom: 28 },
    // Empty
    empty:      { textAlign: 'center', padding: '60px 24px', color: '#888' },
    emptyIcon:  { fontSize: 60, display: 'block', marginBottom: 16 },
    emptyTxt:   { fontSize: 16, marginBottom: 8 },
    emptyBtn:   { marginTop: 20, padding: '10px 24px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    // Item card
    card:       { background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
    cardIcon:   { fontSize: 36, lineHeight: 1 },
    cardMeta:   { flex: 1 },
    cardName:   { fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 },
    cardDate:   { fontSize: 13, color: '#888' },
    // Tournament details row
    detailRow:  { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 13, color: '#555' },
    detailItem: { display: 'flex', gap: 4, alignItems: 'center' },
    // Modality chips
    modalGrid:  { display: 'flex', flexWrap: 'wrap', gap: 10 },
    modalCard:  { background: '#f3eeff', border: '1px solid #d6c8f5', borderRadius: 10, padding: '10px 14px', minWidth: 150 },
    modalName:  { fontSize: 13, fontWeight: 700, color: '#6750a4', marginBottom: 6 },
    modalRow:   { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', marginBottom: 3 },
    modalLabel: { fontWeight: 600, color: '#aaa', minWidth: 52 },
    // Status badge (future: could show 'completed', 'upcoming', etc.)
    statusBadge:{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  };

  const getStatusBadge = (tournamentId: string) => {
    const t = getTournamentById(tournamentId);
    if (!t) return null;
    const isPast = new Date(t.date) < new Date();
    return (
      <span style={{
        ...s.statusBadge,
        background: isPast ? '#fce8e6' : '#e8f5e9',
        color: isPast ? '#b3261e' : '#2e7d32',
      }}>
        {isPast ? '✓ Completado' : '⚡ Próximo'}
      </span>
    );
  };

  return (
    <Sidebar>
      <div data-testid="tournament-history-screen" style={s.page}>
        <div style={s.maxW}>
          <div style={s.pageTitle}>📜 Historial de Torneos</div>
          <div style={s.pageSub}>Todos tus torneos registrados</div>

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>Cargando…</div>
          ) : registrations.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>📜</span>
              <div style={s.emptyTxt}>No tienes torneos registrados aún</div>
              <button style={s.emptyBtn} onClick={() => router.push('/screens/TournamentSearch' as any)}>
                Buscar Torneos →
              </button>
            </div>
          ) : (
            <div data-testid="history-list">
              {registrations.map((reg, i) => {
                const t = getTournamentById(reg.tournamentId);
                return (
                  <div key={reg.id ?? i} style={s.card} data-testid={`history-item-${i}`}>
                    <div style={s.cardHeader}>
                      <span style={s.cardIcon}>{t?.logo ?? '🥋'}</span>
                      <div style={s.cardMeta}>
                        <div style={s.cardName}>{reg.tournamentName}</div>
                        <div style={s.cardDate}>
                          Inscrito: {new Date(reg.timestamp).toLocaleDateString('es-CR')}
                          {t && ` · Fecha del torneo: ${t.date}`}
                        </div>
                      </div>
                      {getStatusBadge(reg.tournamentId)}
                    </div>

                    {t && (
                      <div style={s.detailRow}>
                        <span style={s.detailItem}>📍 {t.location}</span>
                        <span style={s.detailItem}>🥋 {t.martialArt}</span>
                        {t.disciplines.length > 0 && (
                          <span style={s.detailItem}>⚔️ {t.disciplines.join(', ')}</span>
                        )}
                      </div>
                    )}

                    {reg.modalities && reg.modalities.length > 0 && (
                      <div style={s.modalGrid}>
                        {reg.modalities.map((m, j) => (
                          <div key={j} style={s.modalCard}>
                            <div style={s.modalName}>{m.discipline}</div>
                            {m.weightDivision && (
                              <div style={s.modalRow}>
                                <span style={s.modalLabel}>Peso</span>
                                <span>{m.weightDivision}</span>
                              </div>
                            )}
                            <div style={s.modalRow}>
                              <span style={s.modalLabel}>Género</span>
                              <span>{m.gender}</span>
                            </div>
                            <div style={s.modalRow}>
                              <span style={s.modalLabel}>Cat.</span>
                              <span>{m.ageGroup}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
