import React, { useState } from 'react';
import { useTranslation } from '@/i18n';
import { Link } from 'wouter';
import { authClient } from '@/lib/api-auth';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getStoredExams, updateExamStatus, saveCBTExam, subscribeToCBTStore, generateAdmissionNumber } from '@/lib/cbt-store';

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
  School, CalendarCheck, Megaphone, UserPlus, FileSpreadsheet, TrendingUp, Sparkles, ChevronRight, Eye, Layers, ShieldCheck, Bell, AlertTriangle,
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

// ── Types ────────────────────────────────────────────────────
interface TabProps { id: string; label: string; icon: React.ReactNode; badge?: number }

const MOCK_USERS: any[] = [];
const MOCK_STUDENTS: any[] = [];
const MOCK_SS_STUDENTS = MOCK_STUDENTS;
const MOCK_TEACHERS: any[] = [];

const MOCK_SUBJECTS: any[] = [];

const MOCK_HOUSES = [
  { name: 'Blue House (Eagle)', color: '#3B82F6', motto: 'Wisdom & Integrity', points: 0, students: 0, head: 'Unassigned' },
  { name: 'Purple House (Phoenix)', color: '#8B5CF6', motto: 'Royalty & Distinction', points: 0, students: 0, head: 'Unassigned' },
  { name: 'Green House (Jaguar)', color: '#10B981', motto: 'Growth & Resilience', points: 0, students: 0, head: 'Unassigned' },
  { name: 'Red House (Falcon)', color: '#EF4444', motto: 'Passion & Determination', points: 0, students: 0, head: 'Unassigned' },
];

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
                    <span className="text-2xl font-serif font-bold text-primary">{student.name[0]}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{student.name}</h4>
                <p className="text-xs text-muted-foreground font-medium mt-1">{student.grade || t('idCard.class')}</p>
                <p className="text-xs text-muted-foreground">{student.house || t('idCard.house')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t('idCard.studentId')}</span>
                    <p className="font-bold text-foreground">{student.admissionNo || t('idCard.sampleId')}</p>
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
            <FaIdCard className="w-5 h-5 text-emerald-600" /> Faculty & Staff ID Card
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6">
          <div className="border-4 border-emerald-600 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 mb-5">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-90">Tarepet Montessori School</p>
                <p className="text-[10px] opacity-80">Faculty & Academic Staff Identification</p>
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="p-5 flex gap-5 items-center">
              <div className="w-24 h-28 rounded-xl bg-muted/60 border-2 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                {teacher.profileImage ? (
                  <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-serif font-bold">
                      {teacher.name[0]}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {teacher.department || 'Academic Staff'}
                </span>
                <h4 className="font-serif font-bold text-foreground text-lg leading-tight mt-1 truncate">{teacher.name}</h4>
                <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">{teacher.specialization || 'Educator'}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px]">Staff ID:</span>
                    <p className="font-bold font-mono text-emerald-700">{teacher.staffId || 'TMS/TCH/001'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Status:</span>
                    <p className="font-bold text-foreground">{teacher.status || 'Active'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 px-5 py-2 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
              <span>ISSUED: 2026-01-10</span>
              <span>EXPIRES: 2028-12-31</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              <Printer className="w-4 h-4" /> Print Staff Card
            </button>
            <button onClick={() => alert('Downloading Staff ID PDF...')} className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WIZARD_STEPS = [
  { step: 1, label: 'Personal Info',   icon: 'user' },
  { step: 2, label: 'Academic Info',   icon: 'book' },
  { step: 3, label: 'Teaching Load',   icon: 'clipboard' },
  { step: 4, label: 'Employment',      icon: 'briefcase' },
  { step: 5, label: 'Review & Save',   icon: 'check' },
];

const DEPT_OPTIONS = ['Mathematics & STEM', 'Sciences', 'Humanities & Arts', 'Vocational & Technology', 'Languages'];
const GRADE_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SS1 Science', 'SS1 Art', 'SS2 Science', 'SS2 Art', 'SS3 Science', 'SS3 Art'];

const EMPTY_TEACHER_FORM = {
  // Step 1 — Personal Info
  name: '', gender: '', dob: '', phone: '', email: '', address: '',
  // Step 2 — Academic Info
  department: '', specialization: '', qualification: '', profileImage: '',
  // Step 3 — Teaching Load
  formTeacherOf: '', subjectsAssigned: [{ code: '', name: '', grade: 'JSS1' }],
  // Step 4 — Employment
  staffId: '', joined: '', status: 'Active', salary: '', salaryGrade: '', bankName: '', accountNumber: '',
};

const AddTeacherWizardModal = ({ onClose, onSave }: { onClose: () => void; onSave: (t: any) => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_TEACHER_FORM });

  const setF = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const addSubject = () => setForm(prev => ({
    ...prev,
    subjectsAssigned: [...prev.subjectsAssigned, { code: '', name: '', grade: 'JSS1' }],
  }));
  const removeSubject = (i: number) => setForm(prev => ({
    ...prev,
    subjectsAssigned: prev.subjectsAssigned.filter((_: any, idx: number) => idx !== i),
  }));
  const updateSubject = (i: number, key: string, val: string) => setForm(prev => ({
    ...prev,
    subjectsAssigned: prev.subjectsAssigned.map((s: any, idx: number) => idx === i ? { ...s, [key]: val } : s),
  }));

  const handleSave = () => {
    const serial = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
    const staffId = form.staffId || `TMS/TCH/${serial}`;
    const nameParts = (form.name || 'Teacher Staff').trim().split(' ');
    const firstName = nameParts[0] || 'Teacher';
    const lastName = nameParts.slice(1).join(' ') || 'Staff';
    const email = form.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tarepet.com`;

    const created = {
      id: Date.now(),
      staffId: staffId,
      name: form.name || `${firstName} ${lastName}`,
      email: email,
      phone: form.phone,
      gender: form.gender,
      department: form.department,
      specialization: form.specialization,
      qualification: form.qualification,
      status: form.status,
      joined: form.joined || new Date().toISOString().split('T')[0],
      formTeacherOf: form.formTeacherOf || 'None',
      subjectsAssigned: form.subjectsAssigned.filter((s: any) => s.name),
      classesCount: form.subjectsAssigned.filter((s: any) => s.name).length,
      studentsCount: 0,
      address: form.address,
      dob: form.dob,
      cbtExamsCount: 0,
      attendanceRate: '0%',
      profileImage: form.profileImage || '',
      salary: form.salary,
      salaryGrade: form.salaryGrade,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
    };

    // 1. Post to backend Django REST API
    authClient.post('/auth/register/', {
      email: email,
      password: staffId,
      first_name: firstName,
      last_name: lastName,
      phone: form.phone,
      role: 'TEACHER',
      teacher_id: staffId,
    }).catch(() => {
      // Backend offline or unreachable — local fallback handles it
    });

    // 2. Persist locally for offline / fallback authentication
    try {
      const existing = JSON.parse(localStorage.getItem('local_registered_users') || '[]');
      existing.push({
        email: email,
        teacher_id: staffId,
        staffId: staffId,
        password: staffId,
        first_name: firstName,
        last_name: lastName,
        role: 'TEACHER',
        profileImage: form.profileImage || '',
      });
      localStorage.setItem('local_registered_users', JSON.stringify(existing));
    } catch (e) {
      // ignore
    }

    onSave(created);
  };

  const inputCls = 'w-full border border-border rounded-xl px-4 py-2.5 text-xs text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary';
  const labelCls = 'text-[10px] font-bold uppercase text-muted-foreground block mb-1';

  const StepIcon = ({ s }: { s: number }) => {
    const icons: Record<number, React.ReactNode> = {
      1: <Users className="w-4 h-4" />,
      2: <BookOpen className="w-4 h-4" />,
      3: <ClipboardList className="w-4 h-4" />,
      4: <Briefcase className="w-4 h-4" />,
      5: <CheckCircle2 className="w-4 h-4" />,
    };
    return <>{icons[s]}</>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Register New Teacher</h3>
              <p className="text-[10px] text-muted-foreground">Step {step} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step - 1].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((s, i) => (
              <React.Fragment key={s.step}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  step === s.step ? 'bg-primary text-white' :
                  step > s.step ? 'bg-emerald-500/10 text-emerald-600' :
                  'bg-muted/40 text-muted-foreground'
                }`}>
                  <StepIcon s={s.step} />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s.step ? 'bg-emerald-500' : 'bg-border'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* STEP 1 — Personal Info */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Personal Information</p>
              <div>
                <label className={labelCls}>Full Name & Title (e.g. Mr. John Doe)</label>
                <input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Mr. Okonkwo Paul" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Gender</label>
                  <select className={inputCls} value={form.gender} onChange={e => setF('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <input type="date" className={inputCls} value={form.dob} onChange={e => setF('dob', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input className={inputCls} value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+234 800 000 0000" />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input type="email" className={inputCls} value={form.email} onChange={e => setF('email', e.target.value)} placeholder="name@tarepet.edu.ng" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Residential Address</label>
                <input className={inputCls} value={form.address} onChange={e => setF('address', e.target.value)} placeholder="e.g. 15 Swali Road, Yenagoa, Bayelsa State" />
              </div>
              <div>
                <label className={labelCls}>Teacher Profile Photo</label>
                <div className="flex items-center gap-4 p-3 bg-muted/20 border border-border rounded-xl">
                  <div className="w-16 h-16 rounded-xl bg-card border-2 border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                    {form.profileImage ? (
                      <img src={form.profileImage} alt="Teacher Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-lg font-serif">
                        {form.name ? form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'TC'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="wizardTeacherPhotoInput" className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Upload Image
                      </label>
                      {form.profileImage && (
                        <button
                          type="button"
                          onClick={() => setF('profileImage', '')}
                          className="px-2.5 py-1.5 bg-rose-500/10 text-rose-600 text-[11px] font-bold rounded-lg hover:bg-rose-500/20 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      id="wizardTeacherPhotoInput"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image size exceeds 5MB limit.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => setF('profileImage', reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-semibold">Or enter URL:</span>
                      <input
                        type="url"
                        className="flex-1 border border-border rounded-lg px-2.5 py-1 text-[11px] text-foreground bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        value={form.profileImage.startsWith('data:') ? '' : form.profileImage}
                        onChange={e => setF('profileImage', e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Supported Formats: <span className="font-bold text-foreground">JPEG, PNG, WEBP, SVG</span> (Max: 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Academic Info */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Academic Credentials</p>
              <div>
                <label className={labelCls}>Department</label>
                <select className={inputCls} value={form.department} onChange={e => setF('department', e.target.value)}>
                  <option value="">Select department</option>
                  {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Specialization / Subject Area</label>
                <input className={inputCls} value={form.specialization} onChange={e => setF('specialization', e.target.value)} placeholder="e.g. Pure & Applied Mathematics, STEM" />
              </div>
              <div>
                <label className={labelCls}>Qualifications & Degrees</label>
                <input className={inputCls} value={form.qualification} onChange={e => setF('qualification', e.target.value)} placeholder="e.g. B.Sc. Ed (Mathematics), M.Sc. Statistics, Ph.D" />
              </div>
            </div>
          )}

          {/* STEP 3 — Teaching Load */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Teaching Load & Assignments</p>
              <div>
                <label className={labelCls}>Form Teacher Of (Class Register Holder)</label>
                <select className={inputCls} value={form.formTeacherOf} onChange={e => setF('formTeacherOf', e.target.value)}>
                  <option value="">None / Not a Form Teacher</option>
                  {['JSS1 General', 'JSS2 General', 'JSS3 General', 'SS1 Science', 'SS1 Art', 'SS2 Science', 'SS2 Art', 'SS3 Science', 'SS3 Art'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + ' mb-0'}>Subjects Assigned</label>
                  <button type="button" onClick={addSubject} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Add Subject
                  </button>
                </div>
                <div className="space-y-2">
                  {form.subjectsAssigned.map((sub: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className={inputCls + ' col-span-2'} value={sub.code} onChange={e => updateSubject(i, 'code', e.target.value)} placeholder="Code" />
                      <input className={inputCls + ' col-span-5'} value={sub.name} onChange={e => updateSubject(i, 'name', e.target.value)} placeholder="Subject Name" />
                      <select className={inputCls + ' col-span-4'} value={sub.grade} onChange={e => updateSubject(i, 'grade', e.target.value)}>
                        {GRADE_OPTIONS.map(g => <option key={g}>{g}</option>)}
                      </select>
                      <button type="button" onClick={() => removeSubject(i)} className="col-span-1 flex justify-center text-rose-500 hover:text-rose-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Employment & Payroll */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Employment & Payroll Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Staff ID (auto-generated if blank)</label>
                  <input className={inputCls + ' font-mono'} value={form.staffId} onChange={e => setF('staffId', e.target.value)} placeholder="TMS/TCH/2026/001" />
                </div>
                <div>
                  <label className={labelCls}>Date of Employment</label>
                  <input type="date" className={inputCls} value={form.joined} onChange={e => setF('joined', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Employment Status</label>
                  <select className={inputCls} value={form.status} onChange={e => setF('status', e.target.value)}>
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Salary Grade Level</label>
                  <select className={inputCls} value={form.salaryGrade} onChange={e => setF('salaryGrade', e.target.value)}>
                    <option value="">Select grade</option>
                    {['GL-07', 'GL-08', 'GL-09', 'GL-10', 'GL-12', 'GL-13', 'GL-14', 'GL-15 (HOD)', 'GL-16 (Principal)'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Monthly Gross Salary (₦)</label>
                <input type="number" className={inputCls} value={form.salary} onChange={e => setF('salary', e.target.value)} placeholder="e.g. 150000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Bank Name</label>
                  <input className={inputCls} value={form.bankName} onChange={e => setF('bankName', e.target.value)} placeholder="e.g. First Bank, GTBank" />
                </div>
                <div>
                  <label className={labelCls}>Bank Account Number</label>
                  <input className={inputCls} value={form.accountNumber} onChange={e => setF('accountNumber', e.target.value)} placeholder="10-digit account number" maxLength={10} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — Review & Save */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Review Teacher Profile</p>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
                {/* Header preview */}
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl font-bold text-emerald-700 shrink-0">
                    {form.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{form.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{form.specialization || '—'}</p>
                    <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${form.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>{form.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {[
                    ['Staff ID', form.staffId || `TMS/TCH/${new Date().getFullYear()}/AUTO`],
                    ['Department', form.department || '—'],
                    ['Gender', form.gender || '—'],
                    ['Date of Birth', form.dob || '—'],
                    ['Email', form.email || '—'],
                    ['Phone', form.phone || '—'],
                    ['Qualifications', form.qualification || '—'],
                    ['Form Teacher Of', form.formTeacherOf || 'None'],
                    ['Date of Employment', form.joined || '—'],
                    ['Salary Grade', form.salaryGrade || '—'],
                    ['Monthly Salary', form.salary ? `₦${Number(form.salary).toLocaleString()}` : '—'],
                    ['Bank / Account', form.bankName ? `${form.bankName} — ${form.accountNumber}` : '—'],
                    ['Address', form.address || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="py-1 border-b border-border/40">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k}</p>
                      <p className="font-semibold text-foreground truncate">{v}</p>
                    </div>
                  ))}
                </div>
                {form.subjectsAssigned.filter((s: any) => s.name).length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Subjects Assigned ({form.subjectsAssigned.filter((s: any) => s.name).length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.subjectsAssigned.filter((s: any) => s.name).map((s: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                          {s.code && `[${s.code}] `}{s.name} — {s.grade}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.name}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                Next Step <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!form.name || !form.email || !form.department}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Save & Register Teacher
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const EditTeacherModal = ({ teacher, onClose, onSave }: { teacher: any; onClose: () => void; onSave: (updated: any) => void }) => {
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
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Mathematics & STEM">Mathematics & STEM</option>
                <option value="Sciences">Sciences</option>
                <option value="Humanities & Arts">Humanities & Arts</option>
                <option value="Vocational & Technology">Vocational & Technology</option>
                <option value="Languages">Languages</option>
              </select>
            </div>
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
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Form Teacher Duty</label>
              <input type="text" value={form.formTeacherOf || ''} onChange={e => setForm({ ...form, formTeacherOf: e.target.value })} placeholder="e.g. SS1 Science"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors">
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
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🏆</div>
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
          <h3 className="font-serif font-bold text-xl text-foreground">{t('addSubject.title')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.codeLabel')}</label>
            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.nameLabel')}</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.instructorLabel')}</label>
            <input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.classLevel')}</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        <h3 className="font-serif font-bold text-xl text-foreground mb-4">{t('createUser.title')}</h3>
        {!created ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.fullName')}</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. Ngozi Eze" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.email')}</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. ngozi.eze@tarepet.edu.ng" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.role')}</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="STUDENT">{t('createUser.student')}</option>
                <option value="TEACHER">{t('createUser.teacher')}</option>
                <option value="PARENT">{t('createUser.parent')}</option>
                <option value="ADMIN">{t('createUser.admin')}</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCreated(true)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">{t('createUser.createBtn')}</button>
              <button onClick={onClose} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">{t('createUser.cancel')}</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-lg">{t('createUser.created')}</h4>
            <p className="text-xs text-muted-foreground">{t('createUser.credentials')} & login instructions sent to {form.email}.</p>
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
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                    🔑 <strong>Student Authentication:</strong> Student ID Number (Admission No) will be auto-generated. Students log into their portal using their <strong>Email Address</strong> and <strong>Student ID Number</strong>.
                  </div>
                </div>
              )}

              <div className="bg-muted/20 border border-border rounded-xl p-3 text-xs text-muted-foreground">
                🔒 Account credentials and initial login access instructions will be sent to the email provided.
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

// ── Main Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [activeSection, setActiveSectionState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSec = params.get('section');
      if (urlSec) return urlSec;
      const cached = localStorage.getItem('admin_active_section') || sessionStorage.getItem('admin_active_section');
      if (cached) return cached;
    }
    return 'overview';
  });
  const setActiveSection = (section: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_section', section);
      sessionStorage.setItem('admin_active_section', section);
      const url = new URL(window.location.href);
      url.searchParams.set('section', section);
      window.history.replaceState(null, '', url.toString());
    }
    setActiveSectionState(section);
  };
  const [userSubPage, setUserSubPage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState('');
  const [idCardUser, setIdCardUser] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCreateForType, setShowCreateForType] = useState(false);
  const [awardHouse, setAwardHouse] = useState<any>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [usersList, setUsersList] = useState(MOCK_USERS);
  const [studentsList, setStudentsList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_students_list');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return MOCK_STUDENTS;
  });
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
  });
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  // Student class drill-down
  const [selectedClass, setSelectedClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedStream, setSelectedStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openClassDropdown, setOpenClassDropdown] = useState<string | null>(null); // which class card has dropdown open
  const [examsList, setExamsList] = useState(INITIAL_EXAMS);
  const [previewExam, setPreviewExam] = useState<any>(null);

  // Manage exams drill-down state
  const [selectedExamClass, setSelectedExamClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedExamStream, setSelectedExamStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openExamClassDropdown, setOpenExamClassDropdown] = useState<string | null>(null); // dropdown toggle
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);    // 'Test' | 'Exam' | 'All'
  const [examRepoFilter, setExamRepoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Manage subjects drill-down state
  const [selectedSubjectClass, setSelectedSubjectClass] = useState<string | null>(null);
  const [selectedSubjectStream, setSelectedSubjectStream] = useState<string | null>(null);
  const [openSubjectClassDropdown, setOpenSubjectClassDropdown] = useState<string | null>(null);
  const [showSubjectsActionsDropdown, setShowSubjectsActionsDropdown] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [subjectsListState, setSubjectsListState] = useState(MOCK_SUBJECTS);
  const [selectedSubjectPreview, setSelectedSubjectPreview] = useState<any>(null);
  const [subjectFilterTab, setSubjectFilterTab] = useState<'ALL' | 'JUNIOR' | 'SENIOR' | 'SCIENCE' | 'ART'>('ALL');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [settingsTab, setSettingsTab] = useState<'general' | 'academic' | 'notify' | 'access' | 'fees' | 'portal'>('general');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const triggerSave = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Admin Profile state
  const [profileTab, setProfileTab] = useState<'info' | 'security' | 'permissions' | 'activity'>('info');
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
  }>({
    name: 'Dr. T. Montessori',
    title: 'School Principal & Chief Administrator',
    id: 'TMS/ADM/2018/001',
    email: 'admin@tarepet.edu.ng',
    phone: '+234 803 123 4567',
    address: '12 Kpansia-Epje Road, Yenagoa, Bayelsa State',
    dob: '1978-08-15',
    gender: 'Male',
    department: 'Executive Governance & Academics',
    dateJoined: '2018-09-01',
    profileImage: '',
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState(adminProfileData);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

  // Class Marksheet / Score Entry State
  const [resultsViewTab, setResultsViewTab] = useState<'roster' | 'marksheet' | 'fees'>('roster');
  const [marksheetSubject, setMarksheetSubject] = useState('Mathematics');
  const [classScoresMap, setClassScoresMap] = useState<Record<number, { ca1: number; ca2: number; exam: number }>>(() => {
    const saved = localStorage.getItem('tarepet_class_marksheet');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });
  const [marksheetSaveAlert, setMarksheetSaveAlert] = useState(false);

  // Fee Ledger & Payment State
  const [feeLedgerState, setFeeLedgerState] = useState<any[]>(() => {
    const saved = localStorage.getItem('tarepet_fee_ledger');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentId: 1, amount: 0, method: 'Bank Transfer', reference: '' });
  const [receiptModalData, setReceiptModalData] = useState<any>(null);

  // Announcements & Broadcast Center State
  const [announcementsListState, setAnnouncementsListState] = useState<any[]>(() => {
    const saved = localStorage.getItem('tarepet_announcements');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', target: 'ALL', priority: 'NORMAL', category: 'Academic', content: '', sendSMS: true });
  const [announcementSuccessAlert, setAnnouncementSuccessAlert] = useState(false);

  // Finance & Bursary State
  const [financeTab, setFinanceTab] = useState<'overview' | 'income' | 'expenses' | 'budget'>('overview');
  const [financeExpenses, setFinanceExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem('tarepet_fin_expenses');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return [];
  });
  const [financeIncome, setFinanceIncome] = useState<any[]>(() => {
    const saved = localStorage.getItem('tarepet_fin_income');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return [];
  });
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'Salaries', amount: '', status: 'PAID' });
  const [incomeForm, setIncomeForm] = useState({ description: '', category: 'School Fees', amount: '', status: 'RECEIVED' });
  const [financeSaveAlert, setFinanceSaveAlert] = useState('');

  // Teacher management state
  const [teachersList, setTeachersList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_teachers_list');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return MOCK_TEACHERS;
  });

  // Sync teachers & users from live Django REST API backend
  React.useEffect(() => {
    const fetchBackendUsers = async () => {
      try {
        const res = await authClient.get('/auth/users/');
        const users = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
        if (users.length > 0) {
          const liveTeachers = users
            .filter((u: any) => u.role === 'TEACHER')
            .map((u: any) => ({
              id: u.id,
              staffId: u.profile?.teacher_id || u.teacher_id || `TMS/TCH/${String(u.id).padStart(4, '0')}`,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
              email: u.email,
              phone: u.phone || '+234 800 000 0000',
              gender: 'Male',
              department: u.profile?.department || 'Mathematics & STEM',
              specialization: u.profile?.subjects_taught || 'General Education',
              qualification: u.profile?.qualifications || 'B.Sc. Education',
              status: u.is_active ? 'Active' : 'Inactive',
              joined: u.date_joined ? u.date_joined.split('T')[0] : '2026-01-01',
              formTeacherOf: 'None',
              subjectsAssigned: [],
              classesCount: 1,
              studentsCount: 30,
              address: 'Tarepet School Campus',
              dob: '1990-01-01',
              cbtExamsCount: 0,
              attendanceRate: '100%',
              profileImage: '',
            }));

          const liveStudents = users
            .filter((u: any) => u.role === 'STUDENT')
            .map((u: any) => ({
              id: u.id,
              studentId: u.profile?.student_id || u.student_id || `TP-STU-${String(u.id).padStart(3, '0')}`,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
              email: u.email,
              phone: u.phone || '+234 800 000 0000',
              gender: 'Male',
              grade: u.profile?.grade_level || 'JSS1',
              stream: 'General',
              status: u.is_active ? 'Active' : 'Inactive',
              joined: u.date_joined ? u.date_joined.split('T')[0] : '2026-01-01',
            }));

          if (liveTeachers.length > 0) {
            setTeachersList(prev => {
              const combined = [...liveTeachers];
              prev.forEach(t => {
                if (!combined.some(c => c.email?.toLowerCase() === t.email?.toLowerCase())) {
                  combined.push(t);
                }
              });
              try { localStorage.setItem('tarepet_teachers_list', JSON.stringify(combined)); } catch (e) {}
              return combined;
            });
          }

          if (liveStudents.length > 0) {
            setStudentsList(prev => {
              const combined = [...liveStudents];
              prev.forEach(s => {
                if (!combined.some(c => c.email?.toLowerCase() === s.email?.toLowerCase())) {
                  combined.push(s);
                }
              });
              try { localStorage.setItem('tarepet_students_list', JSON.stringify(combined)); } catch (e) {}
              return combined;
            });
          }
        }
      } catch (e) {
        // Backend offline or user not admin — fallback to local storage
      }
    };
    fetchBackendUsers();
  }, []);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showTeacherIDCardModal, setShowTeacherIDCardModal] = useState<any>(null);
  const [showTeacherActionsDropdown, setShowTeacherActionsDropdown] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editTeacherForm, setEditTeacherForm] = useState<any>(null);

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



  // Real-Time Calendar Events State (Cleared)
  const [calendarEventsState, setCalendarEventsState] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tarepet_calendar_events');
      if (saved) { try { return JSON.parse(saved); } catch (e) {} }
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
    const saved = localStorage.getItem('tarepet_attendance');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
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
      setExamRepoFilter('all');
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
    const q = userSearch.toLowerCase();
    const matchClass  = !selectedClass  || s.grade  === selectedClass;
    const matchStream = !selectedStream || s.stream === selectedStream;
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
    return matchClass && matchStream && matchSearch;
  });

  const STUDENT_CLASSES = [
    { label: 'JSS 1', key: 'JSS1', hasStreams: false, color: 'border-blue-500/30 bg-blue-500/5', iconBg: 'bg-blue-500/10 text-blue-600', accent: 'text-blue-600',
      totalCount: studentsList.filter(s => s.grade === 'JSS1').length },
    { label: 'JSS 2', key: 'JSS2', hasStreams: false, color: 'border-indigo-500/30 bg-indigo-500/5', iconBg: 'bg-indigo-500/10 text-indigo-600', accent: 'text-indigo-600',
      totalCount: studentsList.filter(s => s.grade === 'JSS2').length },
    { label: 'JSS 3', key: 'JSS3', hasStreams: false, color: 'border-teal-500/30 bg-teal-500/5', iconBg: 'bg-teal-500/10 text-teal-600', accent: 'text-teal-600',
      totalCount: studentsList.filter(s => s.grade === 'JSS3').length },
    { label: 'SS 1', key: 'SS1', hasStreams: true, color: 'border-primary/30 bg-primary/5', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      sciCount: studentsList.filter(s => s.grade === 'SS1' && s.stream === 'Science').length,
      artCount: studentsList.filter(s => s.grade === 'SS1' && s.stream === 'Art').length },
    { label: 'SS 2', key: 'SS2', hasStreams: true, color: 'border-secondary/30 bg-secondary/5', iconBg: 'bg-secondary/10 text-secondary', accent: 'text-secondary',
      sciCount: studentsList.filter(s => s.grade === 'SS2' && s.stream === 'Science').length,
      artCount: studentsList.filter(s => s.grade === 'SS2' && s.stream === 'Art').length },
    { label: 'SS 3', key: 'SS3', hasStreams: true, color: 'border-amber-500/30 bg-amber-500/5', iconBg: 'bg-amber-500/10 text-amber-600', accent: 'text-amber-600',
      sciCount: studentsList.filter(s => s.grade === 'SS3' && s.stream === 'Science').length,
      artCount: studentsList.filter(s => s.grade === 'SS3' && s.stream === 'Art').length },
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
          const entry = classScoresMap[st.id];
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
        { label: 'Create Announcement', icon: Megaphone, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => setActiveSection('announcements') },
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
                <h3 className="text-3xl font-bold text-foreground">{STUDENT_CLASSES.length}</h3>
                <p className="text-[11px] text-muted-foreground font-medium">Academic Levels</p>
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
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(val: any) => [`${val}%`, 'Attendance']}
                    />
                    <Line type="monotone" dataKey="attendance" stroke="#0F8A3D" strokeWidth={3} dot={{ r: 5, fill: '#0F8A3D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
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


      // ── LEVEL S1: Student class picker (JSS1 - SS3) ─────────
      if ((!userSubPage || userSubPage === 'STUDENT') && !selectedClass && !selectedUser) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground font-semibold">{t('students.selectClass')}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{t('students.juniorSenior')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('students.selectInstruction')}</p>
              </div>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setNewStudentForm({
                    name: '', dob: '', gender: 'Male', grade: 'JSS1', stream: 'General', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Yenagoa', address: '', phone: '', parentName: '', parentPhone: '', profileImage: ''
                  });
                  setShowAddStudentModal(true);
                }}
                className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-4 h-4" /> {t('students.addStudent')}
              </button>
            </div>

            {/* Summary bar */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-6 items-center">
              <div className="text-center">
                <p className="text-2xl font-serif font-bold text-foreground">{studentsList.length}</p>
                <p className="text-[10px] text-muted-foreground">{t('students.totalStudents')}</p>
              </div>
              {STUDENT_CLASSES.map(c => {
                const count = c.hasStreams ? (c.sciCount! + c.artCount!) : c.totalCount!;
                return (
                  <div key={c.key} className="text-center">
                    <p className={`text-xl font-serif font-bold ${c.accent}`}>{count}</p>
                    <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Class Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {STUDENT_CLASSES.map(cls => {
                const totalStudents = cls.hasStreams ? (cls.sciCount! + cls.artCount!) : cls.totalCount!;
                return (
                  <div key={cls.key} className="relative">
                    {/* Card */}
                    <button
                      onClick={() => {
                        if (!cls.hasStreams) {
                          setSelectedClass(cls.key);
                          setSelectedStream(null);
                          setOpenClassDropdown(null);
                        } else {
                          setOpenClassDropdown(prev => prev === cls.key ? null : cls.key);
                        }
                      }}
                      className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${cls.color} ${openClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                          {totalStudents} {t('students.title')}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                      {cls.hasStreams ? (
                        <div className="flex gap-4 text-xs mt-2">
                          <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{cls.sciCount}</strong></span>
                          <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{cls.artCount}</strong></span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{t('students.generalCurriculum')}</p>
                      )}
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                        <span>{cls.hasStreams ? t('students.chooseStream') : t('students.viewProfile')}</span>
                        {cls.hasStreams ? (
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Stream Dropdown for SS classes */}
                    {cls.hasStreams && openClassDropdown === cls.key && (
                      <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                        <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
                        <button
                          onClick={() => { setSelectedClass(cls.key); setSelectedStream('Science'); setOpenClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FlaskConical className="w-4 h-4" />
                          </span>
                          {t('addSubject.science')}
                          <span className="ml-auto text-xs text-muted-foreground">{cls.sciCount} {t('students.title').toLowerCase()}</span>
                        </button>
                        <button
                          onClick={() => { setSelectedClass(cls.key); setSelectedStream('Art'); setOpenClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <Palette className="w-4 h-4" />
                          </span>
                          {t('addSubject.art')}
                          <span className="ml-auto text-xs text-muted-foreground">{cls.artCount} {t('students.title').toLowerCase()}</span>
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

      // ── LEVEL S2: Class student roster view ─────────────────
      if (userSubPage === 'STUDENT' && selectedClass && (!STUDENT_CLASSES.find(c => c.key === selectedClass)?.hasStreams || selectedStream) && !selectedUser) {
        const cls = STUDENT_CLASSES.find(c => c.key === selectedClass)!;
        return (
          <div className="space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setSelectedClass(null); setSelectedStream(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('students.selectClass')}
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{cls.label} {selectedStream ? `(${selectedStream})` : ''}</span>
            </div>

            {/* Header + toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{cls.label} {selectedStream ? `— ${selectedStream}` : 'Student Roster'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredSSStudents.length} students found</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setNewStudentForm({
                      name: '', dob: '', gender: 'Male', grade: cls.key, stream: selectedStream || 'General', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Yenagoa', address: '', phone: '', parentName: '', parentPhone: '', profileImage: ''
                    });
                    setShowAddStudentModal(true);
                  }}
                  className="px-3.5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> {t('students.addStudent')}
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
                </div>
              </div>
            </div>

            {/* Student table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t('students.fullNameCol')}</th>
                    <th className="py-3 px-4">{t('students.admissionNoCol')}</th>
                    <th className="py-3 px-4">{t('students.classStreamCol')}</th>
                    <th className="py-3 px-4">{t('students.houseCol')}</th>
                    <th className="py-3 px-4">{t('students.statusCol')}</th>
                    <th className="py-3 px-4 text-right">{t('students.actionCol')}</th>
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
                            {s.profileImage ? (
                              <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                            ) : s.name[0]}
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
                          {t('students.viewProfile')} <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{t('students.noStudents')}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // ── LEVEL 3: Individual Student Profile Page ──────────────────────
      if (selectedUser) {
        const u = selectedUser;

        return (
          <div className="space-y-6">
            {/* Breadcrumb back */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium">
                <ChevronLeft className="w-4 h-4" /> {t('students.backToClasses')}
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{t('studentProfile.breadcrumb')}{u.name}</span>
            </div>

            {/* Profile Specification Card (Exact Match to User Reference Image) */}
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
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                  >
                    {t('studentProfile.actions')}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showActionsDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 py-1.5 text-xs divide-y divide-border">
                      <div className="py-1">
                        <button onClick={() => { setIdCardUser(u); setShowActionsDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-muted/50 flex items-center gap-2 font-medium">
                          <FaIdCard className="w-3.5 h-3.5 text-primary" /> {t('studentProfile.generateIdCard')}
                        </button>
                        <button onClick={() => {
                          setNewStudentForm({
                            name: u.name || '',
                            dob: u.dob || '',
                            gender: u.gender || 'Male',
                            grade: u.grade || 'JSS1',
                            stream: u.stream || 'General',
                            country: u.country || 'Nigeria',
                            stateOfOrigin: u.stateOfOrigin || 'Bayelsa',
                            lga: u.lga || 'Yenagoa',
                            address: u.address || '',
                            phone: u.phone || '',
                            parentName: u.parentName || '',
                            parentPhone: u.parentPhone || '',
                            profileImage: u.profileImage || '',
                          });
                          setWizardStep(1);
                          setShowAddStudentModal(true);
                          setShowActionsDropdown(false);
                        }} className="w-full text-left px-4 py-2 hover:bg-muted/50 flex items-center gap-2 font-medium">
                          <FaPen className="w-3.5 h-3.5 text-muted-foreground" /> {t('studentProfile.editProfile')}
                        </button>
                      </div>
                      <div className="py-1">
                        <button onClick={() => {
                          if (confirm(`Are you sure you want to delete student "${u.name}"?`)) {
                            setStudentsList(prev => prev.filter(s => s.id !== u.id));
                            setSelectedUser(null);
                          }
                          setShowActionsDropdown(false);
                        }} className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 font-medium">
                          <FaTrash className="w-3.5 h-3.5 text-rose-500" /> {t('studentProfile.deleteStudent')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3-Column Specification Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
                {/* Column 1: Student Photo */}
                <div className="md:col-span-3 flex flex-col items-center">
                  <div className="w-44 h-52 rounded-xl border-2 border-border shadow-md overflow-hidden bg-muted/20 flex items-center justify-center">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-4xl font-serif font-bold text-primary">
                        {u.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                    {t('common.status')} {u.status || 'Active'}
                  </span>
                </div>

                {/* Column 2: Personal Identifiers */}
                <div className="md:col-span-4 space-y-3.5 text-xs leading-relaxed">
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.studentIdLabel')}</span>
                    <strong className="text-foreground font-mono font-bold text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded border border-primary/20">
                      {u.admissionNo || generateAdmissionNumber(u.grade || 'JSS1', u.stream)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.nameLabel')}</span>
                    <strong className="text-foreground font-bold text-sm uppercase">{u.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.genderLabel')}</span>
                    <strong className="text-foreground font-bold">{u.gender || 'Male'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.maritalStatus')}</span>
                    <strong className="text-foreground font-bold">{t('studentProfile.single')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.dobLabel')}</span>
                    <strong className="text-foreground font-bold">{u.dob || '2004-10-22'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.phoneLabel')}</span>
                    <strong className="text-foreground font-bold">{u.phone || 'Not Available'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.countryLabel')}</span>
                    <strong className="text-foreground font-bold">{u.country || 'Nigeria'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.stateLabel')}</span>
                    <strong className="text-foreground font-bold">{u.stateOfOrigin || 'Bayelsa'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.lgaLabel')}</span>
                    <strong className="text-foreground font-bold">{u.lga || 'Yenagoa'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.emailLabel')}</span>
                    <strong className="text-foreground font-bold underline">{u.email}</strong>
                  </div>
                </div>

                {/* Column 3: Academic & Guardian Information */}
                <div className="md:col-span-5 space-y-3.5 text-xs leading-relaxed border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.addressLabel')}</span>
                    <strong className="text-foreground font-bold">{u.address || 'Azikoro village, Yenagoa, Bayelsa State'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.classLabel')}</span>
                    <strong className="text-foreground font-bold">
                      {u.grade ? `${u.grade} ${u.stream ? `(${u.stream} Stream)` : ''}` : 'JSS 1'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.programmeLabel')}</span>
                    <strong className="text-foreground font-bold">
                      {u.grade && u.grade.startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Basic Education Certificate (BECE)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.parentNameLabel')}</span>
                    <strong className="text-foreground font-bold">{u.parentName || 'Ayaebi Dimaro'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.statusLabel')}</span>
                    <strong className="text-emerald-600 font-bold">{t('studentProfile.active')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.studyModeLabel')}</span>
                    <strong className="text-foreground font-bold">{t('studentProfile.fullTime')}</strong>
                  </div>
                </div>
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
                <ChevronLeft className="w-4 h-4" /> {t('common.back')}
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
                    <th className="py-3 px-4">{t('userList.fullName')}</th>
                    <th className="py-3 px-4">{t('userList.email')}</th>
                    <th className="py-3 px-4">{t('userList.dateJoined')}</th>
                    <th className="py-3 px-4">{t('userList.status')}</th>
                    <th className="py-3 px-4 text-right text-[10px]">{t('userList.clickToView')}</th>
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
                          {t('userList.viewProfile')} <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{t('userList.noUser')}{activeType.label.toLowerCase()} found.</p>
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

      // STEP 1: CLASS SELECTION CARDS (SS1, SS2, SS3)
      if (!selectedExamClass || !selectedExamStream) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{t('exams.manageExams')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('exams.selectCardDesc')}</p>
              </div>

              {/* Status Repository Filter Badges */}
              <div className="flex gap-2 flex-wrap text-xs font-bold">
                <button
                  onClick={() => { setExamRepoFilter('all'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted/40'}`}
                >
                  {t('exams.allFilter')}{counts.total})
                </button>
                <button
                  onClick={() => { setExamRepoFilter('pending'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'pending' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20'}`}
                >
                  ⏳ Pending ({counts.pending})
                </button>
                <button
                  onClick={() => { setExamRepoFilter('approved'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20'}`}
                >
                  ✅ Approved ({counts.approved})
                </button>
                <button
                  onClick={() => { setExamRepoFilter('rejected'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'rejected' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-500/10 text-rose-700 border-rose-200 hover:bg-rose-500/20'}`}
                >
                  ❌ Rejected ({counts.rejected})
                </button>
              </div>
            </div>

            {/* Direct Status Repository View (When a filter repository is selected) */}
            {examRepoFilter !== 'all' && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
                  <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
                    {examRepoFilter === 'pending' && '⏳ Pending Approval Repository'}
                    {examRepoFilter === 'approved' && '✅ Approved Exams & Tests Repository'}
                    {examRepoFilter === 'rejected' && '❌ Rejected Exams & Tests Repository'}
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

            {/* 3 Class Cards: SS1, SS2, SS3 */}
            {examRepoFilter === 'all' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {STUDENT_CLASSES.map(cls => {
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
                              {totalCount} Tests / Exams
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                          {cls.hasStreams ? (
                            <div className="flex gap-4 text-xs mt-2">
                              <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{sciExams.length}</strong></span>
                              <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{artExams.length}</strong></span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2 font-medium">{t('students.generalCurriculum')}</p>
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

                        {/* Stream dropdown menu: Science or Art */}
                        {cls.hasStreams && openExamClassDropdown === cls.key && (
                          <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                            <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
                            <button
                              onClick={() => { setSelectedExamClass(cls.key); setSelectedExamStream('Science'); setOpenExamClassDropdown(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                            >
                              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FlaskConical className="w-4 h-4" />
                              </span>
                              Science Stream
                              <span className="ml-auto text-xs text-muted-foreground">{sciExams.length} available</span>
                            </button>
                            <button
                              onClick={() => { setSelectedExamClass(cls.key); setSelectedExamStream('Art'); setOpenExamClassDropdown(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                            >
                              <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                <Palette className="w-4 h-4" />
                              </span>
                              Art Stream
                              <span className="ml-auto text-xs text-muted-foreground">{artExams.length} available</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status Repositories Cards Box */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('exams.examRepos')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div onClick={() => setExamRepoFilter('pending')} className="p-4 rounded-xl border border-amber-200 bg-amber-500/5 cursor-pointer hover:border-amber-400 transition-all space-y-1">
                      <div className="flex items-center justify-between text-amber-700 font-bold text-xs">
                        <span>{t('exams.pendingApproval')}</span>
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-amber-800">{counts.pending}</p>
                      <p className="text-[10px] text-amber-600">{t('exams.pendingDesc')}</p>
                    </div>

                    <div onClick={() => setExamRepoFilter('approved')} className="p-4 rounded-xl border border-emerald-200 bg-emerald-500/5 cursor-pointer hover:border-emerald-400 transition-all space-y-1">
                      <div className="flex items-center justify-between text-emerald-700 font-bold text-xs">
                        <span>{t('exams.approvedExams')}</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-emerald-800">{counts.approved}</p>
                      <p className="text-[10px] text-emerald-600">{t('exams.approvedDesc')}</p>
                    </div>

                    <div onClick={() => setExamRepoFilter('rejected')} className="p-4 rounded-xl border border-rose-200 bg-rose-500/5 cursor-pointer hover:border-rose-400 transition-all space-y-1">
                      <div className="flex items-center justify-between text-rose-700 font-bold text-xs">
                        <span>{t('exams.rejectedExams')}</span>
                        <Ban className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-rose-800">{counts.rejected}</p>
                      <p className="text-[10px] text-rose-600">{t('exams.rejectedDesc')}</p>
                    </div>

                    <div onClick={() => setExamRepoFilter('all')} className="p-4 rounded-xl border border-border bg-muted/20 cursor-pointer hover:border-primary/40 transition-all space-y-1">
                      <div className="flex items-center justify-between text-foreground font-bold text-xs">
                        <span>{t('exams.totalAssessments')}</span>
                        <ClipboardList className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-foreground">{counts.total}</p>
                      <p className="text-[10px] text-muted-foreground">{t('exams.allTests')}</p>
                    </div>
                  </div>
                </div>
              </>
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
      const filteredSubjects = subjectsListState.filter(s => {
        const q = userSearch.toLowerCase();
        const matchClass = !selectedSubjectClass || s.grade === selectedSubjectClass;
        const matchStream = !selectedSubjectStream || !cls?.hasStreams || s.stream === selectedSubjectStream;
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
              {STUDENT_CLASSES.map(cls => {
                const sciCount = subjectsListState.filter(s => s.grade === cls.key && s.stream === 'Science').length;
                const artCount = subjectsListState.filter(s => s.grade === cls.key && s.stream === 'Art').length;
                const genCount = subjectsListState.filter(s => s.grade === cls.key).length;
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
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg font-mono">{sub.code}</span>
                  <h2 className="text-xl font-serif font-bold text-foreground mt-2">{sub.title}</h2>
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
                  <p className="text-muted-foreground">{t('subjects.instructor')}<strong className="text-foreground">{sub.teacher}</strong></p>
                  <p className="text-muted-foreground"><strong className="text-foreground">{sub.enrolled}</strong> Enrolled</p>
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
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">School Administration Settings</h2>
                <p className="text-xs text-muted-foreground">Manage school profile, academic calendar, grading policies, access control, fees, and portal appearance.</p>
              </div>
            </div>
            {settingsSaved && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border gap-1 overflow-x-auto pb-px text-xs font-bold">
            {[
              { id: 'general',   label: 'School Profile',    icon: Building2 },
              { id: 'academic',  label: 'Academic & Grading', icon: GraduationCap },
              { id: 'notify',    label: 'Notifications',      icon: Bell },
              { id: 'access',    label: 'Staff & Access',     icon: Users },
              { id: 'fees',      label: 'Fees & Finance',     icon: CreditCard },
              { id: 'portal',    label: 'Portal Appearance',  icon: Palette },
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
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: School Profile ── */}
          {settingsTab === 'general' && (
            <div className="space-y-5">
              {/* School Identity */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">School Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Full Name</label>
                    <input type="text" defaultValue="Tare Pet Montessori School" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Short Name / Abbrev.</label>
                    <input type="text" defaultValue="TPMS" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Motto</label>
                    <input type="text" defaultValue="Excellence Through Observation & Character" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Official Email Address</label>
                    <input type="email" defaultValue="info@tarepet.edu.ng" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Phone Number</label>
                    <input type="tel" defaultValue="+234 803 123 4567" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Physical Address</label>
                    <input type="text" defaultValue="12 Kpansia-Epje Road, Yenagoa, Bayelsa State, Nigeria" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Registration / Ministry Number</label>
                    <input type="text" defaultValue="EDU/BY/SCH/2009/0421" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Type</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Private (Co-educational)</option>
                      <option>Private (Boys Only)</option>
                      <option>Private (Girls Only)</option>
                      <option>Government / Public</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Leadership */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">School Leadership</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Proprietress / Founder</label>
                    <input type="text" defaultValue="Mrs. Tare Pet" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Principal / Head Teacher</label>
                    <input type="text" defaultValue="Dr. T. Montessori" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Vice Principal (Academics)</label>
                    <input type="text" defaultValue="Mr. James Eze" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={triggerSave} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save School Profile
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: Academic & Grading ── */}
          {settingsTab === 'academic' && (
            <div className="space-y-5">
              {/* Active Session & Term */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Active Academic Session & Term</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Academic Session</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>2023/2024</option>
                      <option>2024/2025</option>
                      <option selected>2025/2026 (Active)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Current Term</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>1st Term (Sept – Dec)</option>
                      <option selected>2nd Term (Jan – Apr) — Active</option>
                      <option>3rd Term (May – Jul)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Minimum Pass Mark (%)</label>
                    <input type="number" defaultValue="50" min="0" max="100" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Term Start Date</label>
                    <input type="date" defaultValue="2026-01-12" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Term End Date</label>
                    <input type="date" defaultValue="2026-04-04" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">School Days Per Week</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>5 Days (Mon – Fri)</option>
                      <option>6 Days (Mon – Sat)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Assessment Score Breakdown</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">CA 1 Weight (%)</label>
                    <input type="number" defaultValue="15" min="0" max="100" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">CA 2 Weight (%)</label>
                    <input type="number" defaultValue="15" min="0" max="100" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Examination Weight (%)</label>
                    <input type="number" defaultValue="70" min="0" max="100" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              {/* Grading Scale */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Grading Scale</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {[
                    { grade: 'A — Distinction',  range: '75% – 100%', color: 'emerald' },
                    { grade: 'B — Very Good',     range: '65% – 74%',  color: 'blue' },
                    { grade: 'C — Credit',        range: '55% – 64%',  color: 'violet' },
                    { grade: 'D — Pass',          range: '50% – 54%',  color: 'amber' },
                    { grade: 'E — Below Pass',    range: '40% – 49%',  color: 'orange' },
                    { grade: 'F — Fail',          range: '0% – 39%',   color: 'rose' },
                  ].map(g => (
                    <div key={g.grade} className={`p-3 rounded-xl border bg-${g.color}-500/5 border-${g.color}-200`}>
                      <p className={`font-bold text-${g.color}-700 text-[11px]`}>{g.grade}</p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{g.range}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Contact the principal to request a grading scale adjustment.</p>
              </div>

              <div className="flex justify-end">
                <button onClick={triggerSave} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Academic Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 3: Notifications ── */}
          {settingsTab === 'notify' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Bell className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Parent & Student Notification Settings</h3>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Send result notifications to parents via SMS', desc: 'Parents receive an SMS when terminal results are published.', enabled: true },
                    { label: 'Send attendance alerts to parents', desc: 'Parents are notified when their ward is marked absent.', enabled: true },
                    { label: 'Fee payment reminder notifications', desc: 'Auto-remind parents of unpaid term fees 7 days before due date.', enabled: true },
                    { label: 'School event & holiday announcements', desc: 'Broadcast term events, PTA notices, and holiday calendars.', enabled: false },
                    { label: 'CBT exam schedule notifications', desc: 'Notify students of upcoming computer-based tests.', enabled: true },
                    { label: 'Staff payroll notifications', desc: 'Notify staff when monthly salary slips are available.', enabled: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10 gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{item.label}</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${item.enabled ? 'bg-emerald-500' : 'bg-muted'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.enabled ? 'left-6' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">SMS & Communication Gateway</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">SMS Provider</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Termii (Nigeria)</option>
                      <option>Bulksmsnigeria.com</option>
                      <option>Infobip</option>
                      <option>Twilio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Sender Name (SMS Label)</label>
                    <input type="text" defaultValue="TPMS-School" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Email Notification Address</label>
                    <input type="email" defaultValue="notifications@tarepet.edu.ng" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">SMS Units Balance</label>
                    <div className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 bg-emerald-500/5 text-emerald-700 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      4,820 Units Remaining
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={triggerSave} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 4: Staff & Access Control ── */}
          {settingsTab === 'access' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Staff Role & Access Management</h3>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { role: 'Principal / Administrator', desc: 'Full access to all modules, settings, finance, and reports.', users: 2, badge: 'Full Access', color: 'primary' },
                    { role: 'Vice Principal (Academics)', desc: 'Access to timetables, results, attendance, and subjects.', users: 1, badge: 'Academic Access', color: 'emerald' },
                    { role: 'Subject Teacher', desc: 'Mark attendance, input scores, manage CBT exams for assigned classes.', users: 18, badge: 'Class Access', color: 'blue' },
                    { role: 'Form Teacher', desc: 'View and manage class roster, attendance, and student remarks.', users: 9, badge: 'Class Access', color: 'blue' },
                    { role: 'Bursar / Finance Officer', desc: 'Manage fee records, payment tracking, and financial reports.', users: 1, badge: 'Finance Access', color: 'amber' },
                    { role: 'Librarian', desc: 'Manage library records, book loans, and student reading logs.', users: 1, badge: 'Library Access', color: 'violet' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10 gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-foreground">{r.role}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${r.color}/10 text-${r.color} border border-${r.color}/20`}>{r.badge}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{r.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">{r.users}</p>
                        <p className="text-[10px] text-muted-foreground">Staff</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Login & Account Security Policies</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Password Minimum Length</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>6 Characters</option>
                      <option selected>8 Characters (Recommended)</option>
                      <option>12 Characters</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Failed Login Lockout</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>3 Attempts</option>
                      <option selected>5 Attempts</option>
                      <option>10 Attempts</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Session Timeout (Inactivity)</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>15 Minutes</option>
                      <option selected>30 Minutes</option>
                      <option>1 Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Require Password Reset Every</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Every Term</option>
                      <option selected>Every 6 Months</option>
                      <option>Annually</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={triggerSave} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Access Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 5: Fees & Finance ── */}
          {settingsTab === 'fees' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Term Fee Structure ({new Date().getFullYear()}/{new Date().getFullYear() + 1})</h3>
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
                    <tbody className="divide-y divide-border">
                      {[
                        { level: 'JSS 1', tuition: '₦45,000', dev: '₦8,000', total: '₦53,000' },
                        { level: 'JSS 2', tuition: '₦45,000', dev: '₦8,000', total: '₦53,000' },
                        { level: 'JSS 3', tuition: '₦47,000', dev: '₦8,000', total: '₦55,000' },
                        { level: 'SS 1',  tuition: '₦55,000', dev: '₦10,000', total: '₦65,000' },
                        { level: 'SS 2',  tuition: '₦55,000', dev: '₦10,000', total: '₦65,000' },
                        { level: 'SS 3',  tuition: '₦60,000', dev: '₦10,000', total: '₦70,000' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-muted/10">
                          <td className="py-3 px-4 font-bold text-foreground">{row.level}</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">{row.tuition}</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">{row.dev}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-primary">{row.total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-200">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Payment & Finance Settings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Accepted Payment Methods</label>
                    <div className="space-y-2">
                      {['Bank Transfer (GT Bank, UBA, First Bank)', 'Cash (at School Bursar)', 'Online Payment (Flutterwave)'].map(m => (
                        <label key={m} className="flex items-center gap-2.5 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/10">
                          <input type="checkbox" defaultChecked className="accent-primary w-3.5 h-3.5" />
                          <span className="text-foreground">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Fee Due Date (Per Term)</label>
                      <input type="date" defaultValue="2026-02-01" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Late Payment Penalty</label>
                      <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>No Penalty</option>
                        <option selected>₦2,000 flat fee after due date</option>
                        <option>5% of outstanding balance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Scholarship / Discount Slots</label>
                      <input type="number" defaultValue="10" min="0" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={triggerSave} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Finance Settings
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 6: Portal Appearance ── */}
          {settingsTab === 'portal' && (
            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Portal Theme & Branding</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Portal Language</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option selected>English (Nigeria)</option>
                      <option>Yoruba</option>
                      <option>Igbo</option>
                      <option>Hausa</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Default Interface Theme</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option selected>System Default (Auto)</option>
                      <option>Light Mode</option>
                      <option>Dark Mode</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Date Format</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option selected>DD/MM/YYYY (Nigerian Standard)</option>
                      <option>MM/DD/YYYY (US)</option>
                      <option>YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Currency Display</label>
                    <select className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <option selected>₦ Nigerian Naira (NGN)</option>
                      <option>$ US Dollar (USD)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-serif font-bold text-base text-foreground">Report Card Footer & Stamp</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Report Card Footer Text</label>
                    <input type="text" defaultValue="Issued by the Registrar — Tare Pet Montessori School, Yenagoa" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Principal Signature Label</label>
                    <input type="text" defaultValue="Dr. T. Montessori — School Principal" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Promotional Tagline (appears on letters and notices)</label>
                    <input type="text" defaultValue="Developing Tomorrow's Leaders Through Excellence, Values & Innovation" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={triggerSave} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Appearance Settings
                </button>
              </div>
            </div>
          )}

        </div>
      );
    }

    // 8. ADMIN PROFILE PAGE
    if (activeSection === 'profile') {
      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>

          {/* Profile Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-primary text-white font-bold text-3xl flex items-center justify-center shadow-lg border-2 border-primary/20 overflow-hidden">
                  {adminProfileData.profileImage ? (
                    <img src={adminProfileData.profileImage} alt={adminProfileData.name} className="w-full h-full object-cover" />
                  ) : (
                    adminProfileData.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card" title="Account Active" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-bold text-2xl text-foreground">{adminProfileData.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider">
                    Super Administrator
                  </span>
                </div>
                <p className="text-xs font-semibold text-primary">{adminProfileData.title}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <span className="font-mono font-bold text-foreground">ID: {adminProfileData.id}</span>
                  <span>·</span>
                  <span>{adminProfileData.department}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setEditProfileForm(adminProfileData); setShowEditProfileModal(true); }}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button
                onClick={() => { setPasswordForm({ current: '', newPass: '', confirm: '' }); setPasswordSuccess(false); setShowChangePasswordModal(true); }}
                className="px-4 py-2.5 bg-muted text-foreground border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Change Password
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Status</p>
                <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active & Verified
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Created</p>
                <p className="text-sm font-bold text-foreground mt-1">{adminProfileData.dateJoined}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">2FA Security</p>
                <p className="text-sm font-bold text-emerald-600 mt-1">Enabled (Authenticator)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissions Scope</p>
                <p className="text-sm font-bold text-primary mt-1">Full System Control</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-border gap-1 overflow-x-auto pb-px text-xs font-bold">
            {[
              { id: 'info', label: 'Personal & Official Info', icon: UserCheck },
              { id: 'security', label: 'Account Security & Login', icon: Lock },
              { id: 'permissions', label: 'Access Rights Matrix', icon: Shield },
              { id: 'activity', label: 'Activity Audit Log', icon: Activity },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    profileTab === tab.id
                      ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-t-xl'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Personal & Official Info */}
          {profileTab === 'info' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-serif font-bold text-base text-foreground">Administrator Official Record</h3>
                <span className="text-xs text-muted-foreground font-mono">Last updated: Today</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Full Name</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.name}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Administrator ID</p>
                  <p className="font-mono font-bold text-primary text-sm">{adminProfileData.id}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Official Title</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.title}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Email Address</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.email}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Phone Contact</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.phone}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Department</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.department}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Date of Birth</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.dob}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Gender</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.gender}</p>
                </div>

                <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Date Appointed</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.dateJoined}</p>
                </div>

                <div className="md:col-span-2 lg:col-span-3 space-y-1 bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">Official Address</p>
                  <p className="font-bold text-foreground text-sm">{adminProfileData.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Security & Login */}
          {profileTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <h3 className="font-serif font-bold text-base text-foreground pb-3 border-b border-border">Security & Authentication Details</h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                    <div>
                      <p className="font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                      <p className="text-muted-foreground text-[11px]">Protected via Google Authenticator app for every administrator login.</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold border border-emerald-200">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                    <div>
                      <p className="font-bold text-foreground">Password Management</p>
                      <p className="text-muted-foreground text-[11px]">Last changed: 14 days ago. Strong 12+ character complexity required.</p>
                    </div>
                    <button
                      onClick={() => { setPasswordForm({ current: '', newPass: '', confirm: '' }); setPasswordSuccess(false); setShowChangePasswordModal(true); }}
                      className="px-3 py-1.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                    <div>
                      <p className="font-bold text-foreground">Active Login Session</p>
                      <p className="text-muted-foreground text-[11px]">Current session on Windows (Chrome) · IP: 127.0.0.1</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full font-bold border border-blue-200">This Device</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Access Rights Matrix */}
          {profileTab === 'permissions' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <h3 className="font-serif font-bold text-base text-foreground pb-3 border-b border-border">Granted Administrative System Privileges</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  { module: 'Student & Roster Control', desc: 'Create, edit, suspend, and view student records across JSS1-SS3.', granted: true },
                  { module: 'Teacher & Staff Oversight', desc: 'Assign subject teachers, manage credentials, and view payroll slips.', granted: true },
                  { module: 'Timetable Management Hub', desc: 'Create, update, slot, and delete weekly period schedules for all classes.', granted: true },
                  { module: 'Results & Report Card Center', desc: 'Compute student grades, generate terminal report cards, and print seals.', granted: true },
                  { module: 'System Settings & Config', desc: 'Modify school profile, grading schemas, terms, and portal options.', granted: true },
                  { module: 'CBT Exam Builder & Oversight', desc: 'Create online question banks, set time limits, and publish live tests.', granted: true },
                ].map((p, i) => (
                  <div key={i} className="p-4 border border-border rounded-xl bg-muted/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">{p.module}</p>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 font-bold rounded-full border border-emerald-200 text-[10px]">Full Access</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Activity Audit Log */}
          {profileTab === 'activity' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <h3 className="font-serif font-bold text-base text-foreground pb-3 border-b border-border">Recent Administrator Activity Logs</h3>

              <div className="space-y-3 text-xs">
                {[
                  { action: 'Updated School Settings', target: 'Added JSS1-SS3 Timetable Management Hub', time: '10 minutes ago', ip: '127.0.0.1' },
                  { action: 'Generated Terminal Report Card', target: 'Student Admission No: TMS/JS1/4092 (Chidi Nwosu)', time: '25 minutes ago', ip: '127.0.0.1' },
                  { action: 'Modified Timetable Slot', target: 'Assigned Basic Science to Block A Room 101', time: '1 hour ago', ip: '127.0.0.1' },
                  { action: 'Admin Session Authentication', target: 'Signed into Admin Control Center', time: '2 hours ago', ip: '127.0.0.1' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-muted/10 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{log.action}</p>
                        <p className="text-muted-foreground text-[11px]">{log.target}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-muted-foreground text-[11px]">{log.time}</p>
                      <p className="text-[10px] text-muted-foreground">IP: {log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {showEditProfileModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-2xl max-w-xl w-full space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-serif font-bold text-lg text-foreground">Edit Administrator Profile</h3>
                  <button onClick={() => setShowEditProfileModal(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {profileUpdateSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold">
                    Profile updated successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editProfileForm.name}
                      onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Official Title</label>
                    <input
                      type="text"
                      value={editProfileForm.title}
                      onChange={e => setEditProfileForm({ ...editProfileForm, title: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editProfileForm.email}
                      onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Phone Contact</label>
                    <input
                      type="tel"
                      value={editProfileForm.phone}
                      onChange={e => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Official Address</label>
                    <input
                      type="text"
                      value={editProfileForm.address}
                      onChange={e => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-border">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block">Profile Photo Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-xl flex items-center justify-center overflow-hidden shrink-0">
                        {editProfileForm.profileImage ? (
                          <img src={editProfileForm.profileImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          editProfileForm.name?.[0] || 'A'
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="adminAvatarFilePicker"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditProfileForm(prev => ({ ...prev, profileImage: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <label htmlFor="adminAvatarFilePicker" className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                            <Upload className="w-3.5 h-3.5" /> Select Image File
                          </label>
                          {editProfileForm.profileImage && (
                            <button
                              type="button"
                              onClick={() => setEditProfileForm({ ...editProfileForm, profileImage: '' })}
                              className="px-3 py-2 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-50"
                            >
                              Clear Photo
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Supported formats: JPG, PNG, WEBP. Real-time preview applied.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setAdminProfileData(editProfileForm);
                      localStorage.setItem('admin_profile_data', JSON.stringify(editProfileForm));
                      setProfileUpdateSuccess(true);
                      setTimeout(() => {
                        setProfileUpdateSuccess(false);
                        setShowEditProfileModal(false);
                      }, 1200);
                    }}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                  >
                    Save Profile & Picture
                  </button>
                  <button
                    onClick={() => setShowEditProfileModal(false)}
                    className="px-5 py-3 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Password Modal */}
          {showChangePasswordModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-serif font-bold text-lg text-foreground">Change Password</h3>
                  <button onClick={() => setShowChangePasswordModal(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {passwordSuccess ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto" />
                    <p>Password updated successfully!</p>
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
                        placeholder="••••••••"
                        value={passwordForm.newPass}
                        onChange={e => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          if (passwordForm.newPass && passwordForm.newPass === passwordForm.confirm) {
                            setPasswordSuccess(true);
                            setTimeout(() => setShowChangePasswordModal(false), 1500);
                          } else {
                            alert('Passwords do not match or are empty!');
                          }
                        }}
                        className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => setShowChangePasswordModal(false)}
                        className="px-5 py-3 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all"
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
        const tchr = selectedTeacher;
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
              <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-lg text-foreground">Teacher Profile & Academic Records</h3>
                </div>
                {/* Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTeacherActionsDropdown(prev => !prev)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <MoreVertical className="w-3.5 h-3.5" /> Actions
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
                          onClick={() => { window.location.href = `mailto:${tchr.email}`; setShowTeacherActionsDropdown(false); }}
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
                            setTeachersList(prev => prev.map(t => t.id === tchr.id ? { ...t, status: newStatus } : t));
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
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete ${tchr.name}'s profile? This action cannot be undone.`)) {
                              setTeachersList(prev => prev.filter(t => t.id !== tchr.id));
                              setSelectedTeacher(null);
                              setShowTeacherActionsDropdown(false);
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
                  <div className="w-44 h-52 rounded-2xl border-2 border-emerald-500/30 shadow-md overflow-hidden bg-muted/20 flex items-center justify-center">
                    {tchr.profileImage ? (
                      <img src={tchr.profileImage} alt={tchr.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center text-4xl font-serif font-bold text-emerald-700">
                        {tchr.name[0]}
                      </div>
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
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Department</span>
                    <strong className="text-foreground font-bold text-emerald-700">{tchr.department || 'Mathematics & STEM'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Academic Specialization</span>
                    <strong className="text-foreground font-bold">{tchr.specialization || 'Pure Mathematics'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Qualifications & Degrees</span>
                    <strong className="text-foreground font-bold">{tchr.qualification || 'B.Sc. Ed, M.Sc'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Form Teacher Assignment</span>
                    <strong className="text-primary font-bold">{tchr.formTeacherOf || 'None'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Date Joined Faculty</span>
                    <strong className="text-foreground font-bold">{tchr.joined || '2021-09-10'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Contact Phone</span>
                    <strong className="text-foreground font-bold">{tchr.phone || '+234 800 000 0000'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wider">Official Email</span>
                    <strong className="text-foreground font-bold underline">{tchr.email}</strong>
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
                            <div>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-mono mr-2">
                                {sub.code}
                              </span>
                              <span className="font-bold text-foreground">{sub.name}</span>
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

                  {/* Performance & Portal Activity */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-600" /> Teaching Stats & CBT Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Students Taught</p>
                        <p className="text-xl font-serif font-bold text-foreground mt-0.5">{tchr.studentsCount ?? 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">CBT Assessments</p>
                        <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">{tchr.cbtExamsCount ?? 0} Created</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Class Attendance Rate</p>
                        <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">{tchr.attendanceRate || '0%'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Residential Address</p>
                        <p className="text-xs font-semibold text-foreground truncate mt-1">{tchr.address || 'Not Provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Nigerian secondary school filter helpers
      const teachesJSS = (t: any) => t.subjectsAssigned?.some((s: any) => s.grade?.startsWith('JSS'));
      const teachesSS  = (t: any) => t.subjectsAssigned?.some((s: any) => s.grade?.startsWith('SS'));
      const teachesScience = (t: any) => t.subjectsAssigned?.some((s: any) => s.grade?.toLowerCase().includes('science'));
      const teachesArt = (t: any) => t.subjectsAssigned?.some((s: any) => s.grade?.toLowerCase().includes('art'));
      const isFormTeacher = (t: any) => t.formTeacherOf && t.formTeacherOf !== 'None' && t.formTeacherOf !== '';

      const filteredTeachers = teachersList.filter(t => {
        const q = teacherSearch.toLowerCase();
        const matchSearch = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.staffId.toLowerCase().includes(q) || (t.specialization && t.specialization.toLowerCase().includes(q)) || (t.formTeacherOf && t.formTeacherOf.toLowerCase().includes(q));
        let matchFilter = true;
        if (selectedDepartment === 'JUNIOR') matchFilter = teachesJSS(t);
        else if (selectedDepartment === 'SENIOR') matchFilter = teachesSS(t);
        else if (selectedDepartment === 'FORM') matchFilter = isFormTeacher(t);
        else if (selectedDepartment === 'SCIENCE') matchFilter = teachesScience(t);
        else if (selectedDepartment === 'ART') matchFilter = teachesArt(t);
        // 'ALL' → matchFilter stays true
        return matchSearch && matchFilter;
      });

      const TEACHER_FILTERS: { key: string; label: string; icon: React.ElementType }[] = [
        { key: 'ALL',     label: 'All Staff',       icon: Users },
        { key: 'JUNIOR',  label: 'Junior Teachers',  icon: BookOpen },
        { key: 'SENIOR',  label: 'Senior Teachers',  icon: GraduationCap },
        { key: 'FORM',    label: 'Form Teachers',    icon: ClipboardList },
        { key: 'SCIENCE', label: 'Science Stream',   icon: FlaskConical },
        { key: 'ART',     label: 'Art Stream',       icon: Palette },
      ];

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">Teaching Staff & Faculty Directory</h2>
                <p className="text-xs text-muted-foreground">Overview of all Montessori educators, subject workloads, and faculty profiles.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add New Teacher
            </button>
          </div>

          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Faculty</p>
                <h3 className="text-2xl font-serif font-bold text-foreground mt-1">{teachersList.length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active educators</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Duty</p>
                <h3 className="text-2xl font-serif font-bold text-emerald-600 mt-1">{teachersList.filter(t => t.status === 'Active').length}</h3>
                <p className="text-[11px] text-emerald-600 mt-0.5">100% Present today</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Form Teachers</p>
                <h3 className="text-2xl font-serif font-bold text-primary mt-1">{teachersList.filter(t => t.formTeacherOf && t.formTeacherOf !== 'None').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Class educators</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Senior Teachers</p>
                <h3 className="text-2xl font-serif font-bold text-secondary mt-1">{teachersList.filter(t => t.subjectsAssigned?.some((s: any) => s.grade?.startsWith('SS'))).length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Teaching SS classes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                placeholder="Search teacher by name, staff ID, subject, email..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {TEACHER_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedDepartment(f.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedDepartment === f.key
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >{(() => { const Icon = f.icon; return <Icon className="w-3.5 h-3.5" />; })()} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clickable Teachers Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Teacher / Staff ID</th>
                  <th className="py-3.5 px-4">Department & Specialization</th>
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
                      className="hover:bg-emerald-500/5 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl font-bold text-sm bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            {tchr.profileImage ? (
                              <img src={tchr.profileImage} alt={tchr.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              tchr.name[0]
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-emerald-600 transition-colors text-sm">{tchr.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{tchr.staffId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-foreground">{tchr.department}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{tchr.specialization}</p>
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
                          tchr.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-amber-500/10 text-amber-600 border-amber-200'
                        }`}>
                          {tchr.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                      <p className="text-sm font-semibold">No teachers found matching search parameters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showAddTeacherModal && (
            <AddTeacherWizardModal
              onClose={() => setShowAddTeacherModal(false)}
              onSave={(created) => {
                setTeachersList(prev => {
                  const updated = [created, ...prev];
                  try { localStorage.setItem('tarepet_teachers_list', JSON.stringify(updated)); } catch (e) {}
                  return updated;
                });
                setShowAddTeacherModal(false);
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
        capacity: 45,
        room: 'Unassigned',
      };
      const activeClassData = (MOCK_CLASSES && MOCK_CLASSES.length > 0)
        ? (MOCK_CLASSES.find(c => c.code === selectedTimetableClassKey || c.id === selectedTimetableClassKey) || MOCK_CLASSES[0])
        : fallbackClass;

      const activeTimetable = (timetablesState && (timetablesState[selectedTimetableClassKey] || (activeClassData.code && timetablesState[activeClassData.code]))) || {
        title: `${activeClassData.title} Timetable`,
        formTeacher: activeClassData.formTeacher,
        room: activeClassData.room,
        schedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] },
      };

      const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const handleSaveSlot = (e: React.FormEvent) => {
        e.preventDefault();
        const currentTt = timetablesState[selectedTimetableClassKey] || (activeClassData.code && timetablesState[activeClassData.code]) || { title: activeClassData.title, schedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] } };
        const updatedSchedule = { ...currentTt.schedule };
        
        const targetDay = slotForm.day;
        if (!updatedSchedule[targetDay]) updatedSchedule[targetDay] = [];

        if (editingSlotData) {
          const daySlots = [...updatedSchedule[editingSlotData.day]];
          daySlots[editingSlotData.index] = {
            subject: slotForm.subject,
            code: slotForm.code,
            teacher: slotForm.teacher,
            room: slotForm.room || activeClassData.room,
            time: slotForm.time,
          };
          updatedSchedule[editingSlotData.day] = daySlots;
        } else {
          updatedSchedule[targetDay] = [
            ...updatedSchedule[targetDay],
            {
              subject: slotForm.subject,
              code: slotForm.code,
              teacher: slotForm.teacher,
              room: slotForm.room || activeClassData.room,
              time: slotForm.time,
            }
          ];
        }

        const updatedTtState = {
          ...timetablesState,
          [selectedTimetableClassKey]: {
            ...currentTt,
            schedule: updatedSchedule
          }
        };

        saveTimetables(updatedTtState);
        setShowAddSlotModal(false);
        setEditingSlotData(null);
        setSlotForm({ day: 'Monday', time: '08:30 - 09:15', subject: '', code: '', teacher: '', room: '' });
      };

      const handleDeleteSlotConfirmed = () => {
        if (!deletingSlotData) return;
        const currentTt = timetablesState[selectedTimetableClassKey] || timetablesState[activeClassData.code];
        if (!currentTt) return;

        const updatedSchedule = { ...currentTt.schedule };
        const daySlots = [...(updatedSchedule[deletingSlotData.day] || [])];
        daySlots.splice(deletingSlotData.index, 1);
        updatedSchedule[deletingSlotData.day] = daySlots;

        const updatedTtState = {
          ...timetablesState,
          [selectedTimetableClassKey]: {
            ...currentTt,
            schedule: updatedSchedule
          }
        };

        saveTimetables(updatedTtState);
        setDeletingSlotData(null);
      };

      const handleClearTimetableConfirmed = () => {
        const currentTt = timetablesState[selectedTimetableClassKey] || timetablesState[activeClassData.code];
        if (!currentTt) return;

        const emptySchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
        const updatedTtState = {
          ...timetablesState,
          [selectedTimetableClassKey]: {
            ...currentTt,
            schedule: emptySchedule
          }
        };

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
                <h3 className="text-2xl font-serif font-bold text-amber-600 mt-1">{activeClassData.enrolled} / {activeClassData.capacity}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Capacity occupancy</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
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
                const daySlots = (activeTimetable.schedule && activeTimetable.schedule[day]) || [];
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
                          {daySlots.map((slot: any, idx: number) => (
                            <div key={idx} className="bg-muted/20 hover:bg-muted/40 transition-all border border-border/80 rounded-xl p-4 space-y-3 relative group">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                                    {slot.code || 'SUB-001'}
                                  </span>
                                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    {slot.time || TIMETABLE_PERIODS[idx]?.time || '08:30 - 09:15'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setSlotForm({
                                        day,
                                        time: slot.time || TIMETABLE_PERIODS[idx]?.time || '08:30 - 09:15',
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
                          ))}
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
                          {MOCK_STUDENTS.filter(s => s.grade === selectedClassRosterModal.code || s.grade === selectedClassRosterModal.id.split('-')[0]).map(std => (
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
      const filteredSubjects = subjectsListState.filter(sub => {
        const q = subjectSearch.toLowerCase();
        const matchSearch = !q || sub.title.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q) || sub.grade.toLowerCase().includes(q) || sub.teacher.toLowerCase().includes(q);
        
        let matchFilter = true;
        if (subjectFilterTab === 'JUNIOR') {
          matchFilter = sub.grade.startsWith('JSS');
        } else if (subjectFilterTab === 'SENIOR') {
          matchFilter = sub.grade.startsWith('SS');
        } else if (subjectFilterTab === 'SCIENCE') {
          matchFilter = sub.stream === 'Science' || sub.category === 'Science' || sub.category === 'STEM';
        } else if (subjectFilterTab === 'ART') {
          matchFilter = sub.stream === 'Art' || sub.category === 'Art' || sub.category === 'Languages';
        }

        return matchSearch && matchFilter;
      });

      const SUBJECT_FILTERS: { key: 'ALL' | 'JUNIOR' | 'SENIOR' | 'SCIENCE' | 'ART'; label: string; icon: React.ElementType }[] = [
        { key: 'ALL',     label: 'All Subjects',        icon: BookOpen },
        { key: 'JUNIOR',  label: 'Junior (JSS1 - JSS3)',icon: BookMarked },
        { key: 'SENIOR',  label: 'Senior (SS1 - SS3)',  icon: GraduationCap },
        { key: 'SCIENCE', label: 'Science Stream',      icon: FlaskConical },
        { key: 'ART',     label: 'Art & Humanities',    icon: Palette },
      ];

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">School Curriculum & Subjects Directory</h2>
                <p className="text-xs text-muted-foreground">Comprehensive overview of all JSS & SS subjects, course codes, assigned educators, and student rosters.</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateSubjectModal(true)}
              className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Add New Subject
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Subjects</p>
                <h3 className="text-2xl font-serif font-bold text-foreground mt-1">{subjectsListState.length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active curriculum offerings</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Junior Subjects</p>
                <h3 className="text-2xl font-serif font-bold text-blue-600 mt-1">{subjectsListState.filter(s => s.grade.startsWith('JSS')).length}</h3>
                <p className="text-[11px] text-blue-600 mt-0.5">JSS1 — JSS3 Classes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <BookMarked className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Senior Subjects</p>
                <h3 className="text-2xl font-serif font-bold text-emerald-600 mt-1">{subjectsListState.filter(s => s.grade.startsWith('SS')).length}</h3>
                <p className="text-[11px] text-emerald-600 mt-0.5">SS1 — SS3 Classes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Science & STEM</p>
                <h3 className="text-2xl font-serif font-bold text-secondary mt-1">{subjectsListState.filter(s => s.stream === 'Science' || s.category === 'Science' || s.category === 'STEM').length}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Laboratory & Practical</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={subjectSearch}
                onChange={e => setSubjectSearch(e.target.value)}
                placeholder="Search subject by title, code (e.g. MTH-101), grade, teacher..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {SUBJECT_FILTERS.map(f => {
                const Icon = f.icon;
                const isActive = subjectFilterTab === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setSubjectFilterTab(f.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Subject Code & Title</th>
                  <th className="py-3.5 px-4">Grade Level</th>
                  <th className="py-3.5 px-4">Stream / Category</th>
                  <th className="py-3.5 px-4">Assigned Educator</th>
                  <th className="py-3.5 px-4">Students Enrolled</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map(sub => (
                    <tr
                      key={sub.id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedSubjectPreview(sub)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                            {sub.code}
                          </span>
                          <div>
                            <p className="font-bold text-foreground text-sm">{sub.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          sub.grade.startsWith('JSS') ? 'bg-blue-500/10 text-blue-600 border-blue-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          sub.stream === 'Science' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                          sub.stream === 'Art' ? 'bg-purple-500/10 text-purple-600 border-purple-200' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>
                          {sub.stream || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {sub.teacher}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {sub.studentsCount || sub.enrolled || 30} Students
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200">
                          Active Course
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                      <p className="text-xs font-medium">No subjects found matching your filter criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                        const scores = classScoresMap[std.id] || { ca1: 12, ca2: 13, exam: 50 };
                        const total = scores.ca1 + scores.ca2 + scores.exam;
                        const grade = total >= 75 ? 'A' : total >= 65 ? 'B' : total >= 55 ? 'C' : total >= 50 ? 'D' : 'F';
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
                                onChange={e => {
                                  const val = Math.min(15, Math.max(0, parseInt(e.target.value) || 0));
                                  setClassScoresMap({ ...classScoresMap, [std.id]: { ...scores, ca1: val } });
                                }}
                                className="w-16 border border-border rounded-lg text-center py-1 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={scores.ca2}
                                onChange={e => {
                                  const val = Math.min(15, Math.max(0, parseInt(e.target.value) || 0));
                                  setClassScoresMap({ ...classScoresMap, [std.id]: { ...scores, ca2: val } });
                                }}
                                className="w-16 border border-border rounded-lg text-center py-1 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                value={scores.exam}
                                onChange={e => {
                                  const val = Math.min(70, Math.max(0, parseInt(e.target.value) || 0));
                                  setClassScoresMap({ ...classScoresMap, [std.id]: { ...scores, exam: val } });
                                }}
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
                      localStorage.setItem('tarepet_class_marksheet', JSON.stringify(classScoresMap));
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
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h4 className="font-bold text-base text-foreground">Bursary & Fee Payment Ledger</h4>
                    <p className="text-xs text-muted-foreground">Track tuition payments, balances, and print receipts for {resultsSelectedClass}.</p>
                  </div>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <DollarSign className="w-4 h-4" /> Log Student Fee Payment
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Admission No & Name</th>
                        <th className="py-3 px-3 text-right">Term Fee</th>
                        <th className="py-3 px-3 text-right">Amount Paid</th>
                        <th className="py-3 px-3 text-right">Balance Due</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Receipt & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classStudents.map(std => {
                        const feeRec = feeLedgerState.find(f => f.studentId === std.id) || {
                          totalAmount: resultsSelectedClass.startsWith('JSS') ? 53000 : 65000,
                          paidAmount: 0,
                          status: 'UNPAID',
                          lastDate: '—',
                          method: '—',
                          receiptNo: '—',
                        };
                        const balance = feeRec.totalAmount - feeRec.paidAmount;

                        return (
                          <tr key={std.id} className="hover:bg-muted/10">
                            <td className="py-3.5 px-3">
                              <p className="font-mono font-bold text-primary">{std.admissionNo}</p>
                              <p className="font-bold text-foreground text-sm">{std.name}</p>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-foreground">₦{feeRec.totalAmount.toLocaleString()}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">₦{feeRec.paidAmount.toLocaleString()}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600">₦{balance.toLocaleString()}</td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                feeRec.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                feeRec.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                'bg-rose-500/10 text-rose-600 border-rose-200'
                              }`}>
                                {feeRec.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {feeRec.paidAmount > 0 ? (
                                <button
                                  onClick={() => setReceiptModalData({ ...feeRec, studentName: std.name, admissionNo: std.admissionNo, grade: std.grade })}
                                  className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl font-bold text-[11px] transition-all inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                                </button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">No Payment Yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add Payment Modal */}
                {showAddPaymentModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <h3 className="font-serif font-bold text-lg text-foreground">Log Student Fee Payment</h3>
                        <button onClick={() => setShowAddPaymentModal(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Select Student</label>
                          <select
                            value={paymentForm.studentId}
                            onChange={e => setPaymentForm({ ...paymentForm, studentId: Number(e.target.value) })}
                            className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                          >
                            {classStudents.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Amount Paid (₦)</label>
                          <input
                            type="number"
                            placeholder="e.g. 53000"
                            value={paymentForm.amount || ''}
                            onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                            className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Payment Method</label>
                          <select
                            value={paymentForm.method}
                            onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                            className="w-full border border-border rounded-xl px-4 py-2.5 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary"
                          >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash (Bursar Office)</option>
                            <option value="Online (Flutterwave)">Online (Flutterwave)</option>
                            <option value="POS Terminal">POS Terminal</option>
                          </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              const std = classStudents.find(s => s.id === paymentForm.studentId);
                              if (std && paymentForm.amount > 0) {
                                const totalAmt = resultsSelectedClass.startsWith('JSS') ? 53000 : 65000;
                                const existingIndex = feeLedgerState.findIndex(f => f.studentId === std.id);
                                const newPaid = (existingIndex >= 0 ? feeLedgerState[existingIndex].paidAmount : 0) + paymentForm.amount;
                                const newStatus = newPaid >= totalAmt ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';

                                const newRecord = {
                                  id: Date.now(),
                                  studentId: std.id,
                                  name: std.name,
                                  admissionNo: std.admissionNo,
                                  class: resultsSelectedClass,
                                  totalAmount: totalAmt,
                                  paidAmount: newPaid,
                                  status: newStatus,
                                  lastDate: new Date().toISOString().split('T')[0],
                                  method: paymentForm.method,
                                  receiptNo: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
                                };

                                let updatedLedger;
                                if (existingIndex >= 0) {
                                  updatedLedger = [...feeLedgerState];
                                  updatedLedger[existingIndex] = newRecord;
                                } else {
                                  updatedLedger = [...feeLedgerState, newRecord];
                                }
                                setFeeLedgerState(updatedLedger);
                                localStorage.setItem('tarepet_fee_ledger', JSON.stringify(updatedLedger));
                                setShowAddPaymentModal(false);
                              } else {
                                alert('Please enter a valid amount!');
                              }
                            }}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                          >
                            Record Payment & Save
                          </button>
                          <button
                            onClick={() => setShowAddPaymentModal(false)}
                            className="px-5 py-3 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-all"
                          >
                            Cancel
                          </button>
                        </div>
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
                          <p className="text-[10px] text-muted-foreground">12 Kpansia-Epje Road, Yenagoa, Bayelsa State · Tel: +234 803 123 4567</p>
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
              <p className="text-xs font-medium text-muted-foreground">12 Kpansia-Epje Road, Yenagoa, Bayelsa State, Nigeria · Tel: +234 803 123 4567</p>
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
                      <th className="py-3 px-3">Subject Code & Name</th>
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
                          <span className="font-mono text-primary mr-1.5 text-[11px]">{sub.code}</span>
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
                <p className="text-[10px] text-muted-foreground uppercase font-bold">GPA Grade</p>
                <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">3.85 / 4.0</p>
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
                                onClick={() => setAttendanceMap(prev => ({ ...prev, [std.id]: st }))}
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
    if (activeSection === 'announcements' || activeSection === 'finance') {
      const isFinance = activeSection === 'finance';
      const title = isFinance ? 'School Finance & Bursary Management' : 'Announcements & Communication Center';
      const desc = isFinance
        ? 'Comprehensive financial tracking, tuition fee billing, expense approvals, and bursary audit reports.'
        : 'Publish, broadcast, and manage official notices to all school stakeholders via SMS and portal notifications.';
      const IconComponent = isFinance ? DollarSign : Megaphone;

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Page Header */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">{title}</h2>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          </div>

          {/* Update Coming Out Soon Notice Card */}
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto space-y-6 my-8">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Sparkles className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Update Coming Out Soon
              </span>
              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-foreground pt-2">
                {isFinance ? 'Finance Module Update In Progress' : 'Announcements Module Update In Progress'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Our team is actively building enhanced tools for {isFinance ? 'automated billing, payment reconciliation, and ledger analytics' : 'instant SMS broadcasting, targeted notifications, and parent communication'}. Stay tuned!
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveSection('overview')}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md"
              >
                Back to Control Center
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (activeSection === 'finance') {
      const totalIncome = financeIncome.reduce((s: number, r: any) => s + r.amount, 0);
      const totalExpenses = financeExpenses.reduce((s: number, r: any) => s + r.amount, 0);
      const netBalance = totalIncome - totalExpenses;
      const pendingExp = financeExpenses.filter((e: any) => e.status === 'PENDING').reduce((s: number, r: any) => s + r.amount, 0);

      const EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Infrastructure', 'Academic', 'Sports', 'Transport', 'Admin', 'Other'];
      const INCOME_CATEGORIES = ['School Fees', 'Levies', 'Exam Fees', 'Donations', 'Grants', 'Other'];

      const chartData = [
        { month: 'Sep', income: 4200000, expenses: 3100000 },
        { month: 'Oct', income: 3800000, expenses: 3400000 },
        { month: 'Nov', income: 2100000, expenses: 2800000 },
        { month: 'Dec', income: 1200000, expenses: 1950000 },
        { month: 'Jan', income: totalIncome, expenses: totalExpenses },
      ];

      const fmtCurrency = (v: number) => '₦' + v.toLocaleString();

      const expCatBreakdown = EXPENSE_CATEGORIES.map(cat => ({
        cat,
        total: financeExpenses.filter((e: any) => e.category === cat).reduce((s: number, r: any) => s + r.amount, 0),
      })).filter(c => c.total > 0);

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
            <div className="flex items-center gap-2">
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
              { label: 'Total Income', value: fmtCurrency(totalIncome), sub: 'This term', color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-200', icon: <TrendingUp className="w-5 h-5" />, arrow: true },
              { label: 'Total Expenses', value: fmtCurrency(totalExpenses), sub: 'This term', color: 'text-rose-600', bg: 'bg-rose-500/5', border: 'border-rose-200', icon: <ArrowDownRight className="w-5 h-5" />, arrow: false },
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
          <div className="flex gap-1 border-b border-border">
            {(['overview', 'income', 'expenses', 'budget'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFinanceTab(tab)}
                className={`px-5 py-2.5 text-xs font-bold capitalize rounded-t-xl border-b-2 transition-colors ${
                  financeTab === tab
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {tab === 'overview' ? '📊 Overview' : tab === 'income' ? '💰 Income Records' : tab === 'expenses' ? '💸 Expense Log' : '📋 Budget Plan'}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {financeTab === 'overview' && (
            <div className="space-y-5">
              {/* Chart */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-serif font-bold text-sm text-foreground mb-4">Income vs. Expenditure — Last 5 Months</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => '₦' + (v / 1000000).toFixed(1) + 'M'} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                    <Bar dataKey="income" fill="hsl(142 76% 36%)" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(0 84% 60%)" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expense breakdown table */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-serif font-bold text-sm text-foreground mb-4">Expense Category Breakdown</h3>
                <div className="space-y-2">
                  {expCatBreakdown.map(({ cat, total }) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0">{cat}</span>
                      <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${Math.min(100, (total / totalExpenses) * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-28 text-right shrink-0">{fmtCurrency(total)}</span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{((total / totalExpenses) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-serif font-bold text-sm text-foreground mb-4">Recent Transactions</h3>
                <div className="space-y-2">
                  {[...financeIncome.slice(0, 3).map((r: any) => ({ ...r, type: 'income' })), ...financeExpenses.slice(0, 3).map((r: any) => ({ ...r, type: 'expense' }))]
                    .sort((a, b) => b.date.localeCompare(a.date))
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
              </div>
            </div>
          )}

          {/* ── INCOME TAB ── */}
          {financeTab === 'income' && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-foreground">Income Records — {new Date().getFullYear()}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">Total: {fmtCurrency(totalIncome)}</span>
              </div>
              <div className="overflow-x-auto">
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
                    {financeIncome.map((row: any) => (
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
              </div>
            </div>
          )}

          {/* ── EXPENSES TAB ── */}
          {financeTab === 'expenses' && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-foreground">Expense Log — {new Date().getFullYear()}</h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full">Total: {fmtCurrency(totalExpenses)}</span>
              </div>
              <div className="overflow-x-auto">
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
                                localStorage.setItem('tarepet_fin_expenses', JSON.stringify(updated));
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
              </div>
            </div>
          )}

          {/* ── BUDGET TAB ── */}
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
                          {over && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-200">⚠ Near Limit</span>}
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
                      const newRec = {
                        id: Date.now(),
                        date: new Date().toISOString().split('T')[0],
                        description: incomeForm.description,
                        category: incomeForm.category,
                        amount: Number(incomeForm.amount),
                        status: 'RECEIVED',
                        ref: `INC-${Date.now()}`,
                      };
                      const updated = [newRec, ...financeIncome];
                      setFinanceIncome(updated);
                      localStorage.setItem('tarepet_fin_income', JSON.stringify(updated));
                      setShowAddIncomeModal(false);
                      setFinanceSaveAlert('Income record saved successfully!');
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
                      const newRec = {
                        id: Date.now(),
                        date: new Date().toISOString().split('T')[0],
                        description: expenseForm.description,
                        category: expenseForm.category,
                        amount: Number(expenseForm.amount),
                        status: expenseForm.status,
                        ref: `EXP-${Date.now()}`,
                      };
                      const updated = [newRec, ...financeExpenses];
                      setFinanceExpenses(updated);
                      localStorage.setItem('tarepet_fin_expenses', JSON.stringify(updated));
                      setShowAddExpenseModal(false);
                      setFinanceSaveAlert('Expense record saved successfully!');
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
        </div>
      );
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
        localStorage.setItem('tarepet_calendar_events', JSON.stringify(updated));
        setShowAddCalendarModal(false);
        setCalendarForm({ title: '', category: 'Academic', date: '', endDate: '', scope: 'All Classes', detail: '', status: 'Upcoming' });
      };

      const handleDeleteCalendarEvent = (id: string) => {
        const updated = calendarEventsState.filter(ev => ev.id !== id);
        setCalendarEventsState(updated);
        localStorage.setItem('tarepet_calendar_events', JSON.stringify(updated));
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
            onSave={(updated) => {
              setTeachersList(prev => prev.map(t => t.id === updated.id ? updated : t));
              if (selectedTeacher?.id === updated.id) setSelectedTeacher(updated);
              setShowEditTeacherModal(false);
              setEditTeacherForm(null);
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
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.academicLevel')}</h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.targetClass')}</label>
                      <select value={newStudentForm.grade}
                        onChange={e => {
                          const val = e.target.value;
                          const isJSS = val.startsWith('JSS');
                          setNewStudentForm({
                            ...newStudentForm,
                            grade: val,
                            stream: isJSS ? 'General' : 'Science',
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="JSS1">{t('wizard.jss1')}</option>
                        <option value="JSS2">{t('wizard.jss2')}</option>
                        <option value="JSS3">{t('wizard.jss3')}</option>
                        <option value="SS1">{t('wizard.ss1')}</option>
                        <option value="SS2">{t('wizard.ss2')}</option>
                        <option value="SS3">{t('wizard.ss3')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.streamAssignment')}</label>
                      {newStudentForm.grade.startsWith('JSS') ? (
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground font-medium">
                          {t('wizard.jssGeneralNote')}
                        </div>
                      ) : (
                        <select value={newStudentForm.stream}
                          onChange={e => setNewStudentForm({ ...newStudentForm, stream: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="Science">{t('wizard.sciOption')}</option>
                          <option value="Art">{t('wizard.artOption')}</option>
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
                        <input type="text" placeholder="e.g. Ayaebi Dimaro" value={newStudentForm.parentName}
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
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStudentForm(prev => ({ ...prev, profileImage: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => document.getElementById('studentPhotoLocalInput')?.click()}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" /> Add Photo from File
                      </button>
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
                          {generateAdmissionNumber(newStudentForm.grade, newStudentForm.stream)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.genEmail')}</span>
                        <span className="text-xs font-bold text-foreground underline">
                          {(() => {
                            const parts = newStudentForm.name.trim().toLowerCase().split(/\s+/);
                            const fn = parts[0] || 'student';
                            const sn = parts.slice(1).join('') || 'tarepet';
                            return `${fn}.${sn}@tarepet.com`;
                          })()}
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
                    onClick={() => {
                      const generatedId = generateAdmissionNumber(newStudentForm.grade, newStudentForm.stream);
                      const parts = newStudentForm.name.trim().toLowerCase().split(/\s+/);
                      const fn = parts[0] || 'student';
                      const sn = parts.slice(1).join('') || 'tarepet';
                      const autoEmail = `${fn}.${sn}@tarepet.com`;

                      const createdStudent = {
                        id: studentsList.length + 1,
                        name: newStudentForm.name,
                        admissionNo: generatedId,
                        email: autoEmail,
                        grade: newStudentForm.grade,
                        stream: newStudentForm.stream,
                        house: 'Blue House (Eagle)',
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
                      };
                      setStudentsList([createdStudent, ...studentsList]);
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
        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
