/**
 * app/screens/RoleAdminScreen.tsx
 *
 * Admin-only screen for managing custom role definitions.
 * Allows creating, editing, and deleting roles with granular permission assignments.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as DB from '../../db/database';
import Sidebar from '../../components/Sidebar';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { usePermission } from '../../hooks/usePermission';
import { useKumiteTheme } from '../../context/ThemeContext';
import { ALL_PERMISSIONS, Permission } from '../../constants/permissions';

const PERMISSION_LABELS: Record<Permission, string> = {
  search_tournament:    'Buscar torneos',
  register_tournament:  'Inscribirse en torneo',
  view_own_history:     'Ver historial propio',
  edit_own_registration:'Editar inscripción propia',
  edit_own_profile:     'Editar perfil propio',
  register_team_member: 'Inscribir miembro de equipo',
  view_team_history:    'Ver historial de equipo',
  edit_team_registration:'Editar inscripción de equipo',
  edit_team_profile:    'Editar perfil de equipo',
  manage_martial_arts:  'Gestionar artes marciales',
  manage_organizations: 'Gestionar organizaciones',
  manage_rank_systems:  'Gestionar sistemas de grado',
  manage_tournaments:   'Gestionar torneos',
  manage_users:         'Gestionar usuarios',
};

const EMPTY_FORM = { name: '', displayName: '', permissions: [] as string[] };

export default function RoleAdminScreen() {
  const T = useKumiteTheme();
  const s = {
    page:       { minHeight: '100%', background: T.colors.background, padding: '32px 24px', fontFamily: T.font.family, boxSizing: 'border-box' as const },
    maxW:       { maxWidth: 860, margin: '0 auto' },
    pageTitle:  { fontSize: T.font.size['4xl'], fontWeight: T.font.weight.extrabold, color: T.colors.dark, marginBottom: 6 },
    pageSub:    { fontSize: T.font.size.base, color: T.colors.muted, marginBottom: 28 },
  
    card:       { background: T.colors.card, borderRadius: T.radius.lg, padding: '24px', marginBottom: 24, boxShadow: T.shadow.card },
    cardTitle:  { fontSize: T.font.size.xl, fontWeight: T.font.weight.bold, color: T.colors.dark, marginBottom: 16 },
  
    label:      { fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, color: T.colors.textSub, marginBottom: 6, display: 'block' as const },
    input:      { width: '100%', padding: '9px 12px', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md, fontSize: T.font.size.base, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 14 },
    permGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 16 },
    permItem:   { display: 'flex', gap: 8, alignItems: 'center', fontSize: T.font.size.sm, color: T.colors.text },
    checkbox:   { width: 16, height: 16, cursor: 'pointer' },
  
    btnRow:     { display: 'flex', gap: 8 },
    addBtn:     { padding: '8px 20px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: '#fff', fontSize: T.font.size.sm, fontWeight: T.font.weight.bold, cursor: 'pointer', fontFamily: 'inherit' },
    saveBtn:    { padding: '8px 20px', background: T.colors.primary, border: 'none', borderRadius: T.radius.xl, color: '#fff', fontSize: T.font.size.sm, fontWeight: T.font.weight.bold, cursor: 'pointer', fontFamily: 'inherit' },
    cancelBtn:  { padding: '8px 16px', background: 'transparent', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.xl, color: T.colors.textLight, fontSize: T.font.size.sm, cursor: 'pointer', fontFamily: 'inherit' },
    editBtn:    { padding: '5px 14px', background: T.colors.primaryLight, border: `1px solid ${T.colors.primary}`, borderRadius: T.radius.xl, color: T.colors.primary, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
    delBtn:     { padding: '5px 14px', background: T.colors.errorLight, border: `1px solid ${T.colors.error}`, borderRadius: T.radius.xl, color: T.colors.error, fontSize: T.font.size.sm, fontWeight: T.font.weight.semibold, cursor: 'pointer', fontFamily: 'inherit' },
  
    roleRow:    { padding: '14px 0', borderBottom: `1px solid ${T.colors.borderLight}`, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' as const } as any,
    roleName:   { fontSize: T.font.size.base, fontWeight: T.font.weight.bold, color: T.colors.dark, minWidth: 160 },
    roleDisplay:{ fontSize: T.font.size.sm, color: T.colors.muted, marginTop: 2 },
    permTags:   { display: 'flex', flexWrap: 'wrap' as const, gap: 6, flex: 1 },
    permTag:    { padding: '2px 8px', background: T.colors.primaryLight, borderRadius: T.radius.pill, fontSize: T.font.size.xs, color: T.colors.primary, fontWeight: T.font.weight.semibold },
    roleActions:{ display: 'flex', gap: 6, alignItems: 'center' },
  
    empty:      { textAlign: 'center' as const, padding: '32px 24px', color: T.colors.muted },
    loading:    { textAlign: 'center' as const, padding: 32, color: T.colors.mutedLight },
    error:      { color: T.colors.error, fontSize: T.font.size.sm, marginBottom: 12 },
  } as const;


  const router = useRouter();
  const { currentUser, isLoading } = useAuthGuard();
  const canManage = usePermission('manage_users');

  const [roles,       setRoles]       = useState<DB.RoleDefinition[]>([]);
  const [loadingData, setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [addForm,     setAddForm]     = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState(EMPTY_FORM);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!isLoading && currentUser && !canManage) router.replace('/screens/MainScreen');
  }, [currentUser, isLoading, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    setRoles(await DB.getAllRoleDefinitions());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePerm = (perm: string, form: typeof EMPTY_FORM, setForm: (f: typeof EMPTY_FORM) => void) => {
    const has = form.permissions.includes(perm);
    setForm({ ...form, permissions: has ? form.permissions.filter(p => p !== perm) : [...form.permissions, perm] });
  };

  const handleAdd = async () => {
    setError('');
    if (!addForm.displayName.trim()) { setError('El nombre del rol es requerido.'); return; }
    if (!addForm.name.trim())        { setError('El identificador es requerido.'); return; }
    await DB.createRoleDefinition({ name: addForm.name.trim(), displayName: addForm.displayName.trim(), permissions: addForm.permissions });
    setAddForm(EMPTY_FORM);
    setShowAdd(false);
    load();
  };

  const startEdit = (role: DB.RoleDefinition) => {
    setEditId(role.id);
    setEditForm({ name: role.name, displayName: role.displayName, permissions: [...role.permissions] });
  };

  const handleSave = async () => {
    setError('');
    if (!editForm.displayName.trim()) { setError('El nombre del rol es requerido.'); return; }
    if (!editForm.name.trim())        { setError('El identificador es requerido.'); return; }
    await DB.updateRoleDefinition(editId!, { name: editForm.name.trim(), displayName: editForm.displayName.trim(), permissions: editForm.permissions });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await DB.deleteRoleDefinition(id);
    load();
  };

  if (isLoading || loadingData) {
    return (
      <Sidebar>
        <div style={s.page} data-testid="role-admin-screen">
          <div style={s.loading}>Cargando…</div>
        </div>
      </Sidebar>
    );
  }

  const renderPermCheckboxes = (form: typeof EMPTY_FORM, setForm: (f: typeof EMPTY_FORM) => void, prefix: string) => (
    <div style={s.permGrid}>
      {ALL_PERMISSIONS.map(perm => (
        <label key={perm} style={s.permItem}>
          <input
            type="checkbox"
            style={s.checkbox}
            checked={form.permissions.includes(perm)}
            onChange={() => togglePerm(perm, form, setForm)}
            data-testid={`${prefix}-perm-${perm}`}
          />
          {PERMISSION_LABELS[perm]}
        </label>
      ))}
    </div>
  );

  return (
    <Sidebar>
      <div style={s.page} data-testid="role-admin-screen">
        <div style={s.maxW}>
          <div style={s.pageTitle}>Gestión de Roles</div>
          <div style={s.pageSub}>Crea y administra roles personalizados con permisos específicos.</div>

          {/* Existing roles */}
          <div style={s.card}>
            <div style={s.cardTitle}>
              Roles definidos
              {roles.length > 0 && <span style={{ fontSize: T.font.size.sm, color: T.colors.muted, fontWeight: 400, marginLeft: 8 }}>({roles.length})</span>}
            </div>

            {roles.length === 0 ? (
              <div style={s.empty} data-testid="roles-empty">No hay roles personalizados aún.</div>
            ) : (
              <div data-testid="roles-list">
                {roles.map(role => (
                  <div key={role.id} style={s.roleRow} data-testid={`role-row-${role.id}`}>
                    {editId === role.id ? (
                      <div style={{ flex: 1 }}>
                        {error && <div style={s.error}>{error}</div>}
                        <label style={s.label}>Nombre visible</label>
                        <input
                          style={s.input}
                          value={editForm.displayName}
                          onChange={e => setEditForm({ ...editForm, displayName: (e.target as HTMLInputElement).value })}
                          data-testid="input-edit-display-name"
                        />
                        <label style={s.label}>Identificador (slug)</label>
                        <input
                          style={s.input}
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: (e.target as HTMLInputElement).value })}
                          data-testid="input-edit-name"
                        />
                        <label style={s.label}>Permisos</label>
                        {renderPermCheckboxes(editForm, setEditForm, 'edit')}
                        <div style={s.btnRow}>
                          <button style={s.saveBtn} onClick={handleSave} data-testid="btn-save-role">Guardar</button>
                          <button style={s.cancelBtn} onClick={() => setEditId(null)} data-testid="btn-cancel-edit">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <div style={s.roleName} data-testid={`role-display-name-${role.id}`}>{role.displayName}</div>
                          <div style={s.roleDisplay} data-testid={`role-name-${role.id}`}>{role.name}</div>
                          <div style={{ ...s.permTags, marginTop: 8 }}>
                            {role.permissions.length === 0
                              ? <span style={{ color: T.colors.mutedLight, fontSize: T.font.size.sm }}>Sin permisos</span>
                              : role.permissions.map(p => (
                                <span key={p} style={s.permTag} data-testid={`role-perm-tag-${role.id}-${p}`}>{p}</span>
                              ))
                            }
                          </div>
                        </div>
                        <div style={s.roleActions}>
                          <button style={s.editBtn} onClick={() => startEdit(role)} data-testid={`btn-edit-role-${role.id}`}>Editar</button>
                          <button style={s.delBtn}  onClick={() => handleDelete(role.id)} data-testid={`btn-delete-role-${role.id}`}>Eliminar</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new role */}
          {showAdd ? (
            <div style={s.card} data-testid="add-role-form">
              <div style={s.cardTitle}>Nuevo Rol</div>
              {error && <div style={s.error}>{error}</div>}
              <label style={s.label}>Nombre visible *</label>
              <input
                style={s.input}
                value={addForm.displayName}
                onChange={e => setAddForm({ ...addForm, displayName: (e.target as HTMLInputElement).value })}
                placeholder="Ej: Árbitro"
                data-testid="input-add-display-name"
              />
              <label style={s.label}>Identificador (slug) *</label>
              <input
                style={s.input}
                value={addForm.name}
                onChange={e => setAddForm({ ...addForm, name: (e.target as HTMLInputElement).value })}
                placeholder="Ej: referee"
                data-testid="input-add-name"
              />
              <label style={s.label}>Permisos</label>
              {renderPermCheckboxes(addForm, setAddForm, 'add')}
              <div style={s.btnRow}>
                <button style={s.addBtn} onClick={handleAdd} data-testid="btn-create-role">Crear Rol</button>
                <button style={s.cancelBtn} onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); setError(''); }} data-testid="btn-cancel-add">Cancelar</button>
              </div>
            </div>
          ) : (
            <button
              style={{ ...s.addBtn, display: 'block', marginBottom: 16 }}
              onClick={() => setShowAdd(true)}
              data-testid="btn-show-add-form"
            >
              + Nuevo Rol
            </button>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
