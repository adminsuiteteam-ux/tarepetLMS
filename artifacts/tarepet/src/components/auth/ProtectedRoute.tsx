import React from 'react';
import { useLocation } from 'wouter';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// Lightweight internationalization helper dictionary
const translations: Record<string, string> = {
  authenticating_session: 'Authenticating session...',
  access_denied: 'Access Denied',
  access_denied_desc_prefix: 'Your account (',
  access_denied_desc_suffix: ') does not have permission to view this section.',
  return_to_homepage: 'Return to Homepage',
};

const t = (key: string): string =>
  Object.prototype.hasOwnProperty.call(translations, key) ? translations[key] : key;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">{t('authenticating_session')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation('/sign-in');
    return null;
  }

  const userRoleUpper = (user?.role || '').toUpperCase();
  const allowedUpper = allowedRoles?.map(r => r.toUpperCase());

  if (allowedUpper && user && !allowedUpper.includes(userRoleUpper)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl bg-card p-8 shadow-xl border border-border">
          <h2 className="text-2xl font-serif font-bold text-destructive mb-3">{t('access_denied')}</h2>
          <p className="text-muted-foreground mb-6">
            {`${t('access_denied_desc_prefix')}${user.role}${t('access_denied_desc_suffix')}`}
          </p>
          <button
            onClick={() => setLocation('/')}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            {t('return_to_homepage')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
