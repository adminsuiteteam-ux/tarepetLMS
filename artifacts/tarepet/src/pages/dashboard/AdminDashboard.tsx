import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Users, BookOpen, Server, CheckCircle2,
  Plus, FileText, Download, Upload, Search,
  Activity, DollarSign, CreditCard,
  AlertCircle, BarChart2, Settings,
  ChevronLeft, RefreshCw, Lock, Clock, X,
  ClipboardList, Printer, QrCode,
  ArrowUpRight, ArrowDownRight, Building2,
  Mail, Phone, MapPin, Calendar, Shield, GraduationCap,
  Briefcase, UserCog, BookMarked, MessageSquare, KeyRound,
  BadgeCheck, Ban, RotateCcw, FileDown, Send, FlaskConical, Palette,
} from 'lucide-react';
import {
  FaChalkboardUser, FaBriefcase, FaUserShield, FaUserGraduate,
  FaPen, FaTrash, FaIdCard, FaEnvelope, FaLock, FaCalendarCheck,
  FaBookOpen, FaChartBar, FaFileLines, FaBan, FaKey, FaPhone,
  FaLocationDot, FaMoneyBillWave, FaGraduationCap, FaChalkboard,
  FaUserCheck, FaClipboardList, FaMessage, FaDownload, FaPrint,
} from 'react-icons/fa6';

// ── Types ────────────────────────────────────────────────────
interface TabProps { id: string; label: string; icon: React.ReactNode; badge?: number }

// ── Mock Data ────────────────────────────────────────────────
const MOCK_USERS: any[] = [
  {
    id: 1, name: 'Mr. Chukwuemeka Obi', email: 'admin@tarepet.edu.ng', role: 'ADMIN', status: 'Active',
    joined: '2026-01-01', lastLogin: '2026-07-24',
    phone: '+234 801 000 0001', location: 'Lagos, Nigeria',
    adminRole: 'Platform Administrator', department: 'ICT & Operations',
    salary: '\u20a6450,000/month',
  },
  {
    id: 2, name: 'Mrs. Okafor Chioma', email: 'teacher@tarepet.edu.ng', role: 'TEACHER', status: 'Active',
    joined: '2026-01-15', lastLogin: '2026-07-24',
    phone: '+234 802 111 2222', location: 'Port Harcourt, Nigeria',
    subjects: ['Montessori Mathematics', 'Applied Sciences'],
    classes: ['SS1 Science', 'SS2 Art'],
    salary: '\u20a6280,000/month', qualification: 'B.Ed Mathematics, PGD Montessori Education',
  },
  {
    id: 4, name: 'Mrs. Adaeze Nwosu', email: 'librarian@tarepet.edu.ng', role: 'PARENT', status: 'Active',
    joined: '2026-02-01', lastLogin: '2026-07-22',
    phone: '+234 804 555 6666', location: 'Abuja, Nigeria',
    department: 'Library Services', staffId: 'STF-2026-004',
    salary: '\u20a6180,000/month',
  },
  {
    id: 6, name: 'Mr. James Eze', email: 'jeze@tarepet.edu.ng', role: 'TEACHER', status: 'Inactive',
    joined: '2026-03-01', lastLogin: '2026-07-10',
    phone: '+234 806 999 0000', location: 'Enugu, Nigeria',
    subjects: ['Language Arts & Creative Writing', 'Social Studies'],
    classes: ['SS2 Art', 'SS3 Art'],
    salary: '\u20a6265,000/month', qualification: 'B.A English Language, PGDE',
  },
];

// ── Senior Secondary Student Roster (SS1–SS3, Science & Art) ──
const MOCK_SS_STUDENTS: any[] = [
  // SS1 Science
  { id: 101, name: 'Emeka Amadi',      email: 'emeka.amadi@tarepet.edu.ng',    role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-23', phone: '+234 803 001 0001', location: 'Port Harcourt', grade: 'SS1', stream: 'Science', house: 'Blue House (Eagle)',   studentId: 'TMS-2024-101', dob: '2010-05-14' },
  { id: 102, name: 'Chidinma Eze',     email: 'chidinma.eze@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-22', phone: '+234 803 001 0002', location: 'Enugu',         grade: 'SS1', stream: 'Science', house: 'Green House (Jaguar)', studentId: 'TMS-2024-102', dob: '2010-08-20' },
  { id: 103, name: 'Tunde Balogun',    email: 'tunde.balogun@tarepet.edu.ng',  role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-21', phone: '+234 803 001 0003', location: 'Lagos',         grade: 'SS1', stream: 'Science', house: 'Red House (Falcon)',   studentId: 'TMS-2024-103', dob: '2010-02-11' },
  { id: 104, name: 'Ngozi Okafor',     email: 'ngozi.okafor@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-20', phone: '+234 803 001 0004', location: 'Owerri',        grade: 'SS1', stream: 'Science', house: 'Purple House (Phoenix)',studentId: 'TMS-2024-104', dob: '2010-11-03' },
  { id: 105, name: 'Ifeanyi Nwosu',    email: 'ifeanyi.nwosu@tarepet.edu.ng',  role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-23', phone: '+234 803 001 0005', location: 'Onitsha',       grade: 'SS1', stream: 'Science', house: 'Blue House (Eagle)',   studentId: 'TMS-2024-105', dob: '2010-06-27' },
  // SS1 Art
  { id: 106, name: 'Amara Obiora',     email: 'amara.obiora@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-22', phone: '+234 803 001 0006', location: 'Asaba',         grade: 'SS1', stream: 'Art',     house: 'Green House (Jaguar)', studentId: 'TMS-2024-106', dob: '2010-04-09' },
  { id: 107, name: 'David Okeke',      email: 'david.okeke@tarepet.edu.ng',    role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-21', phone: '+234 803 001 0007', location: 'Benin City',    grade: 'SS1', stream: 'Art',     house: 'Red House (Falcon)',   studentId: 'TMS-2024-107', dob: '2010-12-15' },
  { id: 108, name: 'Fatima Abdullahi', email: 'fatima.abdullahi@tarepet.edu.ng',role: 'STUDENT', status: 'Active', joined: '2024-09-01', lastLogin: '2026-07-20', phone: '+234 803 001 0008', location: 'Abuja',         grade: 'SS1', stream: 'Art',     house: 'Blue House (Eagle)',   studentId: 'TMS-2024-108', dob: '2010-07-30' },
  { id: 109, name: 'Kelechi Ogbu',     email: 'kelechi.ogbu@tarepet.edu.ng',   role: 'STUDENT', status: 'Inactive',joined: '2024-09-01', lastLogin: '2026-06-10', phone: '+234 803 001 0009', location: 'Uyo',           grade: 'SS1', stream: 'Art',     house: 'Purple House (Phoenix)',studentId: 'TMS-2024-109', dob: '2010-09-18' },
  // SS2 Science
  { id: 201, name: 'Ada Obi',          email: 'ada.obi@tarepet.edu.ng',        role: 'STUDENT', status: 'Active', joined: '2023-09-01', lastLogin: '2026-07-23', phone: '+234 803 002 0001', location: 'Lagos',         grade: 'SS2', stream: 'Science', house: 'Green House (Jaguar)', studentId: 'TMS-2023-201', dob: '2009-09-21' },
  { id: 202, name: 'Chukwudi Eze',     email: 'chukwudi.eze@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2023-09-01', lastLogin: '2026-07-22', phone: '+234 803 002 0002', location: 'Enugu',         grade: 'SS2', stream: 'Science', house: 'Blue House (Eagle)',   studentId: 'TMS-2023-202', dob: '2009-03-05' },
  { id: 203, name: 'Blessing Okonkwo', email: 'blessing.okonkwo@tarepet.edu.ng',role: 'STUDENT', status: 'Active', joined: '2023-09-01', lastLogin: '2026-07-21', phone: '+234 803 002 0003', location: 'Owerri',        grade: 'SS2', stream: 'Science', house: 'Red House (Falcon)',   studentId: 'TMS-2023-203', dob: '2009-01-19' },
  { id: 204, name: 'Emmanuel Adeyemi', email: 'emmanuel.adeyemi@tarepet.edu.ng',role: 'STUDENT', status: 'Active', joined: '2023-09-01', lastLogin: '2026-07-23', phone: '+234 803 002 0004', location: 'Ibadan',        grade: 'SS2', stream: 'Science', house: 'Purple House (Phoenix)',studentId: 'TMS-2023-204', dob: '2009-07-08' },
  // SS2 Art
  { id: 205, name: 'Adaeze Nwofor',    email: 'adaeze.nwofor@tarepet.edu.ng',  role: 'STUDENT', status: 'Active', joined: '2023-09-01', lastLogin: '2026-07-22', phone: '+234 803 002 0005', location: 'Port Harcourt', grade: 'SS2', stream: 'Art',     house: 'Blue House (Eagle)',   studentId: 'TMS-2023-205', dob: '2009-05-12' },
  { id: 206, name: 'Musa Ibrahim',     email: 'musa.ibrahim@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2023-09-01', lastLogin: '2026-07-21', phone: '+234 803 002 0006', location: 'Kano',          grade: 'SS2', stream: 'Art',     house: 'Green House (Jaguar)', studentId: 'TMS-2023-206', dob: '2009-10-25' },
  { id: 207, name: 'Uchenna Obi',      email: 'uchenna.obi@tarepet.edu.ng',    role: 'STUDENT', status: 'Inactive',joined: '2023-09-01', lastLogin: '2026-05-30', phone: '+234 803 002 0007', location: 'Onitsha',       grade: 'SS2', stream: 'Art',     house: 'Red House (Falcon)',   studentId: 'TMS-2023-207', dob: '2009-02-14' },
  // SS3 Science
  { id: 301, name: 'Obioma Chukwu',    email: 'obioma.chukwu@tarepet.edu.ng',  role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-23', phone: '+234 803 003 0001', location: 'Port Harcourt', grade: 'SS3', stream: 'Science', house: 'Blue House (Eagle)',   studentId: 'TMS-2022-301', dob: '2008-04-17' },
  { id: 302, name: 'Chisom Nwosu',     email: 'chisom.nwosu@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-22', phone: '+234 803 003 0002', location: 'Aba',           grade: 'SS3', stream: 'Science', house: 'Purple House (Phoenix)',studentId: 'TMS-2022-302', dob: '2008-11-02' },
  { id: 303, name: 'Adebayo Salami',   email: 'adebayo.salami@tarepet.edu.ng', role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-21', phone: '+234 803 003 0003', location: 'Abeokuta',      grade: 'SS3', stream: 'Science', house: 'Green House (Jaguar)', studentId: 'TMS-2022-303', dob: '2008-08-22' },
  { id: 304, name: 'Nkechi Onyeka',    email: 'nkechi.onyeka@tarepet.edu.ng',  role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-23', phone: '+234 803 003 0004', location: 'Enugu',         grade: 'SS3', stream: 'Science', house: 'Red House (Falcon)',   studentId: 'TMS-2022-304', dob: '2008-06-30' },
  // SS3 Art
  { id: 305, name: 'Ifeoma Ezeh',      email: 'ifeoma.ezeh@tarepet.edu.ng',    role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-22', phone: '+234 803 003 0005', location: 'Awka',          grade: 'SS3', stream: 'Art',     house: 'Blue House (Eagle)',   studentId: 'TMS-2022-305', dob: '2008-03-08' },
  { id: 306, name: 'Seun Adewale',     email: 'seun.adewale@tarepet.edu.ng',   role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-21', phone: '+234 803 003 0006', location: 'Ibadan',        grade: 'SS3', stream: 'Art',     house: 'Green House (Jaguar)', studentId: 'TMS-2022-306', dob: '2008-12-01' },
  { id: 307, name: 'Amina Yusuf',      email: 'amina.yusuf@tarepet.edu.ng',    role: 'STUDENT', status: 'Active', joined: '2022-09-01', lastLogin: '2026-07-20', phone: '+234 803 003 0007', location: 'Kaduna',        grade: 'SS3', stream: 'Art',     house: 'Purple House (Phoenix)',studentId: 'TMS-2022-307', dob: '2008-09-14' },
  { id: 308, name: 'Femi Adesanya',    email: 'femi.adesanya@tarepet.edu.ng',  role: 'STUDENT', status: 'Inactive',joined: '2022-09-01', lastLogin: '2026-04-15', phone: '+234 803 003 0008', location: 'Lagos',         grade: 'SS3', stream: 'Art',     house: 'Red House (Falcon)',   studentId: 'TMS-2022-308', dob: '2008-07-26' },
];

const MOCK_SUBJECTS = [
  // SS1 Science
  { id: 1,  code: 'MTH-101', title: 'Senior Secondary Mathematics I',   teacher: 'Mrs. Okafor Chioma', grade: 'SS1', stream: 'Science', category: 'STEM', enrolled: 24 },
  { id: 2,  code: 'PHY-101', title: 'Senior Secondary Physics I',       teacher: 'Mr. Okonkwo Paul',   grade: 'SS1', stream: 'Science', category: 'STEM', enrolled: 24 },
  { id: 3,  code: 'CHM-101', title: 'Senior Secondary Chemistry I',     teacher: 'Mrs. Okafor Chioma', grade: 'SS1', stream: 'Science', category: 'STEM', enrolled: 24 },
  { id: 4,  code: 'BIO-101', title: 'Senior Secondary Biology I',       teacher: 'Mr. Okonkwo Paul',   grade: 'SS1', stream: 'Science', category: 'STEM', enrolled: 24 },
  
  // SS1 Art
  { id: 5,  code: 'ENG-101', title: 'Senior Secondary English I',       teacher: 'Mrs. Dada Kemi',     grade: 'SS1', stream: 'Art',     category: 'Humanities', enrolled: 19 },
  { id: 6,  code: 'LIT-101', title: 'Literature in English I',          teacher: 'Mr. James Eze',      grade: 'SS1', stream: 'Art',     category: 'Humanities', enrolled: 19 },
  { id: 7,  code: 'GOV-101', title: 'Government I',                     teacher: 'Mr. James Eze',      grade: 'SS1', stream: 'Art',     category: 'Humanities', enrolled: 19 },
  { id: 8,  code: 'CRS-101', title: 'Christian Religious Studies I',   teacher: 'Mrs. Dada Kemi',     grade: 'SS1', stream: 'Art',     category: 'Humanities', enrolled: 19 },

  // SS2 Science
  { id: 9,  code: 'MTH-201', title: 'Senior Secondary Mathematics II',  teacher: 'Mrs. Okafor Chioma', grade: 'SS2', stream: 'Science', category: 'STEM', enrolled: 22 },
  { id: 10, code: 'PHY-201', title: 'Senior Secondary Physics II',      teacher: 'Mr. Okonkwo Paul',   grade: 'SS2', stream: 'Science', category: 'STEM', enrolled: 22 },
  { id: 11, code: 'CHM-201', title: 'Senior Secondary Chemistry II',    teacher: 'Mrs. Okafor Chioma', grade: 'SS2', stream: 'Science', category: 'STEM', enrolled: 22 },

  // SS2 Art
  { id: 12, code: 'ENG-201', title: 'Senior Secondary English II',      teacher: 'Mrs. Dada Kemi',     grade: 'SS2', stream: 'Art',     category: 'Humanities', enrolled: 18 },
  { id: 13, code: 'LIT-201', title: 'Literature in English II',         teacher: 'Mr. James Eze',      grade: 'SS2', stream: 'Art',     category: 'Humanities', enrolled: 18 },

  // SS3 Science
  { id: 14, code: 'MTH-301', title: 'Senior Secondary Mathematics III', teacher: 'Mrs. Okafor Chioma', grade: 'SS3', stream: 'Science', category: 'STEM', enrolled: 20 },
  { id: 15, code: 'PHY-301', title: 'Senior Secondary Physics III',     teacher: 'Mr. Okonkwo Paul',   grade: 'SS3', stream: 'Science', category: 'STEM', enrolled: 20 },

  // SS3 Art
  { id: 16, code: 'ENG-301', title: 'Senior Secondary English III',     teacher: 'Mrs. Dada Kemi',     grade: 'SS3', stream: 'Art',     category: 'Humanities', enrolled: 17 },
  { id: 17, code: 'LIT-301', title: 'Literature in English III',        teacher: 'Mr. James Eze',      grade: 'SS3', stream: 'Art',     category: 'Humanities', enrolled: 17 },
];

const MOCK_HOUSES = [
  { name: 'Blue House (Eagle)', color: '#3B82F6', motto: 'Wisdom & Integrity', points: 520, students: 14, head: 'Mrs. Okafor Chioma' },
  { name: 'Purple House (Phoenix)', color: '#8B5CF6', motto: 'Royalty & Distinction', points: 510, students: 13, head: 'Mr. James Eze' },
  { name: 'Green House (Jaguar)', color: '#10B981', motto: 'Growth & Resilience', points: 480, students: 12, head: 'Ms. Adaobi' },
  { name: 'Red House (Falcon)', color: '#EF4444', motto: 'Passion & Determination', points: 450, students: 11, head: 'Mr. Bello' },
];

const MOCK_AUDIT_LOGS = [
  { id: 1, user: 'admin@tarepet.edu.ng', action: 'LOGIN', target: 'Auth System', ip: '127.0.0.1', timestamp: '2026-07-24 07:00:12', status: 'SUCCESS' },
  { id: 2, user: 'admin@tarepet.edu.ng', action: 'BULK_IMPORT', target: 'Users (4 created)', ip: '127.0.0.1', timestamp: '2026-07-24 07:02:48', status: 'SUCCESS' },
  { id: 3, user: 'teacher@tarepet.edu.ng', action: 'GRADE_SUBMISSION', target: 'Submission #3 (Emeka Amadi)', ip: '192.168.1.20', timestamp: '2026-07-24 07:15:33', status: 'SUCCESS' },
  { id: 4, user: 'teacher@tarepet.edu.ng', action: 'MARK_ATTENDANCE', target: 'MTH-101 Class (24 students)', ip: '192.168.1.20', timestamp: '2026-07-24 08:05:00', status: 'SUCCESS' },
  { id: 5, user: 'unknown@invalid.com', action: 'LOGIN_ATTEMPT', target: 'Auth System', ip: '45.33.32.156', timestamp: '2026-07-24 08:23:11', status: 'FAILED' },
  { id: 6, user: 'admin@tarepet.edu.ng', action: 'AWARD_HOUSE_POINTS', target: 'Blue House Eagle (+25 pts)', ip: '127.0.0.1', timestamp: '2026-07-24 09:10:02', status: 'SUCCESS' },
  { id: 7, user: 'admin@tarepet.edu.ng', action: 'UPDATE_SETTINGS', target: 'School Config (Grading Schema)', ip: '127.0.0.1', timestamp: '2026-07-24 09:45:00', status: 'SUCCESS' },
];

const INITIAL_EXAMS = [
  { id: 1,  title: 'SS1 Science Mid-Term Examination',      subject: 'Mathematics',            class: 'SS1', stream: 'Science', date: '2026-08-05', time: '09:00', duration: '3hrs', venue: 'Hall A', status: 'Pending Approval',  invigilator: 'Mrs. Okafor Chioma',  totalCandidates: 5  },
  { id: 2,  title: 'SS1 Art Mid-Term Examination',          subject: 'English Language',       class: 'SS1', stream: 'Art',     date: '2026-08-06', time: '09:00', duration: '3hrs', venue: 'Hall B', status: 'Pending Approval',  invigilator: 'Mr. James Eze',       totalCandidates: 4  },
  { id: 3,  title: 'SS2 Science Mid-Term Examination',      subject: 'Physics',                class: 'SS2', stream: 'Science', date: '2026-08-07', time: '10:00', duration: '3hrs', venue: 'Hall A', status: 'Ongoing',            invigilator: 'Mrs. Okafor Chioma',  totalCandidates: 4  },
  { id: 4,  title: 'SS2 Art Mid-Term Examination',          subject: 'Literature in English',  class: 'SS2', stream: 'Art',     date: '2026-08-07', time: '13:00', duration: '2hrs', venue: 'Hall B', status: 'Ongoing',            invigilator: 'Mr. James Eze',       totalCandidates: 3  },
  { id: 5,  title: 'SS3 Science WAEC Prep Mock',            subject: 'Chemistry',              class: 'SS3', stream: 'Science', date: '2026-07-20', time: '09:00', duration: '3hrs', venue: 'Hall A', status: 'Completed',          invigilator: 'Mrs. Okafor Chioma',  totalCandidates: 4  },
  { id: 6,  title: 'SS3 Art WAEC Prep Mock',                subject: 'Economics',              class: 'SS3', stream: 'Art',     date: '2026-07-21', time: '09:00', duration: '2hrs', venue: 'Hall B', status: 'Completed',          invigilator: 'Mr. James Eze',       totalCandidates: 4  },
  { id: 7,  title: 'SS1 Science Biology Practical',         subject: 'Biology',                class: 'SS1', stream: 'Science', date: '2026-08-10', time: '08:00', duration: '4hrs', venue: 'Lab 1', status: 'Approved',           invigilator: 'Mr. Okonkwo Paul',    totalCandidates: 5  },
  { id: 8,  title: 'SS3 Science Terminal Examination',      subject: 'Further Mathematics',    class: 'SS3', stream: 'Science', date: '2026-07-15', time: '09:00', duration: '3hrs', venue: 'Hall A', status: 'Cancelled',          invigilator: 'Mrs. Okafor Chioma',  totalCandidates: 4  },
];

// ── Sub-components ───────────────────────────────────────────
const MetricCard = ({
  label, value, sub, icon: Icon, color, trend
}: {
  label: string; value: string; sub?: string; icon: any;
  color: string; trend?: 'up' | 'down' | 'neutral';
}) => (
  <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <h3 className="text-2xl font-serif font-bold text-foreground mt-1 truncate">{value}</h3>
      {sub && (
        <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-muted-foreground'
        }`}>
          {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const SystemHealthBar = ({ label, value, unit, max = 100, color }: {
  label: string; value: number; unit: string; max?: number; color: string;
}) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="font-medium text-foreground">{label}</span>
      <span className={`font-bold ${color}`}>{value}{unit}</span>
    </div>
    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color.includes('emerald') ? 'bg-emerald-500' : color.includes('amber') ? 'bg-amber-500' : color.includes('blue') ? 'bg-blue-500' : 'bg-rose-500'}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

const RoleBadge = ({ role }: { role: string }) => {
  let safeClass = 'bg-muted text-muted-foreground border-border';
  switch (role) {
    case 'ADMIN':
      safeClass = 'bg-rose-500/10 text-rose-600 border-rose-200';
      break;
    case 'TEACHER':
      safeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      break;
    case 'STUDENT':
      safeClass = 'bg-blue-500/10 text-blue-600 border-blue-200';
      break;
    case 'PARENT':
      safeClass = 'bg-amber-500/10 text-amber-600 border-amber-200';
      break;
  }
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${safeClass}`}>
      {role}
    </span>
  );
};


// ── Modals ───────────────────────────────────────────────────
const StudentIDModal = ({ student, onClose }: { student: any; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-serif font-bold text-xl text-foreground">Student ID Card Generator</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
      </div>
      <div className="p-6">
        <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 mb-4">
          <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Tarepet Montessori School</p>
              <p className="text-xs opacity-70">Yenagoa, Bayelsa State</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-xs">TMS</span>
            </div>
          </div>
          <div className="p-5 flex gap-5 items-center">
            <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-serif font-bold text-primary">{student.name[0]}</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{student.name}</h4>
              <p className="text-xs text-muted-foreground font-medium mt-1">Junior Secondary 1</p>
              <p className="text-xs text-muted-foreground">Blue House (Eagle)</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Student ID</span>
                  <p className="font-bold text-foreground">TMS-2026-003</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valid Until</span>
                  <p className="font-bold text-foreground">July 2027</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Printer className="w-4 h-4" /> Print ID Card
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  </div>
);

const BulkImportModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [rows] = useState([
    { email: 'chidi.nwosu@example.com', first_name: 'Chidi', last_name: 'Nwosu', role: 'STUDENT', grade_level: 'JSS2' },
    { email: 'amaka.okafor@example.com', first_name: 'Amaka', last_name: 'Okafor', role: 'STUDENT', grade_level: 'JSS1' },
    { email: 'tunde.adeyemi@example.com', first_name: 'Tunde', last_name: 'Adeyemi', role: 'TEACHER', grade_level: 'N/A' },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-foreground">Bulk User Import (CSV)</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {step === 'upload' && (
            <>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Drop CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Required columns: email, first_name, last_name, role</p>
              </div>
              <button onClick={() => setStep('preview')} className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Load Sample Preview
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{rows.length} users detected in CSV</p>
                <span className="text-xs text-emerald-600 font-bold">✓ All rows valid</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wider">
                    <tr>
                      {['Email', 'First Name', 'Last Name', 'Role', 'Grade'].map(h => (
                        <th key={h} className="py-2 px-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="py-2 px-3 text-muted-foreground">{r.email}</td>
                        <td className="py-2 px-3 font-medium">{r.first_name}</td>
                        <td className="py-2 px-3 font-medium">{r.last_name}</td>
                        <td className="py-2 px-3"><RoleBadge role={r.role} /></td>
                        <td className="py-2 px-3 text-muted-foreground">{r.grade_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('done')} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  ✓ Import {rows.length} Users
                </button>
                <button onClick={() => setStep('upload')} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">
                  Back
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h4 className="font-serif font-bold text-xl text-foreground mb-2">Import Successful!</h4>
              <p className="text-muted-foreground text-sm">3 users created · 0 skipped · 0 errors</p>
              <button onClick={onClose} className="mt-6 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AwardPointsModal = ({ house, onClose }: { house: any; onClose: () => void }) => {
  const [pts, setPts] = useState('10');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        {!done ? (
          <>
            <h3 className="font-serif font-bold text-xl text-foreground mb-1">Award House Points</h3>
            <p className="text-sm text-muted-foreground mb-5">Awarding points to <strong>{house.name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Points to Award</label>
                <input type="number" value={pts} onChange={e => setPts(e.target.value)} min="1" max="100"
                  className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary text-lg font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Reason / Achievement</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Won inter-house debate competition"
                  className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDone(true)} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  Award +{pts} Points
                </button>
                <button onClick={onClose} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">Cancel</button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🏆</div>
            <h4 className="font-serif font-bold text-xl text-foreground">{pts} Points Awarded!</h4>
            <p className="text-muted-foreground text-sm mt-1">{house.name} now has {house.points + parseInt(pts)} total points.</p>
            <button onClick={onClose} className="mt-5 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ExamPreviewModal = ({ exam, onClose }: { exam: any; onClose: () => void }) => {
  // Generate realistic questions if not defined
  const questions = exam.questions || [
    { num: 1, text: `Discuss the key concepts of the topic in relation to ${exam.subject || 'this course'}.`, answer: "Subjective evaluation based on standard course guidelines." },
    { num: 2, text: `Explain how the principles of Montessori methodology apply to the study of ${exam.subject || 'this subject'}.`, answer: "Observation records & teacher evaluation." },
    { num: 3, text: `State three core rules or equations used in resolving problems in ${exam.subject || 'this course'}.`, answer: "Verify formula usage & step-by-step logic." },
    { num: 4, text: `Analyze the main differences between classical and contemporary approaches to ${exam.subject || 'this field'}.`, answer: "Refer to Chapter 4, section 2." },
  ];

  const rules = exam.rules || [
    "Arrive at the exam venue at least 15 minutes before the start time.",
    "No mobile phones, smartwatches, or other electronic communication devices allowed.",
    "All answers must be written legibly in the provided answer sheets.",
    "Scientific calculators are allowed only for science & mathematics subjects.",
    "Cheating or any form of academic malpractice will result in immediate disqualification.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-muted/20 rounded-t-3xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
              {exam.class} · {exam.stream}
            </span>
            <h3 className="font-serif font-bold text-xl text-foreground mt-2">{exam.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">Subject: <span className="text-foreground font-semibold">{exam.subject}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/10 p-4 rounded-2xl border border-border/50">
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Date & Time</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.date}<br />{exam.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Duration</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.duration}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Venue</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.venue}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Teacher / Invigilator</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.invigilator || 'Not Assigned'}</p>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-primary" /> Rules & Regulations
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
              {rules.map((rule: string, i: number) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Questions Preview */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" /> Exam Questions & Marking Guide Preview
            </h4>
            <div className="space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={i} className="p-4 border border-border rounded-xl bg-card hover:bg-muted/10 transition-colors">
                  <p className="font-bold text-foreground">Question {q.num || i + 1}:</p>
                  <p className="text-muted-foreground mt-1 leading-relaxed text-sm">{q.text}</p>
                  <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-100 rounded-lg text-emerald-800">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-emerald-700">Correct Answer / Guideline:</p>
                    <p className="mt-0.5 text-xs font-semibold">{q.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-muted/10 rounded-b-3xl">
          <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};


const CreateSubjectModal = ({ onClose, onCreated, defaultClass, defaultStream }: { onClose: () => void; onCreated: (sub: any) => void; defaultClass?: string; defaultStream?: string }) => {
  const [form, setForm] = useState({
    code: 'BIO-201',
    title: 'Advanced Biology II',
    teacher: 'Mr. Okonkwo Paul',
    grade: defaultClass || 'SS2',
    stream: defaultStream || 'Science',
    category: 'STEM',
    enrolled: 25
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreated(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif font-bold text-xl text-foreground">Add New Subject</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Subject Code</label>
            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Subject Name</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Instructor / Teacher</label>
            <input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Class Level</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="SS1">SS 1</option>
                <option value="SS2">SS 2</option>
                <option value="SS3">SS 3</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Stream</label>
              <select value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Science">Science</option>
                <option value="Art">Art</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              Add Subject
            </button>
            <button type="button" onClick={onClose} className="border border-border px-5 py-2.5 rounded-xl hover:bg-accent transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AddUserModal = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState({ name: '', email: '', role: 'STUDENT', status: 'Active' });
  const [created, setCreated] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        <h3 className="font-serif font-bold text-xl text-foreground mb-4">Create New User</h3>
        {!created ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. Ngozi Eze" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Email Address</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. ngozi.eze@tarepet.edu.ng" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="PARENT">Parent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCreated(true)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">Create User</button>
              <button onClick={onClose} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-lg">User Created!</h4>
            <p className="text-xs text-muted-foreground">Credentials & login instructions sent to {form.email}.</p>
            <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold mt-2">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Create User For Type Modal ────────────────────────────────
const CreateUserForTypeModal = ({
  typeLabel, defaultRole, onClose, onCreated
}: {
  typeLabel: string;
  defaultRole: string;
  onClose: () => void;
  onCreated: (user: any) => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    subject: '',
    department: '',
    staffId: '',
    grade: '',
  });
  const [created, setCreated] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    setCreated(true);
    onCreated({ name: form.name, email: form.email, role: defaultRole === 'STAFF' ? 'PARENT' : defaultRole });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {!created ? (
          <>
            <div className="mb-5">
              <h3 className="font-serif font-bold text-xl text-foreground">Create New {typeLabel.replace(/s$/, '')} Account</h3>
              <p className="text-xs text-muted-foreground mt-1">Fill in the details below. A welcome email with login credentials will be sent automatically.</p>
            </div>

            <div className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Full Name <span className="text-rose-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mrs. Ngozi Okafor"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Email Address <span className="text-rose-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ngozi@tarepet.edu.ng"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 801 234 5678"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Role-specific fields */}
              {defaultRole === 'TEACHER' && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Subject(s) Taught</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Montessori Mathematics, Agronomy"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
              {defaultRole === 'STAFF' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Department</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select...</option>
                      <option>Administration</option>
                      <option>Library</option>
                      <option>Security</option>
                      <option>Kitchen & Nutrition</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Staff ID</label>
                    <input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}
                      placeholder="e.g. STF-2026-001"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}
              {defaultRole === 'ADMIN' && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Administrative Role</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select...</option>
                    <option>Principal</option>
                    <option>Vice Principal (Academics)</option>
                    <option>Head of Department</option>
                    <option>Platform Administrator</option>
                    <option>Registrar</option>
                  </select>
                </div>
              )}
              {defaultRole === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Grade Level</label>
                    <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select grade...</option>
                      <option>JSS1</option><option>JSS2</option><option>JSS3</option>
                      <option>SHS1</option><option>SHS2</option><option>SHS3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">House Assignment</label>
                    <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Auto-assign</option>
                      <option>Blue House (Eagle)</option>
                      <option>Purple House (Phoenix)</option>
                      <option>Green House (Jaguar)</option>
                      <option>Red House (Falcon)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="bg-muted/20 border border-border rounded-xl p-3 text-xs text-muted-foreground">
                🔒 A temporary password will be auto-generated and emailed to the user. They'll be prompted to change it on first login.
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  Create Account
                </button>
                <button onClick={onClose} className="border border-border px-5 py-3 rounded-xl text-sm hover:bg-accent transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-xl">Account Created!</h4>
            <p className="text-sm text-muted-foreground">
              <strong>{form.name}</strong> has been added to {typeLabel}.<br />
              Login credentials have been sent to <strong>{form.email}</strong>.
            </p>
            <button onClick={onClose} className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors mt-2">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [userSubPage, setUserSubPage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState('');
  const [idCardUser, setIdCardUser] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCreateForType, setShowCreateForType] = useState(false);
  const [awardHouse, setAwardHouse] = useState<any>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [usersList, setUsersList] = useState(MOCK_USERS);
  const [coursesList, setCoursesList] = useState(MOCK_SUBJECTS);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  // Student class drill-down
  const [selectedClass, setSelectedClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedStream, setSelectedStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openClassDropdown, setOpenClassDropdown] = useState<string | null>(null); // which class card has dropdown open
  const [examsList, setExamsList] = useState(INITIAL_EXAMS);
  const [previewExam, setPreviewExam] = useState<any>(null);

  // Manage subjects drill-down state
  const [selectedSubjectClass, setSelectedSubjectClass] = useState<string | null>(null);
  const [selectedSubjectStream, setSelectedSubjectStream] = useState<string | null>(null);
  const [openSubjectClassDropdown, setOpenSubjectClassDropdown] = useState<string | null>(null);
  const [showSubjectsActionsDropdown, setShowSubjectsActionsDropdown] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [subjectsListState, setSubjectsListState] = useState(MOCK_SUBJECTS);
  const [selectedSubjectPreview, setSelectedSubjectPreview] = useState<any>(null);
  const [settingsTab, setSettingsTab] = useState<'general' | 'academic' | 'security' | 'database'>('general');

  React.useEffect(() => {
    if (activeSection !== 'users') {
      setUserSubPage(null); setSelectedUser(null);
      setSelectedClass(null); setSelectedStream(null); setOpenClassDropdown(null);
    }
    if (activeSection !== 'courses') {
      setSelectedSubjectClass(null); setSelectedSubjectStream(null); setOpenSubjectClassDropdown(null);
      setSelectedSubjectPreview(null);
      setShowSubjectsActionsDropdown(false);
    }
  }, [activeSection]);
  React.useEffect(() => {
    if (!userSubPage) {
      setSelectedUser(null);
      setSelectedClass(null); setSelectedStream(null); setOpenClassDropdown(null);
    }
  }, [userSubPage]);
  React.useEffect(() => {
    if (!selectedClass) { setSelectedStream(null); setOpenClassDropdown(null); }
  }, [selectedClass]);

  const filteredUsers = (role: string) =>
    usersList.filter(u => {
      const q = userSearch.toLowerCase();
      return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && u.role === role;
    });

  // SS student filter by class + stream
  const filteredSSStudents = MOCK_SS_STUDENTS.filter(s => {
    const q = userSearch.toLowerCase();
    const matchClass  = !selectedClass  || s.grade  === selectedClass;
    const matchStream = !selectedStream || s.stream === selectedStream;
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    return matchClass && matchStream && matchSearch;
  });

  const SS_CLASSES = [
    { label: 'SS 1', key: 'SS1', color: 'border-primary/30 bg-primary/5', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      sciCount: MOCK_SS_STUDENTS.filter(s => s.grade === 'SS1' && s.stream === 'Science').length,
      artCount: MOCK_SS_STUDENTS.filter(s => s.grade === 'SS1' && s.stream === 'Art').length },
    { label: 'SS 2', key: 'SS2', color: 'border-secondary/30 bg-secondary/5', iconBg: 'bg-secondary/10 text-secondary', accent: 'text-secondary',
      sciCount: MOCK_SS_STUDENTS.filter(s => s.grade === 'SS2' && s.stream === 'Science').length,
      artCount: MOCK_SS_STUDENTS.filter(s => s.grade === 'SS2' && s.stream === 'Art').length },
    { label: 'SS 3', key: 'SS3', color: 'border-muted-foreground/20 bg-muted/20', iconBg: 'bg-muted text-muted-foreground', accent: 'text-muted-foreground',
      sciCount: MOCK_SS_STUDENTS.filter(s => s.grade === 'SS3' && s.stream === 'Science').length,
      artCount: MOCK_SS_STUDENTS.filter(s => s.grade === 'SS3' && s.stream === 'Art').length },
  ];

  const filteredLogs = MOCK_AUDIT_LOGS.filter(l =>
    l.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(auditSearch.toLowerCase())
  );

  // Exam status filter — must live at component level (Rules of Hooks)
  const [examFilterStatus, setExamFilterStatus] = useState<string>('All');

  // ── User type definitions (FA icons) ──────────────────────
  const USER_TYPES = [
    {
      key: 'TEACHER',
      label: 'Teaching Staff',
      description: 'Subject teachers and class educators responsible for delivering Montessori curriculum.',
      Icon: FaChalkboardUser,
      color: 'border-emerald-200 bg-emerald-500/5',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      accentColor: 'text-emerald-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
      count: usersList.filter(u => u.role === 'TEACHER').length,
      formRole: 'TEACHER',
    },
    {
      key: 'STAFF',
      label: 'Non-Teaching Staff',
      description: 'Administrative assistants, security, librarians, kitchen & maintenance staff.',
      Icon: FaBriefcase,
      color: 'border-blue-200 bg-blue-500/5',
      iconBg: 'bg-blue-500/10 text-blue-600',
      accentColor: 'text-blue-600',
      badgeColor: 'bg-blue-500/10 text-blue-600',
      count: usersList.filter(u => u.role === 'PARENT').length,
      formRole: 'STAFF',
    },
    {
      key: 'ADMIN',
      label: 'Administrators',
      description: 'School principal, vice principals, heads of departments and platform administrators.',
      Icon: FaUserShield,
      color: 'border-rose-200 bg-rose-500/5',
      iconBg: 'bg-rose-500/10 text-rose-600',
      accentColor: 'text-rose-600',
      badgeColor: 'bg-rose-500/10 text-rose-600',
      count: usersList.filter(u => u.role === 'ADMIN').length,
      formRole: 'ADMIN',
    },
    {
      key: 'STUDENT',
      label: 'Students',
      description: 'All enrolled students across JSS1–JSS3 and SHS1–SHS3 Montessori programmes.',
      Icon: FaUserGraduate,
      color: 'border-purple-200 bg-purple-500/5',
      iconBg: 'bg-purple-500/10 text-purple-600',
      accentColor: 'text-purple-600',
      badgeColor: 'bg-purple-500/10 text-purple-600',
      count: usersList.filter(u => u.role === 'STUDENT').length,
      formRole: 'STUDENT',
    },
  ];

  const activeType = USER_TYPES.find(t => t.key === userSubPage);

  const renderSection = () => {
    // 1. OVERVIEW & ANALYTICS
    if (activeSection === 'overview' || activeSection === 'analytics') return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Registered Users" value={`${usersList.length}`} sub="4 Roles Active" icon={Users} color="bg-primary/10 text-primary" trend="up" />
          <MetricCard label="Active Courses" value={`${coursesList.length}`} sub="Montessori Secondary" icon={BookOpen} color="bg-emerald-500/10 text-emerald-600" trend="up" />
          <MetricCard label="Monthly Revenue" value="₦4.85M" sub="87.4% Collection Rate" icon={DollarSign} color="bg-amber-500/10 text-amber-600" trend="up" />
          <MetricCard label="System Uptime" value="99.98%" sub="All APIs Healthy" icon={Server} color="bg-blue-500/10 text-blue-600" trend="up" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif font-bold text-lg text-foreground">System Health</h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Online
              </span>
            </div>
            <SystemHealthBar label="Server CPU Load" value={18} unit="%" color="text-emerald-600" />
            <SystemHealthBar label="Memory Usage" value={51} unit="%" color="text-blue-600" />
            <SystemHealthBar label="API Latency" value={42} unit="ms" max={200} color="text-emerald-600" />
            <SystemHealthBar label="Error Rate" value={0.02} unit="%" max={5} color="text-emerald-600" />
          </div>

          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="font-serif font-bold text-lg text-foreground mb-4">Revenue & Fee Collection</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/5 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">₦125,000</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Monthly Collection</p>
                <p className="text-2xl font-serif font-bold text-blue-700 mt-1">₦4,850,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // 2. USER MANAGEMENT — Overview → Type List → Profile
    if (activeSection === 'users') {


      // ── LEVEL S1: Student class picker (SS1 / SS2 / SS3) ─────────
      if (userSubPage === 'STUDENT' && !selectedClass && !selectedUser) {
        return (
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => { setUserSubPage(null); setUserSearch(''); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Manage Users
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">Students — Select Class</span>
            </div>

            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">Senior Secondary Students</h2>
              <p className="text-xs text-muted-foreground mt-1">Click a class card, then choose a stream to view its student roster.</p>
            </div>

            {/* Summary bar */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-6 items-center">
              <div className="text-center">
                <p className="text-2xl font-serif font-bold text-foreground">{MOCK_SS_STUDENTS.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Students</p>
              </div>
              {SS_CLASSES.map(c => (
                <div key={c.key} className="text-center">
                  <p className={`text-xl font-serif font-bold ${c.accent}`}>{c.sciCount + c.artCount}</p>
                  <p className="text-[10px] text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Class Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {SS_CLASSES.map(cls => (
                <div key={cls.key} className="relative">
                  {/* Card */}
                  <button
                    onClick={() => setOpenClassDropdown(prev => prev === cls.key ? null : cls.key)}
                    className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${cls.color} ${openClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                        {cls.sciCount + cls.artCount} Students
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                    <div className="flex gap-4 text-xs mt-2">
                      <span className="text-muted-foreground">Science: <strong className={cls.accent}>{cls.sciCount}</strong></span>
                      <span className="text-muted-foreground">Art: <strong className={cls.accent}>{cls.artCount}</strong></span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                      <span>Select Stream</span>
                      <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>

                  {/* Stream Dropdown */}
                  {openClassDropdown === cls.key && (
                    <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                      <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Choose stream</p>
                      <button
                        onClick={() => { setSelectedClass(cls.key); setSelectedStream('Science'); setOpenClassDropdown(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                      >
                        <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <FlaskConical className="w-4 h-4" />
                        </span>
                        Science
                        <span className="ml-auto text-xs text-muted-foreground">{cls.sciCount} students</span>
                      </button>
                      <button
                        onClick={() => { setSelectedClass(cls.key); setSelectedStream('Art'); setOpenClassDropdown(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                      >
                        <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                          <Palette className="w-4 h-4" />
                        </span>
                        Art
                        <span className="ml-auto text-xs text-muted-foreground">{cls.artCount} students</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── LEVEL S2: Stream-filtered student list ─────────────────
      if (userSubPage === 'STUDENT' && selectedClass && selectedStream && !selectedUser) {
        const cls = SS_CLASSES.find(c => c.key === selectedClass)!;
        return (
          <div className="space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setUserSubPage(null); setUserSearch(''); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Manage Users
              </button>
              <span className="text-muted-foreground">/</span>
              <button onClick={() => { setSelectedClass(null); setSelectedStream(null); }}
                className="text-muted-foreground hover:text-foreground transition-colors">Students</button>
              <span className="text-muted-foreground">/</span>
              <button onClick={() => { setSelectedStream(null); setSelectedClass(null); setOpenClassDropdown(cls.key); }}
                className="text-muted-foreground hover:text-foreground transition-colors">{cls.label}</button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{selectedStream}</span>
            </div>

            {/* Header + toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{cls.label} — {selectedStream}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredSSStudents.length} students found</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search students..."
                  className="pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
              </div>
            </div>

            {/* Student table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">House</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Click to View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSSStudents.length > 0 ? filteredSSStudents.map(s => (
                    <tr key={s.id}
                      onClick={() => setSelectedUser(s)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${cls.iconBg}`}>
                            {s.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground font-mono">{s.studentId}</td>
                      <td className="py-4 px-4 text-muted-foreground">{s.house}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          View Profile <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No students found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // ── LEVEL 3: Individual Profile Page ──────────────────────
      if (userSubPage && activeType && selectedUser) {
        const u = selectedUser;
        const isTeacher = u.role === 'TEACHER';
        const isStudent = u.role === 'STUDENT';
        const isAdmin   = u.role === 'ADMIN';
        const isStaff   = u.role === 'PARENT'; // non-teaching staff mapped to PARENT

        return (
          <div className="space-y-6">
            {/* Breadcrumb back */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setUserSubPage(null); setSelectedUser(null); setSelectedClass(null); setSelectedStream(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Manage Users
              </button>
              <span className="text-muted-foreground">/</span>
              {/* For students: show class → stream breadcrumb; for others: show type label */}
              {isStudent && selectedClass && selectedStream ? (
                <>
                  <button onClick={() => { setSelectedClass(null); setSelectedStream(null); setSelectedUser(null); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">Students</button>
                  <span className="text-muted-foreground">/</span>
                  <button onClick={() => setSelectedUser(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    {selectedClass} · {selectedStream}
                  </button>
                </>
              ) : (
                <button onClick={() => setSelectedUser(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  {activeType.label}
                </button>
              )}
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{u.name}</span>
            </div>

            {/* Profile Hero */}
            <div className="bg-card rounded-2xl border border-border shadow-sm">
              <div className="h-24 bg-gradient-to-r from-primary/80 to-secondary/80 rounded-t-2xl" />
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
                  <div className={`w-20 h-20 rounded-2xl border-4 border-card font-bold text-2xl flex items-center justify-center shrink-0 shadow-md ${activeType.badgeColor}`}>
                    {u.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-serif font-bold text-foreground">{u.name}</h2>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        u.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                          : 'bg-rose-500/10 text-rose-600 border-rose-200'
                      }`}>{u.status}</span>
                    </div>
                    <p className={`text-xs font-semibold mt-0.5 ${activeType.accentColor}`}>
                      {isTeacher ? 'Teaching Staff' : isStudent ? `Student · ${u.grade}` : isAdmin ? (u.adminRole ?? 'Administrator') : (u.department ?? 'Non-Teaching Staff')}
                    </p>
                  </div>
                  {/* Actions dropdown — top-right of profile header */}
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsDropdown(prev => !prev)}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                    >
                      Actions
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20" fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {showActionsDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2">
                        {/* Universal */}
                        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                          <FaEnvelope className="w-3.5 h-3.5 text-primary" /> Send Message
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                          <FaKey className="w-3.5 h-3.5 text-muted-foreground" /> Reset Password
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                          <FaDownload className="w-3.5 h-3.5 text-muted-foreground" /> Export Profile
                        </button>

                        {/* Teacher-specific */}
                        {isTeacher && (
                          <>
                            <div className="my-1 border-t border-border" />
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaChartBar className="w-3.5 h-3.5 text-muted-foreground" /> View Performance
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaClipboardList className="w-3.5 h-3.5 text-muted-foreground" /> View Attendance Record
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaFileLines className="w-3.5 h-3.5 text-muted-foreground" /> Lesson Plans
                            </button>
                          </>
                        )}

                        {/* Student-specific */}
                        {isStudent && (
                          <>
                            <div className="my-1 border-t border-border" />
                            <button onClick={() => { setIdCardUser(u); setShowActionsDropdown(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaIdCard className="w-3.5 h-3.5 text-muted-foreground" /> Generate ID Card
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaChartBar className="w-3.5 h-3.5 text-muted-foreground" /> View Academic Report
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaUserCheck className="w-3.5 h-3.5 text-muted-foreground" /> Attendance History
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaMoneyBillWave className="w-3.5 h-3.5 text-muted-foreground" /> Fee Statement
                            </button>
                          </>
                        )}

                        {/* Staff-specific */}
                        {isStaff && (
                          <>
                            <div className="my-1 border-t border-border" />
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaMoneyBillWave className="w-3.5 h-3.5 text-muted-foreground" /> View Payslip
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaCalendarCheck className="w-3.5 h-3.5 text-muted-foreground" /> Attendance Log
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaPrint className="w-3.5 h-3.5 text-muted-foreground" /> Print Staff Card
                            </button>
                          </>
                        )}

                        {/* Admin-specific */}
                        {isAdmin && (
                          <>
                            <div className="my-1 border-t border-border" />
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaMoneyBillWave className="w-3.5 h-3.5 text-muted-foreground" /> View Payslip
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                              <FaBan className="w-3.5 h-3.5 text-rose-500" /> Suspend Account
                            </button>
                          </>
                        )}

                        {/* Edit + Delete */}
                        <div className="my-1 border-t border-border" />
                        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                          <FaPen className="w-3.5 h-3.5 text-muted-foreground" /> Edit Profile
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors text-left">
                          <FaTrash className="w-3.5 h-3.5" /> Delete Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Core Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-muted/30 text-muted-foreground mt-0.5">
                      <FaEnvelope className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                      <p className="text-sm font-semibold text-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-muted/30 text-muted-foreground mt-0.5">
                      <FaPhone className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Phone</p>
                      <p className="text-sm font-semibold text-foreground">{u.phone ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-muted/30 text-muted-foreground mt-0.5">
                      <FaLocationDot className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold text-foreground">{u.location ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-muted/30 text-muted-foreground mt-0.5">
                      <FaCalendarCheck className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Date Joined</p>
                      <p className="text-sm font-semibold text-foreground">{u.joined}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-muted/30 text-muted-foreground mt-0.5">
                      <FaClipboardList className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Last Login</p>
                      <p className="text-sm font-semibold text-foreground">{u.lastLogin}</p>
                    </div>
                  </div>
                  {/* Salary — for staff and teachers */}
                  {(isTeacher || isStaff || isAdmin) && u.salary && (
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 mt-0.5">
                        <FaMoneyBillWave className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Salary</p>
                        <p className="text-sm font-bold text-emerald-600">{u.salary}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Role-specific detail blocks ── */}
                {isTeacher && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-500/5 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaBookOpen className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase text-emerald-700">Subjects Taught</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(u.subjects ?? []).map((s: string) => (
                          <span key={s} className="text-[11px] bg-emerald-500/10 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg">{s}</span>
                        ))}
                        {!u.subjects?.length && <p className="text-xs text-muted-foreground">No subjects assigned</p>}
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaChalkboard className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase text-emerald-700">Classes Assigned</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(u.classes ?? []).map((c: string) => (
                          <span key={c} className="text-[11px] bg-emerald-500/10 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg">{c}</span>
                        ))}
                        {!u.classes?.length && <p className="text-xs text-muted-foreground">No classes assigned</p>}
                      </div>
                    </div>
                    {u.qualification && (
                      <div className="col-span-full bg-muted/20 border border-border rounded-xl p-4 flex items-start gap-3">
                        <FaGraduationCap className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Qualification</p>
                          <p className="text-sm text-foreground font-medium">{u.qualification}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isStudent && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-purple-500/5 border border-purple-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">Student ID</p>
                      <p className="text-sm font-bold text-foreground">{u.studentId ?? '—'}</p>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">Grade Level</p>
                      <p className="text-sm font-bold text-foreground">{u.grade ?? '—'}</p>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">House</p>
                      <p className="text-sm font-bold text-foreground">{u.house ?? '—'}</p>
                    </div>
                    {u.dob && (
                      <div className="bg-purple-500/5 border border-purple-100 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">Date of Birth</p>
                        <p className="text-sm font-bold text-foreground">{u.dob}</p>
                      </div>
                    )}
                  </div>
                )}

                {isStaff && u.department && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-500/5 border border-blue-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Department</p>
                      <p className="text-sm font-bold text-foreground">{u.department}</p>
                    </div>
                    {u.staffId && (
                      <div className="bg-blue-500/5 border border-blue-100 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Staff ID</p>
                        <p className="text-sm font-bold text-foreground">{u.staffId}</p>
                      </div>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-rose-500/5 border border-rose-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Administrative Designation</p>
                      <p className="text-sm font-bold text-foreground">{u.adminRole ?? u.department ?? 'Platform Administrator'}</p>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Access Scope</p>
                      <p className="text-sm font-bold text-foreground">Super Admin (Full Access)</p>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-100 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">System Audit Status</p>
                      <p className="text-sm font-bold text-emerald-600">2FA Verified 🟢</p>
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        );
      }

      // ── LEVEL 2: User type list (clickable rows) ───────────────
      if (userSubPage && activeType) {
        const usersForType = filteredUsers(activeType.key === 'STAFF' ? 'PARENT' : activeType.key);
        const TypeIcon = activeType.Icon;
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setUserSubPage(null); setUserSearch(''); }}
                className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${activeType.iconBg}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-foreground">{activeType.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeType.description}</p>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder={`Search ${activeType.label.toLowerCase()}...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={() => setShowBulkImport(true)}
                className="bg-secondary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-secondary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <Upload className="w-4 h-4" /> Bulk CSV
              </button>
              <button onClick={() => setShowCreateForType(true)}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Add {activeType.label.replace(/s$/, '')}
              </button>
            </div>

            {/* Clickable table — NO actions column */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Date Joined</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right text-[10px]">Click to View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersForType.length > 0 ? usersForType.map(u => (
                    <tr key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${activeType.badgeColor}`}>
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.phone ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-4 px-4 text-muted-foreground">{u.joined}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>{u.status}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          View Profile <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No {activeType.label.toLowerCase()} found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showCreateForType && activeType && (
              <CreateUserForTypeModal
                typeLabel={activeType.label}
                defaultRole={activeType.formRole}
                onClose={() => setShowCreateForType(false)}
                onCreated={(newUser: any) => {
                  setUsersList(prev => [...prev, { ...newUser, id: prev.length + 1, status: 'Active', joined: '2026-07-24', lastLogin: '2026-07-24', phone: '', location: '' }]);
                  setShowCreateForType(false);
                }}
              />
            )}
          </div>
        );
      }

      // ── LEVEL 1: Category overview cards ──────────────────────
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">Manage Users</h2>
            <p className="text-xs text-muted-foreground mt-1">Select a user category to view, manage, or create users.</p>
          </div>

          {/* Summary Bar */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex flex-wrap gap-8 items-center">
              <div className="text-center">
                <p className="text-3xl font-serif font-bold text-foreground">{usersList.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Registered</p>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              {USER_TYPES.map(t => {
                const TIcon = t.Icon;
                return (
                  <div key={t.key} className="text-center">
                    <p className={`text-2xl font-serif font-bold ${t.accentColor}`}>{t.count}</p>
                    <div className={`flex items-center gap-1 justify-center mt-0.5 text-[10px] font-semibold ${t.accentColor}`}>
                      <TIcon className="w-3 h-3" />
                      <span className="text-muted-foreground">{t.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {USER_TYPES.map(type => {
              const CIcon = type.Icon;
              return (
                <button key={type.key}
                  onClick={() => {
                    setUserSubPage(type.key);
                    setUserSearch('');
                    setSelectedClass(null);
                    setSelectedStream(null);
                    setOpenClassDropdown(null);
                  }}
                  className={`group text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${type.color}`}>
                  <div className="flex items-start justify-between mb-5">
                    <div className={`p-3 rounded-2xl ${type.iconBg}`}>
                      <CIcon className="w-7 h-7" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${type.badgeColor}`}>
                      {type.count} {type.count === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-foreground mb-1.5">{type.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{type.description}</p>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${type.accentColor}`}>
                    <span>Manage {type.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 3-EX. MANAGE EXAMS
    if (activeSection === 'exams') {
      const EXAM_STATUSES = ['Pending Approval', 'Approved', 'Ongoing', 'Completed', 'Cancelled', 'Rejected'] as const;
      type ExamStatus = typeof EXAM_STATUSES[number];

      const statusColor = (s: ExamStatus) => {
        switch (s) {
          case 'Pending Approval': return 'bg-amber-500/10 text-amber-600 border-amber-200';
          case 'Approved':         return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
          case 'Ongoing':          return 'bg-secondary/10 text-secondary border-secondary/20';
          case 'Completed':        return 'bg-muted text-muted-foreground border-border';
          case 'Cancelled':        return 'bg-rose-500/10 text-rose-600 border-rose-200';
          case 'Rejected':         return 'bg-red-500/10 text-red-600 border-red-200';
        }
      };

      const handleApprove = (id: number) => {
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
      };

      const handleReject = (id: number) => {
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
      };

      const handleCancel = (id: number) => {
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Cancelled' } : e));
      };

      const examSearch = userSearch;

      const visibleExams = examsList.filter(e => {
        const q = examSearch.toLowerCase();
        const matchSearch = !q || e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.class.toLowerCase().includes(q);
        const matchStatus = examFilterStatus === 'All' || e.status === examFilterStatus;
        return matchSearch && matchStatus;
      });

      const counts = {
        total:     examsList.length,
        pending:   examsList.filter(e => e.status === 'Pending Approval').length,
        approved:  examsList.filter(e => e.status === 'Approved').length,
        ongoing:   examsList.filter(e => e.status === 'Ongoing').length,
        completed: examsList.filter(e => e.status === 'Completed').length,
      };

      return (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">Manage Exams</h2>
              <p className="text-xs text-muted-foreground mt-1">Oversee, approve, and schedule senior secondary examinations.</p>
            </div>
            <button
              onClick={() => {
                const newId = examsList.length + 1;
                setExamsList(prev => [
                  ...prev,
                  {
                    id: newId,
                    title: 'New Custom SS Examination',
                    subject: 'General Science',
                    class: 'SS2',
                    stream: 'Science',
                    date: '2026-08-15',
                    time: '09:00',
                    duration: '2.5hrs',
                    venue: 'Hall C',
                    status: 'Pending Approval',
                    invigilator: 'Mr. Okonkwo Paul',
                    totalCandidates: 6
                  }
                ]);
              }}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Request New Exam
            </button>
          </div>

          {/* Pending Approval Warning Alert */}
          {counts.pending > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Action Required: Pending Approvals</h4>
                <p className="text-xs text-amber-700 mt-0.5">There are {counts.pending} exam schedules waiting for your review. Please approve or reject them below.</p>
              </div>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total Exams',   value: counts.total,     icon: ClipboardList, color: 'bg-muted/40 text-muted-foreground' },
              { label: 'Pending Appr.', value: counts.pending,   icon: Clock,         color: 'bg-amber-500/10 text-amber-600' },
              { label: 'Approved',      value: counts.approved,  icon: CheckCircle2,  color: 'bg-emerald-500/10 text-emerald-600' },
              { label: 'Ongoing',       value: counts.ongoing,   icon: RefreshCw,     color: 'bg-secondary/10 text-secondary' },
              { label: 'Completed',     value: counts.completed, icon: CheckCircle2,  color: 'bg-muted text-muted-foreground' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter + Search Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by exam title, subject or class..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', 'Pending Approval', 'Approved', 'Ongoing', 'Completed', 'Cancelled', 'Rejected'].map(s => (
                <button key={s} onClick={() => setExamFilterStatus(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    examFilterStatus === s
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/40'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleExams.length > 0 ? visibleExams.map(exam => (
              <div key={exam.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-foreground text-sm leading-snug">{exam.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.subject}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor(exam.status)}`}>
                    {exam.status}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{exam.date} · {exam.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{exam.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{exam.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{exam.totalCandidates} Candidates</span>
                  </div>
                </div>

                {/* Class & Stream tags */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{exam.class}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    exam.stream === 'Science' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                  }`}>{exam.stream}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">Invigilator: <strong className="text-foreground">{exam.invigilator}</strong></span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  {exam.status === 'Pending Approval' ? (
                    <>
                      <button
                        onClick={() => handleApprove(exam.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Exam
                      </button>
                      <button
                        onClick={() => handleReject(exam.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => setPreviewExam(exam)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-border hover:bg-muted/40 transition-colors text-foreground ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> Preview
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setPreviewExam(exam)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-border hover:bg-muted/40 transition-colors text-foreground"
                      >
                        <FileText className="w-3.5 h-3.5" /> Preview Exam
                      </button>
                      {exam.status === 'Approved' && (
                        <>
                          <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-border hover:bg-muted/40 transition-colors text-foreground">
                            <Settings className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleCancel(exam.id)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200 hover:bg-rose-500/20 transition-colors ml-auto"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
                      )}
                      {exam.status === 'Completed' && (
                        <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors">
                          <BarChart2 className="w-3.5 h-3.5" /> Results
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-2 py-16 text-center bg-card rounded-2xl border border-border">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No exams match your search or filter.</p>
              </div>
            )}
          </div>

          {/* Upcoming Exam Schedule Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-serif font-bold text-foreground">Upcoming Exam Schedule</h3>
              <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Exam Title</th>
                    <th className="py-3 px-4">Class · Stream</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">Candidates</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {examsList.filter(e => e.status === 'Approved' || e.status === 'Ongoing' || e.status === 'Pending Approval').map(e => (
                    <tr key={e.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{e.title}</p>
                        <p className="text-muted-foreground text-[10px]">{e.subject}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-primary">{e.class}</span>
                        <span className="text-muted-foreground"> · {e.stream}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{e.date}<br />{e.time}</td>
                      <td className="py-3 px-4 text-muted-foreground">{e.venue}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{e.totalCandidates}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(e.status as ExamStatus)}`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 3. MANAGE SUBJECTS
    if (activeSection === 'courses') {
      const cls = selectedSubjectClass ? SS_CLASSES.find(c => c.key === selectedSubjectClass) : null;
      const filteredSubjects = subjectsListState.filter(s => {
        const q = userSearch.toLowerCase();
        const matchClass = !selectedSubjectClass || s.grade === selectedSubjectClass;
        const matchStream = !selectedSubjectStream || s.stream === selectedSubjectStream;
        const matchSearch = !q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
        return matchClass && matchStream && matchSearch;
      });

      // Level 1: select class (SS1-SS3)
      if (!selectedSubjectClass) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">Manage Subjects</h2>
                <p className="text-xs text-muted-foreground mt-1">Select a class card, then choose a stream to view its subjects.</p>
              </div>
              
              {/* Subjects Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectsActionsDropdown(prev => !prev)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                >
                  Actions
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showSubjectsActionsDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showSubjectsActionsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2">
                    <button onClick={() => { setShowCreateSubjectModal(true); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <Plus className="w-3.5 h-3.5 text-primary" /> Add Subject
                    </button>
                    <button onClick={() => { alert('Exporting curriculum as PDF...'); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Export Curriculum
                    </button>
                    <button onClick={() => { alert('Assigning teacher to subject...'); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" /> Assign Teacher
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Class Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {SS_CLASSES.map(cls => {
                const sciCount = subjectsListState.filter(s => s.grade === cls.key && s.stream === 'Science').length;
                const artCount = subjectsListState.filter(s => s.grade === cls.key && s.stream === 'Art').length;

                return (
                  <div key={cls.key} className="relative">
                    <button
                      onClick={() => setOpenSubjectClassDropdown(prev => prev === cls.key ? null : cls.key)}
                      className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${cls.color} ${openSubjectClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                          {sciCount + artCount} Subjects
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                      <div className="flex gap-4 text-xs mt-2">
                        <span className="text-muted-foreground">Science: <strong className={cls.accent}>{sciCount}</strong></span>
                        <span className="text-muted-foreground">Art: <strong className={cls.accent}>{artCount}</strong></span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                        <span>Select Stream</span>
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openSubjectClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>

                    {/* Stream dropdown */}
                    {openSubjectClassDropdown === cls.key && (
                      <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                        <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Choose stream</p>
                        <button
                          onClick={() => { setSelectedSubjectClass(cls.key); setSelectedSubjectStream('Science'); setOpenSubjectClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FlaskConical className="w-4 h-4" />
                          </span>
                          Science
                          <span className="ml-auto text-xs text-muted-foreground">{sciCount} subjects</span>
                        </button>
                        <button
                          onClick={() => { setSelectedSubjectClass(cls.key); setSelectedSubjectStream('Art'); setOpenSubjectClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <Palette className="w-4 h-4" />
                          </span>
                          Art
                          <span className="ml-auto text-xs text-muted-foreground">{artCount} subjects</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Level 3: Preview Subject's Scheme of Work
      if (selectedSubjectClass && selectedSubjectStream && selectedSubjectPreview) {
        const sub = selectedSubjectPreview;
        const schemeOfWork = [
          { week: 1, topic: 'Introduction & Curriculum Review', objectives: 'Foundational review, term syllabus guidelines, and course references.' },
          { week: 2, topic: 'Core Concepts & Theories', objectives: 'Examine primary formulas, historical milestones, and fundamental rules.' },
          { week: 3, topic: 'Practical Lab Sessions & Observations', objectives: 'Hands-on experiments with physical materials, and observational logging.' },
          { week: 4, topic: 'Group Project Discussion', objectives: 'Define research groups, select study topics, and register assignments.' },
          { week: 5, topic: 'Mid-term Revision & Quiz', objectives: 'Interactive quiz based on topics taught in weeks 1-4.' },
          { week: 6, topic: 'Advanced Methodology & Case Studies', objectives: 'Examine practical scenarios, identify limits, and propose optimizations.' },
          { week: 7, topic: 'Collaborative Problem Solving', objectives: 'Apply theoretical learnings to solve real-world industry case files.' },
          { week: 8, topic: 'Review of Assignments & Projects', objectives: 'Evaluation of group projects, peer assessment, and tutor feedback.' },
          { week: 9, topic: 'Final Examination Preparations', objectives: 'Exam outlines, past question drills, and exam rules review.' },
          { week: 10, topic: 'End of Term Assessment', objectives: 'Written and practical final evaluations for grading.' },
        ];

        return (
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setSelectedSubjectClass(null); setSelectedSubjectStream(null); setSelectedSubjectPreview(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Manage Subjects
              </button>
              <span className="text-muted-foreground">/</span>
              <button onClick={() => { setSelectedSubjectPreview(null); }}
                className="text-muted-foreground hover:text-foreground transition-colors">{cls?.label} ({selectedSubjectStream})</button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{sub.title}</span>
            </div>

            {/* Header info */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg font-mono">{sub.code}</span>
                  <h2 className="text-xl font-serif font-bold text-foreground mt-2">{sub.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">Instructor: <span className="text-foreground font-semibold">{sub.teacher}</span> · Enrolled: <span className="text-foreground font-semibold">{sub.enrolled} Students</span></p>
                </div>
                <button
                  onClick={() => setSelectedSubjectPreview(null)}
                  className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Subjects
                </button>
              </div>
            </div>

            {/* Scheme of Work List */}
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" /> Scheme of Work (Term 2)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Timeline layout of topics and objectives scheduled per week.</p>
              </div>

              <div className="space-y-3">
                {schemeOfWork.map((item, idx) => (
                  <div key={item.week} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      idx < 5 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                    }`}>
                      Wk {item.week}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-sm text-foreground">{item.topic}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          idx < 5 ? 'bg-emerald-500/5 text-emerald-600 border-emerald-200' : 'bg-amber-500/5 text-amber-600 border-amber-200'
                        }`}>
                          {idx < 5 ? 'Completed' : 'Scheduled'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.objectives}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // Level 2: List subjects for class + stream
      return (
        <div className="space-y-5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button onClick={() => { setSelectedSubjectClass(null); setSelectedSubjectStream(null); }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Manage Subjects
            </button>
            <span className="text-muted-foreground">/</span>
            <button onClick={() => { setSelectedSubjectStream(null); setOpenSubjectClassDropdown(cls.key); }}
              className="text-muted-foreground hover:text-foreground transition-colors">{cls.label}</button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{selectedSubjectStream} Stream</span>
          </div>

          {/* Header + Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{cls.label} — {selectedSubjectStream} Subjects</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredSubjects.length} subjects available</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Subjects Actions Dropdown on Listing */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectsActionsDropdown(prev => !prev)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                >
                  Actions
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showSubjectsActionsDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showSubjectsActionsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2">
                    <button onClick={() => { setShowCreateSubjectModal(true); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <Plus className="w-3.5 h-3.5 text-primary" /> Add Subject
                    </button>
                    <button onClick={() => { alert('Exporting list as CSV...'); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Export to CSV
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search subjects..."
                  className="pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
              </div>
            </div>
          </div>

          {/* Subjects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.length > 0 ? filteredSubjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectPreview(sub)}
                className="group text-left bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 hover:border-primary/40 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{sub.code}</span>
                  <span className="text-xs text-muted-foreground font-medium">{sub.category}</span>
                </div>
                <h3 className="font-serif font-bold text-foreground text-base group-hover:text-primary transition-colors">{sub.title}</h3>
                <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs w-full">
                  <p className="text-muted-foreground">Instructor: <strong className="text-foreground">{sub.teacher}</strong></p>
                  <p className="text-muted-foreground"><strong className="text-foreground">{sub.enrolled}</strong> Enrolled</p>
                </div>
              </button>
            )) : (
              <div className="col-span-2 py-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No subjects found.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. SCHOOL OPERATIONS
    if (activeSection === 'operations') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">School Operations</h2>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <p className="text-xs text-muted-foreground">Manage term schedules, academic years, and school facilities.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-border rounded-xl bg-muted/10"><p className="font-bold text-foreground">Current Term</p><p className="text-muted-foreground">Term 2 · 2025/2026</p></div>
            <div className="p-3 border border-border rounded-xl bg-muted/10"><p className="font-bold text-foreground">Total Classrooms</p><p className="text-muted-foreground">12 Active Spaces</p></div>
          </div>
        </div>
      </div>
    );

    // 5. HOUSE POINTS
    if (activeSection === 'houses') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">House System Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_HOUSES.map((h, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-foreground text-base">{h.name}</h3>
                <p className="text-xs text-muted-foreground">{h.points} Points · {h.head}</p>
              </div>
              <button onClick={() => setAwardHouse(h)} className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors">
                + Points
              </button>
            </div>
          ))}
        </div>
      </div>
    );

    // 6. AUDIT LOGS
    if (activeSection === 'logs') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">System Audit Logs</h2>
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map(l => (
                <tr key={l.id}>
                  <td className="py-3 px-4 font-bold text-foreground">{l.user}</td>
                  <td className="py-3 px-4 font-mono">{l.action}</td>
                  <td className="py-3 px-4 text-muted-foreground">{l.target}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{l.ip}</td>
                  <td className="py-3 px-4"><span className={`font-bold ${l.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    // 7. SYSTEM SETTINGS
    if (activeSection === 'settings') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">System Configuration & Settings</h2>
            <p className="text-xs text-muted-foreground mt-1">Manage global school parameters, academic calendars, security rules, and system maintenance.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border gap-2 overflow-x-auto pb-px text-xs font-bold">
            {[
              { id: 'general',  label: 'General Info',     icon: Building2 },
              { id: 'academic', label: 'Academic & Terms', icon: GraduationCap },
              { id: 'security', label: 'Security Rules',   icon: Shield },
              { id: 'database', label: 'Database & API',   icon: Server },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    settingsTab === tab.id
                      ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-t-xl'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: General Info */}
          {settingsTab === 'general' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">School Identity & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">School Name</label>
                  <input type="text" defaultValue="Tarepet Montessori School" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">School Motto</label>
                  <input type="text" defaultValue="Excellence Through Observation & Character" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Official Contact Email</label>
                  <input type="email" defaultValue="info@tarepet.edu.ng" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Portal System Address</label>
                  <input type="text" defaultValue="https://portal.tarepet.edu.ng" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => alert('General settings updated successfully!')} className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                  Save General Info
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Academic & Terms */}
          {settingsTab === 'academic' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">Current Academic Calendar & Grading</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Current Academic Session</label>
                  <select defaultValue="2025/2026" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026 (Active)</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Current Term</label>
                  <select defaultValue="Term 2" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Term 1">First Term</option>
                    <option value="Term 2">Second Term (Active)</option>
                    <option value="Term 3">Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Pass Mark Threshold</label>
                  <input type="text" defaultValue="50%" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider text-[10px]">Grading Scale Parameters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 border border-border rounded-xl bg-emerald-500/5 border-emerald-200"><p className="font-bold text-emerald-700">Grade A (Distinction)</p><p className="text-muted-foreground text-[10px]">75% - 100%</p></div>
                  <div className="p-3 border border-border rounded-xl bg-blue-500/5 border-blue-200"><p className="font-bold text-blue-700">Grade B (Credit)</p><p className="text-muted-foreground text-[10px]">65% - 74%</p></div>
                  <div className="p-3 border border-border rounded-xl bg-amber-500/5 border-amber-200"><p className="font-bold text-amber-700">Grade C (Pass)</p><p className="text-muted-foreground text-[10px]">50% - 64%</p></div>
                  <div className="p-3 border border-border rounded-xl bg-rose-500/5 border-rose-200"><p className="font-bold text-rose-700">Grade F (Fail)</p><p className="text-muted-foreground text-[10px]">0% - 49%</p></div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => alert('Academic calendar settings updated!')} className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                  Save Academic Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Security Rules */}
          {settingsTab === 'security' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">Authentication & Access Policies</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                  <div>
                    <p className="font-bold text-foreground">JWT Token Refresh Rotation</p>
                    <p className="text-muted-foreground text-[11px]">Rotates refresh tokens on every access token renewal to prevent replay attacks.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">Enforced</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                  <div>
                    <p className="font-bold text-foreground">Administrator Two-Factor Authentication (2FA)</p>
                    <p className="text-muted-foreground text-[11px]">Requires TOTP authenticator code for all admin login sessions.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">Active</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                  <div>
                    <p className="font-bold text-foreground">Max Login Attempt Throttling</p>
                    <p className="text-muted-foreground text-[11px]">Locks account after 5 consecutive failed login attempts for 15 minutes.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">5 Attempts</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Database & API */}
          {settingsTab === 'database' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">Database Health & Infrastructure</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-1">
                  <p className="text-muted-foreground font-semibold uppercase text-[10px]">Database Connection</p>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> PostgreSQL (Production Ready)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Host: db.internal.tarepet.edu.ng · Port 5432</p>
                </div>
                <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-1">
                  <p className="text-muted-foreground font-semibold uppercase text-[10px]">Automated Backups</p>
                  <p className="text-sm font-bold text-foreground">Scheduled Daily at 02:00 AM UTC</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Retention Policy: 30 days stored on encrypted cloud S3</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-border">
                <span className="text-xs text-muted-foreground font-mono">System API Version: v1.2.4-stable</span>
                <button onClick={() => alert('Database backup initiated. Snapshot queued!')} className="bg-secondary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Trigger Manual Backup
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <PortalLayout title="Admin Control Center" activeSection={activeSection} onNavigate={setActiveSection}>
        {idCardUser && <StudentIDModal student={idCardUser} onClose={() => setIdCardUser(null)} />}
        {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}
        {awardHouse && <AwardPointsModal house={awardHouse} onClose={() => setAwardHouse(null)} />}
        {previewExam && <ExamPreviewModal exam={previewExam} onClose={() => setPreviewExam(null)} />}
        {showCreateSubjectModal && (
          <CreateSubjectModal
            defaultClass={selectedSubjectClass || undefined}
            defaultStream={selectedSubjectStream || undefined}
            onClose={() => setShowCreateSubjectModal(false)}
            onCreated={(newSub) => {
              setSubjectsListState(prev => [...prev, { ...newSub, id: prev.length + 1 }]);
              setShowCreateSubjectModal(false);
            }}
          />
        )}
        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
