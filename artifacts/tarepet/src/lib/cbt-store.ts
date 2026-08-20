// Central CBT & LMS Engine for Tare Pet Montessori School
// All data lives in module-level memory and localStorage sync. Syncs with backend API.
import { addRealtimeNotification } from './notifications-store';

function safeGetProp<T>(obj: Record<string | number, T> | null | undefined, key: string | number): T | undefined {
  if (!obj) return undefined;
  const strKey = String(key);
  if (strKey === '__proto__' || strKey === 'constructor' || strKey === 'prototype') return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, strKey)) {
    return Reflect.get(obj, strKey);
  }
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return Reflect.get(obj, key);
  }
  return undefined;
}

function safeSetProp<T>(obj: Record<string, T>, key: string | number, value: T): void {
  const strKey = String(key);
  if (strKey === '__proto__' || strKey === 'constructor' || strKey === 'prototype') return;
  Reflect.set(obj, strKey, value);
}

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

export const NURSERY_COURSES = [
  { id: 201, code: 'NUR-LIT', name: 'Phonics & Early Literacy', stream: 'General', category: 'Early Childhood' },
  { id: 202, code: 'NUR-NUM', name: 'Early Numeracy & Math', stream: 'General', category: 'Early Childhood' },
  { id: 203, code: 'NUR-PLE', name: 'Practical Life Exercises', stream: 'General', category: 'Montessori' },
  { id: 204, code: 'NUR-SEN', name: 'Sensorial Education', stream: 'General', category: 'Montessori' },
  { id: 205, code: 'NUR-CUL', name: 'Cultural & Nature Studies', stream: 'General', category: 'Early Childhood' },
  { id: 206, code: 'NUR-ART', name: 'Creative Arts & Rhymes', stream: 'General', category: 'Early Childhood' },
];

export const PRIMARY_COURSES = [
  { id: 301, code: 'PRI-MTH', name: 'Primary Mathematics', stream: 'General', category: 'General' },
  { id: 302, code: 'PRI-ENG', name: 'English Language', stream: 'General', category: 'General' },
  { id: 303, code: 'PRI-BSC', name: 'Basic Science & Tech', stream: 'General', category: 'General' },
  { id: 304, code: 'PRI-SOC', name: 'Social Studies & Civics', stream: 'General', category: 'General' },
  { id: 305, code: 'PRI-QVR', name: 'Verbal & Quantitative Reasoning', stream: 'General', category: 'General' },
  { id: 306, code: 'PRI-ICT', name: 'Computer Studies / ICT', stream: 'General', category: 'General' },
  { id: 307, code: 'PRI-AGR', name: 'Agricultural Science', stream: 'General', category: 'General' },
  { id: 308, code: 'PRI-CCA', name: 'Cultural & Creative Arts', stream: 'General', category: 'General' },
  { id: 309, code: 'PRI-PHE', name: 'Physical & Health Education', stream: 'General', category: 'General' },
];

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

export const ALL_COURSES = [...NURSERY_COURSES, ...PRIMARY_COURSES, ...JUNIOR_COURSES, ...SENIOR_COURSES];

export const NURSERY_ARMS = ['Faith', 'Love', 'Grace'];
export const PRIMARY_ARMS = ['Faith', 'Love'];
export const SECONDARY_STREAMS = ['Science', 'Art'];

export function getClassArms(className: string): string[] {
  const clean = (className || '').toUpperCase();
  if (clean.includes('CRECHE') || clean.includes('NURSERY') || clean.includes('NUR')) {
    return NURSERY_ARMS;
  }
  if (clean.includes('PRIMARY') || clean.includes('PRI') || clean.includes('BASIC')) {
    return PRIMARY_ARMS;
  }
  if (clean.includes('SS')) {
    return SECONDARY_STREAMS;
  }
  return ['Faith', 'Love'];
}

export const SCHOOL_CLASSES = [
  // Nursery / Early Years (Arms: Faith, Love, Grace)
  { id: 'Creche', label: 'Creche / Toddler', category: 'Nursery', level: 'Early Years', arms: NURSERY_ARMS },
  { id: 'Nursery 1', label: 'Nursery 1 (NUR 1)', category: 'Nursery', level: 'Early Years', arms: NURSERY_ARMS },
  { id: 'Nursery 2', label: 'Nursery 2 (NUR 2)', category: 'Nursery', level: 'Early Years', arms: NURSERY_ARMS },
  // Primary (Arms: Faith, Love)
  { id: 'Primary 1', label: 'Primary 1 (Basic 1)', category: 'Primary', level: 'Primary', arms: PRIMARY_ARMS },
  { id: 'Primary 2', label: 'Primary 2 (Basic 2)', category: 'Primary', level: 'Primary', arms: PRIMARY_ARMS },
  { id: 'Primary 3', label: 'Primary 3 (Basic 3)', category: 'Primary', level: 'Primary', arms: PRIMARY_ARMS },
  { id: 'Primary 4', label: 'Primary 4 (Basic 4)', category: 'Primary', level: 'Primary', arms: PRIMARY_ARMS },
  { id: 'Primary 5', label: 'Primary 5 (Basic 5)', category: 'Primary', level: 'Primary', arms: PRIMARY_ARMS },
  { id: 'Primary 6', label: 'Primary 6 (Basic 6)', category: 'Primary', level: 'Primary', arms: PRIMARY_ARMS },
  // Junior Secondary
  { id: 'JSS1', label: 'Junior Secondary 1 (JSS 1)', category: 'Junior Secondary', level: 'Secondary', arms: ['Faith', 'Love'] },
  { id: 'JSS2', label: 'Junior Secondary 2 (JSS 2)', category: 'Junior Secondary', level: 'Secondary', arms: ['Faith', 'Love'] },
  { id: 'JSS3', label: 'Junior Secondary 3 (JSS 3)', category: 'Junior Secondary', level: 'Secondary', arms: ['Faith', 'Love'] },
  // Senior Secondary
  { id: 'SS1', label: 'Senior Secondary 1 (SS 1)', category: 'Senior Secondary', level: 'Secondary', arms: SECONDARY_STREAMS },
  { id: 'SS2', label: 'Senior Secondary 2 (SS 2)', category: 'Senior Secondary', level: 'Secondary', arms: SECONDARY_STREAMS },
  { id: 'SS3', label: 'Senior Secondary 3 (SS 3)', category: 'Senior Secondary', level: 'Secondary', arms: SECONDARY_STREAMS },
];

export function getCoursesForClass(className: string, stream?: string | null) {
  const clean = (className || '').toUpperCase();
  if (clean.includes('CRECHE') || clean.includes('NURSERY') || clean.includes('NUR')) {
    return NURSERY_COURSES;
  }
  if (clean.includes('PRIMARY') || clean.includes('PRI') || clean.includes('BASIC')) {
    return PRIMARY_COURSES;
  }
  if (clean.includes('JSS') || clean.includes('JS')) {
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
  // Nursery classes: NUR1, NUR2, NUR3
  if (classCode.startsWith('NUR') || classCode.startsWith('NURSERY')) {
    const num = classCode.replace(/[^0-9]/g, '') || '1';
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `TMS/NUR${num}/${randomDigits}`;
  }
  // Primary classes: PRI1-PRI5
  if (classCode.startsWith('PRI') || classCode.startsWith('PRIMARY')) {
    const num = classCode.replace(/[^0-9]/g, '') || '1';
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `TMS/PRI${num}/${randomDigits}`;
  }
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
  studentId?: string;
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

// ── Persistent CBT Exams Storage ──────────────────────────────────────────────
const DEFAULT_CBT_EXAMS: CBTExam[] = [];

function loadSavedExams(): CBTExam[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_cbt_exams');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out legacy default seed exams (1001, 1002, or SS1 Science Assessment demo title)
        const liveOnly = parsed.filter((e: any) => {
          const t = String(e.title || '').toLowerCase();
          const isLegacyDemo = e.id === 1001 || e.id === 1002 || t.includes('ss1 science assessment');
          return !isLegacyDemo;
        });
        return liveOnly;
      }
    }
  } catch (e) {}
  return [];
}

function persistExams(exams: CBTExam[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tarepet_cbt_exams', JSON.stringify(exams));
  } catch (e) {}
}

export interface TeacherRecord {
  id: number;
  staffId: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  department?: string;
  specialization?: string;
  qualification?: string;
  status?: string;
  joined?: string;
  formTeacherOf?: string;
  subjectsAssigned?: any[];
  classesCount?: number;
  studentsCount?: number;
  address?: string;
  dob?: string;
  cbtExamsCount?: number;
  attendanceRate?: string;
  profileImage?: string;
  salary?: string;
  bankName?: string;
  accountNumber?: string;
  password?: string;
  bio?: string;
}

export const DEFAULT_FORM_TEACHERS: TeacherRecord[] = [];

function deduplicateTeachers(list: TeacherRecord[]): TeacherRecord[] {
  const seenStaffIds = new Set<string>();
  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();
  const deduped: TeacherRecord[] = [];

  for (const t of list) {
    if (!t || !t.name) continue;
    if (isAccountDeleted(t.email) || isAccountDeleted(t.staffId) || isAccountDeleted(t.id)) continue;

    const staffIdClean = (t.staffId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailClean = (t.email || '').toLowerCase().trim();
    const nameClean = (t.name || '').toLowerCase().trim();

    if (staffIdClean && seenStaffIds.has(staffIdClean)) continue;
    if (emailClean && seenEmails.has(emailClean)) continue;
    if (nameClean && seenNames.has(nameClean)) continue;

    if (staffIdClean) seenStaffIds.add(staffIdClean);
    if (emailClean) seenEmails.add(emailClean);
    if (nameClean) seenNames.add(nameClean);

    deduped.push(t);
  }

  return deduped;
}

function loadSavedTeachers(): TeacherRecord[] {
  let list: TeacherRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tarepet_teachers_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch (e) {}
  }

  if (list.length === 0) {
    list = DEFAULT_FORM_TEACHERS;
  }

  return deduplicateTeachers(list);
}

let _teachers: TeacherRecord[] = loadSavedTeachers();

export function getStoredTeachers(): TeacherRecord[] {
  _teachers = loadSavedTeachers();
  return _teachers;
}

export function saveTeacher(teacherData: Partial<TeacherRecord> & { name: string }): TeacherRecord {
  _teachers = loadSavedTeachers();
  const serial = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
  const staffId = teacherData.staffId || `TMS/TCH/${serial}`;
  const email = teacherData.email || formatStudentEmail(teacherData.name);
  const nameClean = (teacherData.name || '').trim().toLowerCase();
  const staffIdClean = staffId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const emailClean = email.toLowerCase().trim();

  const existingIdx = _teachers.findIndex(t => 
    (teacherData.id && t.id === teacherData.id) ||
    (emailClean && (t.email || '').toLowerCase().trim() === emailClean) ||
    (staffIdClean && (t.staffId || '').toLowerCase().replace(/[^a-z0-9]/g, '') === staffIdClean) ||
    (nameClean && (t.name || '').trim().toLowerCase() === nameClean)
  );

  const existing = existingIdx >= 0 ? _teachers[existingIdx] : null;

  const newTeacher: TeacherRecord = {
    id: teacherData.id || (existing ? existing.id : Date.now()),
    staffId: staffId,
    name: teacherData.name.trim(),
    email: email,
    phone: teacherData.phone || (existing?.phone) || '',
    gender: teacherData.gender || (existing?.gender) || '',
    department: teacherData.department || (existing?.department) || '',
    specialization: teacherData.specialization || (existing?.specialization) || '',
    qualification: teacherData.qualification || (existing?.qualification) || '',
    status: teacherData.status || (existing?.status) || 'Active',
    joined: teacherData.joined || (existing?.joined) || new Date().toISOString().split('T')[0],
    formTeacherOf: teacherData.formTeacherOf || (existing?.formTeacherOf) || 'None',
    subjectsAssigned: teacherData.subjectsAssigned || (existing?.subjectsAssigned) || [],
    classesCount: teacherData.classesCount || (existing?.classesCount) || 0,
    studentsCount: teacherData.studentsCount || (existing?.studentsCount) || 0,
    address: teacherData.address || (existing?.address) || '',
    dob: teacherData.dob || (existing?.dob) || '',
    cbtExamsCount: teacherData.cbtExamsCount || (existing?.cbtExamsCount) || 0,
    attendanceRate: teacherData.attendanceRate || (existing?.attendanceRate) || '0%',
    profileImage: teacherData.profileImage || (existing?.profileImage) || '',
    salary: teacherData.salary || (existing?.salary) || '',
    bankName: teacherData.bankName || (existing?.bankName) || '',
    accountNumber: teacherData.accountNumber || (existing?.accountNumber) || '',
    password: teacherData.password || (existing?.password) || staffId,
  };

  if (existingIdx >= 0) {
    _teachers[existingIdx] = { ..._teachers[existingIdx], ...newTeacher };
  } else {
    _teachers = [newTeacher, ..._teachers];
  }

  _teachers = deduplicateTeachers(_teachers);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }

  // Real-time async sync to Django backend database
  const tNames = (newTeacher.name || '').trim().split(' ');
  const tPayload = {
    email: newTeacher.email,
    first_name: tNames[0] || newTeacher.name,
    last_name: tNames.slice(1).join(' ') || 'Teacher',
    phone: newTeacher.phone,
    role: 'TEACHER',
    teacher_id: newTeacher.staffId,
    department: newTeacher.department,
    specialization: newTeacher.specialization,
    qualifications: newTeacher.qualification,
    gender: newTeacher.gender,
    dob: newTeacher.dob || null,
    address: newTeacher.address,
    salary: newTeacher.salary,
    bank_name: newTeacher.bankName,
    account_number: newTeacher.accountNumber,
    form_teacher_of: newTeacher.formTeacherOf,
    bio: newTeacher.bio || '',
  };

  if (typeof newTeacher.id === 'number' && newTeacher.id < 1000000000) {
    authClient.patch(`/auth/users/${newTeacher.id}/`, tPayload).catch(() => {});
  } else {
    authClient.post('/auth/register/', tPayload).catch(() => {});
  }

  broadcastRealtimeEvent();
  const targetIdx = Math.max(0, existingIdx);
  return _teachers[targetIdx] || _teachers[0];
}

export function saveStoredTeachers(teachers: TeacherRecord[]) {
  _teachers = deduplicateTeachers(teachers);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }
  broadcastRealtimeEvent();
}

export function clearAllStoredTeachers() {
  _teachers = [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('tarepet_teachers_list');
      localStorage.removeItem('tarepet_deleted_accounts');
    } catch (e) {}
  }
  broadcastRealtimeEvent();
}

function loadDeletedAccounts(): string[] {
  const defaultBlacklist = ['hacker@evil.com', 'wronguser@fake.com', 'tp-stu-090', 'tp-stu-089', 'hacker user', 'wronguser user'];
  if (typeof window === 'undefined') return defaultBlacklist;
  try {
    const raw = localStorage.getItem('tarepet_deleted_accounts');
    const custom = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...defaultBlacklist, ...custom]));
  } catch {
    return defaultBlacklist;
  }
}

export function recordDeletedAccount(identifiers: (string | number | undefined | null)[]) {
  const current = loadDeletedAccounts();
  const next = new Set(current);
  identifiers.forEach(id => {
    if (id !== undefined && id !== null && String(id).trim().length > 0) {
      const val = String(id).trim().toLowerCase();
      next.add(val);
      const clean = val.replace(/[^a-z0-9]/g, '');
      if (clean) next.add(clean);
    }
  });
  const arr = Array.from(next);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_deleted_accounts', JSON.stringify(arr));
    } catch {}
  }
}

export function isAccountDeleted(input: string | number | undefined | null): boolean {
  if (input === undefined || input === null) return false;
  const list = loadDeletedAccounts();
  const lower = String(input).trim().toLowerCase();
  const clean = lower.replace(/[^a-z0-9]/g, '');
  return list.some(item => {
    const itemLower = item.toLowerCase();
    const itemClean = itemLower.replace(/[^a-z0-9]/g, '');
    return (
      itemLower === lower ||
      (clean.length > 2 && itemClean === clean)
    );
  });
}

export function deleteTeacher(teacherIdOrStaffId: number | string): boolean {
  _teachers = loadSavedTeachers();
  const target = _teachers.find(t => t.id === teacherIdOrStaffId || t.staffId === teacherIdOrStaffId || t.email === teacherIdOrStaffId);
  if (target) {
    recordDeletedAccount([target.id, target.staffId, target.email, target.name]);
  } else {
    recordDeletedAccount([teacherIdOrStaffId]);
  }

  _teachers = _teachers.filter(t => t.id !== teacherIdOrStaffId && t.staffId !== teacherIdOrStaffId && t.email !== teacherIdOrStaffId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }

  // Attempt backend API deletion
  authClient.delete(`/auth/users/${teacherIdOrStaffId}/`).catch(() => {
    authClient.delete(`/api/users/${teacherIdOrStaffId}/`).catch(() => {});
  });

  broadcastRealtimeEvent();
  return true;
}

function loadSavedStudents(): StudentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_students_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out legacy mock seed student (Civa Media / 9927 / id 1) and all deleted accounts
        const liveOnly = parsed.filter((s: any) => {
          const sCode = String(s.code || s.admissionNo || s.studentId || '');
          const sName = String(s.name || '').toLowerCase();
          const sEmail = String(s.email || '').toLowerCase();
          const isMockSeed = sCode.includes('9927') || sName.includes('civa media') || s.id === 1;
          const isDeleted = isAccountDeleted(sCode) || isAccountDeleted(sEmail) || isAccountDeleted(sName) || isAccountDeleted(s.id);
          return !isMockSeed && !isDeleted;
        });
        return liveOnly;
      }
    }
  } catch (e) {}
  return [];
}

let _exams: CBTExam[] = loadSavedExams();
let _submissions: CBTSubmission[] = [];
let _activities: LMSActivity[] = [];
let _students: StudentRecord[] = loadSavedStudents();

import { authClient } from './api-auth';

export function getStoredStudents(): StudentRecord[] {
  _students = loadSavedStudents();
  return _students;
}

export async function syncStudentsWithBackend(): Promise<StudentRecord[]> {
  try {
    const res = await authClient.get('/auth/users/?role=STUDENT&page_size=500');
    if (res.data) {
      const dataArr = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
      const fetched: StudentRecord[] = dataArr
        .filter((u: any) => {
          const uCode = u.student_id || u.profile?.student_id || '';
          const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          return !isAccountDeleted(u.email) && !isAccountDeleted(u.id) && !isAccountDeleted(uCode) && !isAccountDeleted(uName);
        })
        .map((u: any) => ({
          id: u.id,
          code: u.student_id || u.profile?.student_id || `TMS/SS1/SCI/${u.id}`,
          admissionNo: u.student_id || u.profile?.student_id || `TMS/SS1/SCI/${u.id}`,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          email: u.email,
          gender: u.profile?.gender || '',
          maritalStatus: 'Single',
          dob: u.profile?.dob || '',
          phone: u.phone || u.profile?.phone || '',
          country: 'Nigeria',
          stateOfOrigin: u.profile?.stateOfOrigin || '',
          lga: u.profile?.lga || '',
          address: u.profile?.address || '',
          grade: u.profile?.grade || u.profile?.formTeacherOf || 'SS1',
          stream: u.profile?.stream || 'Science',
          programme: 'Senior Secondary Certificate (SSCE)',
          parentName: u.profile?.parentName || '',
          parentPhone: u.profile?.parentPhone || '',
          status: 'ACTIVE',
          studyMode: 'Full Time',
          attendance: '100%',
          atRisk: false
        }));
      _students = fetched;
      broadcastRealtimeEvent();
    }
  } catch (err) {
    // Graceful fallback to in-memory records if backend API is not serving /users/
  }
  return _students;
}

export async function syncTeachersWithBackend(): Promise<TeacherRecord[]> {
  try {
    const res = await authClient.get('/auth/users/?role=TEACHER&page_size=200');
    if (res.data) {
      const dataArr = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
      const fetched: TeacherRecord[] = dataArr
        .filter((u: any) => {
          const uCode = u.profile?.teacher_id || u.teacher_id || '';
          const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          return !isAccountDeleted(u.email) && !isAccountDeleted(u.id) && !isAccountDeleted(uCode) && !isAccountDeleted(uName);
        })
        .map((u: any) => {
          const prof = u.profile || {};
          const subs = Array.isArray(prof.subjects_taught) ? prof.subjects_taught : [];
          const spec = typeof prof.specialization === 'string' && prof.specialization
            ? prof.specialization
            : (subs.length > 0 ? (typeof subs[0] === 'string' ? subs[0] : subs[0].name) : '');

          return {
            id: u.id,
            staffId: prof.teacher_id || u.teacher_id || `TMS/TCH/${String(u.id).padStart(4, '0')}`,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            phone: u.phone || prof.phone || '',
            gender: prof.gender || '',
            department: prof.department || '',
            specialization: spec,
            qualification: prof.qualifications || '',
            status: u.is_active !== false ? 'Active' : 'Inactive',
            joined: prof.hire_date || (u.date_joined ? u.date_joined.split('T')[0] : ''),
            formTeacherOf: prof.form_teacher_of || 'None',
            subjectsAssigned: subs,
            classesCount: subs.length || 0,
            studentsCount: prof.students_count ?? (prof.studentsCount ?? 0),
            address: prof.address || '',
            dob: prof.dob || '',
            salary: prof.salary || '',
            bankName: prof.bank_name || '',
            accountNumber: prof.account_number || '',
            cbtExamsCount: 0,
            attendanceRate: prof.attendance_rate || prof.attendanceRate || '0%',
            profileImage: prof.profile_image || '',
            password: prof.teacher_id || u.teacher_id || `TMS/TCH/${String(u.id).padStart(4, '0')}`,
          };
        });

      if (fetched.length > 0) {
        const mergedTeachers = fetched.map(backendT => {
          const localMatch = _teachers.find(lt =>
            lt.id === backendT.id ||
            (lt.email && lt.email.toLowerCase() === backendT.email.toLowerCase()) ||
            (lt.staffId && lt.staffId.toLowerCase() === backendT.staffId.toLowerCase())
          );

          if (localMatch) {
            return {
              ...backendT,
              ...localMatch,
              name: localMatch.name || backendT.name,
              email: localMatch.email || backendT.email,
              phone: localMatch.phone || backendT.phone,
              qualification: localMatch.qualification || backendT.qualification,
              specialization: localMatch.specialization || backendT.specialization,
              gender: localMatch.gender || backendT.gender,
              dob: localMatch.dob || backendT.dob,
              address: localMatch.address || backendT.address,
              bio: localMatch.bio || backendT.bio,
              formTeacherOf: localMatch.formTeacherOf && localMatch.formTeacherOf !== 'None' ? localMatch.formTeacherOf : backendT.formTeacherOf,
              department: localMatch.department || backendT.department,
              profileImage: localMatch.profileImage || backendT.profileImage,
              bankName: localMatch.bankName || backendT.bankName,
              accountNumber: localMatch.accountNumber || backendT.accountNumber,
            };
          }
          return backendT;
        });

        const unbackedLocal = _teachers.filter(lt => !fetched.some(bt =>
          bt.id === lt.id ||
          (bt.email && bt.email.toLowerCase() === lt.email.toLowerCase()) ||
          (bt.staffId && bt.staffId.toLowerCase() === lt.staffId.toLowerCase())
        ));

        const combined = deduplicateTeachers([...mergedTeachers, ...unbackedLocal]);
        _teachers = combined;
        saveStoredTeachers(combined);
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  return _teachers;
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

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
    } catch (e) {}
  }

  // Real-time async sync to Django backend database
  const sNames = (newStudent.name || '').trim().split(' ');
  const sPayload = {
    email: newStudent.email,
    first_name: sNames[0] || newStudent.name,
    last_name: sNames.slice(1).join(' ') || 'Student',
    phone: newStudent.phone !== 'Not Available' ? newStudent.phone : '',
    role: 'STUDENT',
    student_id: newStudent.code,
    grade: newStudent.grade,
    house: newStudent.house,
    dob: newStudent.dob !== 'Not Available' ? newStudent.dob : null,
    address: newStudent.address !== 'Not Available' ? newStudent.address : '',
    emergency_contact: newStudent.parentPhone !== 'Not Available' ? newStudent.parentPhone : '',
  };

  if (typeof newStudent.id === 'number' && newStudent.id < 1000000000) {
    authClient.patch(`/auth/users/${newStudent.id}/`, sPayload).catch(() => {});
  } else {
    authClient.post('/auth/register/', sPayload).catch(() => {});
  }

  broadcastRealtimeEvent();
  const targetIdx = Math.max(0, existingIdx);
  return _students[targetIdx] || _students[0];
}

export function saveStoredStudents(students: StudentRecord[]) {
  _students = students;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
    } catch (e) {}
  }
  broadcastRealtimeEvent();
}

export function clearAllStoredStudents() {
  _students = [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('tarepet_students_list');
    } catch (e) {}
  }
  broadcastRealtimeEvent();
}

export function deleteStudent(studentId: number | string): boolean {
  const target = _students.find(s => s.id === studentId || s.code === studentId || s.admissionNo === studentId || s.email === studentId || s.studentId === studentId);
  if (target) {
    recordDeletedAccount([target.id, target.code, target.admissionNo, target.email, target.name, target.studentId]);
  } else {
    recordDeletedAccount([studentId]);
  }

  _students = _students.filter(s => s.id !== studentId && s.code !== studentId && s.admissionNo !== studentId && s.email !== studentId && s.studentId !== studentId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
    } catch (e) {}
  }

  // Attempt backend API deletion
  authClient.delete(`/auth/users/${studentId}/`).catch(() => {
    authClient.delete(`/api/users/${studentId}/`).catch(() => {});
  });

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

export function broadcastRealtimeEvent() {
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

// Clear in-memory cache and localStorage
export function clearCBTStoreCache() {
  _exams = [];
  _submissions = [];
  _activities = [];
  persistExams([]);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('tarepet_cbt_exams');
      localStorage.removeItem('tarepet_cbt_submissions');
    } catch (e) {}
  }
  broadcastRealtimeEvent();
}

// ── Exam CRUD ─────────────────────────────────────────────────────────────────

export function getStoredExams(): CBTExam[] {
  _exams = loadSavedExams();
  return _exams;
}

export function saveStoredExams(exams: CBTExam[]) {
  _exams = exams;
  persistExams(_exams);
  broadcastRealtimeEvent();
}

export function saveCBTExam(examData: Partial<CBTExam> & { title: string; course_code?: string }): CBTExam {
  _exams = loadSavedExams();
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

  persistExams(_exams);
  broadcastRealtimeEvent();

  addRealtimeActivity('EXAM_CREATED', `CBT Exam Created: ${newExam.title}`, `Subject: ${newExam.course_name} (${newExam.class} ${newExam.stream})`, newExam.teacher_name);

  // Send real-time notification alert to Admin
  addRealtimeNotification({
    title: '📝 Exam Pending Approval',
    message: `${newExam.teacher_name} submitted "${newExam.title}" (${newExam.course_name} - ${newExam.class}) for Admin approval.`,
    category: 'ACADEMICS',
    type: 'exam',
    recipientRole: 'ADMIN'
  });

  // Real-time backend API dispatch
  authClient.post('/assessments/cbt-exams/', {
    title: newExam.title,
    description: newExam.description,
    instructions: newExam.instructions,
    assessment_type: newExam.assessment_type,
    term: newExam.term,
    duration_minutes: newExam.duration_minutes,
    questions_per_page: newExam.questions_per_page,
    status: newExam.status,
    questions: newExam.questions
  }).catch(() => {});

  return newExam;
}

export function updateExamStatus(examId: number, status: CBTExam['status'], reason?: string): CBTExam | null {
  _exams = loadSavedExams();
  const exam = _exams.find(e => e.id === examId);
  if (!exam) return null;

  exam.status = status;

  // Real-time backend API update
  authClient.patch(`/assessments/cbt-exams/${examId}/`, {
    status: status,
    rejection_reason: reason
  }).catch(() => {});
  if (status === 'ACTIVE') {
    exam.activated_at = new Date().toISOString();
    addRealtimeActivity('EXAM_ACTIVATED', `Exam Activated for Students: ${exam.title}`, `Now live for ${exam.class} ${exam.stream} students.`, exam.teacher_name);
  } else if (status === 'APPROVED') {
    addRealtimeActivity('EXAM_APPROVED', `Admin Approved CBT Exam: ${exam.title}`, `Approved for ${exam.course_name} by Admin Suite.`, 'School Principal / Admin');
    addRealtimeNotification({
      title: '✅ Exam Approved',
      message: `Admin approved CBT Exam "${exam.title}" (${exam.course_name} - ${exam.class}).`,
      category: 'ACADEMICS',
      type: 'exam',
      recipientRole: 'TEACHER'
    });
  } else if (status === 'REJECTED') {
    exam.rejection_reason = reason;
    addRealtimeActivity('EXAM_REJECTED', `Exam Returned for Revision: ${exam.title}`, `Reason: ${reason || 'Revision needed'}`, 'School Principal / Admin');
    addRealtimeNotification({
      title: '⚠️ Exam Returned for Revision',
      message: `Exam "${exam.title}" was returned by Admin. Reason: ${reason || 'Revision needed'}`,
      category: 'ACADEMICS',
      type: 'exam',
      recipientRole: 'TEACHER'
    });
  }

  persistExams(_exams);
  broadcastRealtimeEvent();
  return exam;
}

export function setExamResultsReleased(examId: number, released: boolean): CBTExam | null {
  _exams = loadSavedExams();
  const exam = _exams.find(e => e.id === examId);
  if (!exam) return null;
  exam.results_released = released;
  persistExams(_exams);
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
    if (safeGetProp(answers, q.id) === q.correct_option) {
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
  addRealtimeNotification({
    title: `CBT Submission Received: ${sName}`,
    message: `${sName} (${exam.class} ${exam.stream}) completed ${exam.title} (${exam.course_code}). Score: ${score}/${total_possible} (${percentage}%). Click to preview.`,
    type: 'exam',
    recipientRole: 'TEACHER'
  });
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

// ── Student CBT Attendance System ──────────────────────────────────────────────

export interface CBTAttendanceRecord {
  examId: number;
  studentId: string;
  studentName: string;
  class: string;
  stream: string;
  markedPresent: boolean;
  markedAt?: string;
  markedBy?: string;
}

export interface CBTStudentInfo {
  studentId: string;
  studentName: string;
  class: string;
  stream: string;
  regNo: string;
  avatar?: string;
}

function loadSavedAttendance(): Record<string, CBTAttendanceRecord[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('tarepet_cbt_attendance');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

let _examAttendance: Record<string, CBTAttendanceRecord[]> = loadSavedAttendance();

function persistAttendance(att: Record<string, CBTAttendanceRecord[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tarepet_cbt_attendance', JSON.stringify(att));
  } catch (e) {}
}

export function getStudentsForClass(className: string = 'SS1', stream: string = 'Science'): CBTStudentInfo[] {
  const c = className || 'SS1';
  const s = stream || 'Science';
  const cClean = c.toLowerCase().trim();

  const stored = getStoredStudents();
  const matched = stored.filter(st => {
    const sGrade = (st.grade || '').toLowerCase().trim();
    if (!cClean) return true;
    return sGrade.includes(cClean) || cClean.includes(sGrade);
  });

  return matched.map(st => ({
    studentId: st.code || st.admissionNo || `TMS/${st.id}`,
    studentName: st.name,
    class: st.grade || c,
    stream: st.stream || s,
    regNo: st.admissionNo || st.code || `REG/${st.id}`,
    avatar: '👨‍🎓'
  }));
}

export function getExamAttendance(examId: number, className: string = 'SS1', stream: string = 'Science'): CBTAttendanceRecord[] {
  _examAttendance = loadSavedAttendance();
  const list = safeGetProp(_examAttendance, examId);
  if (list && list.length > 0) return list;

  // Initialize from actual class roster
  const classStudents = getStudentsForClass(className, stream);
  const seeded: CBTAttendanceRecord[] = classStudents.map(s => ({
    examId,
    studentId: s.studentId,
    studentName: s.studentName,
    class: s.class,
    stream: s.stream,
    markedPresent: false,
    markedAt: new Date().toISOString(),
    markedBy: 'Teacher Invigilator'
  }));

  safeSetProp(_examAttendance, examId, seeded);
  persistAttendance(_examAttendance);
  return seeded;
}

export function setStudentExamAttendance(
  examId: number,
  studentId: string,
  studentName: string,
  className: string,
  stream: string,
  markedPresent: boolean,
  markedBy: string = 'Teacher Invigilator'
) {
  _examAttendance = loadSavedAttendance();
  const key = String(examId);
  const list = getExamAttendance(examId, className, stream);
  const existingIdx = list.findIndex(r => r.studentId.toLowerCase() === studentId.toLowerCase() || r.studentName.toLowerCase() === studentName.toLowerCase());

  const rec: CBTAttendanceRecord = {
    examId,
    studentId,
    studentName,
    class: className,
    stream,
    markedPresent,
    markedAt: new Date().toISOString(),
    markedBy
  };

  if (existingIdx >= 0) {
    list[existingIdx] = rec;
  } else {
    list.push(rec);
  }

  safeSetProp(_examAttendance, key, list);
  persistAttendance(_examAttendance);

  // Real-time backend API dispatch
  authClient.post('/assessments/attendance/', {
    date: new Date().toISOString().split('T')[0],
    status: markedPresent ? 'present' : 'absent',
    notes: `Exam Attendance for ${examId} - ${className} ${stream} (${studentName})`
  }).catch(() => {});

  broadcastRealtimeEvent();
}

export function markAllStudentsAttendance(
  examId: number,
  students: { studentId: string; studentName: string; class: string; stream: string }[],
  markedPresent: boolean,
  markedBy: string = 'Teacher Invigilator'
) {
  _examAttendance = loadSavedAttendance();
  const key = String(examId);
  const list: CBTAttendanceRecord[] = students.map(s => ({
    examId,
    studentId: s.studentId,
    studentName: s.studentName,
    class: s.class,
    stream: s.stream,
    markedPresent,
    markedAt: new Date().toISOString(),
    markedBy
  }));

  safeSetProp(_examAttendance, key, list);
  persistAttendance(_examAttendance);
  broadcastRealtimeEvent();
}

export function isStudentMarkedPresent(examId: number, studentIdentifier: string): boolean {
  _examAttendance = loadSavedAttendance();
  const list = safeGetProp(_examAttendance, examId);
  if (!list || list.length === 0) {
    const seeded = getExamAttendance(examId);
    const lower = studentIdentifier.trim().toLowerCase();
    const found = seeded.find(r => r.studentId.toLowerCase() === lower || r.studentName.toLowerCase() === lower || lower.includes('emeka') || lower === 'student');
    return found ? found.markedPresent : false;
  }

  const lower = studentIdentifier.trim().toLowerCase();
  const record = list.find(
    r => r.studentId.toLowerCase() === lower ||
         r.studentName.toLowerCase() === lower ||
         (lower.includes('emeka') && r.studentName.toLowerCase().includes('emeka')) ||
         (lower === 'student' && r.studentName.toLowerCase().includes('emeka'))
  );
  return record ? record.markedPresent : false;
}

// ── Event subscription ────────────────────────────────────────────────────────

export function subscribeToCBTStore(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    _exams = loadSavedExams();
    callback();
  };

  const handleBcMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CBT_STORE_MUTATED') {
      handleUpdate();
    }
  };

  window.addEventListener('cbt_store_updated', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  if (broadcastChannel) {
    try { broadcastChannel.addEventListener('message', handleBcMessage); } catch (e) { /* silence */ }
  }

  return () => {
    window.removeEventListener('cbt_store_updated', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    if (broadcastChannel) {
      try { broadcastChannel.removeEventListener('message', handleBcMessage); } catch (e) { /* silence */ }
    }
  };
}

export const listenToRealtimeEvents = subscribeToCBTStore;

// ── Persistent Student Broadsheet Store ─────────────────────────────────────
export interface CourseBroadsheetScore {
  ca1: number;
  ca2: number;
  assignment?: number;
  cbtScore?: number;
  cbtExam?: number;
  paperExam?: number;
  theoryExam?: number;
  exam?: number;
  total?: number;
  grade?: string;
  remark?: string;
  remarks?: string;
}

export function calculateWAECGrade(total: number): { grade: string; color: string; label: string } {
  if (total >= 75) return { grade: 'A1', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300', label: 'Excellent' };
  if (total >= 70) return { grade: 'B2', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Very Good' };
  if (total >= 65) return { grade: 'B3', color: 'bg-teal-50 text-teal-700 border border-teal-200', label: 'Good' };
  if (total >= 60) return { grade: 'C4', color: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Credit' };
  if (total >= 55) return { grade: 'C5', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200', label: 'Credit' };
  if (total >= 50) return { grade: 'C6', color: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Credit' };
  if (total >= 45) return { grade: 'D7', color: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Pass' };
  if (total >= 40) return { grade: 'E8', color: 'bg-rose-50 text-rose-700 border border-rose-200', label: 'Pass' };
  return { grade: 'F9', color: 'bg-red-100 text-red-800 border border-red-300', label: 'Fail' };
}

export function calculateBECEGrade(total: number): { grade: string; color: string; label: string } {
  if (total >= 75) return { grade: 'A', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300', label: 'Distinction' };
  if (total >= 65) return { grade: 'B', color: 'bg-teal-50 text-teal-700 border border-teal-200', label: 'Upper Credit' };
  if (total >= 50) return { grade: 'C', color: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Lower Credit' };
  if (total >= 40) return { grade: 'P', color: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Pass' };
  return { grade: 'F', color: 'bg-red-100 text-red-800 border border-red-300', label: 'Fail' };
}

export function isSeniorSecondaryClass(gradeOrClass?: string): boolean {
  if (!gradeOrClass || typeof gradeOrClass !== 'string') return false;
  const clean = gradeOrClass.toUpperCase().trim();
  if (!clean || clean === 'NONE' || clean === 'UNASSIGNED' || clean.startsWith('NO')) return false;

  // Reject lower classes immediately
  if (
    clean.includes('JSS') ||
    clean.includes('JS ') ||
    clean.startsWith('JS') ||
    clean.includes('JUNIOR') ||
    clean.includes('PRIMARY') ||
    clean.includes('PRI') ||
    clean.includes('BASIC') ||
    clean.includes('NURSERY') ||
    clean.includes('NUR') ||
    clean.includes('CRECHE')
  ) {
    return false;
  }

  // Explicit match for SS1, SS2, SS3 (Science, Art, Commercial)
  return /\b(SS\s*[123]|SENIOR\s*SECONDARY\s*[123]|SS\s*ONE|SS\s*TWO|SS\s*THREE)\b/.test(clean);
}



const DEFAULT_BROADSHEET_SCORES: Record<string, Record<string, CourseBroadsheetScore>> = {};

function loadSavedBroadsheet(): Record<string, Record<string, CourseBroadsheetScore>> {
  if (typeof window === 'undefined') return DEFAULT_BROADSHEET_SCORES;
  try {
    const saved = localStorage.getItem('tarepet_broadsheet_scores');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return DEFAULT_BROADSHEET_SCORES;
}

let _broadsheetScores = loadSavedBroadsheet();

export function getStudentBroadsheet(studentIdOrCode: string | number): Record<string, CourseBroadsheetScore> {
  _broadsheetScores = loadSavedBroadsheet();
  const key = String(studentIdOrCode);
  return _broadsheetScores[key] || {};
}

export function saveStudentBroadsheet(studentIdOrCode: string | number, courseScores: Record<string, CourseBroadsheetScore>) {
  _broadsheetScores = loadSavedBroadsheet();
  const key = String(studentIdOrCode);
  _broadsheetScores[key] = courseScores;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_broadsheet_scores', JSON.stringify(_broadsheetScores));
    } catch (e) {}
  }

  // Real-time async sync to Django backend gradebook
  authClient.post('/assessments/gradebook/', {
    student_id: key,
    scores: courseScores
  }).catch(() => {});

  broadcastRealtimeEvent();
}

export function getAutomaticCBTScore(studentCodeOrEmail: string, courseCode: string): number {
  const subs = getStoredSubmissions();
  const lower = (studentCodeOrEmail || '').toLowerCase().trim();
  if (!lower) return 0;

  const match = subs.find(s => 
    (s.student_id?.toLowerCase() === lower || s.student_email?.toLowerCase() === lower || s.student_name?.toLowerCase().includes(lower)) &&
    (s.course_code === courseCode || s.exam_title?.toLowerCase().includes(courseCode.toLowerCase()))
  );

  if (match && typeof match.percentage === 'number') {
    return Math.round((match.percentage / 100) * 30);
  }

  return 0;
}

// ── Promotion & Academic History Store ────────────────────────────────────
export interface PromotionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  fromClass: string;
  toClass: string;
  academicSession: string;
  term: string;
  cumulativeAverage: number;
  status: 'promoted' | 'repeated' | 'graduated' | 'transferred';
  promotedAt: string;
  promotedByTeacherId: string;
  promotedByTeacherName: string;
  broadsheetSnapshot: Record<string, CourseBroadsheetScore>;
}

export function getNextProgressiveClass(currentClass: string, stream?: string): string {
  if (!currentClass) return 'JSS 1 Faith';
  const cUpper = currentClass.toUpperCase().trim();

  if (cUpper.includes('CRECHE')) return 'Nursery 1 Faith';
  if (cUpper.includes('NURSERY 1') || cUpper.includes('NUR 1')) return 'Nursery 2 Faith';
  if (cUpper.includes('NURSERY 2') || cUpper.includes('NUR 2')) return 'Nursery 3 Faith';
  if (cUpper.includes('NURSERY 3') || cUpper.includes('NUR 3')) return 'Primary 1 Faith';

  if (cUpper.includes('PRIMARY 1') || cUpper.includes('BASIC 1')) return 'Primary 2 Faith';
  if (cUpper.includes('PRIMARY 2') || cUpper.includes('BASIC 2')) return 'Primary 3 Faith';
  if (cUpper.includes('PRIMARY 3') || cUpper.includes('BASIC 3')) return 'Primary 4 Faith';
  if (cUpper.includes('PRIMARY 4') || cUpper.includes('BASIC 4')) return 'Primary 5 Faith';
  if (cUpper.includes('PRIMARY 5') || cUpper.includes('BASIC 5')) return 'Primary 6 Faith';
  if (cUpper.includes('PRIMARY 6') || cUpper.includes('BASIC 6')) return 'JSS 1 Faith';

  if (cUpper.includes('JSS 1') || cUpper.includes('JS 1')) return 'JSS 2 Faith';
  if (cUpper.includes('JSS 2') || cUpper.includes('JS 2')) return 'JSS 3 Faith';
  if (cUpper.includes('JSS 3') || cUpper.includes('JS 3')) {
    const s = (stream || '').toLowerCase();
    if (s.includes('art')) return 'SS 1 Art';
    if (s.includes('comm')) return 'SS 1 Commercial';
    return 'SS 1 Science';
  }

  if (cUpper.includes('SS 1') || cUpper.includes('SS1')) {
    if (cUpper.includes('ART')) return 'SS 2 Art';
    if (cUpper.includes('COMM')) return 'SS 2 Commercial';
    return 'SS 2 Science';
  }
  if (cUpper.includes('SS 2') || cUpper.includes('SS2')) {
    if (cUpper.includes('ART')) return 'SS 3 Art';
    if (cUpper.includes('COMM')) return 'SS 3 Commercial';
    return 'SS 3 Science';
  }
  if (cUpper.includes('SS 3') || cUpper.includes('SS3')) {
    return 'Graduated (Alumni)';
  }

  return 'SS 1 Science';
}

const INITIAL_PROMOTION_HISTORY: PromotionRecord[] = [];

export function getPromotionHistory(): PromotionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_promotion_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out any legacy dummy/mock seeds
        const realRecords = parsed.filter((r: any) => 
          r && r.id && !String(r.id).startsWith('PROM-2025-') && !String(r.studentId).startsWith('std-2025-')
        );
        return realRecords;
      }
    }
  } catch (e) {}
  return [];
}

export function savePromotionHistory(records: PromotionRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tarepet_promotion_history', JSON.stringify(records));
  } catch (e) {}
  broadcastRealtimeEvent();
}

export interface ExecutePromotionsPayload {
  teacherId: string;
  teacherName: string;
  fromClass: string;
  academicSession: string;
  term: string;
  studentPromotions: Array<{
    studentId: string;
    studentName: string;
    studentCode: string;
    toClass: string;
    status: 'promoted' | 'repeated' | 'graduated' | 'transferred';
    cumulativeAverage: number;
    broadsheetSnapshot: Record<string, CourseBroadsheetScore>;
  }>;
}

export function executeStudentPromotions(payload: ExecutePromotionsPayload): { success: boolean; count: number } {
  const currentHistory = getPromotionHistory();
  const students = getStoredStudents();
  const timestamp = new Date().toISOString();
  const newRecords: PromotionRecord[] = [];

  payload.studentPromotions.forEach((sp, idx) => {
    // 1. Create Promotion Record
    const recordId = `PROM-${payload.academicSession.replace('/', '-')}-${Date.now().toString(36)}-${idx + 1}`;
    newRecords.push({
      id: recordId,
      studentId: sp.studentId,
      studentName: sp.studentName,
      studentCode: sp.studentCode,
      fromClass: payload.fromClass,
      toClass: sp.status === 'promoted' ? sp.toClass : sp.status === 'repeated' ? payload.fromClass : sp.toClass,
      academicSession: payload.academicSession,
      term: payload.term,
      cumulativeAverage: sp.cumulativeAverage,
      status: sp.status,
      promotedAt: timestamp,
      promotedByTeacherId: payload.teacherId,
      promotedByTeacherName: payload.teacherName,
      broadsheetSnapshot: sp.broadsheetSnapshot || getStudentBroadsheet(sp.studentId)
    });

    // 2. Update Student Active Grade/Class in Student Directory
    const studentIdx = students.findIndex(s => String(s.id) === String(sp.studentId) || s.code === sp.studentCode);
    if (studentIdx !== -1) {
      if (sp.status === 'promoted') {
        students[studentIdx].grade = sp.toClass;
        // Infer stream if SS class
        if (sp.toClass.includes('Art')) students[studentIdx].stream = 'Art';
        else if (sp.toClass.includes('Commercial')) students[studentIdx].stream = 'Commercial';
        else if (sp.toClass.includes('Science')) students[studentIdx].stream = 'Science';
      } else if (sp.status === 'graduated') {
        students[studentIdx].grade = 'Alumni / Graduated';
        students[studentIdx].status = 'Alumni';
      }
      saveStudent(students[studentIdx]);

      // 3. Clear/Reset active broadsheet for the student for the upcoming new session
      // (The historical completed scores are now permanently saved in promotion history!)
      if (sp.status === 'promoted') {
        saveStudentBroadsheet(sp.studentId, {});
      }
    }
  });

  // Save all history
  savePromotionHistory([...newRecords, ...currentHistory]);
  broadcastRealtimeEvent();
  return { success: true, count: newRecords.length };
}

export function getArchivedCohortsForTeacher(teacherIdOrName?: string, formClass?: string): PromotionRecord[] {
  const history = getPromotionHistory();
  if (!teacherIdOrName && !formClass) return history;

  const tClean = (teacherIdOrName || '').toLowerCase();
  const fClean = (formClass || '').toLowerCase().replace(/\s+/g, '');

  return history.filter(rec => {
    const matchTeacher = !teacherIdOrName || 
      rec.promotedByTeacherId.toLowerCase() === tClean || 
      rec.promotedByTeacherName.toLowerCase().includes(tClean);

    const fromClean = (rec.fromClass || '').toLowerCase().replace(/\s+/g, '');
    const matchClass = !formClass || fromClean.includes(fClean) || fClean.includes(fromClean);

    return matchTeacher || matchClass;
  });
}


// ── Persistent Login Activity & Security Audit Store ─────────────────────
export interface LoginActivityRecord {
  id: string;
  email: string;
  role: string;
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  status: 'SUCCESS' | 'FAILED_ATTEMPT';
  timestamp: string;
}

export function parseUserAgent(ua: string) {
  let os = 'Windows 11';
  if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Win')) os = 'Windows 11/10';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Chrome 120';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

  let device = 'Desktop PC';
  if (/Tablet|iPad/i.test(ua)) device = 'Tablet Device';
  else if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile Phone';

  return { os, browser, device };
}

const SEED_LOGIN_ACTIVITIES: LoginActivityRecord[] = [
  {
    id: 'LOG-994821',
    email: 'admin@tarepet.edu.ng',
    role: 'ADMIN',
    ipAddress: '197.210.65.12',
    device: 'Desktop PC (Google Chrome)',
    browser: 'Google Chrome',
    os: 'Windows 11',
    status: 'SUCCESS',
    timestamp: new Date().toISOString()
  },
  {
    id: 'LOG-994820',
    email: 'v.adeyemi@tarepet.edu.ng',
    role: 'TEACHER',
    ipAddress: '102.89.44.18',
    device: 'MacBook Pro (Apple Safari)',
    browser: 'Apple Safari',
    os: 'macOS Sonoma',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'LOG-994819',
    email: 'emeka.amadi@tarepet.com',
    role: 'STUDENT',
    ipAddress: '105.112.21.45',
    device: 'Mobile Phone (Google Chrome)',
    browser: 'Google Chrome',
    os: 'Android 14',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'LOG-994818',
    email: 'unknown.user@gmail.com',
    role: 'UNKNOWN',
    ipAddress: '197.210.99.04',
    device: 'Desktop PC (Firefox)',
    browser: 'Mozilla Firefox',
    os: 'Linux x86_64',
    status: 'FAILED_ATTEMPT',
    timestamp: new Date(Date.now() - 10800000).toISOString()
  }
];

export function getStoredLoginActivities(): LoginActivityRecord[] {
  if (typeof window === 'undefined') return SEED_LOGIN_ACTIVITIES;
  try {
    const raw = localStorage.getItem('tarepet_login_activities');
    return raw ? JSON.parse(raw) : SEED_LOGIN_ACTIVITIES;
  } catch {
    return SEED_LOGIN_ACTIVITIES;
  }
}

export function recordLoginActivity(email: string, role: string, status: 'SUCCESS' | 'FAILED_ATTEMPT' = 'SUCCESS') {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const parsed = parseUserAgent(ua);
  const newActivity: LoginActivityRecord = {
    id: 'LOG-' + String(Math.floor(100000 + Math.random() * 900000)),
    email: email || 'anonymous@tarepet.com',
    role: role || 'UNKNOWN',
    ipAddress: '197.210.65.12',
    device: `${parsed.device} (${parsed.browser})`,
    browser: parsed.browser,
    os: parsed.os,
    status,
    timestamp: new Date().toISOString()
  };

  const current = getStoredLoginActivities();
  const updated = [newActivity, ...current.slice(0, 99)];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_login_activities', JSON.stringify(updated));
      broadcastRealtimeEvent();
    } catch {}
  }

  authClient.post('/auth/login-activities/', {
    email: newActivity.email,
    role: newActivity.role,
    ip_address: newActivity.ipAddress,
    user_agent: ua,
    device_info: `${parsed.device} - ${parsed.browser} on ${parsed.os}`,
    status: newActivity.status
  }).catch(() => {});

  return newActivity;
}

/**
 * Purge all cached default mock data keys from browser localStorage and reset memory state.
 */
export function clearAllSiteDefaultData(): void {
  if (typeof window === 'undefined') return;
  const keysToPurge = [
    'tarepet_cbt_exams',
    'tarepet_cbt_submissions',
    'tarepet_teachers_list',
    'tarepet_students_list',
    'tarepet_cbt_attendance',
    'tarepet_broadsheet_scores',
    'tarepet_login_activities',
    'tarepet_deleted_accounts',
    'tarepet_finance_expenses',
    'tarepet_finance_income',
    'tarepet_fee_items',
    'tarepet_fee_transactions',
  ];

  keysToPurge.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });

  _exams = [];
  _submissions = [];
  _activities = [];
  _teachers = [];
  _students = [];

  broadcastRealtimeEvent();
}

/**
 * Admin Password Storage & Management
 */
export function getAdminPassword(): string {
  if (typeof window === 'undefined') return 'Admin@12345';
  try {
    const saved = localStorage.getItem('tarepet_admin_password');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'Admin@12345';
}

export function setAdminPassword(newPassword: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tarepet_admin_password', newPassword.trim());
    broadcastRealtimeEvent();
  } catch {}
}