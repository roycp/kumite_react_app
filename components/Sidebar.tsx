/**
 * components/Sidebar.tsx
 *
 * Collapsible left sidebar used by all authenticated screens.
 * On desktop it's always visible (240px). On mobile it overlays as a drawer.
 */

import React, { useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  testId: string;
}

const ATHLETE_NAV: NavItem[] = [
  { icon: '🏠', label: 'Inicio',            route: '/screens/MainScreen',              testId: 'sidebar-home' },
  { icon: '👤', label: 'Mi Perfil',         route: '/screens/ProfileScreen',           testId: 'sidebar-profile' },
  { icon: '🏆', label: 'Buscar Torneos',    route: '/screens/TournamentSearch',        testId: 'sidebar-search' },
  { icon: '⚡', label: 'Torneos Activos',   route: '/screens/TournamentManagement',    testId: 'sidebar-active' },
  { icon: '📜', label: 'Historial',         route: '/screens/TournamentHistory',       testId: 'sidebar-history' },
];

const MANAGER_NAV: NavItem[] = [
  { icon: '🏠', label: 'Inicio',            route: '/screens/MainScreen',              testId: 'sidebar-home' },
  { icon: '👤', label: 'Mi Perfil',         route: '/screens/ProfileScreen',           testId: 'sidebar-profile' },
  { icon: '🏆', label: 'Buscar Torneos',    route: '/screens/TournamentSearch',        testId: 'sidebar-search' },
  { icon: '👥', label: 'Mi Equipo',         route: '/screens/TeamManagement',          testId: 'sidebar-team' },
];

const ADMIN_NAV: NavItem[] = [
  { icon: '🏠', label: 'Inicio',            route: '/screens/MainScreen',              testId: 'sidebar-home' },
  { icon: '👤', label: 'Mi Perfil',         route: '/screens/ProfileScreen',           testId: 'sidebar-profile' },
  { icon: '🥋', label: 'Artes Marciales',   route: '/screens/MartialArtsScreen',       testId: 'sidebar-martial-arts' },
  { icon: '🏛️', label: 'Organizaciones',    route: '/screens/OrganizationsScreen',     testId: 'sidebar-organizations' },
  { icon: '🏆', label: 'Torneos',           route: '/screens/AdminTournamentsScreen',  testId: 'sidebar-admin-tournaments' },
  { icon: '📋', label: 'Plantillas',        route: '/screens/TournamentTemplatesScreen', testId: 'sidebar-templates' },
  { icon: '👥', label: 'Usuarios',          route: '/screens/UsersScreen',             testId: 'sidebar-users' },
];

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  const [open, setOpen] = useState(false);

  const navItems =
    currentUser?.role === 'admin'   ? ADMIN_NAV :
    currentUser?.role === 'manager' ? MANAGER_NAV :
    ATHLETE_NAV;

  const handleLogout = async () => {
    await logout();
    router.replace('/screens/HomeScreen');
  };

  const navigate = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  const isActive = (route: string) => pathname === route || pathname.startsWith(route + '?');

  const s: any = {
    // Layout wrapper
    shell:      { display: 'flex', minHeight: '100vh', fontFamily: 'Roboto, sans-serif', position: 'relative' as const, overflowX: 'hidden' as const },

    // ── Sidebar ──
    sidebar:    (visible: boolean) => ({
      width: 240, background: '#1a1a2e', display: 'flex', flexDirection: 'column',
      position: 'fixed' as const, top: 0, left: visible ? 0 : -240, bottom: 0, zIndex: 200,
      transition: 'left 0.25s ease', boxShadow: visible ? '4px 0 20px rgba(0,0,0,0.4)' : 'none',
    }),
    // Always-visible desktop strip
    desktopSidebar: {
      width: 240, background: '#1a1a2e', display: 'flex', flexDirection: 'column',
      position: 'fixed' as const, top: 0, left: 0, bottom: 0, zIndex: 100,
    },

    // Sidebar header (user badge)
    sbHeader:   { padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    sbAvatar:   { width: 44, height: 44, borderRadius: '50%', background: '#6750a4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10 },
    sbName:     { fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    sbEmail:    { fontSize: 11, color: '#a0b4c8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },

    // Nav items
    nav:        { flex: 1, padding: '12px 0', overflowY: 'auto' as const },
    navItem:    (active: boolean) => ({
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
      cursor: 'pointer', borderRadius: 0, transition: 'background 0.15s',
      background: active ? 'rgba(103,80,164,0.35)' : 'transparent',
      borderLeft: active ? '3px solid #6750a4' : '3px solid transparent',
    }),
    navIcon:    { fontSize: 20, width: 24, textAlign: 'center' as const },
    navLabel:   (active: boolean) => ({ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? '#c4b5fd' : '#a0b4c8' }),

    // Logout at bottom
    sbFooter:   { padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' },
    logoutItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', transition: 'background 0.15s' },
    logoutLabel:{ fontSize: 14, color: '#f87171' },

    // ── Top bar (mobile) ──
    topBar:     { display: 'none', position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 150, height: 56, background: '#1a1a2e', alignItems: 'center', padding: '0 16px', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
    burger:     { fontSize: 22, cursor: 'pointer', color: '#fff', background: 'none', border: 'none', padding: 4 },
    topTitle:   { fontSize: 18, fontWeight: 700, color: '#fff' },

    // ── Overlay (mobile drawer backdrop) ──
    overlay:    (visible: boolean) => ({
      display: visible ? 'block' : 'none',
      position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 190,
    }),

    // ── Content area ──
    content:    { marginLeft: 240, flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' as const },
  };

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ 768px) ─────────────────────── */}
      <style>{`
        @media (max-width: 767px) {
          .kb-desktop-sidebar { display: none !important; }
          .kb-top-bar         { display: flex !important; }
          .kb-content         { margin-left: 0 !important; padding-top: 56px; height: 100vh; overflow-y: auto; }
        }
        .kb-shell { overflow-x: hidden; max-width: 100vw; }
      `}</style>

      <div className="kb-shell" style={s.shell}>
        {/* Desktop sidebar */}
        <div className="kb-desktop-sidebar" style={s.desktopSidebar}>
          <SidebarContent
            currentUser={currentUser}
            navItems={navItems}
            isActive={isActive}
            navigate={navigate}
            handleLogout={handleLogout}
            s={s}
          />
        </div>

        {/* Mobile: top bar */}
        <div className="kb-top-bar" style={s.topBar}>
          <button style={s.burger} onClick={() => setOpen(o => !o)}>☰</button>
          <span style={s.topTitle}>KumiteApp</span>
        </div>

        {/* Mobile: drawer + backdrop */}
        <div style={s.overlay(open)} onClick={() => setOpen(false)} />
        <div style={s.sidebar(open)}>
          <SidebarContent
            currentUser={currentUser}
            navItems={navItems}
            isActive={isActive}
            navigate={navigate}
            handleLogout={handleLogout}
            s={s}
          />
        </div>

        {/* Page content */}
        <div className="kb-content" style={s.content} data-testid="sidebar-content">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Internal: sidebar contents ────────────────────────────────────────────────

function SidebarContent({ currentUser, navItems, isActive, navigate, handleLogout, s }: {
  currentUser: any;
  navItems: NavItem[];
  isActive: (r: string) => boolean;
  navigate: (r: string) => void;
  handleLogout: () => void;
  s: any;
}) {
  return (
    <>
      {/* User badge */}
      <div style={s.sbHeader}>
        <div style={s.sbAvatar}>
          {currentUser?.role === 'admin' ? '🛡️' : currentUser?.role === 'manager' ? '📋' : '🥋'}
        </div>
        <div style={s.sbName}>{currentUser?.fullName ?? 'Usuario'}</div>
        <div style={s.sbEmail}>
          {currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'manager' ? 'Manager' : 'Atleta'}
        </div>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {navItems.map(item => (
          <div
            key={item.route}
            data-testid={item.testId}
            style={s.navItem(isActive(item.route))}
            onClick={() => navigate(item.route)}
            onMouseEnter={e => { if (!isActive(item.route)) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!isActive(item.route)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span style={s.navLabel(isActive(item.route))}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={s.sbFooter}>
        <div
          style={s.logoutItem}
          onClick={handleLogout}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <span style={s.navIcon}>🚪</span>
          <span style={s.logoutLabel}>Cerrar Sesión</span>
        </div>
      </div>
    </>
  );
}
