import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient, setTokens, clearTokens, getRefreshToken, safeRedirect } from '@/lib/api-auth';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: number;
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
  // Session state lives entirely in memory — no localStorage
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // No localStorage restore on mount.
  // If tokens exist in memory (same tab session), verify with /auth/me/.
  // On page refresh tokens are cleared (by design — no localStorage).
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    // Store tokens in memory only — never in localStorage
    setTokens(accessToken, refreshToken);
    setUser(userData);
  };

  const logout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      authClient.post('/auth/logout/', { refresh: refreshToken }).catch(() => {});
    }
    clearTokens();
    setUser(null);
    // safeRedirect ensures we only ever navigate within the same origin.
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const target = `${cleanBase}sign-in`;
    safeRedirect(target);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

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



