import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient, setTokens, clearTokens, getRefreshToken, safeRedirect } from '@/lib/api-auth';
import { sendWebSocketEvent, subscribeToWebSocketEvents } from '@/lib/websocket-client';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  profile?: any;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  refreshUserProfile: () => Promise<void>;
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
        // Ensure tokens are synced on cold reload
        const storedAccess = localStorage.getItem('tarepet_access_token') || sessionStorage.getItem('tarepet_access_token') || '';
        const storedRefresh = localStorage.getItem('tarepet_refresh_token') || sessionStorage.getItem('tarepet_refresh_token') || '';
        if (storedAccess || storedRefresh) {
          setTokens(storedAccess, storedRefresh);
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshUserProfile = React.useCallback(async () => {
    const access = localStorage.getItem('tarepet_access_token') || sessionStorage.getItem('tarepet_access_token');
    if (!access) return;
    try {
      const res = await authClient.get('/auth/me/');
      if (res.data && res.data.email) {
        const normalized = {
          ...res.data,
          role: (res.data.role || 'STUDENT').toUpperCase() as UserRole
        };
        setUser(normalized);
        localStorage.setItem('tarepet_auth_user', JSON.stringify(normalized));
        sessionStorage.setItem('tarepet_auth_user', JSON.stringify(normalized));
      }
    } catch (e) {
      // Backend offline or invalid token — keep existing user in memory
    }
  }, []);

  // Fetch live database user profile on app startup
  useEffect(() => {
    refreshUserProfile().catch(() => {});
  }, [refreshUserProfile]);

  // Listen to WebSocket events for real-time profile updates across devices
  useEffect(() => {
    const unsubWs = subscribeToWebSocketEvents((evt) => {
      if (evt.type === 'PROFILE_UPDATED' || evt.type === 'AVATAR_UPDATED' || evt.type === 'ROSTER_UPDATED') {
        refreshUserProfile().catch(() => {});
      }
    });
    return () => unsubWs();
  }, [refreshUserProfile]);

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

  // Real-time multi-tab session synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tarepet_auth_user') {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.role) {
              parsed.role = parsed.role.toUpperCase() as UserRole;
            }
            setUser(parsed);
          } catch {}
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    // Fetch latest authoritative profile from backend
    setTimeout(() => {
      refreshUserProfile().catch(() => {});
    }, 100);
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const merged = {
        ...prev,
        ...updatedData,
        profile: {
          ...(prev.profile || {}),
          ...(updatedData.profile || {})
        },
        role: (updatedData.role || prev.role).toUpperCase() as UserRole
      };
      try {
        localStorage.setItem('tarepet_auth_user', JSON.stringify(merged));
        sessionStorage.setItem('tarepet_auth_user', JSON.stringify(merged));
      } catch (err) {}
      
      // Dispatch real-time events locally and across WebSockets
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tarepet_user_updated', { detail: merged }));
        window.dispatchEvent(new Event('storage'));
        sendWebSocketEvent('PROFILE_UPDATED', merged);
      }
      return merged;
    });
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
      localStorage.removeItem('tarepet_user');
    } catch (err) {
      console.warn('Could not clear auth storage', err);
    }
    // Update browser history cleanly without hard reload
    if (typeof window !== 'undefined' && window.location.pathname !== '/sign-in') {
      window.history.pushState(null, '', '/sign-in');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
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
        updateUser,
        refreshUserProfile,
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



