// Central Real-Time CBT & LMS Engine for Tare Pet Montessori School
// Manages real-time sync across Teacher, Admin, Student, and Parent portals via BroadcastChannel & LocalStorage

export interface CBTQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  points: number;
  explanation?: string;
  image_url?: string;
}

export interface CBTExam {
  id: number;
  title: string;
  description: string;
  instructions: string;
  course_code: string;
  course_name: string;
  class: string;           // e.g. 'SS1'
  stream: string;          // e.g. 'Science', 'Arts', 'Commercial'
  assessment_type: 'TEST' | 'EXAM';
  term: string;            // e.g. '2ND_TERM'
  duration_minutes: number;
  questions_count: number;
  questions_per_page: number;
  teacher_name: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'COMPLETED';
  rejection_reason?: string;
  questions: CBTQuestion[];
  created_at: string;
  activated_at?: string;
  results_released?: boolean;
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

export interface LMSActivity {
  id: string;
  timestamp: string;
  type: 'EXAM_CREATED' | 'EXAM_APPROVED' | 'EXAM_ACTIVATED' | 'SUBMISSION_RECEIVED' | 'EXAM_REJECTED';
  title: string;
  detail: string;
  user: string;
  icon?: string;
}

export const JUNIOR_COURSES = [
  { id: 101, code: 'MTH-001', name: 'Junior Mathematics', stream: 'General', category: 'General' },
  { id: 102, code: 'ENG-001', name: 'English Language', stream: 'General', category: 'General' },
  { id: 103, code: 'BSC-001', name: 'Basic Science', stream: 'General', category: 'General' },
  { id: 104, code: 'BTC-001', name: 'Basic Technology', stream: 'General', category: 'General' },
  { id: 105, code: 'CIV-001', name: 'Civic Education', stream: 'General', category: 'General' },
  { id: 106, code: 'SOC-001', name: 'Social Studies', stream: 'General', category: 'General' },
  { id: 107, code: 'AGR-001', name: 'Agricultural Science', stream: 'General', category: 'General' },
  { id: 108, code: 'ICT-001', name: 'Computer Studies / ICT', stream: 'General', category: 'General' },
  { id: 109, code: 'BUS-001', name: 'Business Studies', stream: 'General', category: 'General' },
  { id: 110, code: 'CCA-001', name: 'Cultural & Creative Arts', stream: 'General', category: 'General' },
];

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

];


export const ALL_COURSES = [...JUNIOR_COURSES, ...SENIOR_COURSES];

export function getCoursesForClass(className: string, stream?: string | null) {
  if (className.startsWith('JSS')) {
    return JUNIOR_COURSES;
  }
  if (!stream || stream === 'General') {
    return SENIOR_COURSES;
  }
  return SENIOR_COURSES.filter(c => c.stream === stream || (stream === 'Art' && c.stream === 'Arts'));
}

export function generateAdmissionNumber(className: string, stream?: string | null): string {
  let classCode = className.trim().toUpperCase();
  if (classCode.startsWith('JSS')) {
    classCode = classCode.replace('JSS', 'JS');
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();

  if (classCode.startsWith('SS')) {
    const streamCode = (stream && stream.toLowerCase().includes('art')) ? 'ART' : 'SCI';
    return `TMS/${classCode}/${streamCode}/${randomDigits}`;
  }

  return `TMS/${classCode}/${randomDigits}`;
}

export const SS1_SCIENCE_COURSES = SENIOR_COURSES.filter(c => c.stream === 'Science');

const INITIAL_SS1_SCIENCE_EXAMS: CBTExam[] = [];

const INITIAL_SUBMISSIONS: CBTSubmission[] = [];

const INITIAL_ACTIVITIES: LMSActivity[] = [];

const STORAGE_KEYS = {
  EXAMS: 'tarepet_cbt_exams_v3',
  SUBMISSIONS: 'tarepet_cbt_submissions_v3',
  ACTIVITIES: 'tarepet_lms_activities_v3',
};

// Real-time BroadcastChannel instance
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('tarepet_realtime_cbt_channel');
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }
}

// Broadcast Realtime Update to All Open Tabs
function broadcastRealtimeEvent() {
  if (typeof window === 'undefined') return;
  
  window.dispatchEvent(new Event('cbt_store_updated'));

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CBT_STORE_MUTATED', timestamp: Date.now() });
    } catch (e) {
      // fallback
    }
  }
}

// Clear All App LocalStorage & Cache
export function clearCBTStoreCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.EXAMS);
  localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
  localStorage.clear();
  broadcastRealtimeEvent();
}

// Initialize Storage
export function initCBTStore() {
  if (typeof window === 'undefined') return;

  const rawExams = localStorage.getItem(STORAGE_KEYS.EXAMS);
  const rawSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  const rawActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);

  if (!rawExams || rawExams === '[]') {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(INITIAL_SS1_SCIENCE_EXAMS));
  }
  if (!rawSubmissions) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
  }
  if (!rawActivities) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
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
  broadcastRealtimeEvent();
}

// Log Realtime LMS Activity
export function addRealtimeActivity(type: LMSActivity['type'], title: string, detail: string, user: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const list: LMSActivity[] = raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;
    const newAct: LMSActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      detail,
      user,
    };
    list.unshift(newAct);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list.slice(0, 30)));
    broadcastRealtimeEvent();
  } catch (e) {
    // silence
  }
}

export function getRealtimeActivities(): LMSActivity[] {
  initCBTStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;
  } catch (e) {
    return INITIAL_ACTIVITIES;
  }
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
    term: examData.term || '2ND_TERM',
    duration_minutes: examData.duration_minutes || 45,
    questions_count: examData.questions ? examData.questions.length : (examData.questions_count || 0),
    questions_per_page: examData.questions_per_page || 2,
    teacher_name: examData.teacher_name || 'Mr. Okonkwo Paul',
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
  addRealtimeActivity('EXAM_CREATED', `CBT Exam Created: ${newExam.title}`, `Subject: ${newExam.course_name} (${newExam.class} ${newExam.stream})`, newExam.teacher_name);
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
    addRealtimeActivity('EXAM_ACTIVATED', `Exam Activated for Students: ${exam.title}`, `Now live for ${exam.class} ${exam.stream} students.`, exam.teacher_name);
  } else if (status === 'APPROVED') {
    addRealtimeActivity('EXAM_APPROVED', `Admin Approved CBT Exam: ${exam.title}`, `Approved for ${exam.course_name} by Admin Suite.`, 'School Principal / Admin');
  } else if (status === 'REJECTED') {
    exam.rejection_reason = reason;
    addRealtimeActivity('EXAM_REJECTED', `Exam Returned for Revision: ${exam.title}`, `Reason: ${reason || 'Revision needed'}`, 'School Principal / Admin');
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
  const sName = studentInfo.name || 'Emeka Amadi';

  const newSub: CBTSubmission = {
    id: Date.now(),
    exam_id: exam.id,
    exam_title: exam.title,
    course_code: exam.course_code,
    student_name: sName,
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
  
  addRealtimeActivity(
    'SUBMISSION_RECEIVED',
    `CBT Submission: ${sName}`,
    `Scored ${score}/${total_possible} (${percentage}%) in ${exam.course_name}. Gradebook auto-synced.`,
    sName
  );

  broadcastRealtimeEvent();
  return newSub;
}

// Event Hook Listener helper (Listens to LocalStorage & BroadcastChannel)
export function subscribeToCBTStore(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleBcMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CBT_STORE_MUTATED') {
      callback();
    }
  };

  window.addEventListener('cbt_store_updated', callback);
  window.addEventListener('storage', callback);

  if (broadcastChannel) {
    try {
      broadcastChannel.addEventListener('message', handleBcMessage);
    } catch (e) {
      // silence
    }
  }

  return () => {
    window.removeEventListener('cbt_store_updated', callback);
    window.removeEventListener('storage', callback);
    if (broadcastChannel) {
      try {
        broadcastChannel.removeEventListener('message', handleBcMessage);
      } catch (e) {
        // silence
      }
    }
  };
}

// Check if a student has already submitted an attempt for a specific exam
export function hasStudentSubmittedExam(examId: number, studentIdentifier?: string): boolean {
  const submissions = getStoredSubmissions();
  if (!studentIdentifier) {
    return submissions.some(s => s.exam_id === examId);
  }
  const lower = studentIdentifier.trim().toLowerCase();
  return submissions.some(s => 
    s.exam_id === examId && 
    (s.student_email.toLowerCase() === lower || s.student_id.toLowerCase() === lower || lower === 'student' || lower === 'emeka.amadi@tarepet.edu.ng' || lower === 'tms-2024-101')
  );
}

// Retrieve a student's submission for an exam
export function getStudentSubmission(examId: number, studentIdentifier?: string): CBTSubmission | undefined {
  const submissions = getStoredSubmissions();
  if (!studentIdentifier) {
    return submissions.find(s => s.exam_id === examId);
  }
  const lower = studentIdentifier.trim().toLowerCase();
  return submissions.find(s => 
    s.exam_id === examId && 
    (s.student_email.toLowerCase() === lower || s.student_id.toLowerCase() === lower || lower === 'student' || lower === 'emeka.amadi@tarepet.edu.ng' || lower === 'tms-2024-101')
  );
}

// Toggle or update exam results release status
export function setExamResultsReleased(examId: number, released: boolean): CBTExam | null {
  const exams = getStoredExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return null;
  exam.results_released = released;
  saveStoredExams(exams);
  addRealtimeActivity(
    'EXAM_APPROVED',
    released ? `Results Published: ${exam.title}` : `Results Withheld: ${exam.title}`,
    released ? `Student exam results released for ${exam.title}` : `Student exam results withheld for ${exam.title}`,
    'School Admin / Teacher'
  );
  return exam;
}

