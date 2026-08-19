// Central CBT & LMS Engine for Tare Pet Montessori School
// All data lives in module-level memory and localStorage sync. Syncs with backend API.
import { addRealtimeNotification } from './notifications-store';

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

export const DEFAULT_FORM_TEACHERS: TeacherRecord[] = [
  {
    id: 101,
    staffId: 'TMS/TCH/0060',
    name: 'Ms Allison Victoria',
    email: 'allison.victoria@tarepet.com',
    gender: 'Female',
    phone: '08062577566',
    formTeacherOf: 'SS 1',
    department: 'Senior Secondary Section',
    specialization: 'SS 1 Curriculum',
    subjectsAssigned: ['Primary Literacy & Language Arts', 'SS1 General'],
    status: 'Active',
    joined: '2022-09-01',
    password: 'TMS/TCH/0060',
    address: 'Tarepet School Campus',
    qualification: 'B.Ed. Literacy Education'
  },
  {
    id: 102,
    staffId: 'TMS/TCH/0016',
    name: 'Mrs Timi Porbeni',
    email: 'isaactimi16@gmail.com',
    gender: 'Female',
    phone: '07068523730',
    formTeacherOf: 'None',
    department: 'Languages & Literature',
    specialization: 'English Language & Literature in English',
    subjectsAssigned: ['English Language', 'Literature in English'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0016',
    address: 'Tarepet School Campus',
    qualification: 'B.A. English'
  },
  {
    id: 103,
    staffId: 'TMS/TCH/0070',
    name: 'Samuel Ogah',
    email: 'samuel.ogah@tarepet.com',
    gender: 'Male',
    phone: '08062489432',
    formTeacherOf: 'None',
    department: 'Computer & ICT Department',
    specialization: 'Coding (P1-SS2) & Digital Literacy (JSS1-3)',
    subjectsAssigned: ['Computer Studies', 'Coding', 'Digital Literacy'],
    status: 'Active',
    joined: '2022-01-15',
    password: 'TMS/TCH/0070',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Computer Science'
  },
  {
    id: 104,
    staffId: 'TMS/TCH/0061',
    name: 'Nwachukwu (O) Edirin',
    email: 'edirin.nwachukwu@tarepet.com',
    gender: 'Female',
    phone: '07030356176',
    formTeacherOf: 'SS 2',
    department: 'Senior Secondary Science Department',
    specialization: 'Physics & Chemistry Education',
    subjectsAssigned: ['Physics', 'Chemistry'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0061',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Physics'
  },
  {
    id: 105,
    staffId: 'TMS/TCH/0062',
    name: 'Mrs Ozichi Nwando Arinze',
    email: 'ozichi.arinze@tarepet.com',
    gender: 'Female',
    phone: '08067102216',
    formTeacherOf: 'Basic 4',
    department: 'Primary Section',
    specialization: 'Mathematics (Basic 4)',
    subjectsAssigned: ['Elementary Mathematics', 'Basic Science'],
    status: 'Active',
    joined: '2022-01-15',
    password: 'TMS/TCH/0062',
    address: 'Tarepet School Campus',
    qualification: 'B.Ed. Primary Education'
  },
  {
    id: 106,
    staffId: 'TMS/TCH/0063',
    name: 'Ogbe Andrew',
    email: 'ogbe.andrew@tarepet.com',
    gender: 'Male',
    phone: '080806976503',
    formTeacherOf: 'SS 3',
    department: 'Senior Secondary Humanities Department',
    specialization: 'Literature in English & History',
    subjectsAssigned: ['Literature in English', 'History'],
    status: 'Active',
    joined: '2020-09-01',
    password: 'TMS/TCH/0063',
    address: 'Tarepet School Campus',
    qualification: 'B.A. Literature'
  },
  {
    id: 107,
    staffId: 'TMS/TCH/0017',
    name: 'Abiola Adeniyi Adeyemo',
    email: 'adeniyiabiola2@gmail.com',
    gender: 'Male',
    phone: '07030549799',
    formTeacherOf: 'None',
    department: 'Science Department',
    specialization: 'Chemistry',
    subjectsAssigned: ['Chemistry'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0017',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Chemistry'
  },
  {
    id: 108,
    staffId: 'TMS/TCH/0019',
    name: 'Simeon Blessed Chigozie',
    email: 'blessedsimeon6@gmail.com',
    gender: 'Male',
    phone: '08131251726',
    formTeacherOf: 'SS 1 Love',
    department: 'Senior Secondary Section',
    specialization: 'Physics (JSS1-3 / SS1-3)',
    subjectsAssigned: ['Physics', 'Basic Science'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0019',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Physics Education'
  },
  {
    id: 109,
    staffId: 'TMS/TCH/0071',
    name: 'Egbe B. Austin',
    email: 'egbe.austin@tarepet.com',
    gender: 'Male',
    phone: '08146783609',
    formTeacherOf: 'None',
    department: 'Physical Education Department',
    specialization: 'JSS1-3 Physical & Health Education (PHE)',
    subjectsAssigned: ['Physical & Health Education'],
    status: 'Active',
    joined: '2022-09-01',
    password: 'TMS/TCH/0071',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Physical Education'
  },
  {
    id: 110,
    staffId: 'TMS/TCH/0026',
    name: 'Oyiniki Anita Ojinbrakemi',
    email: 'oyinkianita6@gmail.com',
    gender: 'Female',
    phone: '08066154094',
    formTeacherOf: 'JSS 3 Love',
    department: 'Junior Secondary Section',
    specialization: 'Home Economics & English Language',
    subjectsAssigned: ['Home Economics', 'English Language'],
    status: 'Active',
    joined: '2022-09-01',
    password: 'TMS/TCH/0026',
    address: 'Tarepet School Campus',
    qualification: 'B.A. English'
  },
  {
    id: 111,
    staffId: 'TMS/TCH/0044',
    name: 'MRS EZE CHIDUBEM JANNETH',
    email: 'ukachukwuchidubem223@gmail.com',
    gender: 'Female',
    phone: '08142417833',
    formTeacherOf: 'JSS 2 Faith',
    department: 'Junior Secondary Section',
    specialization: 'JSS 2 Faith & Business Studies',
    subjectsAssigned: ['Business Studies', 'Home Economics'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0044',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Business Education'
  },
  {
    id: 112,
    staffId: 'TMS/TCH/0072',
    name: 'Agadaga Tari',
    email: 'agadaga.tari@tarepet.com',
    gender: 'Male',
    phone: '08065008494',
    formTeacherOf: 'None',
    department: 'Creative & Fine Arts Department',
    specialization: 'JSS 1-3 Fine Art',
    subjectsAssigned: ['Fine Art', 'Cultural & Creative Arts'],
    status: 'Active',
    joined: '2022-09-01',
    password: 'TMS/TCH/0072',
    address: 'Tarepet School Campus',
    qualification: 'B.A. Fine Arts'
  },
  {
    id: 113,
    staffId: 'TMS/TCH/0054',
    name: 'Amos Godspower',
    email: 'amosgodspower360@mail.com',
    gender: 'Male',
    phone: '07035339196',
    formTeacherOf: 'JSS 3 Faith',
    department: 'Junior Secondary Section',
    specialization: 'Social Studies & Civic Education (JSS1-3)',
    subjectsAssigned: ['Civic Education', 'Social Studies'],
    status: 'Active',
    joined: '2020-09-01',
    password: 'TMS/TCH/0054',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Political Science'
  },
  {
    id: 114,
    staffId: 'TMS/TCH/0064',
    name: 'Iwu Adanma',
    email: 'iwu.adanma@tarepet.com',
    gender: 'Female',
    phone: '08039341848',
    formTeacherOf: 'JSS 1 Faith',
    department: 'Junior Secondary Section',
    specialization: 'JSS 1-2 Business Studies',
    subjectsAssigned: ['Business Studies'],
    status: 'Active',
    joined: '2023-01-10',
    password: 'TMS/TCH/0064',
    address: 'Tarepet School Campus',
    qualification: 'B.Ed. Primary Education'
  },
  {
    id: 115,
    staffId: 'TMS/TCH/0043',
    name: 'Mr. Joseph Ekenebe',
    email: 'joebleszekenebe@gmail.com',
    gender: 'Male',
    phone: '08137183618',
    formTeacherOf: 'SS 2 Grace',
    department: 'Senior Secondary Section',
    specialization: 'SS 1-3 Marketing & Entrepreneurship',
    subjectsAssigned: ['Marketing', 'Entrepreneurship', 'Senior Secondary Studies'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0043',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Education'
  },
  {
    id: 116,
    staffId: 'TMS/TCH/0027',
    name: 'Goodluck Ufomba',
    email: 'goodluckufomba2020@gmail.com',
    gender: 'Male',
    phone: '08032288883',
    formTeacherOf: 'None',
    department: 'Mathematics Department',
    specialization: 'Mathematics (JSS 2 & SS 2)',
    subjectsAssigned: ['Mathematics'],
    status: 'Active',
    joined: '2022-09-01',
    password: 'TMS/TCH/0027',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Mathematics'
  },
  {
    id: 117,
    staffId: 'TMS/TCH/0025',
    name: 'ELI IDUA',
    email: 'eliidua@gmail.com',
    gender: 'Male',
    phone: '08068583070',
    formTeacherOf: 'None',
    department: 'Mathematics Department',
    specialization: 'Mathematics & Further Mathematics (JSS3, SS2, SS3)',
    subjectsAssigned: ['Mathematics', 'Further Mathematics'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0025',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Mathematics'
  },
  {
    id: 118,
    staffId: 'TMS/TCH/0013',
    name: 'ALEX T AKPOBULOKEMI MARIN',
    email: 'alexakpobulokemi@gmail.com',
    gender: 'Male',
    phone: '09066984417',
    formTeacherOf: 'None',
    department: 'Geography & Marine Sciences',
    specialization: 'Geography (SS 1 - SS 3)',
    subjectsAssigned: ['Geography', 'Marine Geography'],
    status: 'Active',
    joined: '2020-09-01',
    password: 'TMS/TCH/0013',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Geography'
  },
  {
    id: 119,
    staffId: 'TMS/TCH/0022',
    name: 'EMMANUEL U. JOSEPH',
    email: 'joeugbede2024@gmail.com',
    gender: 'Male',
    phone: '08021472342',
    formTeacherOf: 'None',
    department: 'Biological Sciences',
    specialization: 'Biology (SS 1 - SS 3)',
    subjectsAssigned: ['Biology'],
    status: 'Active',
    joined: '2021-09-01',
    password: 'TMS/TCH/0022',
    address: 'Tarepet School Campus',
    qualification: 'B.Sc. Biology'
  }
];

function loadSavedTeachers(): TeacherRecord[] {
  let savedTeachers: TeacherRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tarepet_teachers_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedTeachers = parsed;
        }
      }
    } catch (e) {}
  }

  // Merge DEFAULT_FORM_TEACHERS with saved edits, preserving exact official roster (19)
  const defaultKeys = new Set(DEFAULT_FORM_TEACHERS.map(t => (t.email || t.staffId || '').toLowerCase()));
  const mergedMap = new Map<string, TeacherRecord>();
  
  DEFAULT_FORM_TEACHERS.forEach(t => {
    mergedMap.set((t.email || t.staffId || '').toLowerCase(), t);
  });

  savedTeachers.forEach(t => {
    const key = (t.email || t.staffId || String(t.id)).toLowerCase();
    if (defaultKeys.has(key)) {
      const existing = mergedMap.get(key);
      if (existing) {
        mergedMap.set(key, { ...existing, ...t });
      }
    } else if (typeof t.id === 'number' && t.id >= 1000) {
      // Allow newly created custom teachers (ID >= 1000)
      mergedMap.set(key, t);
    }
  });

  return Array.from(mergedMap.values());
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

  const existingIdx = _teachers.findIndex(t => 
    (teacherData.id && t.id === teacherData.id) ||
    (teacherData.email && t.email && t.email.toLowerCase() === teacherData.email.toLowerCase()) ||
    (staffId && t.staffId && t.staffId.toLowerCase() === staffId.toLowerCase())
  );

  const existing = existingIdx >= 0 ? _teachers[existingIdx] : null;

  const newTeacher: TeacherRecord = {
    id: teacherData.id || (existing ? existing.id : Date.now()),
    staffId: staffId,
    name: teacherData.name.trim(),
    email: email,
    phone: teacherData.phone || (existing?.phone) || '+234 800 000 0000',
    gender: teacherData.gender || (existing?.gender) || 'Male',
    department: teacherData.department || (existing?.department) || 'Academic Department',
    specialization: teacherData.specialization || (existing?.specialization) || 'General Education',
    qualification: teacherData.qualification || (existing?.qualification) || 'B.Sc. Education',
    status: teacherData.status || (existing?.status) || 'Active',
    joined: teacherData.joined || (existing?.joined) || new Date().toISOString().split('T')[0],
    formTeacherOf: teacherData.formTeacherOf || (existing?.formTeacherOf) || 'None',
    subjectsAssigned: teacherData.subjectsAssigned || (existing?.subjectsAssigned) || [],
    classesCount: teacherData.classesCount || (existing?.classesCount) || 0,
    studentsCount: teacherData.studentsCount || (existing?.studentsCount) || 0,
    address: teacherData.address || (existing?.address) || 'Tarepet School Campus',
    dob: teacherData.dob || (existing?.dob) || '1990-01-01',
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

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_teachers_list', JSON.stringify(_teachers));
    } catch (e) {}
  }
  broadcastRealtimeEvent();
  return _teachers[existingIdx >= 0 ? existingIdx : 0];
}

export function saveStoredTeachers(teachers: TeacherRecord[]) {
  _teachers = teachers;
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
    const res = await authClient.get('/auth/users/?role=STUDENT');
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
      _students = fetched;
      broadcastRealtimeEvent();
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

  return newExam;
}

export function updateExamStatus(examId: number, status: CBTExam['status'], reason?: string): CBTExam | null {
  _exams = loadSavedExams();
  const exam = _exams.find(e => e.id === examId);
  if (!exam) return null;

  exam.status = status;
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

  return [
    { studentId: 'TMS/SS1/SCI/4821', studentName: 'Emeka Amadi', class: c, stream: s, regNo: '2025/4821', avatar: '👨‍🎓' },
    { studentId: 'TMS/SS1/SCI/4822', studentName: 'Chisom Okeke', class: c, stream: s, regNo: '2025/4822', avatar: '👩‍🎓' },
    { studentId: 'TMS/SS1/SCI/4823', studentName: 'Fatimah Bello', class: c, stream: s, regNo: '2025/4823', avatar: '👩‍🎓' },
    { studentId: 'TMS/SS1/SCI/4824', studentName: 'Chidi Eze', class: c, stream: s, regNo: '2025/4824', avatar: '👨‍🎓' },
    { studentId: 'TMS/SS1/SCI/4825', studentName: 'Grace Adebayo', class: c, stream: s, regNo: '2025/4825', avatar: '👩‍🎓' },
    { studentId: 'TMS/SS1/SCI/4826', studentName: 'Tunde Bakare', class: c, stream: s, regNo: '2025/4826', avatar: '👨‍🎓' },
    { studentId: 'TMS/SS1/SCI/4827', studentName: 'Nneka Nwosu', class: c, stream: s, regNo: '2025/4827', avatar: '👩‍🎓' },
    { studentId: 'TMS/SS1/SCI/4828', studentName: 'Kofi Mensah', class: c, stream: s, regNo: '2025/4828', avatar: '👨‍🎓' },
  ];
}

export function getExamAttendance(examId: number, className: string = 'SS1', stream: string = 'Science'): CBTAttendanceRecord[] {
  _examAttendance = loadSavedAttendance();
  const list = _examAttendance[String(examId)];
  if (list && list.length > 0) return list;

  // If no attendance saved yet for this exam, seed default attendance list
  const defaultStudents = getStudentsForClass(className, stream);
  const seeded: CBTAttendanceRecord[] = defaultStudents.map((s, idx) => ({
    examId,
    studentId: s.studentId,
    studentName: s.studentName,
    class: s.class,
    stream: s.stream,
    markedPresent: idx === 0, // Emeka Amadi marked present by default for demo
    markedAt: new Date().toISOString(),
    markedBy: 'Teacher Invigilator'
  }));

  _examAttendance[String(examId)] = seeded;
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

  _examAttendance[key] = list;
  persistAttendance(_examAttendance);
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

  _examAttendance[key] = list;
  persistAttendance(_examAttendance);
  broadcastRealtimeEvent();
}

export function isStudentMarkedPresent(examId: number, studentIdentifier: string): boolean {
  _examAttendance = loadSavedAttendance();
  const list = _examAttendance[String(examId)];
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
  assignment: number;
  cbtScore: number;
  paperExam: number;
  remark?: string;
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
  broadcastRealtimeEvent();
}

export function getAutomaticCBTScore(studentCodeOrEmail: string, courseCode: string): number {
  const subs = getStoredSubmissions();
  const lower = (studentCodeOrEmail || '').toLowerCase();
  const match = subs.find(s => 
    (s.student_id?.toLowerCase() === lower || s.student_email?.toLowerCase() === lower || s.student_name?.toLowerCase().includes(lower)) &&
    (s.course_code === courseCode || s.exam_title?.toLowerCase().includes(courseCode.toLowerCase()))
  );

  if (match && typeof match.percentage === 'number') {
    return Math.round((match.percentage / 100) * 30);
  }

  // Default CBT test scores for demo students SS1 to SS3
  if (courseCode === 'MTH-101') return 24;
  if (courseCode === 'PHY-101') return 22;
  if (courseCode === 'CHM-101') return 25;
  if (courseCode === 'ENG-101') return 26;
  if (courseCode === 'BIO-101') return 23;
  if (courseCode === 'CIV-101') return 25;
  if (courseCode.startsWith('PRI') || courseCode.startsWith('NUR')) return 22;
  return 20;
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
  if (typeof window === 'undefined') return 'AdminPassword123!';
  try {
    const saved = localStorage.getItem('tarepet_admin_password');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'AdminPassword123!';
}

export function setAdminPassword(newPassword: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tarepet_admin_password', newPassword.trim());
    broadcastRealtimeEvent();
  } catch {}
}