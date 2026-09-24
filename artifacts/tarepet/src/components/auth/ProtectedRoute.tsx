import React from 'react';
import { useLocation, Redirect } from 'wouter';
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

import LoadingScreen from '@/components/ui/LoadingScreen';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen message={t('authenticating_session')} fullScreen={true} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/sign-in" replace />;
  }

  const userRoleUpper = (user?.role || '').toUpperCase();
  const allowedUpper = allowedRoles?.map(r => r.toUpperCase());

  const getDashboardForRole = (role?: string) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return '/dashboard/admin';
    if (r === 'TEACHER') return '/dashboard/teacher';
    if (r === 'PARENT') return '/dashboard/parent';
    if (r === 'STUDENT') return '/dashboard/student';
    return '/';
  };

  if (allowedUpper && user && !allowedUpper.includes(userRoleUpper)) {
    const targetPortalName = allowedRoles && allowedRoles.length > 0
      ? allowedRoles[0].charAt(0).toUpperCase() + allowedRoles[0].slice(1).toLowerCase()
      : 'Target';

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-2xl bg-card p-8 shadow-xl border border-border">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">{t('access_denied')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You are currently signed in as an <strong className="text-foreground">{userRoleUpper}</strong>. This section is reserved exclusively for <strong className="text-foreground">{targetPortalName}</strong> accounts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation(getDashboardForRole(user?.role))}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              Go to {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''} Portal
            </button>
            <button
              onClick={async () => {
                await logout();
                setLocation('/sign-in');
              }}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Sign In as {targetPortalName}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
