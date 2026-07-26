// Central Real-Time CBT Store for Tarepet Montessori School
// Manages real-time sync across Teacher, Admin, and Student portals via LocalStorage

export interface CBTQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  points: number;
}

export interface CBTExam {
  id: number;
  title: string;
  description: string;
  instructions: string;
  course_code: string;
  course_name: string;
  class: string;           // e.g. 'SS1'
  stream: string;          // e.g. 'Science'
  assessment_type: 'TEST' | 'EXAM';
  term: string;            // e.g. 'Term 2'
  duration_minutes: number;
  questions_count: number;
  questions_per_page: number;
  teacher_name: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'COMPLETED';
  rejection_reason?: string;
  questions: CBTQuestion[];
  created_at: string;
  activated_at?: string;
}

export interface CBTSubmission {
  id: number;
  exam_id: number;
  exam_title: string;
  course_code: string;
  student_name: string;
  student_email: string;
  student_id: string;
  class: string;
  stream: string;
  score: number;
  total_possible: number;
  percentage: number;
  submitted_at: string;
  answers: Record<number, string>;
  gradebook_synced: boolean;
}

export const SENIOR_COURSES = [
  // Science Stream
  { id: 1, code: 'MTH-101', name: 'Mathematics', stream: 'Science', category: 'STEM' },
  { id: 2, code: 'PHY-101', name: 'Physics', stream: 'Science', category: 'STEM' },
  { id: 3, code: 'CHM-101', name: 'Chemistry', stream: 'Science', category: 'STEM' },
  { id: 4, code: 'BIO-101', name: 'Biology', stream: 'Science', category: 'STEM' },
  { id: 5, code: 'AGR-101', name: 'Agricultural Science', stream: 'Science', category: 'STEM' },
  { id: 6, code: 'FMTH-101', name: 'Further Mathematics', stream: 'Science', category: 'STEM' },
  { id: 7, code: 'CMP-101', name: 'Computer Studies', stream: 'Science', category: 'STEM' },
  
  // Arts Stream
  { id: 8, code: 'ENG-101', name: 'English Language', stream: 'Arts', category: 'Humanities' },
  { id: 9, code: 'LIT-101', name: 'Literature in English', stream: 'Arts', category: 'Humanities' },
  { id: 10, code: 'GOV-101', name: 'Government', stream: 'Arts', category: 'Humanities' },
  { id: 11, code: 'CRS-101', name: 'Christian Religious Studies (CRS)', stream: 'Arts', category: 'Humanities' },
  { id: 12, code: 'HIS-101', name: 'History', stream: 'Arts', category: 'Humanities' },
  { id: 13, code: 'CIV-101', name: 'Civic Education', stream: 'Arts', category: 'Humanities' },

  // Commercial Stream
  { id: 14, code: 'ACC-101', name: 'Financial Accounting', stream: 'Commercial', category: 'Business' },
  { id: 15, code: 'ECO-101', name: 'Economics', stream: 'Commercial', category: 'Business' },
  { id: 16, code: 'COM-101', name: 'Commerce', stream: 'Commercial', category: 'Business' },
  { id: 17, code: 'OFF-101', name: 'Office Practice', stream: 'Commercial', category: 'Business' },
];

export const SS1_SCIENCE_COURSES = SENIOR_COURSES.filter(c => c.stream === 'Science');

const INITIAL_SS1_SCIENCE_EXAMS: CBTExam[] = [];
const INITIAL_SUBMISSIONS: CBTSubmission[] = [];

const STORAGE_KEYS = {
  EXAMS: 'tarepet_cbt_exams_v1',
  SUBMISSIONS: 'tarepet_cbt_submissions_v1',
};

// Clear All App LocalStorage & Cache
export function clearCBTStoreCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.EXAMS);
  localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
  localStorage.clear();
  window.dispatchEvent(new Event('cbt_store_updated'));
}

// Initialize Storage (Clean slate)
export function initCBTStore() {
  if (typeof window === 'undefined') return;

  const rawExams = localStorage.getItem(STORAGE_KEYS.EXAMS);
  const rawSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);

  // If cached data contains old pre-seeded records (e.g. Emeka Amadi or id: 101), clear them out!
  if (rawExams && (rawExams.includes('101') || rawExams.includes('Quadratic Equations'))) {
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
  }
  if (rawSubmissions && (rawSubmissions.includes('Emeka Amadi') || rawSubmissions.includes('TMS-2024-101'))) {
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
  }
}

// Get all exams
export function getStoredExams(): CBTExam[] {
  initCBTStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return raw ? JSON.parse(raw) : INITIAL_SS1_SCIENCE_EXAMS;
  } catch (e) {
    return INITIAL_SS1_SCIENCE_EXAMS;
  }
}

// Save / update exam list
export function saveStoredExams(exams: CBTExam[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  window.dispatchEvent(new Event('cbt_store_updated'));
}

// Create or Update Exam
export function saveCBTExam(examData: Partial<CBTExam> & { title: string; course_code?: string }): CBTExam {
  const exams = getStoredExams();
  const existingIdx = exams.findIndex(e => e.id === examData.id);
  
  const foundCourse = SENIOR_COURSES.find(c => c.code === examData.course_code || c.name === examData.course_name) || SENIOR_COURSES[0];
  
  const newExam: CBTExam = {
    id: examData.id || Date.now(),
    title: examData.title,
    description: examData.description || 'Objective CBT Assessment',
    instructions: examData.instructions || 'Answer all objective questions. Multiple choice A, B, C, D.',
    course_code: examData.course_code || foundCourse.code,
    course_name: examData.course_name || foundCourse.name,
    class: examData.class || 'SS1',
    stream: examData.stream || 'Science',
    assessment_type: examData.assessment_type || 'TEST',
    term: examData.term || 'Term 2',
    duration_minutes: examData.duration_minutes || 45,
    questions_count: examData.questions ? examData.questions.length : (examData.questions_count || 0),
    questions_per_page: examData.questions_per_page || 2,
    teacher_name: examData.teacher_name || 'Mrs. Okafor Chioma',
    status: examData.status || 'PENDING',
    questions: examData.questions || [],
    created_at: examData.created_at || new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    exams[existingIdx] = newExam;
  } else {
    exams.unshift(newExam);
  }

  saveStoredExams(exams);
  return newExam;
}

// Update status (e.g. Admin Approve / Reject, Teacher Activate/Proceed)
export function updateExamStatus(examId: number, status: CBTExam['status'], reason?: string): CBTExam | null {
  const exams = getStoredExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return null;

  exam.status = status;
  if (status === 'ACTIVE') {
    exam.activated_at = new Date().toISOString();
  }
  if (status === 'REJECTED' && reason) {
    exam.rejection_reason = reason;
  }

  saveStoredExams(exams);
  return exam;
}

// Get Submissions
export function getStoredSubmissions(): CBTSubmission[] {
  initCBTStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return raw ? JSON.parse(raw) : INITIAL_SUBMISSIONS;
  } catch (e) {
    return INITIAL_SUBMISSIONS;
  }
}

// Save Student Submission
export function submitStudentCBTAttempt(
  examId: number,
  answers: Record<number, string>,
  studentInfo: { name?: string; email?: string; student_id?: string }
): CBTSubmission {
  const exams = getStoredExams();
  const exam = exams.find(e => e.id === examId) || exams[0];

  let score = 0;
  let total_possible = 0;

  exam.questions.forEach(q => {
    total_possible += q.points || 5;
    if (answers[q.id] === q.correct_option) {
      score += q.points || 5;
    }
  });

  const percentage = total_possible > 0 ? Math.round((score / total_possible) * 100) : 100;

  const newSub: CBTSubmission = {
    id: Date.now(),
    exam_id: exam.id,
    exam_title: exam.title,
    course_code: exam.course_code,
    student_name: studentInfo.name || 'Emeka Amadi',
    student_email: studentInfo.email || 'emeka.amadi@tarepet.edu.ng',
    student_id: studentInfo.student_id || 'TMS-2024-101',
    class: exam.class || 'SS1',
    stream: exam.stream || 'Science',
    score,
    total_possible,
    percentage,
    submitted_at: new Date().toISOString(),
    answers,
    gradebook_synced: true,
  };

  const submissions = getStoredSubmissions();
  submissions.unshift(newSub);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  window.dispatchEvent(new Event('cbt_store_updated'));

  return newSub;
}

// Event Hook Listener helper
export function subscribeToCBTStore(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('cbt_store_updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('cbt_store_updated', callback);
    window.removeEventListener('storage', callback);
  };
}
