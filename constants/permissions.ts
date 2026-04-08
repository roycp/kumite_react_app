// ── Permission definitions ────────────────────────────────────────────────────

export type Permission =
  // General (all roles)
  | 'search_tournament'
  // Athlete — own account
  | 'register_tournament'
  | 'view_own_history'
  | 'edit_own_registration'
  | 'edit_own_profile'
  // Manager — team
  | 'register_team_member'
  | 'view_team_history'
  | 'edit_team_registration'
  | 'edit_team_profile'
  // Admin — platform management
  | 'manage_martial_arts'
  | 'manage_organizations'
  | 'manage_rank_systems'
  | 'manage_tournaments'
  | 'manage_users';

export type UserRole = 'athlete' | 'manager' | 'admin' | 'organizer';

// ── Role → permissions map ────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  athlete: [
    'search_tournament',
    'register_tournament',
    'view_own_history',
    'edit_own_registration',
    'edit_own_profile',
  ],
  manager: [
    'search_tournament',
    'register_team_member',
    'view_team_history',
    'edit_team_registration',
    'edit_team_profile',
  ],
  organizer: [
    'search_tournament',
    'manage_tournaments',
    'edit_own_profile',
  ],
  admin: [
    'search_tournament',
    'register_tournament',
    'view_own_history',
    'edit_own_registration',
    'edit_own_profile',
    'register_team_member',
    'view_team_history',
    'edit_team_registration',
    'edit_team_profile',
    'manage_martial_arts',
    'manage_organizations',
    'manage_rank_systems',
    'manage_tournaments',
    'manage_users',
  ],
};

export const ALL_PERMISSIONS: Permission[] = [
  'search_tournament',
  'register_tournament',
  'view_own_history',
  'edit_own_registration',
  'edit_own_profile',
  'register_team_member',
  'view_team_history',
  'edit_team_registration',
  'edit_team_profile',
  'manage_martial_arts',
  'manage_organizations',
  'manage_rank_systems',
  'manage_tournaments',
  'manage_users',
];

export interface DynamicRoleDef {
  name: string;
  permissions: string[];
}

/**
 * Check if a role has a given permission.
 * When `roleDefs` is provided (loaded from the DB), it is consulted first.
 * Falls back to the static ROLE_PERMISSIONS map for built-in roles.
 */
export function hasPermission(
  role: string,
  permission: Permission,
  roleDefs?: DynamicRoleDef[],
): boolean {
  if (roleDefs && roleDefs.length > 0) {
    const def = roleDefs.find(d => d.name === role);
    if (def) return def.permissions.includes(permission);
  }
  return (ROLE_PERMISSIONS[role as UserRole] ?? []).includes(permission);
}
