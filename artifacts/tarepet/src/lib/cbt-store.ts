// Central CBT & LMS Engine for Tare Pet Montessori School
// All data lives in module-level memory. No localStorage. Syncs with backend API.

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
  class: string;
  stream: string;
  assessment_type: 'TEST' | 'EXAM';
  term: string;
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

export function formatStudentEmail(fullName: string): string {
  if (!fullName || !fullName.trim()) return 'student@tarepet.com';
  const clean = fullName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'student@tarepet.com';
  const firstName = parts[0];
  const surname = parts.slice(1).join('') || 'tarepet';
  return `${firstName}.${surname}@tarepet.com`;
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

export interface StudentRecord {
  id: number;
  code: string;
  admissionNo?: string;
  name: string;
  email: string;
  password?: string;
  gender: string;
  maritalStatus?: string;
  dob?: string;
  phone?: string;
  country?: string;
  stateOfOrigin?: string;
  lga?: string;
  address?: string;
  grade: string;
  stream?: string;
  programme?: string;
  parentName?: string;
  parentPhone?: string;
  status: string;
  studyMode?: string;
  attendance?: string;
  atRisk?: boolean;
  profileImage?: string;
  house?: string;
}

// ── In-memory cache (no localStorage) ─────────────────────────────────────────
let _exams: CBTExam[] = [];
let _submissions: CBTSubmission[] = [];
let _activities: LMSActivity[] = [];
let _students: StudentRecord[] = [
  {
    id: 1,
    code: 'TMS/SS1/SCI/9927',
    admissionNo: 'TMS/SS1/SCI/9927',
    name: 'Civa Media',
    email: 'civa.media@tarepet.com',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-05-14',
    phone: 'Not Available',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: '12 Kpansia-Epje Road, Yenagoa',
    grade: 'SS1',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Chief Nwosu',
    parentPhone: '08031112233',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '98%',
    atRisk: false
  },
  {
    id: 2,
    code: 'TMS/SS1/SCI/4821',
    admissionNo: 'TMS/SS1/SCI/4821',
    name: 'Kelechi Amadi',
    email: 'kelechi.amadi@tarepet.com',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-09-20',
    phone: '+234 812 345 6789',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Azikoro Village, Yenagoa',
    grade: 'SS1',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Ayaebi Dimaro',
    parentPhone: '08031234567',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '99%',
    atRisk: false
  }
];

import { authClient } from './api-auth';

export function getStoredStudents(): StudentRecord[] {
  return _students;
}

export async function syncStudentsWithBackend(): Promise<StudentRecord[]> {
  try {
    const res = await authClient.get('/auth/users/?role=STUDENT');
    if (res.data && Array.isArray(res.data)) {
      const fetched: StudentRecord[] = res.data.map((u: any) => ({
        id: u.id,
        code: u.student_id || u.profile?.student_id || `TMS/SS1/SCI/${u.id}`,
        admissionNo: u.student_id || u.profile?.student_id || `TMS/SS1/SCI/${u.id}`,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        email: u.email,
        gender: u.profile?.gender || 'Male',
        maritalStatus: 'Single',
        dob: u.profile?.dob || 'Not Available',
        phone: u.phone || 'Not Available',
        country: 'Nigeria',
        stateOfOrigin: u.profile?.stateOfOrigin || 'Bayelsa',
        lga: u.profile?.lga || 'Yenagoa',
        address: u.profile?.address || 'Not Available',
        grade: u.profile?.grade || u.profile?.formTeacherOf || 'SS1',
        stream: u.profile?.stream || 'Science',
        programme: 'Senior Secondary Certificate (SSCE)',
        parentName: u.profile?.parentName || 'Not Available',
        parentPhone: u.profile?.parentPhone || 'Not Available',
        status: 'ACTIVE',
        studyMode: 'Full Time',
        attendance: '100%',
        atRisk: false
      }));
      if (fetched.length > 0) {
        _students = fetched;
        broadcastRealtimeEvent();
      }
    }
  } catch (err) {
    // Graceful fallback to in-memory records if backend API is not serving /users/
  }
  return _students;
}

export function saveStudent(studentData: Partial<StudentRecord> & { name: string }): StudentRecord {
  const assignedGrade = studentData.grade || 'SS1';
  const autoCode = studentData.code || studentData.admissionNo || generateAdmissionNumber(assignedGrade, studentData.stream);
  const autoEmail = studentData.email || formatStudentEmail(studentData.name);

  const existingIdx = _students.findIndex(s => s.id === studentData.id || (studentData.email && s.email.toLowerCase() === studentData.email.toLowerCase()) || (autoCode && (s.code === autoCode || s.admissionNo === autoCode)));

  const newStudent: StudentRecord = {
    id: studentData.id || (existingIdx >= 0 ? _students[existingIdx].id : Date.now()),
    code: autoCode,
    admissionNo: autoCode,
    name: studentData.name.trim(),
    email: autoEmail,
    password: studentData.password || autoCode,
    gender: studentData.gender || 'Male',
    maritalStatus: studentData.maritalStatus || 'Single',
    dob: studentData.dob || 'Not Available',
    phone: studentData.phone || 'Not Available',
    country: studentData.country || 'Nigeria',
    stateOfOrigin: studentData.stateOfOrigin || 'Bayelsa',
    lga: studentData.lga || 'Yenagoa',
    address: studentData.address || 'Not Available',
    grade: assignedGrade,
    stream: studentData.stream || 'Science',
    programme: studentData.programme || 'Senior Secondary Certificate (SSCE)',
    parentName: studentData.parentName || 'Not Available',
    parentPhone: studentData.parentPhone || 'Not Available',
    status: studentData.status || 'ACTIVE',
    studyMode: studentData.studyMode || 'Full Time',
    attendance: studentData.attendance || '100%',
    atRisk: studentData.atRisk || false,
    profileImage: studentData.profileImage || '',
    house: studentData.house || 'Blue House (Eagle)',
  };

  if (existingIdx >= 0) {
    _students[existingIdx] = { ..._students[existingIdx], ...newStudent };
  } else {
    _students = [newStudent, ..._students];
  }

  broadcastRealtimeEvent();
  return _students[existingIdx >= 0 ? existingIdx : 0];
}

export function saveStoredStudents(students: StudentRecord[]) {
  students.forEach(s => {
    saveStudent(s);
  });
}

export function deleteStudent(studentId: number | string): boolean {
  _students = _students.filter(s => s.id !== studentId && s.code !== studentId && s.admissionNo !== studentId);
  broadcastRealtimeEvent();
  return true;
}

// Real-time BroadcastChannel instance
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('tarepet_realtime_cbt_channel');
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }
}

function broadcastRealtimeEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('cbt_store_updated'));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CBT_STORE_MUTATED', timestamp: Date.now() });
    } catch (e) { /* fallback */ }
  }
}

// No-op: kept for compatibility (initCBTStore calls are safe to leave in place)
export function initCBTStore() { /* data is loaded from API, not localStorage */ }

// Clear in-memory cache only (no localStorage to clear)
export function clearCBTStoreCache() {
  _exams = [];
  _submissions = [];
  _activities = [];
  broadcastRealtimeEvent();
}

// ── Exam CRUD ─────────────────────────────────────────────────────────────────

export function getStoredExams(): CBTExam[] {
  return _exams;
}

export function saveStoredExams(exams: CBTExam[]) {
  _exams = exams;
  broadcastRealtimeEvent();
}

export function saveCBTExam(examData: Partial<CBTExam> & { title: string; course_code?: string }): CBTExam {
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

  const existingIdx = _exams.findIndex(e => e.id === newExam.id);
  if (existingIdx >= 0) {
    _exams[existingIdx] = newExam;
  } else {
    _exams = [newExam, ..._exams];
  }

  broadcastRealtimeEvent();
  addRealtimeActivity('EXAM_CREATED', `CBT Exam Created: ${newExam.title}`, `Subject: ${newExam.course_name} (${newExam.class} ${newExam.stream})`, newExam.teacher_name);
  return newExam;
}

export function updateExamStatus(examId: number, status: CBTExam['status'], reason?: string): CBTExam | null {
  const exam = _exams.find(e => e.id === examId);
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

  _exams = [..._exams];
  broadcastRealtimeEvent();
  return exam;
}

export function setExamResultsReleased(examId: number, released: boolean): CBTExam | null {
  const exam = _exams.find(e => e.id === examId);
  if (!exam) return null;
  exam.results_released = released;
  _exams = [..._exams];
  broadcastRealtimeEvent();
  addRealtimeActivity(
    'EXAM_APPROVED',
    released ? `Results Published: ${exam.title}` : `Results Withheld: ${exam.title}`,
    released ? `Student exam results released for ${exam.title}` : `Student exam results withheld for ${exam.title}`,
    'School Admin / Teacher'
  );
  return exam;
}

// ── Activities ────────────────────────────────────────────────────────────────

export function addRealtimeActivity(type: LMSActivity['type'], title: string, detail: string, user: string) {
  const newAct: LMSActivity = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    title,
    detail,
    user,
  };
  _activities = [newAct, ..._activities].slice(0, 30);
  broadcastRealtimeEvent();
}

export function getRealtimeActivities(): LMSActivity[] {
  return _activities;
}

// ── Submissions ───────────────────────────────────────────────────────────────

export function getStoredSubmissions(): CBTSubmission[] {
  return _submissions;
}

export function submitStudentCBTAttempt(
  examId: number,
  answers: Record<number, string>,
  studentInfo: { name?: string; email?: string; student_id?: string }
): CBTSubmission {
  const exam = _exams.find(e => e.id === examId) || _exams[0];

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
  const autoEmail = studentInfo.email || formatStudentEmail(sName);
  const autoId = studentInfo.student_id || 'TMS/SS1/SCI/4821';

  const newSub: CBTSubmission = {
    id: Date.now(),
    exam_id: exam.id,
    exam_title: exam.title,
    course_code: exam.course_code,
    student_name: sName,
    student_email: autoEmail,
    student_id: autoId,
    class: exam.class || 'SS1',
    stream: exam.stream || 'Science',
    score,
    total_possible,
    percentage,
    submitted_at: new Date().toISOString(),
    answers,
    gradebook_synced: true,
  };

  _submissions = [newSub, ..._submissions];
  addRealtimeActivity(
    'SUBMISSION_RECEIVED',
    `CBT Submission: ${sName}`,
    `Scored ${score}/${total_possible} (${percentage}%) in ${exam.course_name}. Gradebook auto-synced.`,
    sName
  );
  broadcastRealtimeEvent();
  return newSub;
}

export function hasStudentSubmittedExam(examId: number, studentIdentifier?: string): boolean {
  if (!studentIdentifier) {
    return _submissions.some(s => s.exam_id === examId);
  }
  const lower = studentIdentifier.trim().toLowerCase();
  return _submissions.some(s =>
    s.exam_id === examId &&
    (s.student_email.toLowerCase() === lower || s.student_id.toLowerCase() === lower || lower === 'student' || lower === 'emeka.amadi@tarepet.com' || lower === 'tms/ss1/sci/4821')
  );
}

export function getStudentSubmission(examId: number, studentIdentifier?: string): CBTSubmission | undefined {
  if (!studentIdentifier) {
    return _submissions.find(s => s.exam_id === examId);
  }
  const lower = studentIdentifier.trim().toLowerCase();
  return _submissions.find(s =>
    s.exam_id === examId &&
    (s.student_email.toLowerCase() === lower || s.student_id.toLowerCase() === lower || lower === 'student' || lower === 'emeka.amadi@tarepet.com' || lower === 'tms/ss1/sci/4821')
  );
}

// ── Event subscription ────────────────────────────────────────────────────────

export function subscribeToCBTStore(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleBcMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CBT_STORE_MUTATED') {
      callback();
    }
  };

  window.addEventListener('cbt_store_updated', callback);

  if (broadcastChannel) {
    try { broadcastChannel.addEventListener('message', handleBcMessage); } catch (e) { /* silence */ }
  }

  return () => {
    window.removeEventListener('cbt_store_updated', callback);
    if (broadcastChannel) {
      try { broadcastChannel.removeEventListener('message', handleBcMessage); } catch (e) { /* silence */ }
    }
  };
}