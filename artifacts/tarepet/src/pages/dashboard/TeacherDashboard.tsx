// Tarepet Montessori Teacher Dashboard Component (Fully Internationalized)
import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  BookOpen, Users, FileText, UserCheck, Award, Calendar,
  BarChart2, Star, Clock, CheckCircle2, AlertCircle, Plus,
  Search, Filter, Upload, Download, Send, Eye, Edit2, Trash2, X,
  TrendingUp, Play, Lock, MessageSquare, ChevronDown, ChevronRight, ChevronLeft,
  CheckSquare, XCircle, RefreshCw, PenLine, Globe, Layers, ArrowUpRight,
  ClipboardList, Settings, ShieldCheck, User, Bell, Printer, CreditCard
} from 'lucide-react';

import { getStoredExams, updateExamStatus, getStoredSubmissions } from '@/lib/cbt-store';
import { useTranslation } from '@/lib/i18n';

// ─── Initial Seed Data (Form Teacher & Subject Teacher) ───────
const TEACHER_CLASSES: any[] = [];

const PENDING_SUBMISSIONS: any[] = [];
const STUDENT_ROSTER: any[] = [];

const TIMETABLE: any[] = [];

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // Active section & tab persistence on refresh
  const [activeSection, setActiveSectionState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSec = params.get('section');
      if (urlSec) return urlSec;
      const cached = localStorage.getItem('teacher_active_section');
      if (cached) return cached;
    }
    return 'overview';
  });

  const setActiveSection = (sec: string) => {
    setActiveSectionState(sec);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teacher_active_section', sec);
      const url = new URL(window.location.href);
      url.searchParams.set('section', sec);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Form Teacher designation
  const isFormTeacher = Boolean(user?.role === 'TEACHER' || user?.role === 'ADMIN');
  const formClass = (user?.profile as any)?.formTeacherOf || 'SS1';

  // Sub-tab states with persistent caching
  const [studentSubTab, setStudentSubTabState] = useState<'roster' | 'attendance'>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('teacher_student_subtab');
      if (cached === 'roster' || cached === 'attendance') return cached;
    }
    return 'roster';
  });
  const setStudentSubTab = (tab: 'roster' | 'attendance') => {
    setStudentSubTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teacher_student_subtab', tab);
    }
  };

  const [resultsSubTab, setResultsSubTabState] = useState<'queue' | 'gradebook'>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('teacher_results_subtab');
      if (cached === 'queue' || cached === 'gradebook') return cached;
    }
    return 'queue';
  });
  const setResultsSubTab = (tab: 'queue' | 'gradebook') => {
    setResultsSubTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teacher_results_subtab', tab);
    }
  };

  const [selectedExamClass, setSelectedExamClass] = useState<string>('ALL');
  const [selectedExamStream, setSelectedExamStream] = useState<string>('ALL');

  // Data states
  const [submissions, setSubmissions] = useState(PENDING_SUBMISSIONS);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [roster, setRoster] = useState(STUDENT_ROSTER);
  const [studentSearch, setStudentSearch] = useState('');
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({
    1: 'present', 2: 'present', 3: 'late', 4: 'present', 5: 'present'
  });
  
  // Modals & toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    name: '',
    email: '',
    grade: 'SS1',
    stream: 'Science',
    parentName: '',
    parentPhone: ''
  });

  // Student management modal states
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [promotingStudent, setPromotingStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);
  const [targetPromotionClass, setTargetPromotionClass] = useState<string>('SS2');
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showIDCardModal, setShowIDCardModal] = useState<any>(null);
  const [showStaffIdModal, setShowStaffIdModal] = useState<boolean>(false);

  // Settings & Profile State
  const [profileForm, setProfileForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('teacher_profile_data');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return {
      firstName: user?.first_name || 'Dr. Victoria',
      lastName: user?.last_name || 'Adeyemi',
      email: user?.email || 'v.adeyemi@tarepet.edu.ng',
      phone: '+234 803 456 7890',
      staffId: 'TMS/TCH/0042',
      roleTitle: 'Senior Subject Specialist & SS1 Form Teacher',
      department: 'Science & Mathematics Department',
      qualification: 'M.Sc. Industrial Mathematics (UI), TRCN Certified',
      experience: '8 Years Teaching Experience',
      joiningDate: 'September 2018',
      gender: 'Female',
      dob: '1989-08-24',
      specialization: 'Physics, Mathematics & STEM Education',
      address: '14 Montessori Crescent, GRA, Yenagoa, Bayelsa State',
      bio: 'Passionate Montessori secondary educator dedicated to analytical problem solving, digital CBT integration, and scientific research excellence.',
      emergencyContactName: 'Chief O. Adeyemi',
      emergencyContactPhone: '+234 802 333 4455',
      officeHours: 'Monday - Thursday: 2:00 PM - 4:00 PM',
      emailAlerts: true,
      cbtAlerts: true,
    };
  });

  const [gradebookScores, setGradebookScores] = useState<Record<number, { ca1: number; ca2: number; midterm: number; exam: number }>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleGradeSubmit = () => {
    if (!selectedSub) return;
    setSubmissions(prev => prev.filter(s => s.id !== selectedSub.id));
    setSelectedSub(null);
    setGradeInput('');
    setFeedbackInput('');
    showToast(`Graded submission for ${selectedSub.student} successfully!`);
  };

  const handleAddStudentSubmit = () => {
    if (!addStudentForm.name || !addStudentForm.email) return;
    const generatedId = `TMS/${addStudentForm.grade}/${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent = {
      id: roster.length + 1,
      name: addStudentForm.name,
      code: generatedId,
      email: addStudentForm.email,
      grade: addStudentForm.grade,
      stream: addStudentForm.stream,
      gpa: '0.00',
      attendance: '100%',
      status: 'ACTIVE',
      atRisk: false
    };
    setRoster(prev => [newStudent, ...prev]);
    setShowAddStudentModal(false);
    showToast(`Registered ${addStudentForm.name}! Student ID: ${generatedId}`);
    setAddStudentForm({ name: '', email: '', grade: 'SS1', stream: 'Science', parentName: '', parentPhone: '' });
  };

  const filteredRoster = roster.filter(s => {
    const q = studentSearch.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    
    // Form Teachers are strictly restricted to their assigned form class only
    if (formClass) {
      const fcClean = formClass.toLowerCase().replace(/\s+/g, '');
      const sGradeClean = (s.grade || '').toLowerCase().replace(/\s+/g, '');
      const matchClass = sGradeClean.includes(fcClean) || fcClean.includes(sGradeClean);
      return matchSearch && matchClass;
    }
    return matchSearch;
  });

  const renderSection = () => {
    // =========================================================
    // 1. OVERVIEW
    // =========================================================
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block mb-3">{t('teacher.management_portal', 'Teacher Management Portal')}</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1">{t('teacher.welcome_back', 'Welcome back,')} {user?.first_name ?? 'Teacher'}! 👋</h2>
          <p className="text-emerald-100 text-sm">{t('teacher.manage_subtitle', 'Manage classes, CBT assessments, and student progress.')}</p>
        </div>

        {/* CBT Exam Engine Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-1.5 inline-block">{t('teacher.cbt_assessment_system', 'CBT Assessment System')}</span>
            <h3 className="text-xl font-bold">{t('teacher.cbt_exam_builder_title', 'CBT Exam Builder & Management')}</h3>
            <p className="text-blue-100 text-xs mt-1">{t('teacher.cbt_exam_builder_desc', 'Create CBT tests/exams, submit for admin approval, upload to students & sync scores to report cards.')}</p>
          </div>
          <Link href="/dashboard/cbt-builder">
            <button className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition shadow-md whitespace-nowrap">
              {t('teacher.open_cbt_builder', 'Open CBT Builder →')}
            </button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Assigned Classes', val: '0', sub: '0 Students', icon: BookOpen, color: 'text-primary bg-primary/10 border-primary/20' },
            { label: 'Pending Grading', val: `${submissions.length}`, sub: 'Action required', icon: FileText, color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
            { label: 'At-Risk Students', val: '0', sub: 'None flagged', icon: AlertCircle, color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
            { label: 'Avg Attendance', val: '0%', sub: 'No attendance recorded', icon: UserCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
          ].map((s, i) => (
            <div key={i} className={`bg-card rounded-2xl border p-4 shadow-sm ${s.color.split(' ').slice(2).join(' ')}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
              </div>
              <p className={`text-2xl font-serif font-bold ${s.color.split(' ')[0]}`}>{s.val}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">{t('teacher.quick_portal_access', 'Quick Portal Access')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Manage Students', section: 'students', icon: Users },
              { label: 'CBT Exam Builder', href: '/dashboard/cbt-builder', icon: ClipboardList },
              { label: 'Manage Results', section: 'results', icon: FileText },
              { label: 'Portal Settings', section: 'settings', icon: Settings },
            ].map((a: any, i: number) => (
              a.href ? (
                <Link key={i} href={a.href}>
                  <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold text-foreground">
                    <span className="flex items-center gap-2"><a.icon className="w-4 h-4 text-primary" />{a.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </Link>
              ) : (
                <button key={i} onClick={() => setActiveSection(a.section)} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold text-foreground">
                  <span className="flex items-center gap-2"><a.icon className="w-4 h-4 text-primary" />{a.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )
            ))}
          </div>
        </div>

        {/* Timetable Overview */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> {t('teacher.todays_schedule', "Today's Class Schedule")}
          </h3>
          <div className="space-y-2.5">
            {TIMETABLE.length > 0 ? TIMETABLE.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t.class}</span>
                  <h4 className="font-bold text-sm text-foreground mt-1">{t.title}</h4>
                  <p className="text-xs text-muted-foreground">{t.room} • {t.days}</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">{t.time}</span>
              </div>
            )) : (
              <div className="py-6 text-center text-muted-foreground bg-muted/10 rounded-xl border border-border/50">
                <p className="text-xs font-semibold">{t('teacher.no_schedule', 'No class schedule configured for today.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 2. MANAGE STUDENTS
    // =========================================================
    if (activeSection === 'students') {
      if (selectedStudentProfile) {
        const u = selectedStudentProfile;
        return (
          <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> {t('teacher.back_to_all_classes', 'Back to All Classes')}
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{t('teacher.student_profile_prefix', 'Student Profile — ')}{u.name}</span>
            </div>

            {/* Profile Specification Card (Exact Match to User Reference Image) */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header Actions Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('teacher.official_student_profile', 'Official Student Profile & Credentials')}</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsDropdown(prev => !prev)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>{t('teacher.btn_actions', 'Actions')}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showActionsDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 py-1.5 text-xs divide-y divide-border animate-in fade-in zoom-in-95 duration-100">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowIDCardModal(u);
                            setShowActionsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center gap-2 font-semibold text-foreground transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4 text-primary" /> {t('teacher.gen_id_card', 'Generate Student ID Card')}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentProfile(null);
                            setEditingStudent({ ...u });
                            setShowActionsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center gap-2 font-semibold text-foreground transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" /> {t('teacher.edit_profile', 'Edit Student Profile')}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentProfile(null);
                            setPromotingStudent(u);
                            const nextClass = u.grade === 'JSS1' ? 'JSS2' : u.grade === 'JSS2' ? 'JSS3' : u.grade === 'JSS3' ? 'SS1' : u.grade === 'SS1' ? 'SS2' : u.grade === 'SS2' ? 'SS3' : 'Graduated';
                            setTargetPromotionClass(nextClass);
                            setShowActionsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center gap-2 font-semibold text-foreground transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-4 h-4 text-emerald-500" /> {t('teacher.promote_student', 'Promote Student')}
                        </button>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedStudentProfile(null);
                            setDeletingStudent(u);
                            setShowActionsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" /> {t('teacher.delete_record_btn', 'Delete Student Record')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3-Column Specification Layout (Exact Match to User Reference Image) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
                {/* Column 1: Student Photo & Status */}
                <div className="md:col-span-3 flex flex-col items-center">
                  <div className="w-44 h-52 rounded-2xl border-2 border-border shadow-md overflow-hidden bg-muted/20 flex items-center justify-center">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-5xl font-serif font-bold text-rose-600">
                        {u.name?.[0] ?? 'S'}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 px-3.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                    {t('teacher.status_prefix', 'STATUS:')} {u.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Column 2: Personal Identifiers */}
                <div className="md:col-span-4 space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_student_id_prefix', 'Student ID:')} </span>
                    <strong className="text-foreground font-mono font-bold text-xs bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded border border-rose-500/20">
                      {u.code}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_name_prefix', 'Name:')} </span>
                    <strong className="text-foreground font-bold text-sm uppercase">{u.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_gender_prefix', 'Gender:')} </span>
                    <strong className="text-foreground font-bold">{u.gender || 'Male'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_marital_status_prefix', 'Marital Status:')} </span>
                    <strong className="text-foreground font-bold">{t('teacher.lbl_single', 'Single')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_dob_prefix', 'Date of Birth:')} </span>
                    <strong className="text-foreground font-bold">{u.dob || '2012-05-14'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_phone_prefix', 'Phone Number:')} </span>
                    <strong className="text-foreground font-bold">{u.phone || 'Not Available'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_country_prefix', 'Country:')} </span>
                    <strong className="text-foreground font-bold">{u.country || 'Nigeria'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_state_prefix', 'State of Origin:')} </span>
                    <strong className="text-foreground font-bold">{u.stateOfOrigin || (u.name.includes('Chidi') ? 'Anambra' : 'Bayelsa')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_lga_prefix', 'L.G.A:')} </span>
                    <strong className="text-foreground font-bold">{u.lga || (u.name.includes('Chidi') ? 'Nnewi South' : 'Yenagoa')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_email_prefix', 'Email:')} </span>
                    <strong className="text-foreground font-bold underline">{u.email}</strong>
                  </div>
                </div>

                {/* Column 3: Academic & Guardian Details */}
                <div className="md:col-span-5 space-y-3 text-xs leading-relaxed border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_address_prefix', 'Address:')} </span>
                    <strong className="text-foreground font-bold">{u.address || (u.name.includes('Chidi') ? '12 Swali Road, Yenagoa' : '12 Kpansia-Epje Road, Yenagoa')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_class_prefix', 'Class:')} </span>
                    <strong className="text-foreground font-bold">
                      {u.grade} ({u.stream || 'General Stream'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_programme_prefix', 'Programme:')} </span>
                    <strong className="text-foreground font-bold">
                      {u.grade?.startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Basic Education Certificate (BECE)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_parent_name_prefix', 'Parent Name:')} </span>
                    <strong className="text-foreground font-bold">{u.parentName || 'Chief Nwosu'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_status_field_prefix', 'Status:')} </span>
                    <strong className="text-emerald-600 font-bold">{t('teacher.lbl_active', 'Active')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_study_mode_prefix', 'Study Mode:')} </span>
                    <strong className="text-foreground font-bold">{t('teacher.lbl_full_time', 'Full Time')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">{t('teacher.manage_students', 'Manage Students')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('teacher.manage_students_desc', 'Roster profiles, daily attendance, and student registration.')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddStudentModal(true)} className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
              <Plus className="w-4 h-4" /> {t('teacher.add_student', 'Add Student')}
            </button>
          </div>
        </div>

        {/* Form Teacher Assigned Class Banner */}
        {formClass && (
          <div className="bg-emerald-500/10 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                🎓
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950">Assigned Form Class: <span className="text-emerald-700 font-mono font-bold">{formClass}</span></h4>
                <p className="text-xs text-emerald-800/80">You are the designated Form Teacher for {formClass}. Student roster and daily attendance are restricted strictly to your assigned class.</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-emerald-600 text-white rounded-full shadow-xs whitespace-nowrap">
              Form Register
            </span>
          </div>
        )}

        {/* Sub-tab Switcher */}
        <div className="flex border-b border-border gap-2">
          {[
            { id: 'roster', label: t('teacher.student_roster', 'Student Roster'), icon: Users },
            { id: 'attendance', label: t('teacher.daily_attendance', 'Daily Attendance'), icon: UserCheck },
          ].map(tItem => (
            <button
              key={tItem.id}
              onClick={() => setStudentSubTab(tItem.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                studentSubTab === tItem.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tItem.icon className="w-3.5 h-3.5" /> {tItem.label}
            </button>
          ))}
        </div>

        {/* Sub-tab 1: Roster */}
        {studentSubTab === 'roster' && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by student name or code..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-xs bg-muted/20 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{filteredRoster.length} students</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">{t('teacher.col_student_name', 'Student Name')}</th>
                    <th className="p-3">{t('teacher.col_student_id', 'Student ID')}</th>
                    <th className="p-3">{t('teacher.col_class', 'Class')}</th>
                    <th className="p-3">{t('teacher.col_gpa', 'GPA')}</th>
                    <th className="p-3">{t('teacher.col_attendance', 'Attendance')}</th>
                    <th className="p-3">{t('teacher.col_status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoster.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudentProfile(s)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group"
                      title="Click row to view student profile"
                    >
                      <td className="p-3 font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</td>
                      <td className="p-3 text-muted-foreground font-mono">{s.code}</td>
                      <td className="p-3 font-semibold text-primary">{s.grade}</td>
                      <td className="p-3 font-bold text-foreground">{s.gpa}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{s.attendance}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.atRisk ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Attendance */}
        {studentSubTab === 'attendance' && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-foreground">{t('teacher.mark_attendance', 'Mark Attendance — MTH-101')}</h3>
                <p className="text-xs text-muted-foreground">{t('teacher.attendance_desc', "Select present, late, or absent status for today's session.")}</p>
              </div>
              <button onClick={() => showToast('Attendance saved successfully!')} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
                {t('teacher.save_attendance', 'Save Attendance')}
              </button>
            </div>
            <div className="space-y-2">
              {roster.map(s => {
                // Safe lookup without bracket notation to prevent prototype pollution
                const currentAttendance = Object.entries(attendanceState).find(([k]) => Number(k) === s.id)?.[1] ?? 'present';
                return (
                  <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10">
                    <span className="font-bold text-sm text-foreground">{s.name} ({s.code})</span>
                    <div className="flex gap-2">
                      {['present', 'late', 'absent'].map(st => (
                        <button
                          key={st}
                          onClick={() => setAttendanceState(prev => ({ ...prev, [s.id]: st }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                            currentAttendance === st
                              ? st === 'present' ? 'bg-emerald-600 text-white' : st === 'late' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowAddStudentModal(false)}>
            <div className="bg-card rounded-2xl border border-border max-w-lg w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('teacher.register_new_student', 'Register New Student')}</h3>
                  <p className="text-xs text-muted-foreground">{t('teacher.register_student_desc', 'Enter student credentials to generate their portal ID number.')}</p>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Login authentication notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  {t('teacher.auth_note_title', 'Portal Authentication Credentials')}
                </p>
                <p className="text-[11px] leading-relaxed text-blue-700">
                  {t('teacher.auth_note_desc', 'When a student is registered, their official Student ID (Admission Number) is auto-generated. Students log into their student portal using their Email Address and Student ID Number.')}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.student_full_name', 'Student Full Name *')}</label>
                  <input
                    type="text"
                    value={addStudentForm.name}
                    onChange={e => setAddStudentForm({ ...addStudentForm, name: e.target.value })}
                    placeholder="e.g. Chidi Nwosu"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.email_address', 'Email Address *')}</label>
                    <input
                      type="email"
                      value={addStudentForm.email}
                      onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                      placeholder="chidi@tarepet.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.class_level', 'Class Level *')}</label>
                    <select
                      value={addStudentForm.grade}
                      onChange={e => setAddStudentForm({ ...addStudentForm, grade: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.stream', 'Department Stream')}</label>
                    <select
                      value={addStudentForm.stream}
                      onChange={e => setAddStudentForm({ ...addStudentForm, stream: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="General">{t('teacher.opt_general_junior')}</option>
                      <option value="Science">{t('teacher.opt_science_stream')}</option>
                      <option value="Art">{t('teacher.opt_art_humanities')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.parent_name', 'Parent Name')}</label>
                    <input
                      type="text"
                      value={addStudentForm.parentName}
                      onChange={e => setAddStudentForm({ ...addStudentForm, parentName: e.target.value })}
                      placeholder="Chief Nwosu"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.parent_phone', 'Parent Phone')}</label>
                    <input
                      type="text"
                      value={addStudentForm.parentPhone}
                      onChange={e => setAddStudentForm({ ...addStudentForm, parentPhone: e.target.value })}
                      placeholder="08031112233"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddStudentModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">
                  {t('teacher.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleAddStudentSubmit}
                  disabled={!addStudentForm.name || !addStudentForm.email}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {t('teacher.register_student_btn', 'Create & Register Student')}
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Student ID Card Modal */}
        {showIDCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150" onClick={() => setShowIDCardModal(null)}>
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> {t('teacher.id_card_official_title', 'Official Student ID Card')}
                </h3>
                <button onClick={() => setShowIDCardModal(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-90">{t('school.name')}</p>
                      <p className="text-[11px] opacity-75">{t('school.location')}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-primary font-bold text-xs">{t('school.abbr')}</span>
                    </div>
                  </div>
                  <div className="p-5 flex gap-5 items-center">
                    <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      {showIDCardModal.profileImage ? (
                        <img src={showIDCardModal.profileImage} alt={showIDCardModal.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-2xl font-serif font-bold text-primary">
                            {showIDCardModal.name?.[0] ?? 'S'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{showIDCardModal.name}</h4>
                      <p className="text-xs text-primary font-bold mt-0.5">{showIDCardModal.grade} ({showIDCardModal.stream || t('teacher.general', 'General')})</p>
                      <p className="text-xs text-muted-foreground">{showIDCardModal.house || t('teacher.default_house', 'Blue House (Eagle)')}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.id_card_student_id')}</span>
                          <p className="font-bold font-mono text-foreground">{showIDCardModal.code || showIDCardModal.studentId}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.id_card_valid_until')}</span>
                          <p className="font-bold text-foreground">{t('teacher.id_card_valid_date')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    <Printer className="w-4 h-4" /> {t('teacher.btn_print_id')}
                  </button>
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" /> {t('teacher.btn_download_pdf')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {editingStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setEditingStudent(null)}>
            <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-bold text-lg text-foreground">{t('teacher.edit_student')} — {editingStudent.code}</h3>
                <button onClick={() => setEditingStudent(null)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-muted-foreground uppercase block mb-1">{t('teacher.lbl_student_name')}</label>
                  <input
                    type="text"
                    value={editingStudent.name}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground uppercase block mb-1">{t('teacher.lbl_email')}</label>
                  <input
                    type="email"
                    value={editingStudent.email}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground uppercase block mb-1">{t('teacher.lbl_class_level')}</label>
                  <select
                    value={editingStudent.grade}
                    onChange={e => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  >
                    {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingStudent(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">
                  {t('teacher.cancel')}
                </button>
                <button
                  onClick={() => {
                    setRoster(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
                    setEditingStudent(null);
                    showToast(`Updated student profile for ${editingStudent.name}!`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {t('teacher.save_changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Promote Student Modal */}
        {promotingStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setPromotingStudent(null)}>
            <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <TrendingUp className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground">{t('teacher.promote_student')} — {promotingStudent.name}</h3>
                  <p className="text-xs text-muted-foreground">{t('teacher.current_class')} <strong>{promotingStudent.grade}</strong> ({promotingStudent.code})</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">{t('teacher.select_target_class_promo')} <strong>{promotingStudent.name}</strong> {t('teacher.for_upcoming_session')}</p>
                <div>
                  <label className="font-bold text-muted-foreground uppercase block mb-1">{t('teacher.target_promo_class')}</label>
                  <select
                    value={targetPromotionClass}
                    onChange={e => setTargetPromotionClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs font-bold text-primary focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="JSS2">{t('teacher.promo_jss2')}</option>
                    <option value="JSS3">{t('teacher.promo_jss3')}</option>
                    <option value="SS1">{t('teacher.promo_ss1')}</option>
                    <option value="SS2">{t('teacher.promo_ss2')}</option>
                    <option value="SS3">{t('teacher.promo_ss3')}</option>
                    <option value="Graduated">{t('teacher.promo_graduated')}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setPromotingStudent(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">
                  {t('teacher.cancel')}
                </button>
                <button
                  onClick={() => {
                    setRoster(prev => prev.map(s => s.id === promotingStudent.id ? { ...s, grade: targetPromotionClass } : s));
                    showToast(`Promoted ${promotingStudent.name} from ${promotingStudent.grade} to ${targetPromotionClass}! 🎉`);
                    setPromotingStudent(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {t('teacher.confirm_promotion')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Student Modal */}
        {deletingStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setDeletingStudent(null)}>
            <div className="bg-card rounded-2xl border border-border max-w-sm w-full p-6 space-y-4 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-foreground">{t('teacher.delete_record')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('teacher.delete_confirm')} <strong>{deletingStudent.name}</strong> ({deletingStudent.code})? {t('teacher.cannot_undo')}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeletingStudent(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">
                  {t('teacher.cancel')}
                </button>
                <button
                  onClick={() => {
                    setRoster(prev => prev.filter(s => s.id !== deletingStudent.id));
                    showToast(`Deleted ${deletingStudent.name} from class roster.`);
                    setDeletingStudent(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                >
                  {t('teacher.delete', 'Delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

    // =========================================================
    // 3. MANAGE EXAMS & CBT LIFECYCLE
    // =========================================================
    if (activeSection === 'exams') {
      const allExams = getStoredExams();
      const allSubmissions = getStoredSubmissions();

      const filteredExams = allExams.filter(e => {
        const matchClass = selectedExamClass === 'ALL' || !e.class || e.class === selectedExamClass;
        const matchStream = selectedExamStream === 'ALL' || !e.stream || e.stream === selectedExamStream;
        return matchClass && matchStream;
      });

      const approvedExams = filteredExams.filter(e => e.status === 'APPROVED');
      const activeExams = filteredExams.filter(e => e.status === 'ACTIVE');
      const pendingExams = filteredExams.filter(e => e.status === 'PENDING');

      const filteredSubmissions = allSubmissions.filter(s => {
        const matchClass = selectedExamClass === 'ALL' || !s.class || s.class === selectedExamClass;
        const matchStream = selectedExamStream === 'ALL' || !s.stream || s.stream === selectedExamStream;
        return matchClass && matchStream;
      });

      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">{t('teacher.cbt_exam_system', 'CBT Examination System')}</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">
                {t('teacher.cbt_exam_control', 'CBT Exam Control')}
              </h2>
              <p className="text-blue-100 text-xs mt-1 max-w-xl">{t('teacher.cbt_workflow_desc', 'Subject Teacher creates questions → Form Teacher reviews → Admin approves → Form Teacher uploads to Student Portal.')}</p>
            </div>
            <Link href="/dashboard/cbt-builder">
              <button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
                {t('teacher.launch_cbt_builder', 'Launch CBT Exam Builder →')}
              </button>
            </Link>
          </div>

          {/* Workflow Status Info Banner */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="font-serif font-bold text-foreground text-sm mb-3">{t('teacher.approval_workflow', 'Question Approval Workflow')}</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              {[
                { step: '1', label: 'Subject Teacher Creates', color: 'bg-blue-100 text-blue-800' },
                { step: '2', label: 'Form Teacher Reviews', color: 'bg-amber-100 text-amber-800' },
                { step: '3', label: 'Admin Approves', color: 'bg-purple-100 text-purple-800' },
                { step: '4', label: 'Form Teacher Uploads', color: 'bg-emerald-100 text-emerald-800' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-2 flex-1">
                  <span className={`w-6 h-6 rounded-full ${s.color} text-[10px] font-bold flex items-center justify-center shrink-0`}>{s.step}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${s.color} flex-1 text-center`}>{s.label}</span>
                  {s.step !== '4' && <span className="text-muted-foreground hidden sm:block">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Class & Department Filter Bar */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
                {['ALL', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedExamClass(cls)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedExamClass === cls ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cls === 'ALL' ? 'All Classes' : cls}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
                {['ALL', 'Science', 'Arts'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedExamStream(st)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedExamStream === st ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st === 'ALL' ? 'All Streams' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 1: Pending Form Teacher Review */}
          {pendingExams.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{t('teacher.pending_review', 'Pending Form Teacher Review')} ({pendingExams.length})</span>
              </div>
              <p className="text-xs text-amber-700">{t('teacher.pending_review_desc', 'These exams were submitted by Subject Teachers and are awaiting Form Teacher review before forwarding to Admin.')}</p>
              <div className="space-y-3 pt-1">
                {pendingExams.map(ex => (
                  <div key={ex.id} className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{ex.course_code}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{ex.class || 'SS1'} {ex.stream || 'Science'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{t('teacher.by', 'by')} {ex.teacher_name || t('teacher.subject_teacher', 'Subject Teacher')}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.duration_minutes} mins · {ex.questions_count || ex.questions?.length} Questions</p>
                    </div>
                    <button
                      onClick={() => {
                        updateExamStatus(ex.id, 'APPROVED');
                        showToast(`Reviewed & forwarded "${ex.title}" to Admin for final approval.`);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Send className="w-4 h-4" /> Review and Forward to Admin
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel 2: Admin Approved — Ready to Upload to Students */}
          {approvedExams.length > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{t('teacher.approved_exams_ready', 'Admin Approved — Ready to Upload to Students')} ({approvedExams.length})</span>
              </div>
              <p className="text-xs text-emerald-700">{t('teacher.approved_exams_desc', 'Admin has approved these exams. Click')} <strong>{t('teacher.upload_activate', '"Upload & Activate for Students"')}</strong> {t('teacher.approved_exams_desc2', 'to publish to the student portal.')}</p>
              <div className="space-y-3 pt-1">
                {approvedExams.map(ex => (
                  <div key={ex.id} className="bg-white p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{ex.course_code}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{ex.class || 'SS1'} {ex.stream || 'Science'}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.duration_minutes} mins · {ex.questions_count || ex.questions?.length} Questions</p>
                    </div>
                    <button
                      onClick={() => {
                        updateExamStatus(ex.id, 'ACTIVE');
                        showToast(`Activated "${ex.title}"! ${ex.class || 'SS1'} ${ex.stream || 'Science'} students can now take this exam.`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 self-start sm:self-auto ring-2 ring-emerald-400/50 animate-pulse"
                    >
                      <Send className="w-4 h-4" /> Upload and Activate for Students
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Live Exams */}
          {activeExams.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Live Active Exams ({activeExams.length})
              </h3>
              <div className="space-y-2">
                {activeExams.map(ex => (
                  <div key={ex.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-500/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">🟢 Live in Student Portal</span>
                      <h4 className="font-bold text-foreground text-sm mt-1">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.course_code} · {ex.duration_minutes} mins · {ex.class || 'SS1'} {ex.stream || 'Science'} Students</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                      {t('teacher.receiving_submissions', 'Receiving Submissions...')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-Time Student CBT Submissions Queue */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-foreground text-base">{t('teacher.received_submissions', 'Received Student CBT Submissions')} ({filteredSubmissions.length})</h3>
              <span className="text-xs font-semibold text-muted-foreground">{t('teacher.auto_graded_verified', 'Auto-Graded & Verified')}</span>
            </div>

            {filteredSubmissions.length > 0 ? (
              <div className="space-y-3">
                {filteredSubmissions.map(sub => (
                  <div key={sub.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-sm">{sub.student_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{sub.class} {sub.stream}</span>
                        <span className="text-xs text-muted-foreground">({sub.student_id})</span>
                      </div>
                      <h4 className="font-semibold text-foreground text-xs">{sub.exam_title} ({sub.course_code})</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t('teacher.submitted_at', 'Submitted:')} {new Date(sub.submitted_at).toLocaleTimeString()} · {t('teacher.score_label', 'Score:')} <strong>{sub.score} / {sub.total_possible}</strong></p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-lg font-serif font-bold text-emerald-600">{sub.percentage}%</span>
                        <p className="text-[9px] font-bold uppercase text-emerald-700">{t('teacher.auto_graded', 'Auto-Graded')}</p>
                      </div>
                      <button
                        onClick={() => showToast(`Recorded ${sub.student_name}'s score (${sub.percentage}%) to class broadsheet!`)}
                        className="bg-primary text-white font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-primary/90 transition-colors"
                      >
                        {t('teacher.record_broadsheet', 'Record to Broadsheet')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-border/50">
                <p className="text-sm font-semibold">{t('teacher.no_submissions_yet', 'No student submissions received yet.')}</p>
                <p className="text-xs mt-1">{t('teacher.no_submissions_desc', 'Once students start and submit their exams in the student portal, their scores will appear here automatically.')}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // =========================================================
    // 4. MANAGE RESULTS
    // =========================================================
    if (activeSection === 'results') return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">{t('teacher.manage_results', 'Manage Results & Broadsheet')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('teacher.manage_results_desc', 'Grade student submissions and record term CA & exam scores to the class broadsheet.')}</p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex border-b border-border gap-2">
          {[
            { id: 'queue', label: `Pending Submissions (${submissions.length})`, icon: FileText },
            { id: 'gradebook', label: 'Class Broadsheet & Scores', icon: BarChart2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setResultsSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                resultsSubTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tab 1: Grading Queue */}
        {resultsSubTab === 'queue' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-foreground text-lg">{t('teacher.all_graded', 'All Submissions Graded!')}</h4>
                <p className="text-xs text-muted-foreground">{t('teacher.all_graded_desc', 'There are no pending student submissions requiring evaluation.')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map(s => (
                  <div key={s.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{s.classCode}</span>
                        <span className="text-xs text-muted-foreground">{s.submittedAt}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{s.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('teacher.submitted_by', 'Submitted by:')} <strong>{s.student}</strong> • {t('teacher.file_label', 'File:')} <span className="font-mono text-primary">{s.file}</span></p>
                    </div>
                    <button onClick={() => setSelectedSub(s)} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors self-start md:self-auto">
                      {t('teacher.grade_submission', 'Grade Submission')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Grading Modal */}
            {selectedSub && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSub(null)}>
                <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('teacher.grade_label', 'Grade:')} {selectedSub.student}</h3>
                  <p className="text-xs text-muted-foreground">{selectedSub.title} ({selectedSub.classCode})</p>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.score_out_of', 'Score (out of 100)')}</label>
                    <input type="number" min={0} max={100} value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder="e.g. 85" className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.feedback_comments', 'Feedback Comments')}</label>
                    <textarea rows={3} value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Provide constructive feedback for student..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedSub(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">{t('teacher.cancel', 'Cancel')}</button>
                    <button onClick={handleGradeSubmit} disabled={!gradeInput} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50">{t('teacher.submit_grade', 'Submit Grade')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 2: Term Gradebook */}
        {resultsSubTab === 'gradebook' && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-foreground">{t('teacher.class_broadsheet', 'Class Broadsheet — MTH-101')}</h3>
                <p className="text-xs text-muted-foreground">{t('teacher.broadsheet_desc', 'Record and review CA1 (10%), CA2 (10%), Midterm (20%), and Final Exam (60%) scores for your class.')}</p>
              </div>
              <button onClick={() => showToast('Gradebook scores saved & synced to student report cards!')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
                {t('teacher.sync_report_cards', 'Sync Scores to Report Cards')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">{t('teacher.col_student', 'Student')}</th>
                    <th className="p-3 text-center">{t('teacher.col_ca1', 'CA 1 (10%)')}</th>
                    <th className="p-3 text-center">{t('teacher.col_ca2', 'CA 2 (10%)')}</th>
                    <th className="p-3 text-center">{t('teacher.col_midterm', 'Midterm (20%)')}</th>
                    <th className="p-3 text-center">{t('teacher.col_final', 'Final Exam (60%)')}</th>
                    <th className="p-3 text-center">{t('teacher.col_total', 'Total (100%)')}</th>
                    <th className="p-3 text-center">{t('teacher.col_grade', 'Grade')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roster.map(s => {
                    // Safe lookup without bracket notation to prevent prototype pollution
                    const sc = Object.entries(gradebookScores).find(([k]) => Number(k) === s.id)?.[1] ?? { ca1: 0, ca2: 0, midterm: 0, exam: 0 };
                    const total = sc.ca1 + sc.ca2 + sc.midterm + sc.exam;
                    const letter = total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F';
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="p-3 font-bold text-foreground">{s.name}</td>
                        <td className="p-3 text-center font-mono">{sc.ca1}</td>
                        <td className="p-3 text-center font-mono">{sc.ca2}</td>
                        <td className="p-3 text-center font-mono">{sc.midterm}</td>
                        <td className="p-3 text-center font-mono">{sc.exam}</td>
                        <td className="p-3 text-center font-bold text-foreground">{total}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${total >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {letter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );

    // =========================================================
    // 5. TEACHER PROFILE
    // =========================================================
    if (activeSection === 'profile') return (
      <div className="space-y-6 max-w-5xl">
        {/* Profile Banner & Header Card */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Top Banner Gradient */}
          <div className="h-36 bg-gradient-to-r from-primary via-primary/90 to-secondary p-6 relative flex items-end justify-between">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 text-white flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('teacher.official_staff_account', 'Tarepet Montessori School — Official Staff Account')}</span>
            </div>
            <div className="relative z-10 flex gap-2">
              <button
                onClick={() => setShowStaffIdModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/30 shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t('teacher.view_staff_id', 'View Staff ID Card')}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white text-primary hover:bg-white/90 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('teacher.btn_print_profile')}</span>
              </button>
            </div>
          </div>

          {/* Profile Header Details */}
          <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 relative z-20">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center text-primary font-bold text-3xl font-serif overflow-hidden">
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                    {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full" title="Active Staff" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-serif font-bold text-foreground">{profileForm.firstName} {profileForm.lastName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {profileForm.staffId}
                  </span>
                </div>
                <p className="text-xs font-semibold text-primary">{profileForm.roleTitle}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{profileForm.department}</span>
                  <span>•</span>
                  <span>{t('teacher.form_teacher_prefix')}{formClass}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSection('settings')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent text-foreground transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>{t('teacher.edit_profile')}</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border bg-muted/20">
            <div className="p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.form_class')}</p>
              <p className="text-base font-serif font-bold text-foreground mt-0.5">{formClass}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.students_supervised')}</p>
              <p className="text-base font-serif font-bold text-foreground mt-0.5">{roster.length} {t('teacher.active_students')}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.service_duration')}</p>
              <p className="text-base font-serif font-bold text-foreground mt-0.5">{profileForm.experience}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.status')}</p>
              <p className="text-base font-serif font-bold text-emerald-600 mt-0.5">{t('teacher.active_verified')}</p>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal Information & Contact */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> {t('teacher.personal_info')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.full_name')}</span>
                  <p className="font-bold text-foreground">{profileForm.firstName} {profileForm.lastName}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.staff_designation_code')}</span>
                  <p className="font-mono font-bold text-primary">{profileForm.staffId}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.official_email')}</span>
                  <p className="font-semibold text-foreground truncate">{profileForm.email}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.phone_contact')}</span>
                  <p className="font-semibold text-foreground">{profileForm.phone}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.gender_dob')}</span>
                  <p className="font-semibold text-foreground">{profileForm.gender} • {profileForm.dob}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.first_appointment_date')}</span>
                  <p className="font-semibold text-foreground">{profileForm.joiningDate}</p>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.residential_address')}</span>
                  <p className="font-semibold text-foreground">{profileForm.address}</p>
                </div>
              </div>
            </div>

            {/* Educational Qualifications & Bio */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> {t('teacher.qualifications')}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/10">
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">{profileForm.qualification}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t('teacher.specialization_in')}{profileForm.specialization}</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.philosophy_statement')}</span>
                  <p className="text-foreground leading-relaxed italic">"{profileForm.bio}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Teaching Assignments & Staff ID Quick Card */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> {t('teacher.teaching_assignments')}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <span className="text-[10px] uppercase font-bold text-primary block">{t('teacher.form_teacher_class')}</span>
                  <p className="font-serif font-bold text-foreground text-sm mt-0.5">{formClass} {t('teacher.science')}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('teacher.assigned_subjects')}</span>
                  <p className="font-semibold text-foreground mt-1">{profileForm.specialization}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('teacher.consultation_hours')}</span>
                  <p className="font-semibold text-foreground mt-1">{profileForm.officeHours}</p>
                </div>
              </div>
            </div>

            {/* Quick Staff ID Badge Card */}
            <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary rounded-2xl p-5 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">{t('school.name')}</p>
                  <p className="text-[11px] font-bold">{t('teacher.faculty_staff_identity')}</p>
                </div>
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold border border-white/30">
                  {t('school.abbr')}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center font-bold text-xl shrink-0">
                  {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm leading-tight">{profileForm.firstName} {profileForm.lastName}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5">{profileForm.staffId}</p>
                  <p className="text-[10px] font-semibold text-emerald-300 mt-0.5">{t('teacher.valid_until_dec_2028')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowStaffIdModal(true)}
                className="w-full bg-white text-primary font-bold py-2 rounded-xl text-xs hover:bg-white/90 transition-colors shadow-sm"
              >
                {t('teacher.expand_print_id')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 6. SETTINGS
    // =========================================================
    if (activeSection === 'settings') return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{t('teacher.settings_title', 'Teacher Portal Settings')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('teacher.settings_desc', 'Manage your profile details, assigned courses, and notification alerts.')}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profile Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.first_name', 'First Name')}</label>
              <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.last_name', 'Last Name')}</label>
              <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.email_address', 'Email Address')}</label>
              <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.phone_number', 'Phone Number')}</label>
              <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.subject_specialization', 'Subject Specialization')}</label>
            <input type="text" value={profileForm.specialization} onChange={e => setProfileForm({...profileForm, specialization: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notification Preferences
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
              <div>
                <p className="font-bold text-xs text-foreground">{t('teacher.cbt_submission_alerts', 'CBT Exam Submission Alerts')}</p>
                <p className="text-[10px] text-muted-foreground">{t('teacher.cbt_submission_alerts_desc', 'Receive real-time alerts when students submit completed CBT exams.')}</p>
              </div>
              <input type="checkbox" checked={profileForm.cbtAlerts} onChange={e => setProfileForm({...profileForm, cbtAlerts: e.target.checked})} className="w-4 h-4 text-primary rounded" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
              <div>
                <p className="font-bold text-xs text-foreground">{t('teacher.admin_approval_notifs', 'Admin Approval Notifications')}</p>
                <p className="text-[10px] text-muted-foreground">{t('teacher.admin_approval_notifs_desc', 'Get notified when an Admin approves or rejects your drafted CBT exams.')}</p>
              </div>
              <input type="checkbox" checked={profileForm.emailAlerts} onChange={e => setProfileForm({...profileForm, emailAlerts: e.target.checked})} className="w-4 h-4 text-primary rounded" />
            </label>
          </div>
          <button onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('teacher_profile_data', JSON.stringify(profileForm));
            }
            showToast('Teacher profile & preferences saved successfully!');
          }} className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            {t('teacher.save_settings', 'Save Settings')}
          </button>
        </div>
      </div>
    );

    // Fallback for any unknown section
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">{t('teacher.management_portal', 'Teacher Management Portal')}</h2>
        <p className="text-xs text-muted-foreground">{t('teacher.select_section', 'Select a section from the sidebar menu to begin.')}</p>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
      <PortalLayout
        title="Teacher Portal"
        activeSection={activeSection}
        onNavigate={setActiveSection}
      >
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Official Teacher Staff ID Card Modal */}
        {showStaffIdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150" onClick={() => setShowStaffIdModal(false)}>
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> {t('teacher.staff_id_title', 'Official Staff ID Card')}
                </h3>
                <button onClick={() => setShowStaffIdModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-90">{t('school.name')}</p>
                      <p className="text-[11px] opacity-75">{t('school.location')}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-primary font-bold text-xs">{t('school.abbr')}</span>
                    </div>
                  </div>
                  <div className="p-5 flex gap-5 items-center">
                    <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center text-3xl font-serif font-bold text-primary">
                        {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{profileForm.firstName} {profileForm.lastName}</h4>
                      <p className="text-xs text-primary font-bold mt-0.5">{profileForm.roleTitle}</p>
                      <p className="text-xs text-muted-foreground">{profileForm.department}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.staff_id_label', 'STAFF ID:')}</span>
                          <p className="font-bold font-mono text-foreground">{profileForm.staffId}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.id_card_valid_until')}</span>
                          <p className="font-bold text-foreground">{t('teacher.id_card_valid_date')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    <Printer className="w-4 h-4" /> {t('teacher.btn_print_id')}
                  </button>
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" /> {t('teacher.btn_download_pdf')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
