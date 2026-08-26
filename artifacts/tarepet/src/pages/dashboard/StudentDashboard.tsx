import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Link } from 'wouter';
import {
  BookOpen, Calendar, Clock, Award, Star, CheckCircle2,
  FileText, ArrowRight, Download, ChevronRight, UserCheck,
  Settings, User, Bell, Lock, AlertCircle,
  BarChart2, Shield, Play, ArrowUpRight, Trophy, ClipboardList,
  CheckSquare, Filter, Search, Sparkles, Zap, Printer, ShieldCheck,
  Scissors, Trash2, Upload, CreditCard, Edit3
} from 'lucide-react';

import { getStoredExams, getStoredSubmissions, subscribeToCBTStore, getCoursesForClass, getStudentBroadsheet, calculateWAECGrade, calculateBECEGrade, isSeniorSecondaryClass, getStoredStudents, saveStudent, broadcastRealtimeEvent, syncStudentsWithBackend, getStoredSubjects, matchStudentClass, SubjectRecord } from '@/lib/cbt-store';
import { authClient } from '@/lib/api-auth';
import { StudentPaymentPanel } from '@/components/dashboard/StudentPaymentPanel';
import { TerminalReportCard } from '@/components/reports/TerminalReportCard';
import { getTimeGreeting } from '@/lib/utils';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { MobileProfileView } from '@/components/profile/MobileProfileView';

// ─── Initial Seed Data ─────────────────────────
const MY_COURSES: any[] = [];

const GRADE_REPORT: any[] = [];

const TERM_ACADEMIC_CALENDAR: any[] = [];

type DayKey = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

const WEEKLY_TIMETABLE: Record<DayKey, Array<{ time: string; subject: string; teacher: string; room: string }>> = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
};

const CATEGORY_COLORS: Record<string, string> = {
  Academic: 'bg-blue-100 text-blue-700',
  Exam: 'bg-rose-100 text-rose-700',
  Holiday: 'bg-purple-100 text-purple-700',
  Event: 'bg-amber-100 text-amber-700',
};

function getCategoryBadge(cat: string) {
  if (Object.prototype.hasOwnProperty.call(CATEGORY_COLORS, cat)) {
    return Reflect.get(CATEGORY_COLORS, cat);
  }
  return 'bg-muted text-muted-foreground';
}

function getCategoryColorClass(cat: string): string {
  return getCategoryBadge(cat);
}

function getTimetableForDay(day: DayKey) {
  if (Object.prototype.hasOwnProperty.call(WEEKLY_TIMETABLE, day)) {
    return Reflect.get(WEEKLY_TIMETABLE, day) || [];
  }
  return [];
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user, isStudent, isAdmin, refreshUserProfile, updateUser } = useAuth();

  if (!user || (!isStudent && !isAdmin) || (user.role !== 'STUDENT' && user.role !== 'ADMIN')) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl bg-card p-8 shadow-xl border border-border">
          <h2 className="text-2xl font-serif font-bold text-destructive mb-3">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Your account ({user?.role || 'Guest'}) does not have permission to view the Student Portal.
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
  const [timetableDay, setTimetableDay] = useState<DayKey>('Monday');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [examsList, setExamsList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [subjectsListState, setSubjectsListState] = useState<SubjectRecord[]>(() => getStoredSubjects());

  const syncStudentCBTData = () => {
    setExamsList(getStoredExams());
    setSubmissionsList(getStoredSubmissions());
    setSubjectsListState(getStoredSubjects());
  };

  React.useEffect(() => {
    // Sync CBT data from local store
    syncStudentCBTData();
    const unsub = subscribeToCBTStore(syncStudentCBTData);

    // Fetch live student data and user profile from backend database
    const syncBackend = () => {
      refreshUserProfile().catch(() => {});
      syncStudentsWithBackend().catch(() => {});
    };
    syncBackend();
    const intervalId = setInterval(syncBackend, 15000);

    return () => {
      unsub();
      clearInterval(intervalId);
    };
  }, []);

  const matchedStoredStudent = React.useMemo(() => {
    if (!user) return null;
    const uEmail = (user.email || '').toLowerCase().trim();
    const uAdm = ((user.profile as any)?.student_id || (user.profile as any)?.studentId || (user as any).admissionNo || (user as any).admissionNumber || (user as any).id || '').toString().toLowerCase().trim();
    const uName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim();

    return getStoredStudents().find((s: any) => {
      const sEmail = (s.email || '').toLowerCase().trim();
      const sAdm = (s.admissionNo || s.admissionNumber || s.code || '').toLowerCase().trim();
      const sName = (s.name || '').toLowerCase().trim();
      return (sEmail && sEmail === uEmail) || (sAdm && (sAdm === uAdm || uAdm.includes(sAdm) || sAdm.includes(uAdm))) || (sName && sName === uName);
    });
  }, [user]);

  const getStudentProfileData = () => {
    const s = matchedStoredStudent;
    const prof = (user?.profile as any) || {};
    const nameParts = (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (s?.name || '')).split(' ');
    const fName = user?.first_name || nameParts[0] || '';
    const lName = user?.last_name || nameParts.slice(1).join(' ') || '';

    return {
      firstName: fName,
      lastName: lName,
      email: user?.email || s?.email || '',
      phone: user?.phone || prof.phone || s?.phone || '',
      studentId: prof.student_id || s?.admissionNo || (user as any)?.admissionNo || (user as any)?.admissionNumber || '',
      grade: prof.grade_level || prof.grade || s?.grade || '',
      stream: prof.stream || s?.stream || '',
      house: prof.house || s?.house || '',
      gender: prof.gender || s?.gender || 'Male',
      dob: prof.dob || prof.date_of_birth || s?.dob || '2010-05-15',
      address: prof.address || s?.address || 'Tarepet School Campus, Yenagoa',
      profileImage: prof.profileImage || s?.profileImage || '',
      emailNotifications: true,
    };
  };

  // Settings form state (synced with actual admin data)
  const [profileForm, setProfileForm] = useState(getStudentProfileData);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');

  const handleSaveProfile = () => {
    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    saveStudent({
      admissionNo: profileForm.studentId,
      name: fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      gender: profileForm.gender,
      dob: profileForm.dob,
      address: profileForm.address,
      profileImage: profileForm.profileImage,
    });

    updateUser({
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      profile_image: profileForm.profileImage,
      profile: {
        ...(user?.profile || {}),
        student_id: profileForm.studentId,
        gender: profileForm.gender,
        date_of_birth: profileForm.dob,
        address: profileForm.address,
        profile_image: profileForm.profileImage,
        profileImage: profileForm.profileImage,
      }
    });

    authClient.patch('/auth/me/', {
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      profile_image: profileForm.profileImage,
      profile: {
        student_id: profileForm.studentId,
        gender: profileForm.gender,
        date_of_birth: profileForm.dob,
        address: profileForm.address,
        profile_image: profileForm.profileImage,
        profileImage: profileForm.profileImage,
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});

    broadcastRealtimeEvent();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbt_store_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setIsEditingPersonal(false);
    showToast('Personal information updated successfully!');
  };

  const handleSaveCroppedAvatar = (croppedBase64: string) => {
    const updated = { ...profileForm, profileImage: croppedBase64 };
    setProfileForm(updated);
    updateUser({
      profile_image: croppedBase64,
      profile: {
        ...(user?.profile || {}),
        profile_image: croppedBase64,
        profileImage: croppedBase64,
      }
    });
    saveStudent({
      admissionNo: profileForm.studentId,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      profileImage: croppedBase64,
    });
    authClient.patch('/auth/me/', {
      profile_image: croppedBase64,
      profile: {
        profile_image: croppedBase64,
        profileImage: croppedBase64,
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});
    broadcastRealtimeEvent();
    showToast('Profile photo cropped and updated in real time!');
  };

  const handleDeleteAvatar = () => {
    const updated = { ...profileForm, profileImage: '' };
    setProfileForm(updated);
    updateUser({
      profile_image: '',
      profile: {
        ...(user?.profile || {}),
        profile_image: '',
        profileImage: '',
      }
    });
    saveStudent({
      admissionNo: profileForm.studentId,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      profileImage: '',
    });
    authClient.patch('/auth/me/', {
      profile_image: '',
      profile: {
        profile_image: '',
        profileImage: '',
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});
    broadcastRealtimeEvent();
    showToast('Profile photo deleted successfully.');
  };

  React.useEffect(() => {
    setProfileForm(getStudentProfileData());
  }, [user, matchedStoredStudent]);

  const [selectedTerm, setSelectedTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const studentGrade = profileForm.grade || matchedStoredStudent?.grade || (user?.profile as any)?.grade_level || (user?.profile as any)?.grade || 'SS 1';
  const studentStream = (profileForm as any).stream || matchedStoredStudent?.stream || (user?.profile as any)?.stream || (studentGrade.toUpperCase().includes('ART') || (user as any)?.admissionNo?.includes('ART') ? 'Art' : 'Science');

  const myEnrolledCourses = React.useMemo(() => {
    const sGrade = (studentGrade || '').toUpperCase().trim();
    const sStream = (studentStream || '').toUpperCase().trim();
    const all = subjectsListState.length > 0 ? subjectsListState : getStoredSubjects();
    return all.filter(sub => {
      const matchGrade = matchStudentClass(sGrade, sub.grade) || sub.grade === 'SS 1 - SS 3' || sub.grade.includes('SS');
      const matchStream = !sub.stream || sub.stream === 'General' || sub.stream.toUpperCase() === sStream || (sStream === 'ART' && sub.stream.toUpperCase() === 'ARTS');
      return matchGrade && matchStream;
    });
  }, [studentGrade, studentStream, subjectsListState]);

  const studentIdForScores = matchedStoredStudent?.id || user?.id || 101;
  const broadsheetData = getStudentBroadsheet(studentIdForScores);
  const isSS = isSeniorSecondaryClass(studentGrade);

  let totalScoreSum = 0;
  let scoredCount = 0;
  myEnrolledCourses.forEach(c => {
    const scoreObj = broadsheetData[c.code];
    if (scoreObj) {
      const tot = (scoreObj.ca1 || 0) + (scoreObj.ca2 || 0) + (scoreObj.cbtScore || 0) + (scoreObj.paperExam || scoreObj.exam || 0);
      if (tot > 0) {
        totalScoreSum += tot;
        scoredCount++;
      }
    }
  });
  const calculatedAvg = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : 0;

  const myCompletedCBTCount = React.useMemo(() => {
    const uEmail = (user?.email || '').toLowerCase().trim();
    const uAdm = ((user?.profile as any)?.student_id || (user?.profile as any)?.studentId || (user as any)?.admissionNo || (user as any)?.admissionNumber || '').toString().toLowerCase().trim();
    const uName = `${user?.first_name || ''} ${user?.last_name || ''}`.toLowerCase().trim();

    return submissionsList.filter(s => {
      const sEmail = (s.student_email || '').toLowerCase().trim();
      const sAdm = (s.student_id || '').toLowerCase().trim();
      const sName = (s.student_name || '').toLowerCase().trim();
      return (sEmail && sEmail === uEmail) || (sAdm && (sAdm === uAdm || uAdm.includes(sAdm))) || (sName && (sName === uName || (uName && sName.includes(uName))));
    }).length;
  }, [user, submissionsList]);

  const activeLiveExamsCount = React.useMemo(() => {
    return examsList.filter(e => e.status === 'ACTIVE').length;
  }, [examsList]);

  const renderSection = () => {
    // =========================================================
    // 1. OVERVIEW
    // =========================================================
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-rose-800 via-red-900 to-rose-950 text-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="w-fit text-[11px] sm:text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm">
              {`${studentGrade.toUpperCase()} ${studentStream.toUpperCase()} · 2025/2026 ACADEMIC SESSION`}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1.5">
            {getTimeGreeting()}, {user?.first_name ?? t('student.role_student', 'Student')}!
          </h2>
          <p className="text-rose-100 text-xs sm:text-sm mb-3.5 max-w-2xl leading-relaxed">
            {t('student.welcome_sub', 'Welcome to your student portal. Check your active subjects and upcoming CBT exams.')}
          </p>
          <p className="text-[11px] sm:text-xs italic text-rose-200/90 font-serif border-t border-white/15 pt-3">
            "{t('student.motto', 'Nurturing Minds, Shaping Character, Empowering Excellence.')}" — {t('student.motto_author', 'Tarepet Guiding Principle')}
          </p>
        </div>

        {/* Live CBT Exam Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-1 inline-block">{t('student.cbt_exams_tag', 'CBT Examinations')}</span>
            <h3 className="text-lg sm:text-xl font-bold">{t('student.cbt_exams_title', 'Online CBT Exams & C.A. Tests')}</h3>
            <p className="text-emerald-100 text-xs max-w-xl leading-relaxed">{t('student.cbt_exams_desc', 'Take your online tests and exams with automatic timer submission and instant scoring.')}</p>
          </div>
          <Link href="/dashboard/cbt-exam" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 active:scale-95 transition-all shadow-md whitespace-nowrap text-center justify-center cursor-pointer">
              {t('student.take_cbt_btn', 'Take CBT Exam →')}
            </button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Active Subjects', val: `${myEnrolledCourses.length}`, sub: `${myEnrolledCourses.length} curriculum courses`, icon: BookOpen, color: 'text-rose-700 bg-rose-500/10 border-rose-200' },
            { label: 'Overall Average', val: scoredCount > 0 ? `${calculatedAvg}%` : '—', sub: scoredCount > 0 ? 'Cumulative performance' : 'No graded tests yet', icon: Award, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            {
              label: 'CBT Assessments',
              val: `${myCompletedCBTCount} Completed`,
              sub: activeLiveExamsCount > 0 ? `${activeLiveExamsCount} Live test${activeLiveExamsCount > 1 ? 's' : ''} available` : 'All tests up to date',
              icon: ClipboardList,
              color: 'text-blue-600 bg-blue-500/10 border-blue-200'
            },
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

        {/* Quick Student Access Shortcuts */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">{t('student.quick_access', 'Quick Student Access')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {[
              { label: 'My Subjects', section: 'courses', icon: BookOpen },
              { label: 'Exams/Test', section: 'exams', icon: ClipboardList },
              { label: 'Check Results', section: 'results', icon: BarChart2 },
              { label: 'Calendar', section: 'calendar', icon: Calendar },
              { label: 'Setting/profile', section: 'settings', icon: Settings },
            ].map((a: any, i: number) => (
              <button key={i} onClick={() => setActiveSection(a.section)} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold text-foreground cursor-pointer">
                <span className="flex items-center gap-2"><a.icon className="w-4 h-4 text-rose-700" />{a.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 2. MY COURSES
    // =========================================================
    if (activeSection === 'courses') return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.my_courses_title', 'My Subjects')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('student.my_courses_desc', 'Active subjects, curriculum overview, and assigned subject teachers.')}</p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            {myEnrolledCourses.length} Subjects Enrolled
          </span>
        </div>

        {myEnrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEnrolledCourses.map((c, idx) => {
              const scoreObj = broadsheetData[c.code];
              const totalScore = scoreObj ? (scoreObj.ca1 || 0) + (scoreObj.ca2 || 0) + (scoreObj.cbtScore || 0) + (scoreObj.paperExam || scoreObj.exam || 0) : 0;
              const gradeLetter = isSS ? calculateWAECGrade(totalScore).grade : calculateBECEGrade(totalScore).grade;
              const isUnassigned = !c.teacher || c.teacher === 'Not Assigned' || c.teacher === 'Department Staff';

              return (
                <div key={c.code || idx} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-lg font-mono">{c.code}</span>
                      <h3 className="font-serif font-bold text-lg text-foreground mt-2">{c.title || (c as any).name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span className="font-medium text-muted-foreground">{t('student.instructor_label', 'Subject Lead:')}</span>
                        {isUnassigned ? (
                          <span className="text-amber-600 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                            Not Assigned
                          </span>
                        ) : (
                          <span className="text-foreground font-semibold">
                            {c.teacher}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {totalScore > 0 ? `${gradeLetter} (${totalScore}%)` : 'Active'}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border pt-3 flex justify-between">
                    <span>{studentGrade} ({studentStream})</span>
                    <span>2025/2026 Academic Session</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="font-serif font-bold text-foreground text-lg">{t('student.no_courses_title', 'No Enrolled Subjects')}</h4>
            <p className="text-xs text-muted-foreground">{t('student.no_courses_desc', 'You do not have any active subject enrollments at this time.')}</p>
          </div>
        )}
      </div>
    );

    // =========================================================
    // 3. EXAMS / TEST
    // =========================================================
    if (activeSection === 'exams') {
      const activeExams = examsList.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED');
      const studentSubs = submissionsList;

      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-blue-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">{t('student.cbt_system_tag', 'CBT Examination System')}</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">{t('student.cbt_system_title', 'Online CBT Exams & Assessments')}</h2>
              <p className="text-emerald-100 text-xs mt-1 max-w-xl">{t('student.cbt_system_desc', 'Take active CBT continuous assessment tests and terminal exams. Automatic timer submission & instant results.')}</p>
            </div>
            <Link href="/dashboard/cbt-exam">
              <button className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
                {t('student.open_cbt_btn', 'Open CBT Portal →')}
              </button>
            </Link>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-lg mb-2">{t('student.available_cbt_title', 'Available Live CBT Exams & Tests')}</h3>
            <div className="space-y-3">
              {activeExams.length > 0 ? activeExams.map((ex) => (
                <div key={ex.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{ex.assessment_type === 'TEST' ? 'C.A. Test' : 'Final Exam'}</span>
                      <span className="text-xs text-muted-foreground">{ex.duration_minutes} mins • {ex.questions_count || ex.questions?.length || 4} Qs</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                        {ex.status === 'ACTIVE' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live & Activated
                          </>
                        ) : 'Ready to Start'}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p>
                  </div>
                  <Link href="/dashboard/cbt-exam">
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors self-start sm:self-auto shadow-md">
                      {t('student.start_exam_btn', 'Start Exam Now')}
                    </button>
                  </Link>
                </div>
              )) : (
                <div className="py-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-border/60">
                  <p className="text-sm font-semibold">{t('student.no_active_exams_title', 'No active exams at this moment.')}</p>
                  <p className="text-xs mt-1">{t('student.no_active_exams_desc', 'When your teacher activates an approved exam, it will appear here instantly!')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submitted Exams History */}
          {studentSubs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-foreground text-base">{t('student.completed_cbt_title', 'Completed CBT Exam Submissions')}</h3>
              <div className="space-y-3">
                {studentSubs.map(sub => (
                  <div key={sub.id} className="p-4 rounded-xl border border-border bg-emerald-500/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{sub.exam_title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('student.submitted_time_label', 'Submitted:')} {new Date(sub.submitted_at).toLocaleTimeString()} · {t('student.score_label', 'Score:')} {sub.score} / {sub.total_possible}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-serif font-bold text-emerald-600">{sub.percentage}%</span>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase">{t('student.graded_synced', 'Graded & Synced')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // =========================================================
    // 4. CHECK RESULTS
    // =========================================================
    if (activeSection === 'results') {
      const studentGrade = (user?.profile as any)?.grade || 'SS1';
      const studentStream = (user?.profile as any)?.stream || 'Science';
      const studentCode = (user?.profile as any)?.code || (user?.email || '1');
      const isSS = studentGrade.toUpperCase().includes('SS') || studentGrade.toUpperCase().includes('SENIOR');

      // Fetch published broadsheet for this student
      const broadsheet = getStudentBroadsheet(user?.id || '1') || getStudentBroadsheet(studentCode) || getStudentBroadsheet('1');
      const courses = getCoursesForClass(studentGrade, studentStream);

      let totalScoreSum = 0;
      let coursesWithScoresCount = 0;

      const scoredCourses = courses.map(c => {
        const sc = broadsheet[c.code] || { ca1: 0, ca2: 0, assignment: 0, cbtScore: 0, paperExam: 0, exam: 0, remark: '' };
        const total = isSS
          ? (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.cbtScore || 0) + (sc.paperExam || 0)
          : (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam !== undefined ? sc.exam : (sc.paperExam || 0));

        if (total > 0) {
          totalScoreSum += total;
          coursesWithScoresCount++;
        }
        const gradeInfo = isSS ? calculateWAECGrade(total) : calculateBECEGrade(total);
        return { ...c, ...sc, total, gradeInfo };
      });

      const overallAvg = coursesWithScoresCount > 0 ? Math.round(totalScoreSum / coursesWithScoresCount) : 0;
      const overallGrade = isSS ? calculateWAECGrade(overallAvg) : calculateBECEGrade(overallAvg);

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.check_results_title', 'Check Academic Results')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSS
                  ? t('student.results_desc_ss', 'Senior Secondary Track: Official continuous assessments (1st & 2nd CA), CBT objective exams, and theory exams.')
                  : t('student.results_desc_jss', 'Basic / Junior Secondary Track: Official continuous assessments (1st & 2nd CA) and terminal handwritten examinations.')
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                {(['1st Term', '2nd Term', '3rd Term'] as const).map(term => (
                  <button
                    key={term}
                    onClick={() => setSelectedTerm(term)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedTerm === term ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer">
                <Printer className="w-4 h-4" /> {t('student.download_pdf_btn', 'Print / Download Official Report Card')}
              </button>
            </div>
          </div>

          {/* Quick Summary Strip */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="border-r border-border/50 pr-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.overall_avg', 'Term Average')}</p>
              <p className="text-3xl font-serif font-bold text-emerald-600 mt-1">{overallAvg}%</p>
            </div>
            <div className="border-r border-border/50 pr-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.class_position', 'Class Position')}</p>
              <p className="text-3xl font-serif font-bold text-purple-600 mt-1">1st</p>
            </div>
            <div className="border-r border-border/50 pr-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.term_status', 'Term Status')}</p>
              <p className="text-2xl font-serif font-bold text-blue-600 mt-1.5 uppercase tracking-wider">{overallAvg >= 40 ? 'PASSED & PROMOTED' : 'AWAITING'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.academic_standing_label', 'Academic Standing')}</p>
              <span className={`text-sm font-extrabold px-3 py-1 rounded-full inline-block mt-2 ${overallAvg >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {overallAvg >= 75 ? 'Distinction' : overallAvg >= 60 ? 'Credit' : overallAvg >= 50 ? 'Pass' : 'Needs Support'}
              </span>
            </div>
          </div>

          {/* Subject Score Breakdown */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" /> {selectedTerm} Terminal Broadsheet Results
                </h3>
                <p className="text-xs text-muted-foreground">Class: <strong>{studentGrade} ({studentStream})</strong> • Live-synced from Teacher Evaluation Portal</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Official Published Report Card
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                  {isSS ? (
                    <tr>
                      <th className="p-3 min-w-[180px]">Subject Name</th>
                      <th className="p-3 text-center min-w-[80px]">1st CA</th>
                      <th className="p-3 text-center min-w-[80px]">2nd CA</th>
                      <th className="p-3 text-center min-w-[120px] bg-blue-500/10 text-blue-700">
                        <span className="flex items-center justify-center gap-1">CBT Exam <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" /></span>
                      </th>
                      <th className="p-3 text-center min-w-[90px]">Theory Exam</th>
                      <th className="p-3 text-center min-w-[90px]">Total</th>
                      <th className="p-3 min-w-[180px]">Teacher Remarks</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-3 min-w-[180px]">Subject Name</th>
                      <th className="p-3 text-center min-w-[90px]">1st CA</th>
                      <th className="p-3 text-center min-w-[90px]">2nd CA</th>
                      <th className="p-3 text-center min-w-[100px]">Exam</th>
                      <th className="p-3 text-center min-w-[90px]">Total</th>
                      <th className="p-3 min-w-[180px]">Teacher Remarks</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-border">
                  {scoredCourses.map(g => (
                    <tr key={g.code} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-bold text-foreground">
                        <div>
                          <span className="font-bold text-foreground text-xs block">{g.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{g.code}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-muted-foreground">{g.ca1}</td>
                      <td className="p-3 text-center font-mono font-bold text-muted-foreground">{g.ca2}</td>
                      {isSS && (
                        <>
                          <td className="p-3 text-center bg-blue-500/5 border-x border-blue-200/50">
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                                {g.cbtScore}
                              </span>
                              <span className="text-[8px] font-bold text-blue-600 uppercase tracking-wider mt-0.5 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-blue-600 shrink-0" /> CBT Synced
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-muted-foreground">{g.paperExam}</td>
                        </>
                      )}
                      {!isSS && (
                        <td className="p-3 text-center font-mono font-bold text-muted-foreground">{g.exam !== undefined ? g.exam : g.paperExam}</td>
                      )}
                      <td className="p-3 text-center font-bold text-sm text-foreground font-serif">{g.total}%</td>
                      <td className="p-3 text-muted-foreground italic text-xs">
                        {g.remark || 'Good overall performance.'}
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

    // =========================================================
    // 5. PAYMENTS & FEES
    // =========================================================
    if (activeSection === 'payments') return (
      <StudentPaymentPanel
        studentId={user?.id || profileForm.studentId}
        studentName={`${user?.first_name || profileForm.firstName} ${user?.last_name || profileForm.lastName}`}
        studentEmail={user?.email || profileForm.email}
        gradeLevel={(user?.profile as any)?.grade || 'SS1'}
      />
    );

    // =========================================================
    // 6. CALENDAR & TIMETABLE
    // =========================================================
    if (activeSection === 'calendar') return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.calendar_header_title', 'Academic Calendar & Class Timetable')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('student.calendar_header_desc', 'Daily class schedule, subject periods, instructors, and rooms.')}</p>
        </div>

        {/* 1. Class Timetable Component */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-700" /> {t('student.timetable_title', 'SS1 Science Class Timetable')}
              </h3>
              <p className="text-xs text-muted-foreground">{t('student.timetable_desc', 'Daily class schedule, subject periods, instructors, and rooms.')}</p>
            </div>
            
            {/* Day Selector Tabs */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl overflow-x-auto">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayKey[]).map(day => (
                <button
                  key={day}
                  onClick={() => setTimetableDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    timetableDay === day
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Timetable Schedule Cards */}
          <div className="space-y-2.5">
            {getTimetableForDay(timetableDay).length > 0 ? (
              getTimetableForDay(timetableDay).map((slot, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:border-rose-300 transition-all gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-700 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{slot.subject}</h4>
                      <p className="text-xs text-muted-foreground">{t('student.instructor', 'Instructor: ')}<span className="font-semibold text-foreground">{slot.teacher}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                      {slot.time}
                    </span>
                    <span className="font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                      {slot.room}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-muted/10 rounded-xl border border-border/60 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">{t('student.no_timetable', 'No class timetable scheduled for this day.')}</p>
              </div>
            )}
          </div>

        </div>

        {/* 2. Term Academic Calendar Component */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-700" /> {selectedTerm} 2026 Academic Calendar
              </h3>
              <p className="text-xs text-muted-foreground">{t('student.academic_calendar_desc', 'Important school key dates, continuous assessment tests, holidays, and term exams.')}</p>
            </div>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border self-start sm:self-auto">
              {(['1st Term', '2nd Term', '3rd Term'] as const).map(term => (
                <button
                  key={term}
                  onClick={() => setSelectedTerm(term)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTerm === term ? 'bg-rose-700 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {(() => {
              let eventsToDisplay: any[] = TERM_ACADEMIC_CALENDAR;
              if (eventsToDisplay.length === 0) {
                return (
                  <div className="text-center py-8 bg-muted/10 rounded-xl border border-border space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{t('student.no_events', 'No academic calendar events published yet.')}</p>
                  </div>
                );
              }
              return eventsToDisplay.map((ev, i) => {
                const catClass = getCategoryColorClass(ev.category);
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card shadow-xs gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${catClass}`}>
                          {ev.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ev.status || 'Upcoming'}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">{ev.title}</h4>
                      <p className="text-xs text-muted-foreground">{ev.detail}</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="font-bold text-foreground text-xs block font-mono bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                        {ev.date}{ev.endDate ? ` — ${ev.endDate}` : ''}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 7. SETTING / PROFILE
    // =========================================================
    if (activeSection === 'settings' || activeSection === 'profile') return (
      <>
        {/* Mobile View Profile */}
        <div className="md:hidden">
          <MobileProfileView
            name={`${profileForm.firstName} ${profileForm.lastName}`.trim() || user?.email || 'Student'}
            email={profileForm.email || user?.email || ''}
            subtitle={`${profileForm.grade || 'Student'} • Senior Secondary`}
            avatarUrl={profileForm.profileImage}
            roleBadge="STUDENT"
            location="Yenagoa Campus, Nigeria"
            onBack={() => setActiveSection('overview')}
            onEditProfile={() => {
              const fileInput = document.getElementById('studentAvatarInputPicker');
              if (fileInput) fileInput.click();
            }}
            onViewIdCard={() => setShowReportCardModal(true)}
            extraMenuItems={[
              {
                icon: Award,
                label: 'Official Terminal Report Card',
                value: selectedTerm,
                onClick: () => setShowReportCardModal(true),
                color: 'bg-rose-500/10 text-rose-700',
              },
              {
                icon: BookOpen,
                label: 'Enrolled Academic Courses',
                value: `${myEnrolledCourses.length} Subjects`,
                onClick: () => setActiveSection('courses'),
                color: 'bg-blue-500/10 text-blue-600',
              },
              {
                icon: CreditCard,
                label: 'Tuition Fees & Payments',
                value: 'View Balance',
                onClick: () => setActiveSection('payments'),
                color: 'bg-amber-500/10 text-amber-600',
              }
            ]}
          />
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-6 w-full pb-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.settings_title', 'Student Profile & Settings')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('student.settings_desc', 'Official academic credentials, terminal report cards, contact records, and account security.')}</p>
          </div>

          {/* 1. Student Identity & Avatar Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Official Student Identity
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Enrolled & Verified Student
              </span>
            </div>

            {/* Profile Photo Upload */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-serif font-bold text-2xl text-primary overflow-hidden shrink-0 shadow-inner">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt="Student Avatar" className="w-full h-full object-cover" />
                ) : (
                  `${profileForm.firstName?.[0] || 'S'}${profileForm.lastName?.[0] || 'T'}`
                )}
              </div>
              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  accept="image/*"
                  id="studentAvatarInputPicker"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        showToast('Image size exceeds 10MB limit.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const imageBase64 = reader.result as string;
                        setPendingCropImage(imageBase64);
                        setCropModalOpen(true);
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="studentAvatarInputPicker" className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    {profileForm.profileImage ? t('student.change_photo', 'Change Photo') : t('student.upload_profile_picture', 'Upload Profile Picture')}
                  </label>
                  {profileForm.profileImage && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCropImage(profileForm.profileImage);
                          setCropModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted inline-flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Scissors className="w-3.5 h-3.5 text-primary" />
                        <span>Crop / Resize</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="px-3 py-1.5 text-rose-600 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('student.remove_photo', 'Remove')}</span>
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{t('student.avatar_help', 'Recommended: Square photo, JPG or PNG. Maximum file size: 10MB.')}</p>
              </div>
            </div>

            {/* Read-Only Official Credentials Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Student ID Code</span>
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" /> {profileForm.studentId || 'TMS-2024-101'}
                </span>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Academic Class & Stream</span>
                <span className="font-bold text-xs text-foreground">
                  {studentGrade} ({studentStream})
                </span>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Enrolled Curriculum</span>
                <span className="font-bold text-xs text-rose-700 dark:text-rose-400">
                  {myEnrolledCourses.length} Active Subjects
                </span>
              </div>
            </div>
          </div>

          {/* 2. Official Terminal Report Card & Records */}
          <div className="bg-gradient-to-br from-rose-900/10 via-card to-card rounded-2xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-rose-700" /> Official Terminal Report Cards & Records
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate and print your official certified terminal continuous assessment and examination report card.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-500/10 border border-rose-200 px-3 py-1 rounded-full w-fit">
                2025/2026 Academic Session
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-xl border border-border">
                {(['1st Term', '2nd Term', '3rd Term'] as const).map(term => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSelectedTerm(term)}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedTerm === term
                        ? 'bg-rose-800 text-white shadow-sm scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowReportCardModal(true)}
                className="bg-rose-800 hover:bg-rose-900 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4" /> Download / Print Report Card (PDF)
              </button>
            </div>
          </div>

          {/* 3. Personal & Contact Information */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Personal & Contact Information
              </h3>
              {!isEditingPersonal ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Edit Information</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(getStudentProfileData());
                      setIsEditingPersonal(false);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>

            {!isEditingPersonal ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">First Name</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.firstName || 'Not Specified'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Last Name</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.lastName || 'Not Specified'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Email Address</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.email || 'Not Available'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Contact Phone Number</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.phone || 'Not Available'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Gender</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.gender || 'Not Specified'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Date of Birth</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.dob || 'Not Specified'}</p>
                </div>
                <div className="sm:col-span-2 bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Residential / Campus Address</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.address || 'Not Available'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">{t('student.first_name', 'First Name')}</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">{t('student.last_name', 'Last Name')}</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">{t('student.email_address', 'Email Address')}</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                      placeholder="student@tarepet.edu.ng"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">{t('student.phone_number', 'Contact Phone Number')}</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                      placeholder="e.g. +234 803 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Gender</label>
                    <select
                      value={profileForm.gender || 'Male'}
                      onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dob || '2010-05-15'}
                      onChange={e => setProfileForm({...profileForm, dob: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Residential / Campus Address</label>
                  <input
                    type="text"
                    value={profileForm.address || ''}
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    placeholder="e.g. Azikoro Road, Yenagoa, Bayelsa State"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Notification Preferences */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-sm border-b border-border pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notification & Alert Preferences
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 cursor-pointer transition-all">
                <div>
                  <p className="font-semibold text-xs text-foreground">{t('student.email_notifications', 'CBT Examination & Test Alerts')}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Receive immediate notifications when new CBT exams are scheduled or activated.</p>
                </div>
                <input type="checkbox" checked={profileForm.emailNotifications} onChange={e => setProfileForm({...profileForm, emailNotifications: e.target.checked})} className="w-4 h-4 text-primary rounded accent-primary" />
              </label>
            </div>
          </div>

          {/* Save Profile Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
                saveStudent({
                  admissionNo: profileForm.studentId,
                  name: fullName,
                  email: profileForm.email,
                  phone: profileForm.phone,
                  gender: profileForm.gender,
                  dob: profileForm.dob,
                  address: profileForm.address,
                  profileImage: profileForm.profileImage,
                });

                updateUser({
                  first_name: profileForm.firstName,
                  last_name: profileForm.lastName,
                  phone: profileForm.phone,
                  profile_image: profileForm.profileImage,
                  profile: {
                    ...(user?.profile || {}),
                    student_id: profileForm.studentId,
                    gender: profileForm.gender,
                    date_of_birth: profileForm.dob,
                    address: profileForm.address,
                    profile_image: profileForm.profileImage,
                    profileImage: profileForm.profileImage,
                  }
                });

                authClient.patch('/auth/me/', {
                  first_name: profileForm.firstName,
                  last_name: profileForm.lastName,
                  phone: profileForm.phone,
                  profile_image: profileForm.profileImage,
                  profile: {
                    student_id: profileForm.studentId,
                    gender: profileForm.gender,
                    date_of_birth: profileForm.dob,
                    address: profileForm.address,
                    profile_image: profileForm.profileImage,
                    profileImage: profileForm.profileImage,
                  }
                }).then(() => {
                  refreshUserProfile().catch(() => {});
                }).catch(() => {});

                broadcastRealtimeEvent();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('cbt_store_updated'));
                  window.dispatchEvent(new Event('storage'));
                }

                showToast('Student profile & preferences updated successfully!');
              }}
              className="bg-primary hover:bg-primary/90 active:scale-95 text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> {t('student.save_settings', 'Save Profile Settings')}
            </button>
          </div>
        </div>
      </>
    );

    // Fallback if section is not matched
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Student Portal</h2>
        <p className="text-xs text-muted-foreground">Select a section from the sidebar menu to view your courses, exams, and results.</p>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
      <PortalLayout
        title="Student Portal"
        activeSection={activeSection}
        onNavigate={setActiveSection}
      >
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {renderSection()}

        {/* Printable Official Terminal Report Card Modal */}
        {showReportCardModal && (
          <TerminalReportCard onClose={() => setShowReportCardModal(false)} />
        )}

        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={pendingCropImage}
          onClose={() => setCropModalOpen(false)}
          onSave={handleSaveCroppedAvatar}
        />
      </PortalLayout>
    </ProtectedRoute>
  );
}
