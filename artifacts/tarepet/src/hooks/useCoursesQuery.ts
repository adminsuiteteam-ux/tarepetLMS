import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/api-auth';

export interface Course {
  id: number;
  title: string;
  slug: string;
  code: string;
  description?: string;
  teacher?: number;
  teacher_detail?: any;
  grade_level: string;
  start_date?: string;
  end_date?: string;
  enrollment_limit: number;
  is_active: boolean;
  thumbnail?: string;
  enrollment_count: number;
  modules?: any[];
}

export function useCoursesQuery(gradeLevel?: string) {
  return useQuery<Course[]>({
    queryKey: ['courses', { gradeLevel }],
    queryFn: async () => {
      const params = gradeLevel ? { grade_level: gradeLevel } : {};
      const res = await authClient.get('/lms/courses/', { params });
      return res.data.results || res.data;
    },
  });
}

export function useCourseDetailQuery(id: number) {
  return useQuery<Course>({
    queryKey: ['courseDetail', id],
    queryFn: async () => {
      const res = await authClient.get(`/lms/courses/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useEnrollCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: number) => {
      const res = await authClient.post(`/lms/courses/${courseId}/enroll/`);
      return res.data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courseDetail', courseId] });
    },
  });
}
