import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

import LoadingScreen from '@/components/ui/LoadingScreen';

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
          setLocation('/sign-in');
      }
    } else if (!isLoading && !user) {
      setLocation('/sign-in');
    }
  }, [user, isLoading, setLocation]);

  return <LoadingScreen message="Redirecting to your portal..." fullScreen={true} />;
};

export default DashboardRedirect;
