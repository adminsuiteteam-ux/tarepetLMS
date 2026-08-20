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

// ── CBT System Hooks (Django REST API Integration) ───────────────────────────

export interface CBTExam {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  course: number;
  assessment_type: 'TEST' | 'EXAM';
  term: '1ST_TERM' | '2ND_TERM' | '3RD_TERM';
  duration_minutes: number;
  questions_per_page: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
}

export function useCBTExamsQuery() {
  return useQuery<CBTExam[]>({
    queryKey: ['cbt-exams'],
    queryFn: async () => {
      const res = await authClient.get('/assessments/cbt-exams/');
      return res.data.results || res.data;
    },
  });
}

export function useCBTExamDetailQuery(examId: number) {
  return useQuery<CBTExam>({
    queryKey: ['cbt-exam', examId],
    queryFn: async () => {
      const res = await authClient.get(`/assessments/cbt-exams/${examId}/`);
      return res.data;
    },
    enabled: !!examId,
  });
}

export function useCreateCBTExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CBTExam>) => {
      const res = await authClient.post('/assessments/cbt-exams/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

export function useAddCBTQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, questionData }: { examId: number; questionData: any }) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/add_question/`, questionData);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cbt-exam', variables.examId] });
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

export function useSubmitCBTForApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examId: number) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/submit_for_approval/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

export function useApproveCBTExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examId: number) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/approve/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

export function usePublishCBTExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examId: number) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/publish/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

export function useRejectCBTExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, reason }: { examId: number; reason: string }) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/reject/`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

export function useStartCBTExamMutation() {
  return useMutation({
    mutationFn: async (examId: number) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/start/`);
      return res.data;
    },
  });
}

export function useSaveCBTAnswerMutation() {
  return useMutation({
    mutationFn: async ({ examId, questionId, selectedOption }: { examId: number; questionId: number; selectedOption: string }) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/save_answer/`, {
        question_id: questionId,
        selected_option: selectedOption,
      });
      return res.data;
    },
  });
}

export function useSubmitCBTAttemptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, autoSubmitted }: { examId: number; autoSubmitted?: boolean }) => {
      const res = await authClient.post(`/assessments/cbt-exams/${examId}/submit_attempt/`, {
        auto_submitted: autoSubmitted || false,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['cbt-exams'] });
    },
  });
}

