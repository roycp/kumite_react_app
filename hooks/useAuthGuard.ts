import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects unauthenticated users to HomeScreen.
 * Returns { currentUser, isLoading } for convenience.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !currentUser) router.replace('/screens/HomeScreen');
  }, [currentUser, isLoading]);

  return { currentUser, isLoading };
}
