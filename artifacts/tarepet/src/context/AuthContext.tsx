import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient, setTokens, clearTokens, getRefreshToken, safeRedirect } from '@/lib/api-auth';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session state persisted in localStorage + sessionStorage to prevent unexpected logouts
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('tarepet_auth_user') || sessionStorage.getItem('tarepet_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) {
          parsed.role = parsed.role.toUpperCase() as UserRole;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const normalizedUser = { ...user, role: user.role.toUpperCase() as UserRole };
      localStorage.setItem('tarepet_auth_user', JSON.stringify(normalizedUser));
      sessionStorage.setItem('tarepet_auth_user', JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem('tarepet_auth_user');
      sessionStorage.removeItem('tarepet_auth_user');
    }
  }, [user]);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    const normalizedUser = {
      ...userData,
      role: (userData.role || 'STUDENT').toUpperCase() as UserRole,
    };
    setTokens(accessToken, refreshToken);
    setUser(normalizedUser);
    try {
      localStorage.setItem('tarepet_auth_user', JSON.stringify(normalizedUser));
      sessionStorage.setItem('tarepet_auth_user', JSON.stringify(normalizedUser));
    } catch (err) {
      console.warn('Could not persist auth session', err);
    }
  };

  const logout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      authClient.post('/auth/logout/', { refresh: refreshToken }).catch(() => {});
    }
    clearTokens();
    setUser(null);
    try {
      localStorage.removeItem('tarepet_auth_user');
      sessionStorage.removeItem('tarepet_auth_user');
    } catch (err) {
      console.warn('Could not clear auth storage', err);
    }
    // safeRedirect ensures we only ever navigate within the same origin.
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const target = `${cleanBase}sign-in`;
    safeRedirect(target);
  };

  const roleUpper = (user?.role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN';
  const isTeacher = roleUpper === 'TEACHER';
  const isStudent = roleUpper === 'STUDENT';
  const isParent = roleUpper === 'PARENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isAdmin,
        isTeacher,
        isStudent,
        isParent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



