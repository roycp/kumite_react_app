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

export type UserRole = 'athlete' | 'manager' | 'admin';

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

export function hasPermission(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role as UserRole] ?? []).includes(permission);
}
