import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TOURNAMENTS } from '../../data/tournaments';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';

export default function TournamentSearch() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuthGuard();
  const params = useLocalSearchParams<{ athleteId?: string; athleteName?: string }>();

  // When a manager navigates here from TeamManagement, these are set
  const athleteId   = params.athleteId   ? String(params.athleteId)   : undefined;
  const athleteName = params.athleteName ? decodeURIComponent(String(params.athleteName)) : undefined;

  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [query,         setQuery]         = useState('');

  useEffect(() => {
    if (!currentUser) return;
    DB.getRegisteredTournamentIds(currentUser.id).then(setRegisteredIds);
  }, [currentUser]);

  const filtered = TOURNAMENTS.filter(t2 =>
    !query.trim() || t2.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const goToDetail = (id: string, name: string) => {
    const qs = athleteId
      ? `&athleteId=${athleteId}&athleteName=${encodeURIComponent(athleteName ?? '')}`
      : '';
    router.push(`/screens/TournamentDetail?id=${id}&name=${encodeURIComponent(name)}${qs}` as any);
  };

  if (isLoading || !currentUser) return null;

  const s: any = {
    page:       { minHeight: '100%', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 900, margin: '0 auto' },
    pageTitle:  { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 },
    pageSub:    { fontSize: 14, color: '#888', marginBottom: 20 },
    // Search bar
    searchWrap: { position: 'relative' as const, marginBottom: 24 },
    searchIcon: { position: 'absolute' as const, left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' as const },
    searchInput:{ width: '100%', height: 48, border: '1px solid #ddd', borderRadius: 24, paddingLeft: 44, paddingRight: 16, fontSize: 15, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' as const, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    // No results
    noResults:  { textAlign: 'center' as const, padding: '48px 0', color: '#aaa' },
    // Grid
    grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
    tile:       (disabled: boolean) => ({
      background: disabled ? '#fafafa' : '#fff',
      borderRadius: 14, padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      cursor: disabled ? 'default' : 'pointer',
      border: `1px solid ${disabled ? '#c8e6c9' : '#efefef'}`,
      transition: 'all 0.2s',
    }),
    logo:       { fontSize: 48, marginBottom: 12, display: 'block' },
    name:       { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
    meta:       { fontSize: 13, color: '#666', marginBottom: 4 },
    badge:      { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, marginTop: 10 },
    btn:        { marginTop: 12, padding: '8px 18px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    discipline: { display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 8 },
    disciplineTag: { background: '#f0ebff', color: '#6750a4', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  };

  return (
    <Sidebar>
      <style>{`
        @media (max-width: 600px) {
          .kb-search-page { padding: 16px 12px !important; }
          .kb-search-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div data-testid="tournament-search-screen" className="kb-search-page" style={s.page}>
        <div style={s.maxW}>
          <div style={s.pageTitle}>{t('search.title')}</div>
          <div style={s.pageSub}>{t('search.subtitle')}</div>

          {/* Manager context: show who is being enrolled */}
          {athleteId && athleteName && (
            <div style={{ background: '#ede7f6', border: '1px solid #d6c8f5', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 14, color: '#6750a4', fontWeight: 600 }}>
              📋 Inscribiendo a: <strong>{athleteName}</strong>
            </div>
          )}

          {/* Search bar */}
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input
              data-testid="search-input"
              style={s.searchInput}
              placeholder="Buscar torneo por nombre…"
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={s.noResults}>
              No se encontraron torneos para "<strong>{query}</strong>"
            </div>
          ) : (
            <div className="kb-search-grid" style={s.grid}>
              {filtered.map(t2 => {
                const enrolled = registeredIds.includes(t2.id);
                return (
                  <div
                    key={t2.id}
                    data-testid={`tournament-tile-${t2.id}`}
                    style={s.tile(enrolled)}
                    onClick={() => { if (!enrolled) goToDetail(t2.id, t2.name); }}
                    onMouseEnter={e => {
                      if (enrolled) return;
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(103,80,164,0.2)';
                      (e.currentTarget as HTMLElement).style.borderColor = '#6750a4';
                    }}
                    onMouseLeave={e => {
                      if (enrolled) return;
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = '#efefef';
                    }}
                  >
                    <span style={s.logo}>{t2.logo}</span>
                    <div style={s.name}>{t2.name}</div>
                    <div style={s.meta}>📅 {t('search.date')}: {t2.date}</div>
                    <div style={s.meta}>📍 {t('search.location')}: {t2.location}</div>

                    {t2.disciplines.length > 0 && (
                      <div style={s.discipline}>
                        {t2.disciplines.map(d => <span key={d} style={s.disciplineTag}>{d}</span>)}
                      </div>
                    )}

                    {enrolled ? (
                      <div data-testid={`enrolled-badge-${t2.id}`} style={s.badge}>
                        ✓ Ya estás inscrito
                      </div>
                    ) : (
                      <button
                        style={s.btn}
                        type="button"
                        onClick={e => { e.stopPropagation(); goToDetail(t2.id, t2.name); }}
                      >
                        {t('search.viewDetails')} →
                      </button>
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
