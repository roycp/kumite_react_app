import { useAuth } from '../context/AuthContext';
import { hasPermission, Permission } from '../constants/permissions';

/**
 * Returns true if the current user has the given permission.
 * Always returns false when no user is logged in.
 */
export function usePermission(permission: Permission): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  return hasPermission(currentUser.role, permission);
}
