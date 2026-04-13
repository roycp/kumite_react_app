/**
 * app/screens/UsersScreen.tsx
 *
 * Admin-only screen for viewing and editing application users.
 * Displays name, email, and role. Role can be changed inline.
 * Permissions are derived from role — this screen does NOT edit permissions directly.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';

const ROLE_LABELS: Record<string, string> = {
  athlete:   'Atleta',
  manager:   'Manager',
  admin:     'Administrador',
  organizer: 'Organizador',
};


const BUILT_IN_ROLES = [
  { name: 'athlete',   displayName: 'Atleta' },
  { name: 'manager',   displayName: 'Manager' },
  { name: 'organizer', displayName: 'Organizador' },
  { name: 'admin',     displayName: 'Administrador' },
];

export default function UsersScreen() {
  const T = useKumiteTheme();

  const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    athlete:   { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
    manager:   { bg: '#fff3e0', text: '#e65100', border: '#ffcc02' },
    admin:     { bg: T.colors.primaryLight, text: T.colors.primary, border: '#c4b5fd' },
    organizer: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  };

  const s = {
    page:      { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:      { maxWidth: 860, margin: '0 auto' },
    pageTitle: { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
    pageSub:   { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    tableCard: { background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card, overflow: 'hidden' as const, marginBottom: 24 },
    tableHead: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 120px', gap: 0, background: T.colors.borderLight, padding: '10px 20px', borderBottom: `1px solid ${T.colors.border}` } as any,
    thCell:    { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub, textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
    row:       { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 120px', gap: 0, padding: '14px 20px', borderBottom: `1px solid ${T.colors.borderLight}`, alignItems: 'center' } as any,
    rowLast:   { borderBottom: 'none' },
    cell:      { fontSize: T.font.size.base, color: T.colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    nameCell:  { fontSize: T.font.size.base, fontWeight: T.font.weight.semibold, color: T.colors.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    emailCell: { fontSize: T.font.size.sm, color: T.colors.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  
    roleBadge: (role: string) => ({
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: T.radius.pill,
      fontSize: T.font.size.sm,
      fontWeight: T.font.weight.semibold,
      background: ROLE_COLORS[role]?.bg ?? T.colors.borderLight,
      color:      ROLE_COLORS[role]?.text ?? T.colors.textSub,
      border:     `1px solid ${ROLE_COLORS[role]?.border ?? T.colors.border}`,
    }),
  
    select:    { padding: '5px 8px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, fontSize: T.font.size.sm, fontFamily: 'inherit', outline: 'none', background: T.colors.card, width: '100%', boxSizing: 'border-box' as const },
    editBtn:   { padding: '4px 12px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    saveBtn:   { padding: '4px 12px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: T.colors.card, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit', marginRight: 4 },
    cancelBtn: { padding: '4px 10px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
  
    listTitle: { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 12 },
    empty:     { textAlign: 'center' as const, padding: '48px 24px', color: T.colors.muted, background: T.colors.card, borderRadius: T.radius.lg, boxShadow: T.shadow.card },
    emptyIcon: { fontSize: 52, display: 'block', marginBottom: 14 },
    emptyTxt:  { fontSize: T.font.size.xl },
    loading:   { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
  } as const;


  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_users');

  const [users, setUsers]               = useState<DB.User[]>([]);
  const [customRoles, setCustomRoles]   = useState<DB.RoleDefinition[]>([]);
  const [loadingData, setLoading]       = useState(true);
  const [editId, setEditId]             = useState<string | null>(null);
  const [editRole, setEditRole]         = useState<string>('athlete');

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    const [data, defs] = await Promise.all([DB.getAllUsers(), DB.getAllRoleDefinitions()]);
    setUsers(data);
    setCustomRoles(defs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (u: DB.User) => {
    setEditId(u.id);
    setEditRole(u.role);
  };

  const handleSave = async () => {
    if (!editId) return;
    await DB.updateUser(editId, { role: editRole });
    setEditId(null);
    load();
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="users-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div style={s.page} data-testid="users-screen">
        <div style={s.maxW}>
          <div style={s.pageTitle}>Usuarios</div>
          <div style={s.pageSub}>Gestiona los roles de los usuarios registrados en la plataforma.</div>

          <div style={s.listTitle}>
            {users.length > 0 ? `${users.length} usuario${users.length !== 1 ? 's' : ''}` : ''}
          </div>

          {users.length === 0 ? (
            <div style={s.empty} data-testid="empty-state">
              <span style={s.emptyIcon}>👥</span>
              <div style={s.emptyTxt}>No hay usuarios registrados aún.</div>
            </div>
          ) : (
            <div style={s.tableCard} data-testid="users-list">
              {/* Header */}
              <div style={s.tableHead}>
                <div style={s.thCell}>Nombre</div>
                <div style={s.thCell}>Email</div>
                <div style={s.thCell}>Rol</div>
                <div style={s.thCell}>Acciones</div>
              </div>

              {/* Rows */}
              {users.map((u, idx) => (
                <div
                  key={u.id}
                  style={{ ...s.row, ...(idx === users.length - 1 ? s.rowLast : {}) }}
                  data-testid={`user-row-${u.id}`}
                >
                  {/* Name */}
                  <div style={s.nameCell} data-testid={`user-name-${u.id}`}>{u.fullName}</div>

                  {/* Email */}
                  <div style={s.emailCell} data-testid={`user-email-${u.id}`}>{u.email}</div>

                  {/* Role — badge or select */}
                  <div>
                    {editId === u.id ? (
                      <select
                        style={s.select}
                        value={editRole}
                        onChange={e => setEditRole((e.target as HTMLSelectElement).value)}
                        data-testid="input-edit-role"
                      >
                        {BUILT_IN_ROLES.map(r => (
                          <option key={r.name} value={r.name}>{r.displayName}</option>
                        ))}
                        {customRoles.map(r => (
                          <option key={r.id} value={r.name} data-testid={`role-option-${r.name}`}>{r.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={s.roleBadge(u.role)} data-testid={`user-role-${u.id}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {editId === u.id ? (
                      <>
                        <button style={s.saveBtn} onClick={handleSave} data-testid="btn-save-role">Guardar</button>
                        <button style={s.cancelBtn} onClick={() => setEditId(null)} data-testid="btn-cancel-edit">Cancelar</button>
                      </>
                    ) : (
                      <button style={s.editBtn} onClick={() => startEdit(u)} data-testid={`btn-edit-${u.id}`}>Editar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
