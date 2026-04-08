import React, { createContext, useContext, useEffect, useState } from 'react';
import * as DB from '../db/database';

// ── Types ───────────────────────────────────────────────────────────────────

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

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DB.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleDefinitions, setRoleDefinitions] = useState<DB.RoleDefinition[]>([]);

  const reloadRoleDefinitions = async () => {
    const defs = await DB.getAllRoleDefinitions();
    setRoleDefinitions(defs);
  };

  // Restore session and load role definitions on app start
  useEffect(() => {
    Promise.all([
      DB.getSessionUserId().then(async userId => {
        if (userId) {
          const user = await DB.getUserById(userId);
          setCurrentUser(user);
        }
      }),
      reloadRoleDefinitions(),
    ]).then(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const user = await DB.getUserByEmail(email);
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const hash = DB.hashPassword(password);
    if (user.passwordHash !== hash) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    await DB.setSession(user.id);
    setCurrentUser(user);
    return { success: true };
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    const existing = await DB.getUserByEmail(data.email);
    if (existing) {
      return { success: false, error: 'Este correo ya está registrado' };
    }

    const user = await DB.createUser({
      email: data.email,
      passwordHash: DB.hashPassword(data.password),
      role: data.role,
      fullName: data.fullName,
      country: data.country,
      age: data.age,
      gender: data.gender,
      academy: data.academy,
      weight: data.weight,
      beltGrade: data.beltGrade,
    });

    await DB.setSession(user.id);
    setCurrentUser(user);
    return { success: true };
  };

  const logout = async () => {
    await DB.clearSession();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, roleDefinitions, reloadRoleDefinitions, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
