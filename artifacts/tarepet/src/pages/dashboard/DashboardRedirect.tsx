import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

export const DashboardRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      const roleUpper = (user.role || '').toUpperCase();
      switch (roleUpper) {
        case 'ADMIN':
          setLocation('/dashboard/admin');
          break;
        case 'TEACHER':
          setLocation('/dashboard/teacher');
          break;
        case 'STUDENT':
          setLocation('/dashboard/student');
          break;
        case 'PARENT':
          setLocation('/dashboard/parent');
          break;
        default:
          setLocation('/dashboard/admin');
      }
    } else if (!isLoading && !user) {
      setLocation('/sign-in');
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Redirecting to your portal...</p>
      </div>
    </div>
  );
};

export default DashboardRedirect;
