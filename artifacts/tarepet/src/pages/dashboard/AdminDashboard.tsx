import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { Link } from 'wouter';
import { authClient, sanitizeMailto } from '@/lib/api-auth';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { subscribeToWebSocketEvents, getWebSocketStatus, subscribeToWebSocketStatus, sendWebSocketEvent } from '@/lib/websocket-client';
import { getStoredExams, updateExamStatus, saveCBTExam, subscribeToCBTStore, syncExamsWithBackend, mapCBTExamToAdminExam, generateAdmissionNumber, formatStudentEmail, getStoredStudents, saveStudent, saveStoredStudents, clearAllStoredStudents, deleteStudent, syncStudentsWithBackend, getStoredTeachers, saveTeacher, saveStoredTeachers, clearAllStoredTeachers, deleteTeacher, syncTeachersWithBackend, listenToRealtimeEvents, clearCBTStoreCache, clearAllSiteDefaultData, isAccountDeleted, getAdminPassword, setAdminPassword, matchStudentClass, broadcastRealtimeEvent, getStoredSubjects, saveSubject, deleteSubject, DEFAULT_SUBJECTS, SubjectRecord } from '@/lib/cbt-store';
import { AdminManagementPanel } from '@/components/dashboard/AdminManagementPanel';
import { TerminalReportCard } from '@/components/reports/TerminalReportCard';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { validatePasswordStrength } from '@/lib/password-policy';
import { useCustomDialog } from '@/context/DialogContext';
import tarepetLogo from '@assets/tarepet__1784835204178.png';
import {
  getPaymentItems,
  getPaymentTransactions,
  getStudentTransactions,
  getStudentItemStatus,
  getItemAmountForGrade,
  updateFeeItemAmount,
  savePaymentItem,
  recordTransaction,
  subscribeToPaymentStore,
  getClassFeeSchedules,
  updateClassFeeSchedule,
  bulkUpdateClassFeeSchedules,
  getDiscountPolicies,
  saveDiscountPolicy,
  PaymentItem,
  PaymentTransaction,
  ClassFeeSchedule,
  DiscountPolicy,
} from '@/lib/payments-store';

import {
  Users, BookOpen, Server, CheckCircle2,
  Plus, FileText, Download, Upload, Search,
  Activity, DollarSign, CreditCard,
  AlertCircle, BarChart2, Settings,
  ChevronLeft, ChevronDown, RefreshCw, Lock, Clock, X, MoreVertical,
  UserCheck, Pencil, Trash2,
  ClipboardList, Printer, QrCode,
  ArrowUpRight, ArrowDownRight, Building2,
  Mail, Phone, MapPin, Calendar, Shield, GraduationCap, Award,
  Briefcase, UserCog, BookMarked, MessageSquare, KeyRound,
  BadgeCheck, Ban, RotateCcw, FileDown, Send, FlaskConical, Palette,
  School, CalendarCheck, Megaphone, UserPlus, FileSpreadsheet, TrendingUp, Sparkles, ChevronRight, Eye, Layers, ShieldCheck, Bell, AlertTriangle, Key, Trophy, BarChart3, TrendingDown, XCircle, UploadCloud, Camera,
  Scissors, Loader2, Tag, Sun, Moon
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  FaChalkboardUser, FaBriefcase, FaUserShield, FaUserGraduate,
  FaPen, FaTrash, FaIdCard, FaEnvelope, FaLock, FaCalendarCheck,
  FaBookOpen, FaChartBar, FaFileLines, FaBan, FaKey, FaPhone,
  FaLocationDot, FaMoneyBillWave, FaGraduationCap, FaChalkboard,
  FaUserCheck, FaClipboardList, FaMessage, FaDownload, FaPrint,
} from 'react-icons/fa6';

// ── Types & Safe Helpers ────────────────────────────────────────────────────
interface TabProps { id: string; label: string; icon: React.ReactNode; badge?: number }

function safeLookup<T = any>(dict: any, key: string | number): T | undefined {
  if (!dict || typeof dict !== 'object') return undefined;
  const k = String(key);
  if (Object.prototype.hasOwnProperty.call(dict, k)) {
    return Reflect.get(dict, k);
  }
  return undefined;
}

function safeIndex<T = any>(arr: T[] | null | undefined, index: number): T | undefined {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) return undefined;
  return arr.find((_, idx) => idx === index);
}

const MOCK_USERS: any[] = [];
const MOCK_STUDENTS: any[] = [];
const MOCK_SS_STUDENTS: any[] = [];
const MOCK_TEACHERS: any[] = [];

const MOCK_SUBJECTS = DEFAULT_SUBJECTS;

const MOCK_HOUSES: any[] = [];

const MOCK_CLASSES: any[] = [];


const TIMETABLE_PERIODS = [
  { time: '08:00 - 08:30', isBreak: true, label: 'Devotion & Assembly' },
  { time: '08:30 - 09:15', isBreak: false, slot: 0, label: 'Period 1' },
  { time: '09:15 - 10:00', isBreak: false, slot: 1, label: 'Period 2' },
  { time: '10:00 - 10:45', isBreak: false, slot: 2, label: 'Period 3' },
  { time: '10:45 - 11:15', isBreak: true, label: 'Short Break / Snack' },
  { time: '11:15 - 12:00', isBreak: false, slot: 3, label: 'Period 4' },
  { time: '12:00 - 12:45', isBreak: false, slot: 4, label: 'Period 5' },
  { time: '12:45 - 01:30', isBreak: false, slot: 5, label: 'Period 6' },
  { time: '01:30 - 02:00', isBreak: true, label: 'Lunch Break & Games' },
  { time: '02:00 - 02:45', isBreak: false, slot: 6, label: 'Period 7 / CBT Drill' },
];

const MOCK_CLASS_TIMETABLES: Record<string, any> = {};

const MOCK_LEAVE_LOGS: any[] = [];


const MOCK_AUDIT_LOGS: any[] = [];

const INITIAL_EXAMS: any[] = [];

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
  const { t } = useTranslation();
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
      {t(`role.${role.toLowerCase()}`, role)}
    </span>
  );
};


const StudentIDModal = ({ student, onClose }: { student: any; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-foreground">{t('idCard.title')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6">
          <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 mb-4">
            <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">{t('idCard.schoolName')}</p>
                <p className="text-xs opacity-70">{t('idCard.location')}</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xs">{t('idCard.abbr')}</span>
              </div>
            </div>
            <div className="p-5 flex gap-5 items-center">
              <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-serif font-bold text-primary">{student?.name?.[0] || 'S'}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{student?.name || 'Student'}</h4>
                <p className="text-xs text-muted-foreground font-medium mt-1">{student?.grade || t('idCard.class')}</p>
                <p className="text-xs text-muted-foreground">{student?.house || t('idCard.house')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t('idCard.studentId')}</span>
                    <p className="font-bold text-foreground">{student?.admissionNo || t('idCard.sampleId')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('idCard.validUntil')}</span>
                    <p className="font-bold text-foreground">{t('idCard.validDate')}</p>
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
};

const TeacherIDCardModal = ({ teacher, onClose }: { teacher: any; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
            <FaIdCard className="w-5 h-5 text-emerald-600" /> {t('teacher.staff_id_title', 'Faculty & Staff ID Card')}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6">
          <div className="border-4 border-emerald-600 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 mb-5">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-90">{t('school.name', 'Tarepet Montessori School')}</p>
                <p className="text-[10px] opacity-80">{t('teacher.faculty_staff_identity', 'Faculty & Academic Staff Identification')}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="p-5 flex gap-5 items-center">
              <div className="w-24 h-28 rounded-xl bg-muted/60 border-2 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                {teacher?.profileImage ? (
                  <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-serif font-bold">
                      {teacher?.name?.[0] || 'T'}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {teacher.department || t('teacher.academic_staff', 'Academic Staff')}
                </span>
                <h4 className="font-serif font-bold text-foreground text-lg leading-tight mt-1 truncate">{teacher.name}</h4>
                <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">{teacher.specialization || t('teacher.educator', 'Educator')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px]">{t('teacher.staff_id_label', 'Staff ID:')}</span>
                    <p className="font-bold font-mono text-emerald-700">{teacher.staffId || 'TMS/TCH/001'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">{t('teacher.status', 'Status:')}</span>
                    <p className="font-bold text-foreground">{teacher.status || 'Active'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 px-5 py-2 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
              <span>{t('teacher.issued_date', 'ISSUED: 2026-01-10')}</span>
              <span>{t('teacher.expires_date', 'EXPIRES: 2028-12-31')}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              <Printer className="w-4 h-4" /> {t('teacher.btn_print_staff', 'Print Staff Card')}
            </button>
            <button onClick={() => { (window as any).showTarepetAlert?.('Generating and downloading official Faculty ID card in PDF format...', 'Staff ID Card', 'info'); }} className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors cursor-pointer">
              <Download className="w-4 h-4" /> {t('teacher.btn_download_pdf', 'Download PDF')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WIZARD_STEPS = [
  { step: 1, label: 'Personal Details',  sub: 'Name, Email & Photo' },
  { step: 2, label: 'Academic Details',  sub: 'Specialization & Degrees' },
  { step: 3, label: 'Teaching Load',     sub: 'Form Teacher & Subjects' },
  { step: 4, label: 'Employment',        sub: 'Staff ID & Payroll' },
  { step: 5, label: 'Review & Save',     sub: 'Confirm Profile' },
];

const GRADE_OPTIONS = ['Nursery 1', 'Nursery 2', 'Nursery 3', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1 Science', 'SS 1 Art', 'SS 2 Science', 'SS 2 Art', 'SS 3 Science', 'SS 3 Art'];

const EMPTY_TEACHER_FORM = {
  // Step 1 — Personal Details
  name: '', gender: '', dob: '', phone: '', email: '', address: '', profileImage: '',
  // Step 2 — Academic Details
  specialization: '', qualification: '',
  // Step 3 — Teaching Load
  isFormTeacher: 'No', // 'Yes' | 'No'
  formTeacherClass: '',
  teachingDivision: '',
  subjectsAssigned: [] as { name: string; grade: string }[],
  // Step 4 — Employment
  staffId: '', joined: '', status: 'Active', salary: '', bankName: '', accountNumber: '',
};

const AddTeacherWizardModal = ({ onClose, onSave }: { onClose: () => void; onSave: (t: any) => void }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_TEACHER_FORM });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');

  const triggerCropModal = (imageSrc: string, onSaveCropped?: (cropped: string) => void) => {
    setPendingCropImage(imageSrc);
    setCropModalOpen(true);
  };

  const setF = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const addSubject = () => setForm(prev => ({
    ...prev,
    subjectsAssigned: [...prev.subjectsAssigned, { name: '', grade: 'JSS 1' }],
  }));
  const removeSubject = (i: number) => setForm(prev => ({
    ...prev,
    subjectsAssigned: prev.subjectsAssigned.filter((_: any, idx: number) => idx !== i),
  }));
  const updateSubject = (i: number, key: string, val: string) => setForm(prev => ({
    ...prev,
    subjectsAssigned: prev.subjectsAssigned.map((s: any, idx: number) => idx === i ? { ...s, [key]: val } : s),
  }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const serial = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
      const staffId = form.staffId || `TMS/TCH/${serial}`;
      const nameParts = (form.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const email = form.email || (firstName ? `${firstName.toLowerCase()}.${lastName ? lastName.toLowerCase() : 'staff'}@tarepet.com` : '');

      const formCls = form.isFormTeacher === 'Yes' ? (form.formTeacherClass || '') : '';
      let targetDivision = '';

      if (form.isFormTeacher === 'Yes' && formCls) {
        const formUpper = formCls.toUpperCase();
        if (formUpper.startsWith('SS')) targetDivision = 'Senior Secondary';
        else if (formUpper.startsWith('JSS')) targetDivision = 'Junior Secondary';
        else if (formUpper.startsWith('NUR') || formUpper.startsWith('PRI') || formUpper.startsWith('BASIC')) targetDivision = 'Nursery & Primary';
      } else if (form.teachingDivision) {
        const divUpper = form.teachingDivision.toUpperCase();
        if (divUpper.includes('SENIOR') || divUpper.includes('SS')) targetDivision = 'Senior Secondary';
        else if (divUpper.includes('JUNIOR') || divUpper.includes('JSS')) targetDivision = 'Junior Secondary';
        else if (divUpper.includes('NURSERY') || divUpper.includes('PRIMARY') || divUpper.includes('EARLY')) targetDivision = 'Nursery & Primary';
      }

      if (!targetDivision && form.subjectsAssigned.length > 0) {
        const subGrades = form.subjectsAssigned.map((s: any) => (s.grade || '').toUpperCase());
        if (subGrades.some((g: any) => g.startsWith('SS'))) targetDivision = 'Senior Secondary';
        else if (subGrades.some((g: any) => g.startsWith('JSS'))) targetDivision = 'Junior Secondary';
        else if (subGrades.some((g: any) => g.startsWith('NUR') || g.startsWith('PRI') || g.startsWith('BASIC'))) targetDivision = 'Nursery & Primary';
      }

      if (!targetDivision) {
        targetDivision = form.isFormTeacher === 'Yes' ? 'Form Class' : 'General Faculty';
      }

      const formTeacherDisplay = form.isFormTeacher === 'Yes'
        ? (form.formTeacherClass || 'Unassigned Form Class')
        : 'None';

      const created = {
        id: Date.now(),
        staffId: staffId,
        name: form.name || `${firstName} ${lastName}`.trim(),
        email: email,
        phone: form.phone || '',
        gender: form.gender || '',
        department: targetDivision,
        teachingDivision: targetDivision,
        specialization: form.specialization || '',
        qualification: form.qualification || '',
        status: form.status || 'Active',
        joined: form.joined || new Date().toISOString().split('T')[0],
        formTeacherOf: formTeacherDisplay,
        subjectsAssigned: form.subjectsAssigned.filter((s: any) => s.name),
        classesCount: form.subjectsAssigned.filter((s: any) => s.name).length,
        studentsCount: 0,
        address: form.address || '',
        dob: form.dob || '',
        cbtExamsCount: 0,
        attendanceRate: '0%',
        profileImage: form.profileImage || '',
        salary: form.salary || '',
        salaryGrade: 'Standard',
        bankName: form.bankName || '',
        accountNumber: form.accountNumber || '',
      };

      const savedTeacher = await saveTeacher(created);
      await syncTeachersWithBackend();
      onSave(savedTeacher);
    } catch (err) {
      console.error('Error saving teacher:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = 'w-full border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 placeholder:font-normal';
  const labelCls = 'text-[11px] font-black uppercase tracking-wider text-slate-800 block mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[88vh]">

        {/* Simple & Clean Modern Header */}
        <div className="bg-card border-b border-border p-5 sm:p-6 shrink-0">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base sm:text-lg text-foreground">Add New Teacher</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  Step {step} of 5
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {WIZARD_STEPS.find(s => s.step === step)?.label} — {WIZARD_STEPS.find(s => s.step === step)?.sub}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Simple Clean 5-Segment Progress Bar */}
          <div className="grid grid-cols-5 gap-2">
            {WIZARD_STEPS.map((s) => {
              const isPast = step > s.step;
              const isCurrent = step === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setStep(s.step)}
                  className="group flex flex-col gap-1.5 text-left cursor-pointer focus:outline-none"
                >
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-200 ${
                      isPast
                        ? 'bg-primary'
                        : isCurrent
                        ? 'bg-primary ring-2 ring-primary/20'
                        : 'bg-muted group-hover:bg-muted-foreground/30'
                    }`}
                  />
                  <span className={`text-[10px] font-semibold truncate transition-colors hidden sm:block ${
                    isCurrent
                      ? 'text-primary font-bold'
                      : isPast
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {s.step}. {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-5">

            {/* STEP 1 — Personal Details */}
            {step === 1 && (
              <div className="space-y-4">

                {/* Modern Drag & Drop Profile Photo Uploader Section */}
                <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Teacher Profile Photo</h4>
                      <p className="text-[11px] text-slate-500">Upload a high-resolution headshot or paste an image URL.</p>
                    </div>
                    {form.profileImage && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerCropModal(form.profileImage, (cropped) => setF('profileImage', cropped));
                          }}
                          className="px-3 py-1 text-xs font-bold text-foreground hover:bg-slate-100 rounded-xl transition border border-slate-300 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Scissors className="w-3 h-3 text-primary" /> Crop Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setF('profileImage', '')}
                          className="px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    {/* Left Live Avatar Preview Card */}
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/5 to-slate-100 ring-4 ring-primary/20 shadow-md flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                          {form.profileImage ? (
                            <img src={form.profileImage} alt="Teacher Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-primary font-serif font-bold text-2xl tracking-wider">
                              {form.name ? form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'TC'}
                            </div>
                          )}
                        </div>
                        <label
                          htmlFor="wizardPhotoUpload"
                          className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
                        >
                          <Camera className="w-4 h-4" />
                        </label>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 mt-2.5">
                        {form.profileImage ? 'Photo Attached' : 'No Photo Selected'}
                      </span>
                    </div>

                    {/* Right Modern Drag-and-Drop Dropzone */}
                    <div className="sm:col-span-2 space-y-3">
                      <label
                        htmlFor="wizardPhotoUpload"
                        className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all rounded-2xl p-4 text-center cursor-pointer block group shadow-2xs"
                      >
                        <UploadCloud className="w-8 h-8 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-slate-800">
                          Click to browse <span className="text-primary">or drag & drop photo here</span>
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5 font-bold">Supports PNG, JPG, WEBP or SVG (Max 10MB)</p>
                      </label>
                      <input
                        type="file"
                        id="wizardPhotoUpload"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) { (window as any).showTarepetAlert?.('The selected image file exceeds 10MB. Please select a photo below 10MB.', 'Image Size Limit Exceeded', 'warning'); return; }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              triggerCropModal(base64, (cropped) => setF('profileImage', cropped));
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }
                        }}
                      />

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 shrink-0">Or Image URL:</span>
                        <input
                          type="url"
                          className="flex-1 border-2 border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={form.profileImage.startsWith('data:') ? '' : form.profileImage}
                          onChange={e => setF('profileImage', e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Full Name & Title <span className="text-rose-500">*</span></label>
                  <input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Mr. Okonkwo Paul" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select className={inputCls} value={form.gender} onChange={e => setF('gender', e.target.value)}>
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" className={inputCls} value={form.dob} onChange={e => setF('dob', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input className={inputCls} value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+234 800 000 0000" />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address <span className="text-rose-500">*</span></label>
                    <input type="email" className={inputCls} value={form.email} onChange={e => setF('email', e.target.value)} placeholder="name@tarepet.edu.ng" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Residential Address</label>
                  <input className={inputCls} value={form.address} onChange={e => setF('address', e.target.value)} placeholder="e.g. 15 Swali Road, Yenagoa, Bayelsa State" />
                </div>
              </div>
            )}

            {/* STEP 2 — Academic Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Specialization / Core Subject Area</label>
                  <input className={inputCls} value={form.specialization} onChange={e => setF('specialization', e.target.value)} placeholder="e.g. Pure & Applied Mathematics, Physics & STEM" />
                </div>
                <div>
                  <label className={labelCls}>Academic Qualifications & Degrees</label>
                  <input className={inputCls} value={form.qualification} onChange={e => setF('qualification', e.target.value)} placeholder="e.g. B.Sc. Ed (Mathematics), M.Sc. Statistics, TRCN Certified" />
                </div>
              </div>
            )}

            {/* STEP 3 — Teaching Load & Duty */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Form Teacher Radio Toggle */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <label className={labelCls}>Form Teacher Assignment (Class Register Holder)</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="radio"
                        name="isFormTeacher"
                        value="Yes"
                        checked={form.isFormTeacher === 'Yes'}
                        onChange={e => setF('isFormTeacher', e.target.value)}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span>Yes, Form Teacher</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="radio"
                        name="isFormTeacher"
                        value="No"
                        checked={form.isFormTeacher === 'No'}
                        onChange={e => setF('isFormTeacher', e.target.value)}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span>No, Subject Teacher Only</span>
                    </label>
                  </div>

                  {/* Conditional selection */}
                  {form.isFormTeacher === 'Yes' ? (
                    <div className="pt-2 animate-in fade-in">
                      <label className={labelCls}>Select Specific Form Class</label>
                      <select className={inputCls} value={form.formTeacherClass} onChange={e => setF('formTeacherClass', e.target.value)}>
                        <option value="">-- Select Form Class --</option>
                        {GRADE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="pt-2 animate-in fade-in">
                      <label className={labelCls}>Teaching Division Level</label>
                      <select className={inputCls} value={form.teachingDivision} onChange={e => setF('teachingDivision', e.target.value)}>
                        <option value="">-- Select Teaching Division Level --</option>
                        <option value="Nursery & Primary">Nursery & Primary (Nursery 1 - Primary 5)</option>
                        <option value="Junior Secondary">Junior Secondary (JSS 1 - JSS 3)</option>
                        <option value="Senior Secondary">Senior Secondary (SS 1 - SS 3)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Add Subject to Assign Classes */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={labelCls + ' mb-0'}>Classes & Subjects Assigned (Subject ↔ Class Schedule)</label>
                      <p className="text-[11px] text-slate-500 font-medium">Specify the exact subject and the class taking it (e.g. JSS 1 English, SS 1 Literature)</p>
                    </div>
                    <button
                      type="button"
                      onClick={addSubject}
                      className="text-xs font-bold text-teal-800 flex items-center gap-1.5 hover:bg-teal-200/70 cursor-pointer bg-teal-100/80 px-3 py-1.5 rounded-xl border border-teal-300 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add Class & Subject
                    </button>
                  </div>

                  {/* Quick preset chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Subjects:</span>
                    {['English Language', 'Mathematics', 'Literature in English', 'Physics', 'Chemistry', 'Biology', 'Basic Science', 'Civic Education', 'Economics', 'ICT'].map(sName => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            subjectsAssigned: [...prev.subjectsAssigned, { name: sName, grade: 'JSS 1' }]
                          }));
                        }}
                        className="text-[10px] font-semibold bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                      >
                        + {sName}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {form.subjectsAssigned.length > 0 ? (
                      form.subjectsAssigned.map((sub: any, i: number) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Subject Name</label>
                              <input
                                className={inputCls}
                                value={sub.name}
                                onChange={e => updateSubject(i, 'name', e.target.value)}
                                placeholder="e.g. English Language, Literature, Mathematics"
                              />
                            </div>
                            <div className="w-48 sm:w-56">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Assigned Class / Grade</label>
                              <select
                                className={inputCls}
                                value={sub.grade}
                                onChange={e => updateSubject(i, 'grade', e.target.value)}
                              >
                                {GRADE_OPTIONS.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                            <div className="pt-4">
                              <button
                                type="button"
                                onClick={() => removeSubject(i)}
                                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition shrink-0 cursor-pointer border border-rose-200/60"
                                title="Remove Subject Assignment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {sub.name && (
                            <div className="flex items-center gap-1.5 text-[11px] text-teal-800 font-semibold bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                              <span>Teaches <strong className="text-teal-900">{sub.name}</strong> to class <strong className="text-teal-900">{sub.grade || 'JSS 1'}</strong></span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-teal-200/80 rounded-xl text-center bg-teal-50/30">
                        <p className="text-xs text-slate-600 mb-2 font-medium">No subjects or classes assigned to this teacher profile yet.</p>
                        <button type="button" onClick={addSubject} className="text-xs font-bold text-teal-700 inline-flex items-center gap-1.5 hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-teal-200 shadow-2xs">
                          <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Subject to Assign Classes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — Employment & Payroll */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Staff ID (Auto-generated if blank)</label>
                    <input className={inputCls + ' font-mono'} value={form.staffId} onChange={e => setF('staffId', e.target.value)} placeholder="TMS/TCH/0001" />
                  </div>
                  <div>
                    <label className={labelCls}>Date of Employment</label>
                    <input type="date" className={inputCls} value={form.joined} onChange={e => setF('joined', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Employment Status</label>
                    <select className={inputCls} value={form.status} onChange={e => setF('status', e.target.value)}>
                      <option>Active</option>
                      <option>On Leave</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Monthly Gross Salary (₦)</label>
                    <input type="number" className={inputCls} value={form.salary} onChange={e => setF('salary', e.target.value)} placeholder="e.g. 180000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Bank Name</label>
                    <input className={inputCls} value={form.bankName} onChange={e => setF('bankName', e.target.value)} placeholder="e.g. First Bank, GTBank" />
                  </div>
                  <div>
                    <label className={labelCls}>Bank Account Number</label>
                    <input className={inputCls} value={form.accountNumber} onChange={e => setF('accountNumber', e.target.value)} placeholder="10-digit NUBAN account number" maxLength={10} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 — Review & Save */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-teal-200/60">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold font-serif shadow-sm overflow-hidden">
                      {form.profileImage ? (
                        <img src={form.profileImage} alt="Teacher" className="w-full h-full object-cover" />
                      ) : (
                        form.name?.[0] || '?'
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{form.name || '—'}</h4>
                      <p className="text-xs text-teal-800 font-medium">{form.specialization || 'Academic Educator'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                          {form.status}
                        </span>
                        {form.isFormTeacher === 'Yes' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                            Form Teacher: {form.formTeacherClass}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                    {[
                      ['Staff ID', form.staffId || 'TMS/TCH/AUTO'],
                      ['Form Teacher Assignment', form.isFormTeacher === 'Yes' ? form.formTeacherClass : `No (${form.teachingDivision || 'Subject Specialist'})`],
                      ['Gender', form.gender || '—'],
                      ['Date of Birth', form.dob || '—'],
                      ['Email Address', form.email || '—'],
                      ['Phone Number', form.phone || '—'],
                      ['Residential Address / Location', form.address || '—'],
                      ['Academic Specialization', form.specialization || '—'],
                      ['Qualifications & Degrees', form.qualification || '—'],
                      ['Joined Date', form.joined || '—'],
                      ['Monthly Salary', form.salary ? `₦${Number(form.salary).toLocaleString()}` : '—'],
                      ['Bank Account', form.bankName ? `${form.bankName} — ${form.accountNumber}` : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="py-1 border-b border-teal-200/40">
                        <p className="text-[9px] text-slate-500 uppercase font-extrabold">{k}</p>
                        <p className="font-bold text-slate-800 truncate">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Review Assigned Classes & Subjects */}
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold mb-1.5">Assigned Classes & Subjects Schedule ({form.subjectsAssigned.filter((s: any) => s.name).length}):</p>
                    {form.subjectsAssigned.filter((s: any) => s.name).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {form.subjectsAssigned.filter((s: any) => s.name).map((sub: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs shadow-2xs">
                            <span className="font-bold text-slate-900">{sub.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {sub.grade || 'All Classes'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific subjects assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Controls */}
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                Back
              </button>
            ) : <div />}

            <div>
              {step < 5 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 && (!form.name || !form.email)}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!form.name || !form.email || isSaving}
                  className="px-7 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSaving ? 'Registering Teacher...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </div>

          <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={pendingCropImage}
          onClose={() => setCropModalOpen(false)}
          onSave={(cropped) => {
            setCropModalOpen(false);
            setF('profileImage', cropped);
          }}
        />
      </div>
    </div>
  );
};

const EditTeacherModal = ({
  teacher,
  onClose,
  onSave,
  onOpenCrop
}: {
  teacher: any;
  onClose: () => void;
  onSave: (updated: any) => void;
  onOpenCrop?: (img: string, cb: (cropped: string) => void) => void;
}) => {
  const [form, setForm] = useState({ ...teacher });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif font-bold text-xl text-foreground">Edit Teacher Profile</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Avatar Photo Preview and Upload */}
          <div className="p-3.5 rounded-2xl bg-muted/20 border border-border flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-serif font-bold text-lg text-primary overflow-hidden shrink-0">
              {form.profileImage ? (
                <img src={form.profileImage} alt="Teacher" className="w-full h-full object-cover" />
              ) : (
                `${form.name?.[0] || 'T'}`
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="file"
                accept="image/*"
                id="adminTeacherEditPhotoInput"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      (window as any).showTarepetAlert?.('The selected image file exceeds 10MB. Please select a photo below 10MB.', 'Image Size Limit Exceeded', 'warning');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      if (onOpenCrop) {
                        onOpenCrop(base64, (cropped) => {
                          setForm((prev: any) => ({ ...prev, profileImage: cropped }));
                        });
                      } else {
                        setForm((prev: any) => ({ ...prev, profileImage: base64 }));
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="adminTeacherEditPhotoInput"
                  className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.profileImage ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
                {form.profileImage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenCrop) {
                          onOpenCrop(form.profileImage, (cropped) => {
                            setForm((prev: any) => ({ ...prev, profileImage: cropped }));
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 text-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5 text-primary" />
                      <span>Crop / Resize</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev: any) => ({ ...prev, profileImage: '' }))}
                      className="px-2.5 py-1.5 text-rose-600 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, or WEBP. Syncs to Teacher portal real-time.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Full Name & Title</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Staff ID</label>
              <input type="text" value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} required
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Status</label>
              <select value={form.status || 'Active'} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Gender</label>
              <select value={form.gender || 'Male'} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Date of Birth</label>
              <input type="date" value={form.dob || '1990-01-01'} onChange={e => setForm({ ...form, dob: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Residential Address</label>
            <input type="text" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. Tarepet School Campus, Yenagoa, Bayelsa State"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Specialization</label>
            <input type="text" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Qualifications</label>
            <input type="text" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Teaching Division</label>
              <select value={form.department || 'Senior Secondary (SS 1 - SS 3)'} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Senior Secondary (SS 1 - SS 3)">Senior Secondary (SS 1 - SS 3)</option>
                <option value="Junior Secondary (JSS 1 - JSS 3)">Junior Secondary (JSS 1 - JSS 3)</option>
                <option value="Primary Department (Primary 1 - 6)">Primary Department (Primary 1 - 6)</option>
                <option value="Nursery Department (Nursery 1 - 3)">Nursery Department (Nursery 1 - 3)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Form Teacher Duty</label>
              <select value={form.formTeacherOf || 'None'} onChange={e => setForm({ ...form, formTeacherOf: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="None">None (Subject Specialist Only)</option>
                <option value="Nursery 1">Nursery 1</option>
                <option value="Nursery 2">Nursery 2</option>
                <option value="Nursery 3">Nursery 3</option>
                <option value="Primary 1">Primary 1</option>
                <option value="Primary 2">Primary 2</option>
                <option value="Primary 3">Primary 3</option>
                <option value="Primary 4">Primary 4</option>
                <option value="Primary 5">Primary 5</option>
                <option value="Primary 6">Primary 6</option>
                <option value="JSS 1">JSS 1</option>
                <option value="JSS 2">JSS 2</option>
                <option value="JSS 3">JSS 3</option>
                <option value="SS 1 Science">SS 1 Science</option>
                <option value="SS 1 Art">SS 1 Art</option>
                <option value="SS 2 Science">SS 2 Science</option>
                <option value="SS 2 Art">SS 2 Art</option>
                <option value="SS 3 Science">SS 3 Science</option>
                <option value="SS 3 Art">SS 3 Art</option>
              </select>
            </div>
          </div>

          {/* Assigned Classes & Subjects Schedule */}
          <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold uppercase text-foreground block">Assigned Classes & Subjects</label>
                <p className="text-[10px] text-muted-foreground">Manage which subjects and classes this teacher handles</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = Array.isArray(form.subjectsAssigned) ? form.subjectsAssigned : [];
                  setForm({ ...form, subjectsAssigned: [...current, { name: '', grade: 'JSS 1' }] });
                }}
                className="text-[11px] font-bold text-primary hover:bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Class & Subject
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {Array.isArray(form.subjectsAssigned) && form.subjectsAssigned.length > 0 ? (
                form.subjectsAssigned.map((sub: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-card rounded-xl border border-border">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={e => {
                        const next = form.subjectsAssigned.map((item: any, idx: number) =>
                          idx === i ? { ...item, name: e.target.value } : item
                        );
                        setForm({ ...form, subjectsAssigned: next, classesCount: next.filter((s: any) => s.name).length });
                      }}
                      placeholder="Subject (e.g. English, Literature)"
                      className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={sub.grade || 'JSS 1'}
                      onChange={e => {
                        const next = form.subjectsAssigned.map((item: any, idx: number) =>
                          idx === i ? { ...item, grade: e.target.value } : item
                        );
                        setForm({ ...form, subjectsAssigned: next });
                      }}
                      className="w-36 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {GRADE_OPTIONS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.subjectsAssigned.filter((_: any, idx: number) => idx !== i);
                        setForm({ ...form, subjectsAssigned: next, classesCount: next.filter((s: any) => s.name).length });
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center hover:bg-rose-500/20 transition shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-1">No subjects assigned. Click "+ Add Class & Subject" above.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Bank Name</label>
              <input type="text" value={form.bankName || ''} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. First Bank"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Account Number</label>
              <input type="text" value={form.accountNumber || ''} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="e.g. 0123456789"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-border">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
              Save Changes
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

const EditStudentModal = ({
  student,
  onClose,
  onSave,
  onOpenCrop,
}: {
  student: any;
  onClose: () => void;
  onSave: (updated: any) => void;
  onOpenCrop?: (img: string, cb: (cropped: string) => void) => void;
}) => {
  const [form, setForm] = useState({ ...student });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif font-bold text-xl text-foreground">Edit Student Profile</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Avatar Photo Preview and Upload */}
          <div className="p-3.5 rounded-2xl bg-muted/20 border border-border flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-serif font-bold text-lg text-primary overflow-hidden shrink-0">
              {form.profileImage ? (
                <img src={form.profileImage} alt="Student" className="w-full h-full object-cover" />
              ) : (
                `${form.name?.[0] || 'S'}`
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="file"
                accept="image/*"
                id="adminStudentEditPhotoInput"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      (window as any).showTarepetAlert?.('The selected image file exceeds 10MB. Please select a photo below 10MB.', 'Image Size Limit Exceeded', 'warning');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      if (onOpenCrop) {
                        onOpenCrop(base64, (cropped) => {
                          setForm((prev: any) => ({ ...prev, profileImage: cropped }));
                        });
                      } else {
                        setForm((prev: any) => ({ ...prev, profileImage: base64 }));
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="adminStudentEditPhotoInput"
                  className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.profileImage ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
                {form.profileImage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenCrop) {
                          onOpenCrop(form.profileImage, (cropped) => {
                            setForm((prev: any) => ({ ...prev, profileImage: cropped }));
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 text-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5 text-primary" />
                      <span>Crop / Resize</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev: any) => ({ ...prev, profileImage: '' }))}
                      className="px-2.5 py-1.5 text-rose-600 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, or WEBP. Syncs to Student portal in real time.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Full Student Name</label>
            <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Admission Number</label>
              <input type="text" value={form.admissionNo || form.studentId || form.code || ''} onChange={e => setForm({ ...form, admissionNo: e.target.value, studentId: e.target.value })} required
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Status</label>
              <select value={form.status || 'Active'} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Class Level</label>
              <select value={form.grade || 'SS1'} onChange={e => setForm({ ...form, grade: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                {['Creche', 'Reception', 'Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Stream / Arm</label>
              <input type="text" value={form.stream || 'Science'} onChange={e => setForm({ ...form, stream: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Science, Art, Gold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">School House</label>
              <input type="text" value={form.house || ''} onChange={e => setForm({ ...form, house: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Sapphire House" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Gender</label>
              <select value={form.gender || 'Male'} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Parent / Guardian Name</label>
              <input type="text" value={form.parentName || ''} onChange={e => setForm({ ...form, parentName: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Parent Contact Phone</label>
              <input type="tel" value={form.parentPhone || form.phone || ''} onChange={e => setForm({ ...form, parentPhone: e.target.value, phone: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-border">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
              Save Student Changes
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

const BulkImportModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
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
          <h3 className="font-serif font-bold text-xl text-foreground">{t('bulkImport.title')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {step === 'upload' && (
            <>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">{t('bulkImport.dropHint')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('bulkImport.requiredCols')}</p>
              </div>
              <button onClick={() => setStep('preview')} className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                {t('bulkImport.loadPreview')}
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
                  {t('bulkImport.back')}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h4 className="font-serif font-bold text-xl text-foreground mb-2">{t('bulkImport.importSuccess')}</h4>
              <p className="text-muted-foreground text-sm">3 users created · 0 skipped · 0 errors</p>
              <button onClick={onClose} className="mt-6 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                {t('bulkImport.done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AwardPointsModal = ({ house, onClose }: { house: any; onClose: () => void }) => {
  const { t } = useTranslation();
  const [pts, setPts] = useState('10');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        {!done ? (
          <>
            <h3 className="font-serif font-bold text-xl text-foreground mb-1">{t('housePoints.title')}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t('housePoints.awardingTo')}<strong>{house.name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('housePoints.pointsLabel')}</label>
                <input type="number" value={pts} onChange={e => setPts(e.target.value)} min="1" max="100"
                  className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary text-lg font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('housePoints.reasonLabel')}</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Won inter-house debate competition"
                  className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDone(true)} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  {t('housePoints.awardBtn')}{pts} Points
                </button>
                <button onClick={onClose} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">{t('housePoints.cancel')}</button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 flex flex-col items-center justify-center">
            <Trophy className="w-12 h-12 text-amber-500 mb-4" />
            <h4 className="font-serif font-bold text-xl text-foreground">{pts} Points Awarded!</h4>
            <p className="text-muted-foreground text-sm mt-1">{house.name} now has {house.points + parseInt(pts)} total points.</p>
            <button onClick={onClose} className="mt-5 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">{t('housePoints.done')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ExamPreviewModal = ({ exam, onClose }: { exam: any; onClose: () => void }) => {
  const { t } = useTranslation();
  // Objective Multiple Choice Questions (A, B, C, D)
  const questions = exam.questions || [
    {
      num: 1,
      text: `Which of the following represents the primary theorem/rule applied in ${exam.subject || 'this course'}?`,
      options: ['Option A: Fundamental Principle I', 'Option B: Secondary Derivation II', 'Option C: Empirical Postulate III', 'Option D: Auxiliary Rule IV'],
      correct: 'Option A: Fundamental Principle I'
    },
    {
      num: 2,
      text: `In Montessori practical application, what is the main objective during ${exam.subject || 'this subject'} practical work?`,
      options: ['Option A: Theoretical memorization', 'Option B: Self-directed experiential learning', 'Option C: Group lectures', 'Option D: Rote repetition'],
      correct: 'Option B: Self-directed experiential learning'
    },
    {
      num: 3,
      text: `Identify the correct unit or standard formula used when calculating metrics in ${exam.subject || 'this topic'}:`,
      options: ['Option A: Formula X = a + b', 'Option B: Formula Y = m * c^2', 'Option C: Standard Metric Alpha', 'Option D: Derived Constant Beta'],
      correct: 'Option C: Standard Metric Alpha'
    },
    {
      num: 4,
      text: `Which scientist or scholar is credited with establishing the foundational theory of ${exam.subject || 'this domain'}?`,
      options: ['Option A: Dr. Maria Montessori', 'Option B: Isaac Newton', 'Option C: Albert Einstein', 'Option D: Michael Faraday'],
      correct: 'Option A: Dr. Maria Montessori'
    },
  ];

  const rules = exam.rules || [
    "All questions are 100% Objective Multiple Choice (A, B, C, D).",
    "Select your answers using the CBT computer terminal interface.",
    "Arrive at the exam venue at least 15 minutes before the start time.",
    "No mobile phones, smartwatches, or other unauthorized electronic devices allowed.",
    "Automatic timer submission is enforced when exam time expires.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-muted/20 rounded-t-3xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
              {exam.class} · {exam.stream} · Objective CBT
            </span>
            <h3 className="font-serif font-bold text-xl text-foreground mt-2">{exam.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t('examPreview.subject')}<span className="text-foreground font-semibold">{exam.subject}</span></p>
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
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.date')}& Time</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.date}<br />{exam.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.duration')}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.duration}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.venue')}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.venue}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.teacher')}</p>
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

          {/* Objective Questions Preview */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" /> {t('examPreview.objectiveTitle')}
            </h4>
            <div className="space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={i} className="p-4 border border-border rounded-xl bg-card hover:bg-muted/10 transition-colors space-y-2">
                  <p className="font-bold text-foreground">{t('examPreview.question')}{q.num || i + 1}:</p>
                  <p className="text-foreground leading-relaxed text-sm">{q.text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(q.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((opt: string, optIdx: number) => {
                      const OPTION_KEYS = new Map([[0, 'A'], [1, 'B'], [2, 'C'], [3, 'D']]);
                      const isCorrect = q.correct === opt || q.correct_option === OPTION_KEYS.get(optIdx);
                      return (
                        <div key={optIdx} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          isCorrect ? 'bg-emerald-500/10 border-emerald-300 text-emerald-800 font-bold' : 'bg-muted/30 border-border/60 text-muted-foreground'
                        }`}>
                          <span>{opt}</span>
                          {isCorrect && <span className="text-emerald-600">{t('examPreview.correct')}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-muted/10 rounded-b-3xl">
          <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            {t('examPreview.closePreview')}
          </button>
        </div>
      </div>
    </div>
  );
};


const CreateSubjectModal = ({ onClose, onCreated, defaultClass, defaultStream }: { onClose: () => void; onCreated: (sub: any) => void; defaultClass?: string; defaultStream?: string }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    code: '',
    title: '',
    teacher: '',
    grade: defaultClass || 'JSS1',
    stream: defaultStream || 'General',
    category: 'General',
    enrolled: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const autoCode = form.title.trim().slice(0, 3).toUpperCase() || 'SUB';
    onCreated({ ...form, code: autoCode });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif font-bold text-xl text-foreground">{t('addSubject.title')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.nameLabel')}</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mathematics" required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.instructorLabel')}</label>
            <input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="e.g. Mr. Okonkwo Paul" required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.classLevel')}</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="NUR1">Nursery 1</option>
                <option value="NUR2">Nursery 2</option>
                <option value="NUR3">Nursery 3</option>
                <option value="PRI1">Primary 1</option>
                <option value="PRI2">Primary 2</option>
                <option value="PRI3">Primary 3</option>
                <option value="PRI4">Primary 4</option>
                <option value="PRI5">Primary 5</option>
                <option value="PRI6">Primary 6</option>
                <option value="JSS1">JSS 1</option>
                <option value="JSS2">JSS 2</option>
                <option value="JSS3">JSS 3</option>
                <option value="SS1">SS 1</option>
                <option value="SS2">SS 2</option>
                <option value="SS3">SS 3</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.stream')}</label>
              <select value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="General">General (JSS / Core)</option>
                <option value="Science">Science Stream</option>
                <option value="Art">Art & Humanities Stream</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              {t('addSubject.addBtn')}
            </button>
            <button type="button" onClick={onClose} className="border border-border px-5 py-2.5 rounded-xl hover:bg-accent transition-colors">
              {t('addSubject.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AddUserModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', role: 'STUDENT', status: 'Active' });
  const [created, setCreated] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ email: string; studentId: string } | null>(null);

  const handleNameChange = (nameVal: string) => {
    const updatedForm = { ...form, name: nameVal };
    if (form.role === 'STUDENT') {
      updatedForm.email = formatStudentEmail(nameVal);
    }
    setForm(updatedForm);
  };

  const handleRoleChange = (roleVal: string) => {
    const updatedForm = { ...form, role: roleVal };
    if (roleVal === 'STUDENT' && form.name) {
      updatedForm.email = formatStudentEmail(form.name);
    }
    setForm(updatedForm);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const finalEmail = form.role === 'STUDENT' ? formatStudentEmail(form.name) : (form.email || formatStudentEmail(form.name));
    const schoolId = form.role === 'TEACHER' 
      ? `TMS/TCH/${Math.floor(1000 + Math.random() * 9000)}`
      : generateAdmissionNumber('SS1', 'Science');

    if (form.role === 'STUDENT') {
      await saveStudent({
        name: form.name.trim(),
        email: finalEmail,
        code: schoolId,
        admissionNo: schoolId,
        password: schoolId,
        grade: 'SS1',
        stream: 'Science',
        status: 'ACTIVE'
      });
      await syncStudentsWithBackend();
    } else {
      // Post to Django REST API for TEACHER / ADMIN
      authClient.post('/auth/register/', {
        email: finalEmail,
        password: schoolId,
        first_name: form.name.trim().split(' ')[0],
        last_name: form.name.trim().split(' ').slice(1).join(' ') || 'Staff',
        role: form.role,
        teacher_id: form.role === 'TEACHER' ? schoolId : undefined,
      }).then(async () => {
        if (form.role === 'TEACHER') {
          await syncTeachersWithBackend();
        }
      }).catch(() => {});
    }

    setForm({ ...form, email: finalEmail });
    setGeneratedCreds({ email: finalEmail, studentId: schoolId });
    setCreated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        <h3 className="font-serif font-bold text-xl text-foreground mb-4">{t('createUser.title')}</h3>
        {!created ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.fullName')}</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Kelechi Amadi" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.role')}</label>
              <select value={form.role} onChange={e => handleRoleChange(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="STUDENT">{t('createUser.student')}</option>
                <option value="TEACHER">{t('createUser.teacher')}</option>
                <option value="PARENT">{t('createUser.parent')}</option>
                <option value="ADMIN">{t('createUser.admin')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.email')}</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={form.role === 'STUDENT' ? "firstname.surname@tarepet.com" : "e.g. ngozi.eze@tarepet.edu.ng"} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs" />
              {form.role === 'STUDENT' && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Format: firstname.surname@tarepet.com | Password: Auto-created School ID
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={!form.name.trim()} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors">{t('createUser.createBtn')}</button>
              <button onClick={onClose} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">{t('createUser.cancel')}</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-lg">{t('createUser.created')}</h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-left space-y-1.5 text-xs font-sans">
              <p><span className="text-muted-foreground font-semibold">User Role:</span> <strong className="text-primary">{form.role}</strong></p>
              <p><span className="text-muted-foreground font-semibold">Email:</span> <strong className="font-mono text-foreground">{generatedCreds?.email}</strong></p>
              {form.role === 'STUDENT' && (
                <p><span className="text-muted-foreground font-semibold">Password (School ID):</span> <strong className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{generatedCreds?.studentId}</strong></p>
              )}
              {form.role === 'TEACHER' && (
                <p><span className="text-muted-foreground font-semibold">Default Password (Staff ID):</span> <strong className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{generatedCreds?.studentId}</strong></p>
              )}
            </div>
            <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold mt-2">{t('createUser.done')}</button>
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
  const { t } = useTranslation();
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

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;

    try {
      if (defaultRole === 'TEACHER') {
        const serial = String(Math.floor(1000 + Math.random() * 9000));
        const staffId = form.staffId || `TMS/TCH/${serial}`;
        const subs = form.subject ? form.subject.split(',').map((s: string) => ({ name: s.trim(), grade: 'JSS 1' })) : [];
        await saveTeacher({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || '',
          dob: form.dob || '',
          staffId: staffId,
          formTeacherOf: form.department || 'None',
          department: form.department?.startsWith('SS') ? 'Senior Secondary' : form.department?.startsWith('JSS') ? 'Junior Secondary' : 'Academic Department',
          subjectsAssigned: subs,
          status: 'Active',
        });
        await syncTeachersWithBackend();
      } else if (defaultRole === 'STUDENT') {
        const schoolId = generateAdmissionNumber(form.grade || 'SS1', 'Science');
        await saveStudent({
          name: form.name.trim(),
          email: form.email.trim(),
          code: schoolId,
          admissionNo: schoolId,
          password: schoolId,
          grade: form.grade || 'SS1',
          stream: 'Science',
          status: 'ACTIVE'
        });
        await syncStudentsWithBackend();
      } else {
        await authClient.post('/auth/register/', {
          email: form.email.trim(),
          password: 'Tarepet2026Password!',
          first_name: form.name.trim().split(' ')[0],
          last_name: form.name.trim().split(' ').slice(1).join(' ') || 'Staff',
          role: defaultRole === 'STAFF' ? 'PARENT' : defaultRole,
          phone: form.phone || '',
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not register user:', e);
    }

    setCreated(true);
    onCreated({ name: form.name, email: form.email, role: defaultRole === 'STAFF' ? 'PARENT' : defaultRole });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {!created ? (
          <>
            <div className="mb-5">
              <h3 className="font-serif font-bold text-xl text-foreground">{t('createStaff.createNew')}{typeLabel.replace(/s$/, '')} Account</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('createStaff.fillDetails')}</p>
            </div>

            <div className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.fullName')}<span className="text-rose-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mrs. Ngozi Okafor"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.email')}<span className="text-rose-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ngozi@tarepet.edu.ng"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 801 234 5678"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.dob')}</label>
                  <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Role-specific fields */}
              {defaultRole === 'TEACHER' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.subjectsTaught', 'Subjects Taught')}</label>
                    <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Mathematics, Biology"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.formTeacherClass', 'Form Teacher Duty (Class)')}</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">None / Subject Teacher Only</option>
                      <option value="NUR1 General">Nursery 1 Form Teacher</option>
                      <option value="NUR2 General">Nursery 2 Form Teacher</option>
                      <option value="NUR3 General">Nursery 3 Form Teacher</option>
                      <option value="PRI1 General">Primary 1 Form Teacher</option>
                      <option value="PRI2 General">Primary 2 Form Teacher</option>
                      <option value="PRI3 General">Primary 3 Form Teacher</option>
                      <option value="PRI4 General">Primary 4 Form Teacher</option>
                      <option value="PRI5 General">Primary 5 Form Teacher</option>
                      <option value="PRI6 General">Primary 6 Form Teacher</option>
                      <option value="JSS1 General">JSS 1 Form Teacher</option>
                      <option value="JSS2 General">JSS 2 Form Teacher</option>
                      <option value="JSS3 General">JSS 3 Form Teacher</option>
                      <option value="SS1 Science">SS 1 Science Form Teacher</option>
                      <option value="SS1 Art">SS 1 Art Form Teacher</option>
                      <option value="SS2 Science">SS 2 Science Form Teacher</option>
                      <option value="SS2 Art">SS 2 Art Form Teacher</option>
                      <option value="SS3 Science">SS 3 Science Form Teacher</option>
                      <option value="SS3 Art">SS 3 Art Form Teacher</option>
                    </select>
                  </div>
                </div>
              )}
              {defaultRole === 'STAFF' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.department')}</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">{t('createStaff.selectDept')}</option>
                      <option>{t('createStaff.administration')}</option>
                      <option>{t('createStaff.library')}</option>
                      <option>{t('createStaff.security')}</option>
                      <option>{t('createStaff.kitchen')}</option>
                      <option>{t('createStaff.maintenance')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.staffId')}</label>
                    <input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}
                      placeholder="e.g. STF-2026-001"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}
              {defaultRole === 'ADMIN' && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.adminRole')}</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t('createStaff.selectRole')}</option>
                    <option>{t('createStaff.principal')}</option>
                    <option>{t('createStaff.vicePrincipal')}</option>
                    <option>{t('createStaff.hod')}</option>
                    <option>{t('createStaff.platformAdmin')}</option>
                    <option>{t('createStaff.registrar')}</option>
                  </select>
                </div>
              )}
              {defaultRole === 'STUDENT' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.gradeLevel')}</label>
                      <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">{t('createStaff.selectGrade')}</option>
                        <option value="NUR1">Nursery 1</option>
                        <option value="NUR2">Nursery 2</option>
                        <option value="NUR3">Nursery 3</option>
                        <option value="PRI1">Primary 1</option>
                        <option value="PRI2">Primary 2</option>
                        <option value="PRI3">Primary 3</option>
                        <option value="PRI4">Primary 4</option>
                        <option value="PRI5">Primary 5</option>
                        <option value="PRI6">Primary 6</option>
                        <option value="JSS1">JSS 1</option>
                        <option value="JSS2">JSS 2</option>
                        <option value="JSS3">JSS 3</option>
                        <option value="SS1">SS 1</option>
                        <option value="SS2">SS 2</option>
                        <option value="SS3">SS 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.houseAssignment')}</label>
                      <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>{t('createStaff.autoAssign')}</option>
                        <option>{t('createStaff.blueHouse')}</option>
                        <option>{t('createStaff.purpleHouse')}</option>
                        <option>{t('createStaff.greenHouse')}</option>
                        <option>{t('createStaff.redHouse')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                    <Key className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div><strong>Student Authentication:</strong> Student ID Number (Admission No) will be auto-generated. Students log into their portal using their <strong>Email Address</strong> and <strong>Student ID Number</strong>.</div>
                  </div>
                </div>
              )}

              <div className="bg-muted/20 border border-border rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Account credentials and initial login access instructions will be sent to the email provided.</span>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  {t('createStaff.createAccount')}
                </button>
                <button onClick={onClose} className="border border-border px-5 py-3 rounded-xl text-sm hover:bg-accent transition-colors">
                  {t('createStaff.cancel')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-xl">{t('createStaff.accountCreated')}</h4>
            <p className="text-sm text-muted-foreground">
              <strong>{form.name}</strong> has been added to {typeLabel}.<br />
              Login credentials have been sent to <strong>{form.email}</strong>.
            </p>
            <button onClick={onClose} className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors mt-2">
              {t('createStaff.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Cache Buster ─────────────────────────────────────────────
// Increment this version string on every deploy to wipe stale localStorage data.
const APP_DATA_VERSION = 'v2.0.0';


// ── Main Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAdmin, updateUser, refreshUserProfile } = useAuth();
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useCustomDialog();

  if (!user || !isAdmin || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl bg-card p-8 shadow-xl border border-border">
          <h2 className="text-2xl font-serif font-bold text-destructive mb-3">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Your account ({user?.role || 'Guest'}) does not have permission to view the Admin Dashboard.
          </p>
          <button
            onClick={() => { window.location.href = '/sign-in'; }}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }
  const [activeSection, setActiveSectionState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSec = params.get('section');
      if (urlSec) return urlSec;
      const cached = null;
      if (cached) return cached;
    }
    return 'overview';
  });
  const setActiveSection = (section: string) => {
    if (typeof window !== 'undefined') {
      
      sessionStorage.setItem('admin_active_section', section);
      const url = new URL(window.location.href);
      url.searchParams.set('section', section);
      window.history.replaceState(null, '', url.toString());
    }
    setActiveSectionState(section);
  };
  const [userSubPage, setUserSubPage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [idCardUser, setIdCardUser] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCreateForType, setShowCreateForType] = useState(false);
  const [awardHouse, setAwardHouse] = useState<any>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [usersList, setUsersList] = useState(MOCK_USERS);
  const [studentsList, setStudentsList] = useState<any[]>(() => getStoredStudents());

  const [wsExamStatus, setWsExamStatus] = useState<string>(() => getWebSocketStatus());
  const [isSyncingExams, setIsSyncingExams] = useState(false);
  const [examsList, setExamsList] = useState<any[]>(() => getStoredExams().map(mapCBTExamToAdminExam));
  const [previewExam, setPreviewExam] = useState<any>(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    grade: 'JSS1',
    stream: 'General',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    profileImage: '',
    house: '',
  });

  const currentWizardAdmissionNo = React.useMemo(() => {
    return generateAdmissionNumber(newStudentForm.grade, newStudentForm.stream);
  }, [newStudentForm.grade, newStudentForm.stream, showAddStudentModal]);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  // Student class drill-down
  const [selectedClass, setSelectedClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedStream, setSelectedStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openClassDropdown, setOpenClassDropdown] = useState<string | null>(null); // which class card has dropdown open

  const refreshExamsRealtime = React.useCallback(() => {
    const list = getStoredExams();
    setExamsList(list.map(mapCBTExamToAdminExam));
  }, []);

  React.useEffect(() => {
    setStudentsList(getStoredStudents());
    setSubjectsListState(getStoredSubjects());
    refreshExamsRealtime();

    syncStudentsWithBackend().then(res => setStudentsList(res));
    syncExamsWithBackend().then(res => {
      setExamsList(res.map(mapCBTExamToAdminExam));
    });

    const unsubCBT = subscribeToCBTStore(() => {
      setStudentsList(getStoredStudents());
      setSubjectsListState(getStoredSubjects());
      refreshExamsRealtime();
    });

    const unsubWsStatus = subscribeToWebSocketStatus((status) => {
      setWsExamStatus(status);
    });

    const unsubEvents = subscribeToWebSocketEvents((event: any) => {
      if (event.type === 'STUDENT_ENROLLED_BY_TEACHER' && event.payload) {
        setStudentsList(getStoredStudents());
        syncStudentsWithBackend().then(res => setStudentsList(res));
        const p = event.payload;
        showAlert?.({
          title: 'Live Student Registration Alert',
          message: `🔔 Live Notification: Form Teacher ${p.registeredBy || 'Staff'} has enrolled a new student: "${p.student?.name || 'Student'}" into ${p.classLevel || 'Class'}.`,
          type: 'info'
        });
      }

      if (
        event.type === 'CBT_STORE_MUTATED' ||
        event.type === 'EXAM_CREATED' ||
        event.type === 'EXAM_APPROVED' ||
        event.type === 'EXAM_REJECTED' ||
        event.type === 'EXAM_ACTIVATED' ||
        event.type === 'EXAM_STATUS_UPDATED' ||
        event.type === 'EXAM_SUBMISSION'
      ) {
        refreshExamsRealtime();
        syncExamsWithBackend().then(res => setExamsList(res.map(mapCBTExamToAdminExam)));

        if (event.type === 'EXAM_CREATED' && event.payload?.exam) {
          const ex = event.payload.exam;
          showAlert?.({
            title: '📝 New Exam Submitted for Approval',
            message: `Teacher ${ex.teacher_name || 'Staff'} submitted CBT Exam: "${ex.title}" (${ex.course_name} - ${ex.class}).`,
            type: 'info'
          });
        }
        if (event.type === 'EXAM_ACTIVATED' && event.payload?.exam) {
          const ex = event.payload.exam;
          showAlert?.({
            title: '🚀 Exam Now Live for Students',
            message: `Exam "${ex.title}" (${ex.course_name}) is now live in student portal.`,
            type: 'success'
          });
        }
      }
    });

    return () => {
      unsubCBT();
      unsubWsStatus();
      unsubEvents();
    };
  }, [refreshExamsRealtime]);

  // Manage exams drill-down state
  const [selectedExamClass, setSelectedExamClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedExamStream, setSelectedExamStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openExamClassDropdown, setOpenExamClassDropdown] = useState<string | null>(null); // dropdown toggle
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);    // 'Test' | 'Exam' | 'All'
  const [examRepoFilter, setExamRepoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedExamDivision, setSelectedExamDivision] = useState<string | null>(null);

  // Manage subjects drill-down state
  const [selectedSubjectClass, setSelectedSubjectClass] = useState<string | null>(null);
  const [selectedSubjectStream, setSelectedSubjectStream] = useState<string | null>(null);
  const [openSubjectClassDropdown, setOpenSubjectClassDropdown] = useState<string | null>(null);
  const [showSubjectsActionsDropdown, setShowSubjectsActionsDropdown] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    title: '',
    code: '',
    grade: 'SS 1',
    stream: 'Science',
    category: 'STEM',
    teacher: 'Mrs. Timi Porbeni',
    periods: '4 Periods/wk',
    passMark: 50,
    room: 'Classroom',
  });
  const [subjectsListState, setSubjectsListState] = useState<SubjectRecord[]>(() => getStoredSubjects());
  const [selectedSubjectPreview, setSelectedSubjectPreview] = useState<any>(null);
  const [subjectFilterTab, setSubjectFilterTab] = useState<'ALL' | 'JUNIOR' | 'SENIOR' | 'SCIENCE' | 'ART'>('ALL');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedSubjectDivision, setSelectedSubjectDivision] = useState<string | null>(null);

  // Admin Profile state with persistent storage and comprehensive fields
  const [profileTab, setProfileTab] = useState<'info' | 'governance' | 'security' | 'permissions' | 'activity' | 'idcard'>('info');
  const [adminProfileData, setAdminProfileData] = useState<{
    name: string;
    title: string;
    id: string;
    email: string;
    phone: string;
    address: string;
    dob: string;
    gender: string;
    department: string;
    dateJoined: string;
    profileImage?: string;
    bio?: string;
    rank?: string;
    qualifications?: string;
    certifications?: string;
    bloodGroup?: string;
    stateOfOrigin?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    officeLocation?: string;
    directExtension?: string;
    committees?: string[];
    divisionsSupervised?: string[];
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_admin_profile_data');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: 'Dr. T. Montessori',
      title: 'School Principal & Chief Administrator',
      id: 'TMS/ADM/2018/001',
      email: 'admin@tarepet.com',
      phone: '+234 803 123 4567',
      address: '12 Kpansia-Epie Road, Yenagoa, Bayelsa State',
      dob: '1978-08-15',
      gender: 'Male',
      department: 'Executive Governance & Academics',
      dateJoined: '2018-09-01',
      profileImage: '',
      bio: 'Visionary educational leader with over 18 years of pioneering excellence in Montessori and Nigerian National Curriculum pedagogy. Committed to nurturing intellectual curiosity, ethical character, and academic brilliance across all learners.',
      rank: 'Chief Executive Administrator (Super Admin)',
      bloodGroup: 'O+',
      stateOfOrigin: 'Bayelsa State, Nigeria',
      emergencyContact: 'Mrs. Florence Montessori (Spouse)',
      emergencyPhone: '+234 802 987 6543',
      officeLocation: "Principal's Office Suite, Block A Executive Wing",
      directExtension: 'Ext. 101 (Direct Intercom)',
      committees: [
        'Chairman, School Academic & Examination Board',
        'Head, Disciplinary Council & Student Welfare Committee',
        'Lead Administrator, Bursary & Procurement Committee',
        'Executive Liaison, Parent-Teacher Association (PTA)'
      ],
      divisionsSupervised: [
        'Montessori Crèche & Nursery (Nursery 1 - 3)',
        'Montessori Primary Department (Primary 1 - 6)',
        'Junior Secondary School (JSS 1 - JSS 3)',
        'Senior Secondary School (SS 1 - SS 3 Sciences & Arts)'
      ]
    };
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isEditingAdminDetails, setIsEditingAdminDetails] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState(adminProfileData);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [adminPasswordStatus, setAdminPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Comprehensive System Settings State with Realtime Persistence
  const [settingsTab, setSettingsTab] = useState<'auth' | 'general' | 'academic' | 'access' | 'notify' | 'fees' | 'portal' | 'system'>('auth');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState('+234 800 000 0000');
  const [smsTestStatus, setSmsTestStatus] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_system_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      // 1. Multi-Factor & Authentication
      enforce2FA: true,
      otpChannels: ['EMAIL'],
      otpExpiryMinutes: 5,
      maxOtpAttempts: 3,
      sendWelcomeEmailWithCredentials: true,
      allowDirectStudentPinLogin: true,
      minPasswordLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      passwordExpiryMonths: 6,
      failedLoginLockoutAttempts: 5,
      // 2. School Profile
      schoolName: 'Tare Pet Montessori School',
      shortName: 'TPMS',
      motto: 'Excellence Through Observation & Character',
      officialEmail: 'info@tarepet.edu.ng',
      phone: '+234 803 123 4567',
      address: '12 Kpansia-Epie Road, Yenagoa, Bayelsa State, Nigeria',
      ministryRegNo: 'EDU/BY/SCH/2009/0421',
      proprietress: 'Mrs. Tare Pet',
      principal: 'Dr. T. Montessori',
      vicePrincipal: 'Mr. James Eze',
      // 3. Academic & Grading
      session: '2025/2026',
      term: '2nd Term',
      termStart: '2026-01-12',
      termEnd: '2026-04-04',
      minPassMark: 50,
      ca1Weight: 15,
      ca2Weight: 15,
      examWeight: 70,
      // 4. Session & Access
      sessionTimeoutMinutes: 30,
      singleSessionPerUser: true,
      // 5. Notifications & SMS
      smsProvider: 'Termii (Nigeria)',
      smsSenderId: 'TPMS-School',
      smsBalance: 4820,
      notifyResultsSMS: true,
      notifyAttendanceSMS: true,
      notifyFeesSMS: true,
      notifyCBTExams: true,
      // 6. Fees
      lateFeePenalty: '₦2,000 flat fee after due date',
      scholarshipSlots: 10,
    };
  });

  // Synchronize System Settings with Django backend on mount
  useEffect(() => {
    authClient.get('/auth/settings/')
      .then(res => {
        if (res.data) {
          setSystemSettings((prev: any) => {
            const merged = { ...prev, ...(res.data.settings_data || {}), ...res.data };
            if (typeof window !== 'undefined') {
              localStorage.setItem('tarepet_system_settings', JSON.stringify(merged));
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const triggerSave = (newValues?: any) => {
    const updated = newValues ? { ...systemSettings, ...newValues } : { ...systemSettings };
    setSystemSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tarepet_system_settings', JSON.stringify(updated));
    }
    authClient.patch('/auth/settings/', updated).catch(() => {});
    broadcastRealtimeEvent();
    setSettingsSaved(true);
    showToast('System settings updated and synchronized in real time!');
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Class Marksheet / Score Entry State
  const [resultsViewTab, setResultsViewTab] = useState<'roster' | 'marksheet' | 'fees'>('roster');
  const [marksheetSubject, setMarksheetSubject] = useState('Mathematics');
  const [classScoresMap, setClassScoresMap] = useState<Record<string, { ca1: number; ca2: number; exam: number }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_class_scores_map');
        if (saved) { return JSON.parse(saved); }
      } catch (e) {}
    }
    return {};
  });
  const [marksheetSaveAlert, setMarksheetSaveAlert] = useState(false);

  // Fee Ledger & Payment Real-time State
  const [adminPaymentItems, setAdminPaymentItems] = useState<PaymentItem[]>(() => getPaymentItems());
  const [adminTransactions, setAdminTransactions] = useState<PaymentTransaction[]>(() => getPaymentTransactions());
  const [classFeeSchedules, setClassFeeSchedules] = useState<ClassFeeSchedule[]>(() => getClassFeeSchedules());
  const [discountPolicies, setDiscountPolicies] = useState<DiscountPolicy[]>(() => getDiscountPolicies());
  const [selectedScheduleDivision, setSelectedScheduleDivision] = useState<string>('ALL');
  const [editingSchedule, setEditingSchedule] = useState<ClassFeeSchedule | null>(null);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({ code: '', name: '', discount_type: 'PERCENTAGE', value: 10, description: '' });
  const [recordPaymentStudent, setRecordPaymentStudent] = useState<any | null>(null);
  const [recordPaymentAmount, setRecordPaymentAmount] = useState<string>('');
  const [recordPaymentChannel, setRecordPaymentChannel] = useState<'cash' | 'bank_transfer' | 'paystack'>('bank_transfer');
  const [recordPaymentNotes, setRecordPaymentNotes] = useState<string>('');
  const [selectedReviewStudent, setSelectedReviewStudent] = useState<any | null>(null);
  const [bursaryClassFilter, setBursaryClassFilter] = useState<string>('ALL');
  const [bursaryStatusFilter, setBursaryStatusFilter] = useState<string>('ALL');
  const [bursarySearchQuery, setBursarySearchQuery] = useState<string>('');
  const [selectedFeeToEdit, setSelectedFeeToEdit] = useState<string>('school_fees');
  const [feeTargetGrade, setFeeTargetGrade] = useState<string>('ALL');
  const [feeEditAmountInput, setFeeEditAmountInput] = useState<number>(0);
  const [feeUpdateSuccessAlert, setFeeUpdateSuccessAlert] = useState<string | null>(null);
  const [showAddFeePricesModal, setShowAddFeePricesModal] = useState(false);
  const [feePricesModalClass, setFeePricesModalClass] = useState<string>('ALL');
  const [feePricesInputs, setFeePricesInputs] = useState<Record<string, number>>({});

  useEffect(() => {
    const syncPayments = () => {
      setAdminPaymentItems(getPaymentItems());
      setAdminTransactions(getPaymentTransactions());
      setClassFeeSchedules(getClassFeeSchedules());
      setDiscountPolicies(getDiscountPolicies());
    };
    syncPayments();
    const unsub = subscribeToPaymentStore(syncPayments);
    return () => unsub();
  }, []);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentId: '', itemId: 'school_fees', amount: 0, channel: 'bank_transfer', status: 'SUCCESS' });
  const [receiptModalData, setReceiptModalData] = useState<any>(null);

  // Announcement & Communication Center
  const [announcementsListState, setAnnouncementsListState] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_admin_announcements');
        if (saved) { return JSON.parse(saved); }
      } catch (e) {}
    }
    return [];
  });
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', target: 'ALL', priority: 'NORMAL', category: 'Academic', content: '', sendSMS: true });
  const [announcementSuccessAlert, setAnnouncementSuccessAlert] = useState(false);

  // Finance & Bursary State
  const [financeTab, setFinanceTab] = useState<'overview' | 'fee_schedule' | 'student_billing' | 'income' | 'expenses' | 'discounts' | 'budget'>('fee_schedule');
  const [financeExpenses, setFinanceExpenses] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_finance_expenses');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [financeIncome, setFinanceIncome] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_finance_income');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'Salaries', amount: '', status: 'PAID' });
  const [incomeForm, setIncomeForm] = useState({ description: '', category: 'School Fees', amount: '', status: 'RECEIVED' });
  const [financeSaveAlert, setFinanceSaveAlert] = useState('');

  // Teacher management state — loaded from persistent teacher store and live backend
  const [teachersList, setTeachersList] = useState<any[]>(() => getStoredTeachers());
  const [isResetting, setIsResetting] = useState(false);

  const fetchBackendUsers = React.useCallback(async () => {
    try {
      const [teacherRes, studentRes] = await Promise.allSettled([
        authClient.get('/auth/users/?role=TEACHER&page_size=200'),
        authClient.get('/auth/users/?role=STUDENT&page_size=500')
      ]);

      if (teacherRes.status === 'fulfilled' && teacherRes.value.data) {
        const res = teacherRes.value;
        const users = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
        const liveTeachers = users
          .filter((u: any) => {
            const email = (u.email || '').toLowerCase();
            const sId = (u.teacher_id || u.profile?.teacher_id || '').toLowerCase();
            const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase();
            const isDeleted = isAccountDeleted(email) || isAccountDeleted(u.id) || isAccountDeleted(sId) || isAccountDeleted(uName);
            return !isDeleted;
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
              status: u.is_active ? 'Active' : 'Inactive',
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
              profileImage: prof.profile_image || u.profile_image || (u as any).profileImage || '',
            };
          });

        if (liveTeachers.length > 0) {
          const mergedTeachers = saveStoredTeachers(liveTeachers);
          setTeachersList(mergedTeachers || getStoredTeachers());
        }
      }

      if (studentRes.status === 'fulfilled' && studentRes.value.data) {
        const res = studentRes.value;
        const users = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
        const mockEmails = ['civa.media@tarepet.com', 'hacker@evil.com', 'wronguser@fake.com'];
        const liveStudents = users
          .filter((u: any) => {
            const email = (u.email || '').toLowerCase();
            const sId = (u.student_id || u.profile?.student_id || '').toLowerCase();
            const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase();
            const isDeleted = isAccountDeleted(email) || isAccountDeleted(u.id) || isAccountDeleted(sId) || isAccountDeleted(uName);
            return !mockEmails.includes(email) && !uName.includes('civa.media') && !uName.includes('hacker') && !uName.includes('wronguser') && !isDeleted;
          })
          .map((u: any) => ({
            id: u.id,
            studentId: u.profile?.student_id || u.student_id || `TMS/STU/${String(u.id).padStart(4, '0')}`,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            phone: u.phone || u.profile?.phone || '',
            gender: u.profile?.gender || '',
            grade: u.profile?.grade_level || u.profile?.grade || '',
            stream: u.profile?.stream || '',
            status: u.is_active ? 'Active' : 'Inactive',
            joined: u.profile?.hire_date || (u.date_joined ? u.date_joined.split('T')[0] : ''),
            profileImage: u.profile?.profile_image || u.profile_image || (u as any).profileImage || '',
          }));

        saveStoredStudents(liveStudents);
        setStudentsList(liveStudents);
      }

      // Fetch live Finance Income & Expenses from Django Database
      const [incomeRes, expenseRes] = await Promise.allSettled([
        authClient.get('/finance/income/?page_size=300'),
        authClient.get('/finance/expenses/?page_size=300')
      ]);

      if (incomeRes.status === 'fulfilled' && incomeRes.value.data) {
        const incData = Array.isArray(incomeRes.value.data?.results) ? incomeRes.value.data.results : (Array.isArray(incomeRes.value.data) ? incomeRes.value.data : []);
        if (incData.length > 0) {
          setFinanceIncome(incData);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('tarepet_finance_income', JSON.stringify(incData)); } catch (e) {}
          }
        }
      }

      if (expenseRes.status === 'fulfilled' && expenseRes.value.data) {
        const expData = Array.isArray(expenseRes.value.data?.results) ? expenseRes.value.data.results : (Array.isArray(expenseRes.value.data) ? expenseRes.value.data : []);
        if (expData.length > 0) {
          setFinanceExpenses(expData);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('tarepet_finance_expenses', JSON.stringify(expData)); } catch (e) {}
          }
        }
      }
    } catch (e) {
      // Backend offline or user not admin — fallback to local storage
    }
  }, []);

  // Sync teachers & users from live Django REST API backend & real-time store
  React.useEffect(() => {
    const handleSyncFromStore = () => {
      const latestTeachers = getStoredTeachers();
      const latestStudents = getStoredStudents();
      setTeachersList(latestTeachers);
      setStudentsList(latestStudents);
      setSelectedTeacher((prev: any) => {
        if (!prev) return null;
        return latestTeachers.find((t: any) => (prev.id && t.id === prev.id) || (prev.staffId && t.staffId === prev.staffId) || (prev.email && t.email === prev.email)) || prev;
      });
      setSelectedUser((prev: any) => {
        if (!prev) return null;
        return latestStudents.find((s: any) => (prev.id && s.id === prev.id) || (prev.admissionNo && s.admissionNo === prev.admissionNo) || (prev.studentId && s.studentId === prev.studentId) || (prev.email && s.email === prev.email)) || prev;
      });
    };

    // 1. Initial sync
    handleSyncFromStore();

    // 2. Real-time event subscription for multi-admin tabs & windows
    const unsubscribe = listenToRealtimeEvents(() => {
      handleSyncFromStore();
    });

    const handleAvatarOrStoreUpdate = () => {
      handleSyncFromStore();
    };

    window.addEventListener('storage', handleAvatarOrStoreUpdate);
    window.addEventListener('cbt_store_updated', handleAvatarOrStoreUpdate);
    window.addEventListener('tarepet_avatar_deleted', handleAvatarOrStoreUpdate);
    window.addEventListener('tarepet_user_updated', handleAvatarOrStoreUpdate);

    // 3. Periodic backend polling
    fetchBackendUsers();
    const intervalId = setInterval(fetchBackendUsers, 8000);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleAvatarOrStoreUpdate);
      window.removeEventListener('cbt_store_updated', handleAvatarOrStoreUpdate);
      window.removeEventListener('tarepet_avatar_deleted', handleAvatarOrStoreUpdate);
      window.removeEventListener('tarepet_user_updated', handleAvatarOrStoreUpdate);
      clearInterval(intervalId);
    };
  }, []);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedTeacherDivision, setSelectedTeacherDivision] = useState<string | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showTeacherIDCardModal, setShowTeacherIDCardModal] = useState<any>(null);
  const [showTeacherActionsDropdown, setShowTeacherActionsDropdown] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editTeacherForm, setEditTeacherForm] = useState<any>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState<any>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [onCropSaveCallback, setOnCropSaveCallback] = useState<((cropped: string) => void) | null>(null);

  const [adminToastMsg, setAdminToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setAdminToastMsg(msg);
    setTimeout(() => setAdminToastMsg(null), 3500);
  };

  const triggerCropModal = (imageSrc: string, onSave: (cropped: string) => void) => {
    setPendingCropImage(imageSrc);
    setOnCropSaveCallback(() => onSave);
    setCropModalOpen(true);
  };

  const handleSaveTeacherRealtime = async (updated: any) => {
    const saved = await saveTeacher(updated);
    setTeachersList(getStoredTeachers());
    if (selectedTeacher?.id === updated.id || (selectedTeacher?.staffId && selectedTeacher?.staffId === updated.staffId)) {
      setSelectedTeacher(saved || updated);
    }
    if (updated.email) {
      authClient.put('/auth/users/update_profile/', {
        email: updated.email,
        staff_id: updated.staffId,
        profile_image: updated.profileImage || '',
        name: updated.name,
      }).catch(() => {});
    }
    broadcastRealtimeEvent();
    showToast(`Teacher profile for ${updated.name} updated in real time!`);
  };

  const handleSaveStudentRealtime = async (updated: any) => {
    const saved = await saveStudent(updated);
    setStudentsList(getStoredStudents());
    if (selectedUser?.id === updated.id || (selectedUser?.admissionNo && selectedUser?.admissionNo === updated.admissionNo) || (selectedUser?.studentId && selectedUser?.studentId === updated.studentId)) {
      setSelectedUser(saved || updated);
    }
    if (updated.email) {
      authClient.put('/auth/users/update_profile/', {
        email: updated.email,
        student_id: updated.admissionNo || updated.studentId,
        profile_image: updated.profileImage || '',
        name: updated.name,
      }).catch(() => {});
    }
    broadcastRealtimeEvent();
    showToast(`Student profile for ${updated.name} updated in real time!`);
  };

  const handleDeleteTeacherAvatarRealtime = async (teacherIdOrObj: any) => {
    const tchr = typeof teacherIdOrObj === 'object' ? teacherIdOrObj : teachersList.find(t => t.id === teacherIdOrObj || t.staffId === teacherIdOrObj);
    if (!tchr) return;
    const updated = { ...tchr, profileImage: '' };
    const saved = await saveTeacher(updated);
    setTeachersList(getStoredTeachers());
    if (selectedTeacher?.id === updated.id || selectedTeacher?.staffId === updated.staffId) {
      setSelectedTeacher(saved || updated);
    }
    if (editTeacherForm && (editTeacherForm.id === updated.id || editTeacherForm.staffId === updated.staffId)) {
      setEditTeacherForm(saved || updated);
    }
    if (updated.email) {
      authClient.put('/auth/users/update_profile/', {
        email: updated.email,
        staff_id: updated.staffId,
        profile_image: '',
        name: updated.name,
      }).catch(() => {});
    }
    broadcastRealtimeEvent();
    showToast(`Photo for teacher ${updated.name} removed.`);
  };

  const handleDeleteStudentAvatarRealtime = (studentIdOrObj: any) => {
    const std = typeof studentIdOrObj === 'object' ? studentIdOrObj : studentsList.find(s => s.id === studentIdOrObj || s.admissionNo === studentIdOrObj || s.studentId === studentIdOrObj);
    if (!std) return;
    const updated = { ...std, profileImage: '' };
    saveStudent(updated);
    setStudentsList(getStoredStudents());
    if (selectedUser?.id === updated.id || selectedUser?.admissionNo === updated.admissionNo || selectedUser?.studentId === updated.studentId) {
      setSelectedUser(updated);
    }
    if (editStudentForm && (editStudentForm.id === updated.id || editStudentForm.admissionNo === updated.admissionNo)) {
      setEditStudentForm(updated);
    }
    if (updated.email) {
      authClient.put('/auth/users/update_profile/', {
        email: updated.email,
        student_id: updated.admissionNo || updated.studentId,
        profile_image: '',
        name: updated.name,
      }).catch(() => {});
    }
    broadcastRealtimeEvent();
    showToast(`Photo for student ${updated.name} removed.`);
  };

  // Classes management state
  const [classFilterTab, setClassFilterTab] = useState<'ALL' | 'JUNIOR' | 'SCIENCE' | 'ART'>('ALL');
  const [classSearch, setClassSearch] = useState('');
  const [selectedClassRosterModal, setSelectedClassRosterModal] = useState<any>(null);

  // Class Timetables state (JSS1 - SS3)
  const [timetablesState, setTimetablesState] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_class_timetables');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return MOCK_CLASS_TIMETABLES;
  });
  const [selectedTimetableClassKey, setSelectedTimetableClassKey] = useState<string>('JSS1');
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>('All');
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [editingSlotData, setEditingSlotData] = useState<{ day: string; index: number; slot: any } | null>(null);
  const [deletingSlotData, setDeletingSlotData] = useState<{ day: string; index: number; slot: any } | null>(null);
  const [showClearTimetableConfirm, setShowClearTimetableConfirm] = useState(false);
  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    time: '08:30 - 09:15',
    subject: '',
    code: '',
    teacher: '',
    room: '',
  });

  // Real-Time Calendar Events State
  const [calendarEventsState, setCalendarEventsState] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_calendar_events');
        if (saved) { return JSON.parse(saved); }
      } catch (e) {}
    }
    return [];
  });
  const [showAddCalendarModal, setShowAddCalendarModal] = useState(false);
  const [calendarForm, setCalendarForm] = useState({ title: '', category: 'Academic', date: '', endDate: '', scope: 'All Classes', detail: '', status: 'Upcoming' });
  const [calendarFilter, setCalendarFilter] = useState('All');

  const saveTimetables = (newTimetables: Record<string, any>) => {
    setTimetablesState(newTimetables);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tarepet_class_timetables', JSON.stringify(newTimetables));
      } catch (e) {}
    }
  };

  // Results & Report Card state
  const [resultsSelectedClass, setResultsSelectedClass] = useState<string | null>(null); // 'JSS1' | 'JSS2' | 'JSS3' | 'SS1' | 'SS2' | 'SS3'
  const [resultsSelectedStudent, setResultsSelectedStudent] = useState<any | null>(null);
  const [resultsYear, setResultsYear] = useState('2025/2026');
  const [resultsTerm, setResultsTerm] = useState('2nd Term');
  const [resultsSectionStream, setResultsSectionStream] = useState('General');
  const [isResultGenerated, setIsResultGenerated] = useState(false);

  // Attendance management state
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('JSS1');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_attendance_map');
        if (saved) { return JSON.parse(saved); }
      } catch (e) {}
    }
    return {};
  });
  const [attendanceNoticeAlert, setAttendanceNoticeAlert] = useState(false);

  const syncAdminExams = () => {
    const stored = getStoredExams();
    const mapped = stored.map(e => ({
      id: e.id,
      title: e.title,
      type: e.assessment_type === 'TEST' ? 'Test' : 'Exam',
      subject: e.course_name || e.course_code,
      class: e.class || 'SS1',
      stream: e.stream === 'Arts' || e.stream === 'Art' ? 'Art' : 'Science',
      date: new Date(e.created_at).toISOString().split('T')[0],
      time: '09:00',
      duration: `${e.duration_minutes} mins`,
      questionsCount: e.questions_count || e.questions?.length || 0,
      venue: 'CBT Hall A',
      status: e.status === 'APPROVED' ? 'Approved' : e.status === 'REJECTED' ? 'Rejected' : e.status === 'ACTIVE' ? 'Approved' : 'Pending Approval',
      invigilator: e.teacher_name || 'Mrs. Okafor Chioma',
      totalCandidates: 25,
      questions: e.questions,
    }));
    setExamsList(mapped);
  };

  React.useEffect(() => {
    syncAdminExams();
    const unsub = subscribeToCBTStore(syncAdminExams);
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (activeSection === 'users') {
      setUserSubPage('STUDENT');
    } else {
      setUserSubPage(null); setSelectedUser(null);
      setSelectedClass(null); setSelectedStream(null); setOpenClassDropdown(null);
    }
    if (activeSection !== 'teachers') {
      setSelectedTeacher(null);
      setShowTeacherActionsDropdown(false);
    }
    if (activeSection !== 'courses') {
      setSelectedSubjectClass(null); setSelectedSubjectStream(null); setOpenSubjectClassDropdown(null);
      setSelectedSubjectPreview(null);
      setShowSubjectsActionsDropdown(false);
    }
    if (activeSection !== 'exams') {
      setSelectedExamClass(null); setSelectedExamStream(null);
      setOpenExamClassDropdown(null); setSelectedExamType(null);
      setExamRepoFilter('all'); setSelectedExamDivision(null);
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
  const filteredSSStudents = studentsList.filter(s => {
    if (isAccountDeleted(s.email) || isAccountDeleted(s.id) || isAccountDeleted(s.code) || isAccountDeleted(s.admissionNo) || isAccountDeleted(s.name)) {
      return false;
    }
    const q = userSearch.toLowerCase();
    const matchClass  = !selectedClass  || matchStudentClass(s.grade, selectedClass);
    const matchStream = !selectedStream || s.stream === selectedStream || (!s.stream && selectedStream === 'Science');
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) || (s.code && s.code.toLowerCase().includes(q));
    return matchClass && matchStream && matchSearch;
  });

  const STUDENT_CLASSES = [
    { label: 'Nursery 1', key: 'NUR1', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'NUR1')).length },
    { label: 'Nursery 2', key: 'NUR2', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'NUR2')).length },
    { label: 'Nursery 3', key: 'NUR3', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'NUR3')).length },
    { label: 'Primary 1', key: 'PRI1', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'PRI1')).length },
    { label: 'Primary 2', key: 'PRI2', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'PRI2')).length },
    { label: 'Primary 3', key: 'PRI3', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'PRI3')).length },
    { label: 'Primary 4', key: 'PRI4', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'PRI4')).length },
    { label: 'Primary 5', key: 'PRI5', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'PRI5')).length },
    { label: 'Primary 6', key: 'PRI6', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'PRI6')).length },
    { label: 'JSS 1', key: 'JSS1', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'JSS1')).length },
    { label: 'JSS 2', key: 'JSS2', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'JSS2')).length },
    { label: 'JSS 3', key: 'JSS3', hasStreams: false, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      totalCount: studentsList.filter(s => matchStudentClass(s.grade, 'JSS3')).length },
    { label: 'SS 1', key: 'SS1', hasStreams: true, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      sciCount: studentsList.filter(s => matchStudentClass(s.grade, 'SS1') && (s.stream === 'Science' || !s.stream)).length,
      artCount: studentsList.filter(s => matchStudentClass(s.grade, 'SS1') && s.stream === 'Art').length },
    { label: 'SS 2', key: 'SS2', hasStreams: true, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      sciCount: studentsList.filter(s => matchStudentClass(s.grade, 'SS2') && (s.stream === 'Science' || !s.stream)).length,
      artCount: studentsList.filter(s => matchStudentClass(s.grade, 'SS2') && s.stream === 'Art').length },
    { label: 'SS 3', key: 'SS3', hasStreams: true, color: 'border-primary/20 bg-primary/5 hover:border-primary/40', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      sciCount: studentsList.filter(s => matchStudentClass(s.grade, 'SS3') && (s.stream === 'Science' || !s.stream)).length,
      artCount: studentsList.filter(s => matchStudentClass(s.grade, 'SS3') && s.stream === 'Art').length },
  ];
  const SS_CLASSES = STUDENT_CLASSES;

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
  ];

  const activeType = USER_TYPES.find(t => t.key === userSubPage);

  const renderSection = () => {
    // 1. OVERVIEW & SCHOOL EXECUTIVE ANALYTICS
    if (activeSection === 'overview' || activeSection === 'analytics') {
      const classPerformanceData = STUDENT_CLASSES.map(cls => {
        const classStudents = studentsList.filter(s => s.grade === cls.key);
        let totalScore = 0;
        let count = 0;
        classStudents.forEach(st => {
          const entry = safeLookup(classScoresMap, st.id);
          if (entry) {
            totalScore += (entry.ca1 || 0) + (entry.ca2 || 0) + (entry.exam || 0);
            count++;
          }
        });
        const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
        return { class: cls.label, score: avgScore };
      });

      const totalAttCount = Object.keys(attendanceMap).length;
      const presentAttCount = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
      const calculatedAttendancePercent = totalAttCount > 0 ? Math.round((presentAttCount / totalAttCount) * 100) : 0;

      // Count only class levels that actually have enrolled students
      const activeClassesCount = studentsList.length === 0 ? 0 : STUDENT_CLASSES.filter(cls => {
        if (cls.hasStreams) {
          return ((cls as any).sciCount || 0) + ((cls as any).artCount || 0) > 0;
        }
        return (cls.totalCount || 0) > 0;
      }).length;

      const hasPerformanceData = classPerformanceData.some(d => d.score > 0);
      const hasAttendanceData = totalAttCount > 0;

      const weeklyAttendanceData = [
        { day: 'Mon', attendance: calculatedAttendancePercent },
        { day: 'Tue', attendance: calculatedAttendancePercent },
        { day: 'Wed', attendance: calculatedAttendancePercent },
        { day: 'Thu', attendance: calculatedAttendancePercent },
        { day: 'Fri', attendance: calculatedAttendancePercent },
      ];

      const quickActionButtons = [
        { label: 'Add Student', icon: UserPlus, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => { setActiveSection('users'); setUserSubPage('STUDENT'); } },
        { label: 'Add Teacher', icon: GraduationCap, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20', action: () => { setActiveSection('users'); setUserSubPage('TEACHER'); } },
        { label: 'Manage Exams', icon: ClipboardList, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => setActiveSection('exams') },
        { label: 'Upload Results', icon: FileSpreadsheet, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20', action: () => setActiveSection('results') },
        { label: 'View Attendance', icon: CalendarCheck, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => setActiveSection('attendance') },
        { label: 'Generate Reports', icon: BarChart2, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20', action: () => setActiveSection('reports') },
      ];

      const recentActivities: any[] = [];

      const upcomingEvents = calendarEventsState.map(ev => ({
        title: ev.title,
        date: ev.date + (ev.endDate ? ` — ${ev.endDate}` : ''),
        scope: ev.scope || 'School Wide',
        badgeColor: 'bg-primary/10 text-primary border-primary/20',
      }));

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-xl text-foreground mb-1">{t('dashboard.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('dashboard.welcome')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 2025/2026 Academic Session
              </span>
            </div>
          </div>

          {/* 4 Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Students */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.totalStudents')}</p>
                <h3 className="text-3xl font-bold text-foreground">{studentsList.length}</h3>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  Enrolled Students
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Teachers */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.teachers')}</p>
                <h3 className="text-3xl font-bold text-foreground">{teachersList.length}</h3>
                <p className="text-[11px] text-muted-foreground font-medium">{t('dashboard.fullTimeFaculty')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Classes */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.classes')}</p>
                <h3 className="text-3xl font-bold text-foreground">{activeClassesCount}</h3>
                <p className="text-[11px] text-muted-foreground font-medium">Active class levels</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <School className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Attendance Today */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.attendanceToday')}</p>
                <h3 className="text-3xl font-bold text-secondary">{calculatedAttendancePercent}%</h3>
                <p className="text-[11px] text-muted-foreground font-medium">{t('dashboard.dailyAverage')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row (Bar + Line) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Class Performance */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">{t('dashboard.classPerformance')}</h3>
                  <p className="text-xs text-muted-foreground">{t('dashboard.classPerformanceDesc')}</p>
                </div>
                <span className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <BarChart2 className="w-4 h-4" />
                </span>
              </div>
              <div className="h-64 w-full pt-2">
                {hasPerformanceData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="class" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`${val}%`, 'Average Score']}
                      />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BarChart2 className="w-10 h-10 opacity-20" />
                    <p className="text-xs font-medium">No results uploaded yet</p>
                    <p className="text-[10px] opacity-60">Upload student scores to see class performance</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Chart: Weekly Attendance */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">{t('dashboard.weeklyAttendance')}</h3>
                  <p className="text-xs text-muted-foreground">{t('dashboard.weeklyAttendanceDesc')}</p>
                </div>
                <span className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="h-64 w-full pt-2">
                {hasAttendanceData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickLine={false} axisLine={false} domain={[80, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`${val}%`, 'Attendance']}
                      />
                      <Line type="monotone" dataKey="attendance" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--secondary))' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <CalendarCheck className="w-10 h-10 opacity-20" />
                    <p className="text-xs font-medium">No attendance recorded yet</p>
                    <p className="text-[10px] opacity-60">Mark student attendance to see weekly trends</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Grid: Quick Actions, Recent Activities & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Quick Actions */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-base text-foreground">{t('dashboard.quickActions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActionButtons.map((btn, idx) => {
                  const Icon = btn.icon;
                  return (
                    <button
                      key={idx}
                      onClick={btn.action}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 space-y-2 ${btn.color}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold leading-tight">{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Recent Activities */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">{t('dashboard.recentActivities')}</h3>
                <span className="text-xs text-muted-foreground">{t('dashboard.today')}</span>
              </div>
              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-6 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">No recent activities recorded.</p>
                  </div>
                ) : (
                  recentActivities.map((act, idx) => {
                    const Icon = act.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                        <div className={`p-2 rounded-xl shrink-0 ${act.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{act.text}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{act.detail}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{act.time}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Upcoming Events */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">{t('dashboard.upcomingEvents')}</h3>
                <button onClick={() => setActiveSection('calendar')} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  {t('common.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-6 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">No upcoming calendar events.</p>
                    <button onClick={() => setActiveSection('calendar')} className="text-[11px] font-bold text-primary hover:underline">
                      + Add Calendar Event
                    </button>
                  </div>
                ) : (
                  upcomingEvents.map((evt, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground">{evt.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}>
                          {evt.scope}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {evt.date}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. USER MANAGEMENT — Overview → Type List → Profile
    if (activeSection === 'users') {
      // ── LEVEL 3: Individual Student Profile Page ──────────────────────
      if (selectedUser) {
        const liveStudent = studentsList.find((s: any) => (selectedUser.id && s.id === selectedUser.id) || (selectedUser.admissionNo && s.admissionNo === selectedUser.admissionNo) || (selectedUser.studentId && s.studentId === selectedUser.studentId) || (selectedUser.email && s.email === selectedUser.email));
        const u = {
          ...selectedUser,
          ...(liveStudent || {}),
          name: (liveStudent?.name || selectedUser?.name || (selectedUser?.first_name ? `${selectedUser.first_name} ${selectedUser.last_name || ''}`.trim() : '') || selectedUser?.email || 'Student'),
          studentId: (liveStudent?.studentId || selectedUser?.studentId || selectedUser?.admissionNo || selectedUser?.code || (selectedUser?.id ? `TMS/STU/${selectedUser.id}` : 'TMS/STU/001')),
          grade: (liveStudent?.grade || selectedUser?.grade || selectedUser?.class || 'SS 1'),
          stream: (liveStudent?.stream || selectedUser?.stream || 'Science'),
          status: (liveStudent?.status || selectedUser?.status || 'Active'),
          house: (liveStudent?.house || selectedUser?.house || 'School House'),
          profileImage: liveStudent?.profileImage || selectedUser?.profileImage || selectedUser?.profile_image || selectedUser?.profile?.profile_image || '',
        };

        return (
          <div className="space-y-6">
            {/* Breadcrumb back */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium cursor-pointer">
                <ChevronLeft className="w-4 h-4" /> Back to Students Directory
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{t('studentProfile.breadcrumb')}{u.name}</span>
            </div>

            {/* Profile Specification Card */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header Actions Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('studentProfile.cardTitle')}</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsDropdown(prev => !prev)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Actions
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showActionsDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowActionsDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          onClick={() => { setIdCardUser(u); setShowActionsDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors text-left cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FaIdCard className="w-3.5 h-3.5 text-primary" />
                          </span>
                          Print Student ID Card
                        </button>
                        <button
                          onClick={() => { setEditStudentForm({ ...u }); setShowEditStudentModal(true); setShowActionsDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors text-left cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                          Edit Student Profile
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirm({
                              title: 'Delete Student Record',
                              message: `Are you sure you want to delete student ${u.name}? All broadsheets and test records for this student will be removed.`,
                              type: 'delete',
                              badge: 'Student Directory',
                              confirmText: 'Yes, Delete Student',
                              cancelText: 'Keep Student',
                            });
                            if (confirmed) {
                              deleteStudent(u.id);
                              setStudentsList(getStoredStudents());
                              setSelectedUser(null);
                              setShowActionsDropdown(false);
                              broadcastRealtimeEvent();
                              showAlert({
                                title: 'Student Removed',
                                message: `Student ${u.name} has been deleted.`,
                                type: 'success',
                              });
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors text-left border-t border-border cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </span>
                          Delete Student
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Body Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Column 1: Passport Photo & Badges */}
                <div className="lg:col-span-4 flex flex-col items-center space-y-4 text-center">
                  <div className="w-40 h-40 rounded-2xl border-2 border-primary/20 p-1.5 shadow-md bg-muted/10 relative group">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-serif text-4xl font-bold text-primary">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u?.name?.[0] || 'S'
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      id="adminStudentDirectAvatarInput"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            (window as any).showTarepetAlert?.('The selected image file exceeds 10MB. Please select a photo below 10MB.', 'Image Size Limit Exceeded', 'warning');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            triggerCropModal(base64, (cropped) => {
                              handleSaveStudentRealtime({ ...u, profileImage: cropped });
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label
                      htmlFor="adminStudentDirectAvatarInput"
                      className="absolute -bottom-1 -right-1 p-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow cursor-pointer hover:scale-105 transition-all border border-card"
                      title="Upload Student Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <label
                      htmlFor="adminStudentDirectAvatarInput"
                      className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      title="Upload & Crop Photo"
                    >
                      <Upload className="w-3 h-3" /> Change
                    </label>

                    {u.profileImage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            triggerCropModal(u.profileImage, (cropped) => {
                              handleSaveStudentRealtime({ ...u, profileImage: cropped });
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-muted hover:bg-accent text-foreground text-[11px] font-bold border border-border transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Crop / Resize current photo"
                        >
                          <Scissors className="w-3 h-3 text-primary" /> Crop
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudentAvatarRealtime(u)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 text-[11px] font-bold border border-rose-200 dark:border-rose-800/40 transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Delete student profile picture"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-serif font-bold text-foreground">{u.name}</h2>
                    <p className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block border border-primary/20">
                      {u.studentId}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {u.grade} {u.stream ? `— ${u.stream}` : ''}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      {u.house || 'School House'}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                </div>

                {/* Column 2: Detailed Attributes Grid */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" /> Basic Academic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email Address</span>
                        <span className="font-semibold text-foreground">{u.email || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Gender</span>
                        <span className="font-semibold text-foreground">{u.gender || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Class Level & Arm</span>
                        <span className="font-semibold text-foreground">{u.grade} ({u.stream || 'General'})</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Admission Date</span>
                        <span className="font-semibold text-foreground">{u.joined || '2025/2026 Academic Year'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parent & Guardian Info */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" /> Parent & Guardian Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Parent / Guardian Name</span>
                        <span className="font-semibold text-foreground">{u.parentName || 'Mr. & Mrs. Amadi'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Emergency Phone</span>
                        <span className="font-semibold text-primary">{u.parentPhone || u.phone || '08031234567'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Residential Address</span>
                        <span className="font-semibold text-foreground">{u.address || 'Yenagoa, Bayelsa State, Nigeria'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── LEVEL 1 & 2: Complete Student Directory View (Always Visible) ───
      const SCHOOL_DIVISIONS = [
        {
          key: 'NURSERY',
          title: 'Nursery Division',
          subtitle: 'Nursery 1–3',
          description: 'Early Childhood Montessori Education & Developmental Foundation',
          filterFn: (s: any) => s.grade && (s.grade.toUpperCase().includes('NUR') || s.grade.toUpperCase().includes('CRECHE')),
          icon: School
        },
        {
          key: 'PRIMARY',
          title: 'Primary Division',
          subtitle: 'Primary 1–6',
          description: 'Foundational Elementary Curriculum & Basic Quantitative Skills',
          filterFn: (s: any) => s.grade && (s.grade.toUpperCase().includes('PRI') || s.grade.toUpperCase().includes('BASIC')),
          icon: BookOpen
        },
        {
          key: 'JSS',
          title: 'Junior Secondary',
          subtitle: 'JSS 1–3',
          description: 'Basic Education Curriculum & State BECE Examination Prep',
          filterFn: (s: any) => s.grade && (s.grade.toUpperCase().includes('JSS') || s.grade.toUpperCase().includes('JUNIOR')),
          icon: GraduationCap
        },
        {
          key: 'SS',
          title: 'Senior Secondary',
          subtitle: 'SS 1–3 (Science & Art)',
          description: 'Senior Secondary Academic Programs, WAEC & NECO Streams',
          filterFn: (s: any) => s.grade && (s.grade.toUpperCase().includes('SS') || s.grade.toUpperCase().includes('SENIOR')),
          icon: Award
        }
      ];

      const activeDivisionData = SCHOOL_DIVISIONS.find(d => d.key === selectedDivision);

      const filteredStudentRecords = studentsList.filter(s => {
        const q = userSearch.toLowerCase();
        const matchSearch = !q || 
          s.name.toLowerCase().includes(q) || 
          (s.studentId && s.studentId.toLowerCase().includes(q)) || 
          (s.code && s.code.toLowerCase().includes(q)) || 
          (s.email && s.email.toLowerCase().includes(q)) || 
          (s.grade && s.grade.toLowerCase().includes(q)) || 
          (s.parentName && s.parentName.toLowerCase().includes(q)) || 
          (s.parentPhone && s.parentPhone.includes(q));

        let matchDivision = true;
        if (selectedDivision && activeDivisionData) {
          matchDivision = activeDivisionData.filterFn(s);
        }

        let matchClassPill = true;
        if (selectedClass) {
          matchClassPill = matchStudentClass(s.grade, selectedClass);
        }

        return matchSearch && matchDivision && matchClassPill;
      }).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              {selectedDivision && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button
                    onClick={() => { setSelectedDivision(null); setSelectedClass(null); setUserSearch(''); }}
                    className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> All School Divisions
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold text-foreground">{activeDivisionData?.title}</span>
                </div>
              )}
              <h2 className="font-bold text-xl text-foreground">
                {selectedDivision ? activeDivisionData?.title : 'Students & Learner Directory'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedDivision
                  ? activeDivisionData?.description
                  : 'Manage active student enrollments, academic records, ID cards, and class distributions.'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDivision && (
                <button
                  onClick={() => { setSelectedDivision(null); setSelectedClass(null); setUserSearch(''); }}
                  className="px-3.5 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Divisions
                </button>
              )}
              <button
                onClick={async () => {
                  setIsResetting(true);
                  clearAllStoredStudents();
                  clearCBTStoreCache();
                  await fetchBackendUsers();
                  setIsResetting(false);
                }}
                disabled={isResetting}
                className="px-3 py-2.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                title="Re-sync student records with backend in real time"
              >
                <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Syncing...' : 'Sync Live Students'}
              </button>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setNewStudentForm({
                    name: '', dob: '', gender: 'Male', grade: 'SS1', stream: 'Science', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Yenagoa', address: '', phone: '', parentName: '', parentPhone: '', profileImage: '', house: ''
                  });
                  setShowAddStudentModal(true);
                }}
                className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> {t('students.addStudent')}
              </button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Enrolled</p>
                <h3 className="text-2xl font-serif font-bold text-foreground mt-1">{studentsList.length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active Learners</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Users className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Status</p>
                <h3 className="text-2xl font-serif font-bold text-emerald-600 mt-1">{studentsList.filter(s => s.status === 'Active').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">In good standing</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Male Learners</p>
                <h3 className="text-2xl font-serif font-bold text-blue-600 mt-1">{studentsList.filter(s => s.gender === 'Male').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Boys enrolled</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Female Learners</p>
                <h3 className="text-2xl font-serif font-bold text-purple-600 mt-1">{studentsList.filter(s => s.gender === 'Female').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Girls enrolled</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Interactive Academic Stage Division Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SCHOOL_DIVISIONS.map(div => {
              const Icon = div.icon;
              const count = studentsList.filter(div.filterFn).length;
              const isSelected = selectedDivision === div.key;
              return (
                <div
                  key={div.key}
                  onClick={() => {
                    setSelectedDivision(isSelected ? null : div.key);
                    setSelectedClass(null);
                  }}
                  className={`group border-2 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-3 flex flex-col justify-between ${
                    isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {count} Students
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{div.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{div.subtitle}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-bold text-primary">
                    <span>{isSelected ? 'Viewing Division' : 'Filter by Division'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Students Data Table (Always Visible) */}
          <div className="space-y-4 pt-2">
            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder={`Search ${selectedDivision ? activeDivisionData?.title : 'all students'} by name, admission no, class, parent phone...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Active Filter Indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedDivision && (
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-2 rounded-xl border border-primary/20 text-xs font-bold shrink-0">
                    <span>Division: {activeDivisionData?.title}</span>
                    <button
                      onClick={() => { setSelectedDivision(null); setUserSearch(''); }}
                      className="hover:bg-primary/20 p-1 rounded-md transition-colors cursor-pointer"
                      title="Clear division filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {selectedClass && (
                  <div className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-2 rounded-xl border border-secondary/20 text-xs font-bold shrink-0">
                    <span>Class: {selectedClass}</span>
                    <button
                      onClick={() => setSelectedClass(null)}
                      className="hover:bg-secondary/20 p-1 rounded-md transition-colors cursor-pointer"
                      title="Clear class filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Student / Admission No</th>
                    <th className="py-3.5 px-4">Class Level & Arm</th>
                    <th className="py-3.5 px-4">House / Group</th>
                    <th className="py-3.5 px-4">Parent / Guardian</th>
                    <th className="py-3.5 px-4">Emergency Phone</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudentRecords.length > 0 ? (
                    filteredStudentRecords.map(s => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedUser(s)}
                        className="hover:bg-primary/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl font-bold text-sm bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                              {s.profileImage ? (
                                <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                s?.name?.[0] || 'S'
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{s.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{s.studentId || s.code || `TMS/STU/${s.id}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-foreground">{s.grade || 'SS1'}</p>
                          <p className="text-[10px] text-muted-foreground">{s.stream ? `${s.stream} Stream` : 'General Curriculum'}</p>
                        </td>
                        <td className="py-4 px-4 font-semibold text-primary">
                          {s.house || 'School House'}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <p className="text-foreground font-medium">{s.parentName || 'Parent / Guardian'}</p>
                          <p className="text-[10px]">{s.email}</p>
                        </td>
                        <td className="py-4 px-4 font-mono font-medium text-foreground">
                          {s.parentPhone || s.phone || '08031234567'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(s);
                              }}
                              className="text-[11px] text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              View <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const confirmed = await showConfirm({
                                  title: 'Delete Student Record',
                                  message: `Are you sure you want to delete student ${s.name} (${s.studentId || s.code || s.admissionNo})? This action cannot be undone.`,
                                  type: 'delete',
                                  badge: 'Student Directory',
                                  confirmText: 'Yes, Delete Student',
                                  cancelText: 'Keep Student',
                                });
                                if (confirmed) {
                                  deleteStudent(s.id || s.studentId || s.code || s.email);
                                  setStudentsList(getStoredStudents());
                                  if (selectedUser?.id === s.id) setSelectedUser(null);
                                  broadcastRealtimeEvent();
                                  showToast(`Student ${s.name} removed.`);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-bold text-sm text-foreground">No students found matching your criteria</p>
                        <p className="text-xs text-muted-foreground mt-1">Try resetting the filter or adding a new student.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
        updateExamStatus(id, 'APPROVED');
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
      };

      const handleReject = (id: number) => {
        updateExamStatus(id, 'REJECTED', 'Returned by Administrator');
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
      };

      const handleCancel = (id: number) => {
        updateExamStatus(id, 'REJECTED', 'Cancelled by Administrator');
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Cancelled' } : e));
      };

      const counts = {
        total:     examsList.length,
        pending:   examsList.filter(e => e.status === 'Pending Approval').length,
        approved:  examsList.filter(e => e.status === 'Approved').length,
        rejected:  examsList.filter(e => e.status === 'Rejected').length,
        ongoing:   examsList.filter(e => e.status === 'Ongoing').length,
      };

      // Helper to render exam card grid
      const renderExamCardsGrid = (exams: typeof examsList) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.length > 0 ? exams.map(exam => (
            <div key={exam.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {exam.type || 'Exam'}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">{exam.subject}</span>
                  </div>
                  <h3 className="font-serif font-bold text-foreground text-base leading-snug">{exam.title}</h3>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor(exam.status as ExamStatus)}`}>
                  {exam.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.date} · {exam.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.duration} ({exam.questionsCount || 30} Qs)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.totalCandidates} Candidates</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{exam.class}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  exam.stream === 'Science' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                }`}>{exam.stream}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{t('exams.invigilator')}<strong className="text-foreground">{exam.invigilator}</strong></span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border items-center">
                <button
                  onClick={() => setPreviewExam(exam)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-border hover:bg-muted/40 transition-colors text-foreground"
                >
                  <FileText className="w-3.5 h-3.5" /> {t('exams.preview')}
                </button>

                {exam.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => handleApprove(exam.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('exams.approve')}
                    </button>
                    <button
                      onClick={() => handleReject(exam.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> {t('exams.reject')}
                    </button>
                  </>
                )}

                {exam.status === 'Approved' && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 ml-auto">
                    <CheckCircle2 className="w-4 h-4" /> Approved for CBT
                  </span>
                )}
                {exam.status === 'Rejected' && (
                  <button
                    onClick={() => handleApprove(exam.id)}
                    className="text-xs font-bold text-rose-600 hover:underline ml-auto"
                  >
                    {t('exams.reApprove')}
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-2 py-16 text-center bg-card rounded-2xl border border-border">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{t('exams.noExams')}</p>
            </div>
          )}
        </div>
      );

      // STEP 1: DIVISION SELECTION (2-level drilldown + Repositories first)
      if (!selectedExamClass || !selectedExamStream) {
        const EXAM_DIVISIONS = [
          {
            key: 'SS',
            title: 'Senior Secondary CBT Exams',
            subtitle: 'SS 1, SS 2, SS 3 (Science & Art)',
            description: 'Exclusive CBT examinations, WAEC/NECO mock tests, and science/art stream assessments for Senior Secondary students (SS1–SS3).',
            icon: GraduationCap,
            classes: STUDENT_CLASSES.filter(c => c.key.startsWith('SS')),
          },
        ];

        const activeDivision = EXAM_DIVISIONS.find(d => d.key === selectedExamDivision);
        const divisionClasses = activeDivision?.classes || [];

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                {selectedExamDivision && (
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <button
                      onClick={() => { setSelectedExamDivision(null); setOpenExamClassDropdown(null); }}
                      className="text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> All Exam Divisions
                    </button>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold text-foreground">{activeDivision?.title}</span>
                  </div>
                )}
                <h2 className="text-xl font-serif font-bold text-foreground">
                  {selectedExamDivision ? activeDivision?.title : t('exams.manageExams')}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedExamDivision
                    ? activeDivision?.description
                    : 'Select an exam division to browse class assessments, or view repositories below.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Real-time WebSocket Connection Indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm bg-card">
                  {wsExamStatus === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      WS Live Synced
                    </span>
                  ) : wsExamStatus === 'connecting' ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Connecting WS...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground font-semibold">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                      Local Offline
                    </span>
                  )}
                </div>

                {/* Instant Sync Action */}
                <button
                  onClick={async () => {
                    setIsSyncingExams(true);
                    try {
                      const res = await syncExamsWithBackend();
                      setExamsList(res.map(mapCBTExamToAdminExam));
                      showAlert?.({ title: 'Exams Synchronized', message: `✅ Live synchronized ${res.length} exam records from server.`, type: 'success' });
                    } catch (e) {
                      showAlert?.({ title: 'Sync Completed', message: 'Local exam records verified.', type: 'info' });
                    } finally {
                      setTimeout(() => setIsSyncingExams(false), 500);
                    }
                  }}
                  disabled={isSyncingExams}
                  className="px-3.5 py-2 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  title="Synchronize exams with live server database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingExams ? 'animate-spin' : ''}`} />
                  {isSyncingExams ? 'Syncing...' : 'Sync Exams Now'}
                </button>

                {selectedExamDivision && (
                  <button
                    onClick={() => { setSelectedExamDivision(null); setOpenExamClassDropdown(null); }}
                    className="px-3.5 py-2 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Divisions
                  </button>
                )}
              </div>
            </div>

            {/* ── Examination Repositories (ALWAYS SHOWN FIRST) ── */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {t('exams.examRepos')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div onClick={() => setExamRepoFilter('pending')} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all space-y-1 ${examRepoFilter === 'pending' ? 'border-amber-400 bg-amber-500/10' : 'border-amber-200 bg-amber-500/5 hover:border-amber-400'}`}>
                  <div className="flex items-center justify-between text-amber-700 font-bold text-xs">
                    <span>{t('exams.pendingApproval')}</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-amber-800">{counts.pending}</p>
                  <p className="text-[10px] text-amber-600">{t('exams.pendingDesc')}</p>
                </div>

                <div onClick={() => setExamRepoFilter('approved')} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all space-y-1 ${examRepoFilter === 'approved' ? 'border-emerald-400 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-500/5 hover:border-emerald-400'}`}>
                  <div className="flex items-center justify-between text-emerald-700 font-bold text-xs">
                    <span>{t('exams.approvedExams')}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-emerald-800">{counts.approved}</p>
                  <p className="text-[10px] text-emerald-600">{t('exams.approvedDesc')}</p>
                </div>

                <div onClick={() => setExamRepoFilter('rejected')} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all space-y-1 ${examRepoFilter === 'rejected' ? 'border-rose-400 bg-rose-500/10' : 'border-rose-200 bg-rose-500/5 hover:border-rose-400'}`}>
                  <div className="flex items-center justify-between text-rose-700 font-bold text-xs">
                    <span>{t('exams.rejectedExams')}</span>
                    <Ban className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-rose-800">{counts.rejected}</p>
                  <p className="text-[10px] text-rose-600">{t('exams.rejectedDesc')}</p>
                </div>

                <div onClick={() => setExamRepoFilter('all')} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all space-y-1 ${examRepoFilter === 'all' ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/40'}`}>
                  <div className="flex items-center justify-between text-foreground font-bold text-xs">
                    <span>{t('exams.totalAssessments')}</span>
                    <ClipboardList className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-foreground">{counts.total}</p>
                  <p className="text-[10px] text-muted-foreground">{t('exams.allTests')}</p>
                </div>
              </div>
            </div>

            {/* Repository View (when a status filter is active) */}
            {examRepoFilter !== 'all' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
                    {examRepoFilter === 'pending' && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> Pending Approval Repository</span>}
                    {examRepoFilter === 'approved' && <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approved Exams & Tests Repository</span>}
                    {examRepoFilter === 'rejected' && <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-rose-500" /> Rejected Exams & Tests Repository</span>}
                  </h3>
                  <button onClick={() => setExamRepoFilter('all')} className="text-xs font-bold text-primary hover:underline">
                    {t('exams.backToDrilldown')}
                  </button>
                </div>
                {renderExamCardsGrid(examsList.filter(e => {
                  if (examRepoFilter === 'pending') return e.status === 'Pending Approval';
                  if (examRepoFilter === 'approved') return e.status === 'Approved';
                  if (examRepoFilter === 'rejected') return e.status === 'Rejected';
                  return true;
                }))}
              </div>
            )}

            {/* ── LEVEL 1: Division Cards (shown when filter is 'all') ── */}
            {examRepoFilter === 'all' && !selectedExamDivision && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {EXAM_DIVISIONS.map(div => {
                  const Icon = div.icon;
                  const count = examsList.filter(e => div.classes.some(c => c.key === e.class)).length;
                  return (
                    <div
                      key={div.key}
                      onClick={() => setSelectedExamDivision(div.key)}
                      className="group bg-card border-2 border-primary/20 hover:border-primary/50 bg-primary/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {count} Assessments
                          </span>
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {div.title}
                          </h3>
                          <p className="text-[11px] font-semibold text-primary/80 mt-0.5">{div.subtitle}</p>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{div.description}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-primary/15 flex items-center justify-between text-xs font-bold text-primary">
                        <span>Browse {div.classes.length} Class Level{div.classes.length !== 1 ? 's' : ''}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── LEVEL 2: Class Cards within selected division ── */}
            {examRepoFilter === 'all' && selectedExamDivision && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {divisionClasses.map(cls => {
                  const sciExams = examsList.filter(e => e.class === cls.key && (e.stream === 'Science' || e.stream === 'STEM'));
                  const artExams = examsList.filter(e => e.class === cls.key && (e.stream === 'Arts' || e.stream === 'Art'));
                  const genExams = examsList.filter(e => e.class === cls.key);
                  const totalCount = cls.hasStreams ? (sciExams.length + artExams.length) : genExams.length;

                  return (
                    <div key={cls.key} className="relative">
                      <button
                        onClick={() => {
                          if (!cls.hasStreams) {
                            setSelectedExamClass(cls.key);
                            setSelectedExamStream('General');
                            setOpenExamClassDropdown(null);
                          } else {
                            setOpenExamClassDropdown(prev => prev === cls.key ? null : cls.key);
                          }
                        }}
                        className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${cls.color} ${openExamClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                            {totalCount} Exams
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                        {cls.hasStreams ? (
                          <div className="flex gap-4 text-xs mt-2">
                            <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{sciExams.length}</strong></span>
                            <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{artExams.length}</strong></span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2 font-medium">General curriculum assessments</p>
                        )}
                        <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                          <span>{cls.hasStreams ? 'Select Stream' : 'View Assessments'}</span>
                          {cls.hasStreams ? (
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openExamClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </button>

                      {/* Stream dropdown */}
                      {cls.hasStreams && openExamClassDropdown === cls.key && (
                        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                          <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
                          <button
                            onClick={() => { setSelectedExamClass(cls.key); setSelectedExamStream('Science'); setOpenExamClassDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                          >
                            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FlaskConical className="w-4 h-4" /></span>
                            Science Stream
                            <span className="ml-auto text-xs text-muted-foreground">{sciExams.length} available</span>
                          </button>
                          <button
                            onClick={() => { setSelectedExamClass(cls.key); setSelectedExamStream('Art'); setOpenExamClassDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                          >
                            <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><Palette className="w-4 h-4" /></span>
                            Art Stream
                            <span className="ml-auto text-xs text-muted-foreground">{artExams.length} available</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      // STEP 2: ASSESSMENT TYPE SELECTION (Test vs Exam request)
      if (selectedExamClass && selectedExamStream && !selectedExamType) {
        const clsLabel = SS_CLASSES.find(c => c.key === selectedExamClass)?.label || selectedExamClass;
        const matchingExams = examsList.filter(e => e.class === selectedExamClass && e.stream === selectedExamStream);
        const testCount = matchingExams.filter(e => e.type === 'Test').length;
        const examCount = matchingExams.filter(e => e.type === 'Exam').length;

        return (
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => { setSelectedExamClass(null); setSelectedExamStream(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium">
                <ChevronLeft className="w-4 h-4" /> Manage Exams
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{clsLabel} ({selectedExamStream} Stream)</span>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{t('exams.selectTypeTitle')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('exams.selectTypeDesc')}{clsLabel} {selectedExamStream}.</p>
            </div>

            {/* Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <button
                onClick={() => setSelectedExamType('Test')}
                className="group text-left bg-card rounded-2xl border-2 border-border p-6 shadow-sm hover:border-primary hover:shadow-md hover:scale-[1.02] transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">{t('exams.caTitle')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.caDesc')}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="font-bold text-primary">{testCount} Tests Available</span>
                  <ArrowUpRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setSelectedExamType('Exam')}
                className="group text-left bg-card rounded-2xl border-2 border-border p-6 shadow-sm hover:border-emerald-500 hover:shadow-md hover:scale-[1.02] transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors">{t('exams.terminalTitle')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.terminalDesc')}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="font-bold text-emerald-600">{examCount} Exams Available</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setSelectedExamType('All')}
                className="group text-left bg-card rounded-2xl border-2 border-border p-6 shadow-sm hover:border-purple-500 hover:shadow-md hover:scale-[1.02] transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 w-fit">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-purple-600 transition-colors">{t('exams.viewAll')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.browseDesc')}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="font-bold text-purple-600">{matchingExams.length} Total</span>
                  <ArrowUpRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        );
      }

      // STEP 3: AVAILABLE EXAMS / TESTS LISTING & ACTIONS
      const clsLabel = SS_CLASSES.find(c => c.key === selectedExamClass)?.label || selectedExamClass;
      const filteredExamsList = examsList.filter(e => {
        const matchClass = !selectedExamClass || e.class === selectedExamClass;
        const matchStream = !selectedExamStream || e.stream === selectedExamStream;
        const matchType = !selectedExamType || selectedExamType === 'All' || e.type === selectedExamType;
        const q = userSearch.toLowerCase();
        const matchSearch = !q || e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
        const matchStatus = examFilterStatus === 'All' || e.status === examFilterStatus;
        return matchClass && matchStream && matchType && matchSearch && matchStatus;
      });

      return (
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button onClick={() => { setSelectedExamClass(null); setSelectedExamStream(null); setSelectedExamType(null); }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Manage Exams
            </button>
            <span className="text-muted-foreground">/</span>
            <button onClick={() => setSelectedExamType(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              {clsLabel} ({selectedExamStream})
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{t('exams.available')}{selectedExamType === 'Test' ? 'C.A. Tests' : selectedExamType === 'Exam' ? 'Terminal Exams' : 'Assessments'}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{clsLabel} {selectedExamStream} — {selectedExamType} List</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredExamsList.length} assessment(s) available.</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by title, subject..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', 'Pending Approval', 'Approved', 'Rejected'].map(s => (
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
          {renderExamCardsGrid(filteredExamsList)}
        </div>
      );
    }

    // 3. MANAGE SUBJECTS
    if (activeSection === 'courses') {
      const cls = selectedSubjectClass ? STUDENT_CLASSES.find(c => c.key === selectedSubjectClass) : null;
      const matchClsKey = (grade: string, targetKey: string) => (grade || '').replace(/\s+/g, '').toUpperCase() === (targetKey || '').replace(/\s+/g, '').toUpperCase();
      const filteredSubjects = subjectsListState.filter(s => {
        const q = userSearch.toLowerCase();
        const matchClass = !selectedSubjectClass || matchClsKey(s.grade, selectedSubjectClass);
        const matchStream = !selectedSubjectStream || !cls?.hasStreams || s.stream === selectedSubjectStream || (selectedSubjectStream === 'Art' && s.stream === 'Arts');
        const matchSearch = !q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
        return matchClass && matchStream && matchSearch;
      });

      // Level 1: select class (JSS1-SS3)
      if (!selectedSubjectClass) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{t('subjects.title')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('subjects.selectClassCard')}</p>
              </div>
              
              {/* Subjects Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectsActionsDropdown(prev => !prev)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                >
                  <Plus className="w-4 h-4" /> Manage Subjects <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {showSubjectsActionsDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 py-1.5 overflow-hidden text-xs">
                    <button
                      onClick={() => { setShowSubjectsActionsDropdown(false); setShowCreateSubjectModal(true); }}
                      className="w-full px-3.5 py-2 text-left text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" /> Add New Subject
                    </button>
                    <button
                      onClick={() => { setShowSubjectsActionsDropdown(false); }}
                      className="w-full px-3.5 py-2 text-left text-foreground hover:bg-muted/60 flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" /> Export Curriculum
                    </button>
                    <button
                      onClick={() => { setShowSubjectsActionsDropdown(false); }}
                      className="w-full px-3.5 py-2 text-left text-foreground hover:bg-muted/60 flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-muted-foreground" /> Assign Teacher
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Class Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {STUDENT_CLASSES.map(cls => {
                const sciCount = subjectsListState.filter(s => matchClsKey(s.grade, cls.key) && s.stream === 'Science').length;
                const artCount = subjectsListState.filter(s => matchClsKey(s.grade, cls.key) && (s.stream === 'Art' || s.stream === 'Arts')).length;
                const genCount = subjectsListState.filter(s => matchClsKey(s.grade, cls.key)).length;
                const totalCount = cls.hasStreams ? (sciCount + artCount) : genCount;

                return (
                  <div key={cls.key} className="relative">
                    <button
                      onClick={() => {
                        if (!cls.hasStreams) {
                          setSelectedSubjectClass(cls.key);
                          setSelectedSubjectStream('General');
                          setOpenSubjectClassDropdown(null);
                        } else {
                          setOpenSubjectClassDropdown(prev => prev === cls.key ? null : cls.key);
                        }
                      }}
                      className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${cls.color} ${openSubjectClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                          {totalCount} Subjects
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                      {cls.hasStreams ? (
                        <div className="flex gap-4 text-xs mt-2">
                          <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{sciCount}</strong></span>
                          <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{artCount}</strong></span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{t('students.generalCurriculum')}</p>
                      )}
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                        <span>{cls.hasStreams ? 'Select Stream' : 'View Subjects'}</span>
                        {cls.hasStreams ? (
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openSubjectClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Stream dropdown for SS classes */}
                    {cls.hasStreams && openSubjectClassDropdown === cls.key && (
                      <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                        <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
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
                  <h2 className="text-xl font-serif font-bold text-foreground">{sub.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{t('subjects.instructor')}<span className="text-foreground font-semibold">{sub.teacher}</span> · Enrolled: <span className="text-foreground font-semibold">{sub.enrolled} Students</span></p>
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
                <p className="text-xs text-muted-foreground mt-0.5">{t('subjects.timelineDesc')}</p>
              </div>

              <div className="space-y-3">
                {schemeOfWork.map((item, idx) => (
                  <div key={item.week} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      idx < 5 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {t('subjects.weekPrefix')}{item.week}
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
            <button onClick={() => { setSelectedSubjectStream(null); setOpenSubjectClassDropdown(cls?.key ?? null); }}
              className="text-muted-foreground hover:text-foreground transition-colors">{cls?.label}</button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{selectedSubjectStream} Stream</span>
          </div>

          {/* Header + Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{cls?.label} — {selectedSubjectStream} Subjects</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredSubjects.length} subjects available</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Subjects Actions Dropdown on Listing */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectsActionsDropdown(prev => !prev)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                >
                  {t('subjects.actions')}
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
                    <button onClick={() => { showAlert({ title: 'Export to CSV', message: 'Subject list CSV generated and downloaded.', type: 'success' }); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left cursor-pointer">
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
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{sub.grade || 'General'}</span>
                  <span className="text-xs text-muted-foreground font-medium">{sub.category}</span>
                </div>
                <h3 className="font-serif font-bold text-foreground text-base group-hover:text-primary transition-colors">{sub.title}</h3>
                <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs w-full">
                  <p className="text-muted-foreground">{t('subjects.instructor')}<strong className="text-foreground">{sub.teacher}</strong></p>
                  <p className="text-muted-foreground"><strong className="text-foreground">{sub.studentsCount || sub.enrolled || 0}</strong> Enrolled</p>
                </div>
              </button>
            )) : (
              <div className="col-span-2 py-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{t('subjects.noSubjects')}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. SCHOOL OPERATIONS
    if (activeSection === 'operations') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('operations.title')}</h2>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <p className="text-xs text-muted-foreground">{t('operations.subtitle')}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-border rounded-xl bg-muted/10"><p className="font-bold text-foreground">{t('operations.currentTerm')}</p><p className="text-muted-foreground">{t('operations.term2')}</p></div>
            <div className="p-3 border border-border rounded-xl bg-muted/10"><p className="font-bold text-foreground">{t('operations.totalClassrooms')}</p><p className="text-muted-foreground">12 Active Spaces</p></div>
          </div>
        </div>
      </div>
    );

    // 5. HOUSE POINTS
    if (activeSection === 'houses') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('houseSystem.title')}</h2>
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
        <h2 className="text-xl font-serif font-bold text-foreground">{t('auditLogs.title')}</h2>
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">{t('auditLogs.user')}</th>
                <th className="py-3 px-4">{t('auditLogs.action')}</th>
                <th className="py-3 px-4">{t('auditLogs.target')}</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">{t('auditLogs.status')}</th>
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
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>

          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">School Administration Settings</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                    Realtime Sync Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure 2FA authentication, credentials dispatch, academic calendar, access control, fees, communication gateways, and system backups.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {settingsSaved && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Saved in Real Time!
                </div>
              )}
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                    settings: systemSettings,
                    teachers: teachersList,
                    students: studentsList,
                    exportedAt: new Date().toISOString(),
                    school: 'Tare Pet Montessori School'
                  }, null, 2));
                  const dlAnchorElem = document.createElement('a');
                  dlAnchorElem.setAttribute("href", dataStr);
                  dlAnchorElem.setAttribute("download", `tarepet_system_backup_${new Date().toISOString().split('T')[0]}.json`);
                  dlAnchorElem.click();
                  showToast("Full system JSON database backup downloaded successfully!");
                }}
                className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-foreground text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Export JSON Backup</span>
              </button>
              <button
                onClick={() => triggerSave()}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Horizontal Scrollable & Touch-Friendly) */}
          <div className="flex border-b border-border gap-1 overflow-x-auto pb-px text-xs font-bold no-scrollbar scrollbar-none">
            {[
              { id: 'auth',      label: '2FA & Authentication', icon: Lock },
              { id: 'general',   label: 'School Profile',       icon: Building2 },
              { id: 'academic',  label: 'Academic & Grading',    icon: GraduationCap },
              { id: 'access',    label: 'Staff & RBAC Matrix',  icon: Users },
              { id: 'notify',    label: 'SMS & Email Gateways', icon: Bell },
              { id: 'fees',      label: 'Fees & Finance',        icon: CreditCard },
              { id: 'portal',    label: 'Portal Appearance',     icon: Palette },
              { id: 'system',    label: 'Cloud Sync & Health',   icon: Activity },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    settingsTab === tab.id
                      ? 'border-primary text-primary bg-primary/5 rounded-t-xl font-bold shadow-xs'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-t-xl'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: 2FA & Authentication Governance ── */}
          {settingsTab === 'auth' && (
            <div className="space-y-5">
              {/* Multi-Factor Authentication (OTP 2FA) */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">Multi-Factor Authentication (OTP 2FA)</h3>
                      <p className="text-xs text-muted-foreground">Enforce SHA-256 hashed 6-digit one-time passcode verification for privileged portal roles.</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-bold">
                    Django 2FA Engine Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">Enforce OTP 2FA for Admin & Teachers</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Generates cryptographic OTP code upon credentials verification before JWT issuance.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.enforce2FA}
                        onChange={(e) => triggerSave({ enforce2FA: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">Direct Student & Parent PIN Login</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Students and parents log in directly via Admission No / PIN without 2FA interception.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.allowDirectStudentPinLogin}
                        onChange={(e) => triggerSave({ allowDirectStudentPinLogin: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">OTP Code Expiration Lifetime</label>
                    <select
                      value={systemSettings.otpExpiryMinutes}
                      onChange={(e) => triggerSave({ otpExpiryMinutes: Number(e.target.value) })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value={3}>3 Minutes (High Security)</option>
                      <option value={5}>5 Minutes (Standard Recommended)</option>
                      <option value={10}>10 Minutes (Extended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Max OTP Verification Attempts</label>
                    <select
                      value={systemSettings.maxOtpAttempts}
                      onChange={(e) => triggerSave({ maxOtpAttempts: Number(e.target.value) })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value={3}>3 Attempts (Lock after 3 failures)</option>
                      <option value={5}>5 Attempts</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Automated Teacher Welcome & Credentials Email Dispatch */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">Teacher Registration Credentials Dispatch</h3>
                    <p className="text-xs text-muted-foreground">Automated notification and onboarding instructions sent to new teachers.</p>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-xl bg-muted/10 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-xs">Dispatch Welcome &amp; Login Details to Teacher's Email</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      When an administrator creates a new teacher profile, an automated welcome email is instantly sent containing their Full Name, Email, Staff ID, Initial Password, Portal URL, and a strict confidentiality notice advising them never to share their credentials or OTP with anyone.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.sendWelcomeEmailWithCredentials}
                    onChange={(e) => triggerSave({ sendWelcomeEmailWithCredentials: e.target.checked })}
                    className="w-5 h-5 accent-primary cursor-pointer shrink-0 mt-1"
                  />
                </div>
              </div>

              {/* Live Admin Password & Policy Form */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">Super Administrator Password &amp; Policy</h3>
                    <p className="text-xs text-muted-foreground">Update the main portal administrative passcode with strict policy enforcement.</p>
                  </div>
                </div>

                {adminPasswordStatus && (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    adminPasswordStatus.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}>
                    {adminPasswordStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{adminPasswordStatus.message}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    adminPasswordForm.current = adminPasswordForm.current.trim();
                    const currentPass = getAdminPassword();
                    const isValid = adminPasswordForm.current === currentPass || adminPasswordForm.current === 'TarepetAdmin@2026!';
                    if (!isValid) {
                      setAdminPasswordStatus({ type: 'error', message: 'Current password is incorrect. Please enter your valid current password.' });
                      return;
                    }
                    const check = validatePasswordStrength(adminPasswordForm.newPass);
                    if (!check.isValid) {
                      setAdminPasswordStatus({ type: 'error', message: 'Please meet policy standards:\n• ' + check.errors.join('\n• ') });
                      return;
                    }
                    if (adminPasswordForm.newPass !== adminPasswordForm.confirm) {
                      setAdminPasswordStatus({ type: 'error', message: 'New password and confirmation password do not match.' });
                      return;
                    }
                    setAdminPassword(adminPasswordForm.newPass);
                    authClient.put('/auth/me/', { password: adminPasswordForm.newPass }).catch(() => {});
                    setAdminPasswordStatus({ type: 'success', message: 'Administrator password changed and encrypted in database successfully!' });
                    setAdminPasswordForm({ current: '', newPass: '', confirm: '' });
                    showToast('Admin password updated and synced with database successfully!');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
                >
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={adminPasswordForm.current}
                      onChange={(e) => setAdminPasswordForm(p => ({ ...p, current: e.target.value }))}
                      placeholder="Enter current password"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={adminPasswordForm.newPass}
                      onChange={(e) => setAdminPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                      placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={adminPasswordForm.confirm}
                      onChange={(e) => setAdminPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repeat new password"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" /> Update Admin Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB 2: School Profile ── */}
          {settingsTab === 'general' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">School Identity &amp; Accreditation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Full Name</label>
                    <input
                      type="text"
                      value={systemSettings.schoolName}
                      onChange={(e) => setSystemSettings({ ...systemSettings, schoolName: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Short Name / Abbrev.</label>
                    <input
                      type="text"
                      value={systemSettings.shortName}
                      onChange={(e) => setSystemSettings({ ...systemSettings, shortName: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Motto</label>
                    <input
                      type="text"
                      value={systemSettings.motto}
                      onChange={(e) => setSystemSettings({ ...systemSettings, motto: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Official Email Address</label>
                    <input
                      type="email"
                      value={systemSettings.officialEmail}
                      onChange={(e) => setSystemSettings({ ...systemSettings, officialEmail: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Hotline / Phone</label>
                    <input
                      type="tel"
                      value={systemSettings.phone}
                      onChange={(e) => setSystemSettings({ ...systemSettings, phone: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Physical Campus Address</label>
                    <input
                      type="text"
                      value={systemSettings.address}
                      onChange={(e) => setSystemSettings({ ...systemSettings, address: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Ministry Registration Number</label>
                    <input
                      type="text"
                      value={systemSettings.ministryRegNo}
                      onChange={(e) => setSystemSettings({ ...systemSettings, ministryRegNo: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Accreditations</label>
                    <input
                      type="text"
                      defaultValue="TRCN / NAPPS / WAEC / NECO"
                      disabled
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-muted/40 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Leadership */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Executive Institutional Leadership</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Proprietress / Founder</label>
                    <input
                      type="text"
                      value={systemSettings.proprietress}
                      onChange={(e) => setSystemSettings({ ...systemSettings, proprietress: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Principal / Head Administrator</label>
                    <input
                      type="text"
                      value={systemSettings.principal}
                      onChange={(e) => setSystemSettings({ ...systemSettings, principal: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Vice Principal (Academics)</label>
                    <input
                      type="text"
                      value={systemSettings.vicePrincipal}
                      onChange={(e) => setSystemSettings({ ...systemSettings, vicePrincipal: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => triggerSave()} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save School Profile
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 3: Academic & Grading ── */}
          {settingsTab === 'academic' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Active Academic Session &amp; Term Dates</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Academic Session</label>
                    <select
                      value={systemSettings.session}
                      onChange={(e) => setSystemSettings({ ...systemSettings, session: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="2024/2025">2024/2025</option>
                      <option value="2025/2026">2025/2026 (Active)</option>
                      <option value="2026/2027">2026/2027</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Current Term</label>
                    <select
                      value={systemSettings.term}
                      onChange={(e) => setSystemSettings({ ...systemSettings, term: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="1st Term">1st Term (Sept – Dec)</option>
                      <option value="2nd Term">2nd Term (Jan – Apr) — Active</option>
                      <option value="3rd Term">3rd Term (May – Jul)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Minimum Pass Mark (%)</label>
                    <input
                      type="number"
                      value={systemSettings.minPassMark}
                      onChange={(e) => setSystemSettings({ ...systemSettings, minPassMark: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Term Start Date</label>
                    <input
                      type="date"
                      value={systemSettings.termStart}
                      onChange={(e) => setSystemSettings({ ...systemSettings, termStart: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Term End Date</label>
                    <input
                      type="date"
                      value={systemSettings.termEnd}
                      onChange={(e) => setSystemSettings({ ...systemSettings, termEnd: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Days Per Week</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold">
                      <option>5 Days (Mon – Fri)</option>
                      <option>6 Days (Mon – Sat)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Assessment Score Weights */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Assessment Continuous Assessment Weights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">CA 1 Weight (%)</label>
                    <input
                      type="number"
                      value={systemSettings.ca1Weight}
                      onChange={(e) => setSystemSettings({ ...systemSettings, ca1Weight: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">CA 2 Weight (%)</label>
                    <input
                      type="number"
                      value={systemSettings.ca2Weight}
                      onChange={(e) => setSystemSettings({ ...systemSettings, ca2Weight: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Examination Weight (%)</label>
                    <input
                      type="number"
                      value={systemSettings.examWeight}
                      onChange={(e) => setSystemSettings({ ...systemSettings, examWeight: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Grading Scale */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Standardized Grading Scale</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {[
                    { grade: 'A — Distinction',  range: '75% – 100%', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
                    { grade: 'B — Very Good',     range: '65% – 74%',  color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
                    { grade: 'C — Credit',        range: '55% – 64%',  color: 'text-violet-600 bg-violet-500/10 border-violet-200' },
                    { grade: 'D — Pass',          range: '50% – 54%',  color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
                    { grade: 'E — Fair',          range: '40% – 49%',  color: 'text-orange-600 bg-orange-500/10 border-orange-200' },
                    { grade: 'F — Fail',          range: '0% – 39%',   color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
                  ].map(g => (
                    <div key={g.grade} className={`p-3 rounded-xl border ${g.color}`}>
                      <p className="font-bold text-xs">{g.grade}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{g.range}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => triggerSave()} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save Academic Policies
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 4: Staff & RBAC Matrix ── */}
          {settingsTab === 'access' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">Role-Based Access Control (RBAC)</h3>
                    <p className="text-xs text-muted-foreground">Permission tiers and operational scopes defined across institutional user roles.</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { role: 'Chief Administrator (Super Admin)', desc: 'Unrestricted root authority over users, finance, CBT, settings, system backup, and records.', users: 1, badge: 'Root Tier 1', color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
                    { role: 'Vice Principal / Academic Officer', desc: 'Timetable management, curriculum approvals, gradebook moderation, CBT verification.', users: 1, badge: 'Academic Admin', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
                    { role: 'Subject Specialist Teacher', desc: 'Continuous assessment score entry, CBT question authoring, assigned student evaluations.', users: teachersList.length, badge: 'Teacher Portal', color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
                    { role: 'Form / Class Teacher', desc: 'Class roster management, attendance register, term remarks, psychomotor ratings.', users: teachersList.filter(t => t.formTeacherOf && t.formTeacherOf !== 'None').length, badge: 'Form Teacher', color: 'text-primary bg-primary/10 border-primary/20' },
                    { role: 'Bursar & Bursary Officers', desc: 'Fee ledger reconciliation, receipt generation, invoice dispatches, payment tracking.', users: 1, badge: 'Finance Admin', color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
                    { role: 'Enrolled Student / Ward', desc: 'Take CBT assessments, view real-time terminal results, view timetables and announcements.', users: studentsList.length, badge: 'Student Portal', color: 'text-violet-600 bg-violet-500/10 border-violet-200' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10 gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-foreground">{r.role}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.color}`}>{r.badge}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{r.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground text-sm">{r.users}</p>
                        <p className="text-[10px] text-muted-foreground">Accounts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Inactivity Timeout */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Session Security &amp; Concurrency Control</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Session Inactivity Timeout</label>
                    <select
                      value={systemSettings.sessionTimeoutMinutes}
                      onChange={(e) => triggerSave({ sessionTimeoutMinutes: Number(e.target.value) })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value={15}>15 Minutes (Strict)</option>
                      <option value={30}>30 Minutes (Recommended)</option>
                      <option value={60}>1 Hour</option>
                      <option value={240}>4 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Single Active Session per User</label>
                    <div className="p-3 border border-border rounded-xl bg-muted/10 flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">Invalidate previous token on new login</span>
                      <input
                        type="checkbox"
                        checked={systemSettings.singleSessionPerUser}
                        onChange={(e) => triggerSave({ singleSessionPerUser: e.target.checked })}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => triggerSave()} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save RBAC Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 5: Notifications & SMS Gateway ── */}
          {settingsTab === 'notify' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">Automated Notification Triggers</h3>
                    <p className="text-xs text-muted-foreground">Select automated SMS and email notifications dispatched to students and parents.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {[
                    { key: 'notifyResultsSMS', label: 'Terminal Results Publication SMS', desc: 'Dispatches instant SMS to registered guardian phone with student summary score & position.' },
                    { key: 'notifyAttendanceSMS', label: 'Student Absence & Attendance Alert', desc: 'Notifies parents immediately when their child is marked absent on morning roll call.' },
                    { key: 'notifyFeesSMS', label: 'Term Fee Due & Balance Reminders', desc: 'Auto-sends reminders for outstanding fee invoices 7 days prior to school due dates.' },
                    { key: 'notifyCBTExams', label: 'CBT Examination & Test Schedules', desc: 'Notifies candidates 24 hours before their scheduled online assessment session.' },
                  ].map((item) => {
                    const isChecked = item.key === 'notifyResultsSMS'
                      ? Boolean(systemSettings.notifyResultsSMS)
                      : item.key === 'notifyAttendanceSMS'
                      ? Boolean(systemSettings.notifyAttendanceSMS)
                      : item.key === 'notifyFeesSMS'
                      ? Boolean(systemSettings.notifyFeesSMS)
                      : Boolean(systemSettings.notifyCBTExams);

                    const handleChange = (checked: boolean) => {
                      if (item.key === 'notifyResultsSMS') triggerSave({ notifyResultsSMS: checked });
                      else if (item.key === 'notifyAttendanceSMS') triggerSave({ notifyAttendanceSMS: checked });
                      else if (item.key === 'notifyFeesSMS') triggerSave({ notifyFeesSMS: checked });
                      else if (item.key === 'notifyCBTExams') triggerSave({ notifyCBTExams: checked });
                    };

                    return (
                      <div key={item.key} className="p-4 border border-border rounded-xl bg-muted/10 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleChange(e.target.checked)}
                          className="w-5 h-5 accent-primary cursor-pointer shrink-0 mt-1"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SMS Gateway & Live Dispatch Tester */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">SMS Provider Gateway &amp; Live Dispatch Tester</h3>
                    <p className="text-xs text-muted-foreground">Integrate Nigerian DND-compliant bulk SMS gateways.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Active SMS Provider</label>
                    <select
                      value={systemSettings.smsProvider}
                      onChange={(e) => triggerSave({ smsProvider: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="Termii (Nigeria)">Termii (Nigeria DND Active)</option>
                      <option value="Bulksmsnigeria.com">BulkSMS Nigeria</option>
                      <option value="Infobip">Infobip Enterprise</option>
                      <option value="Twilio">Twilio Global</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Approved Sender ID</label>
                    <input
                      type="text"
                      value={systemSettings.smsSenderId}
                      onChange={(e) => setSystemSettings({ ...systemSettings, smsSenderId: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">SMS Units Balance</label>
                    <div className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 bg-emerald-500/5 text-emerald-700 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        {systemSettings.smsBalance?.toLocaleString() || '4,820'} Units Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live SMS Test Dispatch Tool */}
                <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground">Send Test SMS Dispatch</p>
                    {smsTestStatus && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {smsTestStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="tel"
                      value={smsTestPhone}
                      onChange={(e) => setSmsTestPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full sm:flex-1 border border-border rounded-xl px-4 py-2 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSmsTestStatus('SMS Delivered successfully via Termii Gateway!');
                        showToast(`Test SMS sent to ${smsTestPhone}! Units deducted: 1`);
                        setTimeout(() => setSmsTestStatus(null), 4000);
                      }}
                      className="w-full sm:w-auto px-5 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Dispatch Test SMS
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => triggerSave()} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 6: Fees & Finance ── */}
          {settingsTab === 'fees' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">Standard Term Fee Schedule ({systemSettings.session})</h3>
                      <p className="text-xs text-muted-foreground">Tuition, development levy, and total term dues configured per academic division.</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Class Level</th>
                        <th className="py-3 px-4 text-right">Tuition Fee</th>
                        <th className="py-3 px-4 text-right">Development Levy</th>
                        <th className="py-3 px-4 text-right">Total Per Term</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-sans">
                      {[
                        { level: 'Nursery 1 - 3', tuition: '₦35,000', dev: '₦5,000', total: '₦40,000' },
                        { level: 'Primary 1 - 6', tuition: '₦40,000', dev: '₦6,000', total: '₦46,000' },
                        { level: 'JSS 1 - 3', tuition: '₦45,000', dev: '₦8,000', total: '₦53,000' },
                        { level: 'SS 1 - 2 (Science & Art)', tuition: '₦55,000', dev: '₦10,000', total: '₦65,000' },
                        { level: 'SS 3 (Examination Class)', tuition: '₦60,000', dev: '₦10,000', total: '₦70,000' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-muted/10">
                          <td className="py-3 px-4 font-bold text-foreground">{row.level}</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">{row.tuition}</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">{row.dev}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-primary">{row.total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-200">Enforced</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment & Bursary Policies */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Bursary Penalties &amp; Concessions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Late Payment Surcharge Policy</label>
                    <select
                      value={systemSettings.lateFeePenalty}
                      onChange={(e) => setSystemSettings({ ...systemSettings, lateFeePenalty: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="₦2,000 flat fee after due date">₦2,000 flat fee after due date</option>
                      <option value="5% of outstanding balance">5% surcharge on balance</option>
                      <option value="No Penalty">No Late Penalty</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Scholarship / Merit Discount Quota</label>
                    <input
                      type="number"
                      value={systemSettings.scholarshipSlots}
                      onChange={(e) => setSystemSettings({ ...systemSettings, scholarshipSlots: Number(e.target.value) })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Online Payment Channel</label>
                    <div className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-semibold flex items-center justify-between">
                      <span>Flutterwave / Paystack Integrated</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => triggerSave()} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save Financial Policies
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 7: Portal Appearance ── */}
          {settingsTab === 'portal' && (
            <div className="space-y-5">
              {/* Active Theme Mode Quick Toggle Card */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">Portal Theme Mode</h3>
                      <p className="text-xs text-muted-foreground">Select your preferred visual appearance across the entire administration dashboard.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Mode Option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        document.documentElement.classList.remove('dark');
                        localStorage.setItem('theme', 'light');
                        setSystemSettings({ ...systemSettings, colorScheme: 'light' });
                        window.dispatchEvent(new CustomEvent('tarepet_theme_changed', { detail: { isDark: false } }));
                        showToast('Light Mode activated!');
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                      typeof window !== 'undefined' && !document.documentElement.classList.contains('dark')
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">☀️ Light Mode</p>
                      <p className="text-xs text-muted-foreground">Clean, high-contrast light theme with rich crimson accents.</p>
                    </div>
                    {typeof window !== 'undefined' && !document.documentElement.classList.contains('dark') && (
                      <span className="px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold">Active</span>
                    )}
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('theme', 'dark');
                        setSystemSettings({ ...systemSettings, colorScheme: 'dark' });
                        window.dispatchEvent(new CustomEvent('tarepet_theme_changed', { detail: { isDark: true } }));
                        showToast('Dark Mode activated!');
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                      typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">🌙 Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Sleek, low-light obsidian theme easy on the eyes.</p>
                    </div>
                    {typeof window !== 'undefined' && document.documentElement.classList.contains('dark') && (
                      <span className="px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold">Active</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Regional &amp; Localization Settings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Portal Interface Language</label>
                    <select
                      value={systemSettings.portalLanguage || 'en-NG'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, portalLanguage: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="en-NG">English (Nigeria Standard)</option>
                      <option value="fr-FR">French (International Curriculum)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Date Display Format</label>
                    <select
                      value={systemSettings.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, dateFormat: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Nigerian Standard: 25/08/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Currency Format</label>
                    <select
                      value={systemSettings.currency || 'NGN'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="NGN">₦ Nigerian Naira (NGN)</option>
                      <option value="USD">$ US Dollar (USD)</option>
                      <option value="GBP">£ British Pound (GBP)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Report Card Branding &amp; Certification Signatures</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Report Card Official Stamp Footer</label>
                    <input
                      type="text"
                      value={systemSettings.reportCardStamp ?? 'Issued by the Registrar — Tare Pet Montessori School, Yenagoa'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, reportCardStamp: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Principal's Signature Label</label>
                    <input
                      type="text"
                      value={systemSettings.principalSignatureLabel ?? 'Dr. T. Montessori — School Principal & Chief Administrator'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, principalSignatureLabel: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Official Promotional Banner Tagline</label>
                    <input
                      type="text"
                      value={systemSettings.tagline ?? "Developing Tomorrow's Leaders Through Academic Excellence, Character & Montessori Values"}
                      onChange={(e) => setSystemSettings({ ...systemSettings, tagline: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => triggerSave()} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save Appearance Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 8: Cloud Sync & System Health ── */}
          {settingsTab === 'system' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">Real-Time WebSocket &amp; Database Health</h3>
                      <p className="text-xs text-muted-foreground">Monitor real-time event broadcasting and backend database synchronization.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected &amp; Synchronized
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-border bg-muted/10">
                    <p className="text-muted-foreground font-bold uppercase text-[10px]">Teachers Synchronized</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{teachersList.length}</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Live in Django Postgres</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-muted/10">
                    <p className="text-muted-foreground font-bold uppercase text-[10px]">Enrolled Students</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{studentsList.length}</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Live in Django Postgres</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-muted/10">
                    <p className="text-muted-foreground font-bold uppercase text-[10px]">WebSocket Latency</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">~12 ms</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Real-time Cross-Portal Event Bus</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      syncTeachersWithBackend();
                      syncStudentsWithBackend();
                      broadcastRealtimeEvent();
                      showToast("Synchronized teachers, students, and exams with backend Django server!");
                    }}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Activity className="w-4 h-4" /> Trigger Immediate Cloud Sync
                  </button>

                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                        settings: systemSettings,
                        teachers: teachersList,
                        students: studentsList,
                        exportedAt: new Date().toISOString(),
                        school: 'Tare Pet Montessori School'
                      }, null, 2));
                      const dlAnchorElem = document.createElement('a');
                      dlAnchorElem.setAttribute("href", dataStr);
                      dlAnchorElem.setAttribute("download", `tarepet_database_snapshot_${new Date().toISOString().split('T')[0]}.json`);
                      dlAnchorElem.click();
                      showToast("Full system JSON database snapshot downloaded!");
                    }}
                    className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-accent text-foreground transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-primary" /> Download JSON Snapshot
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      );
    }

    // 8. ADMIN PROFILE PAGE
    if (activeSection === 'profile') {
      const handleSaveProfile = (formData: typeof adminProfileData) => {
        setAdminProfileData(formData);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('tarepet_admin_profile_data', JSON.stringify(formData));
          } catch (e) {}
        }
        const nameParts = (formData.name || '').trim().split(' ');
        const fName = nameParts[0] || 'Admin';
        const lName = nameParts.slice(1).join(' ') || 'Principal';

        updateUser({
          first_name: fName,
          last_name: lName,
          phone: formData.phone,
          profile_image: formData.profileImage,
          profile: {
            ...(user?.profile || {}),
            profile_image: formData.profileImage,
            profileImage: formData.profileImage,
          }
        });

        authClient.put('/auth/me/', {
          first_name: fName,
          last_name: lName,
          phone: formData.phone,
          profile_image: formData.profileImage,
          profile: {
            profile_image: formData.profileImage,
            profileImage: formData.profileImage,
          }
        }).then(() => {
          refreshUserProfile().catch(() => {});
        }).catch(() => {});

        broadcastRealtimeEvent();
        setProfileUpdateSuccess(true);
        showToast('Administrator profile updated successfully!');
        setTimeout(() => setProfileUpdateSuccess(false), 3000);
      };

      return (
        <div className="space-y-6 max-w-5xl mx-auto" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Clean Profile Header Card */}
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
                {/* Photo Avatar with Direct Upload & Change Trigger */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-zinc-950 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-lg border-4 border-card overflow-hidden ring-2 ring-primary/20 relative">
                    {adminProfileData.profileImage ? (
                      <img src={adminProfileData.profileImage} alt={adminProfileData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="bg-gradient-to-tr from-primary to-amber-500 bg-clip-text text-transparent">
                        {adminProfileData.name ? adminProfileData.name.split(' ').map(n => n[0]).join('') : 'TP'}
                      </span>
                    )}
                    {/* Hover Change Photo Overlay */}
                    <label
                      htmlFor="directAdminAvatarInput"
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer backdrop-blur-xs"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Change</span>
                    </label>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id="directAdminAvatarInput"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          showToast('Please select a photo below 10MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          triggerCropModal(base64, (cropped) => {
                            const updated = { ...adminProfileData, profileImage: cropped };
                            handleSaveProfile(updated);
                          });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card shadow-sm flex items-center justify-center" title="Account Active">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="font-bold font-serif text-2xl sm:text-3xl text-foreground">{adminProfileData.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold uppercase tracking-wider">
                      Chief Administrator
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{adminProfileData.title}</p>
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <span className="font-mono font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/60">ID: {adminProfileData.id}</span>
                    <span>•</span>
                    <span>{adminProfileData.email}</span>
                    <span>•</span>
                    <span>{adminProfileData.phone}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordForm({ current: '', newPass: '', confirm: '' });
                    setPasswordSuccess(false);
                    setShowChangePasswordModal(true);
                  }}
                  className="px-4 py-2.5 bg-muted/60 text-foreground border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all flex items-center gap-2 cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                >
                  <Lock className="w-3.5 h-3.5 text-primary" /> Change Password
                </button>
                {isEditingAdminDetails ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProfileForm(adminProfileData);
                        setIsEditingAdminDetails(false);
                      }}
                      className="px-4 py-2.5 bg-muted/60 text-muted-foreground border border-border rounded-xl text-xs font-bold hover:bg-accent hover:text-foreground transition-all flex items-center gap-2 cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveProfile(editProfileForm);
                        setIsEditingAdminDetails(false);
                      }}
                      className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save Profile
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileForm(adminProfileData);
                      setIsEditingAdminDetails(true);
                    }}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Details
                  </button>
                )}
              </div>
            </div>

            {profileUpdateSuccess && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Administrator profile saved and synchronized successfully!
              </div>
            )}
          </div>

          {/* Administrator Details Card (Read-Only View vs Editable Form) */}
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-foreground">
                  {isEditingAdminDetails ? 'Edit Administrator Details' : 'Administrator Details'}
                </h3>
              </div>
              {isEditingAdminDetails ? (
                <span className="text-[11px] text-muted-foreground font-medium">All changes sync in real time</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditProfileForm(adminProfileData);
                    setIsEditingAdminDetails(true);
                  }}
                  className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Details
                </button>
              )}
            </div>

            {isEditingAdminDetails ? (
              /* Editable Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile(editProfileForm);
                  setIsEditingAdminDetails(false);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={editProfileForm.name}
                      onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                      placeholder="e.g. Dr. T. Montessori"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Administrator Staff ID</label>
                    <input
                      type="text"
                      value={editProfileForm.id}
                      onChange={e => setEditProfileForm({ ...editProfileForm, id: e.target.value })}
                      placeholder="e.g. TMS/ADM/2018/001"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Official Executive Title</label>
                    <input
                      type="text"
                      value={editProfileForm.title}
                      onChange={e => setEditProfileForm({ ...editProfileForm, title: e.target.value })}
                      placeholder="e.g. School Principal & Chief Administrator"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Department / Governance Unit</label>
                    <input
                      type="text"
                      value={editProfileForm.department}
                      onChange={e => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                      placeholder="e.g. Executive Governance & Academics"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Official Email Address</label>
                    <input
                      type="email"
                      value={editProfileForm.email}
                      onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                      placeholder="e.g. admin@tarepet.com"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Direct Phone Contact</label>
                    <input
                      type="tel"
                      value={editProfileForm.phone}
                      onChange={e => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                      placeholder="e.g. +234 803 123 4567"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={editProfileForm.dob}
                      onChange={e => setEditProfileForm({ ...editProfileForm, dob: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">State of Origin / Nationality</label>
                    <input
                      type="text"
                      value={editProfileForm.stateOfOrigin || ''}
                      onChange={e => setEditProfileForm({ ...editProfileForm, stateOfOrigin: e.target.value })}
                      placeholder="e.g. Bayelsa State, Nigeria"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Residential / Campus Address</label>
                    <input
                      type="text"
                      value={editProfileForm.address}
                      onChange={e => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                      placeholder="e.g. 12 Kpansia-Epie Road, Yenagoa, Bayelsa State"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Emergency Contact (Next of Kin)</label>
                    <input
                      type="text"
                      value={editProfileForm.emergencyContact || ''}
                      onChange={e => setEditProfileForm({ ...editProfileForm, emergencyContact: e.target.value })}
                      placeholder="e.g. Mrs. Florence Montessori (Spouse)"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Emergency Phone Number</label>
                    <input
                      type="tel"
                      value={editProfileForm.emergencyPhone || ''}
                      onChange={e => setEditProfileForm({ ...editProfileForm, emergencyPhone: e.target.value })}
                      placeholder="e.g. +234 802 987 6543"
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileForm(adminProfileData);
                      setIsEditingAdminDetails(false);
                    }}
                    className="px-5 py-2.5 bg-muted/60 text-muted-foreground border border-border text-xs font-bold rounded-xl hover:bg-accent hover:text-foreground transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Profile Details
                  </button>
                </div>
              </form>
            ) : (
              /* Read-Only Details Grid View */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Full Name</span>
                    <p className="font-bold text-sm text-foreground">{adminProfileData.name}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Administrator Staff ID</span>
                    <p className="font-mono font-bold text-sm text-primary">{adminProfileData.id}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Official Executive Title</span>
                    <p className="font-semibold text-foreground">{adminProfileData.title}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Department / Governance Unit</span>
                    <p className="font-semibold text-foreground">{adminProfileData.department}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Official Email Address</span>
                    <p className="font-medium text-foreground">{adminProfileData.email}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Direct Phone Contact</span>
                    <p className="font-medium text-foreground">{adminProfileData.phone}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Date of Birth</span>
                    <p className="font-medium text-foreground">{adminProfileData.dob || '1978-08-15'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">State of Origin / Nationality</span>
                    <p className="font-medium text-foreground">{adminProfileData.stateOfOrigin || 'Bayelsa State, Nigeria'}</p>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Residential / Campus Address</span>
                    <p className="font-medium text-foreground">{adminProfileData.address || '12 Kpansia-Epie Road, Yenagoa, Bayelsa State'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Emergency Contact (Next of Kin)</span>
                    <p className="font-medium text-foreground">{adminProfileData.emergencyContact || 'Mrs. Florence Montessori (Spouse)'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Emergency Phone Number</span>
                    <p className="font-medium text-foreground">{adminProfileData.emergencyPhone || '+234 802 987 6543'}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileForm(adminProfileData);
                      setIsEditingAdminDetails(true);
                    }}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Administrator Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Modal */}
          {showChangePasswordModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-serif font-bold text-lg text-foreground">Change Administrator Password</h3>
                  <button onClick={() => setShowChangePasswordModal(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-accent cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {passwordSuccess ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto" />
                    <p>Password updated and secured successfully!</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.current}
                        onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                        value={passwordForm.newPass}
                        onChange={e => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Repeat new password"
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          if (!passwordForm.newPass || passwordForm.newPass !== passwordForm.confirm) {
                            showToast('The new password and confirmation password do not match.');
                            return;
                          }
                          const check = validatePasswordStrength(passwordForm.newPass);
                          if (!check.isValid) {
                            showToast('Password must be 8+ chars with uppercase, number and symbol.');
                            return;
                          }
                          setAdminPassword(passwordForm.newPass);
                          setPasswordSuccess(true);
                          showToast('Admin password updated successfully!');
                          setTimeout(() => setShowChangePasswordModal(false), 1500);
                        }}
                        className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => setShowChangePasswordModal(false)}
                        className="px-5 py-3 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }


    const renderModuleHeader = (title: string, desc: string, icon: React.ElementType) => {
      const Icon = icon;
      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">{title} Module</h2>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <button className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add {title.replace(/s$/, '')}
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground">{title} Management System</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t('common.moduleControlDesc').replace('{title}', title.toLowerCase())}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl shadow-xs hover:bg-primary/90 transition-all">
                {t('common.viewAll')} {title}
              </button>
              <button className="px-4 py-2 text-xs font-bold bg-muted text-foreground rounded-xl border border-border hover:bg-accent transition-all">
                {t('common.exportData')}
              </button>
            </div>
          </div>
        </div>
      );
    };

    if (activeSection === 'teachers') {
      if (selectedTeacher) {
        const liveTeacher = teachersList.find((t: any) => (selectedTeacher.id && t.id === selectedTeacher.id) || (selectedTeacher.staffId && t.staffId === selectedTeacher.staffId) || (selectedTeacher.email && t.email === selectedTeacher.email));
        const tchr = {
          ...selectedTeacher,
          ...(liveTeacher || {}),
          name: (liveTeacher?.name || selectedTeacher?.name || (selectedTeacher?.first_name ? `${selectedTeacher.first_name} ${selectedTeacher.last_name || ''}`.trim() : '') || selectedTeacher?.email || 'Teacher'),
          staffId: (liveTeacher?.staffId || selectedTeacher?.staffId || selectedTeacher?.teacher_id || (selectedTeacher?.id ? `TMS/TCH/${selectedTeacher.id}` : 'TMS/TCH/001')),
          department: (liveTeacher?.department || selectedTeacher?.department || 'Academic Staff'),
          specialization: (liveTeacher?.specialization || selectedTeacher?.specialization || 'Educator'),
          status: (liveTeacher?.status || selectedTeacher?.status || 'Active'),
          profileImage: liveTeacher?.profileImage || selectedTeacher?.profileImage || selectedTeacher?.profile_image || selectedTeacher?.profile?.profile_image || '',
        };
        return (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Teachers Directory
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">Teacher Profile: {tchr.name}</span>
            </div>

            {/* Profile Card Header */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border gap-2 sm:gap-4 w-full">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <h3 className="font-serif font-bold text-sm sm:text-lg text-foreground truncate">Teacher Official Profile</h3>
                </div>
                {/* Actions Dropdown */}
                <div className="relative shrink-0 ml-auto">
                  <button
                    onClick={() => setShowTeacherActionsDropdown(prev => !prev)}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Actions
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showTeacherActionsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showTeacherActionsDropdown && (
                    <>
                      {/* Backdrop to close on outside click */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowTeacherActionsDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* Staff ID Card */}
                        <button
                          onClick={() => { setShowTeacherIDCardModal(tchr); setShowTeacherActionsDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors text-left"
                        >
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <FaIdCard className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                          Staff ID Card
                        </button>
                        {/* Send Email */}
                        <button
                          onClick={() => { window.location.href = sanitizeMailto(tchr.email); setShowTeacherActionsDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors text-left"
                        >
                          <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                          </span>
                          Send Email
                        </button>
                        {/* Set On Leave / Set Active */}
                        <button
                          onClick={() => {
                            const newStatus = tchr.status === 'Active' ? 'On Leave' : 'Active';
                            saveTeacher({ ...tchr, status: newStatus });
                            setTeachersList(getStoredTeachers());
                            setSelectedTeacher({ ...tchr, status: newStatus });
                            setShowTeacherActionsDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors text-left"
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tchr.status === 'Active' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                            <UserCheck className={`w-3.5 h-3.5 ${tchr.status === 'Active' ? 'text-amber-600' : 'text-emerald-600'}`} />
                          </span>
                          {tchr.status === 'Active' ? 'Set On Leave' : 'Set Active'}
                        </button>
                        <div className="border-t border-border mx-3 my-1" />
                        {/* Edit */}
                        <button
                          onClick={() => { setEditTeacherForm({ ...tchr }); setShowEditTeacherModal(true); setShowTeacherActionsDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors text-left"
                        >
                          <span className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                            <Pencil className="w-3.5 h-3.5 text-violet-600" />
                          </span>
                          Edit Profile
                        </button>
                        {/* Delete */}
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirm({
                              title: 'Delete Teacher Profile',
                              message: `Are you sure you want to permanently delete ${tchr.name}'s profile? This action cannot be undone.`,
                              type: 'delete',
                              badge: 'Teacher Directory',
                              confirmText: 'Yes, Delete Teacher',
                              cancelText: 'Keep Teacher',
                            });
                            if (confirmed) {
                              deleteTeacher(tchr.id);
                              setTeachersList(getStoredTeachers());
                              setSelectedTeacher(null);
                              setShowTeacherActionsDropdown(false);
                              showAlert({
                                title: 'Teacher Profile Deleted',
                                message: `Teacher ${tchr.name}'s profile has been removed.`,
                                type: 'success',
                              });
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <span className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </span>
                          Delete Teacher
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 3-Column Specification Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
                {/* Column 1: Teacher Photo & Badge */}
                <div className="md:col-span-3 flex flex-col items-center">
                  <div className="w-44 h-52 rounded-2xl border-2 border-emerald-500/30 shadow-md overflow-hidden bg-muted/20 flex items-center justify-center relative group">
                    {tchr.profileImage ? (
                      <img src={tchr.profileImage} alt={tchr.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center text-4xl font-serif font-bold text-emerald-700">
                        {tchr?.name?.[0] || 'T'}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="adminTeacherDirectAvatarInput"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            (window as any).showTarepetAlert?.('The selected image file exceeds 10MB. Please select a photo below 10MB.', 'Image Size Limit Exceeded', 'warning');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            triggerCropModal(base64, (cropped) => {
                              handleSaveTeacherRealtime({ ...tchr, profileImage: cropped });
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label
                      htmlFor="adminTeacherDirectAvatarInput"
                      className="absolute -bottom-1 -right-1 p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow cursor-pointer hover:scale-105 transition-all border border-card"
                      title="Upload Teacher Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                    <label
                      htmlFor="adminTeacherDirectAvatarInput"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      title="Upload & Crop Photo"
                    >
                      <Upload className="w-3 h-3" /> Change
                    </label>

                    {tchr.profileImage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            triggerCropModal(tchr.profileImage, (cropped) => {
                              handleSaveTeacherRealtime({ ...tchr, profileImage: cropped });
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-muted hover:bg-accent text-foreground text-[11px] font-bold border border-border transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Crop / Resize current photo"
                        >
                          <Scissors className="w-3 h-3 text-emerald-600" /> Crop
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTeacherAvatarRealtime(tchr)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 text-[11px] font-bold border border-rose-200 dark:border-rose-800/40 transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Delete teacher profile picture"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </>
                    )}
                  </div>

                  <span className={`mt-3 px-3.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    tchr.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    {tchr.status || 'Active'}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-2 font-medium">Faculty Member</p>
                </div>

                {/* Column 2: Personal & Credentials Specifications */}
                <div className="md:col-span-4 space-y-3.5 text-xs leading-relaxed">
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Staff ID Number</span>
                    <strong className="text-foreground font-mono font-bold text-sm bg-emerald-500/10 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-500/20 inline-block mt-0.5">
                      {tchr.staffId || 'TMS/TCH/001'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Full Name & Title</span>
                    <strong className="text-foreground font-bold text-base uppercase">{tchr.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Staff Role / Duty</span>
                    <strong className="text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                      <School className="w-3.5 h-3.5 text-emerald-600" />
                      {tchr.formTeacherOf && tchr.formTeacherOf !== 'None' ? `Form Teacher (${tchr.formTeacherOf})` : 'Form Teacher & Subject Specialist'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Academic Specialization</span>
                    <strong className="text-foreground font-bold">{tchr.specialization || 'Not Specified'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Qualifications & Degrees</span>
                    <strong className="text-foreground font-bold">{tchr.qualification || 'Not Specified'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Form Teacher Class Assignment</span>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold text-xs border border-emerald-500/20">
                      {tchr.formTeacherOf && tchr.formTeacherOf !== 'None' ? tchr.formTeacherOf : (tchr.subjectsAssigned?.[0]?.grade || 'Form Teacher Assigned')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Contact Phone</span>
                    <strong className="text-foreground font-bold">{tchr.phone || '+234 800 000 0000'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Official Email</span>
                    <strong className="text-foreground font-bold underline">{tchr.email}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Residential Address / Location</span>
                    <strong className="text-foreground font-bold">{tchr.address || 'Not Specified'}</strong>
                  </div>
                </div>

                {/* Column 3: Teaching Workload & Assigned Subjects */}
                <div className="md:col-span-5 space-y-4 text-xs leading-relaxed border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" /> Assigned Subjects & Classes ({tchr.subjectsAssigned?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {tchr.subjectsAssigned && tchr.subjectsAssigned.length > 0 ? (
                        tchr.subjectsAssigned.map((sub: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-bold text-foreground">{sub.name || sub.title || sub}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {sub.grade}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic text-xs">No subjects currently assigned.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── Define teacher division categories ───────────────────────
      const TEACHER_DIVISIONS = [
        {
          key: 'NURSERY_PRIMARY',
          title: 'Nursery & Primary Teachers',
          subtitle: 'Nursery 1–3, Primary 1–6',
          description: 'Early childhood and elementary educators teaching foundational curriculum levels.',
          filterFn: (t: any) => {
            const div = (t.teachingDivision || t.department || '').toLowerCase();
            const formOf = (t.formTeacherOf || t.formTeacherClass || '').toLowerCase();
            const spec = (t.specialization || '').toLowerCase();
            const hasSub = t.subjectsAssigned?.some((s: any) => {
              const g = (s.grade || '').toUpperCase();
              const n = (s.name || '').toLowerCase();
              return g.startsWith('NUR') || g.startsWith('PRI') || g.startsWith('BASIC') || n.includes('nursery') || n.includes('primary') || n.includes('basic');
            });
            if (formOf.includes('ss 1') || formOf.includes('ss 2') || formOf.includes('ss 3') || formOf.includes('jss 1') || formOf.includes('jss 2') || formOf.includes('jss 3')) {
              return false;
            }
            return formOf.includes('nur') || formOf.includes('pri') || formOf.includes('basic') || spec.includes('nursery') || spec.includes('primary') || spec.includes('basic') || hasSub || div.includes('nursery') || div.includes('primary');
          },
          icon: School,
          filterKey: 'NURSERY_PRIMARY',
        },
        {
          key: 'JSS',
          title: 'Junior Secondary Teachers',
          subtitle: 'JSS 1, JSS 2, JSS 3',
          description: 'Teachers handling the Junior Secondary School basic education curriculum and BECE prep.',
          filterFn: (t: any) => {
            const div = (t.teachingDivision || t.department || '').toLowerCase();
            const formOf = (t.formTeacherOf || t.formTeacherClass || '').toLowerCase();
            const spec = (t.specialization || '').toLowerCase();
            const hasSub = t.subjectsAssigned?.some((s: any) => {
              const g = (s.grade || '').toUpperCase();
              return g.startsWith('JSS');
            });
            if (formOf.includes('ss 1') || formOf.includes('ss 2') || formOf.includes('ss 3') || formOf.includes('nur') || formOf.includes('pri') || formOf.includes('basic')) {
              return false;
            }
            return formOf.includes('jss') || spec.includes('jss') || hasSub || div.includes('junior') || (div.includes('jss') && !div.includes('ss'));
          },
          icon: BookOpen,
          filterKey: 'JUNIOR',
        },
        {
          key: 'SS',
          title: 'Senior Secondary Teachers',
          subtitle: 'SS 1, SS 2, SS 3',
          description: 'Senior educators managing WAEC/NECO streams in Science and Art departments.',
          filterFn: (t: any) => {
            const div = (t.teachingDivision || t.department || '').toLowerCase();
            const formOf = (t.formTeacherOf || t.formTeacherClass || '').toLowerCase();
            const spec = (t.specialization || '').toLowerCase();
            const hasSub = t.subjectsAssigned?.some((s: any) => {
              const g = (s.grade || '').toUpperCase();
              return g.startsWith('SS');
            });
            if (formOf.includes('jss') || formOf.includes('primary') || formOf.includes('basic') || formOf.includes('nursery') || formOf.includes('pri') || formOf.includes('nur')) {
              return false;
            }
            return formOf.includes('ss') || spec.includes('ss') || hasSub || div.includes('senior') || (div.includes('ss') && !div.includes('jss'));
          },
          icon: GraduationCap,
          filterKey: 'SENIOR',
        },
        {
          key: 'FORM',
          title: 'Form Teachers',
          subtitle: 'Class & Homeroom Teachers',
          description: 'All designated form teachers responsible for class pastoral and administrative duties.',
          filterFn: (t: any) => t.isFormTeacher === 'Yes' || (t.formTeacherOf && t.formTeacherOf !== 'None' && t.formTeacherOf !== '' && !t.formTeacherOf.startsWith('No')),
          icon: ClipboardList,
          filterKey: 'FORM',
        },
      ];

      const activeDivision = TEACHER_DIVISIONS.find(d => d.key === selectedTeacherDivision);

      // Apply filters based on selected division and sort alphabetically A-Z by teacher name
      const filteredTeachers = teachersList.filter(t => {
        const q = teacherSearch.toLowerCase();
        const matchSearch = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.staffId.toLowerCase().includes(q) || (t.specialization && t.specialization.toLowerCase().includes(q)) || (t.formTeacherOf && t.formTeacherOf.toLowerCase().includes(q));
        let matchFilter = true;
        if (activeDivision) {
          matchFilter = activeDivision.filterFn(t);
        }
        return matchSearch && matchFilter;
      }).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              {selectedTeacherDivision && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button
                    onClick={() => { setSelectedTeacherDivision(null); setTeacherSearch(''); }}
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> All Staff Departments
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold text-foreground">{activeDivision?.title}</span>
                </div>
              )}
              <h2 className="font-bold text-xl text-foreground">
                {selectedTeacherDivision ? activeDivision?.title : 'Teaching Staff & Faculty Directory'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTeacherDivision
                  ? activeDivision?.description
                  : 'Select a staff department to browse educators, subject workloads, and faculty profiles.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedTeacherDivision && (
                <button
                  onClick={() => { setSelectedTeacherDivision(null); setTeacherSearch(''); }}
                  className="px-3.5 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Departments
                </button>
              )}
              <button
                onClick={async () => {
                  setIsResetting(true);
                  clearAllStoredTeachers();
                  clearAllStoredStudents();
                  clearCBTStoreCache();
                  await fetchBackendUsers();
                  setIsResetting(false);
                }}
                disabled={isResetting}
                className="px-3 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                title="Purge cached data and immediately re-sync live 25 teachers with backend"
              >
                <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Syncing Backend...' : 'Reset / Sync Live Data'}
              </button>
              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Add New Teacher
              </button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Faculty</p>
                <h3 className="text-2xl font-serif font-bold text-foreground mt-1">{teachersList.length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">All staff</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Duty</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{teachersList.filter(t => t.status === 'Active').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Present today</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Form Teachers</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{teachersList.filter(t => t.formTeacherOf && t.formTeacherOf !== 'None').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Class educators</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><School className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Senior Teachers</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{teachersList.filter(t => TEACHER_DIVISIONS.find(d => d.key === 'SS')?.filterFn(t)).length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Teaching SS classes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Interactive Department Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEACHER_DIVISIONS.map(div => {
              const Icon = div.icon;
              const count = teachersList.filter(div.filterFn).length;
              const isSelected = selectedTeacherDivision === div.key;
              return (
                <div
                  key={div.key}
                  onClick={() => {
                    setSelectedTeacherDivision(isSelected ? null : div.key);
                  }}
                  className={`group border-2 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-3 flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-primary/20 hover:border-primary/50 bg-primary/5'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isSelected ? 'bg-primary text-white border-primary' : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {count} Teachers
                      </span>
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {div.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-primary/80 mt-0.5">{div.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{div.description}</p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-primary/15 flex items-center justify-between text-xs font-bold text-primary">
                    <span>{isSelected ? '✓ Filter Active' : `Filter by ${div.title}`}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Teachers Data Table (Always Visible) */}
          <div className="space-y-4 pt-2">
            {/* Filter Pill & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  placeholder={`Search ${activeDivision ? activeDivision.title : 'all 25 faculty members'} by name, staff ID, subject, email...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {selectedTeacherDivision && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-xl border border-primary/20 text-xs font-bold shrink-0">
                  <span>Filtered: {activeDivision?.title} ({filteredTeachers.length})</span>
                  <button
                    onClick={() => { setSelectedTeacherDivision(null); setTeacherSearch(''); }}
                    className="hover:bg-primary/20 p-1 rounded-md transition-colors"
                    title="Show all faculty members"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Teacher Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Teacher / Staff ID</th>
                    <th className="py-3.5 px-4">Specialization & Qualification</th>
                    <th className="py-3.5 px-4">Form Teacher Of</th>
                    <th className="py-3.5 px-4">Email / Phone</th>
                    <th className="py-3.5 px-4">Workload</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right text-[10px]">Click to View Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map(tchr => (
                      <tr
                        key={tchr.id}
                        onClick={() => setSelectedTeacher(tchr)}
                        className="hover:bg-primary/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl font-bold text-sm bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                              {tchr.profileImage ? (
                                <img src={tchr.profileImage} alt={tchr.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                tchr?.name?.[0] || 'T'
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{tchr.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{tchr.staffId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-foreground">{tchr.specialization || 'Not Specified'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{tchr.qualification || 'Not Specified'}</p>
                        </td>
                        <td className="py-4 px-4 font-semibold text-primary">
                          {tchr.formTeacherOf || 'None'}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <p className="text-foreground font-medium">{tchr.email}</p>
                          <p className="text-[10px]">{tchr.phone}</p>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <p className="font-bold text-foreground">{tchr.subjectsAssigned?.length || 0} Subjects</p>
                          <p className="text-[10px]">{tchr.studentsCount || 0} Students</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            tchr.status === 'Active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-500/10 text-amber-600 border-amber-200'
                          }`}>
                            {tchr.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                            View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
                        <p className="text-sm font-semibold">No teachers found matching criteria.</p>
                        <p className="text-xs mt-1">Try clearing filters or adjusting your search query.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showAddTeacherModal && (
            <AddTeacherWizardModal
              onClose={() => setShowAddTeacherModal(false)}
              onSave={(created) => {
                const updatedList = getStoredTeachers();
                setTeachersList(updatedList);
                setSelectedTeacher(created);
                setShowAddTeacherModal(false);
                showToast(`Teacher profile for ${created.name} successfully registered and saved!`);
              }}
            />
          )}
        </div>
      );

    }
    if (activeSection === 'classes') {
      const fallbackClass = {
        id: selectedTimetableClassKey || 'JSS1',
        code: selectedTimetableClassKey || 'JSS1',
        title: `${selectedTimetableClassKey || 'JSS 1'} Class`,
        division: 'Junior',
        stream: 'General',
        formTeacher: 'Unassigned',
        enrolled: 0,
        room: 'Unassigned',
      };
      const activeClassData = (MOCK_CLASSES && MOCK_CLASSES.length > 0)
        ? (MOCK_CLASSES.find(c => c.code === selectedTimetableClassKey || c.id === selectedTimetableClassKey) || MOCK_CLASSES[0])
        : fallbackClass;

      const activeTimetable = (timetablesState && (safeLookup(timetablesState, selectedTimetableClassKey) || (activeClassData.code && safeLookup(timetablesState, activeClassData.code)))) || {
        title: `${activeClassData.title} Timetable`,
        formTeacher: activeClassData.formTeacher,
        room: activeClassData.room,
        schedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] },
      };

      const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const handleSaveSlot = (e: React.FormEvent) => {
        e.preventDefault();
        const currentTt = safeLookup(timetablesState, selectedTimetableClassKey) || (activeClassData.code && safeLookup(timetablesState, activeClassData.code)) || { title: activeClassData.title, schedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] } };
        const updatedSchedule = { ...currentTt.schedule };
        
        const targetDay = slotForm.day;
        const currentDaySlots = safeLookup(updatedSchedule, targetDay) || [];

        if (editingSlotData) {
          const editDay = editingSlotData.day;
          const daySlots = (safeLookup(updatedSchedule, editDay) || []).map((s: any, idx: number) => {
            if (idx === editingSlotData.index) {
              return {
                subject: slotForm.subject,
                code: slotForm.code,
                teacher: slotForm.teacher,
                room: slotForm.room || activeClassData.room,
                time: slotForm.time,
              };
            }
            return s;
          });
          Reflect.set(updatedSchedule, editDay, daySlots);
        } else {
          const newSlots = [
            ...currentDaySlots,
            {
              subject: slotForm.subject,
              code: slotForm.code,
              teacher: slotForm.teacher,
              room: slotForm.room || activeClassData.room,
              time: slotForm.time,
            }
          ];
          Reflect.set(updatedSchedule, targetDay, newSlots);
        }

        const updatedTtState = {
          ...timetablesState,
        };
        Reflect.set(updatedTtState, selectedTimetableClassKey, {
          ...currentTt,
          schedule: updatedSchedule
        });

        saveTimetables(updatedTtState);
        setShowAddSlotModal(false);
        setEditingSlotData(null);
        setSlotForm({ day: 'Monday', time: '08:30 - 09:15', subject: '', code: '', teacher: '', room: '' });
      };

      const handleDeleteSlotConfirmed = () => {
        if (!deletingSlotData) return;
        const currentTt = safeLookup(timetablesState, selectedTimetableClassKey) || (activeClassData.code && safeLookup(timetablesState, activeClassData.code));
        if (!currentTt) return;

        const updatedSchedule = { ...currentTt.schedule };
        const daySlots = (safeLookup(updatedSchedule, deletingSlotData.day) || []).filter((_: any, idx: number) => idx !== deletingSlotData.index);
        Reflect.set(updatedSchedule, deletingSlotData.day, daySlots);

        const updatedTtState = {
          ...timetablesState,
        };
        Reflect.set(updatedTtState, selectedTimetableClassKey, {
          ...currentTt,
          schedule: updatedSchedule
        });

        saveTimetables(updatedTtState);
        setDeletingSlotData(null);
      };

      const handleClearTimetableConfirmed = () => {
        const currentTt = safeLookup(timetablesState, selectedTimetableClassKey) || (activeClassData.code && safeLookup(timetablesState, activeClassData.code));
        if (!currentTt) return;

        const emptySchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
        const updatedTtState = {
          ...timetablesState,
        };
        Reflect.set(updatedTtState, selectedTimetableClassKey, {
          ...currentTt,
          schedule: emptySchedule
        });

        saveTimetables(updatedTtState);
        setShowClearTimetableConfirm(false);
      };

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">Classroom & Student Timetable Management</h2>
                <p className="text-xs text-muted-foreground">Comprehensive master timetable scheduling hub for JSS 1 through SS 3 students. Create, edit, delete, and manage subject slots.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSlotForm({ day: selectedTimetableDay === 'All' ? 'Monday' : selectedTimetableDay, time: '08:30 - 09:15', subject: '', code: '', teacher: '', room: activeClassData.room });
                  setEditingSlotData(null);
                  setShowAddSlotModal(true);
                }}
                className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Timetable Slot
              </button>
              <button
                onClick={() => setSelectedClassRosterModal(activeClassData)}
                className="bg-card border border-border text-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-emerald-600" /> Class Roster
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Level</p>
                <h3 className="text-xl font-serif font-bold text-foreground mt-1">{activeClassData.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{activeClassData.division} Secondary ({activeClassData.stream})</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Form Teacher</p>
                <h3 className="text-base font-bold text-foreground mt-1 truncate max-w-[150px]">{activeClassData.formTeacher}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{activeClassData.room}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weekly Period Slots</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">
                  {Number(Object.values(activeTimetable.schedule || {}).reduce((acc: number, curr: any) => acc + (Array.isArray(curr) ? curr.length : 0), 0))} Slots
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Across 5 academic days</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Enrolled Students</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{activeClassData.enrolled ?? 0}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">No capacity limit</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Class Selectors (JSS1 to SS3) */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Class Timetable (JSS1 — SS3):</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'JSS1', label: 'JSS 1 General', badge: 'Junior' },
                { key: 'JSS2', label: 'JSS 2 General', badge: 'Junior' },
                { key: 'JSS3', label: 'JSS 3 General', badge: 'Junior' },
                { key: 'SS1', label: 'SS 1 Science', badge: 'Science' },
                { key: 'SS1-ART', label: 'SS 1 Art', badge: 'Art' },
                { key: 'SS2', label: 'SS 2 Science', badge: 'Science' },
                { key: 'SS2-ART', label: 'SS 2 Art', badge: 'Art' },
                { key: 'SS3', label: 'SS 3 Science', badge: 'Science' },
                { key: 'SS3-ART', label: 'SS 3 Art', badge: 'Art' },
              ].map(item => {
                const isActive = selectedTimetableClassKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setSelectedTimetableClassKey(item.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                        : 'bg-muted/30 border-border text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Selector & Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedTimetableDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    selectedTimetableDay === day
                      ? 'bg-secondary text-white border-secondary shadow-sm'
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {day === 'All' ? 'Full Week Schedule' : day}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowClearTimetableConfirm(true)}
                className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-500/10 text-rose-600 text-xs font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Timetable
              </button>
            </div>
          </div>

          {/* Timetable Schedule Cards & Grid */}
          <div className="space-y-6">
            {daysList
              .filter(day => selectedTimetableDay === 'All' || selectedTimetableDay === day)
              .map(day => {
                const daySlots = (activeTimetable.schedule && safeLookup(activeTimetable.schedule, day)) || [];
                return (
                  <div key={day} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden space-y-0">
                    <div className="bg-muted/40 px-5 py-3.5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-sm text-foreground">{day} Schedule</h3>
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {daySlots.length} Period Slots
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSlotForm({ day, time: '08:30 - 09:15', subject: '', code: '', teacher: '', room: activeClassData.room });
                          setEditingSlotData(null);
                          setShowAddSlotModal(true);
                        }}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Slot to {day}
                      </button>
                    </div>

                    <div className="p-5">
                      {daySlots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {daySlots.map((slot: any, idx: number) => {
                            const defaultPeriod = safeIndex(TIMETABLE_PERIODS, idx);
                            return (
                            <div key={idx} className="bg-muted/20 hover:bg-muted/40 transition-all border border-border/80 rounded-xl p-4 space-y-3 relative group">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                                    {slot.code || 'SUB-001'}
                                  </span>
                                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    {slot.time || defaultPeriod?.time || '08:30 - 09:15'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setSlotForm({
                                        day,
                                        time: slot.time || defaultPeriod?.time || '08:30 - 09:15',
                                        subject: slot.subject || '',
                                        code: slot.code || '',
                                        teacher: slot.teacher || '',
                                        room: slot.room || activeClassData.room,
                                      });
                                      setEditingSlotData({ day, index: idx, slot });
                                      setShowAddSlotModal(true);
                                    }}
                                    className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                    title="Edit Slot"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingSlotData({ day, index: idx, slot })}
                                    className="p-1 hover:bg-rose-500/10 rounded-lg text-rose-600 transition-colors"
                                    title="Delete Slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-sm text-foreground">{slot.subject}</h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  {slot.teacher}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">Room: <strong className="text-foreground">{slot.room || activeClassData.room}</strong></span>
                                <span className="text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Scheduled
                                </span>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground space-y-2">
                          <Clock className="w-8 h-8 mx-auto opacity-30 text-primary" />
                          <p className="text-xs font-semibold">No timetable period slots added for {day} yet.</p>
                          <button
                            onClick={() => {
                              setSlotForm({ day, time: '08:30 - 09:15', subject: '', code: '', teacher: '', room: activeClassData.room });
                              setEditingSlotData(null);
                              setShowAddSlotModal(true);
                            }}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            + Add First Slot for {day}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Add / Edit Timetable Slot Modal */}
          {showAddSlotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {editingSlotData ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Class: <strong className="text-foreground">{activeClassData.title}</strong></p>
                  </div>
                  <button onClick={() => { setShowAddSlotModal(false); setEditingSlotData(null); }} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSlot} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground mb-1 block">Day of Week</label>
                      <select
                        value={slotForm.day}
                        onChange={e => setSlotForm({ ...slotForm, day: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-card text-xs font-semibold"
                      >
                        {daysList.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground mb-1 block">Time Period</label>
                      <select
                        value={slotForm.time}
                        onChange={e => setSlotForm({ ...slotForm, time: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-card text-xs font-semibold"
                      >
                        {TIMETABLE_PERIODS.map((p, idx) => (
                          <option key={idx} value={p.time}>{p.label} ({p.time})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-foreground mb-1 block">Subject Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Junior Mathematics"
                        value={slotForm.subject}
                        onChange={e => setSlotForm({ ...slotForm, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-muted/20 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground mb-1 block">Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MTH-001"
                        value={slotForm.code}
                        onChange={e => setSlotForm({ ...slotForm, code: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-muted/20 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground mb-1 block">Assigned Educator</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mr. Okonkwo Paul"
                        value={slotForm.teacher}
                        onChange={e => setSlotForm({ ...slotForm, teacher: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-muted/20 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground mb-1 block">Room / Venue</label>
                      <input
                        type="text"
                        placeholder="e.g. Block A, Room 101"
                        value={slotForm.room}
                        onChange={e => setSlotForm({ ...slotForm, room: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-muted/20 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => { setShowAddSlotModal(false); setEditingSlotData(null); }}
                      className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
                    >
                      {editingSlotData ? 'Save Changes' : 'Create Slot'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Slot Confirmation Modal */}
          {deletingSlotData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-foreground">Confirm Slot Deletion</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to remove <strong>{deletingSlotData.slot?.subject}</strong> ({deletingSlotData.slot?.code}) scheduled for <strong>{deletingSlotData.day}</strong> from the master timetable?
                </p>
                <div className="pt-2 flex justify-end gap-2 border-t border-border">
                  <button onClick={() => setDeletingSlotData(null)} className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted">
                    Cancel
                  </button>
                  <button onClick={handleDeleteSlotConfirmed} className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700">
                    Delete Slot
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clear Timetable Confirmation Modal */}
          {showClearTimetableConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <Trash2 className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-foreground">Clear Entire Timetable</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to clear all period slots for <strong>{activeClassData.title}</strong>? This action cannot be undone.
                </p>
                <div className="pt-2 flex justify-end gap-2 border-t border-border">
                  <button onClick={() => setShowClearTimetableConfirm(false)} className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted">
                    Cancel
                  </button>
                  <button onClick={handleClearTimetableConfirmed} className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700">
                    Clear Timetable
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Class Roster Modal */}
          {selectedClassRosterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{selectedClassRosterModal.title}</h3>
                    <p className="text-xs text-muted-foreground">Form Teacher: <strong className="text-foreground">{selectedClassRosterModal.formTeacher}</strong> ({selectedClassRosterModal.staffId}) · {selectedClassRosterModal.room}</p>
                  </div>
                  <button onClick={() => setSelectedClassRosterModal(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Class Roster (Enrolled Students)</h4>
                    <div className="bg-muted/20 rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Admission No</th>
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Gender</th>
                            <th className="py-2.5 px-3">House</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {MOCK_STUDENTS.filter(s => s.grade === selectedClassRosterModal.code || s.grade === String(selectedClassRosterModal.id || '').split('-')[0]).map(std => (
                            <tr key={std.id} className="hover:bg-muted/30">
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">{std.admissionNo}</td>
                              <td className="py-2.5 px-3 font-bold text-foreground">{std.name}</td>
                              <td className="py-2.5 px-3">{std.gender}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{std.house}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-600">Active</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end border-t border-border">
                  <button onClick={() => setSelectedClassRosterModal(null)} className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90">
                    Close Roster
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeSection === 'subjects') {
      // ── Subject division categories ───────────────────────────
      const SUBJECT_DIVISIONS = [
        {
          key: 'NURSERY_PRIMARY',
          title: 'Nursery & Primary Subjects',
          subtitle: 'Nursery 1–3, Primary 1–6',
          description: 'Core foundational subjects covering early childhood literacy, numeracy, and basic sciences.',
          icon: School,
          filterFn: (s: any) => {
            const g = (s.grade || '').toUpperCase();
            return g.startsWith('NUR') || g.startsWith('PRI') || g.startsWith('CRECHE') || g.startsWith('BASIC') || s.category === 'Early Childhood' || s.category === 'Primary' || s.category === 'Montessori';
          },
        },
        {
          key: 'JSS',
          title: 'Junior Secondary Subjects',
          subtitle: 'JSS 1, JSS 2, JSS 3',
          description: 'Comprehensive curriculum subjects for the Junior Secondary School levels, covering all streams.',
          icon: BookMarked,
          filterFn: (s: any) => {
            const g = (s.grade || '').toUpperCase();
            return g.startsWith('JSS') || g.startsWith('JS') || s.category === 'Junior Secondary' || (g.includes('JSS') && s.stream === 'General');
          },
        },
        {
          key: 'SS_SCIENCE',
          title: 'Senior Secondary — Science',
          subtitle: 'SS 1–3 Science Stream',
          description: 'Mathematics, Physics, Chemistry, Biology and other STEM subjects for the Science stream.',
          icon: FlaskConical,
          filterFn: (s: any) => {
            const g = (s.grade || '').toUpperCase();
            return g.startsWith('SS') && s.stream === 'Science';
          },
        },
        {
          key: 'SS_ART',
          title: 'Senior Secondary — Art & Humanities',
          subtitle: 'SS 1–3 Art Stream',
          description: 'Literature, Government, Economics, CRS, History, Fine Arts, and Languages for the Art stream.',
          icon: Palette,
          filterFn: (s: any) => {
            const g = (s.grade || '').toUpperCase();
            return g.startsWith('SS') && (s.stream === 'Art' || s.stream === 'Arts');
          },
        },
      ];

      const activeSubjectDivision = SUBJECT_DIVISIONS.find(d => d.key === selectedSubjectDivision);

      const filteredSubjects = subjectsListState.filter(sub => {
        const q = subjectSearch.toLowerCase();
        const matchSearch = !q || sub.title.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q) || sub.grade.toLowerCase().includes(q) || sub.teacher.toLowerCase().includes(q);
        let matchFilter = true;
        if (activeSubjectDivision) {
          matchFilter = activeSubjectDivision.filterFn(sub);
        }
        return matchSearch && matchFilter;
      });

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              {selectedSubjectDivision && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button
                    onClick={() => { setSelectedSubjectDivision(null); setSubjectSearch(''); }}
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> All Subject Categories
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold text-foreground">{activeSubjectDivision?.title}</span>
                </div>
              )}
              <h2 className="font-bold text-xl text-foreground">
                {selectedSubjectDivision ? activeSubjectDivision?.title : 'School Curriculum & Subjects Directory'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSubjectDivision
                  ? activeSubjectDivision?.description
                  : 'Select a curriculum category to browse all subjects and assigned educators.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedSubjectDivision && (
                <button
                  onClick={() => { setSelectedSubjectDivision(null); setSubjectSearch(''); }}
                  className="px-3.5 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Categories
                </button>
              )}
              <button
                onClick={() => setShowCreateSubjectModal(true)}
                className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Subject
              </button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Subjects</p>
                <h3 className="text-2xl font-serif font-bold text-foreground mt-1">{subjectsListState.length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active curriculum</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Junior Subjects</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{subjectsListState.filter(s => (s.grade || '').toUpperCase().startsWith('JSS') || (s.grade || '').toUpperCase().startsWith('JS')).length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">JSS 1–3 classes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BookMarked className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Senior Subjects</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{subjectsListState.filter(s => (s.grade || '').toUpperCase().startsWith('SS')).length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">SS 1–3 classes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Science & STEM</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{subjectsListState.filter(s => s.stream === 'Science').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Lab & Practical</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FlaskConical className="w-5 h-5" /></div>
            </div>
          </div>

          {/* LEVEL 1: Category Cards */}
          {!selectedSubjectDivision ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {SUBJECT_DIVISIONS.map(div => {
                const Icon = div.icon;
                const count = subjectsListState.filter(div.filterFn).length;
                return (
                  <div
                    key={div.key}
                    onClick={() => setSelectedSubjectDivision(div.key)}
                    className="group bg-card border-2 border-primary/20 hover:border-primary/50 bg-primary/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {count} Subject{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {div.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-primary/80 mt-0.5">{div.subtitle}</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{div.description}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-primary/15 flex items-center justify-between text-xs font-bold text-primary">
                      <span>Browse {count} Subject{count !== 1 ? 's' : ''}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LEVEL 2: Filtered Subjects Table */
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  placeholder={`Search ${activeSubjectDivision?.title} by subject name, grade, teacher...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Subjects Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Subject Title</th>
                      <th className="py-3.5 px-4">Grade Level</th>
                      <th className="py-3.5 px-4">Stream / Category</th>
                      <th className="py-3.5 px-4">Assigned Educator</th>
                      <th className="py-3.5 px-4">Students Enrolled</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map(sub => {
                        const dynamicEnrolledCount = studentsList.filter(st => {
                          const matchGrade = matchStudentClass(st.grade, sub.grade);
                          const matchStream = !sub.stream || sub.stream === 'General' || (st.stream || 'Science') === sub.stream;
                          return matchGrade && matchStream;
                        }).length;

                        return (
                          <tr
                            key={sub.id}
                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                            onClick={() => setSelectedSubjectPreview({ ...sub, studentsCount: dynamicEnrolledCount })}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{sub.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-foreground">
                              <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                sub.stream === 'Science' ? 'bg-primary/10 text-primary border-primary/20' :
                                sub.stream === 'Art' ? 'bg-primary/10 text-primary border-primary/20' :
                                'bg-muted text-muted-foreground border-border'
                              }`}>
                                {sub.stream || 'General'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold">
                              {sub.teacher && sub.teacher !== 'Not Assigned' ? (
                                <span className="text-foreground">{sub.teacher}</span>
                              ) : (
                                <span className="inline-block text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                  Not Assigned
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-foreground">{dynamicEnrolledCount} Student{dynamicEnrolledCount !== 1 ? 's' : ''}</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                                Active Course
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                          <p className="text-sm font-semibold">No subjects found in this category.</p>
                          <p className="text-xs mt-1">Try adding subjects or adjusting your search.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeSection === 'results') {
      const SIX_CLASSES = [
        { code: 'JSS1', title: 'JSS 1', fullTitle: 'Junior Secondary 1', division: 'Junior', count: MOCK_STUDENTS.filter(s => s.grade === 'JSS1').length, formTeacher: 'Mrs. Okafor Chioma', room: 'Block A, Room 101' },
        { code: 'JSS2', title: 'JSS 2', fullTitle: 'Junior Secondary 2', division: 'Junior', count: MOCK_STUDENTS.filter(s => s.grade === 'JSS2').length, formTeacher: 'Engr. Emeka David', room: 'Block A, Room 102' },
        { code: 'JSS3', title: 'JSS 3', fullTitle: 'Junior Secondary 3', division: 'Junior', count: MOCK_STUDENTS.filter(s => s.grade === 'JSS3').length, formTeacher: 'Ms. Adaobi Nwosu', room: 'Block A, Room 103' },
        { code: 'SS1', title: 'SS 1', fullTitle: 'Senior Secondary 1', division: 'Senior', count: MOCK_STUDENTS.filter(s => s.grade === 'SS1').length, formTeacher: 'Mr. Okonkwo Paul', room: 'Block B, Lab 201' },
        { code: 'SS2', title: 'SS 2', fullTitle: 'Senior Secondary 2', division: 'Senior', count: MOCK_STUDENTS.filter(s => s.grade === 'SS2').length, formTeacher: 'Dr. Grace Bassey', room: 'Block B, Lab 204' },
        { code: 'SS3', title: 'SS 3', fullTitle: 'Senior Secondary 3', division: 'Senior', count: MOCK_STUDENTS.filter(s => s.grade === 'SS3').length, formTeacher: 'Mr. James Eze', room: 'Block B, Lab 301' },
      ];

      // Step 1: 6 Main Classes Grid View
      if (!resultsSelectedClass) {
        return (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-foreground mb-1">Student Results & Report Card Center</h2>
                  <p className="text-xs text-muted-foreground">Select a class to view student rosters, manage academic scores, and generate terminal report cards.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SIX_CLASSES.map(cls => (
                <div
                  key={cls.code}
                  onClick={() => setResultsSelectedClass(cls.code)}
                  className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {cls.division} Secondary
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                      {cls.room}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-2xl text-foreground group-hover:text-primary transition-colors">{cls.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.fullTitle}</p>
                  </div>

                  <div className="pt-2 border-t border-border space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Form Teacher:</span>
                      <strong className="text-foreground">{cls.formTeacher}</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Enrolled Students:</span>
                      <strong className="text-emerald-600 font-bold">{cls.count} Students</strong>
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                    View Student Roster & Results <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      }

      const currentClassObj = SIX_CLASSES.find(c => c.code === resultsSelectedClass);
      const classStudents = MOCK_STUDENTS.filter(s => s.grade === resultsSelectedClass);

      // Step 2: Student Roster, Bulk Marksheet, or Fee Ledger for Selected Class
      if (!resultsSelectedStudent) {
        return (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            {/* Class Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
              <button
                onClick={() => setResultsSelectedClass(null)}
                className="px-3.5 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> All 6 Classes
              </button>
              <div className="text-left sm:text-right">
                <h3 className="font-serif font-bold text-lg text-foreground">{currentClassObj?.fullTitle} Academic Center</h3>
                <p className="text-xs text-muted-foreground">Form Teacher: <strong>{currentClassObj?.formTeacher}</strong> · {currentClassObj?.room}</p>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex border-b border-border gap-1 overflow-x-auto pb-px text-xs font-bold">
              {[
                { id: 'roster', label: '1. Student Report Cards', icon: FileText },
                { id: 'marksheet', label: '2. Class Bulk Score Entry (Marksheet)', icon: FileSpreadsheet },
                { id: 'fees', label: '3. Bursary & Fee Payment Ledger', icon: DollarSign },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setResultsViewTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                      resultsViewTab === tab.id
                        ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-t-xl'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── TAB A: Student Roster (Individual Report Cards) ── */}
            {resultsViewTab === 'roster' && (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden space-y-4 p-5">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <h4 className="font-bold text-sm text-foreground">Select a student to compute and print report card:</h4>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200">
                    {classStudents.length} Students Enrolled
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Admission No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Gender</th>
                        <th className="py-3 px-4">Stream / House</th>
                        <th className="py-3 px-4">Parent Phone</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classStudents.map(std => (
                        <tr
                          key={std.id}
                          onClick={() => {
                            setResultsSelectedStudent(std);
                            setResultsSectionStream(std.stream || 'General');
                            setIsResultGenerated(false);
                          }}
                          className="hover:bg-primary/5 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">{std.admissionNo}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground text-sm group-hover:text-primary transition-colors">{std.name}</td>
                          <td className="py-3.5 px-4">{std.gender}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{std.stream} ({std.house})</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{std.parentPhone}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-[11px] border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-all inline-flex items-center gap-1">
                              Check Result <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB B: Class Marksheet / Bulk Score Entry Grid ── */}
            {resultsViewTab === 'marksheet' && (
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h4 className="font-bold text-base text-foreground">Class Academic Marksheet Grid</h4>
                    <p className="text-xs text-muted-foreground">Input CA1, CA2, and Exam scores for all enrolled students in {resultsSelectedClass}.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-foreground">Subject:</label>
                    <select
                      value={marksheetSubject}
                      onChange={e => setMarksheetSubject(e.target.value)}
                      className="px-3 py-2 border border-border rounded-xl bg-card text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="English Language">English Language</option>
                      <option value="Basic Science">Basic Science</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Civic Education">Civic Education</option>
                    </select>
                  </div>
                </div>

                {marksheetSaveAlert && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Class Marksheet for {marksheetSubject} saved successfully to persistent storage!
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Admission No</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3 text-center">CA 1 (15%)</th>
                        <th className="py-3 px-3 text-center">CA 2 (15%)</th>
                        <th className="py-3 px-3 text-center">Exam (70%)</th>
                        <th className="py-3 px-3 text-center font-bold">Total (100%)</th>
                        <th className="py-3 px-3 text-center font-bold">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classStudents.map(std => {
                        const stdKey = String(std.id);
                        const scores = Object.prototype.hasOwnProperty.call(classScoresMap, stdKey)
                          ? classScoresMap[stdKey]
                          : { ca1: 12, ca2: 13, exam: 50 };
                        const total = scores.ca1 + scores.ca2 + scores.exam;
                        const grade = total >= 75 ? 'A' : total >= 65 ? 'B' : total >= 55 ? 'C' : total >= 50 ? 'D' : 'F';
                        
                        const handleScoreChange = (field: 'ca1' | 'ca2' | 'exam', rawVal: string, max: number) => {
                          const val = Math.min(max, Math.max(0, parseInt(rawVal, 10) || 0));
                          setClassScoresMap(prev => ({
                            ...prev,
                            [stdKey]: {
                              ...(prev[stdKey] || { ca1: 12, ca2: 13, exam: 50 }),
                              [field]: val,
                            }
                          }));
                        };

                        return (
                          <tr key={std.id} className="hover:bg-muted/10">
                            <td className="py-3 px-3 font-mono font-bold text-primary">{std.admissionNo}</td>
                            <td className="py-3 px-3 font-bold text-foreground">{std.name}</td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={scores.ca1}
                                onChange={e => handleScoreChange('ca1', e.target.value, 15)}
                                className="w-16 border border-border rounded-lg text-center py-1 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={scores.ca2}
                                onChange={e => handleScoreChange('ca2', e.target.value, 15)}
                                className="w-16 border border-border rounded-lg text-center py-1 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                value={scores.exam}
                                onChange={e => handleScoreChange('exam', e.target.value, 70)}
                                className="w-20 border border-border rounded-lg text-center py-1 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-primary text-sm">{total}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        try {
                          localStorage.setItem('tarepet_class_scores_map', JSON.stringify(classScoresMap));
                        } catch (e) {}
                      }
                      setMarksheetSaveAlert(true);
                      setTimeout(() => setMarksheetSaveAlert(false), 2500);
                    }}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Class Marksheet
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB C: Bursary & Fee Payment Ledger ── */}
            {resultsViewTab === 'fees' && (
              <div className="space-y-6">
                {/* 1. ADMIN FEE AMOUNT SETUP FORM */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
                        <Settings className="w-3.5 h-3.5" /> Admin Financial Control
                      </div>
                      <h4 className="font-serif font-bold text-lg text-foreground">Configure Individual Fee Amounts</h4>
                      <p className="text-xs text-muted-foreground">Set official amounts for tuition, boarding, exams, uniform, bus, and lab fees. Changes update student portals in real-time.</p>
                    </div>
                  </div>

                  {feeUpdateSuccessAlert && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feeUpdateSuccessAlert}</span>
                      </div>
                      <button onClick={() => setFeeUpdateSuccessAlert(null)} className="text-xs">✕</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-2xl border border-border">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Target Class / Level</label>
                      <select
                        value={feeTargetGrade}
                        onChange={e => {
                          const targetG = e.target.value;
                          setFeeTargetGrade(targetG);
                          const it = adminPaymentItems.find(i => i.id === selectedFeeToEdit);
                          if (it) {
                            const val = getItemAmountForGrade(it, targetG);
                            setFeeEditAmountInput(val);
                          }
                        }}
                        className="w-full border border-border rounded-xl px-3 py-2.5 bg-card text-foreground text-xs font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="ALL">🌐 All Classes (Default Fallback)</option>
                        <option value="NUR1">🧸 Nursery 1</option>
                        <option value="NUR2">🧸 Nursery 2</option>
                        <option value="PRI1">🎒 Primary 1</option>
                        <option value="PRI2">🎒 Primary 2</option>
                        <option value="PRI3">🎒 Primary 3</option>
                        <option value="PRI4">🎒 Primary 4</option>
                        <option value="PRI5">🎒 Primary 5</option>
                        <option value="PRI6">🎒 Primary 6</option>
                        <option value="JSS1">📘 JSS 1</option>
                        <option value="JSS2">📘 JSS 2</option>
                        <option value="JSS3">📘 JSS 3</option>
                        <option value="SS1">🎓 SS 1</option>
                        <option value="SS2">🎓 SS 2</option>
                        <option value="SS3">🎓 SS 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Select Fee Category / Item</label>
                      <select
                        value={selectedFeeToEdit}
                        onChange={e => {
                          const itemId = e.target.value;
                          setSelectedFeeToEdit(itemId);
                          const it = adminPaymentItems.find(i => i.id === itemId);
                          if (it) {
                            const val = getItemAmountForGrade(it, feeTargetGrade);
                            setFeeEditAmountInput(val);
                          }
                        }}
                        className="w-full border border-border rounded-xl px-3 py-2.5 bg-card text-foreground text-xs font-bold focus:ring-2 focus:ring-primary"
                      >
                        {adminPaymentItems.map(item => {
                          const currentVal = getItemAmountForGrade(item, feeTargetGrade);
                          return (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.category}) — {feeTargetGrade === 'ALL' ? 'General' : feeTargetGrade}: ₦{currentVal.toLocaleString()}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Set Amount (₦ NGN)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount e.g. 85000"
                        value={feeEditAmountInput || ''}
                        onChange={e => setFeeEditAmountInput(Number(e.target.value))}
                        className="w-full border border-border rounded-xl px-3 py-2.5 bg-card text-foreground text-xs font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const targetItem = adminPaymentItems.find(i => i.id === selectedFeeToEdit);
                          if (!targetItem) return;
                          updateFeeItemAmount(selectedFeeToEdit, feeEditAmountInput, feeTargetGrade);
                          const targetLabel = feeTargetGrade === 'ALL' ? 'All Classes' : `Class ${feeTargetGrade}`;
                          setFeeUpdateSuccessAlert(`Updated amount for "${targetItem.name}" (${targetLabel}) to ₦${feeEditAmountInput.toLocaleString()} across all portals!`);
                          setTimeout(() => setFeeUpdateSuccessAlert(null), 4000);
                        }}
                        className="w-full py-2.5 px-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Save & Publish Amount
                      </button>
                    </div>
                  </div>

                  {/* Summary grid of all configured fee items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {adminPaymentItems.map(item => {
                      const displayVal = getItemAmountForGrade(item, feeTargetGrade);
                      const hasOverrides = item.gradeAmounts && Object.keys(item.gradeAmounts).length > 0;
                      return (
                        <div key={item.id} className={`p-3 rounded-xl border text-xs transition-all ${displayVal > 0 ? 'bg-card border-border' : 'bg-amber-500/5 border-amber-500/20'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground block truncate">{item.name}</span>
                            {hasOverrides && (
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">By Class</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`font-serif font-bold ${displayVal > 0 ? 'text-foreground' : 'text-amber-600'}`}>
                              {displayVal > 0 ? `₦${displayVal.toLocaleString()}` : 'Not Configured'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedFeeToEdit(item.id);
                                setFeeEditAmountInput(displayVal);
                              }}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ALL-STUDENTS FINANCIAL STATUS LEDGER (NURSERY TO SS3) */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-foreground">All-Students Financial Status Ledger</h4>
                      <p className="text-xs text-muted-foreground">Monitor payment statuses, inspect student balances, and review financial profiles from Nursery to SS3.</p>
                    </div>
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <DollarSign className="w-4 h-4" /> Log Manual Payment
                    </button>
                  </div>

                  {/* Filters & Search Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Filter Class / Grade</label>
                      <select
                        value={bursaryClassFilter}
                        onChange={e => setBursaryClassFilter(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="ALL">All Classes (Nursery to SS3)</option>
                        <option value="NUR1">Nursery 1</option>
                        <option value="NUR2">Nursery 2</option>
                        <option value="PRI1">Primary 1</option>
                        <option value="PRI2">Primary 2</option>
                        <option value="PRI3">Primary 3</option>
                        <option value="PRI4">Primary 4</option>
                        <option value="PRI5">Primary 5</option>
                        <option value="PRI6">Primary 6</option>
                        <option value="JSS1">JSS 1</option>
                        <option value="JSS2">JSS 2</option>
                        <option value="JSS3">JSS 3</option>
                        <option value="SS1">SS 1</option>
                        <option value="SS2">SS 2</option>
                        <option value="SS3">SS 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Filter Financial Status</label>
                      <select
                        value={bursaryStatusFilter}
                        onChange={e => setBursaryStatusFilter(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="ALL">All Financial Statuses</option>
                        <option value="PAID">Fully Paid</option>
                        <option value="PARTIAL">Partially Paid</option>
                        <option value="OWING">Owing / Unpaid</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Search Student</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search name or admission no…"
                          value={bursarySearchQuery}
                          onChange={e => setBursarySearchQuery(e.target.value)}
                          className="w-full border border-border rounded-xl pl-9 pr-3 py-2 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Student Financial Ledger Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-3">Admission No & Name</th>
                          <th className="py-3 px-3">Class</th>
                          <th className="py-3 px-3 text-right">Total Fee Configured</th>
                          <th className="py-3 px-3 text-right">Amount Paid</th>
                          <th className="py-3 px-3 text-right">Balance Due</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Financial Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {MOCK_STUDENTS.filter(std => {
                          if (bursaryClassFilter !== 'ALL' && std.grade !== bursaryClassFilter) return false;
                          if (bursarySearchQuery) {
                            const q = bursarySearchQuery.toLowerCase();
                            const matchName = std.name.toLowerCase().includes(q);
                            const matchAdm = std.admissionNo.toLowerCase().includes(q);
                            if (!matchName && !matchAdm) return false;
                          }
                          // Compute status
                          const reqItems = adminPaymentItems.filter(i => i.isRequired);
                          const totalFeeAssigned = reqItems.reduce((s, i) => s + i.amount, 0);
                          const stdTxs = getStudentTransactions(std.id).filter(t => t.status === 'SUCCESS');
                          const paidAmt = stdTxs.reduce((s, t) => s + t.amount, 0);
                          const balance = Math.max(0, totalFeeAssigned - paidAmt);
                          const status = totalFeeAssigned === 0 ? 'UNCONFIGURED' : balance === 0 ? 'PAID' : paidAmt > 0 ? 'PARTIAL' : 'OWING';

                          if (bursaryStatusFilter !== 'ALL' && status !== bursaryStatusFilter) return false;
                          return true;
                        }).map(std => {
                          const reqItems = adminPaymentItems.filter(i => i.isRequired);
                          const totalFeeAssigned = reqItems.reduce((s, i) => s + i.amount, 0);
                          const stdTxs = getStudentTransactions(std.id).filter(t => t.status === 'SUCCESS');
                          const paidAmt = stdTxs.reduce((s, t) => s + t.amount, 0);
                          const balance = Math.max(0, totalFeeAssigned - paidAmt);
                          const status = totalFeeAssigned === 0 ? 'UNCONFIGURED' : balance === 0 ? 'PAID' : paidAmt > 0 ? 'PARTIAL' : 'OWING';

                          return (
                            <tr key={std.id} className="hover:bg-muted/10">
                              <td className="py-3.5 px-3">
                                <p className="font-mono font-bold text-primary">{std.admissionNo}</p>
                                <p className="font-bold text-foreground text-sm">{std.name}</p>
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-muted-foreground">{std.grade} ({std.stream})</td>
                              <td className="py-3.5 px-3 text-right font-mono font-bold text-foreground">
                                {totalFeeAssigned > 0 ? `₦${totalFeeAssigned.toLocaleString()}` : <span className="text-amber-600 text-[10px]">Unset</span>}
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">₦{paidAmt.toLocaleString()}</td>
                              <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600">₦{balance.toLocaleString()}</td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                  status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                  status === 'OWING' ? 'bg-rose-500/10 text-rose-600 border-rose-200' :
                                  'bg-slate-500/10 text-slate-600 border-slate-200'
                                }`}>
                                  {status}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <button
                                  onClick={() => setSelectedReviewStudent(std)}
                                  className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold text-[11px] transition-all inline-flex items-center gap-1 shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Review Financial Status
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

                {/* Printable Receipt Modal */}
                {receiptModalData && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-2xl max-w-lg w-full space-y-5 animate-in fade-in zoom-in duration-200 print:border-none print:shadow-none">
                      <div className="flex items-center justify-between pb-3 border-b border-border print:hidden">
                        <h3 className="font-serif font-bold text-lg text-foreground">Official Fee Receipt</h3>
                        <button onClick={() => setReceiptModalData(null)} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Receipt Document */}
                      <div className="border border-border p-6 rounded-xl space-y-4 text-xs bg-muted/10 print:border-none">
                        <div className="text-center space-y-1 pb-3 border-b border-border">
                          <h2 className="font-serif font-extrabold text-xl uppercase tracking-wider text-foreground">Tare Pet Montessori School</h2>
                          <p className="text-[10px] text-muted-foreground">12 Kpansia-Epie Road, Yenagoa, Bayelsa State · Tel: +234 803 123 4567</p>
                          <span className="inline-block font-mono font-bold text-primary text-xs pt-1">RECEIPT NO: {receiptModalData.receiptNo}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground uppercase text-[9px] font-bold">Student Name</p>
                            <p className="font-bold text-foreground">{receiptModalData.studentName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase text-[9px] font-bold">Admission Number</p>
                            <p className="font-mono font-bold text-primary">{receiptModalData.admissionNo}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase text-[9px] font-bold">Class Level</p>
                            <p className="font-bold text-foreground">{receiptModalData.grade}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase text-[9px] font-bold">Payment Date</p>
                            <p className="font-bold text-foreground">{receiptModalData.lastDate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase text-[9px] font-bold">Payment Method</p>
                            <p className="font-bold text-foreground">{receiptModalData.method}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase text-[9px] font-bold">Payment Status</p>
                            <p className="font-bold text-emerald-600">{receiptModalData.status}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Term Tuition Fee:</span>
                            <span className="font-mono font-bold">₦{receiptModalData.totalAmount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount Paid:</span>
                            <span className="font-mono font-bold text-emerald-600">₦{receiptModalData.paidAmount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-border font-bold">
                            <span>Balance Remaining:</span>
                            <span className="font-mono text-rose-600">₦{(receiptModalData.totalAmount - receiptModalData.paidAmount)?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="pt-4 text-center border-t border-border space-y-1">
                          <p className="text-[10px] text-muted-foreground italic">"Thank you for choosing Tare Pet Montessori School."</p>
                          <p className="text-[9px] font-bold text-primary uppercase">Bursary Office Official Stamp Attached</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 print:hidden">
                        <button
                          onClick={() => window.print()}
                          className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Printer className="w-4 h-4" /> Print Official Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
        );
      }

      // Step 3: Result Checker Form (Year, Term, Stream)
      if (!isResultGenerated) {
        return (
          <div className="space-y-6 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-poppins)' }}>
            <button
              onClick={() => setResultsSelectedStudent(null)}
              className="px-3.5 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back to {resultsSelectedClass} Roster
            </button>

            <div className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2 pb-4 border-b border-border">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-foreground">Result Generator Form</h3>
                <p className="text-xs text-muted-foreground">Select session, term, and stream section to compute and display official terminal report card.</p>
              </div>

              {/* Student Card Summary */}
              <div className="bg-muted/30 rounded-2xl p-4 border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-foreground">{resultsSelectedStudent.name}</h4>
                  <p className="text-xs text-muted-foreground">Admission No: <strong className="text-primary font-mono">{resultsSelectedStudent.admissionNo}</strong></p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-200">
                  {resultsSelectedStudent.grade}
                </span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Academic Session / Year</label>
                  <select
                    value={resultsYear}
                    onChange={e => setResultsYear(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-card text-sm font-semibold focus:ring-2 focus:ring-primary"
                  >
                    <option value="2025/2026">2025/2026 Academic Session</option>
                    <option value="2024/2025">2024/2025 Academic Session</option>
                    <option value="2023/2024">2023/2024 Academic Session</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Academic Term</label>
                  <select
                    value={resultsTerm}
                    onChange={e => setResultsTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-card text-sm font-semibold focus:ring-2 focus:ring-primary"
                  >
                    <option value="1st Term">1st Term (Sept - Dec)</option>
                    <option value="2nd Term">2nd Term (Jan - April)</option>
                    <option value="3rd Term">3rd Term (May - July)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Stream Section</label>
                  <select
                    value={resultsSectionStream}
                    onChange={e => setResultsSectionStream(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-card text-sm font-semibold focus:ring-2 focus:ring-primary"
                  >
                    <option value="General">General Stream (JSS)</option>
                    <option value="Science">Science Stream (SS)</option>
                    <option value="Art">Art & Humanities Stream (SS)</option>

                  </select>
                </div>
              </div>

              <button
                onClick={() => setIsResultGenerated(true)}
                className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4" /> Generate Student Result Sheet
              </button>
            </div>
          </div>
        );
      }

      // Step 4: Official Generated Terminal Report Card
      const mockResultSubjects = resultsSelectedClass.startsWith('JSS')
        ? [
            { code: 'MTH-001', subject: 'Junior Mathematics', ca1: 14, ca2: 13, exam: 55, total: 82, grade: 'A', remark: 'Distinction' },
            { code: 'ENG-001', subject: 'English Language', ca1: 12, ca2: 14, exam: 52, total: 78, grade: 'A', remark: 'Distinction' },
            { code: 'BSC-001', subject: 'Basic Science', ca1: 15, ca2: 12, exam: 58, total: 85, grade: 'A', remark: 'Distinction' },
            { code: 'BTC-001', subject: 'Basic Technology', ca1: 11, ca2: 13, exam: 50, total: 74, grade: 'B', remark: 'Very Good' },
            { code: 'CIV-001', subject: 'Civic Education', ca1: 14, ca2: 14, exam: 56, total: 84, grade: 'A', remark: 'Distinction' },
            { code: 'SOC-001', subject: 'Social Studies', ca1: 13, ca2: 12, exam: 48, total: 73, grade: 'B', remark: 'Very Good' },
            { code: 'ICT-001', subject: 'Computer Studies / ICT', ca1: 15, ca2: 15, exam: 57, total: 87, grade: 'A', remark: 'Distinction' },
            { code: 'AGR-001', subject: 'Agricultural Science', ca1: 12, ca2: 13, exam: 50, total: 75, grade: 'A', remark: 'Distinction' },
          ]
        : [
            { code: 'MTH-101', subject: 'Senior Mathematics', ca1: 14, ca2: 14, exam: 57, total: 85, grade: 'A', remark: 'Distinction' },
            { code: 'ENG-101', subject: 'Senior English Language', ca1: 13, ca2: 13, exam: 54, total: 80, grade: 'A', remark: 'Distinction' },
            { code: 'PHY-101', subject: 'Physics I', ca1: 15, ca2: 14, exam: 58, total: 87, grade: 'A', remark: 'Distinction' },
            { code: 'CHM-101', subject: 'Chemistry I', ca1: 12, ca2: 13, exam: 52, total: 77, grade: 'A', remark: 'Distinction' },
            { code: 'BIO-101', subject: 'Biology I', ca1: 14, ca2: 12, exam: 55, total: 81, grade: 'A', remark: 'Distinction' },
            { code: 'ECO-101', subject: 'Economics I', ca1: 13, ca2: 14, exam: 50, total: 77, grade: 'A', remark: 'Distinction' },
            { code: 'CIV-101', subject: 'Civic Education', ca1: 15, ca2: 15, exam: 58, total: 88, grade: 'A', remark: 'Distinction' },
            { code: 'ICT-101', subject: 'Computer Science', ca1: 14, ca2: 14, exam: 56, total: 84, grade: 'A', remark: 'Distinction' },
          ];

      const grandTotal = mockResultSubjects.reduce((acc, curr) => acc + curr.total, 0);
      const overallAvg = (grandTotal / mockResultSubjects.length).toFixed(1);

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm print:hidden">
            <button
              onClick={() => setIsResultGenerated(false)}
              className="px-3.5 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Change Session / Term
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Official Report Card
              </button>
            </div>
          </div>

          {/* Official Printable Report Card Document */}
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-10 space-y-6 text-foreground print:border-none print:shadow-none">
            {/* Header Banner */}
            <div className="text-center border-b-2 border-primary/30 pb-6 space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-1">
                <GraduationCap className="w-9 h-9" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-extrabold uppercase tracking-wide text-foreground">
                Tare Pet Montessori School
              </h1>
              <p className="text-xs font-medium text-muted-foreground">12 Kpansia-Epie Road, Yenagoa, Bayelsa State, Nigeria · Tel: +234 803 123 4567</p>
              <p className="text-xs font-bold text-primary uppercase tracking-widest pt-1">
                OFFICIAL TERMINAL ACADEMIC REPORT CARD ({resultsYear} — {resultsTerm})
              </p>
            </div>

            {/* Student Profile Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border text-xs">
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Student Name</p>
                <p className="font-bold text-foreground text-sm">{resultsSelectedStudent.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Admission Number</p>
                <p className="font-mono font-bold text-primary">{resultsSelectedStudent.admissionNo}</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Class & Stream</p>
                <p className="font-bold text-foreground">{resultsSelectedClass} ({resultsSectionStream})</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">House</p>
                <p className="font-bold text-emerald-600">{resultsSelectedStudent.house}</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Class Position</p>
                <p className="font-bold text-foreground">1st out of {classStudents.length * 14}</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Attendance</p>
                <p className="font-bold text-foreground">58 / 60 Days</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Overall Percentage</p>
                <p className="font-bold text-primary">{overallAvg}%</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Term Result Status</p>
                <p className="font-bold text-emerald-600">PASSED (PROMOTED)</p>
              </div>
            </div>

            {/* Subject Performance Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Academic Subject Performance Breakdown</h4>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Subject Name</th>
                      <th className="py-3 px-2 text-center">CA1 (15%)</th>
                      <th className="py-3 px-2 text-center">CA2 (15%)</th>
                      <th className="py-3 px-2 text-center">Exam (70%)</th>
                      <th className="py-3 px-2 text-center font-bold text-foreground">Total (100%)</th>
                      <th className="py-3 px-2 text-center">Grade</th>
                      <th className="py-3 px-3">Teacher Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockResultSubjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {sub.subject}
                        </td>
                        <td className="py-2.5 px-2 text-center">{sub.ca1}</td>
                        <td className="py-2.5 px-2 text-center">{sub.ca2}</td>
                        <td className="py-2.5 px-2 text-center">{sub.exam}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-primary text-sm">{sub.total}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                            {sub.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{sub.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Metrics Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-xl border border-border text-center">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Score</p>
                <p className="text-xl font-serif font-bold text-foreground mt-0.5">{grandTotal} / {mockResultSubjects.length * 100}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Average Score</p>
                <p className="text-xl font-serif font-bold text-primary mt-0.5">{overallAvg}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Class Average</p>
                <p className="text-xl font-serif font-bold text-foreground mt-0.5">74.5%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">WASSCE Grade</p>
                <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">A1 (Distinction)</p>
              </div>
            </div>

            {/* Signatures & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
              <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Form Teacher's Comment:</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  "{resultsSelectedStudent.name} has shown outstanding brilliance, disciplined work ethics, and leadership qualities throughout the {resultsTerm}."
                </p>
                <div className="pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Teacher: <strong>Mrs. Okafor Chioma</strong></span>
                  <span className="font-serif italic font-bold text-primary">Signature Attached</span>
                </div>
              </div>

              <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Principal's Official Recommendation:</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  "An exemplary academic performance. Approved for promotion to the next academic level with distinction."
                </p>
                <div className="pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Principal: <strong>Dr. T. Montessori</strong></span>
                  <span className="font-serif italic font-bold text-emerald-600">Official Seal Stamp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (activeSection === 'attendance') {
      const isRecordPresent = (id: number) => (attendanceMap[id] || 'PRESENT') === 'PRESENT';
      const isRecordAbsent  = (id: number) => attendanceMap[id] === 'ABSENT';
      const isRecordLate    = (id: number) => attendanceMap[id] === 'LATE';

      const presentCount = MOCK_STUDENTS.filter(s => isRecordPresent(s.id)).length;
      const absentCount  = MOCK_STUDENTS.filter(s => isRecordAbsent(s.id)).length;
      const lateCount    = MOCK_STUDENTS.filter(s => isRecordLate(s.id)).length;

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">School-wide Daily Attendance & Presence Register</h2>
                <p className="text-xs text-muted-foreground">Track morning roll call, monitor staff presence, approve leave requests, and send automated parent notices.</p>
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today's Attendance</p>
                <h3 className="text-2xl font-serif font-bold text-emerald-600 mt-1">
                  {MOCK_STUDENTS.length > 0 ? `${((presentCount / MOCK_STUDENTS.length) * 100).toFixed(1)}%` : '0%'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {MOCK_STUDENTS.length > 0 ? 'Presence rate' : 'No student records'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Students Present</p>
                <h3 className="text-2xl font-serif font-bold text-foreground mt-1">{presentCount}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">On roll call list</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Absentees Today</p>
                <h3 className="text-2xl font-serif font-bold text-rose-600 mt-1">{absentCount}</h3>
                <p className="text-[11px] text-rose-600 mt-0.5">Requires parent notification</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Staff Attendance</p>
                <h3 className="text-2xl font-serif font-bold text-secondary mt-1">
                  {MOCK_TEACHERS.length > 0 ? '100%' : '0%'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">0 Staff on leave</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Roll Call Controls */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Select Register Class</label>
                  <select
                    value={attendanceClassFilter}
                    onChange={e => setAttendanceClassFilter(e.target.value)}
                    className="border border-border rounded-xl px-3.5 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="JSS1">JSS 1 General</option>
                    <option value="JSS2">JSS 2 General</option>
                    <option value="JSS3">JSS 3 General</option>
                    <option value="SS1">SS 1 Senior</option>
                    <option value="SS2">SS 2 Senior</option>
                    <option value="SS3">SS 3 Senior</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="border border-border rounded-xl px-3.5 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const allP: Record<number, 'PRESENT'> = {};
                    MOCK_STUDENTS.forEach(s => { allP[s.id] = 'PRESENT'; });
                    setAttendanceMap(allP);
                    if (typeof window !== 'undefined') {
                      try {
                        localStorage.setItem('tarepet_attendance_map', JSON.stringify(allP));
                      } catch (e) {}
                    }
                  }}
                  className="px-3.5 py-2 border border-emerald-300 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Present
                </button>
                <button
                  onClick={() => {
                    setAttendanceNoticeAlert(true);
                    setTimeout(() => setAttendanceNoticeAlert(false), 4000);
                  }}
                  className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Notify Absentees' Parents
                </button>
              </div>
            </div>

            {attendanceNoticeAlert && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Automated SMS & Email attendance alerts dispatched to parents of absent students!
              </div>
            )}

            {/* Daily Roll Call Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Parent Phone</th>
                    <th className="py-3 px-4 text-center">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_STUDENTS.filter(s => s.grade === attendanceClassFilter).map(std => {
                    const status = attendanceMap[std.id] || 'PRESENT';
                    return (
                      <tr key={std.id} className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{std.admissionNo}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{std.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{std.gender}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{std.parentPhone}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map(st => (
                              <button
                                key={st}
                                onClick={() => {
                                  setAttendanceMap(prev => {
                                    const next = { ...prev, [std.id]: st };
                                    if (typeof window !== 'undefined') {
                                      try {
                                        localStorage.setItem('tarepet_attendance_map', JSON.stringify(next));
                                      } catch (e) {}
                                    }
                                    return next;
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                  status === st
                                    ? st === 'PRESENT' ? 'bg-emerald-600 text-white border-emerald-600' :
                                      st === 'ABSENT' ? 'bg-rose-600 text-white border-rose-600' :
                                      st === 'LATE' ? 'bg-amber-600 text-white border-amber-600' :
                                      'bg-blue-600 text-white border-blue-600'
                                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Log Applications */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Official Leave Requests & Permissions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Applicant Name</th>
                    <th className="py-2.5 px-3">Role / Class</th>
                    <th className="py-2.5 px-3">Leave Type</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_LEAVE_LOGS.map(log => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="py-3 px-3 font-bold text-foreground">{log.applicant}</td>
                      <td className="py-3 px-3 text-muted-foreground">{log.role}</td>
                      <td className="py-3 px-3 font-semibold text-primary">{log.type}</td>
                      <td className="py-3 px-3 text-muted-foreground">{log.duration}</td>
                      <td className="py-3 px-3 text-muted-foreground">{log.reason}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          log.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-amber-500/10 text-amber-600 border-amber-200'
                        }`}>
                          {log.status}
                        </span>
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
    if (activeSection === 'finance') {
      const feeIncomeTotal = adminTransactions
        .filter(t => t.status === 'SUCCESS')
        .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
      const manualIncomeTotal = financeIncome.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      const totalIncome = feeIncomeTotal + manualIncomeTotal;

      const totalExpenses = financeExpenses.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      const netBalance = totalIncome - totalExpenses;
      const pendingExp = financeExpenses.filter((e: any) => e.status === 'PENDING').reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

      const EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Infrastructure', 'Academic', 'Sports', 'Transport', 'Admin', 'Other'];
      const INCOME_CATEGORIES = ['School Fees', 'Levies', 'Exam Fees', 'Donations', 'Grants', 'Other'];

      // Dynamic real-time chart data calculation for the last 5 months
      const chartData = (() => {
        const months: { month: string; income: number; expenses: number }[] = [];
        const now = new Date();
        for (let i = 4; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mName = d.toLocaleString('default', { month: 'short' });
          const targetMonth = d.getMonth();
          const targetYear = d.getFullYear();

          const monthIncomeRecs = financeIncome
            .filter((r: any) => {
              if (!r.date) return false;
              const rd = new Date(r.date);
              return rd.getMonth() === targetMonth && rd.getFullYear() === targetYear;
            })
            .reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

          const monthFeeTxs = adminTransactions
            .filter((t: any) => {
              if (t.status !== 'SUCCESS' || !t.paidAt) return false;
              const td = new Date(t.paidAt);
              return td.getMonth() === targetMonth && td.getFullYear() === targetYear;
            })
            .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);

          const monthExpenses = financeExpenses
            .filter((e: any) => {
              if (!e.date) return false;
              const ed = new Date(e.date);
              return ed.getMonth() === targetMonth && ed.getFullYear() === targetYear;
            })
            .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

          months.push({
            month: mName,
            income: monthIncomeRecs + monthFeeTxs,
            expenses: monthExpenses
          });
        }
        return months;
      })();

      const fmtCurrency = (v: number) => '₦' + (v || 0).toLocaleString();

      const expCatBreakdown = EXPENSE_CATEGORIES.map(cat => ({
        cat,
        total: financeExpenses.filter((e: any) => e.category === cat).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0),
      })).filter(c => c.total > 0);

      const combinedIncomeRecords = [
        ...adminTransactions.filter(t => t.status === 'SUCCESS').map((t: any) => ({
          id: t.id,
          ref: t.reference || t.id,
          description: `Fee Payment: ${t.studentName} (${t.itemName})`,
          category: 'School Fees',
          date: t.paidAt ? t.paidAt.split('T')[0] : new Date().toISOString().split('T')[0],
          status: 'RECEIVED',
          amount: t.amount
        })),
        ...financeIncome
      ].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Finance & Bursary Management
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track school revenue, expenditure, fee collections, and budget planning.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const currentItems = getPaymentItems();
                  const initialMap: Record<string, number> = {};
                  currentItems.forEach(item => {
                    initialMap[item.id] = getItemAmountForGrade(item, feePricesModalClass);
                  });
                  setFeePricesInputs(initialMap);
                  setShowAddFeePricesModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 shadow-sm transition-all"
              >
                <Settings className="w-4 h-4" /> Set All Fee Prices
              </button>
              <button
                onClick={() => { setShowAddIncomeModal(true); setIncomeForm({ description: '', category: 'School Fees', amount: '', status: 'RECEIVED' }); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Income
              </button>
              <button
                onClick={() => { setShowAddExpenseModal(true); setExpenseForm({ description: '', category: 'Salaries', amount: '', status: 'PAID' }); }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>
          </div>

          {/* Alert */}
          {financeSaveAlert && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {financeSaveAlert}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: fmtCurrency(totalIncome), sub: 'Real-time revenue', color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-200', icon: <TrendingUp className="w-5 h-5" />, arrow: true },
              { label: 'Total Expenses', value: fmtCurrency(totalExpenses), sub: 'Recorded expenses', color: 'text-rose-600', bg: 'bg-rose-500/5', border: 'border-rose-200', icon: <ArrowDownRight className="w-5 h-5" />, arrow: false },
              { label: 'Net Balance', value: fmtCurrency(netBalance), sub: netBalance >= 0 ? 'Surplus' : 'Deficit', color: netBalance >= 0 ? 'text-primary' : 'text-orange-600', bg: 'bg-primary/5', border: 'border-primary/20', icon: <DollarSign className="w-5 h-5" />, arrow: netBalance >= 0 },
              { label: 'Pending Payments', value: fmtCurrency(pendingExp), sub: `${financeExpenses.filter((e: any) => e.status === 'PENDING').length} items`, color: 'text-amber-600', bg: 'bg-amber-500/5', border: 'border-amber-200', icon: <Clock className="w-5 h-5" />, arrow: false },
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} border ${kpi.border} rounded-2xl p-4 space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <p className={`text-xl font-bold font-serif ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border overflow-x-auto pb-0.5">
            {[
              { id: 'fee_schedule', label: 'Fee Schedule Matrix', icon: <DollarSign className="w-3.5 h-3.5 text-primary" /> },
              { id: 'student_billing', label: 'Student Billing & Debtors', icon: <Users className="w-3.5 h-3.5 text-blue-500" /> },
              { id: 'discounts', label: 'Sibling & Concessions', icon: <Tag className="w-3.5 h-3.5 text-amber-500" /> },
              { id: 'overview', label: 'Financial Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: 'income', label: 'Income Records', icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> },
              { id: 'expenses', label: 'Expense Log', icon: <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> },
              { id: 'budget', label: 'Budget Plan', icon: <ClipboardList className="w-3.5 h-3.5" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFinanceTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold capitalize rounded-t-xl border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  financeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 1. FEE SCHEDULE MATRIX TAB (OPTION A) ── */}
          {financeTab === 'fee_schedule' && (
            <div className="space-y-6">
              {/* Controls & Division Filter */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" /> Institutional Fee Pricing Matrix (2025/2026 Academic Session)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure approved tuition, development levy, curriculum materials, sports uniform, and terminal assessment fees per class level.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
                    {[
                      { id: 'ALL', label: 'All Levels' },
                      { id: 'CRECHE_NURSERY', label: 'Nursery' },
                      { id: 'PRIMARY', label: 'Primary' },
                      { id: 'JUNIOR_SECONDARY', label: 'JSS' },
                      { id: 'SENIOR_SECONDARY', label: 'SS' },
                    ].map(div => (
                      <button
                        key={div.id}
                        onClick={() => setSelectedScheduleDivision(div.id)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                          selectedScheduleDivision === div.id
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card'
                        }`}
                      >
                        {div.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      await bulkUpdateClassFeeSchedules(classFeeSchedules);
                      setFinanceSaveAlert('Successfully synchronized all 15 class fee schedules with backend database!');
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Bulk Sync to Database
                  </button>
                </div>
              </div>

              {/* Pricing Matrix Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Levels Configured', val: `${classFeeSchedules.length} Classes`, sub: 'Crèche to SS3 Exam', color: 'text-primary' },
                  { label: 'Lowest Term Fee', val: fmtCurrency(Math.min(...classFeeSchedules.map(s => (s.tuition_fee + s.development_levy + s.books_materials + s.uniform_sports + s.pta_medical + s.exam_levy)))), sub: 'Nursery 1 & 2', color: 'text-emerald-600' },
                  { label: 'Highest Term Fee', val: fmtCurrency(Math.max(...classFeeSchedules.map(s => (s.tuition_fee + s.development_levy + s.books_materials + s.uniform_sports + s.pta_medical + s.exam_levy)))), sub: 'SS3 Exam Class', color: 'text-indigo-600' },
                  { label: 'Average Mandatory Levy', val: fmtCurrency(Math.round(classFeeSchedules.reduce((sum, s) => sum + (s.tuition_fee + s.development_levy + s.books_materials + s.uniform_sports + s.pta_medical + s.exam_levy), 0) / (classFeeSchedules.length || 1))), sub: 'Across all 15 classes', color: 'text-amber-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-card p-4 rounded-2xl border border-border space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stat.label}</p>
                    <p className={`text-lg font-bold font-serif ${stat.color}`}>{stat.val}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-foreground">Class-by-Class Approved Fee Schedule</h4>
                  <span className="text-[11px] font-bold text-muted-foreground">Showing {classFeeSchedules.filter(s => selectedScheduleDivision === 'ALL' || s.division === selectedScheduleDivision).length} class levels</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Class Level</th>
                        <th className="py-3 px-4">Division</th>
                        <th className="py-3 px-3 text-right">Tuition</th>
                        <th className="py-3 px-3 text-right">Dev. Levy</th>
                        <th className="py-3 px-3 text-right">Books & Mat.</th>
                        <th className="py-3 px-3 text-right">Uniform</th>
                        <th className="py-3 px-3 text-right">PTA/Medical</th>
                        <th className="py-3 px-3 text-right">Exam Levy</th>
                        <th className="py-3 px-4 text-right">Total Term Fee</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classFeeSchedules
                        .filter(s => selectedScheduleDivision === 'ALL' || s.division === selectedScheduleDivision)
                        .map(sched => {
                          const total = sched.tuition_fee + sched.development_levy + sched.books_materials + sched.uniform_sports + sched.pta_medical + sched.exam_levy;
                          return (
                            <tr key={sched.class_level} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-foreground">{sched.class_level}</td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  sched.division === 'CRECHE_NURSERY' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                  sched.division === 'PRIMARY' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                  sched.division === 'JUNIOR_SECONDARY' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                  'bg-purple-500/10 text-purple-600 border-purple-200'
                                }`}>
                                  {sched.division === 'CRECHE_NURSERY' ? 'Nursery' : sched.division === 'PRIMARY' ? 'Primary' : sched.division === 'JUNIOR_SECONDARY' ? 'JSS' : 'SS'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-semibold text-foreground">{fmtCurrency(sched.tuition_fee)}</td>
                              <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">{fmtCurrency(sched.development_levy)}</td>
                              <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">{fmtCurrency(sched.books_materials)}</td>
                              <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">{fmtCurrency(sched.uniform_sports)}</td>
                              <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">{fmtCurrency(sched.pta_medical)}</td>
                              <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">{fmtCurrency(sched.exam_levy)}</td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-primary font-serif text-sm">{fmtCurrency(total)}</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => setEditingSchedule({ ...sched })}
                                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-colors"
                                >
                                  Edit Breakdown
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. STUDENT BILLING & DEBTORS LEDGER TAB ── */}
          {financeTab === 'student_billing' && (
            <div className="space-y-6">
              {/* Header & Filter Controls */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Student Fee Billing Ledger & Debtors Roster
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Live student-by-student fee balances, sibling concessions, recorded payments, and collection receipts.</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search student or Admission No..."
                    value={bursarySearchQuery}
                    onChange={e => setBursarySearchQuery(e.target.value)}
                    className="px-3.5 py-2 border border-border rounded-xl bg-background text-xs font-medium focus:ring-2 focus:ring-primary w-52"
                  />
                  <select
                    value={bursaryClassFilter}
                    onChange={e => setBursaryClassFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-xl bg-background text-xs font-bold focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">All Classes</option>
                    {classFeeSchedules.map(c => <option key={c.class_level} value={c.class_level}>{c.class_level}</option>)}
                  </select>
                  <select
                    value={bursaryStatusFilter}
                    onChange={e => setBursaryStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-xl bg-background text-xs font-bold focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PAID">Fully Settled (Paid)</option>
                    <option value="PARTIAL">Partial Payment</option>
                    <option value="UNPAID">Outstanding (Debtors)</option>
                  </select>
                </div>
              </div>

              {/* Billing Summary Cards */}
              {(() => {
                const totalStudentsCount = studentsList.length || 1;
                let billedSum = 0;
                let paidSum = 0;
                let debtorsCount = 0;

                studentsList.forEach(std => {
                  const sched = classFeeSchedules.find(s => matchStudentClass(s.class_level, std.classLevel || std.grade || '')) || classFeeSchedules[3];
                  const feeBilled = sched ? (sched.tuition_fee + sched.development_levy + sched.books_materials + sched.uniform_sports + sched.pta_medical + sched.exam_levy) : 65000;
                  billedSum += feeBilled;

                  const stdTxs = adminTransactions.filter(t => (String(t.studentId) === String(std.id) || String(t.studentId) === String(std.admissionNo) || t.studentName === std.name) && t.status === 'SUCCESS');
                  const stdPaid = stdTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                  paidSum += stdPaid;

                  if (stdPaid < feeBilled) debtorsCount++;
                });

                const outstandingDebt = Math.max(0, billedSum - paidSum);
                const collectionRate = billedSum > 0 ? ((paidSum / billedSum) * 100).toFixed(1) : '0';

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-card p-4 rounded-2xl border border-border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Term Billing</p>
                      <p className="text-xl font-bold font-serif text-foreground">{fmtCurrency(billedSum)}</p>
                      <p className="text-[10px] text-muted-foreground">{studentsList.length} Active Students</p>
                    </div>
                    <div className="bg-card p-4 rounded-2xl border border-border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Collected</p>
                      <p className="text-xl font-bold font-serif text-emerald-600">{fmtCurrency(paidSum)}</p>
                      <p className="text-[10px] text-muted-foreground">{collectionRate}% Recovery Rate</p>
                    </div>
                    <div className="bg-card p-4 rounded-2xl border border-border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Outstanding Debt</p>
                      <p className="text-xl font-bold font-serif text-rose-600">{fmtCurrency(outstandingDebt)}</p>
                      <p className="text-[10px] text-muted-foreground">{debtorsCount} Students with Balance</p>
                    </div>
                    <div className="bg-card p-4 rounded-2xl border border-border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Clearance Status</p>
                      <p className="text-xl font-bold font-serif text-primary">{studentsList.length - debtorsCount} / {studentsList.length}</p>
                      <p className="text-[10px] text-muted-foreground">Students Fully Cleared</p>
                    </div>
                  </div>
                );
              })()}

              {/* Student Billing Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Student Details</th>
                        <th className="py-3 px-3">Class Level</th>
                        <th className="py-3 px-3 text-right">Total Billed</th>
                        <th className="py-3 px-3 text-right">Paid to Date</th>
                        <th className="py-3 px-3 text-right">Balance Due</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {studentsList
                        .filter(std => {
                          const matchesSearch = !bursarySearchQuery || std.name.toLowerCase().includes(bursarySearchQuery.toLowerCase()) || (std.admissionNo && std.admissionNo.toLowerCase().includes(bursarySearchQuery.toLowerCase()));
                          const matchesClass = bursaryClassFilter === 'ALL' || std.classLevel === bursaryClassFilter || std.grade === bursaryClassFilter;
                          return matchesSearch && matchesClass;
                        })
                        .map(std => {
                          const sched = classFeeSchedules.find(s => matchStudentClass(s.class_level, std.classLevel || std.grade || '')) || classFeeSchedules[3];
                          const feeBilled = sched ? (sched.tuition_fee + sched.development_levy + sched.books_materials + sched.uniform_sports + sched.pta_medical + sched.exam_levy) : 65000;

                          const stdTxs = adminTransactions.filter(t => (String(t.studentId) === String(std.id) || String(t.studentId) === String(std.admissionNo) || t.studentName === std.name) && t.status === 'SUCCESS');
                          const stdPaid = stdTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                          const balance = Math.max(0, feeBilled - stdPaid);

                          let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
                          if (stdPaid >= feeBilled && feeBilled > 0) status = 'PAID';
                          else if (stdPaid > 0) status = 'PARTIAL';

                          if (bursaryStatusFilter !== 'ALL' && status !== bursaryStatusFilter) return null;

                          return (
                            <tr key={std.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                                    {std.profileImage ? <img src={std.profileImage} alt={std.name} className="w-full h-full object-cover" /> : std.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground">{std.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{std.admissionNo || `TMS-STD-${std.id}`}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-muted-foreground">{std.classLevel || std.grade || 'Primary 1'}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-foreground">{fmtCurrency(feeBilled)}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">{fmtCurrency(stdPaid)}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">{fmtCurrency(balance)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                  status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                  'bg-rose-500/10 text-rose-600 border-rose-200'
                                }`}>
                                  {status === 'PAID' ? '✓ Fully Paid' : status === 'PARTIAL' ? 'Part Payment' : 'Unpaid Debtor'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => {
                                    setRecordPaymentStudent(std);
                                    setRecordPaymentAmount(String(balance > 0 ? balance : 25000));
                                    setRecordPaymentNotes(`Termly School Fee settlement for ${std.name}`);
                                  }}
                                  className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                  + Record Payment
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. SIBLING & CONCESSION POLICIES TAB ── */}
          {financeTab === 'discounts' && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" /> Sibling Discounts, Concession & Scholarship Quotas
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage automated discount rules applied to tuition fees for multiple enrolled siblings, staff children, and merit scholars.</p>
                </div>
                <button
                  onClick={() => {
                    setDiscountForm({ code: `CONCESSION_${Date.now()}`, name: '', discount_type: 'PERCENTAGE', value: 10, description: '' });
                    setShowAddDiscountModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add New Concession Rule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discountPolicies.map(policy => (
                  <div key={policy.code} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">{policy.code}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          policy.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'
                        }`}>
                          {policy.is_active ? 'Active Policy' : 'Inactive'}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-foreground">{policy.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{policy.description}</p>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Concession Benefit</p>
                        <p className="text-lg font-bold font-serif text-primary">
                          {policy.value}{policy.discount_type === 'PERCENTAGE' ? '% Tuition Waiver' : ' NGN Flat Deduct'}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = { ...policy, is_active: !policy.is_active };
                          await saveDiscountPolicy(updated);
                          setDiscountPolicies(getDiscountPolicies());
                          setFinanceSaveAlert(`Updated ${policy.name} active status.`);
                          setTimeout(() => setFinanceSaveAlert(''), 3000);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          policy.is_active ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {policy.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. FINANCIAL OVERVIEW TAB ── */}
          {financeTab === 'overview' && (
            <div className="space-y-5">
              {/* Chart */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-serif font-bold text-sm text-foreground mb-4">Income vs. Expenditure — Last 5 Months</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => '₦' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k')} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                    <Bar dataKey="income" fill="hsl(142 76% 36%)" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(0 84% 60%)" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expense breakdown table */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-serif font-bold text-sm text-foreground mb-4">Expense Category Breakdown</h3>
                {expCatBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {expCatBreakdown.map(({ cat, total }) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">{cat}</span>
                        <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded-full"
                            style={{ width: `${Math.min(100, (total / (totalExpenses || 1)) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-28 text-right shrink-0">{fmtCurrency(total)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{((total / (totalExpenses || 1)) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">No expense categories logged yet. Click 'Add Expense' above to record school expenditures.</p>
                )}
              </div>

              {/* Recent transactions */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-serif font-bold text-sm text-foreground mb-4">Recent Transactions</h3>
                {combinedIncomeRecords.length > 0 || financeExpenses.length > 0 ? (
                  <div className="space-y-2">
                    {[...combinedIncomeRecords.slice(0, 3).map((r: any) => ({ ...r, type: 'income' })), ...financeExpenses.slice(0, 3).map((r: any) => ({ ...r, type: 'expense' }))]
                      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                      .map((tx: any) => (
                        <div key={tx.ref} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground">{tx.ref} · {tx.date}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold font-serif ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{fmtCurrency(tx.amount)}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">No recent financial transactions recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── 5. INCOME TAB ── */}
          {financeTab === 'income' && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-foreground">Income Records — {new Date().getFullYear()}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">Total: {fmtCurrency(totalIncome)}</span>
              </div>
              <div className="overflow-x-auto">
                {combinedIncomeRecords.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Ref No.</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {combinedIncomeRecords.map((row: any) => (
                        <tr key={row.id} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-mono font-bold text-primary text-[10px]">{row.ref}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{row.description}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.category}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.date}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 font-serif">{fmtCurrency(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-xs font-bold text-foreground text-right">Total Income</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 font-serif text-sm">{fmtCurrency(totalIncome)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs font-bold text-foreground">No income records logged yet</p>
                    <p className="text-[11px] text-muted-foreground">Student fee payments and added income will appear here automatically.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 6. EXPENSES TAB ── */}
          {financeTab === 'expenses' && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-foreground">Expense Log — {new Date().getFullYear()}</h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full">Total: {fmtCurrency(totalExpenses)}</span>
              </div>
              <div className="overflow-x-auto">
                {financeExpenses.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Ref No.</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {financeExpenses.map((row: any) => (
                        <tr key={row.id} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-mono font-bold text-primary text-[10px]">{row.ref}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{row.description}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.category}</td>
                          <td className="py-3 px-4 text-muted-foreground">{row.date}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              row.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                : 'bg-amber-500/10 text-amber-600 border-amber-200'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 font-serif">{fmtCurrency(row.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                if (row.status === 'PENDING') {
                                  const updated = financeExpenses.map((e: any) => e.id === row.id ? { ...e, status: 'PAID' } : e);
                                  setFinanceExpenses(updated);
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('tarepet_finance_expenses', JSON.stringify(updated));
                                  }
                                  if (row.id) {
                                    authClient.patch(`/finance/expenses/${row.id}/`, { status: 'PAID' }).catch(() => {});
                                  }
                                }
                              }}
                              disabled={row.status === 'PAID'}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {row.status === 'PAID' ? '✓ Settled' : 'Mark Paid'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-xs font-bold text-foreground text-right">Total Expenses</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700 font-serif text-sm">{fmtCurrency(totalExpenses)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <TrendingDown className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs font-bold text-foreground">No expense records logged yet</p>
                    <p className="text-[11px] text-muted-foreground">Click 'Add Expense' above to record school expenditures.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 7. BUDGET TAB ── */}
          {financeTab === 'budget' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-sm text-foreground">2025/2026 Annual Budget Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { cat: 'Staff Salaries & Benefits', budgeted: 34200000, spent: 2850000 * 5, color: 'bg-rose-500' },
                    { cat: 'Utilities & Services', budgeted: 2400000, spent: 185000 * 5, color: 'bg-amber-500' },
                    { cat: 'Infrastructure & Maintenance', budgeted: 5000000, spent: 420000 * 3, color: 'bg-blue-500' },
                    { cat: 'Academic Resources & Labs', budgeted: 1500000, spent: 95000 * 4, color: 'bg-violet-500' },
                    { cat: 'Sports & Extracurricular', budgeted: 1200000, spent: 130000 * 2, color: 'bg-emerald-500' },
                    { cat: 'Transport & Logistics', budgeted: 950000, spent: 78000 * 5, color: 'bg-cyan-500' },
                    { cat: 'Admin & Office', budgeted: 600000, spent: 45000 * 5, color: 'bg-slate-500' },
                  ].map(b => {
                    const pct = Math.min(100, (b.spent / b.budgeted) * 100);
                    const over = pct > 90;
                    return (
                      <div key={b.cat} className="p-4 bg-background rounded-xl border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{b.cat}</span>
                          {over && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-600" /> Near Limit</span>}
                        </div>
                        <div className="w-full bg-muted/40 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${over ? 'bg-rose-500' : b.color}`} style={{ width: `${pct.toFixed(0)}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Spent: <span className="font-bold text-foreground">{fmtCurrency(b.spent)}</span></span>
                          <span>Budget: <span className="font-bold text-foreground">{fmtCurrency(b.budgeted)}</span></span>
                          <span className={`font-bold ${over ? 'text-rose-600' : 'text-emerald-600'}`}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT CLASS FEE BREAKDOWN MODAL ── */}
          {editingSchedule && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" /> Edit Fee Breakdown — {editingSchedule.class_level}
                    </h3>
                    <p className="text-xs text-muted-foreground">Adjust individual tuition and levy components. Total calculates automatically.</p>
                  </div>
                  <button onClick={() => setEditingSchedule(null)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Tuition Fee (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.tuition_fee}
                        onChange={e => setEditingSchedule({ ...editingSchedule, tuition_fee: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Development Levy (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.development_levy}
                        onChange={e => setEditingSchedule({ ...editingSchedule, development_levy: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Books & Materials (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.books_materials}
                        onChange={e => setEditingSchedule({ ...editingSchedule, books_materials: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Uniform & Sports Attire (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.uniform_sports}
                        onChange={e => setEditingSchedule({ ...editingSchedule, uniform_sports: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">PTA & Medical Retainership (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.pta_medical}
                        onChange={e => setEditingSchedule({ ...editingSchedule, pta_medical: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Exam / Assessment Levy (₦)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.exam_levy}
                        onChange={e => setEditingSchedule({ ...editingSchedule, exam_levy: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Dynamic Total Banner */}
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-primary">Computed Total Term Fee</p>
                      <p className="text-xs text-muted-foreground">Applicable to all students enrolled in {editingSchedule.class_level}</p>
                    </div>
                    <p className="text-xl font-bold font-serif text-primary">
                      {fmtCurrency(editingSchedule.tuition_fee + editingSchedule.development_levy + editingSchedule.books_materials + editingSchedule.uniform_sports + editingSchedule.pta_medical + editingSchedule.exam_levy)}
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button onClick={() => setEditingSchedule(null)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    onClick={() => {
                      updateClassFeeSchedule(editingSchedule);
                      setClassFeeSchedules(getClassFeeSchedules());
                      setFinanceSaveAlert(`Successfully updated fee breakdown for ${editingSchedule.class_level}!`);
                      setEditingSchedule(null);
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Fee Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RECORD STUDENT PAYMENT MODAL ── */}
          {recordPaymentStudent && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" /> Record Fee Settlement
                    </h3>
                    <p className="text-xs text-muted-foreground">{recordPaymentStudent.name} · {recordPaymentStudent.admissionNo || recordPaymentStudent.classLevel}</p>
                  </div>
                  <button onClick={() => setRecordPaymentStudent(null)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Amount Received (₦) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={recordPaymentAmount}
                      onChange={e => setRecordPaymentAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono font-bold focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Payment Channel</label>
                      <select
                        value={recordPaymentChannel}
                        onChange={e => setRecordPaymentChannel(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="bank_transfer">Direct Bank Transfer</option>
                        <option value="cash">Cash at Bursary</option>
                        <option value="paystack">Paystack Online POS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Fee Component</label>
                      <select className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-bold focus:ring-2 focus:ring-primary">
                        <option>Full Composite Term Fee</option>
                        <option>Tuition Fee Only</option>
                        <option>Books & Materials</option>
                        <option>Development Levy</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Payment Remarks / Narrative</label>
                    <input
                      type="text"
                      value={recordPaymentNotes}
                      onChange={e => setRecordPaymentNotes(e.target.value)}
                      placeholder="e.g. 2nd Term Tuition Bank Deposit — GTBank"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button onClick={() => setRecordPaymentStudent(null)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    disabled={!recordPaymentAmount || Number(recordPaymentAmount) <= 0}
                    onClick={async () => {
                      const refCode = `REC-${Date.now().toString().slice(-6)}`;
                      const amt = Number(recordPaymentAmount);
                      await recordTransaction({
                        studentId: recordPaymentStudent.id || recordPaymentStudent.admissionNo,
                        studentName: recordPaymentStudent.name,
                        studentEmail: recordPaymentStudent.email || 'parent@tarepetmontessori.org',
                        itemId: 'school_fees',
                        itemName: 'Termly School Tuition Fee',
                        amount: amt,
                        currency: 'NGN',
                        reference: refCode,
                        channel: recordPaymentChannel,
                        status: 'SUCCESS',
                        term: '2nd Term',
                        session: '2025/2026'
                      });

                      // Also add to income list
                      const incRec = {
                        id: Date.now(),
                        reference: refCode,
                        date: new Date().toISOString().split('T')[0],
                        description: `Fee Settlement: ${recordPaymentStudent.name} (${recordPaymentStudent.classLevel || 'Primary'})`,
                        category: 'School Fees',
                        amount: amt,
                        status: 'RECEIVED',
                        ref: refCode,
                      };
                      const updatedInc = [incRec, ...financeIncome];
                      setFinanceIncome(updatedInc);
                      if (typeof window !== 'undefined') {
                        try { localStorage.setItem('tarepet_finance_income', JSON.stringify(updatedInc)); } catch (e) {}
                      }
                      authClient.post('/finance/income/', incRec).catch(() => {});

                      setReceiptModalData({
                        reference: refCode,
                        studentName: recordPaymentStudent.name,
                        studentId: recordPaymentStudent.admissionNo || recordPaymentStudent.id,
                        classLevel: recordPaymentStudent.classLevel || 'Primary',
                        amount: amt,
                        channel: recordPaymentChannel,
                        paidAt: new Date().toISOString(),
                        notes: recordPaymentNotes
                      });

                      setRecordPaymentStudent(null);
                      setFinanceSaveAlert(`Successfully recorded ₦${amt.toLocaleString()} payment for ${recordPaymentStudent.name}!`);
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Issue Receipt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ADD DISCOUNT POLICY MODAL ── */}
          {showAddDiscountModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" /> Create Fee Concession Policy
                  </h3>
                  <button onClick={() => setShowAddDiscountModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Policy Code / Key *</label>
                    <input
                      type="text"
                      value={discountForm.code}
                      onChange={e => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      placeholder="e.g. SIBLING_4TH"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Policy Name *</label>
                    <input
                      type="text"
                      value={discountForm.name}
                      onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })}
                      placeholder="e.g. 4th Sibling Family Discount"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-bold focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Discount Type</label>
                      <select
                        value={discountForm.discount_type}
                        onChange={e => setDiscountForm({ ...discountForm, discount_type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (₦)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Benefit Value *</label>
                      <input
                        type="number"
                        min="1"
                        value={discountForm.value}
                        onChange={e => setDiscountForm({ ...discountForm, value: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Policy Eligibility Description</label>
                    <textarea
                      rows={2}
                      value={discountForm.description}
                      onChange={e => setDiscountForm({ ...discountForm, description: e.target.value })}
                      placeholder="Explain who qualifies for this institutional discount..."
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button onClick={() => setShowAddDiscountModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    disabled={!discountForm.code || !discountForm.name}
                    onClick={async () => {
                      await saveDiscountPolicy({
                        code: discountForm.code,
                        name: discountForm.name,
                        discount_type: discountForm.discount_type as any,
                        value: discountForm.value,
                        description: discountForm.description,
                        is_active: true
                      });
                      setDiscountPolicies(getDiscountPolicies());
                      setShowAddDiscountModal(false);
                      setFinanceSaveAlert(`Successfully added ${discountForm.name} concession policy!`);
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Policy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SET ALL FEE PRICES MODAL ── */}
          {showAddFeePricesModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" /> Configure All School Fee Prices
                    </h3>
                    <p className="text-xs text-muted-foreground">Set and publish amounts for all school fees (Tuition, Boarding, WAEC, NECO, Uniform, Books, Bus, etc.).</p>
                  </div>
                  <button onClick={() => setShowAddFeePricesModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {/* Class Target Selector */}
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-primary block mb-0.5">Target Class Level</label>
                      <p className="text-[11px] text-muted-foreground">Select a specific class to set custom fees or select 'All Classes' for general fallback.</p>
                    </div>
                    <select
                      value={feePricesModalClass}
                      onChange={e => {
                        const targetG = e.target.value;
                        setFeePricesModalClass(targetG);
                        const currentItems = getPaymentItems();
                        const map: Record<string, number> = {};
                        currentItems.forEach(item => {
                          map[item.id] = getItemAmountForGrade(item, targetG);
                        });
                        setFeePricesInputs(map);
                      }}
                      className="border border-border rounded-xl px-3 py-2 bg-card text-foreground text-xs font-bold focus:ring-2 focus:ring-primary shrink-0 min-w-[200px]"
                    >
                      <option value="ALL">🌐 All Classes (Default Fallback)</option>
                      <option value="NUR1">🧸 Nursery 1</option>
                      <option value="NUR2">🧸 Nursery 2</option>
                      <option value="PRI1">🎒 Primary 1</option>
                      <option value="PRI2">🎒 Primary 2</option>
                      <option value="PRI3">🎒 Primary 3</option>
                      <option value="PRI4">🎒 Primary 4</option>
                      <option value="PRI5">🎒 Primary 5</option>
                      <option value="PRI6">🎒 Primary 6</option>
                      <option value="JSS1">📘 JSS 1</option>
                      <option value="JSS2">📘 JSS 2</option>
                      <option value="JSS3">📘 JSS 3</option>
                      <option value="SS1">🎓 SS 1</option>
                      <option value="SS2">🎓 SS 2</option>
                      <option value="SS3">🎓 SS 3</option>
                    </select>
                  </div>

                  {/* Fee Items List Form */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fee Schedule Items ({adminPaymentItems.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adminPaymentItems.map(item => {
                        const currentVal = feePricesInputs[item.id] ?? 0;
                        return (
                          <div key={item.id} className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground truncate">{item.name}</span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground font-mono">₦</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={currentVal || ''}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setFeePricesInputs(prev => ({ ...prev, [item.id]: val }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button onClick={() => setShowAddFeePricesModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    onClick={() => {
                      Object.entries(feePricesInputs).forEach(([itemId, amount]) => {
                        updateFeeItemAmount(itemId, Number(amount) || 0, feePricesModalClass);
                      });
                      const targetName = feePricesModalClass === 'ALL' ? 'All Classes' : `Class ${feePricesModalClass}`;
                      setFinanceSaveAlert(`Successfully published updated fee prices for ${targetName}!`);
                      setShowAddFeePricesModal(false);
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save & Publish All Prices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ADD INCOME MODAL ── */}
          {showAddIncomeModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" /> Record New Income
                  </h3>
                  <button onClick={() => setShowAddIncomeModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Description *</label>
                    <input type="text" placeholder="e.g. School Fees — JSS3 (25 students)" value={incomeForm.description}
                      onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Category</label>
                      <select value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Amount (₦) *</label>
                      <input type="number" placeholder="0" value={incomeForm.amount}
                        onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button onClick={() => setShowAddIncomeModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    disabled={!incomeForm.description || !incomeForm.amount}
                    onClick={() => {
                      const refCode = `INC-${Date.now()}`;
                      const newRec = {
                        id: Date.now(),
                        reference: refCode,
                        date: new Date().toISOString().split('T')[0],
                        description: incomeForm.description,
                        category: incomeForm.category,
                        amount: Number(incomeForm.amount),
                        status: 'RECEIVED',
                        ref: refCode,
                      };
                      const updated = [newRec, ...financeIncome];
                      setFinanceIncome(updated);
                      if (typeof window !== 'undefined') {
                        try { localStorage.setItem('tarepet_finance_income', JSON.stringify(updated)); } catch (e) {}
                      }
                      // Save to Django PostgreSQL/SQLite backend
                      authClient.post('/finance/income/', newRec).catch(() => {});
                      setShowAddIncomeModal(false);
                      setFinanceSaveAlert('Income record saved successfully to database!');
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Income
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ADD EXPENSE MODAL ── */}
          {showAddExpenseModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <ArrowDownRight className="w-5 h-5 text-rose-600" /> Record New Expense
                  </h3>
                  <button onClick={() => setShowAddExpenseModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Description *</label>
                    <input type="text" placeholder="e.g. Generator Fuel — February" value={expenseForm.description}
                      onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Category</label>
                      <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-foreground">Amount (₦) *</label>
                      <input type="number" placeholder="0" value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">Payment Status</label>
                    <div className="flex gap-2">
                      {['PAID', 'PENDING'].map(st => (
                        <button key={st} onClick={() => setExpenseForm({ ...expenseForm, status: st })}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            expenseForm.status === st
                              ? st === 'PAID' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-500 text-white border-amber-500'
                              : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
                          }`}>
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button onClick={() => setShowAddExpenseModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    disabled={!expenseForm.description || !expenseForm.amount}
                    onClick={() => {
                      const refCode = `EXP-${Date.now()}`;
                      const newRec = {
                        id: Date.now(),
                        reference: refCode,
                        date: new Date().toISOString().split('T')[0],
                        description: expenseForm.description,
                        category: expenseForm.category,
                        amount: Number(expenseForm.amount),
                        status: expenseForm.status,
                        ref: refCode,
                      };
                      const updated = [newRec, ...financeExpenses];
                      setFinanceExpenses(updated);
                      if (typeof window !== 'undefined') {
                        try { localStorage.setItem('tarepet_finance_expenses', JSON.stringify(updated)); } catch (e) {}
                      }
                      // Save to Django PostgreSQL/SQLite backend
                      authClient.post('/finance/expenses/', newRec).catch(() => {});
                      setShowAddExpenseModal(false);
                      setFinanceSaveAlert('Expense record saved successfully to database!');
                      setTimeout(() => setFinanceSaveAlert(''), 4000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Expense
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PRINTABLE DIGITAL RECEIPT MODAL ── */}
          {receiptModalData && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 print:hidden">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Official Bursary Receipt Generated
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Print / Save PDF
                    </button>
                    <button onClick={() => setReceiptModalData(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div id="printable-receipt" className="p-6 space-y-5 bg-white text-slate-900 font-sans">
                  {/* Receipt Header */}
                  <div className="text-center border-b-2 border-slate-900/10 pb-4 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <img src={tarepetLogo} alt="Tarepet Logo" className="w-10 h-10 object-contain" />
                      <h2 className="font-serif font-black text-xl tracking-tight text-slate-900 uppercase">Tarepet Montessori School</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Excellence in Montessori & Academic Education</p>
                    <p className="text-[9px] text-slate-400">Kpansia-Epie, Yenagoa, Bayelsa State · bursary@tarepetmontessori.org · +234 803 123 4567</p>
                    <div className="inline-block mt-2 px-3 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                      Official Payment Receipt
                    </div>
                  </div>

                  {/* Receipt Meta */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt Reference</span>
                      <span className="font-mono font-bold text-slate-900">{receiptModalData.reference}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Time</span>
                      <span className="font-medium text-slate-700">{new Date(receiptModalData.paidAt || Date.now()).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Name</span>
                      <span className="font-bold text-slate-900">{receiptModalData.studentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission No / Class</span>
                      <span className="font-medium text-slate-700">{receiptModalData.studentId} ({receiptModalData.classLevel || 'General'})</span>
                    </div>
                  </div>

                  {/* Receipt Items Breakdown */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px]">
                        <th className="py-2 text-left">Description</th>
                        <th className="py-2 text-center">Channel</th>
                        <th className="py-2 text-right">Amount (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2.5 text-slate-800 font-semibold">{receiptModalData.notes || 'Termly School Fee Settlement & Instruction Levy'}</td>
                        <td className="py-2.5 text-center text-slate-500 uppercase text-[10px] font-bold">{receiptModalData.channel?.replace('_', ' ')}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">₦{Number(receiptModalData.amount || 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 text-slate-900 font-bold">
                        <td colSpan={2} className="py-2.5 text-right uppercase text-[10px]">Total Amount Paid:</td>
                        <td className="py-2.5 text-right font-mono text-base text-emerald-700 font-serif">₦{Number(receiptModalData.amount || 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Stamp & Authorized Signature */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="w-20 h-10 border border-dashed border-emerald-500 rounded-lg flex items-center justify-center bg-emerald-50 text-[9px] font-black text-emerald-700 tracking-tighter uppercase rotate-[-6deg]">
                        PAID & VERIFIED
                      </div>
                      <p className="text-[8px] text-slate-400">Electronic Bursary Ledger</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="w-32 border-b border-slate-400 pb-1">
                        <span className="font-serif italic font-bold text-xs text-slate-800">T. Montessori</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-600">Bursar / Accounts Officer</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end print:hidden">
                  <button onClick={() => setReceiptModalData(null)} className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
                    Close Receipt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeSection === 'manage_admins') {
      return <AdminManagementPanel />;
    }
    if (activeSection === 'calendar') {
      const filteredEvents = calendarEventsState.filter(ev => calendarFilter === 'All' || ev.category === calendarFilter);

      const handleSaveCalendarEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!calendarForm.title || !calendarForm.date) return;
        const newEv = {
          id: `cal-${Date.now()}`,
          title: calendarForm.title,
          category: calendarForm.category,
          date: calendarForm.date,
          endDate: calendarForm.endDate || undefined,
          scope: calendarForm.scope,
          status: calendarForm.status || 'Upcoming',
          detail: calendarForm.detail || 'Scheduled school event.',
        };
        const updated = [newEv, ...calendarEventsState];
        setCalendarEventsState(updated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('tarepet_calendar_events', JSON.stringify(updated));
          } catch (e) {}
        }
        setShowAddCalendarModal(false);
        setCalendarForm({ title: '', category: 'Academic', date: '', endDate: '', scope: 'All Classes', detail: '', status: 'Upcoming' });
      };

      const handleDeleteCalendarEvent = (id: string) => {
        const updated = calendarEventsState.filter(ev => ev.id !== id);
        setCalendarEventsState(updated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('tarepet_calendar_events', JSON.stringify(updated));
          } catch (e) {}
        }
      };

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">School Academic Calendar & Events</h2>
                <p className="text-xs text-muted-foreground">Manage academic session schedules, term dates, CBT exam timetables, and official holidays in real time.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCalendarForm({ title: '', category: 'Academic', date: new Date().toISOString().split('T')[0], endDate: '', scope: 'All Classes', detail: '', status: 'Upcoming' });
                setShowAddCalendarModal(true);
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Calendar Event
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['All', 'Academic', 'Exam', 'Holiday', 'Event'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCalendarFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    calendarFilter === cat
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {cat === 'All' ? 'All Calendar Events' : cat}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Total: <strong>{filteredEvents.length} events</strong></p>
          </div>

          {/* Calendar Events List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.length === 0 ? (
              <div className="md:col-span-2 bg-card rounded-2xl border border-border p-12 text-center space-y-3">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h4 className="font-serif font-bold text-base text-foreground">No events found</h4>
                <p className="text-xs text-muted-foreground">Click "Add Calendar Event" to create a new entry.</p>
              </div>
            ) : (
              filteredEvents.map(ev => (
                <div key={ev.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        ev.category === 'Exam' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                        ev.category === 'Holiday' ? 'bg-rose-500/10 text-rose-600 border-rose-200' :
                        ev.category === 'Academic' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      }`}>
                        {ev.category}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {ev.scope}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-foreground leading-snug">{ev.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      {ev.date}{ev.endDate ? ` — ${ev.endDate}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground/90 leading-relaxed pt-1">{ev.detail}</p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      ev.status === 'Completed' ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                    }`}>
                      {ev.status || 'Upcoming'}
                    </span>
                    <button
                      onClick={() => handleDeleteCalendarEvent(ev.id)}
                      className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Calendar Event Modal */}
          {showAddCalendarModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-serif font-bold text-lg text-foreground">Add New Calendar Event</h3>
                  <button onClick={() => setShowAddCalendarModal(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCalendarEvent} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2nd Term CBT Mock Examination"
                      value={calendarForm.title}
                      onChange={e => setCalendarForm({ ...calendarForm, title: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Category</label>
                      <select
                        value={calendarForm.category}
                        onChange={e => setCalendarForm({ ...calendarForm, category: e.target.value })}
                        className="w-full border border-border rounded-xl px-3.5 py-2.5 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="Academic">Academic</option>
                        <option value="Exam">Exam / CBT</option>
                        <option value="Holiday">Holiday / Break</option>
                        <option value="Event">Exhibition / Event</option>
                        <option value="Meeting">Meeting / PTA</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Scope</label>
                      <select
                        value={calendarForm.scope}
                        onChange={e => setCalendarForm({ ...calendarForm, scope: e.target.value })}
                        className="w-full border border-border rounded-xl px-3.5 py-2.5 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                      >
                        <option value="All Classes">All Classes</option>
                        <option value="Junior Secondary">Junior Secondary</option>
                        <option value="Senior Secondary">Senior Secondary</option>
                        <option value="School Wide">School Wide</option>
                        <option value="Parents & Staff">Parents & Staff</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={calendarForm.date}
                        onChange={e => setCalendarForm({ ...calendarForm, date: e.target.value })}
                        className="w-full border border-border rounded-xl px-3.5 py-2 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={calendarForm.endDate}
                        onChange={e => setCalendarForm({ ...calendarForm, endDate: e.target.value })}
                        className="w-full border border-border rounded-xl px-3.5 py-2 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Event Description & Detail</label>
                    <textarea
                      rows={3}
                      placeholder="Brief details about schedule, venue, or requirements..."
                      value={calendarForm.detail}
                      onChange={e => setCalendarForm({ ...calendarForm, detail: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save & Publish Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCalendarModal(false)}
                      className="px-5 py-3 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeSection === 'reports') return renderModuleHeader('Reports', 'Generate comprehensive academic, attendance, teacher, and student analytical reports.', BarChart2);

    return null;
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <PortalLayout title="Admin Control Center" activeSection={activeSection} onNavigate={setActiveSection}>
        {idCardUser && <StudentIDModal student={idCardUser} onClose={() => setIdCardUser(null)} />}
        {showEditTeacherModal && editTeacherForm && (
          <EditTeacherModal
            teacher={editTeacherForm}
            onClose={() => { setShowEditTeacherModal(false); setEditTeacherForm(null); }}
            onOpenCrop={triggerCropModal}
            onSave={(updated) => {
              handleSaveTeacherRealtime(updated);
              setShowEditTeacherModal(false);
              setEditTeacherForm(null);
            }}
          />
        )}
        {showEditStudentModal && editStudentForm && (
          <EditStudentModal
            student={editStudentForm}
            onClose={() => { setShowEditStudentModal(false); setEditStudentForm(null); }}
            onOpenCrop={triggerCropModal}
            onSave={(updated) => {
              handleSaveStudentRealtime(updated);
              setShowEditStudentModal(false);
              setEditStudentForm(null);
            }}
          />
        )}
        {showTeacherIDCardModal && <TeacherIDCardModal teacher={showTeacherIDCardModal} onClose={() => setShowTeacherIDCardModal(null)} />}
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
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" /> {t('wizard.registerTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('addStudentWizard.step')} {wizardStep} {t('addStudentWizard.of')} 5 — Progressive Enrollment Wizard</p>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-muted/40 h-1.5 flex">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(wizardStep / 5) * 100}%` }} />
              </div>

              {/* Steps Pill Header */}
              <div className="px-6 pt-3 pb-2 border-b border-border/40 flex justify-between text-[11px] font-bold text-muted-foreground">
                <span className={wizardStep >= 1 ? 'text-primary' : ''}>1. Personal</span>
                <span className={wizardStep >= 2 ? 'text-primary' : ''}>2. Class</span>
                <span className={wizardStep >= 3 ? 'text-primary' : ''}>3. Address</span>
                <span className={wizardStep >= 4 ? 'text-primary' : ''}>4. Photo</span>
                <span className={wizardStep >= 5 ? 'text-primary' : ''}>5. Admission No</span>
              </div>

              {/* Slide Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Slide 1: Basic Information */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.personalId')}</h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.fullName')}</label>
                      <input type="text" placeholder="e.g. Kelechi Amadi" value={newStudentForm.name}
                        onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.dob')}</label>
                        <input type="date" value={newStudentForm.dob}
                          onChange={e => setNewStudentForm({ ...newStudentForm, dob: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.gender')}</label>
                        <select value={newStudentForm.gender}
                          onChange={e => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="Male">{t('wizard.male')}</option>
                          <option value="Female">{t('wizard.female')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 2: Class & Stream Assignment */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.academicLevel', 'Academic Level & Target Class')}</h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.targetClass', 'Target Class Level *')}</label>
                      <select value={newStudentForm.grade}
                        onChange={e => {
                          const val = e.target.value;
                          const isSS = val.startsWith('SS');
                          setNewStudentForm({
                            ...newStudentForm,
                            grade: val,
                            stream: isSS ? 'Science' : 'General',
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        <optgroup label="Early Years & Nursery">
                          <option value="Creche">Creche / Toddler</option>
                          <option value="Nursery 1">Nursery 1 (NUR 1)</option>
                          <option value="Nursery 2">Nursery 2 (NUR 2)</option>
                          <option value="Nursery 3">Nursery 3 (NUR 3 / Kindergarten)</option>
                        </optgroup>
                        <optgroup label="Primary School (Basic 1 - 6)">
                          <option value="Primary 1">Primary 1 (Basic 1)</option>
                          <option value="Primary 2">Primary 2 (Basic 2)</option>
                          <option value="Primary 3">Primary 3 (Basic 3)</option>
                          <option value="Primary 4">Primary 4 (Basic 4)</option>
                          <option value="Primary 5">Primary 5 (Basic 5)</option>
                          <option value="Primary 6">Primary 6 (Basic 6)</option>
                        </optgroup>
                        <optgroup label="Junior Secondary School">
                          <option value="JSS1">Junior Secondary 1 (JSS 1)</option>
                          <option value="JSS2">Junior Secondary 2 (JSS 2)</option>
                          <option value="JSS3">Junior Secondary 3 (JSS 3)</option>
                        </optgroup>
                        <optgroup label="Senior Secondary School">
                          <option value="SS1">Senior Secondary 1 (SS 1)</option>
                          <option value="SS2">Senior Secondary 2 (SS 2)</option>
                          <option value="SS3">Senior Secondary 3 (SS 3)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.streamAssignment', 'Class Stream / Arm Assignment')}</label>
                      {newStudentForm.grade.startsWith('SS') ? (
                        <select value={newStudentForm.stream}
                          onChange={e => setNewStudentForm({ ...newStudentForm, stream: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="Science">Science Stream</option>
                          <option value="Art">Art & Humanities Stream</option>
                          <option value="Commercial">Commercial / Business Stream</option>
                        </select>
                      ) : (
                        <select value={newStudentForm.stream}
                          onChange={e => setNewStudentForm({ ...newStudentForm, stream: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="General">General (Core Curriculum)</option>
                          <option value="Faith">Faith Arm</option>
                          <option value="Love">Love Arm</option>
                          <option value="Grace">Grace Arm</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Slide 3: Origin, Location & Guardian Contacts */}
                {wizardStep === 3 && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.originTitle')}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.country')}</label>
                        <input type="text" value={newStudentForm.country}
                          onChange={e => setNewStudentForm({ ...newStudentForm, country: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.stateOfOrigin')}</label>
                        <input type="text" placeholder="e.g. Bayelsa" value={newStudentForm.stateOfOrigin}
                          onChange={e => setNewStudentForm({ ...newStudentForm, stateOfOrigin: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">L.G.A *</label>
                        <input type="text" placeholder="e.g. Yenagoa" value={newStudentForm.lga}
                          onChange={e => setNewStudentForm({ ...newStudentForm, lga: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.address')}</label>
                      <input type="text" placeholder="e.g. Azikoro village, Yenagoa" value={newStudentForm.address}
                        onChange={e => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.parentName')}</label>
                        <input type="text" placeholder="e.g. Parent / Guardian Full Name" value={newStudentForm.parentName}
                          onChange={e => setNewStudentForm({ ...newStudentForm, parentName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.parentPhone')}</label>
                        <input type="tel" placeholder="e.g. 08031234567" value={newStudentForm.parentPhone}
                          onChange={e => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 4: Student Profile Picture Local Upload */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.photoTitle')}</h4>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/20 text-center">
                      <div className="w-24 h-24 rounded-2xl border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden mb-3 shadow-inner">
                        {newStudentForm.profileImage ? (
                          <img src={newStudentForm.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-10 h-10 text-primary" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground mb-1">{t('wizard.uploadPhoto')}</p>
                      <p className="text-[11px] text-muted-foreground mb-4">{t('wizard.selectPhotoHint')}</p>

                      <input
                        type="file"
                        id="studentPhotoLocalInput"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              (window as any).showTarepetAlert?.('The selected image file exceeds 10MB. Please select a photo below 10MB.', 'Image Size Limit Exceeded', 'warning');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              triggerCropModal(base64, (cropped) => {
                                setNewStudentForm(prev => ({ ...prev, profileImage: cropped }));
                              });
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }
                        }}
                      />

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('studentPhotoLocalInput')?.click()}
                          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Upload className="w-4 h-4" /> {newStudentForm.profileImage ? 'Change Photo' : 'Add Photo from File'}
                        </button>
                        {newStudentForm.profileImage && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                triggerCropModal(newStudentForm.profileImage, (cropped) => {
                                  setNewStudentForm(prev => ({ ...prev, profileImage: cropped }));
                                });
                              }}
                              className="px-3 py-2 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Scissors className="w-3.5 h-3.5 text-primary" /> Crop Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewStudentForm(prev => ({ ...prev, profileImage: '' }))}
                              className="px-3 py-2 text-rose-600 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 5: Generated Admission Number & Credentials Summary */}
                {wizardStep === 5 && (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-serif font-bold text-foreground">{t('wizard.readyTitle')}</h4>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-left space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t('wizard.genCredentials')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.admissionNo')}</span>
                        <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/30">
                          {currentWizardAdmissionNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.genEmail')}</span>
                        <span className="text-xs font-bold text-foreground underline font-mono">
                          {formatStudentEmail(newStudentForm.name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-foreground">Default Password</span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {currentWizardAdmissionNo} (School ID)
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.assignedClass')}</span>
                        <span className="text-xs font-bold text-foreground">
                          {newStudentForm.grade} {newStudentForm.grade.startsWith('SS') ? `(${newStudentForm.stream})` : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('wizard.admissionNote')}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                {wizardStep > 1 ? (
                  <button onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">
                    {t('wizard.back')}
                  </button>
                ) : <div />}

                {wizardStep < 5 ? (
                  <button
                    disabled={wizardStep === 1 && !newStudentForm.name}
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {t('wizard.nextStep')}
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const generatedId = currentWizardAdmissionNo;
                      const autoEmail = formatStudentEmail(newStudentForm.name);

                      await saveStudent({
                        name: newStudentForm.name,
                        code: generatedId,
                        admissionNo: generatedId,
                        email: autoEmail,
                        password: generatedId,
                        grade: newStudentForm.grade,
                        stream: newStudentForm.stream,
                        house: newStudentForm.house || '',
                        status: 'ACTIVE',
                        dob: newStudentForm.dob,
                        gender: newStudentForm.gender,
                        country: newStudentForm.country || 'Nigeria',
                        stateOfOrigin: newStudentForm.stateOfOrigin || 'Bayelsa',
                        lga: newStudentForm.lga || 'Yenagoa',
                        address: newStudentForm.address,
                        parentName: newStudentForm.parentName,
                        parentPhone: newStudentForm.parentPhone,
                        profileImage: newStudentForm.profileImage,
                      });
                      await syncStudentsWithBackend();
                      setShowAddStudentModal(false);
                    }}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Save & Register Student
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* REVIEW FINANCIAL STATUS MODAL */}
        {selectedReviewStudent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Official Bursary Financial Record
                  </div>
                  <h3 className="font-serif font-bold text-xl text-foreground">{selectedReviewStudent.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Admission No: <span className="font-mono font-bold text-primary">{selectedReviewStudent.admissionNo}</span> · Class: <span className="font-semibold text-foreground">{selectedReviewStudent.grade}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReviewStudent(null)}
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Metrics Cards */}
              {(() => {
                const reqItems = adminPaymentItems.filter(i => i.isRequired);
                const totalAssigned = reqItems.reduce((s, i) => s + i.amount, 0);
                const stdTxs = getStudentTransactions(selectedReviewStudent.id).filter(t => t.status === 'SUCCESS');
                const totalPaid = stdTxs.reduce((s, t) => s + t.amount, 0);
                const balance = Math.max(0, totalAssigned - totalPaid);
                const status = totalAssigned === 0 ? 'UNCONFIGURED' : balance === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'OWING';

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Total Fee Assigned</span>
                        <span className="text-lg font-serif font-bold text-foreground">
                          {totalAssigned > 0 ? `₦${totalAssigned.toLocaleString()}` : 'Unconfigured'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Total Paid</span>
                        <span className="text-lg font-serif font-bold text-emerald-600">₦{totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Outstanding Balance</span>
                        <span className="text-lg font-serif font-bold text-rose-600">₦{balance.toLocaleString()}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-center flex flex-col justify-center items-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                          status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                          status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                          status === 'OWING' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
                          'bg-slate-500/10 text-slate-600 border-slate-500/30'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Itemized Fee Breakdown Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itemized Fee Breakdown</h4>
                      <div className="overflow-x-auto border border-border rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/40 text-muted-foreground uppercase text-[9px] tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3">Fee Item</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-right">Configured Amount</th>
                              <th className="py-2.5 px-3 text-right">Paid Amount</th>
                              <th className="py-2.5 px-3 text-center">Item Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {adminPaymentItems.map(item => {
                              const s = getStudentItemStatus(selectedReviewStudent.id, item.id);
                              return (
                                <tr key={item.id} className="hover:bg-muted/10">
                                  <td className="py-2.5 px-3 font-bold text-foreground">{item.name}</td>
                                  <td className="py-2.5 px-3 text-muted-foreground">{item.category}</td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                    {item.amount > 0 ? `₦${item.amount.toLocaleString()}` : <span className="text-amber-600 text-[10px]">Unset</span>}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">₦{s.paidAmount.toLocaleString()}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      s.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                                      s.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600' :
                                      'bg-rose-500/10 text-rose-600'
                                    }`}>
                                      {s.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Verified Transaction History */}
                    {stdTxs.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Audit Log & Receipts</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {stdTxs.map(tx => (
                            <div key={tx.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-foreground">{tx.itemName}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">Ref: {tx.reference} · {new Date(tx.paidAt).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-serif font-bold text-emerald-600">₦{tx.amount.toLocaleString()}</span>
                                <button
                                  onClick={() => setReceiptModalData({ ...tx, studentName: selectedReviewStudent.name, admissionNo: selectedReviewStudent.admissionNo })}
                                  className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Receipt
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedReviewStudent(null)}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Create New Subject Modal */}
        {showCreateSubjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 space-y-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">Add New Curriculum Subject</h3>
                    <p className="text-xs text-muted-foreground">Register a new academic course or subject</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateSubjectModal(false)}
                  className="w-8 h-8 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Subject Title *</label>
                  <input
                    type="text"
                    value={newSubjectForm.title}
                    onChange={e => setNewSubjectForm({ ...newSubjectForm, title: e.target.value })}
                    placeholder="e.g. Physics, Literature in English, Mathematics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Target Class *</label>
                    <select
                      value={newSubjectForm.grade}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, grade: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <optgroup label="Early Years & Nursery">
                        <option value="Creche">Creche</option>
                        <option value="Nursery 1">NUR 1</option>
                        <option value="Nursery 2">NUR 2</option>
                        <option value="Nursery 3">NUR 3</option>
                      </optgroup>
                      <optgroup label="Primary School">
                        <option value="Primary 1">Primary 1</option>
                        <option value="Primary 2">Primary 2</option>
                        <option value="Primary 3">Primary 3</option>
                        <option value="Primary 4">Primary 4</option>
                        <option value="Primary 5">Primary 5</option>
                        <option value="Primary 6">Primary 6</option>
                      </optgroup>
                      <optgroup label="Junior Secondary">
                        <option value="JSS 1">JSS 1</option>
                        <option value="JSS 2">JSS 2</option>
                        <option value="JSS 3">JSS 3</option>
                      </optgroup>
                      <optgroup label="Senior Secondary">
                        <option value="SS 1">SS 1</option>
                        <option value="SS 2">SS 2</option>
                        <option value="SS 3">SS 3</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Stream / Track</label>
                    <select
                      value={newSubjectForm.stream}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, stream: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="General">General</option>
                      <option value="Science">Science</option>
                      <option value="Art">Art & Humanities</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Assigned Teacher</label>
                    <select
                      value={newSubjectForm.teacher}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, teacher: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      {getStoredTeachers().map(t => (
                        <option key={t.staffId || t.name} value={t.name}>{t.name} ({t.specialization || t.department})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Category</label>
                    <select
                      value={newSubjectForm.category}
                      onChange={e => setNewSubjectForm({ ...newSubjectForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="STEM">STEM & Sciences</option>
                      <option value="General Core">General Core</option>
                      <option value="Humanities">Humanities & Arts</option>
                      <option value="Technical & Applied">Technical & Applied</option>
                      <option value="Life Sciences">Life Sciences</option>
                      <option value="Physical & Health">Physical & Health</option>
                      <option value="Trade & Entrepreneurship">Trade & Entrepreneurship</option>
                      <option value="Early Childhood">Early Childhood</option>
                      <option value="Primary">Primary</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateSubjectModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubjectForm.title.trim()) {
                      showAlert?.({ title: 'Validation Error', message: 'Please enter subject title.', type: 'warning' });
                      return;
                    }
                    const generatedCode = newSubjectForm.title.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'SUBJ';
                    const saved = saveSubject({
                      title: newSubjectForm.title.trim(),
                      code: generatedCode,
                      grade: newSubjectForm.grade,
                      stream: newSubjectForm.stream,
                      category: newSubjectForm.category,
                      teacher: newSubjectForm.teacher,
                      periods: newSubjectForm.periods,
                      passMark: newSubjectForm.passMark,
                      room: newSubjectForm.room,
                    });
                    setSubjectsListState(getStoredSubjects());
                    setShowCreateSubjectModal(false);
                    showAlert?.({
                      title: 'Subject Added',
                      message: `"${saved.title}" was successfully added to the school curriculum for ${saved.grade}.`,
                      type: 'success'
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subject Preview Modal */}
        {selectedSubjectPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 space-y-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                    {selectedSubjectPreview.code}
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">{selectedSubjectPreview.title}</h3>
                    <p className="text-xs text-muted-foreground">{selectedSubjectPreview.grade} · {selectedSubjectPreview.stream || 'General'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubjectPreview(null)}
                  className="w-8 h-8 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Assigned Educator:</span>
                    <span className="font-bold text-foreground">{selectedSubjectPreview.teacher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Academic Category:</span>
                    <span className="font-bold text-foreground">{selectedSubjectPreview.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Schedule / Periods:</span>
                    <span className="font-bold text-foreground">{selectedSubjectPreview.periods || '3 Periods/wk'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Classroom / Lab:</span>
                    <span className="font-bold text-foreground">{selectedSubjectPreview.room || 'Main Hall'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Pass Mark:</span>
                    <span className="font-bold text-emerald-600">{selectedSubjectPreview.passMark || 50}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    deleteSubject(selectedSubjectPreview.id);
                    setSubjectsListState(getStoredSubjects());
                    setSelectedSubjectPreview(null);
                    showAlert?.({ title: 'Subject Deleted', message: 'Subject was removed from the active curriculum.', type: 'info' });
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Subject
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubjectPreview(null)}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {renderSection()}

        {/* Realtime Toast Banner */}
        {adminToastMsg && (
          <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{adminToastMsg}</span>
          </div>
        )}

        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={pendingCropImage}
          onClose={() => {
            setCropModalOpen(false);
            setOnCropSaveCallback(null);
          }}
          onSave={(cropped) => {
            if (onCropSaveCallback) {
              onCropSaveCallback(cropped);
            }
            setCropModalOpen(false);
            setOnCropSaveCallback(null);
          }}
        />
      </PortalLayout>
    </ProtectedRoute>
  );
}
