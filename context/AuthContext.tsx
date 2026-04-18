import React, { createContext, useContext, useEffect, useState } from 'react';
import * as DB from '../db/database';
import { storeToken, loadToken, clearToken, apiPost, apiGet, ApiError } from '../services/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RegisterData {
  email: string;
  password: string;
  role: string;
  fullName: string;
  country: string;
  age: string;
  gender: string;
  academy: string;
  weight: string;
  beltGrade: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  currentUser: DB.User | null;
  isLoading: boolean;
  roleDefinitions: DB.RoleDefinition[];
  reloadRoleDefinitions: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  roleDefinitions: [],
  reloadRoleDefinitions: async () => {},
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

// ── Helpers ───────────────────────────────────────────────────────────────────

interface ServerUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
  country: string;
  age: string;
  gender: string;
  academy: string;
  weight: string;
  beltGrade: string;
  createdAt: string;
}

function toLocalUser(serverUser: ServerUser): DB.User {
  return {
    ...serverUser,
    passwordHash: '',
    synced: true,
  };
}

function decodeJwtUserId(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DB.User | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [roleDefinitions, setRoleDefinitions] = useState<DB.RoleDefinition[]>([]);

  const reloadRoleDefinitions = async () => {
    const defs = await DB.getAllRoleDefinitions();
    setRoleDefinitions(defs);
  };

  // Restore session on app start
  useEffect(() => {
    async function restore() {
      try {
        const token = await loadToken();
        if (token) {
          const userId = decodeJwtUserId(token);
          if (userId) {
            const user = await apiGet<ServerUser>(`/api/users/${userId}`);
            setCurrentUser(toLocalUser(user));
          } else {
            await clearToken();
          }
        }
      } catch {
        // Token expired or server unreachable — stay logged out
        await clearToken();
      } finally {
        await reloadRoleDefinitions();
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await apiPost<{ token: string; user: ServerUser }>('/api/auth/login', { email, password });
      await storeToken(res.token);
      setCurrentUser(toLocalUser(res.user));
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return { success: false, error: 'Credenciales incorrectas' };
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      const res = await apiPost<{ token: string; user: ServerUser }>('/api/auth/register', {
        email:     data.email,
        password:  data.password,
        fullName:  data.fullName,
        role:      data.role,
        country:   data.country,
        age:       data.age,
        gender:    data.gender,
        academy:   data.academy,
        weight:    data.weight,
        beltGrade: data.beltGrade,
      });
      await storeToken(res.token);
      setCurrentUser(toLocalUser(res.user));
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) return { success: false, error: 'Este correo ya está registrado' };
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const logout = async () => {
    await clearToken();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, roleDefinitions, reloadRoleDefinitions, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
