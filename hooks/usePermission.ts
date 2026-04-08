import { useAuth } from '../context/AuthContext';
import { hasPermission, Permission } from '../constants/permissions';

/**
 * Returns true if the current user has the given permission.
 * Consults dynamic role definitions loaded from the DB first,
 * then falls back to the static built-in role map.
 * Always returns false when no user is logged in.
 */
export function usePermission(permission: Permission): boolean {
  const { currentUser, roleDefinitions } = useAuth();
  if (!currentUser) return false;
  return hasPermission(currentUser.role, permission, roleDefinitions);
}
