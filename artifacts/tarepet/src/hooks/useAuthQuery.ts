import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/api-auth';
import { useAuth, User } from '@/context/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  phone?: string;
}

export function useLoginMutation() {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await authClient.post('/auth/login/', credentials);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.access, data.refresh, data.user);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const res = await authClient.post('/auth/register/', credentials);
      return res.data;
    },
  });
}

export function useUserProfileQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery<User>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await authClient.get('/auth/me/');
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
