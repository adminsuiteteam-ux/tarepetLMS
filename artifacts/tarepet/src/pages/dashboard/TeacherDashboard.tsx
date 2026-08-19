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
  ClipboardList, Settings, ShieldCheck, User, Bell, Printer, CreditCard, GraduationCap, Zap, School,
  Fingerprint, Smartphone, Save, History, Sparkles, RotateCcw, FileSpreadsheet, Check
} from 'lucide-react';

import { authClient } from '@/lib/api-auth';
import { getStoredExams, updateExamStatus, getStoredSubmissions, formatStudentEmail, generateAdmissionNumber, getStoredStudents, getStoredTeachers, saveTeacher, saveStudent, deleteStudent, subscribeToCBTStore, syncStudentsWithBackend, syncTeachersWithBackend, getExamAttendance, setStudentExamAttendance, markAllStudentsAttendance, CBTAttendanceRecord, SCHOOL_CLASSES, getClassArms, getCoursesForClass, getStudentBroadsheet, saveStudentBroadsheet, getAutomaticCBTScore, calculateWAECGrade, calculateBECEGrade, isSeniorSecondaryClass, CourseBroadsheetScore, PromotionRecord, getPromotionHistory, executeStudentPromotions, getNextProgressiveClass, getArchivedCohortsForTeacher } from '@/lib/cbt-store';
import { useTranslation } from '@/lib/i18n';
import { TerminalReportCard, ReportCardData, SubjectScore } from '@/components/reports/TerminalReportCard';
import { getTimeGreeting } from '@/lib/utils';
import { isBiometricsEnabled, enrollBiometrics, unenrollBiometrics } from '@/lib/biometrics';

function getSafeProperty<T>(obj: Record<string | number, T> | null | undefined, key: string | number): T | undefined {
  if (obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key)) {
    return Reflect.get(obj, key);
  }
  return undefined;
}

// ─── Initial Seed Data (Form Teacher & Subject Teacher) ───────
const TEACHER_CLASSES: any[] = [];

const PENDING_SUBMISSIONS: any[] = [];
const STUDENT_ROSTER: any[] = [];

const TIMETABLE: any[] = [];

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user, isTeacher, isAdmin } = useAuth();

  if (!user || (!isTeacher && !isAdmin) || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl bg-card p-8 shadow-xl border border-border">
          <h2 className="text-2xl font-serif font-bold text-destructive mb-3">{t('teacher.access_denied', 'Access Denied')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('teacher.access_denied_desc_prefix', 'Your account (')}{user?.role || 'Guest'}{t('teacher.access_denied_desc_suffix', ') does not have permission to view the Teacher Portal.')}
          </p>
          <button
            onClick={() => { window.location.href = '/sign-in'; }}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            {t('teacher.return_to_signin', 'Return to Sign In')}
          </button>
        </div>
      </div>
    );
  }
  // Active section & tab persistence
  const [activeSection, setActiveSectionState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSec = params.get('section');
      if (urlSec) return urlSec;
    }
    return 'overview';
  });

  const setActiveSection = (sec: string) => {
    setActiveSectionState(sec);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('section', sec);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const matchedStoredTeacher = React.useMemo(() => {
    if (!user) return null;
    const uEmail = (user.email || '').toLowerCase();
    const uStaffId = ((user.profile as any)?.teacher_id || (user as any).staffId || (user as any).id || (user as any).username || '').toString().toLowerCase();
    const uName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
    const cleanUStaffId = uStaffId.replace(/[^a-z0-9]/g, '');
    const cleanUEmail = uEmail.replace(/[^a-z0-9]/g, '');

    const allTeachers = getStoredTeachers();
    const found = allTeachers.find((t: any) => {
      const tEmail = (t.email || '').toLowerCase();
      const tStaffId = (t.staffId || '').toLowerCase();
      const tName = (t.name || '').toLowerCase();
      const cleanTStaffId = tStaffId.replace(/[^a-z0-9]/g, '');
      const cleanTEmail = tEmail.replace(/[^a-z0-9]/g, '');

      return (
        (tStaffId && tStaffId === uStaffId) ||
        (cleanUStaffId.length >= 3 && (cleanUStaffId === cleanTStaffId || cleanUStaffId.includes(cleanTStaffId) || cleanTStaffId.includes(cleanUStaffId))) ||
        (tEmail && tEmail === uEmail) ||
        (cleanUEmail.length >= 4 && (cleanUEmail.includes(cleanTEmail) || cleanTEmail.includes(cleanUEmail))) ||
        (uName.length >= 3 && tName === uName)
      );
    });

    if (found) return found;

    // Direct construction from authenticated user profile — never fall back to another teacher
    const prof = (user.profile as any) || {};
    return {
      id: user.id || Date.now(),
      staffId: prof.teacher_id || (user as any).staffId || `TMS/TCH/${String(user.id || '0001').padStart(4, '0')}`,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || '',
      email: user.email || '',
      phone: user.phone || prof.phone || '',
      gender: prof.gender || '',
      department: prof.department || '',
      specialization: prof.specialization || '',
      qualification: prof.qualifications || '',
      status: (user as any).is_active !== false ? 'Active' : 'Inactive',
      joined: prof.hire_date || '',
      formTeacherOf: prof.form_teacher_of || prof.formTeacherOf || 'None',
      subjectsAssigned: Array.isArray(prof.subjects_taught) ? prof.subjects_taught : [],
      classesCount: Array.isArray(prof.subjects_taught) ? prof.subjects_taught.length : 0,
      studentsCount: prof.students_count ?? (prof.studentsCount ?? 0),
      address: prof.address || '',
      bio: prof.bio || '',
      dob: prof.dob || '',
      salary: prof.salary || '',
      bankName: prof.bank_name || '',
      accountNumber: prof.account_number || '',
      cbtExamsCount: 0,
      attendanceRate: '0%',
      profileImage: prof.profile_image || '',
    };
  }, [user]);

  const rawFormClass = (user?.profile as any)?.formTeacherOf || (user?.profile as any)?.form_teacher_of || matchedStoredTeacher?.formTeacherOf;
  const formClass = (rawFormClass && rawFormClass !== 'None' && !rawFormClass.startsWith('No')) ? rawFormClass : '';

  // Sub-tab states
  const [studentSubTab, setStudentSubTabState] = useState<'roster' | 'attendance'>('roster');
  const setStudentSubTab = (tab: 'roster' | 'attendance') => {
    setStudentSubTabState(tab);
  };

  const [resultsSubTab, setResultsSubTabState] = useState<'queue' | 'gradebook'>('queue');
  const setResultsSubTab = (tab: 'queue' | 'gradebook') => {
    setResultsSubTabState(tab);
  };

  const [selectedExamClass, setSelectedExamClass] = useState<string>('ALL');
  const [selectedExamStream, setSelectedExamStream] = useState<string>('ALL');

  // Data states
  const [submissions, setSubmissions] = useState(PENDING_SUBMISSIONS);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [roster, setRoster] = useState<any[]>(() => getStoredStudents());

  React.useEffect(() => {
    setRoster(getStoredStudents());
    syncStudentsWithBackend().then(res => setRoster(res));
    syncTeachersWithBackend();
    const unsub = subscribeToCBTStore(() => {
      setRoster(getStoredStudents());
    });
    return () => unsub();
  }, []);

  const [studentSearch, setStudentSearch] = useState('');
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({
    1: 'present', 2: 'present', 3: 'late', 4: 'present', 5: 'present'
  });
  
  // Modals & toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    code: '',
    name: '',
    email: '',
    gender: 'Male',
    maritalStatus: 'Single',
    dob: '',
    phone: '',
    country: 'Nigeria',
    stateOfOrigin: '',
    lga: '',
    address: '',
    grade: formClass || 'SS1',
    stream: 'Science',
    programme: 'Senior Secondary Certificate (SSCE)',
    parentName: '',
    parentPhone: '',
    status: 'ACTIVE',
    studyMode: 'Full Time'
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

  // Post-login Password Prompt Modal state for Teachers (Shows once on first new login)
  const [showPasswordPromptModal, setShowPasswordPromptModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userIdentifier = (user?.email || (user?.profile as any)?.teacher_id || '').toLowerCase().trim();
    if (!userIdentifier) return false;
    const alreadySeen = localStorage.getItem(`tarepet_pwd_modal_seen_${userIdentifier}`);
    if (alreadySeen === 'true') return false;
    return !!(user?.profile as any)?.needsPasswordChange;
  });
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState<string>('');
  const [pwdModalError, setPwdModalError] = useState<string | null>(null);
  const [pwdModalLoading, setPwdModalLoading] = useState<boolean>(false);

  const markPasswordModalSeen = () => {
    if (typeof window === 'undefined') return;
    const userIdentifier = (user?.email || (user?.profile as any)?.teacher_id || '').toLowerCase().trim();
    if (userIdentifier) {
      localStorage.setItem(`tarepet_pwd_modal_seen_${userIdentifier}`, 'true');
    }
  };

  // CBT Exam Launch & Attendance & Preview State
  const [selectedAttendanceExam, setSelectedAttendanceExam] = useState<any | null>(null);
  const [examAttendanceState, setExamAttendanceState] = useState<any[]>([]);
  const [examStartMode, setExamStartMode] = useState<'GENERAL' | 'INDIVIDUAL'>('GENERAL');
  const [selectedStudentForIndividual, setSelectedStudentForIndividual] = useState<string>('TMS/SS1/SCI/4821');
  const [previewSubmissionModal, setPreviewSubmissionModal] = useState<any | null>(null);

  // Broadsheet & Detailed Student Score Table State
  const [selectedBroadsheetStudent, setSelectedBroadsheetStudent] = useState<any | null>(null);
  const [broadsheetScores, setBroadsheetScores] = useState<Record<string, CourseBroadsheetScore>>({});
  const [broadsheetSubject, setBroadsheetSubject] = useState<string>('MTH-101');
  const [broadsheetClassFilter, setBroadsheetClassFilter] = useState<string>('');

  // 🎓 Student Promotion & Session Rollover State
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionSession, setPromotionSession] = useState('2026/2027');
  const [promotionTerm, setPromotionTerm] = useState('3rd Term');
  const [promotionSelections, setPromotionSelections] = useState<Record<string, {
    status: 'promoted' | 'repeated' | 'graduated' | 'transferred';
    toClass: string;
    cumulativeAverage: number;
  }>>({});

  // 📜 Academic History & Past Cohorts State
  const [historySessionFilter, setHistorySessionFilter] = useState<string>('ALL');
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<PromotionRecord | null>(null);
  const [showHistoryBroadsheetModal, setShowHistoryBroadsheetModal] = useState<PromotionRecord | null>(null);
  const [selectedReportCardStudent, setSelectedReportCardStudent] = useState<any | null>(null);

  const buildReportCardData = (student: any): ReportCardData => {
    const isSS = student ? isSeniorSecondaryClass(student.grade) : false;
    const broadsheet = student ? getStudentBroadsheet(student.id) : {};
    const courses = getCoursesForClass(student?.grade || 'SS1', student?.stream || 'Science');
    
    let totalMarks = 0;
    const subjectsList: SubjectScore[] = courses.map(c => {
      const sc = getSafeProperty(broadsheet, c.code) || { ca1: 0, ca2: 0, cbtScore: 0, paperExam: 0, exam: 0 };
      const ca = (sc.ca1 || 0) + (sc.ca2 || 0);
      const exam = isSS ? ((sc.cbtScore || 0) + (sc.paperExam || sc.exam || 0)) : (sc.exam !== undefined ? sc.exam : (sc.paperExam || 0));
      const tot = sc.total || (ca + (isSS ? (sc.cbtScore || 0) + (sc.paperExam || sc.exam || 0) : exam));
      totalMarks += tot;
      const g = isSS ? calculateWAECGrade(tot) : calculateBECEGrade(tot);
      return {
        code: c.code,
        title: c.name,
        ca_score: ca,
        cbt_exam_score: isSS ? (sc.cbtScore || 0) : 0,
        total_score: tot,
        grade_letter: g.grade,
        teacher_remark: sc.remark || sc.remarks || ''
      };
    });

    const avg = courses.length > 0 ? Math.round((totalMarks / courses.length) * 10) / 10 : 0;
    const overallG = isSS ? calculateWAECGrade(avg) : calculateBECEGrade(avg);

    return {
      student_info: {
        id: student?.id || '',
        student_id_code: student?.code || student?.admission_number || student?.admissionNo || `TMS/${student?.id || ''}`,
        name: student?.name || '',
        grade_level: student?.grade || '',
        house: student?.house || 'School House',
        admission_date: student?.admission_date || ''
      },
      academic_term: {
        term: '3rd Term Final Session',
        year: '2025/2026',
        ref_code: `TMS-REP-${student?.id || ''}`,
        report_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      },
      overall_performance: {
        average_percentage: avg,
        grade_letter: overallG.grade,
        total_subjects: courses.length
      },
      subjects: subjectsList,
      attendance: {
        total_days: 120,
        present: 120,
        absent: 0,
        late: 0,
        percentage: 100
      },
      montessori_conduct: [
        { trait: 'Punctuality & Diligence', rating: 'Excellent' },
        { trait: 'Leadership & Team Spirit', rating: 'Very Good' },
        { trait: 'Politeness & Respect', rating: 'Excellent' },
        { trait: 'Academic Inquisitiveness', rating: 'Distinction' }
      ],
      house_points: 0,
      remarks: {
        teacher_remark: avg >= 50 ? 'Satisfactory academic performance and steady progress.' : 'Needs closer guidance and academic support.',
        headmistress_remark: avg >= 50 ? 'Approved for promotion.' : 'Requires consolidation.'
      }
    };
  };


  const handleOpenStudentBroadsheet = (student: any) => {
    setSelectedBroadsheetStudent(student);
    const courses = getCoursesForClass(student.grade || 'SS1', student.stream || 'Science');
    const saved = getStudentBroadsheet(student.id);
    const isSS = isSeniorSecondaryClass(student.grade);

    const initialScores: Record<string, CourseBroadsheetScore> = {};
    courses.forEach(c => {
      const cbtAuto = isSS ? getAutomaticCBTScore(student.code || student.email || student.name, c.code) : 0;
      const existing = getSafeProperty(saved, c.code);
      Reflect.set(initialScores, c.code, {
        ca1: existing?.ca1 ?? 0,
        ca2: existing?.ca2 ?? 0,
        assignment: existing?.assignment ?? 0,
        cbtScore: isSS ? (existing?.cbtScore !== undefined ? existing.cbtScore : cbtAuto) : 0,
        paperExam: existing?.paperExam ?? (existing?.exam ?? 0),
        exam: existing?.exam ?? (existing?.paperExam ?? 0),
        remark: existing?.remark || ''
      });
    });

    setBroadsheetScores(initialScores);
  };

  const handleUpdateScoreInput = (courseCode: string, field: keyof CourseBroadsheetScore, val: any) => {
    const isSS = selectedBroadsheetStudent ? isSeniorSecondaryClass(selectedBroadsheetStudent.grade) : true;
    setBroadsheetScores(prev => {
      const current = getSafeProperty(prev, courseCode) || { ca1: 0, ca2: 0, assignment: 0, cbtScore: 0, paperExam: 0, exam: 0, remark: '' };
      let numVal = typeof val === 'number' ? val : parseFloat(val);
      if (isNaN(numVal)) numVal = 0;

      if (isSS) {
        if (field === 'ca1' || field === 'ca2') numVal = Math.min(10, Math.max(0, numVal));
        if (field === 'cbtScore') numVal = Math.min(30, Math.max(0, numVal));
        if (field === 'paperExam') numVal = Math.min(40, Math.max(0, numVal));
      } else {
        if (field === 'ca1' || field === 'ca2') numVal = Math.min(20, Math.max(0, numVal));
        if (field === 'paperExam' || field === 'exam') numVal = Math.min(60, Math.max(0, numVal));
      }

      const updated: CourseBroadsheetScore = {
        ...current,
        ca1: field === 'ca1' ? numVal : current.ca1,
        ca2: field === 'ca2' ? numVal : current.ca2,
        assignment: field === 'assignment' ? numVal : current.assignment,
        cbtScore: isSS ? (field === 'cbtScore' ? numVal : (current.cbtScore ?? 0)) : 0,
        paperExam: (field === 'paperExam' || field === 'exam') ? numVal : (current.paperExam ?? current.exam ?? 0),
        exam: (field === 'paperExam' || field === 'exam') ? numVal : (current.exam ?? current.paperExam ?? 0),
        remark: field === 'remark' ? String(val || '') : (current.remark || '')
      };
      const nextState = { ...prev, [courseCode]: updated };

      if (selectedBroadsheetStudent) {
        saveStudentBroadsheet(selectedBroadsheetStudent.id, nextState);
      }
      return nextState;
    });
  };

  const handleInlineStudentScoreUpdate = (student: any, courseCode: string, field: 'ca1' | 'ca2' | 'cbtScore' | 'paperExam' | 'exam', val: any) => {
    const isSS = isSeniorSecondaryClass(student.grade);
    const saved = getStudentBroadsheet(student.id);
    const current = getSafeProperty(saved, courseCode) || {
      ca1: 0,
      ca2: 0,
      assignment: 0,
      cbtScore: isSS ? getAutomaticCBTScore(student.code || student.email, courseCode) : 0,
      paperExam: 0,
      exam: 0,
      remark: ''
    };

    let numVal = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(numVal)) numVal = 0;

    if (isSS) {
      if (field === 'ca1' || field === 'ca2') numVal = Math.min(10, Math.max(0, numVal));
      if (field === 'cbtScore') numVal = Math.min(30, Math.max(0, numVal));
      if (field === 'paperExam') numVal = Math.min(40, Math.max(0, numVal));
    } else {
      if (field === 'ca1' || field === 'ca2') numVal = Math.min(20, Math.max(0, numVal));
      if (field === 'paperExam' || field === 'exam') numVal = Math.min(60, Math.max(0, numVal));
    }

    const updated: CourseBroadsheetScore = {
      ...current,
      ca1: field === 'ca1' ? numVal : current.ca1,
      ca2: field === 'ca2' ? numVal : current.ca2,
      cbtScore: isSS ? (field === 'cbtScore' ? numVal : (current.cbtScore ?? 0)) : 0,
      paperExam: (field === 'paperExam' || field === 'exam') ? numVal : (current.paperExam ?? current.exam ?? 0),
      exam: (field === 'paperExam' || field === 'exam') ? numVal : (current.exam ?? current.paperExam ?? 0),
    };

    const nextScores = { ...saved, [courseCode]: updated };
    saveStudentBroadsheet(student.id, nextScores);
    setRoster([...getStoredStudents()]);
  };

  // Helper to extract real teacher data filled by Admin (100% matched to Admin Portal)
  const handleOpenPromotionModal = (targetRoster: any[], currentClass: string) => {
    const initialMap: Record<string, {
      status: 'promoted' | 'repeated' | 'graduated' | 'transferred';
      toClass: string;
      cumulativeAverage: number;
    }> = {};

    targetRoster.forEach(student => {
      const saved = getStudentBroadsheet(student.id);
      const scores = Object.values(saved);
      let avg = 0;
      if (scores.length > 0) {
        const sum = scores.reduce((acc, curr) => acc + (curr.total || ((curr.ca1 || 0) + (curr.ca2 || 0) + (curr.exam || curr.paperExam || 0) + (curr.cbtScore || 0))), 0);
        avg = Math.round((sum / scores.length) * 10) / 10;
      } else {
        avg = 0;
      }

      const nextClass = getNextProgressiveClass(currentClass, student.stream);
      const isPass = avg >= 50;

      initialMap[student.id] = {
        status: isPass ? (nextClass === 'Graduated (Alumni)' ? 'graduated' : 'promoted') : 'repeated',
        toClass: nextClass,
        cumulativeAverage: avg
      };
    });

    setPromotionSelections(initialMap);
    setShowPromotionModal(true);
  };

  const handleExecutePromotionSubmit = (currentClass: string, targetRoster: any[]) => {
    const teacherProfile = getTeacherProfileData();
    const promotionsPayload = targetRoster.map(s => {
      const sel = promotionSelections[s.id] || {
        status: 'promoted' as const,
        toClass: getNextProgressiveClass(currentClass, s.stream),
        cumulativeAverage: 75
      };
      return {
        studentId: s.id,
        studentName: s.name,
        studentCode: s.code || s.admission_number || `TP/${s.id}`,
        toClass: sel.toClass,
        status: sel.status,
        cumulativeAverage: sel.cumulativeAverage,
        broadsheetSnapshot: getStudentBroadsheet(s.id)
      };
    });

    const result = executeStudentPromotions({
      teacherId: teacherProfile.staffId,
      teacherName: teacherProfile.fullName,
      fromClass: currentClass,
      academicSession: promotionSession,
      term: promotionTerm,
      studentPromotions: promotionsPayload
    });

    if (result.success) {
      setShowPromotionModal(false);
      showToast(`🎉 Successfully promoted ${result.count} students! Historical cohort archived to Academic History.`);
    }
  };

  const getTeacherProfileData = () => {
    const t = matchedStoredTeacher;
    const prof = (user?.profile as any) || {};
    const tName = t?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '';
    const nameParts = tName.split(' ');
    const fName = user?.first_name || nameParts[0] || '';
    const lName = user?.last_name || nameParts.slice(1).join(' ') || '';
    const formCls = (t?.formTeacherOf && t.formTeacherOf !== 'None' && !t.formTeacherOf.startsWith('No'))
      ? t.formTeacherOf
      : (prof.form_teacher_of || prof.formTeacherOf || '');
    const rawSpec = t?.specialization || prof.specialization || (Array.isArray(prof.subjects_taught) ? prof.subjects_taught.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : prof.subjects_taught) || '';
    const subs = (t?.subjectsAssigned && Array.isArray(t.subjectsAssigned) && t.subjectsAssigned.length > 0)
      ? t.subjectsAssigned
      : (Array.isArray(prof.subjects_taught) ? prof.subjects_taught : []);

    return {
      firstName: fName,
      lastName: lName,
      fullName: tName,
      email: t?.email || user?.email || '',
      phone: t?.phone || user?.phone || prof.phone || '',
      staffId: t?.staffId || prof.teacher_id || (user as any)?.staffId || '',
      roleTitle: formCls ? 'Form Teacher' : (t?.department || prof.department || ''),
      department: t?.department || prof.department || '',
      qualification: t?.qualification || prof.qualifications || '',
      joiningDate: t?.joined || prof.hire_date || '',
      gender: t?.gender || prof.gender || '',
      dob: t?.dob || prof.dob || '',
      specialization: typeof rawSpec === 'string' ? rawSpec : '',
      address: t?.address || prof.address || '',
      bio: t?.bio || prof.bio || '',
      formClass: formCls,
      subjectsAssigned: subs,
      studentsCount: t?.studentsCount ?? 0,
      cbtExamsCount: t?.cbtExamsCount ?? 0,
      attendanceRate: t?.attendanceRate || '0%',
      officeHours: (t as any)?.officeHours || '',
      profileImage: t?.profileImage || prof.profileImage || '',
      salary: t?.salary || prof.salary || '',
      bankName: t?.bankName || prof.bank_name || '',
      accountNumber: t?.accountNumber || prof.account_number || '',
      emailAlerts: true,
      cbtAlerts: true,
    };
  };

  const [profileForm, setProfileForm] = useState(getTeacherProfileData);

  const [profileActiveTab, setProfileActiveTab] = useState<'details' | 'teaching' | 'qualifications' | 'settings'>('details');
  const [showEditModal, setShowEditModal] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(() => {
    const email = user?.email || (user?.profile as any)?.teacher_id || '';
    return isBiometricsEnabled(email);
  });
  const [biometricLoading, setBiometricLoading] = useState(false);

  React.useEffect(() => {
    setProfileForm(getTeacherProfileData());
  }, [user, matchedStoredTeacher]);

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

  const handleAddStudentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addStudentForm.name.trim()) return;
    const selectedGrade = addStudentForm.grade || formClass || 'Nursery 1';
    const autoCode = addStudentForm.code.trim() || generateAdmissionNumber(selectedGrade, addStudentForm.stream);
    const autoEmail = addStudentForm.email.trim() || formatStudentEmail(addStudentForm.name);

    let defaultProg = 'Montessori Early Childhood Education';
    if (selectedGrade.startsWith('Primary') || selectedGrade.startsWith('PRI')) {
      defaultProg = 'Montessori Primary Education';
    } else if (selectedGrade.startsWith('JSS') || selectedGrade.startsWith('SS')) {
      defaultProg = 'Senior Secondary Certificate (SSCE)';
    }

    saveStudent({
      id: Date.now(),
      code: autoCode,
      admissionNo: autoCode,
      name: addStudentForm.name.trim(),
      email: autoEmail,
      password: autoCode,
      gender: addStudentForm.gender,
      maritalStatus: addStudentForm.maritalStatus,
      dob: addStudentForm.dob || 'Not Available',
      phone: addStudentForm.phone || 'Not Available',
      country: addStudentForm.country || 'Nigeria',
      stateOfOrigin: addStudentForm.stateOfOrigin || 'Bayelsa',
      lga: addStudentForm.lga || 'Yenagoa',
      address: addStudentForm.address || 'Not Available',
      grade: selectedGrade,
      stream: addStudentForm.stream,
      programme: addStudentForm.programme || defaultProg,
      parentName: addStudentForm.parentName || 'Not Available',
      parentPhone: addStudentForm.parentPhone || 'Not Available',
      status: addStudentForm.status || 'ACTIVE',
      studyMode: addStudentForm.studyMode || 'Full Time',
      attendance: '100%',
      atRisk: false
    });
    setRoster(getStoredStudents());
    setShowAddStudentModal(false);
    showToast(`Registered ${addStudentForm.name} (${selectedGrade})! Student ID: ${autoCode}`);
    setAddStudentForm({
      code: '',
      name: '',
      email: '',
      gender: 'Male',
      maritalStatus: 'Single',
      dob: '',
      phone: '',
      country: 'Nigeria',
      stateOfOrigin: 'Bayelsa',
      lga: 'Yenagoa',
      address: '',
      grade: formClass || 'Nursery 1',
      stream: 'General / Early Years',
      programme: 'Montessori Early Childhood Education',
      parentName: '',
      parentPhone: '',
      status: 'ACTIVE',
      studyMode: 'Full Time'
    });
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
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1">{getTimeGreeting()}, {user?.first_name ?? 'Teacher'}!</h2>
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
                    <strong className="text-foreground font-bold">{u.maritalStatus || 'Single'}</strong>
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
                    <strong className="text-foreground font-bold">{u.address || (u.name.includes('Chidi') ? '12 Swali Road, Yenagoa' : '12 Kpansia-Epie Road, Yenagoa')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_class_prefix', 'Class:')} </span>
                    <strong className="text-foreground font-bold">
                      {u.grade} ({u.stream || 'Science'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_programme_prefix', 'Programme:')} </span>
                    <strong className="text-foreground font-bold">
                      {u.programme || (u.grade?.startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Basic Education Certificate (BECE)')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_parent_name_prefix', 'Parent Name:')} </span>
                    <strong className="text-foreground font-bold">{u.parentName || 'Chief Nwosu'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_status_field_prefix', 'Status:')} </span>
                    <strong className="text-emerald-600 font-bold">{u.status || 'ACTIVE'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('teacher.lbl_study_mode_prefix', 'Study Mode:')} </span>
                    <strong className="text-foreground font-bold">{u.studyMode || 'Full Time'}</strong>
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
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950">{`Assigned Form Class: `}<span className="text-emerald-700 font-mono font-bold">{formClass}</span></h4>
                <p className="text-xs text-emerald-800/80">{`You are the designated Form Teacher for `}{formClass}{`. Student roster and daily attendance are restricted strictly to your assigned class.`}</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-emerald-600 text-white rounded-full shadow-xs whitespace-nowrap">
              {`Form Register`}
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
              {filteredRoster.map(s => {
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAddStudentModal(false)}>
            <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('teacher.register_new_student', 'Register New Student')}</h3>
                  <p className="text-xs text-muted-foreground">{t('teacher.register_student_desc_manual', 'Manually enter all student details. No fields are generated automatically.')}</p>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Class Scoping Notice for Form Teachers */}
              {formClass && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between gap-3">
                  <p className="font-bold text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Form Class Scope Locked: Student will be assigned strictly to your class ({formClass}).
                  </p>
                  <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded uppercase">
                    {formClass} Only
                  </span>
                </div>
              )}

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`STATUS *`}</label>
                    <select
                      value={addStudentForm.status}
                      onChange={e => setAddStudentForm({ ...addStudentForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none font-bold text-emerald-600"
                    >
                      <option value="ACTIVE">{`ACTIVE`}</option>
                      <option value="INACTIVE">{`INACTIVE`}</option>
                      <option value="SUSPENDED">{`SUSPENDED`}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Student ID (Manual Input) *`}</label>
                    <input
                      type="text"
                      value={addStudentForm.code}
                      onChange={e => setAddStudentForm({ ...addStudentForm, code: e.target.value })}
                      placeholder="e.g. TMS/SS1/9927"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs font-mono font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Student Full Name *`}</label>
                    <input
                      type="text"
                      value={addStudentForm.name}
                      onChange={e => setAddStudentForm({ ...addStudentForm, name: e.target.value })}
                      placeholder="e.g. Civa Media"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Gender *`}</label>
                    <select
                      value={addStudentForm.gender}
                      onChange={e => setAddStudentForm({ ...addStudentForm, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Male">{`Male`}</option>
                      <option value="Female">{`Female`}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Marital Status *`}</label>
                    <select
                      value={addStudentForm.maritalStatus}
                      onChange={e => setAddStudentForm({ ...addStudentForm, maritalStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Single">{`Single`}</option>
                      <option value="Married">{`Married`}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Date of Birth *`}</label>
                    <input
                      type="date"
                      value={addStudentForm.dob}
                      onChange={e => setAddStudentForm({ ...addStudentForm, dob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Phone Number`}</label>
                    <input
                      type="text"
                      value={addStudentForm.phone}
                      onChange={e => setAddStudentForm({ ...addStudentForm, phone: e.target.value })}
                      placeholder="e.g. Not Available or +234..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Email Address *`}</label>
                    <input
                      type="email"
                      value={addStudentForm.email}
                      onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                      placeholder="media.civa@tarepet.edu.ng"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Country`}</label>
                    <input
                      type="text"
                      value={addStudentForm.country}
                      onChange={e => setAddStudentForm({ ...addStudentForm, country: e.target.value })}
                      placeholder="Nigeria"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`State of Origin`}</label>
                    <input
                      type="text"
                      value={addStudentForm.stateOfOrigin}
                      onChange={e => setAddStudentForm({ ...addStudentForm, stateOfOrigin: e.target.value })}
                      placeholder="e.g. Bayelsa"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">L.G.A</label>
                    <input
                      type="text"
                      value={addStudentForm.lga}
                      onChange={e => setAddStudentForm({ ...addStudentForm, lga: e.target.value })}
                      placeholder="e.g. Yenagoa"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Residential Address`}</label>
                  <input
                    type="text"
                    value={addStudentForm.address}
                    onChange={e => setAddStudentForm({ ...addStudentForm, address: e.target.value })}
                    placeholder="e.g. 12 Kpansia-Epie Road, Yenagoa"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Class Level *`}</label>
                    {formClass ? (
                      <input
                        type="text"
                        disabled
                        value={`${formClass} (Assigned Form Class)`}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-xs font-bold text-emerald-700 outline-none cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={addStudentForm.grade}
                        onChange={e => setAddStudentForm({ ...addStudentForm, grade: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                      >
                        {SCHOOL_CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Class Arm / Stream`}</label>
                    <select
                      value={addStudentForm.stream}
                      onChange={e => setAddStudentForm({ ...addStudentForm, stream: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      {getClassArms(addStudentForm.grade).map(arm => (
                        <option key={arm} value={arm}>
                          {arm} Arm
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Academic Programme`}</label>
                    <select
                      value={addStudentForm.programme}
                      onChange={e => setAddStudentForm({ ...addStudentForm, programme: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Senior Secondary Certificate (SSCE)">{`Senior Secondary Certificate (SSCE)`}</option>
                      <option value="Basic Education Certificate (BECE)">{`Basic Education Certificate (BECE)`}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Study Mode`}</label>
                    <select
                      value={addStudentForm.studyMode}
                      onChange={e => setAddStudentForm({ ...addStudentForm, studyMode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Full Time">{`Full Time`}</option>
                      <option value="Part Time">{`Part Time`}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Parent Name`}</label>
                    <input
                      type="text"
                      value={addStudentForm.parentName}
                      onChange={e => setAddStudentForm({ ...addStudentForm, parentName: e.target.value })}
                      placeholder="e.g. Chief Nwosu"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Parent Phone`}</label>
                    <input
                      type="text"
                      value={addStudentForm.parentPhone}
                      onChange={e => setAddStudentForm({ ...addStudentForm, parentPhone: e.target.value })}
                      placeholder="e.g. 08031112233"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <button onClick={() => setShowAddStudentModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">
                  {t('teacher.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleAddStudentSubmit}
                  disabled={!addStudentForm.name || !addStudentForm.code || !addStudentForm.email}
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingStudent(null)}>
            <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-bold text-lg text-foreground">{t('teacher.edit_student', 'Edit Student Profile')} — {editingStudent.code}</h3>
                <button onClick={() => setEditingStudent(null)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`STATUS`}</label>
                    <select
                      value={editingStudent.status || 'ACTIVE'}
                      onChange={e => setEditingStudent({ ...editingStudent, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none font-bold text-emerald-600"
                    >
                      <option value="ACTIVE">{`ACTIVE`}</option>
                      <option value="INACTIVE">{`INACTIVE`}</option>
                      <option value="SUSPENDED">{`SUSPENDED`}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Student ID (Manual Input)`}</label>
                    <input
                      type="text"
                      value={editingStudent.code || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs font-mono font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Student Full Name`}</label>
                    <input
                      type="text"
                      value={editingStudent.name || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Gender`}</label>
                    <select
                      value={editingStudent.gender || 'Male'}
                      onChange={e => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Male">{`Male`}</option>
                      <option value="Female">{`Female`}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Marital Status`}</label>
                    <select
                      value={editingStudent.maritalStatus || 'Single'}
                      onChange={e => setEditingStudent({ ...editingStudent, maritalStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Single">{`Single`}</option>
                      <option value="Married">{`Married`}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Date of Birth`}</label>
                    <input
                      type="date"
                      value={editingStudent.dob || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Phone Number`}</label>
                    <input
                      type="text"
                      value={editingStudent.phone || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Email Address`}</label>
                    <input
                      type="email"
                      value={editingStudent.email || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Country`}</label>
                    <input
                      type="text"
                      value={editingStudent.country || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`State of Origin`}</label>
                    <input
                      type="text"
                      value={editingStudent.stateOfOrigin || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, stateOfOrigin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">L.G.A</label>
                    <input
                      type="text"
                      value={editingStudent.lga || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, lga: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Residential Address`}</label>
                  <input
                    type="text"
                    value={editingStudent.address || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Class Level`}</label>
                    {formClass ? (
                      <input
                        type="text"
                        disabled
                        value={`${formClass} (Assigned Form Class)`}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-xs font-bold text-emerald-700 outline-none cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={editingStudent.grade}
                        onChange={e => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                      >
                        {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Department Stream`}</label>
                    <select
                      value={editingStudent.stream || 'Science'}
                      onChange={e => setEditingStudent({ ...editingStudent, stream: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Science">{`Science`}</option>
                      <option value="Art">{`Art / Humanities`}</option>
                      <option value="Commercial">{`Commercial`}</option>
                      <option value="General">{`General Junior`}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Academic Programme`}</label>
                    <select
                      value={editingStudent.programme || 'Senior Secondary Certificate (SSCE)'}
                      onChange={e => setEditingStudent({ ...editingStudent, programme: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Senior Secondary Certificate (SSCE)">{`Senior Secondary Certificate (SSCE)`}</option>
                      <option value="Basic Education Certificate (BECE)">{`Basic Education Certificate (BECE)`}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Study Mode`}</label>
                    <select
                      value={editingStudent.studyMode || 'Full Time'}
                      onChange={e => setEditingStudent({ ...editingStudent, studyMode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Full Time">{`Full Time`}</option>
                      <option value="Part Time">{`Part Time`}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Parent Name`}</label>
                    <input
                      type="text"
                      value={editingStudent.parentName || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{`Parent Phone`}</label>
                    <input
                      type="text"
                      value={editingStudent.parentPhone || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <button onClick={() => setEditingStudent(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">
                  {t('teacher.cancel', 'Cancel')}
                </button>
                <button
                  onClick={() => {
                    saveStudent(editingStudent);
                    if (selectedStudentProfile?.id === editingStudent.id) {
                      setSelectedStudentProfile(editingStudent);
                    }
                    setEditingStudent(null);
                    showToast(`Updated student profile for ${editingStudent.name}!`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {t('teacher.save_changes', 'Save Changes')}
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
                    saveStudent({ ...promotingStudent, grade: targetPromotionClass });
                    showToast(`Promoted ${promotingStudent.name} from ${promotingStudent.grade} to ${targetPromotionClass}!`);
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
                    deleteStudent(deletingStudent.id);
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

          {/* Panel 1: Pending Form Teacher Review & Sent for Approval */}
          {pendingExams.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{t('teacher.pending_review', 'Sent for Approval / Pending Admin Review')} ({pendingExams.length})</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 ml-auto">
                  🕒 Awaiting Admin Review
                </span>
              </div>
              <p className="text-xs text-amber-700">{t('teacher.pending_review_desc', 'These exams have been submitted for approval and are currently awaiting Admin review. You will receive a notification once approved.')}</p>
              <div className="space-y-3 pt-1">
                {pendingExams.map(ex => (
                  <div key={ex.id} className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{ex.course_code}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{ex.class || 'SS1'} {ex.stream || 'Science'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          🕒 Sent for Approval
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.duration_minutes} mins · {ex.questions_count || ex.questions?.length} Questions · Created by {ex.teacher_name || 'Teacher'}</p>
                    </div>
                    <button
                      onClick={() => {
                        updateExamStatus(ex.id, 'PENDING');
                        showToast(`Re-sent "${ex.title}" to School Admin for approval!`);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Send className="w-4 h-4" /> Re-send to Admin
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
                <span>{t('teacher.approved_exams_ready', 'Admin Approved — Ready to Launch General or Individual Exam')} ({approvedExams.length})</span>
              </div>
              <p className="text-xs text-emerald-700">{t('teacher.approved_exams_desc', 'Admin has approved these exams. Form Teacher must certify hall attendance before starting a General or Individual exam.')}</p>
              <div className="space-y-3 pt-1">
                {approvedExams.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      const records = getExamAttendance(ex.id, ex.class || 'SS1', ex.stream || 'Science');
                      setExamAttendanceState(records);
                      setSelectedAttendanceExam(ex);
                    }}
                    className="bg-white p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-emerald-400 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{ex.course_code}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{ex.class || 'SS1'} {ex.stream || 'Science'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Approved by Admin
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.duration_minutes} mins · {ex.questions_count || ex.questions?.length} Questions</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const records = getExamAttendance(ex.id, ex.class || 'SS1', ex.stream || 'Science');
                        setExamAttendanceState(records);
                        setSelectedAttendanceExam(ex);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 self-start sm:self-auto ring-2 ring-emerald-400/50"
                    >
                      <UserCheck className="w-4 h-4" /> Certify Attendance & Start Exam
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
                  <div
                    key={ex.id}
                    onClick={() => {
                      const records = getExamAttendance(ex.id, ex.class || 'SS1', ex.stream || 'Science');
                      setExamAttendanceState(records);
                      setSelectedAttendanceExam(ex);
                    }}
                    className="p-4 rounded-xl border border-emerald-200 bg-emerald-500/5 flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live in Student Portal
                      </span>
                      <h4 className="font-bold text-foreground text-sm mt-1">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.course_code} · {ex.duration_minutes} mins · {ex.class || 'SS1'} {ex.stream || 'Science'} Students</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const records = getExamAttendance(ex.id, ex.class || 'SS1', ex.stream || 'Science');
                        setExamAttendanceState(records);
                        setSelectedAttendanceExam(ex);
                      }}
                      className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> View / Edit Attendance
                    </button>
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
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <div className="text-right mr-1">
                        <span className="text-lg font-serif font-bold text-emerald-600">{sub.percentage}%</span>
                        <p className="text-[9px] font-bold uppercase text-emerald-700">{t('teacher.auto_graded', 'Auto-Graded')}</p>
                      </div>
                      <button
                        onClick={() => {
                          const examsList = getStoredExams();
                          const ex = examsList.find(e => e.id === sub.exam_id) || examsList[0];
                          setPreviewSubmissionModal({
                            submission: sub,
                            exam: ex
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview Answer Sheet
                      </button>
                      <button
                        onClick={() => showToast(`Recorded ${sub.student_name}'s score (${sub.percentage}%) to class broadsheet!`)}
                        className="bg-primary text-white font-bold px-3 py-2 rounded-xl text-xs hover:bg-primary/90 transition-colors"
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
    if (activeSection === 'results') {
      const activeClass = broadsheetClassFilter || formClass || 'JSS 3 Faith';
      const isSS = isSeniorSecondaryClass(activeClass);
      const classCourseList = getCoursesForClass(activeClass);
      const activeCourse = classCourseList.find(c => c.code === broadsheetSubject) || classCourseList[0] || { code: 'MTH-001', name: 'Junior Mathematics' };

      // Filter roster for the selected class or search query
      const classRoster = roster.filter(s => {
        const q = studentSearch.toLowerCase();
        const matchSearch = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
        
        if (broadsheetClassFilter) {
          const bcClean = broadsheetClassFilter.toLowerCase().replace(/\s+/g, '');
          const sGradeClean = (s.grade || '').toLowerCase().replace(/\s+/g, '');
          return matchSearch && (sGradeClean.includes(bcClean) || bcClean.includes(sGradeClean));
        }
        if (formClass) {
          const fcClean = formClass.toLowerCase().replace(/\s+/g, '');
          const sGradeClean = (s.grade || '').toLowerCase().replace(/\s+/g, '');
          return matchSearch && (sGradeClean.includes(fcClean) || fcClean.includes(sGradeClean));
        }
        return matchSearch;
      });

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">{t('teacher.manage_results', 'Manage Results & Broadsheet')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSS 
                  ? t('teacher.results_desc_ss', 'Senior Secondary (SS 1–3): Record 1st CA, 2nd CA, CBT Objective exam (Auto/Manual), and Handwritten Theory exam scores.')
                  : t('teacher.results_desc_jss', 'Junior Secondary (JSS 1–3) & Basic Education: Record handwritten 1st CA, 2nd CA, and Terminal Examination marks.')
                }
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  classRoster.forEach(student => {
                    const saved = getStudentBroadsheet(student.id);
                    saveStudentBroadsheet(student.id, saved);
                  });
                  showToast(t('teacher.sync_all_success', 'All student marks synced and published to official terminal report cards!'));
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" /> {t('teacher.sync_report_cards', 'Sync All Scores to Report Cards')}
              </button>
              <button
                onClick={() => handleOpenPromotionModal(classRoster, activeClass)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" /> {t('teacher.promote_class_btn', 'Promote Students / Session Rollover')}
              </button>
            </div>
          </div>

          {/* Controls Bar: Class Selector, Subject Picker, Search */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Class Filter */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.class_grade_label', 'Class & Arm')}</label>
                <select
                  value={broadsheetClassFilter || formClass || 'JSS 3 Faith'}
                  onChange={e => {
                    setBroadsheetClassFilter(e.target.value);
                    const newCourses = getCoursesForClass(e.target.value);
                    if (newCourses.length > 0) setBroadsheetSubject(newCourses[0].code);
                  }}
                  className="px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {formClass && (
                    <option value={formClass}>⭐ {formClass} ({t('teacher.assigned_form_class', 'Your Assigned Class')})</option>
                  )}
                  <optgroup label="🧸 Nursery & Early Years">
                    <option value="Creche">Creche</option>
                    <option value="Nursery 1 Faith">Nursery 1 Faith</option>
                    <option value="Nursery 1 Love">Nursery 1 Love</option>
                    <option value="Nursery 2 Faith">Nursery 2 Faith</option>
                    <option value="Nursery 2 Love">Nursery 2 Love</option>
                    <option value="Nursery 3 Faith">Nursery 3 Faith</option>
                    <option value="Nursery 3 Love">Nursery 3 Love</option>
                  </optgroup>
                  <optgroup label="🎒 Primary Education (Basic 1–6)">
                    <option value="Primary 1 Faith">Primary 1 Faith</option>
                    <option value="Primary 1 Love">Primary 1 Love</option>
                    <option value="Primary 2 Faith">Primary 2 Faith</option>
                    <option value="Primary 2 Love">Primary 2 Love</option>
                    <option value="Primary 3 Faith">Primary 3 Faith</option>
                    <option value="Primary 3 Love">Primary 3 Love</option>
                    <option value="Primary 4 Faith">Primary 4 Faith</option>
                    <option value="Primary 4 Love">Primary 4 Love</option>
                    <option value="Primary 5 Faith">Primary 5 Faith</option>
                    <option value="Primary 5 Love">Primary 5 Love</option>
                    <option value="Primary 6 Faith">Primary 6 Faith</option>
                    <option value="Primary 6 Love">Primary 6 Love</option>
                  </optgroup>
                  <optgroup label="📚 Junior Secondary (JSS 1–3 · Handwritten)">
                    <option value="JSS 1 Faith">JSS 1 Faith</option>
                    <option value="JSS 1 Love">JSS 1 Love</option>
                    <option value="JSS 2 Faith">JSS 2 Faith</option>
                    <option value="JSS 2 Love">JSS 2 Love</option>
                    <option value="JSS 3 Faith">JSS 3 Faith</option>
                    <option value="JSS 3 Love">JSS 3 Love</option>
                  </optgroup>
                  <optgroup label="🎓 Senior Secondary (SS 1–3 · CBT + Theory)">
                    <option value="SS 1 Science">SS 1 Science</option>
                    <option value="SS 1 Art">SS 1 Art</option>
                    <option value="SS 1 Commercial">SS 1 Commercial</option>
                    <option value="SS 2 Science">SS 2 Science</option>
                    <option value="SS 2 Art">SS 2 Art</option>
                    <option value="SS 2 Commercial">SS 2 Commercial</option>
                    <option value="SS 3 Science">SS 3 Science</option>
                    <option value="SS 3 Art">SS 3 Art</option>
                    <option value="SS 3 Commercial">SS 3 Commercial</option>
                  </optgroup>
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.active_subject_label', 'Active Subject / Course')}</label>
                <select
                  value={activeCourse.code}
                  onChange={e => setBroadsheetSubject(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
                >
                  {classCourseList.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Term */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.academic_term', 'Academic Term')}</label>
                <span className="inline-block px-3 py-2 rounded-xl bg-muted/30 border border-border text-xs font-semibold text-foreground">
                  1st Term 2026/2027
                </span>
              </div>
            </div>

            {/* Student Search & Quick Sample Populate */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('teacher.search_student_ph', 'Search pupil name or ID...')}
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/20 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => {
                  classRoster.forEach(student => {
                    const isStudentSS = isSeniorSecondaryClass(student.grade);
                    const cbtAuto = isStudentSS ? getAutomaticCBTScore(student.code || student.email, activeCourse.code) : 0;
                    handleInlineStudentScoreUpdate(student, activeCourse.code, 'ca1', isStudentSS ? 8 : 16);
                    handleInlineStudentScoreUpdate(student, activeCourse.code, 'ca2', isStudentSS ? 8 : 16);
                    if (isStudentSS) {
                      handleInlineStudentScoreUpdate(student, activeCourse.code, 'cbtScore', cbtAuto);
                      handleInlineStudentScoreUpdate(student, activeCourse.code, 'paperExam', 32);
                    } else {
                      handleInlineStudentScoreUpdate(student, activeCourse.code, 'exam', 52);
                    }
                  });
                  showToast(t('teacher.populated_sample_toast', 'Auto-populated standard assessment marks for this subject!'));
                }}
                className="px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                title={t('teacher.quick_populate_tooltip', 'Quick populate benchmark scores')}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{t('teacher.btn_auto_fill', 'Auto-Fill Benchmarks')}</span>
              </button>
            </div>
          </div>

          {/* Interactive Class Broadsheet & Scores */}
          <div>
            {selectedBroadsheetStudent ? (
              /* =========================================================
                 INDIVIDUAL STUDENT DETAILED BROADSHEET VIEW
                 ========================================================= */
              <div className="space-y-6">
                {/* Header & Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedBroadsheetStudent(null)}
                      className="p-2 rounded-xl bg-card border border-border hover:bg-accent text-foreground transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> {t('teacher.back_to_class_register', 'Back to Class Broadsheet Table')}
                    </button>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                        {t('teacher.official_student_broadsheet', 'Official Student Broadsheet — ')}<span className="text-emerald-700">{selectedBroadsheetStudent.name}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isSeniorSecondaryClass(selectedBroadsheetStudent.grade)
                          ? t('teacher.fill_ss_marks_desc', 'Senior Secondary Track: 1st CA (10), 2nd CA (10), CBT OBJ Exam (30 Auto/Manual), and Theory Exam (40).')
                          : t('teacher.fill_jss_marks_desc', 'Junior Secondary / Basic Track: 1st CA (20), 2nd CA (20), and Terminal Examination (60).')
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        saveStudentBroadsheet(selectedBroadsheetStudent.id, broadsheetScores);
                        showToast(`Saved and synced terminal scores for ${selectedBroadsheetStudent.name}!`);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> {t('teacher.btn_save_sync_report', 'Save & Sync to Report Card')}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-muted hover:bg-accent text-foreground font-bold text-xs px-3 py-2 rounded-xl border border-border transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> {t('teacher.btn_print_broadsheet', 'Print Broadsheet')}
                    </button>
                  </div>
                </div>

                {/* Student Profile Card */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-serif font-bold text-2xl border-2 border-emerald-500/20 shrink-0">
                      {selectedBroadsheetStudent.name?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-md font-mono">
                          {selectedBroadsheetStudent.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                          {selectedBroadsheetStudent.grade} ({selectedBroadsheetStudent.stream || 'Science'})
                        </span>
                        {isSeniorSecondaryClass(selectedBroadsheetStudent.grade) ? (
                          <span className="text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Zap className="w-3 h-3 text-blue-600 shrink-0" /> {t('teacher.cbt_auto_filled_tag', 'CBT OBJ Integrated')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                            {t('teacher.handwritten_exam_tag', 'Handwritten Examination')}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-lg text-foreground">{selectedBroadsheetStudent.name}</h4>
                      <p className="text-xs text-muted-foreground">{t('teacher.parent_guardian_prefix', 'Parent / Guardian: ')}<strong>{selectedBroadsheetStudent.parentName || 'Chief Nwosu'}</strong> ({selectedBroadsheetStudent.parentPhone || '08031112233'})</p>
                    </div>
                  </div>

                  {/* Summary Score Pills */}
                  {(() => {
                    const isStudentSS = isSeniorSecondaryClass(selectedBroadsheetStudent.grade);
                    const courses = getCoursesForClass(selectedBroadsheetStudent.grade || 'SS1', selectedBroadsheetStudent.stream || 'Science');
                    let grandTotal = 0;
                    courses.forEach(c => {
                      const sc = getSafeProperty(broadsheetScores, c.code) || { ca1: 0, ca2: 0, cbtScore: 0, paperExam: 0, exam: 0 };
                      if (isStudentSS) {
                        grandTotal += ((sc.ca1 || 0) + (sc.ca2 || 0) + (sc.cbtScore || 0) + (sc.paperExam || 0));
                      } else {
                        grandTotal += ((sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam !== undefined ? sc.exam : (sc.paperExam || 0)));
                      }
                    });
                    const avgScore = courses.length > 0 ? Math.round(grandTotal / courses.length) : 0;
                    const overallGrade = isStudentSS ? calculateWAECGrade(avgScore) : calculateBECEGrade(avgScore);

                    return (
                      <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-5">
                        <div className="text-center px-3 py-1 bg-muted/20 rounded-xl border border-border">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('teacher.term_average', 'Term Average')}</span>
                          <span className="text-xl font-serif font-bold text-foreground">{avgScore}%</span>
                        </div>
                        <div className="text-center px-3 py-1 bg-muted/20 rounded-xl border border-border">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            {t('teacher.academic_status_label', 'Academic Standing')}
                          </span>
                          <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${avgScore >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {avgScore >= 75 ? 'Distinction' : avgScore >= 60 ? 'Credit' : avgScore >= 50 ? 'Pass' : 'Needs Support'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Fillable Student Score Sheet Table */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-emerald-700" /> {t('teacher.subject_assessment_breakdown', 'Subject Assessment Breakdown')}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {isSeniorSecondaryClass(selectedBroadsheetStudent.grade)
                          ? t('teacher.ss_scheme_hint', 'Scheme: 1st CA, 2nd CA, CBT Exam, and Theory Exam.')
                          : t('teacher.jss_scheme_hint', 'Scheme: 1st CA, 2nd CA, and Terminal Examination.')
                        }
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                        {isSeniorSecondaryClass(selectedBroadsheetStudent.grade) ? (
                          /* SS 1 - SS 3 Headers: Student Name, Student ID, 1st CA, 2nd CA, CBT Exam, Theory Exam, Total, Teacher Remarks */
                          <tr>
                            <th className="p-3 min-w-[200px]">{t('teacher.course_subject', 'Course / Subject')}</th>
                            <th className="p-3 text-center min-w-[90px]">{t('teacher.th_1st_ca', '1st CA')}</th>
                            <th className="p-3 text-center min-w-[90px]">{t('teacher.th_2nd_ca', '2nd CA')}</th>
                            <th className="p-3 text-center min-w-[120px] bg-blue-500/10 text-blue-700">
                              <span className="flex items-center justify-center gap-1">
                                {t('teacher.th_cbt_exam', 'CBT Exam')} <Zap className="w-3 h-3 text-blue-600 shrink-0" />
                              </span>
                            </th>
                            <th className="p-3 text-center min-w-[110px]">{t('teacher.th_theory_exam', 'Theory Exam')}</th>
                            <th className="p-3 text-center min-w-[90px]">{t('teacher.total_col', 'Total')}</th>
                            <th className="p-3 min-w-[200px]">{t('teacher.teacher_remarks_col', 'Teacher Remarks')}</th>
                          </tr>
                        ) : (
                          /* JSS 1 - JSS 3 / Basic Education Headers: 1st CA, 2nd CA, Exam, Total, Teacher Remarks */
                          <tr>
                            <th className="p-3 min-w-[200px]">{t('teacher.course_subject', 'Course / Subject')}</th>
                            <th className="p-3 text-center min-w-[100px]">{t('teacher.th_1st_ca', '1st CA')}</th>
                            <th className="p-3 text-center min-w-[100px]">{t('teacher.th_2nd_ca', '2nd CA')}</th>
                            <th className="p-3 text-center min-w-[120px]">{t('teacher.th_exam', 'Exam')}</th>
                            <th className="p-3 text-center min-w-[90px]">{t('teacher.total_col', 'Total')}</th>
                            <th className="p-3 min-w-[200px]">{t('teacher.teacher_remarks_col', 'Teacher Remarks')}</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-border">
                        {getCoursesForClass(selectedBroadsheetStudent.grade || 'SS1', selectedBroadsheetStudent.stream || 'Science').map(course => {
                          const isStudentSS = isSeniorSecondaryClass(selectedBroadsheetStudent.grade);
                          const sc = getSafeProperty(broadsheetScores, course.code) || {
                            ca1: 0,
                            ca2: 0,
                            cbtScore: isStudentSS ? getAutomaticCBTScore(selectedBroadsheetStudent.code || selectedBroadsheetStudent.email, course.code) : 0,
                            paperExam: 0,
                            exam: 0,
                            remark: ''
                          };
                          
                          const total = isStudentSS
                            ? (Number(sc.ca1) || 0) + (Number(sc.ca2) || 0) + (Number(sc.cbtScore) || 0) + (Number(sc.paperExam) || 0)
                            : (Number(sc.ca1) || 0) + (Number(sc.ca2) || 0) + (sc.exam !== undefined ? (Number(sc.exam) || 0) : (Number(sc.paperExam) || 0));

                          return (
                            <tr key={course.code} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-bold text-foreground">
                                <div>
                                  <span className="font-bold text-foreground text-xs block">{course.name}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{course.code}</span>
                                </div>
                              </td>

                              {/* 1st CA Input */}
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sc.ca1 ?? 0}
                                  onChange={e => handleUpdateScoreInput(course.code, 'ca1', e.target.value)}
                                  className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </td>

                              {/* 2nd CA Input */}
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sc.ca2 ?? 0}
                                  onChange={e => handleUpdateScoreInput(course.code, 'ca2', e.target.value)}
                                  className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </td>

                              {/* For SS: CBT Exam & Theory Exam */}
                              {isStudentSS && (
                                <>
                                  <td className="p-3 text-center bg-blue-500/5 border-x border-blue-200/50">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={sc.cbtScore ?? 0}
                                      onChange={e => handleUpdateScoreInput(course.code, 'cbtScore', e.target.value)}
                                      className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-blue-300 bg-blue-50/50 text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={sc.paperExam ?? 0}
                                      onChange={e => handleUpdateScoreInput(course.code, 'paperExam', e.target.value)}
                                      className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                  </td>
                                </>
                              )}

                              {/* For JSS / Basic: Handwritten Exam Input */}
                              {!isStudentSS && (
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={sc.exam !== undefined ? sc.exam : (sc.paperExam ?? 0)}
                                    onChange={e => handleUpdateScoreInput(course.code, 'exam', e.target.value)}
                                    className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </td>
                              )}

                              {/* Total Score */}
                              <td className="p-3 text-center font-bold text-sm text-foreground font-serif">
                                {total}%
                              </td>

                              {/* Teacher Remark */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={sc.remark || ''}
                                  onChange={e => handleUpdateScoreInput(course.code, 'remark', e.target.value)}
                                  placeholder={t('teacher.remark_ph', 'Enter subject remark...')}
                                  className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Footer Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      {t('teacher.broadsheet_auto_save_notice', 'All changes are saved automatically in real-time. Click below to publish to official terminal report cards.')}
                    </p>
                    <button
                      onClick={() => {
                        saveStudentBroadsheet(selectedBroadsheetStudent.id, broadsheetScores);
                        showToast(`Successfully saved and published report card for ${selectedBroadsheetStudent.name}!`);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> {t('teacher.btn_publish_broadsheet', 'Publish Broadsheet to Report Cards')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* =========================================================
                 MAIN CLASS BROADSHEET TABLE VIEW (ALL STUDENTS LIST)
                 ========================================================= */
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-700" /> {t('teacher.broadsheet_table_title', 'Class Broadsheet & Terminal Master Register')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isSS
                        ? t('teacher.ss_table_guide', 'Senior Secondary (SS 1–3): Record 1st CA, 2nd CA, CBT Exam, and Theory Exam for ')
                        : t('teacher.jss_table_guide', 'Junior Secondary (JSS 1–3) & Basic: Record 1st CA, 2nd CA, and Exam for ')
                      }
                      <strong className="text-emerald-700">{activeCourse.name} ({activeCourse.code})</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
                      {classRoster.length} {t('teacher.enrolled_pupils_count', 'Pupils Enrolled')}
                    </span>
                  </div>
                </div>

                {/* Class Overview Banner */}
                <div className="bg-muted/20 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.selected_class_header', 'Active Class')}</span>
                    <strong className="text-base font-bold text-foreground font-serif">{activeClass}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.assessment_scheme', 'Assessment Scheme')}</span>
                    <strong className="text-xs font-bold text-emerald-700">
                      {isSS ? '1st CA + 2nd CA + CBT Exam + Theory Exam' : '1st CA + 2nd CA + Exam'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.cbt_integration', 'Examination Mode')}</span>
                    {isSS ? (
                      <strong className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {t('teacher.cbt_plus_theory', 'CBT (OBJ) + Theory')}
                      </strong>
                    ) : (
                      <strong className="text-xs font-bold text-amber-700">
                        {t('teacher.handwritten_exam_mode', '100% Handwritten Exam')}
                      </strong>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.term_status_scale', 'Terminal Score Basis')}</span>
                    <strong className="text-xs font-bold text-foreground">
                      100% Cumulative Scale
                    </strong>
                  </div>
                </div>

                {/* All Students Broadsheet Table with Direct Score Entry */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                      {isSS ? (
                        /* SS 1 - SS 3 Column Layout: Student Name, Student ID, 1st CA, 2nd CA, CBT Exam, Theory Exam, Total, Action */
                        <tr>
                          <th className="p-3 min-w-[180px]">{t('teacher.student_name_col', 'Student Name')}</th>
                          <th className="p-3 min-w-[120px]">{t('teacher.student_id_col', 'Student ID')}</th>
                          <th className="p-3 text-center min-w-[90px]">{t('teacher.th_1st_ca', '1st CA')}</th>
                          <th className="p-3 text-center min-w-[90px]">{t('teacher.th_2nd_ca', '2nd CA')}</th>
                          <th className="p-3 text-center min-w-[120px] bg-blue-500/10 text-blue-700">
                            <span className="flex items-center justify-center gap-1">
                              {t('teacher.th_cbt_exam', 'CBT Exam')} <Zap className="w-3 h-3 text-blue-600 shrink-0" />
                            </span>
                          </th>
                          <th className="p-3 text-center min-w-[110px]">{t('teacher.th_theory_exam', 'Theory Exam')}</th>
                          <th className="p-3 text-center min-w-[90px]">{t('teacher.total_col', 'Total')}</th>
                          <th className="p-3 text-right min-w-[120px]">{t('teacher.action_col', 'Action')}</th>
                        </tr>
                      ) : (
                        /* JSS 1 - JSS 3 Column Layout: Student Name, Student ID, 1st CA, 2nd CA, Exam, Total, Action */
                        <tr>
                          <th className="p-3 min-w-[180px]">{t('teacher.student_name_col', 'Student Name')}</th>
                          <th className="p-3 min-w-[120px]">{t('teacher.student_id_col', 'Student ID')}</th>
                          <th className="p-3 text-center min-w-[100px]">{t('teacher.th_1st_ca', '1st CA')}</th>
                          <th className="p-3 text-center min-w-[100px]">{t('teacher.th_2nd_ca', '2nd CA')}</th>
                          <th className="p-3 text-center min-w-[110px]">{t('teacher.th_exam', 'Exam')}</th>
                          <th className="p-3 text-center min-w-[90px]">{t('teacher.total_col', 'Total')}</th>
                          <th className="p-3 text-right min-w-[120px]">{t('teacher.action_col', 'Action')}</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classRoster.map(s => {
                        const saved = getStudentBroadsheet(s.id);
                        const sc = getSafeProperty(saved, activeCourse.code) || {
                          ca1: 0,
                          ca2: 0,
                          assignment: 0,
                          cbtScore: isSS ? getAutomaticCBTScore(s.code || s.email, activeCourse.code) : 0,
                          paperExam: 0,
                          exam: 0,
                          remark: ''
                        };

                        const rowTotal = isSS
                          ? ((Number(sc.ca1) || 0) + (Number(sc.ca2) || 0) + (Number(sc.cbtScore) || 0) + (Number(sc.paperExam) || 0))
                          : ((Number(sc.ca1) || 0) + (Number(sc.ca2) || 0) + (sc.exam !== undefined ? (Number(sc.exam) || 0) : (Number(sc.paperExam) || 0)));

                        return (
                          <tr
                            key={s.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            {/* Student Name */}
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 font-bold text-xs flex items-center justify-center font-serif shrink-0">
                                  {s.name?.[0] || 'S'}
                                </div>
                                <div>
                                  <span className="font-bold text-foreground block text-xs">{s.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{s.grade} ({s.stream || 'General'})</span>
                                </div>
                              </div>
                            </td>

                            {/* Student ID */}
                            <td className="p-3 text-muted-foreground font-mono font-bold text-xs">
                              {s.code || `TMS/${s.id}`}
                            </td>

                            {/* 1st CA Input */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sc.ca1 ?? 0}
                                onChange={e => handleInlineStudentScoreUpdate(s, activeCourse.code, 'ca1', e.target.value)}
                                className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </td>

                            {/* 2nd CA Input */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sc.ca2 ?? 0}
                                onChange={e => handleInlineStudentScoreUpdate(s, activeCourse.code, 'ca2', e.target.value)}
                                className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </td>

                            {/* SS 1-3: CBT Exam & Theory Exam */}
                            {isSS && (
                              <>
                                <td className="p-3 text-center bg-blue-500/5 border-x border-blue-200/40">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={sc.cbtScore ?? 0}
                                    onChange={e => handleInlineStudentScoreUpdate(s, activeCourse.code, 'cbtScore', e.target.value)}
                                    className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-blue-300 bg-blue-50/60 text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={sc.paperExam ?? 0}
                                    onChange={e => handleInlineStudentScoreUpdate(s, activeCourse.code, 'paperExam', e.target.value)}
                                    className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </td>
                              </>
                            )}

                            {/* JSS 1-3: Handwritten Exam */}
                            {!isSS && (
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sc.exam !== undefined ? sc.exam : (sc.paperExam ?? 0)}
                                  onChange={e => handleInlineStudentScoreUpdate(s, activeCourse.code, 'exam', e.target.value)}
                                  className="w-16 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </td>
                            )}

                            {/* Total Score */}
                            <td className="p-3 text-center font-bold text-sm text-foreground font-serif">
                              {rowTotal}%
                            </td>

                            {/* Action Button */}
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleOpenStudentBroadsheet(s)}
                                className="bg-emerald-500/10 hover:bg-emerald-700 text-emerald-700 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                {t('teacher.fill_broadsheet_btn', 'All Subjects')} <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      );
    }

    // =========================================================
    // 5. ACADEMIC HISTORY & PAST COHORTS
    // =========================================================
    if (activeSection === 'history') {
      const teacherProfile = getTeacherProfileData();
      const allHistory = getArchivedCohortsForTeacher(teacherProfile.staffId, formClass);

      // Extract unique academic sessions for filtering
      const availableSessions = Array.from(new Set(allHistory.map(h => h.academicSession))).filter(Boolean);

      // Filter historical records
      const filteredHistory = allHistory.filter(rec => {
        const matchSession = historySessionFilter === 'ALL' || rec.academicSession === historySessionFilter;
        const matchClass = historyClassFilter === 'ALL' || rec.fromClass.toLowerCase().includes(historyClassFilter.toLowerCase());
        const q = historySearch.toLowerCase();
        const matchSearch = !q || rec.studentName.toLowerCase().includes(q) || rec.studentCode.toLowerCase().includes(q) || rec.toClass.toLowerCase().includes(q);
        return matchSession && matchClass && matchSearch;
      });

      const totalArchived = filteredHistory.length;
      const totalPromoted = filteredHistory.filter(h => h.status === 'promoted' || h.status === 'graduated').length;
      const totalRepeated = filteredHistory.filter(h => h.status === 'repeated').length;
      const promotionRate = totalArchived > 0 ? Math.round((totalPromoted / totalArchived) * 100) : 100;
      const avgGPA = totalArchived > 0 
        ? (filteredHistory.reduce((acc, h) => acc + (h.cumulativeAverage || 0), 0) / totalArchived).toFixed(1)
        : '0.0';

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <History className="w-5 h-5" />
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">{t('teacher.history_title', 'Academic History & Past Cohorts')}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('teacher.history_desc', 'Permanent archive of past student cohorts, promotion logs, historical broadsheets, and past terminal report cards.')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const defaultClass = formClass || 'JSS 3 Faith';
                  const activeRoster = roster.filter(s => (s.grade || '').toLowerCase().includes(defaultClass.toLowerCase()));
                  handleOpenPromotionModal(activeRoster.length > 0 ? activeRoster : roster.slice(0, 10), defaultClass);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" /> {t('teacher.new_promotion_btn', 'Promote Current Class')}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.total_archived', 'Archived Students')}</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{totalArchived}</p>
              <span className="text-[10px] text-muted-foreground">{t('teacher.across_sessions', 'Across recorded cohorts')}</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.promoted_count', 'Promoted Students')}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalPromoted}</p>
              <span className="text-[10px] text-emerald-600/80 font-semibold">{promotionRate}% Promotion Success</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.repeated_count', 'Retained / Repeating')}</span>
                <RotateCcw className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalRepeated}</p>
              <span className="text-[10px] text-amber-600/80 font-semibold">{totalArchived > 0 ? (100 - promotionRate) : 0}% Retention</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.cohort_avg_gpa', 'Cohort Avg Score')}</span>
                <Star className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary mt-1">{avgGPA}%</p>
              <span className="text-[10px] text-muted-foreground">{t('teacher.cumulative_term_score', 'Cumulative Scale')}</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Session Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.academic_session', 'Academic Session')}</label>
                <select
                  value={historySessionFilter}
                  onChange={e => setHistorySessionFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">{t('teacher.all_sessions', 'All Academic Sessions')}</option>
                  {availableSessions.map(s => (
                    <option key={s} value={s}>{s} Session</option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.origin_class', 'Origin Class')}</label>
                <select
                  value={historyClassFilter}
                  onChange={e => setHistoryClassFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">{t('teacher.all_classes', 'All Classes')}</option>
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="SS 1">SS 1</option>
                  <option value="SS 2">SS 2</option>
                  <option value="SS 3">SS 3</option>
                </select>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('teacher.search_history_placeholder', 'Search student name, ID or class...')}
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Archived Records Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-foreground font-serif">
                  {t('teacher.past_cohort_roster', 'Past Cohort Promotion Log & Score Snapshots')}
                </h3>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {filteredHistory.length} {t('teacher.records_found', 'records archived')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">{t('teacher.student', 'Student Name')}</th>
                    <th className="py-3 px-3">{t('teacher.admission_id', 'Student ID')}</th>
                    <th className="py-3 px-3">{t('teacher.session_term', 'Session / Term')}</th>
                    <th className="py-3 px-3">{t('teacher.class_transition', 'Class Transition')}</th>
                    <th className="py-3 px-3 text-center">{t('teacher.cum_average', 'Final Average')}</th>
                    <th className="py-3 px-3 text-center">{t('teacher.promotion_status', 'Status')}</th>
                    <th className="py-3 px-4 text-right">{t('teacher.actions', 'Historical Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="max-w-xs mx-auto space-y-2">
                          <History className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                          <p className="font-bold text-foreground">{t('teacher.no_history_records', 'No historical promotion records found')}</p>
                          <p className="text-xs">{t('teacher.no_history_desc', 'When students are promoted at the end of the academic year, their broadsheet and transition records will be permanently archived here.')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((rec, idx) => (
                      <tr key={rec.id || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                              {rec.studentName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{rec.studentName}</p>
                              <p className="text-[10px] text-muted-foreground">Promoted by {rec.promotedByTeacherName || 'Form Teacher'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                            {rec.studentCode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs">
                            <span className="font-bold text-foreground block">{rec.academicSession}</span>
                            <span className="text-[10px] text-muted-foreground">{rec.term || '3rd Term'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-muted-foreground">{rec.fromClass}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="text-indigo-600 font-bold">{rec.toClass}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            rec.cumulativeAverage >= 75 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            rec.cumulativeAverage >= 60 ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                            rec.cumulativeAverage >= 50 ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {rec.cumulativeAverage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {rec.status === 'promoted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Promoted
                            </span>
                          )}
                          {rec.status === 'repeated' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <RotateCcw className="w-3 h-3" /> Repeating
                            </span>
                          )}
                          {rec.status === 'graduated' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <GraduationCap className="w-3 h-3" /> Graduated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setShowHistoryBroadsheetModal(rec)}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                              title="View Archived Broadsheet Scores"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" /> Scores
                            </button>
                            <button
                              onClick={() => {
                                // Open report card modal with historical scores
                                setSelectedReportCardStudent({
                                  id: rec.studentId,
                                  name: rec.studentName,
                                  code: rec.studentCode,
                                  grade: rec.fromClass,
                                  attendance: 96,
                                  stream: rec.toClass.includes('Art') ? 'Art' : rec.toClass.includes('Commercial') ? 'Commercial' : 'Science'
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Print Historical Terminal Report Card"
                            >
                              <Printer className="w-3.5 h-3.5" /> Report Card
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================
    // 6. TEACHER PROFILE
    if (activeSection === 'profile') return (
      <div className="space-y-6 max-w-5xl">
        {/* Clean Page Title & Single Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs ring-4 ring-emerald-500/20" />
            <h2 className="text-lg sm:text-xl font-bold font-serif text-foreground">{t('teacher.profile_title', 'Teacher Profile & Academic Records')}</h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActionsDropdown(prev => !prev)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <span>{t('teacher.actions', 'Actions')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showActionsDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActionsDropdown(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-40 py-1.5 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowEditModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('teacher.edit_profile', 'Edit Profile & Details')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowStaffIdModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors border-t border-border/50"
                  >
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>{t('teacher.view_staff_id', 'View Staff ID Card')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      window.print();
                    }}
                    className="w-full px-4 py-2.5 text-left font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors border-t border-border/50"
                  >
                    <Printer className="w-4 h-4 text-muted-foreground" />
                    <span>{t('teacher.btn_print_profile', 'Print Profile')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Single Clean Profile Card (Identical to Admin Preview Card) */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Column 1: Avatar Badge */}
            <div className="md:col-span-3 flex flex-col items-center justify-start text-center space-y-3 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-serif font-bold text-4xl text-emerald-600 shadow-sm overflow-hidden">
                  {profileForm.profileImage ? (
                    <img src={profileForm.profileImage} alt="Teacher Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profileForm.firstName?.[0] || 'A'
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  id="teacherAvatarPickerClean"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        showToast('Image size exceeds 5MB limit.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const updated = { ...profileForm, profileImage: reader.result as string };
                        setProfileForm(updated);
                        saveTeacher({
                          staffId: profileForm.staffId,
                          name: profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`,
                          profileImage: reader.result as string,
                        });
                        showToast('Profile photo updated in real time!');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label
                  htmlFor="teacherAvatarPickerClean"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-700 text-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all border border-card"
                  title={t('teacher.upload_photo', 'Upload Photo')}
                >
                  <Edit2 className="w-3 h-3" />
                </label>
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 uppercase tracking-wider block">
                  {t('teacher.status_active', 'ACTIVE')}
                </span>
                <p className="text-xs font-bold text-muted-foreground">{t('teacher.faculty_member', 'Faculty Member')}</p>
              </div>
            </div>

            {/* Column 2: Teacher Bio & Official Details */}
            <div className="md:col-span-4 space-y-3.5 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_staff_id', 'STAFF ID NUMBER')}</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 font-mono font-bold text-xs border border-emerald-500/20">
                  {profileForm.staffId || 'TMS/TCH/0054'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_full_name', 'FULL NAME & TITLE')}</span>
                <strong className="text-foreground font-bold text-sm uppercase block mt-0.5">{profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_staff_role', 'STAFF ROLE / DUTY')}</span>
                <strong className="text-emerald-700 font-bold block mt-0.5">{profileForm.roleTitle}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_academic_spec', 'ACADEMIC SPECIALIZATION')}</span>
                <strong className="text-foreground font-bold block mt-0.5">{profileForm.specialization || 'Not Specified'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_qualifications', 'QUALIFICATIONS & DEGREES')}</span>
                <strong className="text-foreground font-bold block mt-0.5">{profileForm.qualification || 'Not Specified'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_form_teacher', 'FORM TEACHER ASSIGNMENT')}</span>
                <strong className="text-rose-600 font-bold block mt-0.5">{profileForm.formClass && profileForm.formClass !== 'None' ? profileForm.formClass : 'None'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_date_joined', 'DATE JOINED FACULTY')}</span>
                <strong className="text-foreground font-bold block mt-0.5">{profileForm.joiningDate || 'Not Specified'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_phone', 'CONTACT PHONE')}</span>
                <strong className="text-foreground font-bold block mt-0.5">{profileForm.phone || 'Not Specified'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">{t('teacher.label_email', 'OFFICIAL EMAIL')}</span>
                <strong className="text-foreground font-bold underline block mt-0.5">{profileForm.email}</strong>
              </div>
            </div>

            {/* Column 3: Teaching Workload, Assigned Subjects & CBT Metrics */}
            <div className="md:col-span-5 space-y-4 text-xs border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div>
                <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 mb-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  {t('teacher.assigned_subjects_title', 'Assigned Subjects & Classes')} ({profileForm.subjectsAssigned?.length || 0})
                </h4>
                <div className="space-y-2">
                  {profileForm.subjectsAssigned && profileForm.subjectsAssigned.length > 0 ? (
                    profileForm.subjectsAssigned.map((sub: any, idx: number) => {
                      const subName = typeof sub === 'string' ? sub : sub.name;
                      const subGrade = typeof sub === 'string' ? (profileForm.formClass || 'JSS 3') : (sub.grade || profileForm.formClass || 'JSS 3');
                      const subCode = typeof sub === 'object' && sub.code ? sub.code : `SUB-${idx + 1}`;
                      return (
                        <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                              {subCode}
                            </span>
                            <span className="font-bold text-foreground">{subName}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-serif">
                            {subGrade}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground italic text-xs">{t('teacher.no_subjects_assigned', 'No subjects currently assigned by Admin.')}</p>
                  )}
                </div>
              </div>

              {/* Teaching Stats & CBT Metrics */}
              <div className="space-y-2 pt-3 border-t border-border/60">
                <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" /> {t('teacher.stats_header', 'Teaching Stats & CBT Metrics')}
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('teacher.total_students', 'TOTAL STUDENTS TAUGHT')}</p>
                    <p className="text-xl font-serif font-bold text-foreground mt-0.5">{profileForm.studentsCount ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('teacher.cbt_assessments', 'CBT ASSESSMENTS')}</p>
                    <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">{profileForm.cbtExamsCount ?? 0} Created</p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('teacher.attendance_rate', 'CLASS ATTENDANCE RATE')}</p>
                    <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">{profileForm.attendanceRate || '0%'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('teacher.residential_address', 'RESIDENTIAL ADDRESS')}</p>
                    <p className="text-xs font-semibold text-foreground truncate mt-1">{profileForm.address || 'Not Provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Comprehensive Edit Profile & Biometrics Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-foreground text-lg sm:text-xl">{t('teacher.edit_modal_title', 'Edit Complete Profile & Faculty Records')}</h3>
                    <p className="text-xs text-muted-foreground">{t('teacher.edit_modal_desc', 'All edits persist to your official records, Django backend, and Admin Portal in real time.')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
                  saveTeacher({
                    staffId: profileForm.staffId,
                    name: fullName,
                    email: profileForm.email,
                    phone: profileForm.phone,
                    department: profileForm.department,
                    specialization: profileForm.specialization,
                    qualification: profileForm.qualification,
                    gender: profileForm.gender,
                    dob: profileForm.dob,
                    address: profileForm.address,
                    bio: profileForm.bio,
                    formTeacherOf: profileForm.formClass || formClass,
                    profileImage: profileForm.profileImage,
                    salary: profileForm.salary,
                    bankName: profileForm.bankName,
                    accountNumber: profileForm.accountNumber,
                    joined: profileForm.joiningDate,
                  });

                  // Sync auth session in localStorage
                  try {
                    const currentAuth = JSON.parse(localStorage.getItem('tarepet_auth_user') || '{}');
                    if (currentAuth && currentAuth.email) {
                      currentAuth.first_name = profileForm.firstName;
                      currentAuth.last_name = profileForm.lastName;
                      currentAuth.phone = profileForm.phone;
                      currentAuth.email = profileForm.email;
                      if (!currentAuth.profile) currentAuth.profile = {};
                      currentAuth.profile.teacher_id = profileForm.staffId;
                      currentAuth.profile.gender = profileForm.gender;
                      currentAuth.profile.dob = profileForm.dob;
                      currentAuth.profile.address = profileForm.address;
                      currentAuth.profile.qualifications = profileForm.qualification;
                      currentAuth.profile.specialization = profileForm.specialization;
                      currentAuth.profile.department = profileForm.department;
                      currentAuth.profile.form_teacher_of = profileForm.formClass || formClass;
                      currentAuth.profile.hire_date = profileForm.joiningDate;
                      currentAuth.profile.salary = profileForm.salary;
                      currentAuth.profile.bank_name = profileForm.bankName;
                      currentAuth.profile.account_number = profileForm.accountNumber;
                      currentAuth.profile.bio = profileForm.bio;
                      currentAuth.profile.profileImage = profileForm.profileImage;
                      localStorage.setItem('tarepet_auth_user', JSON.stringify(currentAuth));
                      localStorage.setItem('tarepet_user', JSON.stringify(currentAuth));
                    }
                  } catch (err) {}

                  // Send to backend DB for persistence
                  authClient.patch('/auth/me/', {
                    first_name: profileForm.firstName,
                    last_name: profileForm.lastName,
                    phone: profileForm.phone,
                    email: profileForm.email,
                    profile: {
                      teacher_id: profileForm.staffId,
                      gender: profileForm.gender,
                      dob: profileForm.dob,
                      address: profileForm.address,
                      department: profileForm.department,
                      qualifications: profileForm.qualification,
                      specialization: profileForm.specialization,
                      form_teacher_of: profileForm.formClass || formClass,
                      hire_date: profileForm.joiningDate,
                      salary: profileForm.salary,
                      bank_name: profileForm.bankName,
                      account_number: profileForm.accountNumber,
                      bio: profileForm.bio,
                      profileImage: profileForm.profileImage,
                    }
                  }).catch(() => {});

                  window.dispatchEvent(new Event('cbt_store_updated'));
                  window.dispatchEvent(new Event('storage'));
                  showToast(t('teacher.profile_sync_success', 'Profile & image updated and synced to Admin Portal in real time!'));
                  setShowEditModal(false);
                }}
                className="space-y-6 text-xs"
              >
                {/* 1. Profile Photo / Avatar Live Uploader */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-serif font-bold text-2xl text-emerald-700 shadow-sm overflow-hidden shrink-0">
                    {profileForm.profileImage ? (
                      <img src={profileForm.profileImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      `${profileForm.firstName?.[0] || 'T'}${profileForm.lastName?.[0] || 'M'}`
                    )}
                  </div>
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <input
                      type="file"
                      accept="image/*"
                      id="teacherEditPhotoModalInput"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const updatedImg = reader.result as string;
                            setProfileForm(prev => ({ ...prev, profileImage: updatedImg }));
                            showToast('Photo uploaded! Click "Save Changes" to apply.');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label
                        htmlFor="teacherEditPhotoModalInput"
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t('teacher.upload_new_photo', 'Upload New Photo')}</span>
                      </label>
                      {profileForm.profileImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm(prev => ({ ...prev, profileImage: '' }));
                            showToast('Photo removed.');
                          }}
                          className="px-3 py-1.5 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('teacher.remove_photo_btn', 'Remove')}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t('teacher.photo_format_hint', 'JPG, PNG, or WEBP. Image updates real-time across Teacher & Admin views.')}</p>
                  </div>
                </div>

                {/* 2. Personal & Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> {t('teacher.personal_contact_details', 'Personal & Contact Details')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.first_name', 'First Name')}</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.last_name', 'Last Name')}</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.official_email_label', 'Official Email Address')}</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.contact_phone_label', 'Contact Phone Number')}</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.gender_label', 'Gender')}</label>
                      <select
                        value={profileForm.gender || 'Male'}
                        onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Male">{t('teacher.gender_male', 'Male')}</option>
                        <option value="Female">{t('teacher.gender_female', 'Female')}</option>
                        <option value="Other">{t('teacher.gender_other', 'Other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.dob_label', 'Date of Birth')}</label>
                      <input
                        type="date"
                        value={profileForm.dob || '1990-01-01'}
                        onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.residential_address_label', 'Residential Address')}</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="e.g. Tarepet School Campus, Yenagoa, Bayelsa State"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Academic & Faculty Credentials */}
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> {t('teacher.academic_credentials_header', 'Academic & Faculty Credentials')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.staff_role_label', 'Staff Role / Duty / Title')}</label>
                      <input
                        type="text"
                        value={profileForm.roleTitle}
                        onChange={e => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                        placeholder="e.g. Senior Subject Teacher & Head of Sciences"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.teaching_division_label', 'Teaching Division / Department')}</label>
                      <select
                        value={profileForm.department || 'Senior Secondary (SS 1 - SS 3)'}
                        onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Senior Secondary (SS 1 - SS 3)">{t('teacher.div_ss', 'Senior Secondary (SS 1 - SS 3)')}</option>
                        <option value="Junior Secondary (JSS 1 - JSS 3)">{t('teacher.div_jss', 'Junior Secondary (JSS 1 - JSS 3)')}</option>
                        <option value="Primary Department (Primary 1 - 5)">{t('teacher.div_pri', 'Primary Department (Primary 1 - 5)')}</option>
                        <option value="Nursery Department (Nursery 1 - 3)">{t('teacher.div_nur', 'Nursery Department (Nursery 1 - 3)')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.form_teacher_assignment_label', 'Form Teacher Assignment')}</label>
                      <select
                        value={profileForm.formClass || 'None'}
                        onChange={e => setProfileForm({ ...profileForm, formClass: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="None">{t('teacher.form_none', 'None (Subject Specialist Only)')}</option>
                        <option value="Nursery 1">{t('teacher.form_n1', 'Nursery 1')}</option>
                        <option value="Nursery 2">{t('teacher.form_n2', 'Nursery 2')}</option>
                        <option value="Nursery 3">{t('teacher.form_n3', 'Nursery 3')}</option>
                        <option value="Primary 1">{t('teacher.form_p1', 'Primary 1')}</option>
                        <option value="Primary 2">{t('teacher.form_p2', 'Primary 2')}</option>
                        <option value="Primary 3">{t('teacher.form_p3', 'Primary 3')}</option>
                        <option value="Primary 4">{t('teacher.form_p4', 'Primary 4')}</option>
                        <option value="Primary 5">{t('teacher.form_p5', 'Primary 5')}</option>
                        <option value="JSS 1">{t('teacher.form_j1', 'JSS 1')}</option>
                        <option value="JSS 2">{t('teacher.form_j2', 'JSS 2')}</option>
                        <option value="JSS 3">{t('teacher.form_j3', 'JSS 3')}</option>
                        <option value="SS 1 Science">{t('teacher.form_ss1_sci', 'SS 1 Science')}</option>
                        <option value="SS 1 Art">{t('teacher.form_ss1_art', 'SS 1 Art')}</option>
                        <option value="SS 2 Science">{t('teacher.form_ss2_sci', 'SS 2 Science')}</option>
                        <option value="SS 2 Art">{t('teacher.form_ss2_art', 'SS 2 Art')}</option>
                        <option value="SS 3 Science">{t('teacher.form_ss3_sci', 'SS 3 Science')}</option>
                        <option value="SS 3 Art">{t('teacher.form_ss3_art', 'SS 3 Art')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.date_joined_label', 'Date Joined Faculty')}</label>
                      <input
                        type="text"
                        value={profileForm.joiningDate || 'September 2021'}
                        onChange={e => setProfileForm({ ...profileForm, joiningDate: e.target.value })}
                        placeholder="e.g. September 2021"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.academic_specialization_label', 'Academic Specialization')}</label>
                      <input
                        type="text"
                        value={profileForm.specialization}
                        onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })}
                        placeholder="e.g. Pure & Applied Mathematics, Physics & STEM"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.qualifications_degrees_label', 'Qualifications & TRCN Degrees')}</label>
                      <input
                        type="text"
                        value={profileForm.qualification}
                        onChange={e => setProfileForm({ ...profileForm, qualification: e.target.value })}
                        placeholder="e.g. B.Sc. Ed (Mathematics), M.Sc. Statistics, TRCN Certified"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Staff ID & Employment / Banking */}
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> {t('teacher.staff_id_banking_header', 'Staff ID & Banking Information')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.staff_id_num_label', 'Staff ID Number')}</label>
                      <input
                        type="text"
                        value={profileForm.staffId}
                        onChange={e => setProfileForm({ ...profileForm, staffId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.bank_name_label', 'Bank Name')}</label>
                      <input
                        type="text"
                        value={profileForm.bankName || ''}
                        onChange={e => setProfileForm({ ...profileForm, bankName: e.target.value })}
                        placeholder="e.g. First Bank of Nigeria"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{t('teacher.account_num_label', 'Account Number')}</label>
                      <input
                        type="text"
                        value={profileForm.accountNumber || ''}
                        onChange={e => setProfileForm({ ...profileForm, accountNumber: e.target.value })}
                        placeholder="e.g. 0123456789"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Biometrics Activation */}
                <div className="p-4 rounded-2xl border border-border bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Fingerprint className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-foreground text-xs">{t('teacher.biometrics_modal_header', 'Biometric Authentication')}</p>
                        <p className="text-[10px] text-muted-foreground">{t('teacher.biometrics_modal_desc', 'Android Fingerprint, Apple Face ID / Touch ID, Windows Hello')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={biometricLoading}
                      onClick={async () => {
                        setBiometricLoading(true);
                        const emailVal = profileForm.email || (user?.email) || profileForm.staffId;
                        if (biometricsEnabled) {
                          unenrollBiometrics(emailVal);
                          setBiometricsEnabled(false);
                          showToast('Biometric authentication deactivated for this device.');
                        } else {
                          const res = await enrollBiometrics({
                            email: emailVal,
                            name: `${profileForm.firstName} ${profileForm.lastName}`,
                            role: 'TEACHER',
                            staffId: profileForm.staffId,
                          });
                          if (res.success) {
                            setBiometricsEnabled(true);
                            showToast(`Biometric login (${res.biometricType === 'FACE_ID' ? 'Face ID' : 'Fingerprint'}) activated successfully!`);
                          } else {
                            showToast(res.error || 'Failed to activate biometric login.');
                          }
                        }
                        setBiometricLoading(false);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                        biometricsEnabled
                          ? 'border border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-emerald-700/20'
                      }`}
                    >
                      <span>{biometricLoading ? 'Processing...' : biometricsEnabled ? 'Deactivate Biometrics' : 'Activate Fingerprint / Face ID'}</span>
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                  >
                    {t('teacher.btn_cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t('teacher.btn_save_changes', 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

        {/* Biometric Security Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-emerald-600" /> Biometric Authentication (Fingerprint & Face ID)
            </h3>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
              biometricsEnabled ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
            }`}>
              {biometricsEnabled ? 'Active / Enabled' : 'Not Activated'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <p className="font-bold text-xs text-foreground">{t('teacher.biometrics_device_title', 'Android Fingerprint & Apple Face ID / Touch ID')}</p>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-md">
                {t('teacher.biometrics_device_desc', 'Fast, 1-touch passwordless biometric sign-in directly on this device using Android fingerprint sensors, Apple Face ID / Touch ID, or Windows Hello.')}
              </p>
            </div>

            <button
              type="button"
              disabled={biometricLoading}
              onClick={async () => {
                const email = user?.email || (user?.profile as any)?.teacher_id || profileForm.email;
                const name = `${profileForm.firstName} ${profileForm.lastName}`.trim();
                setBiometricLoading(true);
                try {
                  if (biometricsEnabled) {
                    unenrollBiometrics(email);
                    setBiometricsEnabled(false);
                    showToast('Biometric authentication removed successfully.');
                  } else {
                    const res = await enrollBiometrics({
                      email,
                      name,
                      role: 'TEACHER',
                      staffId: profileForm.staffId,
                    });
                    if (res.success) {
                      setBiometricsEnabled(true);
                      showToast(`Biometric authentication activated for this device!`);
                    } else {
                      showToast(res.error || 'Biometric registration failed. Ensure your device sensor is enabled.');
                    }
                  }
                } finally {
                  setBiometricLoading(false);
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 ${
                biometricsEnabled
                  ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>{biometricLoading ? 'Processing...' : (biometricsEnabled ? 'Deactivate Biometrics' : 'Activate Fingerprint / Face ID')}</span>
            </button>
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

        {/* ── REGISTER NEW STUDENT MODAL (NURSERY, PRIMARY & SECONDARY) ── */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150" onClick={() => setShowAddStudentModal(false)}>
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">{t('teacher.reg_new_pupil_title', 'Register New Pupil / Student')}</h3>
                    <p className="text-xs text-muted-foreground">{t('teacher.reg_new_pupil_desc', 'Complete student registration across Nursery, Primary, or Secondary classes.')}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-xl hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudentSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* 1. Class & Stream Placement */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <School className="w-4 h-4" /> {t('teacher.academic_placement_header', 'Academic Placement & Grade Level')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.target_class_label', 'Target Class / Grade Level *')}</label>
                      <select
                        value={addStudentForm.grade}
                        onChange={e => setAddStudentForm({ ...addStudentForm, grade: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                      >
                        <optgroup label="🧸 Nursery & Early Years">
                          <option value="Creche / Toddler">👶 Creche / Toddler</option>
                          <option value="Nursery 1">🧸 Nursery 1</option>
                          <option value="Nursery 2">🧸 Nursery 2</option>
                          <option value="Nursery 3">🧸 Nursery 3</option>
                        </optgroup>
                        <optgroup label="🎒 Primary Education">
                          <option value="Primary 1">🎒 Primary 1</option>
                          <option value="Primary 2">🎒 Primary 2</option>
                          <option value="Primary 3">🎒 Primary 3</option>
                          <option value="Primary 4">🎒 Primary 4</option>
                          <option value="Primary 5">🎒 Primary 5</option>
                          <option value="Primary 6">🎒 Primary 6</option>
                        </optgroup>
                        <optgroup label="📚 Junior Secondary">
                          <option value="JSS 1">📚 JSS 1</option>
                          <option value="JSS 2">📚 JSS 2</option>
                          <option value="JSS 3">📚 JSS 3</option>
                        </optgroup>
                        <optgroup label="🎓 Senior Secondary">
                          <option value="SS 1">🎓 SS 1</option>
                          <option value="SS 2">🎓 SS 2</option>
                          <option value="SS 3">🎓 SS 3</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.class_arm_label', 'Class Arm / Stream')}</label>
                      <select
                        value={addStudentForm.stream}
                        onChange={e => setAddStudentForm({ ...addStudentForm, stream: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="General / Early Years">{t('teacher.stream_general', 'General / Early Years (Nursery)')}</option>
                        <option value="Faith Arm">{t('teacher.stream_faith', 'Faith Arm (Montessori)')}</option>
                        <option value="Love Arm">{t('teacher.stream_love', 'Love Arm (Montessori)')}</option>
                        <option value="Grace Arm">{t('teacher.stream_grace', 'Grace Arm (Montessori)')}</option>
                        <option value="Science">{t('teacher.stream_science', 'Science Stream (Secondary)')}</option>
                        <option value="Arts & Humanities">{t('teacher.stream_arts', 'Arts & Humanities (Secondary)')}</option>
                        <option value="Commercial">{t('teacher.stream_commercial', 'Commercial Stream (Secondary)')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Personal Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.student_full_name_label', 'Student Full Name *')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('teacher.student_full_name_placeholder', 'e.g. Chukwuemeka Amadi')}
                      value={addStudentForm.name}
                      onChange={e => setAddStudentForm({ ...addStudentForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.gender_label', 'Gender')}</label>
                    <select
                      value={addStudentForm.gender}
                      onChange={e => setAddStudentForm({ ...addStudentForm, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Male">{t('teacher.gender_male', 'Male')}</option>
                      <option value="Female">{t('teacher.gender_female', 'Female')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.dob_label', 'Date of Birth')}</label>
                    <input
                      type="date"
                      value={addStudentForm.dob}
                      onChange={e => setAddStudentForm({ ...addStudentForm, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.student_email_label', 'Student Email (Optional)')}</label>
                    <input
                      type="email"
                      placeholder={t('teacher.student_email_placeholder', 'Auto-generated if left blank')}
                      value={addStudentForm.email}
                      onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* 3. Parent & Guardian Contact */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" /> {t('teacher.parent_info_header', 'Parent / Guardian Information')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.parent_name_label', 'Parent / Guardian Name')}</label>
                      <input
                        type="text"
                        placeholder={t('teacher.parent_name_placeholder', 'e.g. Dr. & Mrs. Amadi')}
                        value={addStudentForm.parentName}
                        onChange={e => setAddStudentForm({ ...addStudentForm, parentName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.parent_phone_label', 'Parent Contact Phone')}</label>
                      <input
                        type="text"
                        placeholder="+234 800 000 0000"
                        value={addStudentForm.parentPhone}
                        onChange={e => setAddStudentForm({ ...addStudentForm, parentPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block mb-1">{t('teacher.res_address_label', 'Residential Address')}</label>
                    <input
                      type="text"
                      placeholder={t('teacher.res_address_placeholder', 'e.g. 12 Kpansia-Epie Road, Yenagoa, Bayelsa State')}
                      value={addStudentForm.address}
                      onChange={e => setAddStudentForm({ ...addStudentForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    {t('teacher.cancel_btn', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t('teacher.save_student_record_btn', 'Save Student Record')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── CBT STUDENT ATTENDANCE & INVIGILATION MODAL ── */}
        {selectedAttendanceExam && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" /> Student Attendance & Exam Invigilation
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('teacher.exam_label', 'Exam:')} <span className="font-bold text-foreground">{selectedAttendanceExam.title}</span> ({selectedAttendanceExam.course_name || selectedAttendanceExam.course_code} — {selectedAttendanceExam.class || 'SS1'} {selectedAttendanceExam.stream || 'Science'})
                  </p>
                </div>
                <button onClick={() => setSelectedAttendanceExam(null)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Launch Mode Switcher */}
                <div className="bg-card border border-border rounded-2xl p-1.5 flex gap-1 shadow-xs">
                  <button
                    onClick={() => setExamStartMode('GENERAL')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      examStartMode === 'GENERAL'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Users className="w-4 h-4" /> 👥 Start General Exam (Whole Class)
                  </button>
                  <button
                    onClick={() => setExamStartMode('INDIVIDUAL')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      examStartMode === 'INDIVIDUAL'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> 👤 Start Individual Student Exam
                  </button>
                </div>

                {/* Individual Student Controls */}
                {examStartMode === 'INDIVIDUAL' && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">{t('teacher.config_ind_exam', 'Configure Individual Student Exam')}</h4>
                    <p className="text-xs text-blue-800">{t('teacher.config_ind_exam_desc', 'Select a specific student to grant individual exam authorization (e.g. for re-take or makeup test).')}</p>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-blue-800 block mb-1">{t('teacher.select_target_pupil', 'Select Target Pupil')}</label>
                      <select
                        value={selectedStudentForIndividual}
                        onChange={e => setSelectedStudentForIndividual(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-blue-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {examAttendanceState.map(st => (
                          <option key={st.studentId} value={st.studentId}>
                            {st.studentName} ({st.studentId}) — {st.markedPresent ? '✓ Certified Present' : '❌ Marked Absent'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const targetSt = examAttendanceState.find(r => r.studentId === selectedStudentForIndividual) || examAttendanceState[0];
                      if (!targetSt) return null;

                      if (!targetSt.markedPresent) {
                        return (
                          <div className="p-3.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs space-y-2">
                            <div className="flex items-center gap-2 font-bold">
                              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>{t('teacher.attendance_warning_absent', 'Attendance Warning: Student Marked Absent')}</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              {t('teacher.form_teacher_certify', 'Form Teacher must certify that ')} <strong>{targetSt.studentName}</strong> {t('teacher.present_in_hall_suffix', 'is Present in the Examination Hall before starting this individual exam.')}
                            </p>
                            <button
                              onClick={() => {
                                const updated = examAttendanceState.map(r => r.studentId === targetSt.studentId ? { ...r, markedPresent: true } : r);
                                setExamAttendanceState(updated);
                                setStudentExamAttendance(
                                  selectedAttendanceExam.id,
                                  targetSt.studentId,
                                  targetSt.studentName,
                                  targetSt.class,
                                  targetSt.stream,
                                  true,
                                  user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Teacher Invigilator' : 'Teacher Invigilator'
                                );
                                showToast(`Certified ${targetSt.studentName} PRESENT in examination hall!`);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow-sm"
                            >
                              ✓ Certify {targetSt.studentName} Present & Enable Exam
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>{t('teacher.student_certified_present', 'Student Certified Present in Hall')}</span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            <strong>{targetSt.studentName}</strong> has been certified Present. You may now launch their individual CBT exam session.
                          </p>
                          <button
                            onClick={() => {
                              updateExamStatus(selectedAttendanceExam.id, 'ACTIVE');
                              showToast(`Launched individual CBT exam session for ${targetSt.studentName}!`);
                              setSelectedAttendanceExam(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-md flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" /> Start Individual Exam for {targetSt.studentName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Hall Attendance Policy */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-900 block text-sm">{t('teacher.hall_attendance_policy', 'Hall Attendance Clearance Policy')}</span>
                    <p className="text-emerald-700 text-[11px] mt-0.5">{t('teacher.only_students_marked', 'Only students marked ')}<strong className="text-emerald-900">{t('teacher.present_status')}</strong> {t('teacher.below_granted_access', 'below will be granted access to start this examination in their student portal.')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const updated = examAttendanceState.map(r => ({ ...r, markedPresent: true }));
                        setExamAttendanceState(updated);
                        markAllStudentsAttendance(
                          selectedAttendanceExam.id,
                          updated.map(u => ({ studentId: u.studentId, studentName: u.studentName, class: u.class, stream: u.stream })),
                          true,
                          user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Teacher Invigilator' : 'Teacher Invigilator'
                        );
                        showToast('Certified all students PRESENT in examination hall!');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors"
                    >
                      ✓ {t('teacher.mark_all_present', 'Mark All Present')}
                    </button>
                    <button
                      onClick={() => {
                        const updated = examAttendanceState.map(r => ({ ...r, markedPresent: false }));
                        setExamAttendanceState(updated);
                        markAllStudentsAttendance(
                          selectedAttendanceExam.id,
                          updated.map(u => ({ studentId: u.studentId, studentName: u.studentName, class: u.class, stream: u.stream })),
                          false,
                          user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Teacher Invigilator' : 'Teacher Invigilator'
                        );
                      }}
                      className="px-3 py-1.5 bg-muted text-foreground border border-border rounded-lg text-[11px] font-semibold hover:bg-muted/70 transition-colors"
                    >
                      {t('teacher.clear_all', 'Clear All')}
                    </button>
                  </div>
                </div>

                {/* Attendance Count Badge */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    {t('teacher.class_roster_prefix', 'Class Roster (')}{examAttendanceState.length}{t('teacher.class_roster_suffix', ' Students)')}
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-100 px-3 py-0.5 rounded-full text-[11px]">
                    {examAttendanceState.filter(r => r.markedPresent).length} / {examAttendanceState.length} {t('teacher.present_and_cleared', 'Present & Cleared')}
                  </span>
                </div>

                {/* Student Roster List */}
                <div className="space-y-2">
                  {examAttendanceState.map(student => (
                    <div
                      key={student.studentId}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        student.markedPresent
                          ? 'bg-emerald-500/5 border-emerald-200'
                          : 'bg-card border-border hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                          student.markedPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
                        }`}>
                          👨‍🎓
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-foreground">{student.studentName}</h4>
                            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{student.studentId}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{student.class} {student.stream} {t('teacher.student_label', 'Student')}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const newPresent = !student.markedPresent;
                          const updated = examAttendanceState.map(r => r.studentId === student.studentId ? { ...r, markedPresent: newPresent } : r);
                          setExamAttendanceState(updated);
                          setStudentExamAttendance(
                            selectedAttendanceExam.id,
                            student.studentId,
                            student.studentName,
                            student.class,
                            student.stream,
                            newPresent,
                            user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Teacher Invigilator' : 'Teacher Invigilator'
                          );
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          student.markedPresent
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {student.markedPresent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('teacher.present_and_cleared', 'Present & Cleared')}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> {t('teacher.mark_present_btn', 'Mark Present')}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                <button onClick={() => setSelectedAttendanceExam(null)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">{t('teacher.close_btn', 'Close')}</button>
                {examStartMode === 'GENERAL' && (
                  <button
                    onClick={() => {
                      const presentCount = examAttendanceState.filter(r => r.markedPresent).length;
                      if (presentCount === 0) {
                        alert('Please mark at least 1 student as Present in the examination hall before starting the exam.');
                        return;
                      }
                      updateExamStatus(selectedAttendanceExam.id, 'ACTIVE');
                      showToast(`Activated General Exam "${selectedAttendanceExam.title}"! ${presentCount} students marked PRESENT and cleared to begin.`);
                      setSelectedAttendanceExam(null);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-colors"
                  >
                    <Send className="w-4 h-4" /> Start General Exam for All Present Students
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PREVIEW STUDENT CBT ANSWER SHEET MODAL ── */}
        {previewSubmissionModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    👨‍🎓
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">
                      {previewSubmissionModal.submission.student_name}'s Answer Sheet Preview
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('teacher.exam_label', 'Exam:')} <span className="font-bold text-foreground">{previewSubmissionModal.submission.exam_title}</span> ({previewSubmissionModal.submission.course_code})
                    </p>
                  </div>
                </div>
                <button onClick={() => setPreviewSubmissionModal(null)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Performance Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">{t('teacher.student_info_header', 'Student Information')}</span>
                    <h4 className="font-bold text-sm text-foreground">{previewSubmissionModal.submission.student_name}</h4>
                    <p className="text-xs text-muted-foreground">ID: {previewSubmissionModal.submission.student_id} • Class: {previewSubmissionModal.submission.class} {previewSubmissionModal.submission.stream}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t('teacher.submitted_label', 'Submitted: ')}{new Date(previewSubmissionModal.submission.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.verified_score_label', 'Verified Score')}</span>
                      <span className="text-2xl font-serif font-bold text-emerald-600">{previewSubmissionModal.submission.score} / {previewSubmissionModal.submission.total_possible}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-600 text-lg border border-emerald-500/20">
                      {previewSubmissionModal.submission.percentage}%
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground px-1">
                  {t('teacher.question_response_audit_prefix', 'Question-by-Question Response Audit (')}{previewSubmissionModal.exam?.questions?.length || 0} Questions)
                </h4>

                <div className="space-y-3">
                  {(previewSubmissionModal.exam?.questions || []).map((q: any, idx: number) => {
                    const studentAns = getSafeProperty(previewSubmissionModal.submission.answers || {}, q.id) || 'Not Answered';
                    const isCorrect = studentAns === q.correct_option;
                    return (
                      <div key={q.id || idx} className={`p-4 rounded-2xl border transition-all ${isCorrect ? 'bg-emerald-500/5 border-emerald-200' : 'bg-rose-500/5 border-rose-200'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-[10px] shrink-0 font-mono">{idx + 1}</span>
                            {q.question_text}
                          </h5>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                            {isCorrect ? '✓ Correct (+1 pt)' : '❌ Incorrect (0 pt)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          {['A', 'B', 'C', 'D'].map(optKey => {
                            const optProp = `option_${optKey.toLowerCase()}`;
                            const optText = getSafeProperty(q, optProp);
                            const isSelected = studentAns === optKey;
                            const isCorrectOpt = q.correct_option === optKey;
                            return (
                              <div
                                key={optKey}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  isCorrectOpt
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 font-bold'
                                    : isSelected
                                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-900 font-bold'
                                    : 'bg-card border-border text-muted-foreground'
                                }`}
                              >
                                <span><strong className="mr-1">{optKey}.</strong> {String(optText || '')}</span>
                                {isCorrectOpt && <span className="text-[10px] font-bold text-emerald-700">✓ Correct</span>}
                                {isSelected && !isCorrectOpt && <span className="text-[10px] font-bold text-rose-700">{t('teacher.selected_incorrect', 'Selected ❌')}</span>}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-muted/20 border border-border/50 text-[11px] text-muted-foreground">
                            <strong className="text-foreground">{t('teacher.solution_explanation_prefix', 'Solution Explanation:')}</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                <button onClick={() => setPreviewSubmissionModal(null)} className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-sm">
                  {t('teacher.close_audit_preview_btn', 'Close Audit Preview')}
                </button>
                <button
                  onClick={() => {
                    showToast(`Student CBT Answer sheet for ${previewSubmissionModal.submission.student_name} verified!`);
                    setPreviewSubmissionModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition"
                >
                  ✓ Confirm & Sync Score
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post-Login Teacher Password Configuration Modal */}
        {showPasswordPromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border space-y-4">
              <div className="flex items-center gap-3 text-primary border-b border-border pb-3">
                <Lock className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-lg font-serif font-bold text-foreground">{t('teacher.pwd_modal_title', 'Teacher Password Configuration')}</h3>
                  <p className="text-xs text-muted-foreground">{t('teacher.pwd_modal_sub', 'Configure main account security')}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl text-xs space-y-1">
                <p className="font-bold">🔑 {t('teacher.initial_creds_detected', 'Initial Credentials Detected')}</p>
                <p className="text-[11px] leading-relaxed">
                  {t('teacher.pwd_modal_desc', 'You logged in using your Staff ID. You can set a custom main password below, or choose to keep your Staff ID as your password.')}
                </p>
              </div>

              {pwdModalError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pwdModalError}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setPwdModalError(null);
                if (!newPasswordVal || newPasswordVal.length < 6) {
                  setPwdModalError('Password must be at least 6 characters long.');
                  return;
                }
                if (newPasswordVal !== confirmPasswordVal) {
                  setPwdModalError('Passwords do not match.');
                  return;
                }
                setPwdModalLoading(true);
                const sId = (user?.profile as any)?.teacher_id || (user as any)?.staffId || 'TMS/TCH/0001';
                saveTeacher({
                  staffId: sId,
                  name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                  email: user?.email || '',
                  password: newPasswordVal,
                });
                try {
                  await authClient.post('/auth/change-password/', {
                    old_password: sId,
                    new_password: newPasswordVal,
                  });
                } catch {}
                markPasswordModalSeen();
                setPwdModalLoading(false);
                setShowPasswordPromptModal(false);
                showToast('Your new custom password has been set as your main password!');
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">{t('teacher.new_custom_password', 'New Custom Password')}</label>
                  <input
                    type="password"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">{t('teacher.confirm_custom_password', 'Confirm Custom Password')}</label>
                  <input
                    type="password"
                    value={confirmPasswordVal}
                    onChange={(e) => setConfirmPasswordVal(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      markPasswordModalSeen();
                      setShowPasswordPromptModal(false);
                      showToast('Kept Staff ID as default password.');
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted text-foreground transition-colors"
                  >
                    {t('teacher.keep_staff_id', 'Keep Staff ID')}
                  </button>
                  <button
                    type="submit"
                    disabled={pwdModalLoading || !newPasswordVal}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {pwdModalLoading ? t('teacher.saving', 'Saving...') : t('teacher.set_main_password', 'Set Main Password')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🎓 STUDENT PROMOTION & SESSION ROLLOVER MODAL */}
        {/* ========================================================= */}
        {showPromotionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-indigo-950/20">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">
                      {t('teacher.promotion_modal_title', 'End-of-Session Student Promotion & Rollover')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('teacher.promotion_modal_subtitle', 'Review passing thresholds, adjust destinations, and transition the current cohort to the new academic session.')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromotionModal(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Configuration Strip */}
              <div className="p-4 bg-muted/20 border-b border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                    {t('teacher.new_target_session', 'Target Academic Session')}
                  </label>
                  <input
                    type="text"
                    value={promotionSession}
                    onChange={e => setPromotionSession(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-foreground"
                    placeholder="e.g. 2026/2027"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                    {t('teacher.promotion_term_label', 'Current Promotion Term')}
                  </label>
                  <select
                    value={promotionTerm}
                    onChange={e => setPromotionTerm(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-foreground"
                  >
                    <option value="3rd Term">3rd Term (Annual Final Promotion)</option>
                    <option value="2nd Term">2nd Term Mid-Year Transition</option>
                    <option value="1st Term">1st Term Exception Transition</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPromotionSelections(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(id => {
                          const avg = next[id].cumulativeAverage;
                          const currentClass = broadsheetClassFilter || formClass || 'JSS 3 Faith';
                          const s = roster.find(r => r.id === id);
                          const dest = getNextProgressiveClass(currentClass, s?.stream);
                          next[id] = {
                            ...next[id],
                            status: avg >= 50 ? (dest === 'Graduated (Alumni)' ? 'graduated' : 'promoted') : 'repeated',
                            toClass: avg >= 50 ? dest : currentClass
                          };
                        });
                        return next;
                      });
                      showToast('Auto-selected: ≥ 50% Promoted, < 50% Repeating.');
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ⚡ Auto-select (≥ 50% Pass)
                  </button>
                </div>
              </div>

              {/* Students Promotion Table */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Permanent Archival Notice:</span> When you finalize promotions, each student's current grades and broadsheet will be permanently archived under <strong>Academic History</strong>. Their broadsheet for the new session will start fresh for their incoming Form Teacher.
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-[11px] font-bold text-muted-foreground border-b border-border uppercase">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-2 text-center">Cum. Average</th>
                        <th className="py-2.5 px-3">Promotion Decision</th>
                        <th className="py-2.5 px-3">Destination Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {roster
                        .filter(s => (s.grade || '').toLowerCase().includes((broadsheetClassFilter || formClass || 'JSS 3').toLowerCase()))
                        .map(student => {
                          const sel = promotionSelections[student.id] || {
                            status: 'promoted',
                            toClass: getNextProgressiveClass(broadsheetClassFilter || formClass || 'JSS 3 Faith', student.stream),
                            cumulativeAverage: 75
                          };

                          return (
                            <tr key={student.id} className="hover:bg-muted/20">
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-foreground">{student.name}</p>
                                <span className="font-mono text-[10px] text-muted-foreground">{student.code || student.admission_number || student.email}</span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                  sel.cumulativeAverage >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {sel.cumulativeAverage}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={sel.status}
                                  onChange={e => {
                                    const val = e.target.value as any;
                                    setPromotionSelections(prev => ({
                                      ...prev,
                                      [student.id]: {
                                        ...sel,
                                        status: val,
                                        toClass: val === 'repeated' 
                                          ? (broadsheetClassFilter || formClass || 'JSS 3 Faith') 
                                          : getNextProgressiveClass(broadsheetClassFilter || formClass || 'JSS 3 Faith', student.stream)
                                      }
                                    }));
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                                    sel.status === 'promoted' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' :
                                    sel.status === 'repeated' ? 'border-amber-300 bg-amber-50 text-amber-800' :
                                    sel.status === 'graduated' ? 'border-purple-300 bg-purple-50 text-purple-800' :
                                    'border-border bg-muted/20 text-foreground'
                                  }`}
                                >
                                  <option value="promoted">✅ Promote to Next Class</option>
                                  <option value="repeated">🔄 Repeat Current Class</option>
                                  <option value="graduated">🎓 Graduated (Alumni)</option>
                                  <option value="transferred">📤 Transferred / Withdrawn</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={sel.toClass}
                                  onChange={e => {
                                    setPromotionSelections(prev => ({
                                      ...prev,
                                      [student.id]: {
                                        ...sel,
                                        toClass: e.target.value
                                      }
                                    }));
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground w-full max-w-[200px]"
                                >
                                  <option value="Graduated (Alumni)">🎓 Graduated (Alumni)</option>
                                  <optgroup label="Junior Secondary">
                                    <option value="JSS 1 Faith">JSS 1 Faith</option>
                                    <option value="JSS 1 Grace">JSS 1 Grace</option>
                                    <option value="JSS 2 Faith">JSS 2 Faith</option>
                                    <option value="JSS 2 Grace">JSS 2 Grace</option>
                                    <option value="JSS 3 Faith">JSS 3 Faith</option>
                                    <option value="JSS 3 Grace">JSS 3 Grace</option>
                                  </optgroup>
                                  <optgroup label="Senior Secondary">
                                    <option value="SS 1 Science">SS 1 Science</option>
                                    <option value="SS 1 Art">SS 1 Art</option>
                                    <option value="SS 1 Commercial">SS 1 Commercial</option>
                                    <option value="SS 2 Science">SS 2 Science</option>
                                    <option value="SS 2 Art">SS 2 Art</option>
                                    <option value="SS 2 Commercial">SS 2 Commercial</option>
                                    <option value="SS 3 Science">SS 3 Science</option>
                                    <option value="SS 3 Art">SS 3 Art</option>
                                    <option value="SS 3 Commercial">SS 3 Commercial</option>
                                  </optgroup>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Session: <span className="font-bold text-foreground">{promotionSession}</span> ({promotionTerm})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPromotionModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const activeClass = broadsheetClassFilter || formClass || 'JSS 3 Faith';
                      const activeRoster = roster.filter(s => (s.grade || '').toLowerCase().includes(activeClass.toLowerCase()));
                      handleExecutePromotionSubmit(activeClass, activeRoster.length > 0 ? activeRoster : roster.slice(0, 10));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" /> Finalize & Execute Promotion
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 📜 HISTORICAL BROADSHEET MODAL */}
        {/* ========================================================= */}
        {showHistoryBroadsheetModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-indigo-950/20">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">
                      {showHistoryBroadsheetModal.studentName} — Archived Broadsheet
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Session: <span className="font-semibold text-foreground">{showHistoryBroadsheetModal.academicSession}</span> ({showHistoryBroadsheetModal.term || '3rd Term'}) · Class: <span className="font-semibold text-foreground">{showHistoryBroadsheetModal.fromClass}</span> → <span className="font-semibold text-indigo-600">{showHistoryBroadsheetModal.toClass}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryBroadsheetModal(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Broadsheet Content Table */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-xl border border-border">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Student ID</span>
                    <span className="font-mono text-xs font-bold text-foreground">{showHistoryBroadsheetModal.studentCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Final Cumulative Avg</span>
                    <span className="text-sm font-bold text-emerald-600">{showHistoryBroadsheetModal.cumulativeAverage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Promotion Outcome</span>
                    <span className="text-xs font-bold text-indigo-600 uppercase">{showHistoryBroadsheetModal.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Archived On</span>
                    <span className="text-xs font-semibold text-foreground">{new Date(showHistoryBroadsheetModal.promotedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                        <th className="py-2.5 px-3">Subject / Course</th>
                        <th className="py-2.5 px-2 text-center">1st CA</th>
                        <th className="py-2.5 px-2 text-center">2nd CA</th>
                        <th className="py-2.5 px-2 text-center">CBT Obj</th>
                        <th className="py-2.5 px-2 text-center">Theory / Exam</th>
                        <th className="py-2.5 px-2 text-center font-bold text-foreground">Total Score</th>
                        <th className="py-2.5 px-2 text-center">Grade</th>
                        <th className="py-2.5 px-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {Object.keys(showHistoryBroadsheetModal.broadsheetSnapshot || {}).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-muted-foreground">
                            No subject score records recorded for this historical snapshot.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(showHistoryBroadsheetModal.broadsheetSnapshot).map(([cCode, score]: [string, any]) => {
                          const total = score.total || ((score.ca1 || 0) + (score.ca2 || 0) + (score.cbtScore || 0) + (score.paperExam || score.exam || 0));
                          const isSS = isSeniorSecondaryClass(showHistoryBroadsheetModal.fromClass);
                          const grade = isSS ? calculateWAECGrade(total) : calculateBECEGrade(total);

                          return (
                            <tr key={cCode} className="hover:bg-muted/20">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-foreground">{cCode}</span>
                              </td>
                              <td className="py-2.5 px-2 text-center font-semibold">{score.ca1 ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center font-semibold">{score.ca2 ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center font-semibold">{isSS ? (score.cbtScore ?? '-') : 'N/A'}</td>
                              <td className="py-2.5 px-2 text-center font-semibold">{score.paperExam ?? score.exam ?? '-'}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-foreground">{total}</td>
                              <td className="py-2.5 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${grade.color}`}>
                                  {grade.grade}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground italic text-[11px]">
                                {score.remark || score.remarks || 'Good academic effort & steady progress'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Signed: <strong>{showHistoryBroadsheetModal.promotedByTeacherName || 'Form Teacher'}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistoryBroadsheetModal(null)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const rec = showHistoryBroadsheetModal;
                      setShowHistoryBroadsheetModal(null);
                      setSelectedReportCardStudent({
                        id: rec.studentId,
                        name: rec.studentName,
                        code: rec.studentCode,
                        grade: rec.fromClass,
                        attendance: 96,
                        stream: rec.toClass.includes('Art') ? 'Art' : rec.toClass.includes('Commercial') ? 'Commercial' : 'Science'
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Terminal Report Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🖨️ Terminal Report Card Modal */}
        {selectedReportCardStudent && (
          <TerminalReportCard
            data={buildReportCardData(selectedReportCardStudent)}
            onClose={() => setSelectedReportCardStudent(null)}
          />
        )}

        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
