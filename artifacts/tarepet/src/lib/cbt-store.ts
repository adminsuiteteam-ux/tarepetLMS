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
  // â”€â”€ Senior Secondary Science Stream (SS 1 - SS 3) â”€â”€
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

  // â”€â”€ Senior Secondary Arts & Humanities / Commercial Stream (SS 1 - SS 3) â”€â”€
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
  const clean = fullName.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'student@tarepet.com';
  const firstName = parts[0];
  const surname = parts.length > 1 ? parts[parts.length - 1] : 'tarepet';
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
  admission_number?: string;
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

// â”€â”€ Persistent CBT Exams Storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Master Subjects & Curriculum System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  // â”€â”€ Senior Secondary Science Stream (14 Unique Subjects) â”€â”€
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

  // â”€â”€ Senior Secondary Art & Humanities Stream (11 Unique Subjects) â”€â”€
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

export const DEFAULT_STUDENTS: StudentRecord[] = [
  {
    id: 101,
    code: '3254',
    admissionNo: 'TMS/BSC3/3254',
    studentId: 'TMS/BSC3/3254',
    admission_number: 'TMS/BSC3/3254',
    name: 'Shedrach Pereilaou',
    email: 'shedrach.pereilaou@tarepet.com',
    password: '3254',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-04-28',
    phone: '08061166929',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Victory',
    parentPhone: '08061166929',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 102,
    code: '3211',
    admissionNo: 'TMS/BSC3/3211',
    studentId: 'TMS/BSC3/3211',
    admission_number: 'TMS/BSC3/3211',
    name: 'Churchill N. Blossom',
    email: 'churchill.blossom@tarepet.com',
    password: '3211',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-10-31',
    phone: '08061329161',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Churchill',
    parentPhone: '08061329161',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 103,
    code: '3324',
    admissionNo: 'TMS/BSC3/3324',
    studentId: 'TMS/BSC3/3324',
    admission_number: 'TMS/BSC3/3324',
    name: 'Okoruwa S. Deborah',
    email: 'okoruwa.deborah@tarepet.com',
    password: '3324',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-05-08',
    phone: '08069320112',
    country: 'Nigeria',
    stateOfOrigin: 'Edo',
    lga: 'Benin City',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Okoruwa',
    parentPhone: '08069320112',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 104,
    code: '3581',
    admissionNo: 'TMS/BSC3/3581',
    studentId: 'TMS/BSC3/3581',
    admission_number: 'TMS/BSC3/3581',
    name: 'Akhimien Eliana',
    email: 'eliana.akhimien@tarepet.com',
    password: '3581',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-02-16',
    phone: '07032615797',
    country: 'Nigeria',
    stateOfOrigin: 'Edo',
    lga: 'Esan',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Akhimien',
    parentPhone: '07032615797',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 105,
    code: '4006',
    admissionNo: 'TMS/BSC3/4006',
    studentId: 'TMS/BSC3/4006',
    admission_number: 'TMS/BSC3/4006',
    name: 'Kika Tamara',
    email: 'tamara.kika@tarepet.com',
    password: '4006',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-07-12',
    phone: '08037890628',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Bobby Kika',
    parentPhone: '08037890628',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 106,
    code: '3984',
    admissionNo: 'TMS/BSC3/3984',
    studentId: 'TMS/BSC3/3984',
    admission_number: 'TMS/BSC3/3984',
    name: 'Johnbo B. Jeanetta',
    email: 'jeanetta.johnbo@tarepet.com',
    password: '3984',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2015-11-28',
    phone: '08032576536',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Nembe',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Johnbo',
    parentPhone: '08032576536',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 107,
    code: '3300',
    admissionNo: 'TMS/BSC3/3300',
    studentId: 'TMS/BSC3/3300',
    admission_number: 'TMS/BSC3/3300',
    name: 'Dressman P. Ebibo',
    email: 'ebibo.dressman@tarepet.com',
    password: '3300',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-05-24',
    phone: '08063607380',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Brass',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Dressman',
    parentPhone: '08063607380',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 108,
    code: '3301',
    admissionNo: 'TMS/BSC3/3301',
    studentId: 'TMS/BSC3/3301',
    admission_number: 'TMS/BSC3/3301',
    name: 'Okeziri Treasure',
    email: 'treasure.okeziri@tarepet.com',
    password: '3301',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-05-24',
    phone: '08063607380',
    country: 'Nigeria',
    stateOfOrigin: 'Imo',
    lga: 'Owerri',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Okeziri',
    parentPhone: '08063607380',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 109,
    code: '3703',
    admissionNo: 'TMS/BSC3/3703',
    studentId: 'TMS/BSC3/3703',
    admission_number: 'TMS/BSC3/3703',
    name: 'Eboboro Christabel',
    email: 'christabel.eboboro@tarepet.com',
    password: '3703',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2017-07-07',
    phone: '09013608818',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Ughelli',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Ebotoro Gerald',
    parentPhone: '09013608818',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 110,
    code: '3953',
    admissionNo: 'TMS/BSC3/3953',
    studentId: 'TMS/BSC3/3953',
    admission_number: 'TMS/BSC3/3953',
    name: 'Abadi P. Perekowei',
    email: 'perekowei.abadi@tarepet.com',
    password: '3953',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-10-17',
    phone: '07031102194',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ekeremor',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Ebonce Agboye',
    parentPhone: '07031102194',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 111,
    code: '3329',
    admissionNo: 'TMS/BSC3/3329',
    studentId: 'TMS/BSC3/3329',
    admission_number: 'TMS/BSC3/3329',
    name: 'Menkinda Ambriel',
    email: 'ambriel.menkinda@tarepet.com',
    password: '3329',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2018-10-16',
    phone: '08032715190',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Port Harcourt',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs West',
    parentPhone: '08032715190',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 112,
    code: '3024',
    admissionNo: 'TMS/BSC3/3024',
    studentId: 'TMS/BSC3/3024',
    admission_number: 'TMS/BSC3/3024',
    name: 'Michael Precious',
    email: 'precious.michael@tarepet.com',
    password: '3024',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-01-05',
    phone: '08102326088',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Michael',
    parentPhone: '08102326088',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 113,
    code: '3058',
    admissionNo: 'TMS/BSC3/3058',
    studentId: 'TMS/BSC3/3058',
    admission_number: 'TMS/BSC3/3058',
    name: 'Columbus Joseph',
    email: 'joseph.columbus@tarepet.com',
    password: '3058',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2017-12-15',
    phone: '08036665427',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ogbia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Columbus',
    parentPhone: '08036665427',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 114,
    code: '3811',
    admissionNo: 'TMS/BSC3/3811',
    studentId: 'TMS/BSC3/3811',
    admission_number: 'TMS/BSC3/3811',
    name: 'Timothy Orji Mordecai',
    email: 'mordecai.timothy@tarepet.com',
    password: '3811',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2017-12-15',
    phone: '08031903644',
    country: 'Nigeria',
    stateOfOrigin: 'Abia',
    lga: 'Umuahia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Timothy',
    parentPhone: '08031903644',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 115,
    code: '3968',
    admissionNo: 'TMS/BSC3/3968',
    studentId: 'TMS/BSC3/3968',
    admission_number: 'TMS/BSC3/3968',
    name: 'Nsikak Emmanuel Destiny',
    email: 'destiny.nsikak@tarepet.com',
    password: '3968',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-06-11',
    phone: '08038667428',
    country: 'Nigeria',
    stateOfOrigin: 'Akwa Ibom',
    lga: 'Uyo',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Nsikak',
    parentPhone: '08038667428',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 116,
    code: '3125',
    admissionNo: 'TMS/BSC3/3125',
    studentId: 'TMS/BSC3/3125',
    admission_number: 'TMS/BSC3/3125',
    name: 'Osita Omasirichukwu',
    email: 'omasirichukwu.osita@tarepet.com',
    password: '3125',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-02-03',
    phone: '07067278391',
    country: 'Nigeria',
    stateOfOrigin: 'Anambra',
    lga: 'Onitsha',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Osita',
    parentPhone: '07067278391',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 117,
    code: '4093',
    admissionNo: 'TMS/BSC3/4093',
    studentId: 'TMS/BSC3/4093',
    admission_number: 'TMS/BSC3/4093',
    name: 'Kian Ebikpo C. Thompson',
    email: 'kian.thompson@tarepet.com',
    password: '4093',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2015-04-17',
    phone: '07065252362',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Kolokuma/Opokuma',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Thompson',
    parentPhone: '07065252362',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 118,
    code: '3166',
    admissionNo: 'TMS/BSC3/3166',
    studentId: 'TMS/BSC3/3166',
    admission_number: 'TMS/BSC3/3166',
    name: 'Bennett Ayimoni',
    email: 'ayimoni.bennett@tarepet.com',
    password: '3166',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-08-14',
    phone: '07069789781',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Bennett',
    parentPhone: '07069789781',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 119,
    code: '3167',
    admissionNo: 'TMS/BSC3/3167',
    studentId: 'TMS/BSC3/3167',
    admission_number: 'TMS/BSC3/3167',
    name: 'Pekene Ayibakuro',
    email: 'ayibakuro.pekene@tarepet.com',
    password: '3167',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-05-19',
    phone: '07069789781',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Pekene',
    parentPhone: '07069789781',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 120,
    code: '3972',
    admissionNo: 'TMS/BSC3/3972',
    studentId: 'TMS/BSC3/3972',
    admission_number: 'TMS/BSC3/3972',
    name: 'Jeremy Chimdike',
    email: 'jeremy.chimdike@tarepet.com',
    password: '3972',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-03-19',
    phone: '07069789781',
    country: 'Nigeria',
    stateOfOrigin: 'Imo',
    lga: 'Mbaitoli',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mrs Jane Peters',
    parentPhone: '07069789781',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 121,
    code: '3441',
    admissionNo: 'TMS/BSC3/3441',
    studentId: 'TMS/BSC3/3441',
    admission_number: 'TMS/BSC3/3441',
    name: 'Odi Audriann',
    email: 'audriann.odi@tarepet.com',
    password: '3441',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-07-11',
    phone: '07030981881',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Odi',
    parentPhone: '07030981881',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 122,
    code: '3025',
    admissionNo: 'TMS/BSC3/3025',
    studentId: 'TMS/BSC3/3025',
    admission_number: 'TMS/BSC3/3025',
    name: 'Precious Joseph',
    email: 'precious.joseph@tarepet.com',
    password: '3025',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2018-09-20',
    phone: '08035580967',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Joseph',
    parentPhone: '08035580967',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 123,
    code: '3026',
    admissionNo: 'TMS/BSC3/3026',
    studentId: 'TMS/BSC3/3026',
    admission_number: 'TMS/BSC3/3026',
    name: 'Daniella Ogolo',
    email: 'daniella.ogolo@tarepet.com',
    password: '3026',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2014-09-20',
    phone: '08035580967',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Opobo',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ogolo',
    parentPhone: '08035580967',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 124,
    code: '3270',
    admissionNo: 'TMS/BSC3/3270',
    studentId: 'TMS/BSC3/3270',
    admission_number: 'TMS/BSC3/3270',
    name: 'Opuofia Diepreye',
    email: 'diepreye.opuofia@tarepet.com',
    password: '3270',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-07-08',
    phone: '08035580967',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr Opuofia',
    parentPhone: '08035580967',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 125,
    code: '3135',
    admissionNo: 'TMS/BSC3/3135',
    studentId: 'TMS/BSC3/3135',
    admission_number: 'TMS/BSC3/3135',
    name: 'Ajuju Princess',
    email: 'princess.ajuju@tarepet.com',
    password: '3135',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2017-06-22',
    phone: '08036113305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ajuju',
    parentPhone: '08036113305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 126,
    code: '3110',
    admissionNo: 'TMS/BSC3/3110',
    studentId: 'TMS/BSC3/3110',
    admission_number: 'TMS/BSC3/3110',
    name: 'Odum Laura Kamsi',
    email: 'laura.odum@tarepet.com',
    password: '3110',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-05-26',
    phone: '07037252140',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Ahoada',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Odum',
    parentPhone: '07037252140',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 127,
    code: '3823',
    admissionNo: 'TMS/BSC3/3823',
    studentId: 'TMS/BSC3/3823',
    admission_number: 'TMS/BSC3/3823',
    name: 'Ezike Khillah',
    email: 'khillah.ezike@tarepet.com',
    password: '3823',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-05-19',
    phone: '07065206876',
    country: 'Nigeria',
    stateOfOrigin: 'Enugu',
    lga: 'Nsukka',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ezike',
    parentPhone: '07065206876',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 128,
    code: '3193',
    admissionNo: 'TMS/BSC3/3193',
    studentId: 'TMS/BSC3/3193',
    admission_number: 'TMS/BSC3/3193',
    name: 'Joel Brielle Keleebari',
    email: 'brielle.joel@tarepet.com',
    password: '3193',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-03-25',
    phone: '08039417329',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Khana',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Joel Barkpoa',
    parentPhone: '08039417329',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 129,
    code: '3943',
    admissionNo: 'TMS/BSC3/3943',
    studentId: 'TMS/BSC3/3943',
    admission_number: 'TMS/BSC3/3943',
    name: 'Lawson Oyenmomeni',
    email: 'oyenmomeni.lawson@tarepet.com',
    password: '3943',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-03-25',
    phone: '09038045041',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Nembe',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Lawson',
    parentPhone: '09038045041',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 130,
    code: '3165',
    admissionNo: 'TMS/BSC3/3165',
    studentId: 'TMS/BSC3/3165',
    admission_number: 'TMS/BSC3/3165',
    name: 'Nwanyibo Sochikanyima',
    email: 'sochikanyima.nwanyibo@tarepet.com',
    password: '3165',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-02-14',
    phone: '08039106445',
    country: 'Nigeria',
    stateOfOrigin: 'Imo',
    lga: 'Okigwe',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Chief Obrekwe',
    parentPhone: '08039106445',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 131,
    code: '3969',
    admissionNo: 'TMS/BSC3/3969',
    studentId: 'TMS/BSC3/3969',
    admission_number: 'TMS/BSC3/3969',
    name: 'Adikoko Seiyefa',
    email: 'seiyefa.adikoko@tarepet.com',
    password: '3969',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2018-06-11',
    phone: '08055546562',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Adikoko Ebitimi',
    parentPhone: '08055546562',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 132,
    code: '3156',
    admissionNo: 'TMS/BSC3/3156',
    studentId: 'TMS/BSC3/3156',
    admission_number: 'TMS/BSC3/3156',
    name: 'Diwene Nsikak E.',
    email: 'diwene.nsikak@tarepet.com',
    password: '3156',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2017-09-08',
    phone: '08038667428',
    country: 'Nigeria',
    stateOfOrigin: 'Akwa Ibom',
    lga: 'Eket',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Nsikak',
    parentPhone: '08038667428',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 133,
    code: '3582',
    admissionNo: 'TMS/BSC3/3582',
    studentId: 'TMS/BSC3/3582',
    admission_number: 'TMS/BSC3/3582',
    name: 'Marksonel Pere-ere',
    email: 'pereere.marksonel@tarepet.com',
    password: '3582',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-02-16',
    phone: '07031921596',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Markson',
    parentPhone: '07031921596',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 134,
    code: '3326',
    admissionNo: 'TMS/BSC3/3326',
    studentId: 'TMS/BSC3/3326',
    admission_number: 'TMS/BSC3/3326',
    name: 'Akhimien Eliora',
    email: 'eliora.akhimien@tarepet.com',
    password: '3326',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-01-27',
    phone: '07032615797',
    country: 'Nigeria',
    stateOfOrigin: 'Edo',
    lga: 'Esan',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Pst & Mrs Akhimien',
    parentPhone: '07032615797',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 135,
    code: '3048',
    admissionNo: 'TMS/BSC3/3048',
    studentId: 'TMS/BSC3/3048',
    admission_number: 'TMS/BSC3/3048',
    name: 'Bright Ayebakuro',
    email: 'ayebakuro.bright@tarepet.com',
    password: '3048',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-08-15',
    phone: '08137503522',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Bright',
    parentPhone: '08137503522',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 136,
    code: '3812',
    admissionNo: 'TMS/BSC3/3812',
    studentId: 'TMS/BSC3/3812',
    admission_number: 'TMS/BSC3/3812',
    name: 'Elaye Dewon',
    email: 'elaye.dewon@tarepet.com',
    password: '3812',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-08-15',
    phone: '08038009671',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Bright',
    parentPhone: '08038009671',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 137,
    code: '3451',
    admissionNo: 'TMS/BSC3/3451',
    studentId: 'TMS/BSC3/3451',
    admission_number: 'TMS/BSC3/3451',
    name: 'Ozori Woyengivari',
    email: 'woyengivari.ozori@tarepet.com',
    password: '3451',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2018-11-11',
    phone: '08067983219',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ozori',
    parentPhone: '08067983219',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 138,
    code: '3216',
    admissionNo: 'TMS/BSC3/3216',
    studentId: 'TMS/BSC3/3216',
    admission_number: 'TMS/BSC3/3216',
    name: 'Lucious Johnbull',
    email: 'lucious.johnbull@tarepet.com',
    password: '3216',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-10-09',
    phone: '08060829850',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ogbia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Johnbull',
    parentPhone: '08060829850',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 139,
    code: '3868',
    admissionNo: 'TMS/BSC3/3868',
    studentId: 'TMS/BSC3/3868',
    admission_number: 'TMS/BSC3/3868',
    name: 'Alfred Evo-Dabo',
    email: 'alfred.evodabo@tarepet.com',
    password: '3868',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-01-30',
    phone: '07030943601',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Abua/Odual',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Alfred Ebi Dan-Apu',
    parentPhone: '07030943601',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 140,
    code: '3277',
    admissionNo: 'TMS/BSC3/3277',
    studentId: 'TMS/BSC3/3277',
    admission_number: 'TMS/BSC3/3277',
    name: 'Gregory A. Moko',
    email: 'gregory.moko@tarepet.com',
    password: '3277',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-04-09',
    phone: '08038465522',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Moko',
    parentPhone: '08038465522',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 141,
    code: '3914',
    admissionNo: 'TMS/BSC3/3914',
    studentId: 'TMS/BSC3/3914',
    admission_number: 'TMS/BSC3/3914',
    name: 'Caleb Valentine',
    email: 'caleb.valentine@tarepet.com',
    password: '3914',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-04-09',
    phone: '08060703608',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Warri',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Valentine',
    parentPhone: '08060703608',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 142,
    code: '3720',
    admissionNo: 'TMS/BSC3/3720',
    studentId: 'TMS/BSC3/3720',
    admission_number: 'TMS/BSC3/3720',
    name: 'James Brisibe',
    email: 'james.brisibe@tarepet.com',
    password: '3720',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2019-05-26',
    phone: '07034268229',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Patani',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Royal James',
    parentPhone: '07034268229',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 143,
    code: '3721',
    admissionNo: 'TMS/BSC3/3721',
    studentId: 'TMS/BSC3/3721',
    admission_number: 'TMS/BSC3/3721',
    name: 'Akuna Tokoni Jody',
    email: 'tokoni.akuna@tarepet.com',
    password: '3721',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2019-05-26',
    phone: '08035446039',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Akuna',
    parentPhone: '08035446039',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 144,
    code: '3144',
    admissionNo: 'TMS/BSC3/3144',
    studentId: 'TMS/BSC3/3144',
    admission_number: 'TMS/BSC3/3144',
    name: 'Elekambote Kporodioti',
    email: 'kporodioti.elekambote@tarepet.com',
    password: '3144',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-10-02',
    phone: '08132420708',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Brass',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Elekambote',
    parentPhone: '08132420708',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 145,
    code: '3167-2',
    admissionNo: 'TMS/BSC3/3167-2',
    studentId: 'TMS/BSC3/3167-2',
    admission_number: 'TMS/BSC3/3167-2',
    name: 'Ayebakuro OS Pekene',
    email: 'ayebakuro.os.pekene@tarepet.com',
    password: '3167',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2018-05-19',
    phone: '07069789781',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 3',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Pekene',
    parentPhone: '07069789781',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  // ── SS3 Art Stream (1 to 14) ──
  {
    id: 201,
    code: '2937',
    admissionNo: 'TMS/SS3/ART/2937',
    studentId: 'TMS/SS3/ART/2937',
    admission_number: 'TMS/SS3/ART/2937',
    name: 'Aladei Perekedoumini Excel',
    email: 'excel.aladei@tarepet.com',
    password: '2937',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-10-27',
    phone: '08035107455',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Aladei',
    parentPhone: '08035107455',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 202,
    code: '1478',
    admissionNo: 'TMS/SS3/ART/1478',
    studentId: 'TMS/SS3/ART/1478',
    admission_number: 'TMS/SS3/ART/1478',
    name: 'Gwegwe Inifiebaiya',
    email: 'inifiebaiya.gwegwe@tarepet.com',
    password: '1478',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-05-14',
    phone: '08035107455',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Gwegwe',
    parentPhone: '08035107455',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 203,
    code: '1479',
    admissionNo: 'TMS/SS3/ART/1479',
    studentId: 'TMS/SS3/ART/1479',
    admission_number: 'TMS/SS3/ART/1479',
    name: 'Okeke Bright',
    email: 'bright.okeke@tarepet.com',
    password: '1479',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-09-12',
    phone: '08035428895',
    country: 'Nigeria',
    stateOfOrigin: 'Anambra',
    lga: 'Awka',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Okeke',
    parentPhone: '08035428895',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 204,
    code: '1853',
    admissionNo: 'TMS/SS3/ART/1853',
    studentId: 'TMS/SS3/ART/1853',
    admission_number: 'TMS/SS3/ART/1853',
    name: 'Ogiriki Victor',
    email: 'victor.ogiriki@tarepet.com',
    password: '1853',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-09-12',
    phone: '08035428895',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Ogiriki',
    parentPhone: '08035428895',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 205,
    code: '3213',
    admissionNo: 'TMS/SS3/ART/3213',
    studentId: 'TMS/SS3/ART/3213',
    admission_number: 'TMS/SS3/ART/3213',
    name: 'Irophy Emmanuella',
    email: 'emmanuella.irophy@tarepet.com',
    password: '3213',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2009-08-07',
    phone: '08035428895',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Irophy',
    parentPhone: '08035428895',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 206,
    code: '3251',
    admissionNo: 'TMS/SS3/ART/3251',
    studentId: 'TMS/SS3/ART/3251',
    admission_number: 'TMS/SS3/ART/3251',
    name: 'Emmanuel Success',
    email: 'success.emmanuel@tarepet.com',
    password: '3251',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-04-15',
    phone: '08033923760',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Warri',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Igedu',
    parentPhone: '08033923760',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 207,
    code: '2057',
    admissionNo: 'TMS/SS3/ART/2057',
    studentId: 'TMS/SS3/ART/2057',
    admission_number: 'TMS/SS3/ART/2057',
    name: 'Akpoghire Victory',
    email: 'victory.akpoghire@tarepet.com',
    password: '2057',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-02-23',
    phone: '07065325306',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Ughelli',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Akpoghire',
    parentPhone: '07065325306',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 208,
    code: '3214',
    admissionNo: 'TMS/SS3/ART/3214',
    studentId: 'TMS/SS3/ART/3214',
    admission_number: 'TMS/SS3/ART/3214',
    name: 'Irophy Precious',
    email: 'precious.irophy@tarepet.com',
    password: '3214',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-06-18',
    phone: '08035425895',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Irophy',
    parentPhone: '08035425895',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 209,
    code: '2921',
    admissionNo: 'TMS/SS3/ART/2921',
    studentId: 'TMS/SS3/ART/2921',
    admission_number: 'TMS/SS3/ART/2921',
    name: 'Irene Timiayebapre',
    email: 'timiayebapre.irene@tarepet.com',
    password: '2921',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-03-20',
    phone: '08033362073',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Irene',
    parentPhone: '08033362073',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 210,
    code: '2920',
    admissionNo: 'TMS/SS3/ART/2920',
    studentId: 'TMS/SS3/ART/2920',
    admission_number: 'TMS/SS3/ART/2920',
    name: 'Iwara Benedicta',
    email: 'benedicta.iwara@tarepet.com',
    password: '2920',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-03-20',
    phone: '08033362073',
    country: 'Nigeria',
    stateOfOrigin: 'Cross River',
    lga: 'Calabar',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Iwara',
    parentPhone: '08033362073',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 211,
    code: '3491',
    admissionNo: 'TMS/SS3/ART/3491',
    studentId: 'TMS/SS3/ART/3491',
    admission_number: 'TMS/SS3/ART/3491',
    name: 'Ikogi Esther',
    email: 'esther.ikogi@tarepet.com',
    password: '3491',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2014-03-20',
    phone: '08033362073',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Ikogi',
    parentPhone: '08033362073',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 212,
    code: '3492',
    admissionNo: 'TMS/SS3/ART/3492',
    studentId: 'TMS/SS3/ART/3492',
    admission_number: 'TMS/SS3/ART/3492',
    name: 'Aseghreen Lewis',
    email: 'lewis.aseghreen@tarepet.com',
    password: '3492',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-08-15',
    phone: '08038297361',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Nembe',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Jonathan',
    parentPhone: '08038297361',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 213,
    code: '3842',
    admissionNo: 'TMS/SS3/ART/3842',
    studentId: 'TMS/SS3/ART/3842',
    admission_number: 'TMS/SS3/ART/3842',
    name: 'Gabice Abundance',
    email: 'abundance.gabice@tarepet.com',
    password: '3842',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-03-18',
    phone: '08108002112',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ogbia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Gabice',
    parentPhone: '08108002112',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 214,
    code: '3220',
    admissionNo: 'TMS/SS3/ART/3220',
    studentId: 'TMS/SS3/ART/3220',
    admission_number: 'TMS/SS3/ART/3220',
    name: 'Obama Morris',
    email: 'morris.obama@tarepet.com',
    password: '3220',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-03-28',
    phone: '08108002112',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Brass',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Arts',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Obama',
    parentPhone: '08108002112',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },

  // ── SS3 Science Stream (15 to 60) ──
  {
    id: 215,
    code: '3239',
    admissionNo: 'TMS/SS3/SCI/3239',
    studentId: 'TMS/SS3/SCI/3239',
    admission_number: 'TMS/SS3/SCI/3239',
    name: 'Azagba Denzel',
    email: 'denzel.azagba@tarepet.com',
    password: '3239',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-05-19',
    phone: '08108002112',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Asaba',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Nelly Puskin',
    parentPhone: '08108002112',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 216,
    code: '3503',
    admissionNo: 'TMS/SS3/SCI/3503',
    studentId: 'TMS/SS3/SCI/3503',
    admission_number: 'TMS/SS3/SCI/3503',
    name: 'Diata Michelle',
    email: 'michelle.diata@tarepet.com',
    password: '3503',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-04-13',
    phone: '08066747864',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Diata',
    parentPhone: '08066747864',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 217,
    code: '3440',
    admissionNo: 'TMS/SS3/SCI/3440',
    studentId: 'TMS/SS3/SCI/3440',
    admission_number: 'TMS/SS3/SCI/3440',
    name: 'Ndubuaku Phlegon I.',
    email: 'phlegon.ndubuaku@tarepet.com',
    password: '3440',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-09-08',
    phone: '08034573472',
    country: 'Nigeria',
    stateOfOrigin: 'Imo',
    lga: 'Owerri',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Ndubuaku',
    parentPhone: '08034573472',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 218,
    code: '3396',
    admissionNo: 'TMS/SS3/SCI/3396',
    studentId: 'TMS/SS3/SCI/3396',
    admission_number: 'TMS/SS3/SCI/3396',
    name: 'Subi Princess',
    email: 'princess.subi@tarepet.com',
    password: '3396',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-07-29',
    phone: '08038107252',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ekeremor',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Subi',
    parentPhone: '08038107252',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 219,
    code: '3504',
    admissionNo: 'TMS/SS3/SCI/3504',
    studentId: 'TMS/SS3/SCI/3504',
    admission_number: 'TMS/SS3/SCI/3504',
    name: 'Leghemo Stephen',
    email: 'stephen.leghemo@tarepet.com',
    password: '3504',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-04-13',
    phone: '09033507976',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Leghemo',
    parentPhone: '09033507976',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 220,
    code: '3442',
    admissionNo: 'TMS/SS3/SCI/3442',
    studentId: 'TMS/SS3/SCI/3442',
    admission_number: 'TMS/SS3/SCI/3442',
    name: 'Goodluck Koru',
    email: 'koru.goodluck@tarepet.com',
    password: '3442',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-08-19',
    phone: '07066989342',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ogbia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Goodluck',
    parentPhone: '07066989342',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 221,
    code: '3443',
    admissionNo: 'TMS/SS3/SCI/3443',
    studentId: 'TMS/SS3/SCI/3443',
    admission_number: 'TMS/SS3/SCI/3443',
    name: 'Isaac Oyinwariyamo',
    email: 'oyinwariyamo.isaac@tarepet.com',
    password: '3443',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-08-19',
    phone: '07066989342',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Gesiese Ominah',
    parentPhone: '07066989342',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 222,
    code: '3397',
    admissionNo: 'TMS/SS3/SCI/3397',
    studentId: 'TMS/SS3/SCI/3397',
    admission_number: 'TMS/SS3/SCI/3397',
    name: 'Okringa Francis',
    email: 'francis.okringa@tarepet.com',
    password: '3397',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-07-29',
    phone: '08035712142',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Okuringya',
    parentPhone: '08035712142',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 223,
    code: '3317',
    admissionNo: 'TMS/SS3/SCI/3317',
    studentId: 'TMS/SS3/SCI/3317',
    admission_number: 'TMS/SS3/SCI/3317',
    name: 'Daitimi Ayibafie Godspower',
    email: 'godspower.daitimi@tarepet.com',
    password: '3317',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-01-04',
    phone: '07037599751',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Kolokuma/Opokuma',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr Doutimifi',
    parentPhone: '07037599751',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 224,
    code: '2336',
    admissionNo: 'TMS/SS3/SCI/2336',
    studentId: 'TMS/SS3/SCI/2336',
    admission_number: 'TMS/SS3/SCI/2336',
    name: 'Godknows Celimonowei Michael',
    email: 'michael.godknows@tarepet.com',
    password: '2336',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-04-07',
    phone: '07035699425',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr Michael',
    parentPhone: '07035699425',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 225,
    code: '1476',
    admissionNo: 'TMS/SS3/SCI/1476',
    studentId: 'TMS/SS3/SCI/1476',
    admission_number: 'TMS/SS3/SCI/1476',
    name: 'Bennett Kesowie',
    email: 'kesowie.bennett@tarepet.com',
    password: '1476',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-05-18',
    phone: '07035699425',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Bennett',
    parentPhone: '07035699425',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 226,
    code: '2043',
    admissionNo: 'TMS/SS3/SCI/2043',
    studentId: 'TMS/SS3/SCI/2043',
    admission_number: 'TMS/SS3/SCI/2043',
    name: 'Dick David Abadan',
    email: 'david.dick@tarepet.com',
    password: '2043',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-01-24',
    phone: '07066848221',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Brass',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Dick Abandani',
    parentPhone: '07066848221',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 227,
    code: '3857',
    admissionNo: 'TMS/SS3/SCI/3857',
    studentId: 'TMS/SS3/SCI/3857',
    admission_number: 'TMS/SS3/SCI/3857',
    name: 'Christopher Opukeme',
    email: 'opukeme.christopher@tarepet.com',
    password: '3857',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-01-07',
    phone: '08100100607',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Christopher',
    parentPhone: '08100100607',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 228,
    code: '3858',
    admissionNo: 'TMS/SS3/SCI/3858',
    studentId: 'TMS/SS3/SCI/3858',
    admission_number: 'TMS/SS3/SCI/3858',
    name: 'Komonibo Evidence',
    email: 'evidence.komonibo@tarepet.com',
    password: '3858',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2014-01-07',
    phone: '08100100607',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Dr Frances Komonibo',
    parentPhone: '08100100607',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 229,
    code: '3438',
    admissionNo: 'TMS/SS3/SCI/3438',
    studentId: 'TMS/SS3/SCI/3438',
    admission_number: 'TMS/SS3/SCI/3438',
    name: 'Onouha Emmanuel',
    email: 'emmanuel.onouha@tarepet.com',
    password: '3438',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-03-12',
    phone: '07035081582',
    country: 'Nigeria',
    stateOfOrigin: 'Imo',
    lga: 'Okigwe',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Onouha',
    parentPhone: '07035081582',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 230,
    code: '3895',
    admissionNo: 'TMS/SS3/SCI/3895',
    studentId: 'TMS/SS3/SCI/3895',
    admission_number: 'TMS/SS3/SCI/3895',
    name: 'Morris Perekeme',
    email: 'perekeme.morris@tarepet.com',
    password: '3895',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-09-29',
    phone: '07035081582',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Morris',
    parentPhone: '07035081582',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 231,
    code: '3439',
    admissionNo: 'TMS/SS3/SCI/3439',
    studentId: 'TMS/SS3/SCI/3439',
    admission_number: 'TMS/SS3/SCI/3439',
    name: 'Afamukoro Peremobowei Derick',
    email: 'derick.afamukoro@tarepet.com',
    password: '3439',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-03-12',
    phone: '07035081582',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Suobou',
    parentPhone: '07035081582',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 232,
    code: '3896',
    admissionNo: 'TMS/SS3/SCI/3896',
    studentId: 'TMS/SS3/SCI/3896',
    admission_number: 'TMS/SS3/SCI/3896',
    name: 'Afuluchukwu Emmanuel',
    email: 'emmanuel.afuluchukwu@tarepet.com',
    password: '3896',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-09-29',
    phone: '08037754762',
    country: 'Nigeria',
    stateOfOrigin: 'Anambra',
    lga: 'Onitsha',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Afuluchukwu',
    parentPhone: '08037754762',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 233,
    code: '3920',
    admissionNo: 'TMS/SS3/SCI/3920',
    studentId: 'TMS/SS3/SCI/3920',
    admission_number: 'TMS/SS3/SCI/3920',
    name: 'Igweshi Mary Obiageli',
    email: 'mary.igweshi@tarepet.com',
    password: '3920',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2014-01-30',
    phone: '08035446039',
    country: 'Nigeria',
    stateOfOrigin: 'Enugu',
    lga: 'Awgu',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Igweshi',
    parentPhone: '08035446039',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 234,
    code: '4020',
    admissionNo: 'TMS/SS3/SCI/4020',
    studentId: 'TMS/SS3/SCI/4020',
    admission_number: 'TMS/SS3/SCI/4020',
    name: 'Akuna Jethro',
    email: 'jethro.akuna@tarepet.com',
    password: '4020',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-07-08',
    phone: '08035446039',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Akuna',
    parentPhone: '08035446039',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 235,
    code: '2322',
    admissionNo: 'TMS/SS3/SCI/2322',
    studentId: 'TMS/SS3/SCI/2322',
    admission_number: 'TMS/SS3/SCI/2322',
    name: 'Beniangba Wealth',
    email: 'wealth.beniangba@tarepet.com',
    password: '2322',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-02-12',
    phone: '08037725554',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ogbia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Beniangba',
    parentPhone: '08037725554',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 236,
    code: '1460',
    admissionNo: 'TMS/SS3/SCI/1460',
    studentId: 'TMS/SS3/SCI/1460',
    admission_number: 'TMS/SS3/SCI/1460',
    name: 'Okon Bethel',
    email: 'bethel.okon@tarepet.com',
    password: '1460',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-06-18',
    phone: '08037727138',
    country: 'Nigeria',
    stateOfOrigin: 'Akwa Ibom',
    lga: 'Uyo',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Okon',
    parentPhone: '08037727138',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 237,
    code: '2989',
    admissionNo: 'TMS/SS3/SCI/2989',
    studentId: 'TMS/SS3/SCI/2989',
    admission_number: 'TMS/SS3/SCI/2989',
    name: 'Peters Godstour',
    email: 'godstour.peters@tarepet.com',
    password: '2989',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-02-26',
    phone: '08035517663',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Port Harcourt',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Peters',
    parentPhone: '08035517663',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 238,
    code: '2085',
    admissionNo: 'TMS/SS3/SCI/2085',
    studentId: 'TMS/SS3/SCI/2085',
    admission_number: 'TMS/SS3/SCI/2085',
    name: 'Onoro Flourish',
    email: 'flourish.onoro@tarepet.com',
    password: '2085',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-03-08',
    phone: '08035517663',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Flourish',
    parentPhone: '08035517663',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 239,
    code: '1831',
    admissionNo: 'TMS/SS3/SCI/1831',
    studentId: 'TMS/SS3/SCI/1831',
    admission_number: 'TMS/SS3/SCI/1831',
    name: 'Benjamin Shalom',
    email: 'shalom.benjamin@tarepet.com',
    password: '1831',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-05-20',
    phone: '08080673154',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ekeremor',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Benjamin',
    parentPhone: '08080673154',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 240,
    code: '1823',
    admissionNo: 'TMS/SS3/SCI/1823',
    studentId: 'TMS/SS3/SCI/1823',
    admission_number: 'TMS/SS3/SCI/1823',
    name: 'Zebedee Gershon',
    email: 'gershon.zebedee@tarepet.com',
    password: '1823',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-05-20',
    phone: '08080673154',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Zebedee',
    parentPhone: '08080673154',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 241,
    code: '3131',
    admissionNo: 'TMS/SS3/SCI/3131',
    studentId: 'TMS/SS3/SCI/3131',
    admission_number: 'TMS/SS3/SCI/3131',
    name: 'Okechukwu Amarachi',
    email: 'amarachi.okechukwu@tarepet.com',
    password: '3131',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-02-10',
    phone: '08035804822',
    country: 'Nigeria',
    stateOfOrigin: 'Enugu',
    lga: 'Nsukka',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Okechukwu',
    parentPhone: '08035804822',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 242,
    code: '3132',
    admissionNo: 'TMS/SS3/SCI/3132',
    studentId: 'TMS/SS3/SCI/3132',
    admission_number: 'TMS/SS3/SCI/3132',
    name: 'Okani Bradford',
    email: 'bradford.okani@tarepet.com',
    password: '3132',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2010-02-10',
    phone: '08035804822',
    country: 'Nigeria',
    stateOfOrigin: 'Rivers',
    lga: 'Ahoada',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Okani',
    parentPhone: '08035804822',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 243,
    code: '3133',
    admissionNo: 'TMS/SS3/SCI/3133',
    studentId: 'TMS/SS3/SCI/3133',
    admission_number: 'TMS/SS3/SCI/3133',
    name: 'Osakwe Blessing',
    email: 'blessing.osakwe@tarepet.com',
    password: '3133',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-02-10',
    phone: '08035804822',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Ndokwa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr Eboye Osakwe',
    parentPhone: '08035804822',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 244,
    code: '3134',
    admissionNo: 'TMS/SS3/SCI/3134',
    studentId: 'TMS/SS3/SCI/3134',
    admission_number: 'TMS/SS3/SCI/3134',
    name: 'Johnny Emmanuel',
    email: 'emmanuel.johnny@tarepet.com',
    password: '3134',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2010-02-10',
    phone: '08035804822',
    country: 'Nigeria',
    stateOfOrigin: 'Akwa Ibom',
    lga: 'Eket',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Johnny',
    parentPhone: '08035804822',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 245,
    code: '1888',
    admissionNo: 'TMS/SS3/SCI/1888',
    studentId: 'TMS/SS3/SCI/1888',
    admission_number: 'TMS/SS3/SCI/1888',
    name: 'Samson Happiness',
    email: 'happiness.samson@tarepet.com',
    password: '1888',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-02-28',
    phone: '07066658661',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Kolokuma/Opokuma',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Dr Evans Osaisai',
    parentPhone: '07066658661',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 246,
    code: '3461',
    admissionNo: 'TMS/SS3/SCI/3461',
    studentId: 'TMS/SS3/SCI/3461',
    admission_number: 'TMS/SS3/SCI/3461',
    name: 'Osaisai Kathleen',
    email: 'kathleen.osaisai@tarepet.com',
    password: '3461',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-07-09',
    phone: '07066658661',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Kolokuma/Opokuma',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Dr Evans Osaisai',
    parentPhone: '07066658661',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 247,
    code: '3520',
    admissionNo: 'TMS/SS3/SCI/3520',
    studentId: 'TMS/SS3/SCI/3520',
    admission_number: 'TMS/SS3/SCI/3520',
    name: 'Iwuchukwu Riola',
    email: 'riola.iwuchukwu@tarepet.com',
    password: '3520',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-08-10',
    phone: '08031990852',
    country: 'Nigeria',
    stateOfOrigin: 'Imo',
    lga: 'Orlu',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Michael',
    parentPhone: '08031990852',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 248,
    code: '2215',
    admissionNo: 'TMS/SS3/SCI/2215',
    studentId: 'TMS/SS3/SCI/2215',
    admission_number: 'TMS/SS3/SCI/2215',
    name: 'Samuel Collins',
    email: 'collins.samuel@tarepet.com',
    password: '2215',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2010-08-10',
    phone: '08058705109',
    country: 'Nigeria',
    stateOfOrigin: 'Delta',
    lga: 'Patani',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Samuel O. Samuel',
    parentPhone: '08058705109',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 249,
    code: '3846',
    admissionNo: 'TMS/SS3/SCI/3846',
    studentId: 'TMS/SS3/SCI/3846',
    admission_number: 'TMS/SS3/SCI/3846',
    name: 'Ashimi Oluwagbotahan',
    email: 'oluwagbotahan.ashimi@tarepet.com',
    password: '3846',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2010-08-10',
    phone: '08036744931',
    country: 'Nigeria',
    stateOfOrigin: 'Oyo',
    lga: 'Ibadan',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Ashimi',
    parentPhone: '08036744931',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 250,
    code: '3335',
    admissionNo: 'TMS/SS3/SCI/3335',
    studentId: 'TMS/SS3/SCI/3335',
    admission_number: 'TMS/SS3/SCI/3335',
    name: 'Ogiuwie Michelle',
    email: 'michelle.ogiuwie@tarepet.com',
    password: '3335',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2009-07-26',
    phone: '08036744931',
    country: 'Nigeria',
    stateOfOrigin: 'Edo',
    lga: 'Benin City',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Ogiuwie',
    parentPhone: '08036744931',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 251,
    code: '3840',
    admissionNo: 'TMS/SS3/SCI/3840',
    studentId: 'TMS/SS3/SCI/3840',
    admission_number: 'TMS/SS3/SCI/3840',
    name: 'James Delight',
    email: 'delight.james@tarepet.com',
    password: '3840',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2009-07-26',
    phone: '08036744931',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs James',
    parentPhone: '08036744931',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 252,
    code: '3112',
    admissionNo: 'TMS/SS3/SCI/3112',
    studentId: 'TMS/SS3/SCI/3112',
    admission_number: 'TMS/SS3/SCI/3112',
    name: 'Biso Eric',
    email: 'eric.biso@tarepet.com',
    password: '3112',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2009-08-25',
    phone: '08036744931',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Brass',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Biso',
    parentPhone: '08036744931',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 253,
    code: '3834',
    admissionNo: 'TMS/SS3/SCI/3834',
    studentId: 'TMS/SS3/SCI/3834',
    admission_number: 'TMS/SS3/SCI/3834',
    name: 'Lawson Favour',
    email: 'favour.lawson@tarepet.com',
    password: '3834',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-04-26',
    phone: '09038045041',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Nembe',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Lawson',
    parentPhone: '09038045041',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 254,
    code: '3861',
    admissionNo: 'TMS/SS3/SCI/3861',
    studentId: 'TMS/SS3/SCI/3861',
    admission_number: 'TMS/SS3/SCI/3861',
    name: 'Ayakpo Emmanuel',
    email: 'emmanuel.ayakpo@tarepet.com',
    password: '3861',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-04-26',
    phone: '08033178062',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Ayakpo',
    parentPhone: '08033178062',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 255,
    code: '3762',
    admissionNo: 'TMS/SS3/SCI/3762',
    studentId: 'TMS/SS3/SCI/3762',
    admission_number: 'TMS/SS3/SCI/3762',
    name: 'Ayebatonye Ginah',
    email: 'ginah.ayebatonye@tarepet.com',
    password: '3762',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-10-23',
    phone: '08083749680',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ogbia',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Ginah Banasin-Opre',
    parentPhone: '08083749680',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 256,
    code: '3862',
    admissionNo: 'TMS/SS3/SCI/3862',
    studentId: 'TMS/SS3/SCI/3862',
    admission_number: 'TMS/SS3/SCI/3862',
    name: 'Akpobolokeme Brightness',
    email: 'brightness.akpobolokeme@tarepet.com',
    password: '3862',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-10-23',
    phone: '08160238111',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Ekeremor',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Suba Akpobolokeme',
    parentPhone: '08160238111',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 257,
    code: '3863',
    admissionNo: 'TMS/SS3/SCI/3863',
    studentId: 'TMS/SS3/SCI/3863',
    admission_number: 'TMS/SS3/SCI/3863',
    name: 'Amasomaowei Deborah',
    email: 'deborah.amasomaowei@tarepet.com',
    password: '3863',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-10-23',
    phone: '08160238111',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Amasomaowei',
    parentPhone: '08160238111',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 258,
    code: '3864',
    admissionNo: 'TMS/SS3/SCI/3864',
    studentId: 'TMS/SS3/SCI/3864',
    admission_number: 'TMS/SS3/SCI/3864',
    name: 'Olukpo Desire',
    email: 'desire.olukpo@tarepet.com',
    password: '3864',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-10-23',
    phone: '08038195580',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Olukpo',
    parentPhone: '08038195580',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 259,
    code: '3865',
    admissionNo: 'TMS/SS3/SCI/3865',
    studentId: 'TMS/SS3/SCI/3865',
    admission_number: 'TMS/SS3/SCI/3865',
    name: 'Yongosi Kingdavid',
    email: 'kingdavid.yongosi@tarepet.com',
    password: '3865',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-10-23',
    phone: '08038195580',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Sagbama',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Yongosi Joyful',
    parentPhone: '08038195580',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 260,
    code: '3866',
    admissionNo: 'TMS/SS3/SCI/3866',
    studentId: 'TMS/SS3/SCI/3866',
    admission_number: 'TMS/SS3/SCI/3866',
    name: 'Oweifawari Tariebi',
    email: 'tariebi.oweifawari@tarepet.com',
    password: '3866',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-10-23',
    phone: '07038421059',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Southern Ijaw',
    address: 'Yenagoa, Bayelsa State',
    grade: 'SS3',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: 'Mr & Mrs Oweifawari',
    parentPhone: '07038421059',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  // ── JSS 3 (Entries 1 to 79) ──
  {
    id: 301,
    code: '3394',
    admissionNo: 'TMS/JSS3/3394',
    studentId: 'TMS/JSS3/3394',
    admission_number: 'TMS/JSS3/3394',
    name: 'Briggs Eluan Motu',
    email: 'eluan.briggs@tarepet.com',
    password: '3394',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-05-20',
    phone: '08037219680',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Mcfall',
    parentPhone: '08037219680',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 302,
    code: '3893',
    admissionNo: 'TMS/JSS3/3893',
    studentId: 'TMS/JSS3/3893',
    admission_number: 'TMS/JSS3/3893',
    name: 'Polo Pearl Tamara',
    email: 'pearl.polo@tarepet.com',
    password: '3893',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-02-14',
    phone: '07060800941',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ikaebimo',
    parentPhone: '07060800941',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 303,
    code: '3850',
    admissionNo: 'TMS/JSS3/3850',
    studentId: 'TMS/JSS3/3850',
    admission_number: 'TMS/JSS3/3850',
    name: 'Ikaebimo Ayebaekipreye',
    email: 'ayebaekipreye.ikaebimo@tarepet.com',
    password: '3850',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-07-23',
    phone: '07069572455',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Chief & Mrs Ere',
    parentPhone: '07069572455',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 304,
    code: '3837',
    admissionNo: 'TMS/JSS3/3837',
    studentId: 'TMS/JSS3/3837',
    admission_number: 'TMS/JSS3/3837',
    name: 'Ere Glory Oyintonbra',
    email: 'glory.ere@tarepet.com',
    password: '3837',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-10-05',
    phone: '08039108040',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Engr Jongosi',
    parentPhone: '08039108040',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 305,
    code: '4101',
    admissionNo: 'TMS/JSS3/4101',
    studentId: 'TMS/JSS3/4101',
    admission_number: 'TMS/JSS3/4101',
    name: 'Yongosi Ebifie Love',
    email: 'love.yongosi@tarepet.com',
    password: '4101',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-08-15',
    phone: '08039108040',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Jongosi',
    parentPhone: '08039108040',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 306,
    code: '3152',
    admissionNo: 'TMS/JSS3/3152',
    studentId: 'TMS/JSS3/3152',
    admission_number: 'TMS/JSS3/3152',
    name: 'Eke Oyindoubara',
    email: 'oyindoubara.eke@tarepet.com',
    password: '3152',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-03-18',
    phone: '08038195580',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Eke',
    parentPhone: '08038195580',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 307,
    code: '4102',
    admissionNo: 'TMS/JSS3/4102',
    studentId: 'TMS/JSS3/4102',
    admission_number: 'TMS/JSS3/4102',
    name: 'Diri Stephanie',
    email: 'stephanie.diri@tarepet.com',
    password: '4102',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-04-12',
    phone: '08038195580',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Diri',
    parentPhone: '08038195580',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 308,
    code: '4103',
    admissionNo: 'TMS/JSS3/4103',
    studentId: 'TMS/JSS3/4103',
    admission_number: 'TMS/JSS3/4103',
    name: 'Nimi Kelly',
    email: 'kelly.nimi@tarepet.com',
    password: '4103',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-11-20',
    phone: '08033707637',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Kelly',
    parentPhone: '08033707637',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 309,
    code: '3853',
    admissionNo: 'TMS/JSS3/3853',
    studentId: 'TMS/JSS3/3853',
    admission_number: 'TMS/JSS3/3853',
    name: 'Okpara Excel Oluchukwu',
    email: 'excel.okpara@tarepet.com',
    password: '3853',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-07-29',
    phone: '08033707637',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Okpara',
    parentPhone: '08033707637',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 310,
    code: '3833',
    admissionNo: 'TMS/JSS3/3833',
    studentId: 'TMS/JSS3/3833',
    admission_number: 'TMS/JSS3/3833',
    name: 'Usigbe Rex Cyril',
    email: 'rex.usigbe@tarepet.com',
    password: '3833',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-10-01',
    phone: '08032624848',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Usigbe',
    parentPhone: '08032624848',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 311,
    code: '3717',
    admissionNo: 'TMS/JSS3/3717',
    studentId: 'TMS/JSS3/3717',
    admission_number: 'TMS/JSS3/3717',
    name: 'Mnabaihe Favour',
    email: 'favour.mnabaihe@tarepet.com',
    password: '3717',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-09-10',
    phone: '08035985157',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Dr Lawson',
    parentPhone: '08035985157',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 312,
    code: '4104',
    admissionNo: 'TMS/JSS3/4104',
    studentId: 'TMS/JSS3/4104',
    admission_number: 'TMS/JSS3/4104',
    name: 'Lawson Martha',
    email: 'martha.lawson@tarepet.com',
    password: '4104',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-01-15',
    phone: '08035985157',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Dr Lawson',
    parentPhone: '08035985157',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 313,
    code: '2189',
    admissionNo: 'TMS/JSS3/2189',
    studentId: 'TMS/JSS3/2189',
    admission_number: 'TMS/JSS3/2189',
    name: 'Goumenen Oweibo Joy',
    email: 'joy.goumenen@tarepet.com',
    password: '2189',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-01-24',
    phone: '08035985157',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Digha Nelson',
    parentPhone: '08035985157',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 314,
    code: '3953',
    admissionNo: 'TMS/JSS3/3953',
    studentId: 'TMS/JSS3/3953',
    admission_number: 'TMS/JSS3/3953',
    name: 'Ogbu Victor',
    email: 'victor.ogbu@tarepet.com',
    password: '3953',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-06-01',
    phone: '08035435685',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Imbimoh',
    parentPhone: '08035435685',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 315,
    code: '4105',
    admissionNo: 'TMS/JSS3/4105',
    studentId: 'TMS/JSS3/4105',
    admission_number: 'TMS/JSS3/4105',
    name: 'Imbimoh Anthony Adriel',
    email: 'anthony.imbimoh@tarepet.com',
    password: '4105',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-08-19',
    phone: '08033911539',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Imbimoh',
    parentPhone: '08033911539',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 316,
    code: '3525',
    admissionNo: 'TMS/JSS3/3525',
    studentId: 'TMS/JSS3/3525',
    admission_number: 'TMS/JSS3/3525',
    name: 'Iwu Marcelous',
    email: 'marcelous.iwu@tarepet.com',
    password: '3525',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-06-13',
    phone: '08140126070',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Eze',
    parentPhone: '08140126070',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 317,
    code: '3934',
    admissionNo: 'TMS/JSS3/3934',
    studentId: 'TMS/JSS3/3934',
    admission_number: 'TMS/JSS3/3934',
    name: 'Eze Jude',
    email: 'jude.eze@tarepet.com',
    password: '3934',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-10-12',
    phone: '08035573019',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Azza Ogbonna',
    parentPhone: '08035573019',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 318,
    code: '3848',
    admissionNo: 'TMS/JSS3/3848',
    studentId: 'TMS/JSS3/3848',
    admission_number: 'TMS/JSS3/3848',
    name: 'Ogbonna Precious Nneoma',
    email: 'precious.ogbonna@tarepet.com',
    password: '3848',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2014-05-03',
    phone: '08037860837',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Owei',
    parentPhone: '08037860837',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 319,
    code: '4106',
    admissionNo: 'TMS/JSS3/4106',
    studentId: 'TMS/JSS3/4106',
    admission_number: 'TMS/JSS3/4106',
    name: 'Owei Bigboye Merrilyn',
    email: 'merrilyn.owei@tarepet.com',
    password: '4106',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-03-22',
    phone: '08037860837',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Owei',
    parentPhone: '08037860837',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 320,
    code: '3845',
    admissionNo: 'TMS/JSS3/3845',
    studentId: 'TMS/JSS3/3845',
    admission_number: 'TMS/JSS3/3845',
    name: 'Jideri Godiya',
    email: 'godiya.jideri@tarepet.com',
    password: '3845',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-12-05',
    phone: '07038678427',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Jideri',
    parentPhone: '07038678427',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 321,
    code: '3839',
    admissionNo: 'TMS/JSS3/3839',
    studentId: 'TMS/JSS3/3839',
    admission_number: 'TMS/JSS3/3839',
    name: 'Agnikpura Oloyinkuro',
    email: 'oloyinkuro.agnikpura@tarepet.com',
    password: '3839',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-06-14',
    phone: '08037648708',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Opuene Douglas',
    parentPhone: '08037648708',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 322,
    code: '4107',
    admissionNo: 'TMS/JSS3/4107',
    studentId: 'TMS/JSS3/4107',
    admission_number: 'TMS/JSS3/4107',
    name: 'Opuene Mira Aschinam',
    email: 'mira.opuene@tarepet.com',
    password: '4107',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-09-28',
    phone: '08037648708',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Opuene Douglas',
    parentPhone: '08037648708',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 323,
    code: '2210',
    admissionNo: 'TMS/JSS3/2210',
    studentId: 'TMS/JSS3/2210',
    admission_number: 'TMS/JSS3/2210',
    name: 'Diepreye Praise Titus',
    email: 'praise.diepreye@tarepet.com',
    password: '2210',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-07-15',
    phone: '09068654712',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr Titus',
    parentPhone: '09068654712',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 324,
    code: '4016',
    admissionNo: 'TMS/JSS3/4016',
    studentId: 'TMS/JSS3/4016',
    admission_number: 'TMS/JSS3/4016',
    name: 'Ogbara Gwon Izibefie',
    email: 'gwon.ogbara@tarepet.com',
    password: '4016',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2010-09-27',
    phone: '08066571993',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Chief & Mrs Ogbara',
    parentPhone: '08066571993',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 325,
    code: '4045',
    admissionNo: 'TMS/JSS3/4045',
    studentId: 'TMS/JSS3/4045',
    admission_number: 'TMS/JSS3/4045',
    name: 'Ezekiel Wilfred Samuel',
    email: 'wilfred.ezekiel@tarepet.com',
    password: '4045',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-04-16',
    phone: '08086548245',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Patricia Ezekiel',
    parentPhone: '08086548245',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 326,
    code: '3963',
    admissionNo: 'TMS/JSS3/3963',
    studentId: 'TMS/JSS3/3963',
    admission_number: 'TMS/JSS3/3963',
    name: 'Idauye Clarc Divine',
    email: 'clarc.idauye@tarepet.com',
    password: '3963',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-10-18',
    phone: '08086548245',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Idauye',
    parentPhone: '08086548245',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 327,
    code: '2926',
    admissionNo: 'TMS/JSS3/2926',
    studentId: 'TMS/JSS3/2926',
    admission_number: 'TMS/JSS3/2926',
    name: 'Joshua Bodongefa',
    email: 'bodongefa.joshua@tarepet.com',
    password: '2926',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-03-29',
    phone: '08035728200',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Bodongefa Otoi',
    parentPhone: '08035728200',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 328,
    code: '3844',
    admissionNo: 'TMS/JSS3/3844',
    studentId: 'TMS/JSS3/3844',
    admission_number: 'TMS/JSS3/3844',
    name: 'Fawei Emmanuel',
    email: 'emmanuel.fawei@tarepet.com',
    password: '3844',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-01-06',
    phone: '08030852977',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Douyari Benjami',
    parentPhone: '08030852977',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 329,
    code: '4108',
    admissionNo: 'TMS/JSS3/4108',
    studentId: 'TMS/JSS3/4108',
    admission_number: 'TMS/JSS3/4108',
    name: 'Eyindongha Sylvia',
    email: 'sylvia.eyindongha@tarepet.com',
    password: '4108',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-05-11',
    phone: '08030852977',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Eyindongha',
    parentPhone: '08030852977',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 330,
    code: '4109',
    admissionNo: 'TMS/JSS3/4109',
    studentId: 'TMS/JSS3/4109',
    admission_number: 'TMS/JSS3/4109',
    name: 'Ingiy Gold Chimeremeze',
    email: 'gold.ingiy@tarepet.com',
    password: '4109',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-11-04',
    phone: '08009689137',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ingiy',
    parentPhone: '08009689137',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 331,
    code: '3854',
    admissionNo: 'TMS/JSS3/3854',
    studentId: 'TMS/JSS3/3854',
    admission_number: 'TMS/JSS3/3854',
    name: 'Preye Michael',
    email: 'michael.preye@tarepet.com',
    password: '3854',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-08-01',
    phone: '08009689137',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ezon-ebi',
    parentPhone: '08009689137',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 332,
    code: '3626',
    admissionNo: 'TMS/JSS3/3626',
    studentId: 'TMS/JSS3/3626',
    admission_number: 'TMS/JSS3/3626',
    name: 'Columbus Wisdom',
    email: 'wisdom.columbus@tarepet.com',
    password: '3626',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-02-27',
    phone: '08037348110',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Uchenna',
    parentPhone: '08037348110',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 333,
    code: '4110',
    admissionNo: 'TMS/JSS3/4110',
    studentId: 'TMS/JSS3/4110',
    admission_number: 'TMS/JSS3/4110',
    name: 'Ezon-ebi Ebiagerake',
    email: 'ebiagerake.ezonebi@tarepet.com',
    password: '4110',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-07-19',
    phone: '08037348110',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ezon-ebi',
    parentPhone: '08037348110',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 334,
    code: '4010',
    admissionNo: 'TMS/JSS3/4010',
    studentId: 'TMS/JSS3/4010',
    admission_number: 'TMS/JSS3/4010',
    name: 'Uchenna Precious',
    email: 'precious.uchenna@tarepet.com',
    password: '4010',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-04-26',
    phone: '08064256922',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Enahoro',
    parentPhone: '08064256922',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 335,
    code: '4111',
    admissionNo: 'TMS/JSS3/4111',
    studentId: 'TMS/JSS3/4111',
    admission_number: 'TMS/JSS3/4111',
    name: 'Timiebi Tokoni Destiny',
    email: 'tokoni.timiebi@tarepet.com',
    password: '4111',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-08-23',
    phone: '08064256922',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Timiebi',
    parentPhone: '08064256922',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 336,
    code: '3851',
    admissionNo: 'TMS/JSS3/3851',
    studentId: 'TMS/JSS3/3851',
    admission_number: 'TMS/JSS3/3851',
    name: 'Enahoro Fredrick',
    email: 'fredrick.enahoro@tarepet.com',
    password: '3851',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-08-25',
    phone: '08002226442',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Edwin Vincent',
    parentPhone: '08002226442',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 337,
    code: '4112',
    admissionNo: 'TMS/JSS3/4112',
    studentId: 'TMS/JSS3/4112',
    admission_number: 'TMS/JSS3/4112',
    name: 'Konyefa Joseph',
    email: 'joseph.konyefa@tarepet.com',
    password: '4112',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-03-17',
    phone: '08002226442',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Konyefa',
    parentPhone: '08002226442',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 338,
    code: '3836',
    admissionNo: 'TMS/JSS3/3836',
    studentId: 'TMS/JSS3/3836',
    admission_number: 'TMS/JSS3/3836',
    name: 'Olaedo Pearl Edwin',
    email: 'pearl.olaedo@tarepet.com',
    password: '3836',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-08-20',
    phone: '09066248055',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Udeme',
    parentPhone: '09066248055',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 339,
    code: '3524',
    admissionNo: 'TMS/JSS3/3524',
    studentId: 'TMS/JSS3/3524',
    admission_number: 'TMS/JSS3/3524',
    name: 'Abraham Johnson I.',
    email: 'johnson.abraham@tarepet.com',
    password: '3524',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2010-07-16',
    phone: '08140126070',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Eze',
    parentPhone: '08140126070',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 340,
    code: '3252',
    admissionNo: 'TMS/JSS3/3252',
    studentId: 'TMS/JSS3/3252',
    admission_number: 'TMS/JSS3/3252',
    name: 'Pekene Roseadella',
    email: 'roseadella.pekene@tarepet.com',
    password: '3252',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-09-30',
    phone: '08033923760',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Izedu',
    parentPhone: '08033923760',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 341,
    code: '4055',
    admissionNo: 'TMS/JSS3/4055',
    studentId: 'TMS/JSS3/4055',
    admission_number: 'TMS/JSS3/4055',
    name: 'Cliflua Udeme Akpan',
    email: 'udeme.cliflua@tarepet.com',
    password: '4055',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-07-06',
    phone: '08037058871',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Anmiri Edmond',
    parentPhone: '08037058871',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 342,
    code: '4113',
    admissionNo: 'TMS/JSS3/4113',
    studentId: 'TMS/JSS3/4113',
    admission_number: 'TMS/JSS3/4113',
    name: 'Eze Marycynthia Chizom',
    email: 'marycynthia.eze@tarepet.com',
    password: '4113',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-11-12',
    phone: '08037058871',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Eze',
    parentPhone: '08037058871',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 343,
    code: '4114',
    admissionNo: 'TMS/JSS3/4114',
    studentId: 'TMS/JSS3/4114',
    admission_number: 'TMS/JSS3/4114',
    name: 'Emmanuel Favour Ombline',
    email: 'favour.emmanuel@tarepet.com',
    password: '4114',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-04-19',
    phone: '08037058871',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Emmanuel',
    parentPhone: '08037058871',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 344,
    code: '4115',
    admissionNo: 'TMS/JSS3/4115',
    studentId: 'TMS/JSS3/4115',
    admission_number: 'TMS/JSS3/4115',
    name: 'Amirin Fortune T.',
    email: 'fortune.amirin@tarepet.com',
    password: '4115',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-12-02',
    phone: '08037058871',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Anmiri Edmond',
    parentPhone: '08037058871',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 345,
    code: '3935',
    admissionNo: 'TMS/JSS3/3935',
    studentId: 'TMS/JSS3/3935',
    admission_number: 'TMS/JSS3/3935',
    name: 'Ebiware Wisdom Tamara',
    email: 'wisdom.ebiware@tarepet.com',
    password: '3935',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-04-15',
    phone: '08105913293',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Ebiware Wisdom',
    parentPhone: '08105913293',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 346,
    code: '2292',
    admissionNo: 'TMS/JSS3/2292',
    studentId: 'TMS/JSS3/2292',
    admission_number: 'TMS/JSS3/2292',
    name: 'Kormene Manuelou C.',
    email: 'manuelou.kormene@tarepet.com',
    password: '2292',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-07-22',
    phone: '08063915395',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr Wanogho',
    parentPhone: '08063915395',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 347,
    code: '3914',
    admissionNo: 'TMS/JSS3/3914',
    studentId: 'TMS/JSS3/3914',
    admission_number: 'TMS/JSS3/3914',
    name: 'Nelson Wanogho Apotha',
    email: 'wanogho.nelson@tarepet.com',
    password: '3914',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-05-07',
    phone: '08039106445',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Chief Nwonyibo',
    parentPhone: '08039106445',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 348,
    code: '3608',
    admissionNo: 'TMS/JSS3/3608',
    studentId: 'TMS/JSS3/3608',
    admission_number: 'TMS/JSS3/3608',
    name: 'Nwonyibo Obiekwe C.',
    email: 'obiekwe.nwonyibo@tarepet.com',
    password: '3608',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-06-18',
    phone: '08035373051',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Egbelegi',
    parentPhone: '08035373051',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 349,
    code: '4116',
    admissionNo: 'TMS/JSS3/4116',
    studentId: 'TMS/JSS3/4116',
    admission_number: 'TMS/JSS3/4116',
    name: 'Ogogo Treasure Perere',
    email: 'treasure.ogogo@tarepet.com',
    password: '4116',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-03-14',
    phone: '08035373051',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ogogo',
    parentPhone: '08035373051',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 350,
    code: '3410',
    admissionNo: 'TMS/JSS3/3410',
    studentId: 'TMS/JSS3/3410',
    admission_number: 'TMS/JSS3/3410',
    name: 'Egbelegi Harold T.',
    email: 'harold.egbelegi@tarepet.com',
    password: '3410',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-09-07',
    phone: '08035425895',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Irophy Kirifagha',
    parentPhone: '08035425895',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 351,
    code: '4049',
    admissionNo: 'TMS/JSS3/4049',
    studentId: 'TMS/JSS3/4049',
    admission_number: 'TMS/JSS3/4049',
    name: 'Akabou Abigail T.',
    email: 'abigail.akabou@tarepet.com',
    password: '4049',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2010-09-30',
    phone: '08033860224',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Tobon Lucky',
    parentPhone: '08033860224',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 352,
    code: '4117',
    admissionNo: 'TMS/JSS3/4117',
    studentId: 'TMS/JSS3/4117',
    admission_number: 'TMS/JSS3/4117',
    name: 'Gesige Joshua W.',
    email: 'joshua.gesige@tarepet.com',
    password: '4117',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-10-08',
    phone: '08033860224',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Gesige',
    parentPhone: '08033860224',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 353,
    code: '3225',
    admissionNo: 'TMS/JSS3/3225',
    studentId: 'TMS/JSS3/3225',
    admission_number: 'TMS/JSS3/3225',
    name: 'Irophy Glory Ebimi',
    email: 'glory.irophy@tarepet.com',
    password: '3225',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-01-15',
    phone: '08035008552',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Williams Pillome',
    parentPhone: '08035008552',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 354,
    code: '3944',
    admissionNo: 'TMS/JSS3/3944',
    studentId: 'TMS/JSS3/3944',
    admission_number: 'TMS/JSS3/3944',
    name: 'Tobon Emmanuel L.',
    email: 'emmanuel.tobon@tarepet.com',
    password: '3944',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-10-26',
    phone: '07031144737',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Patricia Samuel',
    parentPhone: '07031144737',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 355,
    code: '2152',
    admissionNo: 'TMS/JSS3/2152',
    studentId: 'TMS/JSS3/2152',
    admission_number: 'TMS/JSS3/2152',
    name: 'Abazza Bodisere Praise',
    email: 'bodisere.abazza@tarepet.com',
    password: '2152',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-06-20',
    phone: '08034312287',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Princewill',
    parentPhone: '08034312287',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 356,
    code: '3916',
    admissionNo: 'TMS/JSS3/3916',
    studentId: 'TMS/JSS3/3916',
    admission_number: 'TMS/JSS3/3916',
    name: 'Isaiah Ezekiel Praise',
    email: 'ezekiel.isaiah@tarepet.com',
    password: '3916',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-06-05',
    phone: '07014381050',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Kenneth',
    parentPhone: '07014381050',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 357,
    code: '3702',
    admissionNo: 'TMS/JSS3/3702',
    studentId: 'TMS/JSS3/3702',
    admission_number: 'TMS/JSS3/3702',
    name: 'Sinoki Praise A.',
    email: 'praise.sinoki@tarepet.com',
    password: '3702',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-04-04',
    phone: '08034849123',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Sumon',
    parentPhone: '08034849123',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 358,
    code: '4118',
    admissionNo: 'TMS/JSS3/4118',
    studentId: 'TMS/JSS3/4118',
    admission_number: 'TMS/JSS3/4118',
    name: 'Ezekiel Miracle Samuel',
    email: 'miracle.ezekiel@tarepet.com',
    password: '4118',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-11-25',
    phone: '08034849123',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ezekiel',
    parentPhone: '08034849123',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 359,
    code: '4119',
    admissionNo: 'TMS/JSS3/4119',
    studentId: 'TMS/JSS3/4119',
    admission_number: 'TMS/JSS3/4119',
    name: 'Ikogi Janet Isekpar',
    email: 'janet.ikogi@tarepet.com',
    password: '4119',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-08-14',
    phone: '08034849123',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ikogi',
    parentPhone: '08034849123',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 360,
    code: '4120',
    admissionNo: 'TMS/JSS3/4120',
    studentId: 'TMS/JSS3/4120',
    admission_number: 'TMS/JSS3/4120',
    name: 'Egbo Sarabom Tecci',
    email: 'sarabom.egbo@tarepet.com',
    password: '4120',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-02-28',
    phone: '08035918305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Egbo',
    parentPhone: '08035918305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 361,
    code: '4121',
    admissionNo: 'TMS/JSS3/4121',
    studentId: 'TMS/JSS3/4121',
    admission_number: 'TMS/JSS3/4121',
    name: 'Kenneth Cynthia U.',
    email: 'cynthia.kenneth@tarepet.com',
    password: '4121',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-05-17',
    phone: '07014381050',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Kenneth',
    parentPhone: '07014381050',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 362,
    code: '4122',
    admissionNo: 'TMS/JSS3/4122',
    studentId: 'TMS/JSS3/4122',
    admission_number: 'TMS/JSS3/4122',
    name: 'Sumon S. Tibinkonbo-ere',
    email: 'tibinkonboere.sumon@tarepet.com',
    password: '4122',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-09-09',
    phone: '08034849123',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Sumon',
    parentPhone: '08034849123',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 363,
    code: '4123',
    admissionNo: 'TMS/JSS3/4123',
    studentId: 'TMS/JSS3/4123',
    admission_number: 'TMS/JSS3/4123',
    name: 'Bekewei David',
    email: 'david.bekewei@tarepet.com',
    password: '4123',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-12-11',
    phone: '08035918305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Bekewei',
    parentPhone: '08035918305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 364,
    code: '4124',
    admissionNo: 'TMS/JSS3/4124',
    studentId: 'TMS/JSS3/4124',
    admission_number: 'TMS/JSS3/4124',
    name: 'Baro Deborah',
    email: 'deborah.baro@tarepet.com',
    password: '4124',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-04-03',
    phone: '08035918305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Baro',
    parentPhone: '08035918305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 365,
    code: '4125',
    admissionNo: 'TMS/JSS3/4125',
    studentId: 'TMS/JSS3/4125',
    admission_number: 'TMS/JSS3/4125',
    name: 'Ugwu Faustina',
    email: 'faustina.ugwu@tarepet.com',
    password: '4125',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-07-22',
    phone: '08035918305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ugwu',
    parentPhone: '08035918305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 366,
    code: '4126',
    admissionNo: 'TMS/JSS3/4126',
    studentId: 'TMS/JSS3/4126',
    admission_number: 'TMS/JSS3/4126',
    name: 'Pario Ayibadaerobra',
    email: 'ayibadaerobra.pario@tarepet.com',
    password: '4126',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-10-30',
    phone: '08035918305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Pario',
    parentPhone: '08035918305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 367,
    code: '3652',
    admissionNo: 'TMS/JSS3/3652',
    studentId: 'TMS/JSS3/3652',
    admission_number: 'TMS/JSS3/3652',
    name: 'Okafor Munachi',
    email: 'munachi.okafor@tarepet.com',
    password: '3652',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-12-16',
    phone: '08035918305',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Paul Boni Doni',
    parentPhone: '08035918305',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 368,
    code: '4007',
    admissionNo: 'TMS/JSS3/4007',
    studentId: 'TMS/JSS3/4007',
    admission_number: 'TMS/JSS3/4007',
    name: 'Azibayam Paul D.',
    email: 'paul.azibayam@tarepet.com',
    password: '4007',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-12-11',
    phone: '07030867586',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ogbonna',
    parentPhone: '07030867586',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 369,
    code: '2614',
    admissionNo: 'TMS/JSS3/2614',
    studentId: 'TMS/JSS3/2614',
    admission_number: 'TMS/JSS3/2614',
    name: 'Richard Godwin O.',
    email: 'godwin.richard@tarepet.com',
    password: '2614',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-08-01',
    phone: '08034835134',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ukaegbu',
    parentPhone: '08034835134',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 370,
    code: '3857',
    admissionNo: 'TMS/JSS3/3857',
    studentId: 'TMS/JSS3/3857',
    admission_number: 'TMS/JSS3/3857',
    name: 'Ukaegbu Sophia O.',
    email: 'sophia.ukaegbu@tarepet.com',
    password: '3857',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-12-16',
    phone: '07069549468',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Akegov',
    parentPhone: '07069549468',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 371,
    code: '4127',
    admissionNo: 'TMS/JSS3/4127',
    studentId: 'TMS/JSS3/4127',
    admission_number: 'TMS/JSS3/4127',
    name: 'Akegor Godspower D.',
    email: 'godspower.akegor@tarepet.com',
    password: '4127',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2012-05-19',
    phone: '07069549468',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Akegor',
    parentPhone: '07069549468',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 372,
    code: '4064',
    admissionNo: 'TMS/JSS3/4064',
    studentId: 'TMS/JSS3/4064',
    admission_number: 'TMS/JSS3/4064',
    name: 'Imeh Daniel Udeme',
    email: 'daniel.imeh@tarepet.com',
    password: '4064',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-01-20',
    phone: '07035731846',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Uchenna',
    parentPhone: '07035731846',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 373,
    code: '3064',
    admissionNo: 'TMS/JSS3/3064',
    studentId: 'TMS/JSS3/3064',
    admission_number: 'TMS/JSS3/3064',
    name: 'Igweshi Esther Amarachi',
    email: 'esther.igweshi@tarepet.com',
    password: '3064',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2011-08-20',
    phone: '08169994444',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Tousuo',
    parentPhone: '08169994444',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 374,
    code: '4128',
    admissionNo: 'TMS/JSS3/4128',
    studentId: 'TMS/JSS3/4128',
    admission_number: 'TMS/JSS3/4128',
    name: 'Oweibekuma Tarelayon',
    email: 'tarelayon.oweibekuma@tarepet.com',
    password: '4128',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2013-06-15',
    phone: '08169994444',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Oweibekuma',
    parentPhone: '08169994444',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 375,
    code: '4072',
    admissionNo: 'TMS/JSS3/4072',
    studentId: 'TMS/JSS3/4072',
    admission_number: 'TMS/JSS3/4072',
    name: 'Uchenna Solomon',
    email: 'solomon.uchenna@tarepet.com',
    password: '4072',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-07-13',
    phone: '08033165880',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Azurosi',
    parentPhone: '08033165880',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 376,
    code: '4087',
    admissionNo: 'TMS/JSS3/4087',
    studentId: 'TMS/JSS3/4087',
    admission_number: 'TMS/JSS3/4087',
    name: 'Win Tousuo Ayibafie',
    email: 'ayibafie.wintousuo@tarepet.com',
    password: '4087',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2011-07-23',
    phone: '08056208530',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ahamefula',
    parentPhone: '08056208530',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 377,
    code: '4129',
    admissionNo: 'TMS/JSS3/4129',
    studentId: 'TMS/JSS3/4129',
    admission_number: 'TMS/JSS3/4129',
    name: 'Tamara Layefa Sinclair',
    email: 'layefa.tamara@tarepet.com',
    password: '4129',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-09-08',
    phone: '08056208530',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Sinclair',
    parentPhone: '08056208530',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 378,
    code: '4130',
    admissionNo: 'TMS/JSS3/4130',
    studentId: 'TMS/JSS3/4130',
    admission_number: 'TMS/JSS3/4130',
    name: 'Ifiemeya Azibaaei T.',
    email: 'azibaaei.ifiemeya@tarepet.com',
    password: '4130',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2013-03-27',
    phone: '08056208530',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Ifiemeya',
    parentPhone: '08056208530',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 379,
    code: '4131',
    admissionNo: 'TMS/JSS3/4131',
    studentId: 'TMS/JSS3/4131',
    admission_number: 'TMS/JSS3/4131',
    name: 'Nwachukwu Chidinma',
    email: 'chidinma.nwachukwu@tarepet.com',
    password: '4131',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2012-11-19',
    phone: '08056208530',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'JSS3',
    stream: 'General',
    programme: 'Junior Secondary Certificate Examination (BECE)',
    parentName: 'Mr & Mrs Nwachukwu',
    parentPhone: '08056208530',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  // ── Basic 6 (Entries 1 to 31) ──
  {
    id: 401,
    code: '4201',
    admissionNo: 'TMS/BSC6/4201',
    studentId: 'TMS/BSC6/4201',
    admission_number: 'TMS/BSC6/4201',
    name: 'Ebemo Rebekah',
    email: 'rebekah.ebemo@tarepet.com',
    password: '4201',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-03-15',
    phone: '08038107252',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ebemo',
    parentPhone: '08038107252',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 402,
    code: '3215',
    admissionNo: 'TMS/BSC6/3215',
    studentId: 'TMS/BSC6/3215',
    admission_number: 'TMS/BSC6/3215',
    name: 'Subi Bonita',
    email: 'bonita.subi@tarepet.com',
    password: '3215',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-04-27',
    phone: '08038107252',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Subi',
    parentPhone: '08038107252',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 403,
    code: '2305',
    admissionNo: 'TMS/BSC6/2305',
    studentId: 'TMS/BSC6/2305',
    admission_number: 'TMS/BSC6/2305',
    name: 'Tonkumu Sophia',
    email: 'sophia.tonkumu@tarepet.com',
    password: '2305',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-04-27',
    phone: '09038674511',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Tonkumu',
    parentPhone: '09038674511',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 404,
    code: '3629',
    admissionNo: 'TMS/BSC6/3629',
    studentId: 'TMS/BSC6/3629',
    admission_number: 'TMS/BSC6/3629',
    name: 'Mallati Jessica',
    email: 'jessica.mallati@tarepet.com',
    password: '3629',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-03-12',
    phone: '08067275242',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Mallati',
    parentPhone: '08067275242',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 405,
    code: '3454',
    admissionNo: 'TMS/BSC6/3454',
    studentId: 'TMS/BSC6/3454',
    admission_number: 'TMS/BSC6/3454',
    name: 'Regent Jean',
    email: 'jean.regent@tarepet.com',
    password: '3454',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-05-17',
    phone: '08034116576',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Regent',
    parentPhone: '08034116576',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 406,
    code: '4202',
    admissionNo: 'TMS/BSC6/4202',
    studentId: 'TMS/BSC6/4202',
    admission_number: 'TMS/BSC6/4202',
    name: 'Ojokai Matthew',
    email: 'matthew.ojokai@tarepet.com',
    password: '4202',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-06-20',
    phone: '08034116576',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ojokai',
    parentPhone: '08034116576',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 407,
    code: '3872',
    admissionNo: 'TMS/BSC6/3872',
    studentId: 'TMS/BSC6/3872',
    admission_number: 'TMS/BSC6/3872',
    name: 'Wari Bolakabi',
    email: 'bolakabi.wari@tarepet.com',
    password: '3872',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-12-27',
    phone: '08035260894',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Wari Stephen',
    parentPhone: '08035260894',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 408,
    code: '3720',
    admissionNo: 'TMS/BSC6/3720',
    studentId: 'TMS/BSC6/3720',
    admission_number: 'TMS/BSC6/3720',
    name: 'Hephzibah Koru',
    email: 'hephzibah.koru@tarepet.com',
    password: '3720',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-07-04',
    phone: '08035659604',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Koru',
    parentPhone: '08035659604',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 409,
    code: '4009',
    admissionNo: 'TMS/BSC6/4009',
    studentId: 'TMS/BSC6/4009',
    admission_number: 'TMS/BSC6/4009',
    name: 'Isaiah Jamie B.',
    email: 'jamie.isaiah@tarepet.com',
    password: '4009',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-09-04',
    phone: '07065925130',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs James Isaiah',
    parentPhone: '07065925130',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 410,
    code: '2310',
    admissionNo: 'TMS/BSC6/2310',
    studentId: 'TMS/BSC6/2310',
    admission_number: 'TMS/BSC6/2310',
    name: 'Alfred Eto-Etana',
    email: 'etoetana.alfred@tarepet.com',
    password: '2310',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-01-13',
    phone: '07039943621',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Alfred Eto Danapu',
    parentPhone: '07039943621',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 411,
    code: '3443',
    admissionNo: 'TMS/BSC6/3443',
    studentId: 'TMS/BSC6/3443',
    admission_number: 'TMS/BSC6/3443',
    name: 'Clement Davies Esther',
    email: 'esther.clementdavies@tarepet.com',
    password: '3443',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-08-08',
    phone: '08165494601',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Apostle Davies',
    parentPhone: '08165494601',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 412,
    code: '4012',
    admissionNo: 'TMS/BSC6/4012',
    studentId: 'TMS/BSC6/4012',
    admission_number: 'TMS/BSC6/4012',
    name: 'Tebeda Henry',
    email: 'henry.tebeda@tarepet.com',
    password: '4012',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2015-05-15',
    phone: '08126107985',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mrs Kate Tebeda',
    parentPhone: '08126107985',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 413,
    code: '3930',
    admissionNo: 'TMS/BSC6/3930',
    studentId: 'TMS/BSC6/3930',
    admission_number: 'TMS/BSC6/3930',
    name: 'Diri Queen Chimuanya',
    email: 'queen.diri@tarepet.com',
    password: '3930',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2015-12-09',
    phone: '09071022308',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Chuks',
    parentPhone: '09071022308',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 414,
    code: '2276',
    admissionNo: 'TMS/BSC6/2276',
    studentId: 'TMS/BSC6/2276',
    admission_number: 'TMS/BSC6/2276',
    name: 'Mieypa Samuel',
    email: 'samuel.mieypa@tarepet.com',
    password: '2276',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-01-20',
    phone: '07067000008',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Mieypa',
    parentPhone: '07067000008',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 415,
    code: '2971',
    admissionNo: 'TMS/BSC6/2971',
    studentId: 'TMS/BSC6/2971',
    admission_number: 'TMS/BSC6/2971',
    name: 'Ogiuwie Olasu Lydia',
    email: 'lydia.ogiuwie@tarepet.com',
    password: '2971',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-05-07',
    phone: '08064191819',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ogiuwie',
    parentPhone: '08064191819',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 416,
    code: '2751',
    admissionNo: 'TMS/BSC6/2751',
    studentId: 'TMS/BSC6/2751',
    admission_number: 'TMS/BSC6/2751',
    name: 'Iwu Gift',
    email: 'gift.iwu@tarepet.com',
    password: '2751',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-06-18',
    phone: '08064191819',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Iwu',
    parentPhone: '08064191819',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 417,
    code: '4053',
    admissionNo: 'TMS/BSC6/4053',
    studentId: 'TMS/BSC6/4053',
    admission_number: 'TMS/BSC6/4053',
    name: 'Asia Treasure Edowere',
    email: 'treasure.asia@tarepet.com',
    password: '4053',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-09-21',
    phone: '07036543578',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Asia',
    parentPhone: '07036543578',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 418,
    code: '4058',
    admissionNo: 'TMS/BSC6/4058',
    studentId: 'TMS/BSC6/4058',
    admission_number: 'TMS/BSC6/4058',
    name: 'Eniseigha Imomotimi',
    email: 'imomotimi.eniseigha@tarepet.com',
    password: '4058',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-04-08',
    phone: '08122980023',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Dan Eniseigha',
    parentPhone: '08122980023',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 419,
    code: '3333',
    admissionNo: 'TMS/BSC6/3333',
    studentId: 'TMS/BSC6/3333',
    admission_number: 'TMS/BSC6/3333',
    name: 'Omuedekumo Eminency',
    email: 'eminency.omuedekumo@tarepet.com',
    password: '3333',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2015-05-27',
    phone: '07068091990',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Hon Omuedekuma',
    parentPhone: '07068091990',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 420,
    code: '3558',
    admissionNo: 'TMS/BSC6/3558',
    studentId: 'TMS/BSC6/3558',
    admission_number: 'TMS/BSC6/3558',
    name: 'Adonis Esther',
    email: 'esther.adonis@tarepet.com',
    password: '3558',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2017-04-14',
    phone: '08035047336',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Adonis',
    parentPhone: '08035047336',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 421,
    code: '2984',
    admissionNo: 'TMS/BSC6/2984',
    studentId: 'TMS/BSC6/2984',
    admission_number: 'TMS/BSC6/2984',
    name: "Ibokan God's Love",
    email: 'godslove.ibokan@tarepet.com',
    password: '2984',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-04-27',
    phone: '08038005912',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ibokan',
    parentPhone: '08038005912',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 422,
    code: '2638',
    admissionNo: 'TMS/BSC6/2638',
    studentId: 'TMS/BSC6/2638',
    admission_number: 'TMS/BSC6/2638',
    name: 'Ukaegbu George',
    email: 'george.ukaegbu@tarepet.com',
    password: '2638',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2015-09-06',
    phone: '08160083337',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Ukaegbu',
    parentPhone: '08160083337',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 423,
    code: '3816',
    admissionNo: 'TMS/BSC6/3816',
    studentId: 'TMS/BSC6/3816',
    admission_number: 'TMS/BSC6/3816',
    name: 'Timi David',
    email: 'david.timi@tarepet.com',
    password: '3816',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2015-11-14',
    phone: '07038078427',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Timi',
    parentPhone: '07038078427',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 424,
    code: '3929',
    admissionNo: 'TMS/BSC6/3929',
    studentId: 'TMS/BSC6/3929',
    admission_number: 'TMS/BSC6/3929',
    name: 'Baralatari Esther',
    email: 'esther.baralatari@tarepet.com',
    password: '3929',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2015-09-07',
    phone: '07062176112',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr Baralatari',
    parentPhone: '07062176112',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 425,
    code: '3657',
    admissionNo: 'TMS/BSC6/3657',
    studentId: 'TMS/BSC6/3657',
    admission_number: 'TMS/BSC6/3657',
    name: 'Oyinperebi Perekeme',
    email: 'perekeme.oyinperebi@tarepet.com',
    password: '3657',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2014-10-25',
    phone: '0805354306',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Emberru Sezeragi',
    parentPhone: '0805354306',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 426,
    code: '3347',
    admissionNo: 'TMS/BSC6/3347',
    studentId: 'TMS/BSC6/3347',
    admission_number: 'TMS/BSC6/3347',
    name: 'Whyte Olivia',
    email: 'olivia.whyte@tarepet.com',
    password: '3347',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2016-07-18',
    phone: '08067465867',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Whyte',
    parentPhone: '08067465867',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 427,
    code: '3148',
    admissionNo: 'TMS/BSC6/3148',
    studentId: 'TMS/BSC6/3148',
    admission_number: 'TMS/BSC6/3148',
    name: 'Delimua Prince',
    email: 'prince.delimua@tarepet.com',
    password: '3148',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2015-08-20',
    phone: '07062631065',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Delimua',
    parentPhone: '07062631065',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 428,
    code: '3303',
    admissionNo: 'TMS/BSC6/3303',
    studentId: 'TMS/BSC6/3303',
    admission_number: 'TMS/BSC6/3303',
    name: 'Ayibanaiyn Erefamote',
    email: 'erefamote.ayibanaiyn@tarepet.com',
    password: '3303',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2014-04-23',
    phone: '08035159514',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Garsuch Erefamote',
    parentPhone: '08035159514',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Blue House'
  },
  {
    id: 429,
    code: '3073',
    admissionNo: 'TMS/BSC6/3073',
    studentId: 'TMS/BSC6/3073',
    admission_number: 'TMS/BSC6/3073',
    name: 'Kei Keseizibe',
    email: 'keseizibe.kei@tarepet.com',
    password: '3073',
    gender: 'Female',
    maritalStatus: 'Single',
    dob: '2015-12-05',
    phone: '08035159514',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Kei',
    parentPhone: '08035159514',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Green House'
  },
  {
    id: 430,
    code: '4203',
    admissionNo: 'TMS/BSC6/4203',
    studentId: 'TMS/BSC6/4203',
    admission_number: 'TMS/BSC6/4203',
    name: 'Eto Royal',
    email: 'royal.eto@tarepet.com',
    password: '4203',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2016-02-18',
    phone: '08032927475',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Eto',
    parentPhone: '08032927475',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Yellow House'
  },
  {
    id: 431,
    code: '3750',
    admissionNo: 'TMS/BSC6/3750',
    studentId: 'TMS/BSC6/3750',
    admission_number: 'TMS/BSC6/3750',
    name: 'Isaiah Deriery',
    email: 'deriery.isaiah@tarepet.com',
    password: '3750',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '2015-03-16',
    phone: '08032927475',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: 'Yenagoa, Bayelsa State',
    grade: 'Basic 6',
    stream: 'General',
    programme: 'Montessori Primary Basic Education',
    parentName: 'Mr & Mrs Isaiah',
    parentPhone: '08032927475',
    status: 'ACTIVE',
    studyMode: 'Full Time',
    attendance: '100%',
    atRisk: false,
    profileImage: '',
    house: 'Red House'
  },
  {
    id: 501,
    code: "3978",
    admissionNo: "TMS/JSS2/3978",
    studentId: "TMS/JSS2/3978",
    admission_number: "TMS/JSS2/3978",
    name: "Inko Peculiar Aruabai",
    email: "inko.aruabai@tarepet.com",
    password: "3978",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2014-09-17",
    phone: "08030713360",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Simeon",
    parentPhone: "08030713360",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 502,
    code: "2778",
    admissionNo: "TMS/JSS2/2778",
    studentId: "TMS/JSS2/2778",
    admission_number: "TMS/JSS2/2778",
    name: "Agala Eluan Douglas",
    email: "agala.douglas@tarepet.com",
    password: "2778",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2013-03-30",
    phone: "08035477641",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Agala",
    parentPhone: "08035477641",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 503,
    code: "3743",
    admissionNo: "TMS/JSS2/3743",
    studentId: "TMS/JSS2/3743",
    admission_number: "TMS/JSS2/3743",
    name: "Moses Davina Wonibowei",
    email: "moses.wonibowei@tarepet.com",
    password: "3743",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2013-11-19",
    phone: "08066249878",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Wonibowei",
    parentPhone: "08066249878",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 504,
    code: "4301",
    admissionNo: "TMS/JSS2/4301",
    studentId: "TMS/JSS2/4301",
    admission_number: "TMS/JSS2/4301",
    name: "Ogolo Michael",
    email: "ogolo.michael@tarepet.com",
    password: "4301",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 505,
    code: "3298",
    admissionNo: "TMS/JSS2/3298",
    studentId: "TMS/JSS2/3298",
    admission_number: "TMS/JSS2/3298",
    name: "Okeziri Success Chinaza",
    email: "okeziri.chinaza@tarepet.com",
    password: "3298",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2012-03-09",
    phone: "08063607380",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Okeziri",
    parentPhone: "08063607380",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 506,
    code: "3917",
    admissionNo: "TMS/JSS2/3917",
    studentId: "TMS/JSS2/3917",
    admission_number: "TMS/JSS2/3917",
    name: "Wodu Eladebi Esther",
    email: "wodu.esther@tarepet.com",
    password: "3917",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2013-08-26",
    phone: "08032466144",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Wodu",
    parentPhone: "08032466144",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 507,
    code: "4066",
    admissionNo: "TMS/JSS2/4066",
    studentId: "TMS/JSS2/4066",
    admission_number: "TMS/JSS2/4066",
    name: "Jim-Dorgu Emmanuella",
    email: "jimdorgu.emmanuella@tarepet.com",
    password: "4066",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2015-03-28",
    phone: "08032338313, 07068639890",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Jim-Dorgu",
    parentPhone: "08032338313, 07068639890",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 508,
    code: "3873",
    admissionNo: "TMS/JSS2/3873",
    studentId: "TMS/JSS2/3873",
    admission_number: "TMS/JSS2/3873",
    name: "Ide Adamabhi Joelah",
    email: "ide.joelah@tarepet.com",
    password: "3873",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2015-09-17",
    phone: "08064038714, 08037682642",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Ide Nabhid",
    parentPhone: "08064038714, 08037682642",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 509,
    code: "3169",
    admissionNo: "TMS/JSS2/3169",
    studentId: "TMS/JSS2/3169",
    admission_number: "TMS/JSS2/3169",
    name: "Akpaingolo Joshua",
    email: "akpaingolo.joshua@tarepet.com",
    password: "3169",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "08036754678",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Apaingolo",
    parentPhone: "08036754678",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 510,
    code: "4302",
    admissionNo: "TMS/JSS2/4302",
    studentId: "TMS/JSS2/4302",
    admission_number: "TMS/JSS2/4302",
    name: "Ogaga Oghenerukevwe Hellens",
    email: "ogaga.hellens@tarepet.com",
    password: "4302",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 511,
    code: "3595",
    admissionNo: "TMS/JSS2/3595",
    studentId: "TMS/JSS2/3595",
    admission_number: "TMS/JSS2/3595",
    name: "Emmanuel Ebiegberi Worthy",
    email: "emmanuel.worthy@tarepet.com",
    password: "3595",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-06-07",
    phone: "08038827981",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Ayakpo",
    parentPhone: "08038827981",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 512,
    code: "3974",
    admissionNo: "TMS/JSS2/3974",
    studentId: "TMS/JSS2/3974",
    admission_number: "TMS/JSS2/3974",
    name: "John Asima Favour",
    email: "john.favour@tarepet.com",
    password: "3974",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2015-04-29",
    phone: "08032586589",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs John",
    parentPhone: "08032586589",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 513,
    code: "2293",
    admissionNo: "TMS/JSS2/2293",
    studentId: "TMS/JSS2/2293",
    admission_number: "TMS/JSS2/2293",
    name: "Wanogho Justin",
    email: "wanogho.justin@tarepet.com",
    password: "2293",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2015-04-30",
    phone: "08063915315",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Wanogho",
    parentPhone: "08063915315",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 514,
    code: "3680",
    admissionNo: "TMS/JSS2/3680",
    studentId: "TMS/JSS2/3680",
    admission_number: "TMS/JSS2/3680",
    name: "Sunday Miracle",
    email: "sunday.miracle@tarepet.com",
    password: "3680",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-03-11",
    phone: "07033255078",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Sunday",
    parentPhone: "07033255078",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 515,
    code: "3961",
    admissionNo: "TMS/JSS2/3961",
    studentId: "TMS/JSS2/3961",
    admission_number: "TMS/JSS2/3961",
    name: "Onwugamba Blessed Munachi",
    email: "onwugamba.munachi@tarepet.com",
    password: "3961",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-12-28",
    phone: "07013122650",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Onwugamba",
    parentPhone: "07013122650",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 516,
    code: "4303",
    admissionNo: "TMS/JSS2/4303",
    studentId: "TMS/JSS2/4303",
    admission_number: "TMS/JSS2/4303",
    name: "Gwegwe Fiezibe",
    email: "gwegwe.fiezibe@tarepet.com",
    password: "4303",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 517,
    code: "4304",
    admissionNo: "TMS/JSS2/4304",
    studentId: "TMS/JSS2/4304",
    admission_number: "TMS/JSS2/4304",
    name: "Ogboin Agibaiye Achiever",
    email: "ogboin.achiever@tarepet.com",
    password: "4304",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 518,
    code: "4305",
    admissionNo: "TMS/JSS2/4305",
    studentId: "TMS/JSS2/4305",
    admission_number: "TMS/JSS2/4305",
    name: "Alamene Agibapreye",
    email: "alamene.agibapreye@tarepet.com",
    password: "4305",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 519,
    code: "4306",
    admissionNo: "TMS/JSS2/4306",
    studentId: "TMS/JSS2/4306",
    admission_number: "TMS/JSS2/4306",
    name: "Alazigha Lennon",
    email: "alazigha.lennon@tarepet.com",
    password: "4306",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 520,
    code: "3245",
    admissionNo: "TMS/JSS2/3245",
    studentId: "TMS/JSS2/3245",
    admission_number: "TMS/JSS2/3245",
    name: "Mark-Soru Precious",
    email: "marksoru.precious@tarepet.com",
    password: "3245",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2015-03-27",
    phone: "07031921596",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Mark-Soru",
    parentPhone: "07031921596",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 521,
    code: "3948",
    admissionNo: "TMS/JSS2/3948",
    studentId: "TMS/JSS2/3948",
    admission_number: "TMS/JSS2/3948",
    name: "Lucky Wealth Oghenkevwe",
    email: "lucky.oghenkevwe@tarepet.com",
    password: "3948",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-10-08",
    phone: "08068396800",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Lucky Emuropho",
    parentPhone: "08068396800",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 522,
    code: "4307",
    admissionNo: "TMS/JSS2/4307",
    studentId: "TMS/JSS2/4307",
    admission_number: "TMS/JSS2/4307",
    name: "Obi Ogindoubra Emmanuel",
    email: "obi.emmanuel@tarepet.com",
    password: "4307",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 523,
    code: "4308",
    admissionNo: "TMS/JSS2/4308",
    studentId: "TMS/JSS2/4308",
    admission_number: "TMS/JSS2/4308",
    name: "Bobmanuel Tekena Elisha",
    email: "bobmanuel.elisha@tarepet.com",
    password: "4308",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 524,
    code: "3972",
    admissionNo: "TMS/JSS2/3972",
    studentId: "TMS/JSS2/3972",
    admission_number: "TMS/JSS2/3972",
    name: "Abadi Eberide Peter",
    email: "abadi.peter@tarepet.com",
    password: "3972",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-05-25",
    phone: "08130221005",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Abadi",
    parentPhone: "08130221005",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 525,
    code: "4309",
    admissionNo: "TMS/JSS2/4309",
    studentId: "TMS/JSS2/4309",
    admission_number: "TMS/JSS2/4309",
    name: "Light Deborah",
    email: "light.deborah@tarepet.com",
    password: "4309",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 526,
    code: "4310",
    admissionNo: "TMS/JSS2/4310",
    studentId: "TMS/JSS2/4310",
    admission_number: "TMS/JSS2/4310",
    name: "Agbereowei Michelle",
    email: "agbereowei.michelle@tarepet.com",
    password: "4310",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 527,
    code: "4311",
    admissionNo: "TMS/JSS2/4311",
    studentId: "TMS/JSS2/4311",
    admission_number: "TMS/JSS2/4311",
    name: "Okponyam Holiness",
    email: "okponyam.holiness@tarepet.com",
    password: "4311",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 528,
    code: "4312",
    admissionNo: "TMS/JSS2/4312",
    studentId: "TMS/JSS2/4312",
    admission_number: "TMS/JSS2/4312",
    name: "Ebiakpo Confidence Atisai",
    email: "ebiakpo.atisai@tarepet.com",
    password: "4312",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 529,
    code: "3000",
    admissionNo: "TMS/JSS2/3000",
    studentId: "TMS/JSS2/3000",
    admission_number: "TMS/JSS2/3000",
    name: "Okoro Mercy Chinonye",
    email: "okoro.chinonye@tarepet.com",
    password: "3000",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2011-06-16",
    phone: "08035517663",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Okoro",
    parentPhone: "08035517663",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 530,
    code: "2179",
    admissionNo: "TMS/JSS2/2179",
    studentId: "TMS/JSS2/2179",
    admission_number: "TMS/JSS2/2179",
    name: "Amaegbe Emmanuella",
    email: "amaegbe.emmanuella@tarepet.com",
    password: "2179",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2014-11-25",
    phone: "08076016688",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Ayerite A",
    parentPhone: "08076016688",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 531,
    code: "3940",
    admissionNo: "TMS/JSS2/3940",
    studentId: "TMS/JSS2/3940",
    admission_number: "TMS/JSS2/3940",
    name: "Ilyasu Sherifa",
    email: "ilyasu.sherifa@tarepet.com",
    password: "3940",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2014-05-02",
    phone: "08173332813, 08134177705",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Ilyasu Garba",
    parentPhone: "08173332813, 08134177705",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 532,
    code: "3959",
    admissionNo: "TMS/JSS2/3959",
    studentId: "TMS/JSS2/3959",
    admission_number: "TMS/JSS2/3959",
    name: "Zekume Yaoviekiemí Iluma",
    email: "zekume.iluma@tarepet.com",
    password: "3959",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2015-06-28",
    phone: "08037715592",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Zekume Otobo",
    parentPhone: "08037715592",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 533,
    code: "3085",
    admissionNo: "TMS/JSS2/3085",
    studentId: "TMS/JSS2/3085",
    admission_number: "TMS/JSS2/3085",
    name: "Okiakpe Desmond",
    email: "okiakpe.desmond@tarepet.com",
    password: "3085",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2012-07-13",
    phone: "0812910210",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mrs Loujefa T",
    parentPhone: "0812910210",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 534,
    code: "4077",
    admissionNo: "TMS/JSS2/4077",
    studentId: "TMS/JSS2/4077",
    admission_number: "TMS/JSS2/4077",
    name: "Ekereke Michelle Markson",
    email: "ekereke.markson@tarepet.com",
    password: "4077",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2016-04-13",
    phone: "08038709765, 07064393811",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Honourable Markson",
    parentPhone: "08038709765, 07064393811",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 535,
    code: "3574",
    admissionNo: "TMS/JSS2/3574",
    studentId: "TMS/JSS2/3574",
    admission_number: "TMS/JSS2/3574",
    name: "Lawson Winifred",
    email: "lawson.winifred@tarepet.com",
    password: "3574",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "08038948281",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "08038948281",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 536,
    code: "3699",
    admissionNo: "TMS/JSS2/3699",
    studentId: "TMS/JSS2/3699",
    admission_number: "TMS/JSS2/3699",
    name: "Oyindeinfa Sapere-Obi Daniel",
    email: "oyindeinfa.daniel@tarepet.com",
    password: "3699",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-05-06",
    phone: "08163220055",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mr/Mrs Sapere-Obi",
    parentPhone: "08163220055",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 537,
    code: "4094",
    admissionNo: "TMS/JSS2/4094",
    studentId: "TMS/JSS2/4094",
    admission_number: "TMS/JSS2/4094",
    name: "Kaliai Unique",
    email: "kaliai.unique@tarepet.com",
    password: "4094",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2013-04-16",
    phone: "09064454758",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Mrs Kaliai",
    parentPhone: "09064454758",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 538,
    code: "4313",
    admissionNo: "TMS/JSS2/4313",
    studentId: "TMS/JSS2/4313",
    admission_number: "TMS/JSS2/4313",
    name: "Okechukwu Chiemerie",
    email: "okechukwu.chiemerie@tarepet.com",
    password: "4313",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "JSS 2",
    stream: "General",
    programme: "Junior Secondary Basic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 539,
    code: "2021",
    admissionNo: "TMS/SS2/2021",
    studentId: "TMS/SS2/2021",
    admission_number: "TMS/SS2/2021",
    name: "Kekemeke Karinatei",
    email: "kekemeke.karinatei@tarepet.com",
    password: "2021",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2012-07-20",
    phone: "08035095769, 08064616040",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Kekemeke",
    parentPhone: "08035095769, 08064616040",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 540,
    code: "4314",
    admissionNo: "TMS/SS2/4314",
    studentId: "TMS/SS2/4314",
    admission_number: "TMS/SS2/4314",
    name: "Alamene Winifred",
    email: "alamene.winifred@tarepet.com",
    password: "4314",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 541,
    code: "2090",
    admissionNo: "TMS/SS2/2090",
    studentId: "TMS/SS2/2090",
    admission_number: "TMS/SS2/2090",
    name: "Gwegwe Onizibe",
    email: "gwegwe.onizibe@tarepet.com",
    password: "2090",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2012-06-14",
    phone: "08166603421, 08034222493",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Gwegwe",
    parentPhone: "08166603421, 08034222493",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 542,
    code: "4315",
    admissionNo: "TMS/SS2/4315",
    studentId: "TMS/SS2/4315",
    admission_number: "TMS/SS2/4315",
    name: "Datic-Ikoko Champion",
    email: "daticikoko.champion@tarepet.com",
    password: "4315",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 543,
    code: "3966",
    admissionNo: "TMS/SS2/3966",
    studentId: "TMS/SS2/3966",
    admission_number: "TMS/SS2/3966",
    name: "Akanimoh Divine",
    email: "akanimoh.divine@tarepet.com",
    password: "3966",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2011-02-22",
    phone: "08038667499",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Akanimoh",
    parentPhone: "08038667499",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 544,
    code: "2004",
    admissionNo: "TMS/SS2/2004",
    studentId: "TMS/SS2/2004",
    admission_number: "TMS/SS2/2004",
    name: "Ide David",
    email: "ide.david@tarepet.com",
    password: "2004",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2013-03-31",
    phone: "08064038714, 08037682642",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Barr/Mrs Ide Nabhid",
    parentPhone: "08064038714, 08037682642",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 545,
    code: "4316",
    admissionNo: "TMS/SS2/4316",
    studentId: "TMS/SS2/4316",
    admission_number: "TMS/SS2/4316",
    name: "Suobitei Peremoboere",
    email: "suobitei.peremoboere@tarepet.com",
    password: "4316",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 546,
    code: "4317",
    admissionNo: "TMS/SS2/4317",
    studentId: "TMS/SS2/4317",
    admission_number: "TMS/SS2/4317",
    name: "Watson Grandeur",
    email: "watson.grandeur@tarepet.com",
    password: "4317",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 547,
    code: "4318",
    admissionNo: "TMS/SS2/4318",
    studentId: "TMS/SS2/4318",
    admission_number: "TMS/SS2/4318",
    name: "Mbonu Hillary",
    email: "mbonu.hillary@tarepet.com",
    password: "4318",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 548,
    code: "1824",
    admissionNo: "TMS/SS2/1824",
    studentId: "TMS/SS2/1824",
    admission_number: "TMS/SS2/1824",
    name: "Iwu Ifunanya",
    email: "iwu.ifunanya@tarepet.com",
    password: "1824",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 549,
    code: "3405",
    admissionNo: "TMS/SS2/3405",
    studentId: "TMS/SS2/3405",
    admission_number: "TMS/SS2/3405",
    name: "Sima Purity",
    email: "sima.purity@tarepet.com",
    password: "3405",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2012-01-06",
    phone: "09071387662",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Sima",
    parentPhone: "09071387662",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 550,
    code: "3380",
    admissionNo: "TMS/SS2/3380",
    studentId: "TMS/SS2/3380",
    admission_number: "TMS/SS2/3380",
    name: "Oguamanam Stella",
    email: "oguamanam.stella@tarepet.com",
    password: "3380",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2013-02-06",
    phone: "08032930591",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Oguamanam",
    parentPhone: "08032930591",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 551,
    code: "2325",
    admissionNo: "TMS/SS2/2325",
    studentId: "TMS/SS2/2325",
    admission_number: "TMS/SS2/2325",
    name: "Bennett Meniesa",
    email: "bennett.meniesa@tarepet.com",
    password: "2325",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2010-12-17",
    phone: "08038987435",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr Christain",
    parentPhone: "08038987435",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 552,
    code: "4037",
    admissionNo: "TMS/SS2/4037",
    studentId: "TMS/SS2/4037",
    admission_number: "TMS/SS2/4037",
    name: "Saviour Angel",
    email: "saviour.angel@tarepet.com",
    password: "4037",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2009-04-21",
    phone: "08028205469",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Ungo",
    parentPhone: "08028205469",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 553,
    code: "3395",
    admissionNo: "TMS/SS2/3395",
    studentId: "TMS/SS2/3395",
    admission_number: "TMS/SS2/3395",
    name: "Asiagbe Statuman",
    email: "asiagbe.statuman@tarepet.com",
    password: "3395",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2008-01-28",
    phone: "07041951769",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Tunde Alfred",
    parentPhone: "07041951769",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 554,
    code: "4319",
    admissionNo: "TMS/SS2/4319",
    studentId: "TMS/SS2/4319",
    admission_number: "TMS/SS2/4319",
    name: "Azubuike Tochukwu",
    email: "azubuike.tochukwu@tarepet.com",
    password: "4319",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 555,
    code: "3977",
    admissionNo: "TMS/SS2/3977",
    studentId: "TMS/SS2/3977",
    admission_number: "TMS/SS2/3977",
    name: "Ebis Success",
    email: "ebis.success@tarepet.com",
    password: "3977",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2011-07-22",
    phone: "08036650572",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Ebis",
    parentPhone: "08036650572",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 556,
    code: "4320",
    admissionNo: "TMS/SS2/4320",
    studentId: "TMS/SS2/4320",
    admission_number: "TMS/SS2/4320",
    name: "Williams Aduzibe",
    email: "williams.aduzibe@tarepet.com",
    password: "4320",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 557,
    code: "3423",
    admissionNo: "TMS/SS2/3423",
    studentId: "TMS/SS2/3423",
    admission_number: "TMS/SS2/3423",
    name: "Cotterel Ibinabo",
    email: "cotterel.ibinabo@tarepet.com",
    password: "3423",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2012-09-06",
    phone: "08035470575",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Cotterel",
    parentPhone: "08035470575",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 558,
    code: "2818",
    admissionNo: "TMS/SS2/2818",
    studentId: "TMS/SS2/2818",
    admission_number: "TMS/SS2/2818",
    name: "Inowei Esther",
    email: "inowei.esther@tarepet.com",
    password: "2818",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "09035919316",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs James",
    parentPhone: "09035919316",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 559,
    code: "3386",
    admissionNo: "TMS/SS2/3386",
    studentId: "TMS/SS2/3386",
    admission_number: "TMS/SS2/3386",
    name: "Samson Victory Dick",
    email: "samson.dick@tarepet.com",
    password: "3386",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2012-05-12",
    phone: "08142432591",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Dick",
    parentPhone: "08142432591",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 560,
    code: "3832",
    admissionNo: "TMS/SS2/3832",
    studentId: "TMS/SS2/3832",
    admission_number: "TMS/SS2/3832",
    name: "Akachukwu David",
    email: "akachukwu.david@tarepet.com",
    password: "3832",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2014-06-15",
    phone: "07068107745",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Rev/Pst Okonye",
    parentPhone: "07068107745",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 561,
    code: "3906",
    admissionNo: "TMS/SS2/3906",
    studentId: "TMS/SS2/3906",
    admission_number: "TMS/SS2/3906",
    name: "Ligali Itunu",
    email: "ligali.itunu@tarepet.com",
    password: "3906",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2008-10-23",
    phone: "07031144737",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Ezekiel Patricia",
    parentPhone: "07031144737",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 562,
    code: "3748",
    admissionNo: "TMS/SS2/3748",
    studentId: "TMS/SS2/3748",
    admission_number: "TMS/SS2/3748",
    name: "Morrison Emmanuella",
    email: "morrison.emmanuella@tarepet.com",
    password: "3748",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2011-01-11",
    phone: "08106487510",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Lucia Morrison",
    parentPhone: "08106487510",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 563,
    code: "4321",
    admissionNo: "TMS/SS2/4321",
    studentId: "TMS/SS2/4321",
    admission_number: "TMS/SS2/4321",
    name: "Ogiriki Prince",
    email: "ogiriki.prince@tarepet.com",
    password: "4321",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 564,
    code: "3742",
    admissionNo: "TMS/SS2/3742",
    studentId: "TMS/SS2/3742",
    admission_number: "TMS/SS2/3742",
    name: "Ayibamietei Moses",
    email: "ayibamietei.moses@tarepet.com",
    password: "3742",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2011-04-20",
    phone: "08066249878",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Woniswe",
    parentPhone: "08066249878",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 565,
    code: "2164",
    admissionNo: "TMS/SS2/2164",
    studentId: "TMS/SS2/2164",
    admission_number: "TMS/SS2/2164",
    name: "Aniefiok Columbus",
    email: "aniefiok.columbus@tarepet.com",
    password: "2164",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2011-10-01",
    phone: "08036665427, 08166245718",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Henry Columbus",
    parentPhone: "08036665427, 08166245718",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 566,
    code: "4322",
    admissionNo: "TMS/SS2/4322",
    studentId: "TMS/SS2/4322",
    admission_number: "TMS/SS2/4322",
    name: "Williams Jeremiah",
    email: "williams.jeremiah@tarepet.com",
    password: "4322",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 567,
    code: "3150",
    admissionNo: "TMS/SS2/3150",
    studentId: "TMS/SS2/3150",
    admission_number: "TMS/SS2/3150",
    name: "Diri Treasure",
    email: "diri.treasure@tarepet.com",
    password: "3150",
    gender: "Female",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 568,
    code: "3594",
    admissionNo: "TMS/SS2/3594",
    studentId: "TMS/SS2/3594",
    admission_number: "TMS/SS2/3594",
    name: "Dakolo Goodluck",
    email: "dakolo.goodluck@tarepet.com",
    password: "3594",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2010-09-15",
    phone: "08037661733",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Hrm King Dakolo",
    parentPhone: "08037661733",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 569,
    code: "4323",
    admissionNo: "TMS/SS2/4323",
    studentId: "TMS/SS2/4323",
    admission_number: "TMS/SS2/4323",
    name: "Harry Tamunobere",
    email: "harry.tamunobere@tarepet.com",
    password: "4323",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 570,
    code: "1830",
    admissionNo: "TMS/SS2/1830",
    studentId: "TMS/SS2/1830",
    admission_number: "TMS/SS2/1830",
    name: "Okutu Tamaradeinbofa",
    email: "okutu.tamaradeinbofa@tarepet.com",
    password: "1830",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 571,
    code: "4324",
    admissionNo: "TMS/SS2/4324",
    studentId: "TMS/SS2/4324",
    admission_number: "TMS/SS2/4324",
    name: "Kormane Edisemi",
    email: "kormane.edisemi@tarepet.com",
    password: "4324",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "Not Provided",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Not Provided",
    parentPhone: "Not Provided",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 572,
    code: "4011",
    admissionNo: "TMS/SS2/4011",
    studentId: "TMS/SS2/4011",
    admission_number: "TMS/SS2/4011",
    name: "Henry Clinton",
    email: "henry.clinton@tarepet.com",
    password: "4011",
    gender: "Male",
    maritalStatus: "Single",
    dob: "Not Provided",
    phone: "08126107965",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Kate Tiebeda",
    parentPhone: "08126107965",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 573,
    code: "3097",
    admissionNo: "TMS/SS2/3097",
    studentId: "TMS/SS2/3097",
    admission_number: "TMS/SS2/3097",
    name: "Onduru Joy",
    email: "onduru.joy@tarepet.com",
    password: "3097",
    gender: "Female",
    maritalStatus: "Single",
    dob: "2009-03-14",
    phone: "08038758331",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Mr/Mrs Anthony",
    parentPhone: "08038758331",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
  {
    id: 574,
    code: "3509",
    admissionNo: "TMS/SS2/3509",
    studentId: "TMS/SS2/3509",
    admission_number: "TMS/SS2/3509",
    name: "Egbekun Derrick",
    email: "egbekun.derrick@tarepet.com",
    password: "3509",
    gender: "Male",
    maritalStatus: "Single",
    dob: "2011-11-22",
    phone: "08033701533",
    country: "Nigeria",
    stateOfOrigin: "Not Provided",
    lga: "Not Provided",
    address: "Not Provided",
    grade: "SS 2",
    stream: "General",
    programme: "Senior Secondary Academic Education",
    parentName: "Chief Egbekun",
    parentPhone: "08033701533",
    status: "ACTIVE",
    studyMode: "Full Time",
    attendance: "100%",
    atRisk: false,
    profileImage: "",
    house: "Not Provided"
  },
];

function loadSavedStudents(): StudentRecord[] {
  if (typeof window === 'undefined') return DEFAULT_STUDENTS;
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

        // Merge any default students missing from local storage
        const existingKeys = new Set(liveOnly.map((s: any) => String(s.studentId || s.admissionNo || s.code || '').toLowerCase()));
        const missingDefaults = DEFAULT_STUDENTS.filter(d => !existingKeys.has(String(d.studentId || d.admissionNo || d.code).toLowerCase()) && !isAccountDeleted(d.code) && !isAccountDeleted(d.name));
        const combined = [...liveOnly, ...missingDefaults];
        localStorage.setItem('tarepet_students_list', JSON.stringify(combined));
        return combined;
      }
    }
    localStorage.setItem('tarepet_students_list', JSON.stringify(DEFAULT_STUDENTS));
    return DEFAULT_STUDENTS;
  } catch (e) {}
  return DEFAULT_STUDENTS;
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
      .replace(/^BSC/i, 'PRI')
      .replace(/^JUNIORSECONDARY/i, 'JSS')
      .replace(/^SENIORSECONDARY/i, 'SS');
  };

  const normS = normalize(cleanS);
  const normT = normalize(cleanT);

  if (normS === normT) return true;

  // Strict separation: Junior Secondary (JSS) vs Senior Secondary (SS)
  const isJssS = normS.startsWith('JSS') || normS.startsWith('JS');
  const isJssT = normT.startsWith('JSS') || normT.startsWith('JS');
  if (isJssS !== isJssT) return false;

  // Strict separation: Nursery vs Primary vs Secondary
  const isNurS = normS.startsWith('NUR') || normS.startsWith('CRE');
  const isNurT = normT.startsWith('NUR') || normT.startsWith('CRE');
  if (isNurS !== isNurT) return false;

  const isPriS = normS.startsWith('PRI');
  const isPriT = normT.startsWith('PRI');
  if (isPriS !== isPriT) return false;

  const isSsS = (normS.startsWith('SS') || normS.startsWith('SENIOR')) && !isJssS;
  const isSsT = (normT.startsWith('SS') || normT.startsWith('SENIOR')) && !isJssT;
  if (isSsS !== isSsT) return false;

  return normS.includes(normT) || normT.includes(normS);
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
          const admNo = u.student_id || u.profile?.student_id || u.username || '';
          return !mockEmails.includes(u.email) && !isAccountDeleted(u.email) && !isAccountDeleted(u.id) && !isAccountDeleted(admNo) && !isAccountDeleted(`${u.first_name || ''} ${u.last_name || ''}`.trim());
        })
        .map((u: any) => {
          const prof = u.profile || {};
          const autoCode = prof.student_id || prof.admission_number || u.username || (u.id ? `TMS/2026/${String(u.id).padStart(4, '0')}` : 'TMS/STU/001');
          const rawGrade = prof.class_level || prof.grade || prof.grade_level || 'SS1';
          return {
            id: u.id,
            code: autoCode,
            admissionNo: autoCode,
            studentId: autoCode,
            admission_number: autoCode,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            password: autoCode,
            gender: prof.gender || (u as any).gender || 'Male',
            maritalStatus: 'Single',
            dob: prof.date_of_birth || prof.dob || (u as any).dob || '',
            phone: u.phone || prof.phone || prof.parent_phone || '',
            country: prof.country || 'Nigeria',
            stateOfOrigin: prof.state_of_origin || prof.stateOfOrigin || 'Bayelsa',
            lga: prof.lga || 'Yenagoa',
            address: prof.address || prof.residential_address || (u as any).address || '',
            grade: rawGrade,
            stream: prof.stream || (rawGrade.toUpperCase().startsWith('SS') ? 'Science' : 'General'),
            programme: prof.programme || (rawGrade.toUpperCase().startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Montessori Primary Education'),
            parentName: prof.parent_name || prof.parentName || prof.parent_guardian_name || (u as any).parent_name || (u as any).parentName || '',
            parentPhone: prof.parent_phone || prof.parentPhone || prof.emergency_phone || prof.emergencyPhone || prof.emergency_contact || (u as any).parent_phone || (u as any).parentPhone || u.phone || '',
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

function prof_code(u: any): string {
  return u.username || u.profile?.admission_number || u.profile?.student_id || '';
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

  // Find existing student by ID, email, code, admissionNo, or studentId
  const existingIdx = _students.findIndex(s => 
    (studentData.id && s.id === studentData.id) || 
    (studentData.email && s.email && s.email.toLowerCase() === studentData.email.toLowerCase()) || 
    (studentData.code && (s.code === studentData.code || s.admissionNo === studentData.code || s.studentId === studentData.code)) ||
    (studentData.admissionNo && (s.admissionNo === studentData.admissionNo || s.code === studentData.admissionNo || s.studentId === studentData.admissionNo)) ||
    ((studentData as any).studentId && (s.studentId === (studentData as any).studentId || s.code === (studentData as any).studentId || s.admissionNo === (studentData as any).studentId)) ||
    ((studentData as any).student_id && (s.code === (studentData as any).student_id || s.admissionNo === (studentData as any).student_id || s.studentId === (studentData as any).student_id))
  );

  const existingStudent = existingIdx >= 0 ? _students[existingIdx] : null;

  // Preserve existing student ID if present; only generate for brand new student if not supplied
  const autoCode = 
    studentData.code || 
    studentData.admissionNo || 
    (studentData as any).studentId || 
    (studentData as any).student_id || 
    (studentData as any).admission_number ||
    existingStudent?.code || 
    existingStudent?.admissionNo || 
    existingStudent?.studentId || 
    generateAdmissionNumber(assignedGrade, studentData.stream);

  const autoEmail = studentData.email || existingStudent?.email || formatStudentEmail(studentData.name);

  const sNames = (studentData.name || '').trim().split(' ');
  const firstName = sNames[0] || studentData.name;
  const lastName = sNames.slice(1).join(' ') || 'Student';

  const newStudent: StudentRecord = {
    id: studentData.id || existingStudent?.id || Date.now(),
    code: autoCode,
    admissionNo: autoCode,
    studentId: autoCode,
    name: studentData.name.trim(),
    email: autoEmail,
    password: studentData.password || existingStudent?.password || autoCode,
    gender: studentData.gender || existingStudent?.gender || 'Male',
    maritalStatus: studentData.maritalStatus || existingStudent?.maritalStatus || 'Single',
    dob: studentData.dob || existingStudent?.dob || '2012-05-14',
    phone: studentData.phone !== undefined ? studentData.phone : (existingStudent?.phone || ''),
    country: studentData.country || existingStudent?.country || 'Nigeria',
    stateOfOrigin: studentData.stateOfOrigin || existingStudent?.stateOfOrigin || 'Bayelsa',
    lga: studentData.lga || existingStudent?.lga || 'Yenagoa',
    address: studentData.address !== undefined ? studentData.address : (existingStudent?.address || ''),
    grade: assignedGrade,
    stream: studentData.stream || existingStudent?.stream || (assignedGrade.startsWith('SS') ? 'Science' : 'General'),
    programme: studentData.programme || existingStudent?.programme || (assignedGrade.startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Montessori Primary Education'),
    parentName: studentData.parentName !== undefined ? studentData.parentName : ((studentData as any).parent_name !== undefined ? (studentData as any).parent_name : (existingStudent?.parentName || '')),
    parentPhone: studentData.parentPhone !== undefined ? studentData.parentPhone : ((studentData as any).parent_phone !== undefined ? (studentData as any).parent_phone : ((studentData as any).emergency_contact || existingStudent?.parentPhone || '')),
    status: studentData.status || existingStudent?.status || 'ACTIVE',
    studyMode: studentData.studyMode || existingStudent?.studyMode || 'Full Time',
    attendance: studentData.attendance || existingStudent?.attendance || '100%',
    atRisk: studentData.atRisk || false,
    profileImage: studentData.profileImage !== undefined ? studentData.profileImage : (existingStudent?.profileImage || ''),
    house: studentData.house || existingStudent?.house || '',
  };

  unmarkDeletedAccount([newStudent.id, newStudent.code, newStudent.admissionNo, newStudent.studentId, newStudent.email, newStudent.name]);

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
    residential_address: newStudent.address !== 'Not Available' ? newStudent.address : '',
    residentialAddress: newStudent.address !== 'Not Available' ? newStudent.address : '',
    state_of_origin: newStudent.stateOfOrigin,
    stateOfOrigin: newStudent.stateOfOrigin,
    lga: newStudent.lga,
    parent_name: newStudent.parentName,
    parentName: newStudent.parentName,
    parent_guardian_name: newStudent.parentName,
    guardian_name: newStudent.parentName,
    parent_phone: newStudent.parentPhone,
    parentPhone: newStudent.parentPhone,
    emergency_phone: newStudent.parentPhone,
    emergencyPhone: newStudent.parentPhone,
    emergency_contact: newStudent.parentPhone || newStudent.phone,
    emergencyContact: newStudent.parentPhone || newStudent.phone,
    programme: newStudent.programme,
    study_mode: newStudent.studyMode,
    studyMode: newStudent.studyMode,
    profile_image: newStudent.profileImage,
    profileImage: newStudent.profileImage,
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
    // If registration failed due to existing user email, search for user and patch
    try {
      if (typeof newStudent.id === 'number' && newStudent.id < 1000000000) {
        await authClient.patch(`/auth/users/${newStudent.id}/`, sPayload);
      } else if (newStudent.email) {
        const existingUserRes = await authClient.get(`/auth/users/?search=${encodeURIComponent(newStudent.email)}`);
        const foundUsers = Array.isArray(existingUserRes.data?.results) ? existingUserRes.data.results : (Array.isArray(existingUserRes.data) ? existingUserRes.data : []);
        const matched = foundUsers.find((u: any) => u.email?.toLowerCase() === newStudent.email?.toLowerCase());
        if (matched && matched.id) {
          newStudent.id = matched.id;
          await authClient.patch(`/auth/users/${matched.id}/`, sPayload);
        }
      }
    } catch (fallbackErr) {
      console.warn('Fallback patch failed:', fallbackErr);
    }
  }

  // Update in-memory live store
  const targetIdx = _students.findIndex(s => 
    s.id === newStudent.id || 
    (newStudent.email && s.email.toLowerCase() === newStudent.email.toLowerCase()) || 
    (newStudent.code && s.code === newStudent.code)
  );
  if (targetIdx >= 0) {
    _students[targetIdx] = { ..._students[targetIdx], ...newStudent };
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

export function saveStoredStudents(backendStudents: StudentRecord[]) {
  const existingLocal = loadSavedStudents();
  const validBackend = (backendStudents || []).filter(b => 
    b && b.name && 
    !isAccountDeleted(b.email) && 
    !isAccountDeleted(b.studentId) && 
    !isAccountDeleted(b.code) && 
    !isAccountDeleted(b.admissionNo) && 
    !isAccountDeleted(b.id) &&
    !isAccountDeleted(b.name)
  );

  // Map backend items over existing local items for enrichments
  const merged: StudentRecord[] = validBackend.map(s => {
    const existing = existingLocal.find(e => 
      (s.id && e.id === s.id) || 
      (s.email && e.email && e.email.toLowerCase() === s.email.toLowerCase()) || 
      (s.code && e.code === s.code) ||
      (s.admissionNo && e.admissionNo === s.admissionNo)
    );
    if (existing) {
      return {
        ...existing,
        ...s,
        parentName: s.parentName || existing.parentName || '',
        parentPhone: s.parentPhone || existing.parentPhone || '',
        address: s.address || existing.address || '',
        dob: s.dob || existing.dob || '',
        house: s.house || existing.house || '',
        stateOfOrigin: s.stateOfOrigin || existing.stateOfOrigin || '',
        lga: s.lga || existing.lga || '',
        country: s.country || existing.country || '',
        programme: s.programme || existing.programme || '',
        studyMode: s.studyMode || existing.studyMode || 'Full Time',
        profileImage: s.profileImage || existing.profileImage || '',
      };
    }
    return s;
  });

  // Preserve any local / default students not yet in backend
  for (const local of existingLocal) {
    if (isAccountDeleted(local.email) || isAccountDeleted(local.code) || isAccountDeleted(local.studentId) || isAccountDeleted(local.admissionNo) || isAccountDeleted(local.id) || isAccountDeleted(local.name)) continue;
    const isAlreadyIn = merged.some(m => 
      (local.id && m.id === local.id) ||
      (local.code && m.code && String(m.code).toLowerCase() === String(local.code).toLowerCase()) ||
      (local.admissionNo && m.admissionNo && String(m.admissionNo).toLowerCase().replace(/[^a-z0-9]/g, '') === String(local.admissionNo).toLowerCase().replace(/[^a-z0-9]/g, '')) ||
      (local.email && m.email && m.email.toLowerCase().trim() === local.email.toLowerCase().trim())
    );
    if (!isAlreadyIn) {
      merged.push(local);
    }
  }

  // Also ensure default students are present
  for (const def of DEFAULT_STUDENTS) {
    if (isAccountDeleted(def.email) || isAccountDeleted(def.code) || isAccountDeleted(def.studentId) || isAccountDeleted(def.admissionNo) || isAccountDeleted(def.id) || isAccountDeleted(def.name)) continue;
    const exists = merged.some(m => 
      (def.id && m.id === def.id) ||
      (def.code && m.code && String(m.code).toLowerCase() === String(def.code).toLowerCase()) ||
      (def.admissionNo && m.admissionNo && String(m.admissionNo).toLowerCase().replace(/[^a-z0-9]/g, '') === String(def.admissionNo).toLowerCase().replace(/[^a-z0-9]/g, '')) ||
      (def.email && m.email && m.email.toLowerCase().trim() === def.email.toLowerCase().trim())
    );
    if (!exists) {
      merged.push(def);
    }
  }

  _students = merged;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_students_list', JSON.stringify(_students));
    } catch (e) {}
  }
  broadcastRealtimeEvent();
  return _students;
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
    syncExamsWithBackend().catch(() => {});
    syncTeachersWithBackend().catch(() => {});
    syncStudentsWithBackend().catch(() => {});
    syncBroadsheetWithBackend().catch(() => {});
    syncPromotionsWithBackend().catch(() => {});
    syncActivitiesWithBackend().catch(() => {});
  }
}

// Auto-trigger sync on module load and subscribe to real-time exam events
if (typeof window !== 'undefined') {
  initCBTStore();

  subscribeToWebSocketEvents((event: any) => {
    if (
      event.type === 'EXAM_CREATED' ||
      event.type === 'EXAM_STATUS_UPDATED' ||
      event.type === 'EXAM_APPROVED' ||
      event.type === 'EXAM_REJECTED' ||
      event.type === 'EXAM_ACTIVATED'
    ) {
      const incomingExam = event.payload?.exam;
      if (incomingExam && incomingExam.id) {
        _exams = loadSavedExams();
        const existingIdx = _exams.findIndex(e => e.id === incomingExam.id);
        if (existingIdx >= 0) {
          _exams[existingIdx] = { ..._exams[existingIdx], ...incomingExam };
        } else {
          _exams = [incomingExam, ..._exams];
        }
        persistExams(_exams);
        broadcastRealtimeEvent();
      }
    }
  });
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

// â”€â”€ Exam CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    if (examData.id) {
      await authClient.patch(`/assessments/cbt-exams/${examData.id}/`, {
        title: newExam.title,
        description: newExam.description,
        instructions: newExam.instructions,
        course_name: newExam.course_name,
        course_code: newExam.course_code,
        class_name: newExam.class,
        stream: newExam.stream,
        teacher_name: newExam.teacher_name,
        assessment_type: newExam.assessment_type,
        term: newExam.term,
        duration_minutes: newExam.duration_minutes,
        questions_per_page: newExam.questions_per_page,
        status: newExam.status,
        questions: newExam.questions
      });
    } else {
      const res = await authClient.post('/assessments/cbt-exams/', {
        title: newExam.title,
        description: newExam.description,
        instructions: newExam.instructions,
        course_name: newExam.course_name,
        course_code: newExam.course_code,
        class_name: newExam.class,
        stream: newExam.stream,
        teacher_name: newExam.teacher_name,
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
    }
  } catch (err) {}

  const existingIdx = _exams.findIndex(e => Number(e.id) === Number(newExam.id) || e.id === newExam.id);
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
      title: 'ðŸ“ Exam Pending Approval',
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
        const merged = mappedExams.map(m => {
          const loc = local.find(l => l.id === m.id);
          if (loc) {
            // Preserve locally approved/active/published status if backend returned pending/draft
            const preferStatus = (loc.status && loc.status !== 'PENDING' && loc.status !== 'DRAFT') ? loc.status : (m.status || loc.status);
            return {
              ...m,
              status: preferStatus,
              rejection_reason: loc.rejection_reason || m.rejection_reason,
              results_released: loc.results_released ?? m.results_released,
              questions: (loc.questions && loc.questions.length > 0) ? loc.questions : m.questions,
              class: loc.class || m.class,
              stream: loc.stream || m.stream,
              course_name: loc.course_name || m.course_name,
              course_code: loc.course_code || m.course_code,
            };
          }
          return m;
        });
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
      title: 'ðŸ“ Exam Pending Approval',
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
      title: 'âœ… Exam Approved',
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
      title: 'âš ï¸ Exam Returned for Revision',
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

// â”€â”€ Activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Student CBT Attendance System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

export function isCourseTakenByStudent(
  courseCode?: string,
  courseName?: string,
  studentGrade?: string,
  studentStream?: string,
  examClass?: string,
  examStream?: string
): boolean {
  if (!studentGrade) return false;
  const targetClass = examClass || studentGrade;

  // 1. Must match class level (e.g. SS1 matches SS 1, etc.)
  if (!matchStudentClass(studentGrade, targetClass)) return false;

  const isSS = isSeniorSecondaryClass(studentGrade) || isSeniorSecondaryClass(targetClass);
  if (!isSS) {
    // For Nursery, Primary, Junior Secondary: all students in that class take all subjects
    return true;
  }

  // 2. Senior Secondary Course & Department logic:
  const cleanCode = (courseCode || '').toUpperCase().trim();
  const cleanName = (courseName || '').toLowerCase().trim();
  const stStream = (studentStream || 'Science').toLowerCase().trim();
  const exStream = (examStream || 'Science').toLowerCase().trim();

  // Core General subjects taken by ALL senior secondary students in that class regardless of stream:
  const isGeneralCore =
    cleanCode.startsWith('ENG') || cleanCode.startsWith('MTH') || cleanCode.startsWith('GEN') ||
    cleanCode.startsWith('CIV') || cleanCode.startsWith('ECO') || cleanCode.startsWith('GEO') ||
    cleanCode.startsWith('AGR') || cleanCode.startsWith('ICT') || cleanCode.startsWith('DTP') ||
    cleanCode.startsWith('TRD') || cleanCode.startsWith('PHE') || cleanCode.startsWith('HED') ||
    cleanName.includes('english') || cleanName.includes('math') || cleanName.includes('civic') ||
    cleanName.includes('economics') || cleanName.includes('geography') || cleanName.includes('agric') ||
    cleanName.includes('data processing') || cleanName.includes('computer') || cleanName.includes('trade');

  if (isGeneralCore) {
    return true;
  }

  // If student stream is general or unspecified, they are eligible for the course
  if (stStream === 'general' || !studentStream) {
    return true;
  }

  // Science stream specific courses:
  const isScienceCourse =
    cleanCode.startsWith('BIO') || cleanCode.startsWith('CHM') || cleanCode.startsWith('PHY') ||
    cleanCode.startsWith('FMTH') || cleanCode.startsWith('TD') || cleanCode.startsWith('ANH') || cleanCode.startsWith('FSH') ||
    cleanName.includes('biology') || cleanName.includes('chemistry') || cleanName.includes('physics') ||
    cleanName.includes('further math') || cleanName.includes('technical drawing') || cleanName.includes('animal husbandry') || cleanName.includes('fisheries') ||
    exStream.includes('sci') || exStream.includes('stem');

  // Arts / Commercial stream specific courses:
  const isArtCourse =
    cleanCode.startsWith('LIT') || cleanCode.startsWith('GOV') || cleanCode.startsWith('CRS') ||
    cleanCode.startsWith('IRS') || cleanCode.startsWith('HIS') || cleanCode.startsWith('COM') ||
    cleanCode.startsWith('ACC') || cleanCode.startsWith('ART') || cleanCode.startsWith('FRE') ||
    cleanCode.startsWith('MUS') || cleanCode.startsWith('FDN') ||
    cleanName.includes('literature') || cleanName.includes('government') || cleanName.includes('crs') ||
    cleanName.includes('christian') || cleanName.includes('islamic') || cleanName.includes('history') ||
    cleanName.includes('commerce') || cleanName.includes('accounting') || cleanName.includes('visual') ||
    cleanName.includes('french') || cleanName.includes('music') || cleanName.includes('food') ||
    exStream.includes('art') || exStream.includes('comm') || exStream.includes('hum');

  if (stStream.includes('sci') || stStream.includes('stem')) {
    return !isArtCourse || isScienceCourse;
  }

  if (stStream.includes('art') || stStream.includes('comm') || stStream.includes('hum')) {
    return !isScienceCourse || isArtCourse;
  }

  return true;
}

export function getStudentsForClass(className: string = 'SS1', stream: string = 'Science', courseCode?: string, courseName?: string): CBTStudentInfo[] {
  const c = className || 'SS1';
  const s = stream || 'Science';
  const stored = getStoredStudents();

  const matched = stored.filter(st => {
    if (isAccountDeleted(st.id) || isAccountDeleted(st.code) || isAccountDeleted(st.email)) return false;

    // Check class matching (SS 1 matches SS1, SS1 Science matches SS1, etc.)
    const matchesClass = matchStudentClass(st.grade, c) ||
      (st.grade && c && (st.grade.toLowerCase().replace(/\s+/g, '').includes(c.toLowerCase().replace(/\s+/g, '')) ||
                         c.toLowerCase().replace(/\s+/g, '').includes(st.grade.toLowerCase().replace(/\s+/g, ''))));
    if (!matchesClass) return false;

    // If course information is provided, check if this student takes this course
    if (courseCode || courseName) {
      return isCourseTakenByStudent(courseCode, courseName, st.grade, st.stream, c, s);
    }

    // Stream matching: if exam stream is 'ALL' or empty, or student stream is 'General'/empty, include student
    if (!s || s === 'ALL' || !st.stream || st.stream.toLowerCase().trim() === 'general') return true;

    const sNorm = s.toLowerCase().trim();
    const stStreamNorm = st.stream.toLowerCase().trim();
    if (sNorm.includes('art') && stStreamNorm.includes('art')) return true;
    if (sNorm.includes('sci') && (stStreamNorm.includes('sci') || stStreamNorm.includes('stem'))) return true;
    if (sNorm.includes('comm') && (stStreamNorm.includes('comm') || stStreamNorm.includes('art'))) return true;
    return sNorm === stStreamNorm || sNorm.includes(stStreamNorm) || stStreamNorm.includes(sNorm);
  });

  return matched.map(st => ({
    studentId: st.code || st.admissionNo || st.studentId || (st.id ? `TMS/${st.id}` : 'TMS/STU/001'),
    studentName: st.name,
    class: st.grade || c,
    stream: st.stream || s,
    regNo: st.admissionNo || st.code || (st.id ? `REG/${st.id}` : `REG/${st.code || '001'}`),
    avatar: 'ðŸ‘¨â€ðŸŽ“'
  }));
}

export function getExamAttendance(examId: number, className: string = 'SS1', stream: string = 'Science', courseCode?: string, courseName?: string): CBTAttendanceRecord[] {
  _examAttendance = loadSavedAttendance();
  const existingList: CBTAttendanceRecord[] = safeGetProp(_examAttendance, examId) || [];

  // Find exam object to get exact course details if not explicitly passed
  const allExams = loadSavedExams();
  const examObj = allExams.find(e => Number(e.id) === Number(examId) || String(e.id) === String(examId));
  const effectiveClass = className || examObj?.class || 'SS1';
  const effectiveStream = stream || examObj?.stream || 'Science';
  const effectiveCode = courseCode || examObj?.course_code || '';
  const effectiveName = courseName || examObj?.course_name || '';

  const classStudents = getStudentsForClass(effectiveClass, effectiveStream, effectiveCode, effectiveName);

  // Dynamically merge class students with existing records so newly registered students always appear!
  const merged: CBTAttendanceRecord[] = classStudents.map(s => {
    const found = existingList.find(r =>
      (r.studentId && s.studentId && r.studentId.toLowerCase().trim() === s.studentId.toLowerCase().trim()) ||
      (r.studentName && s.studentName && r.studentName.toLowerCase().trim() === s.studentName.toLowerCase().trim())
    );
    if (found) {
      return {
        ...found,
        studentName: s.studentName,
        class: s.class || found.class,
        stream: s.stream || found.stream
      };
    }
    return {
      examId,
      studentId: s.studentId,
      studentName: s.studentName,
      class: s.class,
      stream: s.stream,
      markedPresent: false,
      markedAt: new Date().toISOString(),
      markedBy: 'Teacher Invigilator'
    };
  });

  safeSetProp(_examAttendance, examId, merged);
  persistAttendance(_examAttendance);
  return merged;
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
  // If no restricted attendance session exists for this exam, student is allowed
  if (!list || list.length === 0) {
    return true;
  }

  const lower = (studentIdentifier || '').trim().toLowerCase();
  if (!lower) return true;

  const record = list.find(
    r => (r.studentId && r.studentId.toLowerCase() === lower) ||
         (r.studentName && r.studentName.toLowerCase() === lower) ||
         (r.studentId && lower.includes(r.studentId.toLowerCase())) ||
         (r.studentName && lower.includes(r.studentName.toLowerCase()))
  );
  // If explicitly found in attendance list, check marked status; if not explicitly marked absent, allow taking the exam
  return record ? record.markedPresent !== false : true;
}

// â”€â”€ Event subscription â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Persistent Student Broadsheet Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Promotion & Academic History Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


// â”€â”€ Persistent Login Activity & Security Audit Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
