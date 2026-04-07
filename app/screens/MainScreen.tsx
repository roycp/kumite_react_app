import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as DB from '../../db/database';
import { getTournamentById } from '../../data/tournaments';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';

export default function MainScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuthGuard();

  const [activeRegs, setActiveRegs] = useState<DB.Registration[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    DB.getRegistrationsByUserId(currentUser.id).then(data => {
      // "Active" = tournaments whose date is today or in the future
      const active = data.filter(r => {
        const t2 = getTournamentById(r.tournamentId);
        if (!t2) return true; // unknown tournament — keep it active
        return new Date(t2.date) >= new Date(new Date().toDateString());
      });
      setActiveRegs(active.sort((a, b) => {
        const ta = getTournamentById(a.tournamentId)?.date ?? '';
        const tb = getTournamentById(b.tournamentId)?.date ?? '';
        return ta.localeCompare(tb);
      }));
    });
  }, [currentUser]);

  if (isLoading || !currentUser) return null;

  const s: any = {
    page:        { minHeight: '100%', background: '#f0f2f5', padding: '28px 24px', fontFamily: 'Roboto, sans-serif', boxSizing: 'border-box' as const },
    maxW:        { maxWidth: 900, margin: '0 auto' },

    // Welcome banner
    banner:      { background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', borderRadius: 18, padding: '28px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20 },
    bannerAvatar:{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(103,80,164,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 },
    bannerText:  {},
    bannerHi:    { fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 3 },
    bannerSub:   { fontSize: 14, color: '#a0b4c8' },

    // Quick-action tiles
    sectionTitle:{ fontSize: 14, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' as const },
    quickGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 32 },
    quickTile:   { background: '#fff', borderRadius: 14, padding: '20px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #efefef', transition: 'all 0.18s' },
    tileIcon:    { fontSize: 28, lineHeight: 1 },
    tileText:    {},
    tileTitle:   { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 1 },
    tileSub:     { fontSize: 12, color: '#aaa' },

    // Active tournaments section
    activeSection: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 24 },
    activeSectionTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
    activeCount: { background: '#6750a4', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
    activeEmpty: { fontSize: 14, color: '#aaa', textAlign: 'center' as const, padding: '16px 0' },
    activeCard:  { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' },
    activeIcon:  { fontSize: 28, lineHeight: 1 },
    activeMeta:  { flex: 1 },
    activeName:  { fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
    activeDate:  { fontSize: 12, color: '#888' },
    activeArrow: { fontSize: 18, color: '#6750a4' },
    activeModals:{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 4 },
    activeBadge: { background: '#ede7f6', color: '#6750a4', borderRadius: 6, padding: '1px 7px', fontSize: 11, fontWeight: 600 },
    viewAllBtn:  { marginTop: 14, width: '100%', padding: '10px 0', background: 'transparent', border: '1px solid #e0e0e0', borderRadius: 20, color: '#6750a4', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  };

  const isManager = currentUser.role === 'manager';

  const ATHLETE_TILES = [
    { icon: '🔍', title: 'Buscar Torneos',  sub: 'Encuentra competencias',    route: '/screens/TournamentSearch',     testId: 'nav-search' },
    { icon: '📜', title: 'Mi Historial',    sub: 'Torneos registrados',       route: '/screens/TournamentHistory',    testId: 'nav-history' },
    { icon: '👤', title: 'Mi Perfil',       sub: 'Ver y editar tu info',      route: '/screens/ProfileScreen',        testId: 'nav-profile' },
    { icon: '⚡', title: 'Torneos Activos', sub: 'Gestiona inscripciones',    route: '/screens/TournamentManagement', testId: 'nav-management' },
  ];

  const MANAGER_TILES = [
    { icon: '🔍', title: 'Buscar Torneos', sub: 'Encuentra competencias',    route: '/screens/TournamentSearch', testId: 'nav-search' },
    { icon: '👥', title: 'Mi Equipo',      sub: 'Gestiona tus atletas',      route: '/screens/TeamManagement',   testId: 'nav-team' },
    { icon: '👤', title: 'Mi Perfil',      sub: 'Ver y editar tu info',      route: '/screens/ProfileScreen',    testId: 'nav-profile' },
  ];

  const QUICK_TILES = isManager ? MANAGER_TILES : ATHLETE_TILES;

  return (
    <Sidebar>
      <style>{`
        @media (max-width: 600px) {
          .kb-main-page   { padding: 16px 12px !important; }
          .kb-quick-grid  { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
      `}</style>
      <div data-testid="main-screen" className="kb-main-page" style={s.page}>
        <div style={s.maxW}>

          {/* Welcome banner */}
          <div style={s.banner}>
            <div style={s.bannerAvatar}>{isManager ? '📋' : '🥋'}</div>
            <div style={s.bannerText}>
              <div style={s.bannerHi}>Bienvenido, {currentUser.fullName} 👋</div>
              <div style={s.bannerSub}>{currentUser.email} · {isManager ? 'Manager' : 'Atleta'}</div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={s.sectionTitle}>Accesos Rápidos</div>
          <div className="kb-quick-grid" style={s.quickGrid}>
            {QUICK_TILES.map(tile => (
              <div
                key={tile.route}
                data-testid={tile.testId}
                style={s.quickTile}
                onClick={() => router.push(tile.route as any)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(103,80,164,0.2)';
                  (e.currentTarget as HTMLElement).style.borderColor = '#6750a4';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
                  (e.currentTarget as HTMLElement).style.borderColor = '#efefef';
                }}
              >
                <span style={s.tileIcon}>{tile.icon}</span>
                <div style={s.tileText}>
                  <div style={s.tileTitle}>{tile.title}</div>
                  <div style={s.tileSub}>{tile.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Athlete: active tournaments summary */}
          {!isManager && (
            <div style={s.activeSection}>
              <div style={s.activeSectionTitle}>
                ⚡ Torneos Activos
                {activeRegs.length > 0 && (
                  <span style={s.activeCount}>{activeRegs.length}</span>
                )}
              </div>

              {activeRegs.length === 0 ? (
                <div style={s.activeEmpty}>No tienes torneos activos. ¡Inscríbete en uno!</div>
              ) : (
                <>
                  {activeRegs.map((reg, i) => {
                    const t2 = getTournamentById(reg.tournamentId);
                    return (
                      <div
                        key={reg.id ?? i}
                        style={{ ...s.activeCard, borderBottom: i < activeRegs.length - 1 ? '1px solid #f5f5f5' : 'none' }}
                        onClick={() => router.push('/screens/TournamentManagement' as any)}
                      >
                        <span style={s.activeIcon}>{t2?.logo ?? '🥋'}</span>
                        <div style={s.activeMeta}>
                          <div style={s.activeName}>{reg.tournamentName}</div>
                          <div style={s.activeDate}>{t2?.date ?? ''} · {t2?.location ?? ''}</div>
                          {reg.modalities && reg.modalities.length > 0 && (
                            <div style={s.activeModals}>
                              {reg.modalities.map((m, j) => (
                                <span key={j} style={s.activeBadge}>{m.discipline}{m.weightDivision ? ` · ${m.weightDivision}` : ''}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span style={s.activeArrow}>›</span>
                      </div>
                    );
                  })}
                  <button
                    style={s.viewAllBtn}
                    onClick={() => router.push('/screens/TournamentManagement' as any)}
                  >
                    Ver todos los activos →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Manager: call-to-action banner */}
          {isManager && (
            <div style={{ ...s.activeSection, textAlign: 'center' as const, padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <div style={s.activeSectionTitle}>Gestiona tu equipo</div>
              <div style={s.activeEmpty}>Registra atletas en torneos y realiza un seguimiento de sus inscripciones.</div>
              <button
                data-testid="btn-go-team"
                style={{ marginTop: 16, padding: '10px 24px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => router.push('/screens/TeamManagement' as any)}
              >
                Ver mi equipo →
              </button>
            </div>
          )}

        </div>
      </div>
    </Sidebar>
  );
}
