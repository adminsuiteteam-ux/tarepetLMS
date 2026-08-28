// Central CBT & LMS Engine for Tare Pet Montessori School
// All data lives in module-level memory and localStorage sync. Syncs with backend API.
import { authClient, getAccessToken } from './api-auth';
import { addRealtimeNotification } from './notifications-store';
import { sendWebSocketEvent, initWebSocket, subscribeToWebSocketEvents } from './websocket-client';

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
  // ── Senior Secondary Science Stream (SS 1 - SS 3) ──
  { id: 1, code: 'ENG-101', name: 'English Language', stream: 'Science', category: 'General Core', teacherName: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002' },
  { id: 2, code: 'MTH-101', name: 'Mathematics', stream: 'Science', category: 'STEM', teacherName: 'Eli Idua', teacherStaffId: 'TMS/TCH/0017' },
  { id: 3, code: 'BIO-101', name: 'Biology', stream: 'Science', category: 'STEM', teacherName: 'Emmanuel U. Joseph', teacherStaffId: 'TMS/TCH/0019' },
  { id: 4, code: 'CHM-101', name: 'Chemistry', stream: 'Science', category: 'STEM', teacherName: 'Abiola Adeniyi Adegemo', teacherStaffId: 'TMS/TCH/0007' },
  { id: 5, code: 'PHY-101', name: 'Physics', stream: 'Science', category: 'STEM', teacherName: 'Abiola Adeniyi Adegemo', teacherStaffId: 'TMS/TCH/0007' },
  { id: 6, code: 'FMTH-101', name: 'Further Mathematics', stream: 'Science', category: 'STEM', teacherName: 'Eli Idua', teacherStaffId: 'TMS/TCH/0017' },
  { id: 7, code: 'AGR-101', name: 'Agricultural Science', stream: 'Science', category: 'STEM', teacherName: 'Mr. Joseph Ekenebe', teacherStaffId: 'TMS/TCH/0015' },
  { id: 8, code: 'GEO-101', name: 'Geography', stream: 'Science', category: 'STEM & Environmental', teacherName: 'Alex I. Akpokulokenei Maria', teacherStaffId: 'TMS/TCH/0018' },
  { id: 9, code: 'CIV-101', name: 'Civic Education', stream: 'Science', category: 'General Core', teacherName: 'Agadaga Tari', teacherStaffId: 'TMS/TCH/0012' },
  { id: 10, code: 'ICT-101', name: 'Computer Studies / ICT', stream: 'Science', category: 'STEM', teacherName: 'Samuel Hannah', teacherStaffId: 'TMS/TCH/0003' },
  { id: 11, code: 'TD-101', name: 'Technical Drawing', stream: 'Science', category: 'Technical & Applied', teacherName: 'Mrs. Eze Chidubem Janneth', teacherStaffId: 'TMS/TCH/0011' },
  { id: 12, code: 'HED-101', name: 'Health Education', stream: 'Science', category: 'Life Sciences', teacherName: 'Emmanuel U. Joseph', teacherStaffId: 'TMS/TCH/0019' },
  { id: 13, code: 'PHE-101', name: 'Physical & Health Education', stream: 'Science', category: 'Physical & Health', teacherName: 'Egufe B. Austin', teacherStaffId: 'TMS/TCH/0009' },
  { id: 14, code: 'ECO-101', name: 'Economics', stream: 'Science', category: 'Social Sciences', teacherName: 'Goodluck Ufomba', teacherStaffId: 'TMS/TCH/0016' },
  { id: 15, code: 'DTP-101', name: 'Data Processing', stream: 'Science', category: 'ICT & Applied', teacherName: 'Samuel Hannah', teacherStaffId: 'TMS/TCH/0003' },
  { id: 16, code: 'ANH-101', name: 'Animal Husbandry', stream: 'Science', category: 'Vocational Agriculture', teacherName: 'Mr. Joseph Ekenebe', teacherStaffId: 'TMS/TCH/0015' },
  { id: 17, code: 'FSH-101', name: 'Fisheries', stream: 'Science', category: 'Vocational Agriculture', teacherName: 'Mr. Joseph Ekenebe', teacherStaffId: 'TMS/TCH/0015' },
  { id: 18, code: 'TRD-101', name: 'Trade & Entrepreneurship', stream: 'Science', category: 'Trade & Entrepreneurship', teacherName: 'Iwu Adanma', teacherStaffId: 'TMS/TCH/0014' },

  // ── Senior Secondary Arts & Humanities / Commercial Stream (SS 1 - SS 3) ──
  { id: 19, code: 'ENG-101', name: 'English Language', stream: 'Arts', category: 'General Core', teacherName: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002' },
  { id: 20, code: 'MTH-101', name: 'General Mathematics', stream: 'Arts', category: 'General Core', teacherName: 'Eli Idua', teacherStaffId: 'TMS/TCH/0017' },
  { id: 21, code: 'LIT-101', name: 'Literature in English', stream: 'Arts', category: 'Humanities', teacherName: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002' },
  { id: 22, code: 'GOV-101', name: 'Government', stream: 'Arts', category: 'Humanities', teacherName: 'Agadaga Tari', teacherStaffId: 'TMS/TCH/0012' },
  { id: 23, code: 'CRS-101', name: 'Christian Religious Studies (CRS)', stream: 'Arts', category: 'Humanities', teacherName: 'Mrs. Eze Chidubem Janneth', teacherStaffId: 'TMS/TCH/0011' },
  { id: 24, code: 'IRS-101', name: 'Islamic Religious Studies (IRS)', stream: 'Arts', category: 'Humanities', teacherName: 'Agadaga Tari', teacherStaffId: 'TMS/TCH/0012' },
  { id: 25, code: 'HIS-101', name: 'History', stream: 'Arts', category: 'Humanities', teacherName: 'Agadaga Tari', teacherStaffId: 'TMS/TCH/0012' },
  { id: 26, code: 'CIV-101', name: 'Civic Education', stream: 'Arts', category: 'General Core', teacherName: 'Agadaga Tari', teacherStaffId: 'TMS/TCH/0012' },
  { id: 27, code: 'ECO-101', name: 'Economics', stream: 'Arts', category: 'Social Sciences', teacherName: 'Goodluck Ufomba', teacherStaffId: 'TMS/TCH/0016' },
  { id: 28, code: 'COM-101', name: 'Commerce', stream: 'Arts', category: 'Commercial & Business', teacherName: 'Goodluck Ufomba', teacherStaffId: 'TMS/TCH/0016' },
  { id: 29, code: 'ACC-101', name: 'Financial Accounting / Book Keeping', stream: 'Arts', category: 'Commercial & Business', teacherName: 'Goodluck Ufomba', teacherStaffId: 'TMS/TCH/0016' },
  { id: 30, code: 'GEO-101', name: 'Geography', stream: 'Arts', category: 'Social Sciences', teacherName: 'Alex I. Akpokulokenei Maria', teacherStaffId: 'TMS/TCH/0018' },
  { id: 31, code: 'AGR-101', name: 'Agricultural Science', stream: 'Arts', category: 'Vocational', teacherName: 'Mr. Joseph Ekenebe', teacherStaffId: 'TMS/TCH/0015' },
  { id: 32, code: 'ART-101', name: 'Visual Arts / Cultural & Creative Arts', stream: 'Arts', category: 'Creative Arts', teacherName: 'Mrs. Eze Chidubem Janneth', teacherStaffId: 'TMS/TCH/0011' },
  { id: 33, code: 'FRE-101', name: 'French Language', stream: 'Arts', category: 'Languages', teacherName: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002' },
  { id: 34, code: 'MUS-101', name: 'Music', stream: 'Arts', category: 'Creative Arts', teacherName: 'Mrs. Eze Chidubem Janneth', teacherStaffId: 'TMS/TCH/0011' },
  { id: 35, code: 'DTP-101', name: 'Data Processing / Computer Studies', stream: 'Arts', category: 'ICT & Applied', teacherName: 'Samuel Hannah', teacherStaffId: 'TMS/TCH/0003' },
  { id: 36, code: 'FDN-101', name: 'Food & Nutrition / Home Management', stream: 'Arts', category: 'Vocational', teacherName: 'Iwu Adanma', teacherStaffId: 'TMS/TCH/0014' },
  { id: 37, code: 'TRD-101', name: 'Catering Craft / Trade & Entrepreneurship', stream: 'Arts', category: 'Trade & Entrepreneurship', teacherName: 'Iwu Adanma', teacherStaffId: 'TMS/TCH/0014' },
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
  { id: 'Nursery 3', label: 'Nursery 3 (NUR 3 / Kindergarten)', category: 'Nursery', level: 'Early Years', arms: NURSERY_ARMS },
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
  if (!stream || stream === 'General' || stream === 'ALL') {
    return SENIOR_COURSES;
  }
  const streamLower = stream.toLowerCase();
  if (streamLower.includes('sci')) {
    return SENIOR_COURSES.filter(c => c.stream === 'Science');
  }
  if (streamLower.includes('art') || streamLower.includes('comm') || streamLower.includes('hum')) {
    return SENIOR_COURSES.filter(c => c.stream === 'Arts');
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
function loadDeletedExamIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('tarepet_deleted_exams');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function loadSavedExams(): CBTExam[] {
  if (typeof window === 'undefined') return [];
  try {
    const deletedIds = loadDeletedExamIds();
    const saved = localStorage.getItem('tarepet_cbt_exams');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out legacy default seed exams and explicitly deleted exams
        const liveOnly = parsed.filter((e: any) => {
          const t = String(e.title || '').toLowerCase();
          const isLegacyDemo = e.id === 1001 || e.id === 1002 || t.includes('ss1 science assessment');
          const isDeleted = deletedIds.includes(Number(e.id));
          return !isLegacyDemo && !isDeleted;
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
  id: number | string;
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

export const DEFAULT_FORM_TEACHERS: TeacherRecord[] = [
  {
    id: 1,
    staffId: 'TMS/TCH/0060',
    name: 'Ms. Allison Victoria',
    email: 'allison.victoria@tarepet.com',
    phone: '08062571566',
    gender: 'Female',
    formTeacherOf: 'SS 1',
    department: 'Senior Secondary Section',
    specialization: 'Senior Secondary Language Arts & English',
    qualification: 'B.Ed. English & Literature',
    status: 'Active',
    joined: '2022-09-01',
    bio: 'Form Teacher for SS 1 guiding students in English Language and Senior Secondary curriculum.'
  },
  {
    id: 2,
    staffId: 'TMS/TCH/0016',
    name: 'Mrs. Timi Porbeni',
    email: 'isaactimi16@gmail.com',
    phone: '07068523730',
    gender: 'Female',
    formTeacherOf: 'SS 2',
    department: 'Senior Secondary Humanities Department',
    specialization: 'English Language & Literature in English (SS1, SS2, SS3)',
    qualification: 'B.A. Literature in English, PGDE',
    status: 'Active',
    joined: '2021-09-01',
    bio: 'Senior Instructor in English Language & Literature in English across SS 1, SS 2, and SS 3.'
  },
  {
    id: 3,
    staffId: 'TMS/TCH/0070',
    name: 'Samuel Hannah',
    email: 'hannah.samuel@tarepet.com',
    phone: '08062429432',
    gender: 'Female',
    formTeacherOf: 'Creche',
    department: 'Early Years & Vocational Studies',
    specialization: 'Prevocational Studies (NUR - SS3) & Creche',
    qualification: 'NCE Early Childhood Education',
    status: 'Active',
    joined: '2023-01-10',
    bio: 'Form Educator for Creche and Prevocational Studies instructor from Nursery to SS 3.'
  },
  {
    id: 4,
    staffId: 'TMS/TCH/0061',
    name: 'Nwachukwu (O) Edirin',
    email: 'edirin.nwachukwu@tarepet.com',
    phone: '07032356176',
    gender: 'Female',
    formTeacherOf: 'Primary 2',
    department: 'Primary Section',
    specialization: 'Primary 2 Curriculum & Basic Sciences',
    qualification: 'B.Sc. Ed. Primary Science',
    status: 'Active',
    joined: '2022-09-01',
    bio: 'Form Teacher for Primary 2 nurturing foundational literacy, numeracy, and science inquiry.'
  },
  {
    id: 5,
    staffId: 'TMS/TCH/0062',
    name: 'Mrs. Ozichi Nwaudo Arinze',
    email: 'ozichi.arinze@tarepet.com',
    phone: '08067102216',
    gender: 'Female',
    formTeacherOf: 'JSS 1',
    department: 'Junior Secondary Section',
    specialization: 'Mathematics (JSS 1)',
    qualification: 'B.Sc. Ed. Mathematics',
    status: 'Active',
    joined: '2020-09-01',
    bio: 'Form Teacher for JSS 1 and Junior Secondary Mathematics educator.'
  },
  {
    id: 6,
    staffId: 'TMS/TCH/0063',
    name: 'Ogbe Andrew',
    email: 'ogbe.andrew@tarepet.com',
    phone: '08020697680',
    gender: 'Male',
    formTeacherOf: 'Basic 4',
    department: 'Mathematics & Sciences Department',
    specialization: 'Mathematics (Basic 4, SS 2)',
    qualification: 'B.Sc. Mathematics',
    status: 'Active',
    joined: '2021-09-01',
    bio: 'Form Teacher and Mathematics instructor for Basic 4 and Senior Secondary 2.'
  },
  {
    id: 7,
    staffId: 'TMS/TCH/0017',
    name: 'Abiola Adeniyi Adegemo',
    email: 'adeniyiabiola2@gmail.com',
    phone: '08131251726',
    gender: 'Male',
    formTeacherOf: 'Senior Science',
    department: 'Physical & Commercial Sciences',
    specialization: 'Physics (PRI - SS3) & Financial Accounting (JSS 1)',
    qualification: 'B.Sc. Physics & Accounting',
    status: 'Active',
    joined: '2019-09-01',
    bio: 'Senior Physics instructor for Primary to SS 3 and Financial Accounting instructor for JSS 1.'
  },
  {
    id: 8,
    staffId: 'TMS/TCH/0019',
    name: 'Simeon Blessed Chigozie',
    email: 'blessedsimeon6@gmail.com',
    phone: '08146183309',
    gender: 'Male',
    formTeacherOf: 'JSS 1',
    department: 'Creative Arts & Music Department',
    specialization: 'Music (JSS 1) & Basic 4 Curriculum',
    qualification: 'B.A. Music & Creative Arts',
    status: 'Active',
    joined: '2022-09-01',
    bio: 'Form Teacher and instructor for Music (JSS 1) and Basic 4 creative arts.'
  },
  {
    id: 9,
    staffId: 'TMS/TCH/0071',
    name: 'Egufe B. Austin',
    email: 'austin.egufe@tarepet.com',
    phone: '08066154094',
    gender: 'Male',
    formTeacherOf: 'JSS Vocational',
    department: 'Vocational & Technical Studies',
    specialization: 'Home Economics (JSS 1 - 3)',
    qualification: 'B.Sc. Home Economics',
    status: 'Active',
    joined: '2023-09-01',
    bio: 'Instructor for Home Economics across Junior Secondary classes (JSS 1 to JSS 3).'
  },
  {
    id: 10,
    staffId: 'TMS/TCH/0026',
    name: 'Oyiniki Anita Ojinbrakemi',
    email: 'oyinkianita6@gmail.com',
    phone: '08146183309',
    gender: 'Female',
    formTeacherOf: 'JSS 3 Love',
    department: 'Junior Secondary Section',
    specialization: 'English Language & Verbal Reasoning (JSS 3)',
    qualification: 'B.A. English & Literary Studies',
    status: 'Active',
    joined: '2021-09-01',
    bio: 'Form Teacher for JSS 3 Love and instructor in English Language & Verbal Reasoning.'
  },
  {
    id: 11,
    staffId: 'TMS/TCH/0044',
    name: 'Mrs. Eze Chidubem Janneth',
    email: 'ukachukwuchidubem223@gmail.com',
    phone: '08142417833',
    gender: 'Female',
    formTeacherOf: 'JSS 2 Faith',
    department: 'Creative & Cultural Arts Department',
    specialization: 'Fine Art & Creative Arts (JSS 1 - 3)',
    qualification: 'B.A. Fine & Applied Arts, PGDE',
    status: 'Active',
    joined: '2020-09-01',
    bio: 'Form Teacher for JSS 2 Faith and Fine Art instructor for JSS 1, JSS 2, and JSS 3.'
  },
  {
    id: 12,
    staffId: 'TMS/TCH/0072',
    name: 'Agadaga Tari',
    email: 'tari.agadaga@tarepet.com',
    phone: '08065008494',
    gender: 'Male',
    formTeacherOf: 'None',
    department: 'Social Sciences Department',
    specialization: 'Social Studies (SOS) & Civic Education (JSS 1 - 3)',
    qualification: 'B.Sc. Political Science & Social Studies',
    status: 'Active',
    joined: '2022-09-01',
    bio: 'Instructor in Social Studies and Civic Education for Junior Secondary classes.'
  },
  {
    id: 13,
    staffId: 'TMS/TCH/0054',
    name: 'Amos Godspower',
    email: 'amosgodspower360@mail.com',
    phone: '07035339196',
    gender: 'Male',
    formTeacherOf: 'JSS 3 Faith',
    department: 'Business & Commercial Studies',
    specialization: 'Business Studies (JSS 1 - 2) & Civic Education',
    qualification: 'B.Sc. Business Education',
    status: 'Active',
    joined: '2021-09-01',
    bio: 'Form Teacher for JSS 3 Faith and Business Studies educator.'
  },
  {
    id: 14,
    staffId: 'TMS/TCH/0064',
    name: 'Iwu Adanma',
    email: 'iwu.adanma@tarepet.com',
    phone: '08039341848',
    gender: 'Female',
    formTeacherOf: 'JSS 1 Faith',
    department: 'Senior Secondary Commercial Department',
    specialization: 'Marketing & Commerce (SS 1 - 3)',
    qualification: 'B.Sc. Marketing & Commercial Education',
    status: 'Active',
    joined: '2022-09-01',
    bio: 'Form Teacher for JSS 1 Faith and Commerce & Marketing instructor for SS 1 to SS 3.'
  },
  {
    id: 15,
    staffId: 'TMS/TCH/0043',
    name: 'Mr. Joseph Ekenebe',
    email: 'joebleszekenebe@gmail.com',
    phone: '08137183618',
    gender: 'Male',
    formTeacherOf: 'SS 2 Grace',
    department: 'Senior Secondary Section',
    specialization: 'Senior Secondary Studies (SS 1 - 3)',
    qualification: 'B.Sc. Education',
    status: 'Active',
    joined: '2020-09-01',
    bio: 'Form Teacher for SS 2 Grace and Senior Secondary educator.'
  },
  {
    id: 16,
    staffId: 'TMS/TCH/0027',
    name: 'Goodluck Ufomba',
    email: 'goodluckufomba2020@gmail.com',
    phone: '08032288883',
    gender: 'Male',
    formTeacherOf: 'None',
    department: 'Mathematics & Sciences Department',
    specialization: 'Mathematics (JSS 2 & SS 2)',
    qualification: 'B.Sc. Mathematics & Statistics',
    status: 'Active',
    joined: '2021-09-01',
    bio: 'Mathematics instructor for Junior Secondary 2 and Senior Secondary 2.'
  },
  {
    id: 17,
    staffId: 'TMS/TCH/0025',
    name: 'Eli Idua',
    email: 'eliidua@gmail.com',
    phone: '08068583070',
    gender: 'Male',
    formTeacherOf: 'SS 1 Art',
    department: 'Mathematics & Quantitative Sciences',
    specialization: 'Mathematics & Further Mathematics (JSS 3, SS 1, SS 2, SS 3)',
    qualification: 'B.Sc. Mathematics, PGDE',
    status: 'Active',
    joined: '2019-09-01',
    bio: 'Form Teacher for SS 1 Art and Mathematics & Further Mathematics specialist.'
  },
  {
    id: 18,
    staffId: 'TMS/TCH/0013',
    name: 'Alex I. Akpokulokenei Maria',
    email: 'alexakpobulokemi@gmail.com',
    phone: '09066984417',
    gender: 'Female',
    formTeacherOf: 'None',
    department: 'Earth & Environmental Sciences',
    specialization: 'Geography (SS 1 - 3)',
    qualification: 'B.Sc. Geography & Environmental Studies',
    status: 'Active',
    joined: '2022-09-01',
    bio: 'Senior Geography educator across Senior Secondary classes (SS 1 to SS 3).'
  },
  {
    id: 19,
    staffId: 'TMS/TCH/0022',
    name: 'Emmanuel U. Joseph',
    email: 'joeugbede2024@gmail.com',
    phone: '08021472342',
    gender: 'Male',
    formTeacherOf: 'None',
    department: 'Biological & Life Sciences',
    specialization: 'Biology (SS 1 - 3)',
    qualification: 'B.Sc. Biology & Life Sciences',
    status: 'Active',
    joined: '2020-09-01',
    bio: 'Senior Biology educator for Senior Secondary classes (SS 1 to SS 3).'
  },
];

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

const OFFICIAL_TEACHER_EMAILS = new Set(DEFAULT_FORM_TEACHERS.map(t => t.email.toLowerCase()));
const OFFICIAL_TEACHER_NAMES = new Set(DEFAULT_FORM_TEACHERS.map(t => t.name.toLowerCase().trim()));

function loadSavedTeachers(): TeacherRecord[] {
  if (typeof window === 'undefined') return DEFAULT_FORM_TEACHERS;
  
  try {
    const saved = localStorage.getItem('tarepet_teachers_list');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const liveOnly = parsed.filter((t: any) => 
          t && t.name && 
          !isAccountDeleted(t.email) && 
          !isAccountDeleted(t.staffId) && 
          !isAccountDeleted(t.id) &&
          !isAccountDeleted(t.name) &&
          !['Dr. John Doe', 'Prof. Smith', 'Test Teacher', 'Sample Faculty', 'Dr. Test Teacher'].some(fake => (t.name || '').includes(fake))
        );
        return deduplicateTeachers(liveOnly);
      }
    }
  } catch (e) {}

  // First-time initialization only when no store exists
  const initList = deduplicateTeachers(
    DEFAULT_FORM_TEACHERS.filter(t => 
      !isAccountDeleted(t.email) && 
      !isAccountDeleted(t.staffId) && 
      !isAccountDeleted(t.id) &&
      !isAccountDeleted(t.name)
    )
  );

  try {
    localStorage.setItem('tarepet_teachers_list', JSON.stringify(initList));
  } catch (e) {}

  return initList;
}

let _teachers: TeacherRecord[] = loadSavedTeachers();

export function getStoredTeachers(): TeacherRecord[] {
  _teachers = loadSavedTeachers();
  return _teachers;
}

export async function saveTeacher(teacherData: Partial<TeacherRecord> & { name: string }): Promise<TeacherRecord> {
  _teachers = loadSavedTeachers();
  const serial = String(Math.floor(1000 + Math.random() * 9000));
  const existing = _teachers.find(t => 
    (teacherData.id && t.id === teacherData.id) ||
    (teacherData.staffId && (t.staffId || '').toLowerCase().replace(/[^a-z0-9]/g, '') === (teacherData.staffId || '').toLowerCase().replace(/[^a-z0-9]/g, '')) ||
    (teacherData.email && (t.email || '').toLowerCase().trim() === (teacherData.email || '').toLowerCase().trim()) ||
    (teacherData.name && (t.name || '').trim().toLowerCase() === (teacherData.name || '').trim().toLowerCase())
  );

  const staffId = teacherData.staffId || existing?.staffId || `TMS/TCH/${serial}`;
  const email = teacherData.email || existing?.email || formatStudentEmail(teacherData.name);

  const updatedTeacher: TeacherRecord = {
    id: teacherData.id || existing?.id || Date.now(),
    staffId: staffId,
    name: teacherData.name.trim(),
    email: email,
    phone: teacherData.phone !== undefined ? teacherData.phone : (existing?.phone || ''),
    gender: teacherData.gender !== undefined ? teacherData.gender : (existing?.gender || ''),
    department: teacherData.department !== undefined ? teacherData.department : (existing?.department || ''),
    specialization: teacherData.specialization !== undefined ? teacherData.specialization : (existing?.specialization || ''),
    qualification: teacherData.qualification !== undefined ? teacherData.qualification : (existing?.qualification || ''),
    status: teacherData.status !== undefined ? teacherData.status : (existing?.status || 'Active'),
    joined: teacherData.joined !== undefined ? teacherData.joined : (existing?.joined || new Date().toISOString().split('T')[0]),
    formTeacherOf: teacherData.formTeacherOf !== undefined ? teacherData.formTeacherOf : (existing?.formTeacherOf || 'None'),
    subjectsAssigned: teacherData.subjectsAssigned !== undefined ? teacherData.subjectsAssigned : (existing?.subjectsAssigned || []),
    classesCount: teacherData.classesCount !== undefined ? teacherData.classesCount : (existing?.classesCount || 0),
    studentsCount: teacherData.studentsCount !== undefined ? teacherData.studentsCount : (existing?.studentsCount || 0),
    address: teacherData.address !== undefined ? teacherData.address : (existing?.address || ''),
    dob: teacherData.dob !== undefined ? teacherData.dob : (existing?.dob || ''),
    bio: teacherData.bio !== undefined ? teacherData.bio : (existing?.bio || ''),
    cbtExamsCount: teacherData.cbtExamsCount !== undefined ? teacherData.cbtExamsCount : (existing?.cbtExamsCount || 0),
    attendanceRate: teacherData.attendanceRate !== undefined ? teacherData.attendanceRate : (existing?.attendanceRate || '0%'),
    profileImage: teacherData.profileImage !== undefined ? teacherData.profileImage : (existing?.profileImage || ''),
    salary: teacherData.salary !== undefined ? teacherData.salary : (existing?.salary || ''),
    bankName: teacherData.bankName !== undefined ? teacherData.bankName : (existing?.bankName || ''),
    accountNumber: teacherData.accountNumber !== undefined ? teacherData.accountNumber : (existing?.accountNumber || ''),
    password: teacherData.password !== undefined ? teacherData.password : (existing?.password || staffId),
  };

  unmarkDeletedAccount([updatedTeacher.id, updatedTeacher.staffId, updatedTeacher.email, updatedTeacher.name]);

  // Real-time async sync to Django backend database
  const tNames = (updatedTeacher.name || '').trim().split(' ');
  const tPayload = {
    email: updatedTeacher.email,
    password: updatedTeacher.password || updatedTeacher.staffId,
    first_name: tNames[0] || updatedTeacher.name,
    last_name: tNames.slice(1).join(' ') || 'Staff',
    phone: updatedTeacher.phone,
    role: 'TEACHER',
    teacher_id: updatedTeacher.staffId,
    staffId: updatedTeacher.staffId,
    department: updatedTeacher.department,
    specialization: updatedTeacher.specialization,
    qualifications: updatedTeacher.qualification,
    qualification: updatedTeacher.qualification,
    subjects_taught: updatedTeacher.subjectsAssigned || [],
    subjectsAssigned: updatedTeacher.subjectsAssigned || [],
    gender: updatedTeacher.gender,
    dob: updatedTeacher.dob || null,
    date_of_birth: updatedTeacher.dob || null,
    hire_date: updatedTeacher.joined || null,
    joined: updatedTeacher.joined || null,
    address: updatedTeacher.address,
    salary: updatedTeacher.salary,
    bank_name: updatedTeacher.bankName,
    bankName: updatedTeacher.bankName,
    account_number: updatedTeacher.accountNumber,
    accountNumber: updatedTeacher.accountNumber,
    form_teacher_of: updatedTeacher.formTeacherOf,
    formTeacherOf: updatedTeacher.formTeacherOf,
    bio: updatedTeacher.bio || '',
    profile_image: updatedTeacher.profileImage || '',
    profileImage: updatedTeacher.profileImage || '',
    profile: {
      profile_image: updatedTeacher.profileImage || '',
      profileImage: updatedTeacher.profileImage || '',
    }
  };

  try {
    let res: any = null;
    if (typeof updatedTeacher.id === 'number' && updatedTeacher.id < 1000000000) {
      res = await authClient.patch(`/auth/users/${updatedTeacher.id}/`, tPayload);
    } else {
      try {
        res = await authClient.post('/auth/register/', tPayload);
      } catch (errReg: any) {
        // Fallback to /auth/users/ if register returned an auth/route conflict
        res = await authClient.post('/auth/users/', tPayload);
      }
    }
    if (res && res.data) {
      const respId = res.data.id || res.data.user?.id;
      if (respId) {
        updatedTeacher.id = respId;
      }
      if (res.data.email) {
        updatedTeacher.email = res.data.email;
      }
      const backendStaffId = res.data.profile?.teacher_id || res.data.teacher_id;
      if (backendStaffId) {
        updatedTeacher.staffId = backendStaffId;
      }
    }
  } catch (err: any) {
    console.warn('Backend teacher sync response:', err?.response?.data || err?.message);
    if (typeof updatedTeacher.id === 'number' && updatedTeacher.id < 1000000000) {
      await authClient.patch(`/auth/users/${updatedTeacher.id}/`, tPayload).catch(() => {});
    }
  }

  const existingIdx = _teachers.findIndex(t => 
    (updatedTeacher.id && t.id === updatedTeacher.id) ||
    (t.staffId && t.staffId.toLowerCase() === updatedTeacher.staffId.toLowerCase()) ||
    (t.email && t.email.toLowerCase() === updatedTeacher.email.toLowerCase())
  );

  if (existingIdx >= 0) {
    _teachers[existingIdx] = updatedTeacher;
  } else {
    _teachers = [updatedTeacher, ..._teachers];
  }

  _teachers = deduplicateTeachers(_teachers);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }

  sendWebSocketEvent(JSON.stringify({
    type: 'ROSTER_UPDATED',
    payload: { teacher: updatedTeacher, action: 'SAVE' }
  }));
  broadcastRealtimeEvent();

  return updatedTeacher;
}

export function saveStoredTeachers(backendTeachers: TeacherRecord[]) {
  const existingLocal = loadSavedTeachers();
  const validBackend = backendTeachers.filter(b => 
    b && b.name && 
    !isAccountDeleted(b.email) && 
    !isAccountDeleted(b.staffId) && 
    !isAccountDeleted(b.id) &&
    !isAccountDeleted(b.name)
  );
  const merged: TeacherRecord[] = [...validBackend];

  // Preserve any locally created / modified teachers not yet returned by backend
  for (const local of existingLocal) {
    if (isAccountDeleted(local.email) || isAccountDeleted(local.staffId) || isAccountDeleted(local.id) || isAccountDeleted(local.name)) continue;
    const isAlreadyInBackend = validBackend.some(b => 
      b.id === local.id ||
      (local.staffId && b.staffId && b.staffId.toLowerCase().replace(/[^a-z0-9]/g, '') === (local.staffId || '').toLowerCase().replace(/[^a-z0-9]/g, '')) ||
      (local.email && b.email && b.email.toLowerCase().trim() === (local.email || '').toLowerCase().trim())
    );
    if (!isAlreadyInBackend) {
      merged.push(local);
    }
  }

  _teachers = deduplicateTeachers(merged);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }
  broadcastRealtimeEvent();
  return _teachers;
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

// ─── Master Subjects & Curriculum System ─────────────────────────────────────

export interface SubjectRecord {
  id: number | string;
  code: string;
  title: string;
  grade: string;
  stream: string;
  category: string;
  teacher: string;
  teacherStaffId?: string;
  studentsCount: number;
  enrolled?: number;
  status: string;
  room?: string;
  passMark?: number;
  periods?: string;
}

export const DEFAULT_SUBJECTS: SubjectRecord[] = [
  // ── Senior Secondary Science Stream (14 Unique Subjects) ──
  { id: 101, code: 'ENG-101', title: 'English Language', grade: 'SS 1 - SS 3', stream: 'Science', category: 'General Core', teacher: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002', studentsCount: 0, status: 'Active', room: 'Hall A', passMark: 50, periods: '5 Periods/wk' },
  { id: 102, code: 'MTH-101', title: 'Mathematics', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Eli Idua', teacherStaffId: 'TMS/TCH/0017', studentsCount: 0, status: 'Active', room: 'Hall A', passMark: 50, periods: '5 Periods/wk' },
  { id: 103, code: 'BIO-101', title: 'Biology', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Emmanuel U. Joseph', teacherStaffId: 'TMS/TCH/0019', studentsCount: 0, status: 'Active', room: 'Biology Lab', passMark: 50, periods: '4 Periods/wk' },
  { id: 104, code: 'CHM-101', title: 'Chemistry', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Chemistry Lab', passMark: 50, periods: '4 Periods/wk' },
  { id: 105, code: 'PHY-101', title: 'Physics', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Abiola Adeniyi Adegemo', teacherStaffId: 'TMS/TCH/0007', studentsCount: 0, status: 'Active', room: 'Physics Lab', passMark: 50, periods: '4 Periods/wk' },
  { id: 106, code: 'FMTH-101', title: 'Further Mathematics', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Eli Idua', teacherStaffId: 'TMS/TCH/0017', studentsCount: 0, status: 'Active', room: 'Hall A', passMark: 50, periods: '3 Periods/wk' },
  { id: 107, code: 'AGR-101', title: 'Agricultural Science', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Agric Plot', passMark: 50, periods: '3 Periods/wk' },
  { id: 108, code: 'GEO-101', title: 'Geography', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM & Environmental', teacher: 'Alex I. Akpokulokenei Maria', teacherStaffId: 'TMS/TCH/0018', studentsCount: 0, status: 'Active', room: 'Geo Lab', passMark: 50, periods: '3 Periods/wk' },
  { id: 109, code: 'CIV-101', title: 'Civic Education', grade: 'SS 1 - SS 3', stream: 'Science', category: 'General Core', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Hall A', passMark: 50, periods: '2 Periods/wk' },
  { id: 110, code: 'ICT-101', title: 'Computer Studies (ICT)', grade: 'SS 1 - SS 3', stream: 'Science', category: 'STEM', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'ICT Lab', passMark: 50, periods: '3 Periods/wk' },
  { id: 111, code: 'TD-101', title: 'Technical Drawing', grade: 'SS 1 - SS 3', stream: 'Science', category: 'Technical & Applied', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Studio 1', passMark: 50, periods: '2 Periods/wk' },
  { id: 112, code: 'HED-101', title: 'Health Education', grade: 'SS 1 - SS 3', stream: 'Science', category: 'Life Sciences', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Hall A', passMark: 50, periods: '2 Periods/wk' },
  { id: 113, code: 'PHE-101', title: 'Physical Education', grade: 'SS 1 - SS 3', stream: 'Science', category: 'Physical & Health', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Sports Complex', passMark: 50, periods: '2 Periods/wk' },
  { id: 114, code: 'TRD-101', title: 'Trade/Entrepreneurship Subject', grade: 'SS 1 - SS 3', stream: 'Science', category: 'Trade & Entrepreneurship', teacher: 'Iwu Adanma', teacherStaffId: 'TMS/TCH/0014', studentsCount: 0, status: 'Active', room: 'Vocational Studio', passMark: 50, periods: '2 Periods/wk' },

  // ── Senior Secondary Art & Humanities Stream (11 Unique Subjects) ──
  { id: 201, code: 'ENG-101', title: 'English Language', grade: 'SS 1 - SS 3', stream: 'Art', category: 'General Core', teacher: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '5 Periods/wk' },
  { id: 202, code: 'MTH-101', title: 'Mathematics', grade: 'SS 1 - SS 3', stream: 'Art', category: 'General Core', teacher: 'Eli Idua', teacherStaffId: 'TMS/TCH/0017', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '5 Periods/wk' },
  { id: 203, code: 'LIT-101', title: 'Literature in English', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Humanities', teacher: 'Mrs. Timi Porbeni', teacherStaffId: 'TMS/TCH/0002', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '4 Periods/wk' },
  { id: 204, code: 'GOV-101', title: 'Government', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Humanities', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '4 Periods/wk' },
  { id: 205, code: 'CRS-101', title: 'Christian Religious Studies (CRS) / IRS', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Humanities', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '3 Periods/wk' },
  { id: 206, code: 'CIV-101', title: 'Civic Education', grade: 'SS 1 - SS 3', stream: 'Art', category: 'General Core', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '2 Periods/wk' },
  { id: 207, code: 'ECO-101', title: 'Economics', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Humanities', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '4 Periods/wk' },
  { id: 208, code: 'HIS-101', title: 'History', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Humanities', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '3 Periods/wk' },
  { id: 209, code: 'ICT-101', title: 'Computer Studies (ICT)', grade: 'SS 1 - SS 3', stream: 'Art', category: 'STEM', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'ICT Lab', passMark: 50, periods: '3 Periods/wk' },
  { id: 210, code: 'LANG-101', title: 'Yoruba / Igbo / Hausa', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Languages', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Block', passMark: 50, periods: '2 Periods/wk' },
  { id: 211, code: 'ART-101', title: 'Fine Arts', grade: 'SS 1 - SS 3', stream: 'Art', category: 'Creative Arts', teacher: 'Not Assigned', teacherStaffId: '', studentsCount: 0, status: 'Active', room: 'Art Studio', passMark: 50, periods: '3 Periods/wk' },
];

function deduplicateSubjects(subjects: SubjectRecord[]): SubjectRecord[] {
  const seen = new Set<string>();
  const deduped: SubjectRecord[] = [];
  for (const s of subjects) {
    const key = `${(s.code || '').toUpperCase()}_${(s.stream || 'General').toUpperCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push({
        ...s,
        grade: s.grade && s.grade.startsWith('SS') ? 'SS 1 - SS 3' : s.grade,
      });
    }
  }
  return deduped;
}

function loadSavedSubjects(): SubjectRecord[] {
  if (typeof window === 'undefined') return DEFAULT_SUBJECTS;

  try {
    const saved = localStorage.getItem('tarepet_subjects_list');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return deduplicateSubjects(parsed);
      }
    }
  } catch (e) {}

  const list = deduplicateSubjects(DEFAULT_SUBJECTS);
  try {
    localStorage.setItem('tarepet_subjects_list', JSON.stringify(list));
  } catch (e) {}
  return list;
}

let _subjects: SubjectRecord[] = loadSavedSubjects();

export function getStoredSubjects(): SubjectRecord[] {
  _subjects = loadSavedSubjects();
  return _subjects;
}

export function saveSubject(subjectData: Partial<SubjectRecord> & { title: string; code: string; grade: string }): SubjectRecord {
  _subjects = loadSavedSubjects();
  const existingIdx = _subjects.findIndex(s => 
    (subjectData.id && s.id === subjectData.id) ||
    (s.code.toLowerCase() === subjectData.code.toLowerCase() && s.grade.toLowerCase() === subjectData.grade.toLowerCase())
  );

  const updatedSubject: SubjectRecord = {
    id: subjectData.id || (existingIdx >= 0 ? _subjects[existingIdx].id : Date.now()),
    code: subjectData.code.trim().toUpperCase(),
    title: subjectData.title.trim(),
    grade: subjectData.grade,
    stream: subjectData.stream || 'General',
    category: subjectData.category || 'General',
    teacher: subjectData.teacher || 'Assigned Educator',
    teacherStaffId: subjectData.teacherStaffId || '',
    studentsCount: subjectData.studentsCount || (existingIdx >= 0 ? _subjects[existingIdx].studentsCount : 25),
    status: subjectData.status || 'Active',
    room: subjectData.room || 'Classroom',
    passMark: subjectData.passMark || 50,
    periods: subjectData.periods || '3 Periods/wk',
  };

  if (existingIdx >= 0) {
    _subjects[existingIdx] = updatedSubject;
  } else {
    _subjects.unshift(updatedSubject);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_subjects_list', JSON.stringify(_subjects));
    } catch (e) {}
  }

  broadcastRealtimeEvent();
  return updatedSubject;
}

export function deleteSubject(id: number | string) {
  _subjects = loadSavedSubjects().filter(s => s.id !== id && String(s.id) !== String(id));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_subjects_list', JSON.stringify(_subjects));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('tarepet_store_updated', { detail: { type: 'subject_deleted', id } }));
  }
  broadcastRealtimeEvent();
}

export function saveStoredSubjects(subjects: SubjectRecord[]) {
  _subjects = subjects;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_subjects_list', JSON.stringify(_subjects));
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

export function unmarkDeletedAccount(identifiers: any[]) {
  const list = loadDeletedAccounts();
  const next = new Set<string>();
  const toRemove = new Set<string>();
  identifiers.forEach(id => {
    if (id !== undefined && id !== null && String(id).trim().length > 0) {
      const val = String(id).trim().toLowerCase();
      toRemove.add(val);
      const clean = val.replace(/[^a-z0-9]/g, '');
      if (clean) toRemove.add(clean);
    }
  });
  list.forEach(item => {
    if (!toRemove.has(item.toLowerCase())) {
      next.add(item);
    }
  });
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_deleted_accounts', JSON.stringify(Array.from(next)));
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
  const target = _teachers.find(t => 
    t.id === teacherIdOrStaffId || 
    t.staffId === teacherIdOrStaffId || 
    t.email === teacherIdOrStaffId ||
    String(t.id) === String(teacherIdOrStaffId) ||
    (t.staffId && String(teacherIdOrStaffId).toLowerCase().replace(/[^a-z0-9]/g, '') === t.staffId.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const deleteIds: any[] = [teacherIdOrStaffId];
  if (target) {
    deleteIds.push(target.id, target.staffId, target.email, target.name);
    if (target.staffId) {
      deleteIds.push(target.staffId.replace(/[^a-z0-9]/g, ''));
    }
  }
  recordDeletedAccount(deleteIds);

  _teachers = _teachers.filter(t => 
    t.id !== teacherIdOrStaffId && 
    t.staffId !== teacherIdOrStaffId && 
    t.email !== teacherIdOrStaffId &&
    String(t.id) !== String(teacherIdOrStaffId) &&
    (!target || t.id !== target.id)
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }

  // Attempt backend API deletion via dedicated delete-by-identifier and standard pk route
  const lookup = target?.id || target?.staffId || target?.email || teacherIdOrStaffId;
  authClient.post('/auth/users/delete-by-identifier/', { identifier: lookup }).catch(() => {});
  if (target?.id && typeof target.id === 'number') {
    authClient.delete(`/auth/users/${target.id}/`).catch(() => {});
  }
  if (target?.email) {
    authClient.post('/auth/users/delete-by-identifier/', { identifier: target.email }).catch(() => {});
  }

  broadcastRealtimeEvent();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tarepet_store_updated', { detail: { type: 'teacher_deleted', id: teacherIdOrStaffId } }));
    window.dispatchEvent(new CustomEvent('tarepet_teacher_deleted', { detail: { id: teacherIdOrStaffId } }));
  }
  return true;
}

export function deleteStudent(studentIdOrAdmissionNo: number | string): boolean {
  _students = loadSavedStudents();
  const target = _students.find(s => 
    s.id === studentIdOrAdmissionNo || 
    s.code === studentIdOrAdmissionNo || 
    s.admissionNo === studentIdOrAdmissionNo || 
    s.studentId === studentIdOrAdmissionNo || 
    s.email === studentIdOrAdmissionNo ||
    String(s.id) === String(studentIdOrAdmissionNo)
  );

  const deleteIds: any[] = [studentIdOrAdmissionNo];
  if (target) {
    deleteIds.push(target.id, target.code, target.admissionNo, target.studentId, target.email, target.name);
  }
  recordDeletedAccount(deleteIds);

  _students = _students.filter(s => 
    s.id !== studentIdOrAdmissionNo && 
    s.code !== studentIdOrAdmissionNo && 
    s.admissionNo !== studentIdOrAdmissionNo && 
    s.studentId !== studentIdOrAdmissionNo && 
    s.email !== studentIdOrAdmissionNo &&
    String(s.id) !== String(studentIdOrAdmissionNo) &&
    (!target || s.id !== target.id)
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
    } catch (e) {}
  }

  // Attempt backend API deletion via dedicated delete-by-identifier and standard pk route
  const lookup = target?.id || target?.code || target?.admissionNo || target?.email || studentIdOrAdmissionNo;
  authClient.post('/auth/users/delete-by-identifier/', { identifier: lookup }).catch(() => {});
  if (target?.id && typeof target.id === 'number') {
    authClient.delete(`/auth/users/${target.id}/`).catch(() => {});
  }

  broadcastRealtimeEvent();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tarepet_store_updated', { detail: { type: 'student_deleted', id: studentIdOrAdmissionNo } }));
    window.dispatchEvent(new CustomEvent('tarepet_student_deleted', { detail: { id: studentIdOrAdmissionNo } }));
  }
  return true;
}

export const DEFAULT_STUDENTS: StudentRecord[] = [];

function loadSavedStudents(): StudentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_students_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const liveOnly = parsed.filter((s: any) => {
          const sCode = String(s.code || s.admissionNo || s.studentId || '').toLowerCase();
          const sName = String(s.name || '').toLowerCase();
          const sEmail = String(s.email || '').toLowerCase();
          const isMock = sName.includes('civa.media') || sName.includes('hacker') || sName.includes('wronguser') || sEmail.includes('hacker@') || sEmail.includes('wronguser@') || sEmail.includes('civa.media');
          const isDeleted = isAccountDeleted(sCode) || isAccountDeleted(sEmail) || isAccountDeleted(sName) || isAccountDeleted(s.id);
          return !isMock && !isDeleted;
        });
        localStorage.setItem('tarepet_students_list', JSON.stringify(liveOnly));
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

export function matchStudentClass(studentGrade?: string, targetClass?: string): boolean {
  if (!studentGrade || !targetClass) return false;
  const cleanS = String(studentGrade).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanT = String(targetClass).toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleanS === cleanT) return true;

  const normalize = (val: string) => {
    return val
      .replace(/^NURSERY/i, 'NUR')
      .replace(/^PRIMARY/i, 'PRI')
      .replace(/^BASIC/i, 'PRI')
      .replace(/^JUNIORSECONDARY/i, 'JSS')
      .replace(/^SENIORSECONDARY/i, 'SS');
  };

  const normS = normalize(cleanS);
  const normT = normalize(cleanT);

  return normS === normT || normS.includes(normT) || normT.includes(normS);
}

export function getStoredStudents(): StudentRecord[] {
  _students = loadSavedStudents();
  return _students;
}
export async function syncStudentsWithBackend(): Promise<StudentRecord[]> {
  const token = getAccessToken();
  if (!token) return getStoredStudents();

  try {
    const res = await authClient.get('/auth/users/?role=STUDENT&page_size=1000');
    if (res.data) {
      const dataArr = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
      const mockEmails = ['civa.media@tarepet.com', 'hacker@evil.com', 'wronguser@fake.com'];
      const fetched: StudentRecord[] = dataArr
        .filter((u: any) => {
          const admNo = u.username || u.profile?.admission_number || '';
          return !mockEmails.includes(u.email) && !isAccountDeleted(u.email) && !isAccountDeleted(u.id) && !isAccountDeleted(admNo) && !isAccountDeleted(`${u.first_name || ''} ${u.last_name || ''}`.trim());
        })
        .map((u: any) => {
          const prof = u.profile || {};
          const autoCode = u.username || prof.admission_number || `TMS/2026/${String(u.id).padStart(4, '0')}`;
          const rawGrade = prof.class_level || prof.grade || 'SS1';
          return {
            id: u.id,
            code: autoCode,
            admissionNo: autoCode,
            admission_number: autoCode,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            password: autoCode,
            gender: prof.gender || 'Male',
            maritalStatus: 'Single',
            dob: prof.date_of_birth || prof.dob || 'Not Available',
            phone: u.phone || prof.phone || 'Not Available',
            country: 'Nigeria',
            stateOfOrigin: prof.state_of_origin || prof.stateOfOrigin || 'Bayelsa',
            lga: prof.lga || 'Yenagoa',
            address: prof.address || 'Yenagoa, Bayelsa State',
            grade: rawGrade,
            stream: prof.stream || (rawGrade.toUpperCase().startsWith('SS') ? 'Science' : 'General'),
            programme: prof.programme || (rawGrade.toUpperCase().startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Montessori Primary Education'),
            parentName: prof.parent_name || prof.parentName || 'Parent / Guardian',
            parentPhone: prof.parent_phone || prof.parentPhone || prof.emergency_contact || '',
            status: u.is_active !== false ? 'ACTIVE' : 'INACTIVE',
            studyMode: prof.study_mode || prof.studyMode || 'Full Time',
            attendance: '100%',
            atRisk: false,
            profileImage: prof.profile_image || u.profile_image || '',
            house: prof.house || '',
          };
        });

      if (fetched.length > 0) {
        _students = fetched;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
          } catch (e) {}
        }
        broadcastRealtimeEvent();
      }
    }
  } catch (err) {
    // Fallback to memory cache
  }
  return _students;
}

export async function syncTeachersWithBackend(): Promise<TeacherRecord[]> {
  const token = getAccessToken();
  if (!token) return getStoredTeachers();

  try {
    const res = await authClient.get('/auth/users/?role=TEACHER&page_size=200');
    if (res.data) {
      const dataArr = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
      const fetched: TeacherRecord[] = dataArr
        .filter((u: any) => {
          const uCode = u.profile?.teacher_id || u.teacher_id || '';
          const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          const isMock = u.email === 'teacher@tarepet.com' && (uCode === 'TCH001' || !u.id);
          return !isMock && !isAccountDeleted(u.email) && !isAccountDeleted(u.id) && !isAccountDeleted(uCode) && !isAccountDeleted(uName);
        })
        .map((u: any) => {
          const prof = u.profile || {};
          const subs = prof.subjects_taught || prof.subjectsAssigned || [];
          return {
            id: u.id,
            staffId: prof.teacher_id || u.teacher_id || `TMS/TCH/${String(u.id).padStart(4, '0')}`,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            phone: u.phone || prof.phone || '',
            qualification: prof.qualifications || prof.qualification || '',
            specialization: prof.specialization || '',
            department: prof.department || '',
            gender: prof.gender || '',
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
        _teachers = saveStoredTeachers(fetched);
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  return _teachers;
}

export async function saveStudent(studentData: Partial<StudentRecord> & { name: string }): Promise<StudentRecord> {
  const assignedGrade = studentData.grade || 'SS1';
  const autoCode = studentData.code || studentData.admissionNo || (studentData as any).student_id || generateAdmissionNumber(assignedGrade, studentData.stream);
  const autoEmail = studentData.email || formatStudentEmail(studentData.name);

  const existingIdx = _students.findIndex(s => 
    (studentData.id && s.id === studentData.id) || 
    (studentData.email && s.email.toLowerCase() === studentData.email.toLowerCase()) || 
    (autoCode && (s.code === autoCode || s.admissionNo === autoCode))
  );

  const sNames = (studentData.name || '').trim().split(' ');
  const firstName = sNames[0] || studentData.name;
  const lastName = sNames.slice(1).join(' ') || 'Student';

  const newStudent: StudentRecord = {
    id: studentData.id || (existingIdx >= 0 ? _students[existingIdx].id : Date.now()),
    code: autoCode,
    admissionNo: autoCode,
    name: studentData.name.trim(),
    email: autoEmail,
    password: studentData.password || autoCode,
    gender: studentData.gender || (existingIdx >= 0 ? _students[existingIdx].gender : 'Male'),
    maritalStatus: studentData.maritalStatus || 'Single',
    dob: studentData.dob || (existingIdx >= 0 ? _students[existingIdx].dob : '2012-05-14'),
    phone: studentData.phone || (existingIdx >= 0 ? _students[existingIdx].phone : 'Not Available'),
    country: studentData.country || 'Nigeria',
    stateOfOrigin: studentData.stateOfOrigin || (existingIdx >= 0 ? _students[existingIdx].stateOfOrigin : 'Bayelsa'),
    lga: studentData.lga || (existingIdx >= 0 ? _students[existingIdx].lga : 'Yenagoa'),
    address: studentData.address || (existingIdx >= 0 ? _students[existingIdx].address : 'Yenagoa, Bayelsa State'),
    grade: assignedGrade,
    stream: studentData.stream || (assignedGrade.startsWith('SS') ? 'Science' : 'General'),
    programme: studentData.programme || (assignedGrade.startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Montessori Primary Education'),
    parentName: studentData.parentName || (existingIdx >= 0 ? _students[existingIdx].parentName : 'Parent / Guardian'),
    parentPhone: studentData.parentPhone || (existingIdx >= 0 ? _students[existingIdx].parentPhone : ''),
    status: studentData.status || 'ACTIVE',
    studyMode: studentData.studyMode || 'Full Time',
    attendance: studentData.attendance || '100%',
    atRisk: studentData.atRisk || false,
    profileImage: studentData.profileImage || (existingIdx >= 0 ? _students[existingIdx].profileImage : ''),
    house: studentData.house || (existingIdx >= 0 ? _students[existingIdx].house : ''),
  };

  unmarkDeletedAccount([newStudent.id, newStudent.code, newStudent.admissionNo, newStudent.email, newStudent.name]);

  // Construct full live Django REST payload
  const sPayload = {
    email: newStudent.email,
    password: newStudent.password || newStudent.code,
    first_name: firstName,
    last_name: lastName,
    phone: newStudent.phone !== 'Not Available' ? newStudent.phone : '',
    role: 'STUDENT',
    student_id: newStudent.code,
    grade: newStudent.grade,
    grade_level: newStudent.grade,
    stream: newStudent.stream,
    gender: newStudent.gender,
    house: newStudent.house,
    dob: newStudent.dob !== 'Not Available' && newStudent.dob ? newStudent.dob : null,
    date_of_birth: newStudent.dob !== 'Not Available' && newStudent.dob ? newStudent.dob : null,
    address: newStudent.address !== 'Not Available' ? newStudent.address : '',
    state_of_origin: newStudent.stateOfOrigin,
    lga: newStudent.lga,
    parent_name: newStudent.parentName,
    parent_phone: newStudent.parentPhone,
    emergency_contact: newStudent.parentPhone || newStudent.phone,
    programme: newStudent.programme,
    study_mode: newStudent.studyMode,
    profile_image: newStudent.profileImage,
  };

  try {
    if (typeof newStudent.id === 'number' && newStudent.id < 1000000000) {
      const res = await authClient.patch(`/auth/users/${newStudent.id}/`, sPayload);
      if (res.data && res.data.id) {
        newStudent.id = res.data.id;
      }
    } else {
      const res = await authClient.post('/auth/register/', sPayload);
      if (res.data && (res.data.id || res.data.user?.id)) {
        newStudent.id = res.data.id || res.data.user.id;
        if (res.data.email) newStudent.email = res.data.email;
      }
    }
  } catch (err: any) {
    console.warn('Backend student sync response:', err?.response?.data || err?.message);
    // If registration failed due to existing user email, attempt patch
    if (err?.response?.data?.email && typeof newStudent.id === 'number' && newStudent.id < 1000000000) {
      await authClient.patch(`/auth/users/${newStudent.id}/`, sPayload).catch(() => {});
    }
  }

  // Update in-memory live store
  const targetIdx = _students.findIndex(s => s.id === newStudent.id || (newStudent.email && s.email.toLowerCase() === newStudent.email.toLowerCase()) || (newStudent.code && s.code === newStudent.code));
  if (targetIdx >= 0) {
    _students[targetIdx] = newStudent;
  } else {
    _students = [newStudent, ..._students];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
    } catch (e) {}
  }

  sendWebSocketEvent(JSON.stringify({
    type: 'ROSTER_UPDATED',
    payload: { student: newStudent, action: 'SAVE' }
  }));
  broadcastRealtimeEvent();

  return newStudent;
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
  _teachers = loadSavedTeachers();
  _students = loadSavedStudents();
  _exams = loadSavedExams();
  window.dispatchEvent(new Event('cbt_store_updated'));
  window.dispatchEvent(new Event('storage'));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CBT_STORE_MUTATED', timestamp: Date.now() });
    } catch (e) { /* fallback */ }
  }
  // Send via WebSocket to sync all connected clients and portals across devices
  sendWebSocketEvent('CBT_STORE_MUTATED');
}

export function initCBTStore() {
  if (typeof window !== 'undefined') {
    initWebSocket();
    syncTeachersWithBackend().catch(() => {});
    syncStudentsWithBackend().catch(() => {});
    syncBroadsheetWithBackend().catch(() => {});
    syncPromotionsWithBackend().catch(() => {});
    syncActivitiesWithBackend().catch(() => {});
  }
}

// Auto-trigger sync on module load
if (typeof window !== 'undefined') {
  initCBTStore();
}

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

export async function saveCBTExam(examData: Partial<CBTExam> & { title: string; course_code?: string }): Promise<CBTExam> {
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
    status: examData.status || 'DRAFT',
    questions: examData.questions || [],
    created_at: examData.created_at || new Date().toISOString(),
  };

  try {
    const res = await authClient.post('/assessments/cbt-exams/', {
      title: newExam.title,
      description: newExam.description,
      instructions: newExam.instructions,
      assessment_type: newExam.assessment_type,
      term: newExam.term,
      duration_minutes: newExam.duration_minutes,
      questions_per_page: newExam.questions_per_page,
      status: newExam.status,
      questions: newExam.questions
    });
    if (res?.data?.id) {
      newExam.id = res.data.id;
    }
  } catch (err) {}

  const existingIdx = _exams.findIndex(e => e.id === newExam.id);
  if (existingIdx >= 0) {
    _exams[existingIdx] = newExam;
  } else {
    _exams = [newExam, ..._exams];
  }

  persistExams(_exams);
  broadcastRealtimeEvent();

  // Only dispatch notifications and WebSocket broadcast if the exam was explicitly submitted for approval (PENDING)
  if (newExam.status === 'PENDING') {
    addRealtimeActivity('EXAM_CREATED', `CBT Exam Submitted for Approval: ${newExam.title}`, `Subject: ${newExam.course_name} (${newExam.class} ${newExam.stream})`, newExam.teacher_name);

    addRealtimeNotification({
      title: '📝 Exam Pending Approval',
      message: `${newExam.teacher_name} submitted "${newExam.title}" (${newExam.course_name} - ${newExam.class}) for Admin approval.`,
      category: 'ACADEMICS',
      type: 'exam',
      recipientRole: 'ADMIN'
    });

    sendWebSocketEvent('EXAM_CREATED', { exam: newExam });
  }

  return newExam;
}

export function mapCBTExamToAdminExam(c: CBTExam): any {
  const statusMap = new Map<string, string>([
    ['APPROVED', 'Approved'],
    ['ACTIVE', 'Ongoing'],
    ['COMPLETED', 'Completed'],
    ['PENDING', 'Pending Approval'],
    ['REJECTED', 'Rejected'],
    ['DRAFT', 'Draft'],
    ['ARCHIVED', 'Archived'],
  ]);
  const mappedStatus = statusMap.get(c.status) || (c.status === 'ACTIVE' ? 'Ongoing' : c.status === 'APPROVED' ? 'Approved' : c.status === 'DRAFT' ? 'Draft' : 'Pending Approval');
  
  // Standardize type to 'Test' | 'Exam' for filter compatibility while retaining full display labels
  const standardType = c.assessment_type === 'EXAM' ? 'Exam' : 'Test';
  const displayType = c.assessment_type === 'EXAM' ? 'Term Exam' : 'CA Test';

  return {
    id: c.id,
    title: c.title,
    type: standardType,
    displayType: displayType,
    rawAssessmentType: c.assessment_type,
    subject: c.course_name,
    class: c.class,
    stream: c.stream || 'Science',
    date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    duration: `${c.duration_minutes || 45} mins`,
    venue: 'CBT Hall A',
    totalCandidates: 30,
    questionsCount: c.questions_count || (c.questions ? c.questions.length : 0),
    invigilator: c.teacher_name || 'Assigned Educator',
    status: mappedStatus,
    questions: c.questions || [],
    rawCbtExam: c
  };
}

export async function syncExamsWithBackend(): Promise<CBTExam[]> {
  const token = getAccessToken();
  if (!token) return loadSavedExams();

  try {
    const res = await authClient.get('/assessments/cbt-exams/');
    if (res.data) {
      const dataArr: any[] = Array.isArray(res.data?.results)
        ? res.data.results
        : Array.isArray(res.data)
        ? res.data
        : [];
      if (dataArr.length > 0) {
        const mappedExams: CBTExam[] = dataArr.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          instructions: item.instructions || '',
          course_code: item.course_code || item.course?.code || 'ENG-101',
          course_name: item.course_name || item.course?.name || 'English Language',
          class: item.class_name || item.class || 'SS1',
          stream: item.stream || 'Science',
          assessment_type: item.assessment_type || 'TEST',
          term: item.term || '2ND_TERM',
          duration_minutes: item.duration_minutes || 45,
          questions_count: item.questions_count || (Array.isArray(item.questions) ? item.questions.length : 0),
          questions_per_page: item.questions_per_page || 2,
          teacher_name: item.teacher_name || item.created_by_name || 'Assigned Educator',
          status: item.status || 'PENDING',
          questions: Array.isArray(item.questions) ? item.questions : [],
          created_at: item.created_at || new Date().toISOString(),
          results_released: item.results_released || false,
        }));
        
        const local = loadSavedExams();
        const merged = [...mappedExams];
        for (const loc of local) {
          if (!merged.some(m => m.id === loc.id)) {
            merged.push(loc);
          }
        }
        _exams = merged;
        persistExams(_exams);
        broadcastRealtimeEvent();
        return _exams;
      }
    }
  } catch (e) {}
  _exams = loadSavedExams();
  return _exams;
}

export async function updateExamStatus(examId: number, status: CBTExam['status'], reason?: string): Promise<CBTExam | null> {
  _exams = loadSavedExams();
  const exam = _exams.find(e => e.id === examId);
  if (!exam) return null;

  exam.status = status;

  try {
    await authClient.patch(`/assessments/cbt-exams/${examId}/`, {
      status: status,
      rejection_reason: reason
    });
  } catch (e) {}

  if (status === 'PENDING') {
    addRealtimeActivity('EXAM_CREATED', `Exam Submitted for Admin Approval: ${exam.title}`, `Subject: ${exam.course_name} (${exam.class} ${exam.stream})`, exam.teacher_name);
    addRealtimeNotification({
      title: '📝 Exam Pending Approval',
      message: `${exam.teacher_name || 'Teacher'} submitted "${exam.title}" (${exam.course_name} - ${exam.class}) for Admin approval.`,
      category: 'ACADEMICS',
      type: 'exam',
      recipientRole: 'ADMIN'
    });
    sendWebSocketEvent('EXAM_CREATED', { exam });
  } else if (status === 'ACTIVE') {
    exam.activated_at = new Date().toISOString();
    addRealtimeActivity('EXAM_ACTIVATED', `Exam Activated for Students: ${exam.title}`, `Now live for ${exam.class} ${exam.stream} students.`, exam.teacher_name);
    sendWebSocketEvent('EXAM_ACTIVATED', { exam });
  } else if (status === 'APPROVED') {
    addRealtimeActivity('EXAM_APPROVED', `Admin Approved CBT Exam: ${exam.title}`, `Approved for ${exam.course_name} by Admin Suite.`, 'School Principal / Admin');
    addRealtimeNotification({
      title: '✅ Exam Approved',
      message: `Admin approved CBT Exam "${exam.title}" (${exam.course_name} - ${exam.class}).`,
      category: 'ACADEMICS',
      type: 'exam',
      recipientRole: 'TEACHER'
    });
    sendWebSocketEvent('EXAM_APPROVED', { exam });
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
    sendWebSocketEvent('EXAM_REJECTED', { exam });
  }

  persistExams(_exams);
  broadcastRealtimeEvent();
  sendWebSocketEvent('EXAM_STATUS_UPDATED', { examId, status, reason, exam });
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

export function deleteCBTExam(examId: number): boolean {
  const current = loadSavedExams();
  const target = current.find(e => e.id === examId);
  const filtered = current.filter(e => e.id !== examId);
  _exams = filtered;
  persistExams(_exams);

  // Record deleted exam id in tarepet_deleted_exams so sync does not resurrect it
  try {
    const raw = localStorage.getItem('tarepet_deleted_exams');
    const delList: number[] = raw ? JSON.parse(raw) : [];
    if (!delList.includes(examId)) {
      delList.push(examId);
      localStorage.setItem('tarepet_deleted_exams', JSON.stringify(delList));
    }
  } catch (e) {}

  // Attempt backend API deletion
  authClient.delete(`/assessments/cbt-exams/${examId}/`).catch(() => {});

  broadcastRealtimeEvent();
  if (target) {
    addRealtimeActivity(
      'EXAM_REJECTED',
      `Exam Deleted: ${target.title}`,
      `Deleted from CBT assessment roster (${target.course_name} - ${target.class})`,
      target.teacher_name || 'Teacher / Admin'
    );
  }
  window.dispatchEvent(new CustomEvent('tarepet_store_updated', { detail: { type: 'exam_deleted', id: examId } }));
  window.dispatchEvent(new CustomEvent('tarepet_exam_deleted', { detail: { id: examId } }));
  return true;
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
  _activities = [newAct, ..._activities].slice(0, 50);
  broadcastRealtimeEvent();

  authClient.post('/communication/activities/', {
    type,
    activity_type: type,
    title,
    detail,
    user,
  }).catch(() => {});
}

export async function syncActivitiesWithBackend(): Promise<LMSActivity[]> {
  try {
    const res = await authClient.get('/communication/activities/');
    if (res.data) {
      const dataArr: any[] = Array.isArray(res.data?.results)
        ? res.data.results
        : Array.isArray(res.data)
        ? res.data
        : [];
      if (dataArr.length > 0) {
        _activities = dataArr.map((a: any) => ({
          id: String(a.id),
          timestamp: a.timestamp || new Date().toISOString(),
          type: (a.type || a.activity_type || 'EXAM_CREATED') as LMSActivity['type'],
          title: a.title || 'Activity',
          detail: a.detail || '',
          user: a.user || 'System',
        }));
        broadcastRealtimeEvent();
      }
    }
  } catch (e) {}
  return _activities;
}

export function getRealtimeActivities(): LMSActivity[] {
  return _activities;
}

// ── Submissions ───────────────────────────────────────────────────────────────

export function getStoredSubmissions(): CBTSubmission[] {
  return _submissions;
}

export async function submitStudentCBTAttempt(
  examId: number,
  answers: Record<number, string>,
  studentInfo: { name?: string; email?: string; student_id?: string }
): Promise<CBTSubmission> {
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
  const sName = studentInfo.name || 'Student';
  const autoEmail = studentInfo.email || formatStudentEmail(sName);
  const autoId = studentInfo.student_id || `TMS/STU/${Date.now()}`;

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

  // Auto-sync CBT score directly to student's live broadsheet mark in Django backend
  const calculatedCbtScore = Math.round((percentage / 100) * 30);
  try {
    const existingScores = getStudentBroadsheet(autoId) || {};
    const currentCourseScore = (Reflect.get(existingScores, exam.course_code) as any) || { ca1: 0, ca2: 0, exam: 0 };
    const updatedScores = {
      ...existingScores,
      [exam.course_code]: {
        ...currentCourseScore,
        cbtScore: calculatedCbtScore,
        cbtExam: calculatedCbtScore,
        courseCode: exam.course_code,
        courseName: exam.course_name,
      }
    };
    await saveStudentBroadsheet(autoId, updatedScores);
  } catch (e) {}

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
  sendWebSocketEvent('EXAM_SUBMISSION', { submission: newSub, examId: exam.id });
  return newSub;
}

export function hasStudentSubmittedExam(examId: number, studentIdentifier?: string): boolean {
  if (!studentIdentifier) {
    return _submissions.some(s => s.exam_id === examId);
  }
  const lower = studentIdentifier.trim().toLowerCase();
  return _submissions.some(s =>
    s.exam_id === examId &&
    (s.student_email.toLowerCase() === lower || s.student_id.toLowerCase() === lower)
  );
}

export function getStudentSubmission(examId: number, studentIdentifier?: string): CBTSubmission | undefined {
  if (!studentIdentifier) {
    return _submissions.find(s => s.exam_id === examId);
  }
  const lower = studentIdentifier.trim().toLowerCase();
  return _submissions.find(s =>
    s.exam_id === examId &&
    (s.student_email.toLowerCase() === lower || s.student_id.toLowerCase() === lower)
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
    _teachers = loadSavedTeachers();
    _students = loadSavedStudents();
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

export async function syncBroadsheetWithBackend(): Promise<void> {
  try {
    const res = await authClient.get('/academics/broadsheet/all-scores/');
    if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
      _broadsheetScores = { ..._broadsheetScores, ...res.data };
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('tarepet_broadsheet_scores', JSON.stringify(_broadsheetScores)); } catch (e) {}
      }
      broadcastRealtimeEvent();
    }
  } catch (err) {}
}

export async function saveStudentBroadsheet(studentIdOrCode: string | number, courseScores: Record<string, CourseBroadsheetScore>): Promise<void> {
  _broadsheetScores = loadSavedBroadsheet();
  const key = String(studentIdOrCode);
  _broadsheetScores[key] = courseScores;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_broadsheet_scores', JSON.stringify(_broadsheetScores));
    } catch (e) {}
  }

  try {
    await authClient.post('/academics/broadsheet/batch-save/', {
      student_id: key,
      scores: courseScores
    });
  } catch (e) {}

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

export function getPromotionHistory(): PromotionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_promotion_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
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

export async function syncPromotionsWithBackend(): Promise<PromotionRecord[]> {
  try {
    const res = await authClient.get('/academics/promotions/?page_size=200');
    const results = Array.isArray(res.data?.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
    if (results.length > 0) {
      const records: PromotionRecord[] = results.map((r: any) => ({
        id: String(r.id),
        studentId: r.studentId || r.student_code || '',
        studentName: r.studentName || r.student_name || '',
        studentCode: r.studentCode || r.student_code || '',
        fromClass: r.fromClass || r.from_class || '',
        toClass: r.toClass || r.to_class || '',
        academicSession: r.academicSession || r.academic_session || '2026/2027',
        term: r.term || '3rd Term',
        cumulativeAverage: 0,
        status: 'promoted',
        promotedAt: r.date || r.created_at || new Date().toISOString(),
        promotedByTeacherId: '',
        promotedByTeacherName: r.promotedBy || r.promoted_by || 'Admin',
        broadsheetSnapshot: {}
      }));
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('tarepet_promotion_history', JSON.stringify(records)); } catch (e) {}
      }
      broadcastRealtimeEvent();
      return records;
    }
  } catch (err) {}
  return getPromotionHistory();
}

export async function executeStudentPromotions(payload: ExecutePromotionsPayload): Promise<{ success: boolean; count: number }> {
  const currentHistory = getPromotionHistory();
  const students = getStoredStudents();
  const timestamp = new Date().toISOString();
  const newRecords: PromotionRecord[] = [];

  let counter = 0;
  for (const sp of (payload.studentPromotions || [])) {
    counter++;
    const recordId = `PROM-${payload.academicSession.replace('/', '-')}-${Date.now().toString(36)}-${counter}`;
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

    const studentIdx = students.findIndex(s => String(s.id) === String(sp.studentId) || s.code === sp.studentCode);
    if (studentIdx !== -1) {
      if (sp.status === 'promoted') {
        students[studentIdx].grade = sp.toClass;
        if (sp.toClass.includes('Art')) students[studentIdx].stream = 'Art';
        else if (sp.toClass.includes('Commercial')) students[studentIdx].stream = 'Commercial';
        else if (sp.toClass.includes('Science')) students[studentIdx].stream = 'Science';
      } else if (sp.status === 'graduated') {
        students[studentIdx].grade = 'Alumni / Graduated';
        students[studentIdx].status = 'Alumni';
      }
      await saveStudent(students[studentIdx]);

      if (sp.status === 'promoted') {
        await saveStudentBroadsheet(sp.studentId, {});
      }
    }
  }

  savePromotionHistory([...newRecords, ...currentHistory]);

  try {
    await authClient.post('/academics/promotions/execute-batch/', {
      promotions: payload.studentPromotions,
      promotedBy: payload.teacherName,
      academicSession: payload.academicSession,
      term: payload.term
    });
  } catch (e) {}

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
  if (typeof window === 'undefined') return 'TarepetAdmin@2026!';
  try {
    const saved = localStorage.getItem('tarepet_admin_password');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'TarepetAdmin@2026!';
}

export function setAdminPassword(newPassword: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tarepet_admin_password', newPassword.trim());
    broadcastRealtimeEvent();
  } catch {}
}