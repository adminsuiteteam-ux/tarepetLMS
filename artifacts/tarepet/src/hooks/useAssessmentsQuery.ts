import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/api-auth';

export interface Assignment {
  id: number;
  course: number;
  title: string;
  description?: string;
  instructions?: string;
  due_date: string;
  max_score: number;
  allowed_file_types: string;
}

export interface Submission {
  id: number;
  assignment: number;
  student: number;
  submitted_at: string;
  file_url?: string;
  text_answer?: string;
  grade?: number;
  feedback?: string;
  is_late: boolean;
  grade_percentage?: number;
}

export interface House {
  id: number;
  name: string;
  color: string;
  motto?: string;
  points: number;
}

export function useAssignmentsQuery(courseId?: number) {
  return useQuery<Assignment[]>({
    queryKey: ['assignments', { courseId }],
    queryFn: async () => {
      const params = courseId ? { course_id: courseId } : {};
      const res = await authClient.get('/assessments/assignments/', { params });
      return res.data.results || res.data;
    },
  });
}

export function useSubmissionsQuery(assignmentId?: number) {
  return useQuery<Submission[]>({
    queryKey: ['submissions', { assignmentId }],
    queryFn: async () => {
      const params = assignmentId ? { assignment_id: assignmentId } : {};
      const res = await authClient.get('/assessments/submissions/', { params });
      return res.data.results || res.data;
    },
  });
}

export function useSubmitAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { assignment: number; file_url?: string; text_answer?: string }) => {
      const res = await authClient.post('/assessments/submissions/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useGradebookQuery(courseId?: number) {
  return useQuery({
    queryKey: ['gradebook', { courseId }],
    queryFn: async () => {
      const params = courseId ? { course_id: courseId } : {};
      const res = await authClient.get('/assessments/gradebook/', { params });
      return res.data.results || res.data;
    },
  });
}

export function useHousesQuery() {
  return useQuery<House[]>({
    queryKey: ['houses'],
    queryFn: async () => {
      const res = await authClient.get('/assessments/houses/');
      return res.data.results || res.data;
    },
  });
}
