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
  CheckSquare, Filter, Search, Sparkles
} from 'lucide-react';

import { getStoredExams, getStoredSubmissions, subscribeToCBTStore } from '@/lib/cbt-store';
import { StudentPaymentPanel } from '@/components/dashboard/StudentPaymentPanel';

// ─── Initial Seed Data (SS1 Science) ─────────────────────────
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

function getCategoryColorClass(cat: string): string {
  if (Object.prototype.hasOwnProperty.call(CATEGORY_COLORS, cat)) {
    return Reflect.get(CATEGORY_COLORS, cat);
  }
  return 'bg-muted text-muted-foreground';
}

function getTimetableForDay(day: DayKey) {
  if (Object.prototype.hasOwnProperty.call(WEEKLY_TIMETABLE, day)) {
    return Reflect.get(WEEKLY_TIMETABLE, day) || [];
  }
  return [];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  const syncStudentCBTData = () => {
    setExamsList(getStoredExams());
    setSubmissionsList(getStoredSubmissions());
  };

  React.useEffect(() => {
    syncStudentCBTData();
    const unsub = subscribeToCBTStore(syncStudentCBTData);
    return () => unsub();
  }, []);

  // Settings form state (in-memory only)
  const [profileForm, setProfileForm] = useState(() => ({
    firstName: user?.first_name || 'Kelechi',
    lastName: user?.last_name || 'Amadi',
    email: user?.email || 'kelechi.amadi@tarepet.com',
    phone: '+234 812 345 6789',
    studentId: (user?.profile as any)?.student_id || 'TMS/SS1/SCI/4821',
    house: 'Blue House (Eagle)',
    profileImage: '',
    emailNotifications: true,
  }));

  const [selectedTerm, setSelectedTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const renderSection = () => {
    // =========================================================
    // 1. OVERVIEW
    // =========================================================
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        {/* Welcome Banner */}

        <div className="bg-gradient-to-r from-rose-800 via-red-900 to-rose-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
              {`SS1 SCIENCE · ${selectedTerm.toUpperCase()} 2026`}
            </span>
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
              {(['1st Term', '2nd Term', '3rd Term'] as const).map(term => (
                <button
                  key={term}
                  onClick={() => setSelectedTerm(term)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedTerm === term ? 'bg-white text-rose-950 shadow-sm' : 'text-rose-100 hover:text-white'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1">
            {t('student.welcome_greeting', 'Good morning,')} {user?.first_name ?? t('student.role_student', 'Student')}! 👋
          </h2>
          <p className="text-rose-100 text-sm mb-3">
            {t('student.welcome_sub', 'Welcome to your student portal. Check your active subjects and upcoming CBT exams.')}
          </p>
          <p className="text-xs italic text-rose-200/90 font-serif border-t border-white/10 pt-2.5">
            "{t('student.motto', 'Knowledge is Power.')}" — {t('student.motto_author', 'Tarepet Guiding Principle')}
          </p>
        </div>

        {/* Live CBT Exam Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-1.5 inline-block">{t('student.cbt_exams_tag', 'CBT Examinations')}</span>
            <h3 className="text-xl font-bold">{t('student.cbt_exams_title', 'Online CBT Exams & C.A. Tests')}</h3>
            <p className="text-emerald-100 text-xs mt-1">{t('student.cbt_exams_desc', 'Take your online tests and exams with automatic timer submission and instant scoring.')}</p>
          </div>
          <Link href="/dashboard/cbt-exam">
            <button className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition shadow-md whitespace-nowrap">
              {t('student.take_cbt_btn', 'Take CBT Exam →')}
            </button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Subjects', val: '0', sub: '0% avg progress', icon: BookOpen, color: 'text-rose-700 bg-rose-500/10 border-rose-200' },
            { label: 'Overall Average', val: '0%', sub: 'Overall performance', icon: Award, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            { label: 'Attendance', val: '0%', sub: 'No attendance recorded', icon: UserCheck, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'My Subjects', section: 'courses', icon: BookOpen },
              { label: 'Exams/Test', section: 'exams', icon: ClipboardList },
              { label: 'Check Results', section: 'results', icon: BarChart2 },
              { label: 'Calendar', section: 'calendar', icon: Calendar },
              { label: 'Setting/profile', section: 'settings', icon: Settings },
            ].map((a: any, i: number) => (
              <button key={i} onClick={() => setActiveSection(a.section)} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold text-foreground">
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
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.my_courses_title', 'My Subjects')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('student.my_courses_desc', 'Active subjects, subject progress, and assigned teachers.')}</p>
        </div>

        {MY_COURSES.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MY_COURSES.map(c => (
              <div key={c.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{c.code}</span>
                    <h3 className="font-serif font-bold text-lg text-foreground mt-2">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{t('student.instructor_label', 'Instructor:')} {c.teacher}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{t('student.grade_label', 'Grade:')} {c.grade} ({c.score})</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('student.syllabus_progress', 'Syllabus Progress')}</span>
                    <span className="font-bold text-foreground">{c.progress}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground border-t border-border pt-3 flex justify-between">
                  <span>{c.room}</span>
                  <span>{c.schedule}</span>
                </div>
              </div>
            ))}
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
                      <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{ex.course_code}</span>
                      <span className="text-xs text-muted-foreground">{ex.assessment_type === 'TEST' ? 'C.A. Test' : 'Final Exam'} • {ex.duration_minutes} mins • {ex.questions_count || ex.questions?.length || 4} Qs</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        {ex.status === 'ACTIVE' ? '🟢 Live & Activated' : 'Ready to Start'}
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
                      <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{sub.course_code}</span>
                      <h4 className="font-bold text-foreground text-sm mt-1">{sub.exam_title}</h4>
                      <p className="text-xs text-muted-foreground">{t('student.submitted_time_label', 'Submitted:')} {new Date(sub.submitted_at).toLocaleTimeString()} · {t('student.score_label', 'Score:')} {sub.score} / {sub.total_possible}</p>
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
    if (activeSection === 'results') return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.check_results_title', 'Check Academic Results')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('student.check_results_desc', 'Term report card, continuous assessments, and exam breakdown.')}</p>
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
            <button onClick={() => showToast(`Official ${selectedTerm} Report Card PDF downloaded!`)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto">
              <Download className="w-4 h-4" /> {t('student.download_pdf_btn', 'Download Official Report Card (PDF)')}
            </button>
          </div>
        </div>

        {/* Result Summary Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.overall_avg', 'Overall Average')}</p><p className="text-3xl font-serif font-bold text-emerald-600 mt-1">{GRADE_REPORT.length > 0 ? `${(GRADE_REPORT.reduce((a, b) => a + b.total, 0) / GRADE_REPORT.length).toFixed(1)}%` : '-'}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.class_position', 'Class Position')}</p><p className="text-3xl font-serif font-bold text-purple-600 mt-1">{GRADE_REPORT.length > 0 ? '1st' : '-'}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('student.term_status', 'Term Status')}</p><p className="text-3xl font-serif font-bold text-blue-600 mt-1">{GRADE_REPORT.length > 0 ? t('student.status_passed', 'PASSED') : '-'}</p></div>
        </div>

        {/* Subject Score Breakdown */}
        {GRADE_REPORT.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <h3 className="font-serif font-bold text-foreground">{selectedTerm} Subject Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">{t('student.col_subject', 'Subject')}</th>
                    <th className="p-3 text-center">{t('student.col_ca1', 'CA 1 (10%)')}</th>
                    <th className="p-3 text-center">{t('student.col_ca2', 'CA 2 (10%)')}</th>
                    <th className="p-3 text-center">{t('student.col_midterm', 'Midterm (20%)')}</th>
                    <th className="p-3 text-center">{t('student.col_final', 'Final Exam (60%)')}</th>
                    <th className="p-3 text-center">{t('student.col_total', 'Total (100%)')}</th>
                    <th className="p-3 text-center">{t('student.col_grade', 'Grade')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {GRADE_REPORT.map((g, i) => (
                    <tr key={i} className="hover:bg-muted/10">
                      <td className="p-3 font-bold text-foreground">{g.name} <span className="text-muted-foreground text-[10px]">({g.subject})</span></td>
                      <td className="p-3 text-center font-mono">{g.ca1}</td>
                      <td className="p-3 text-center font-mono">{g.ca2}</td>
                      <td className="p-3 text-center font-mono">{g.midterm}</td>
                      <td className="p-3 text-center font-mono">{g.exam}</td>
                      <td className="p-3 text-center font-bold text-foreground">{g.total}%</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {g.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <BarChart2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="font-serif font-bold text-foreground text-lg">{t('student.no_results_title', 'No Results Published')}</h4>
            <p className="text-xs text-muted-foreground">{t('student.no_results_desc', 'Your academic report card and subject scores will appear here once published by the school administration.')}</p>
          </div>
        )}

      </div>
    );

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
    if (activeSection === 'settings') return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{t('student.settings_title', 'Setting/profile')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('student.settings_desc', 'Manage your student profile, account security, and notifications.')}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> {t('student.info_header', 'Student Information')}
          </h3>

          {/* Profile Photo Upload */}
          <div className="flex items-center gap-4 pb-3 border-b border-border">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-serif font-bold text-xl text-primary overflow-hidden shrink-0">
              {profileForm.profileImage ? (
                <img src={profileForm.profileImage} alt="Student Avatar" className="w-full h-full object-cover" />
              ) : (
                `${profileForm.firstName?.[0] || 'S'}${profileForm.lastName?.[0] || 'T'}`
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <input
                type="file"
                accept="image/*"
                id="studentAvatarInputPicker"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const updated = { ...profileForm, profileImage: reader.result as string };
                      setProfileForm(updated);
                      showToast('Profile photo updated in real time!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <label htmlFor="studentAvatarInputPicker" className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                  {t('student.upload_profile_picture', 'Upload Profile Picture')}
                </label>
                {profileForm.profileImage && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profileForm, profileImage: '' };
                      setProfileForm(updated);
                      showToast('Photo removed!');
                    }}
                    className="px-3 py-1.5 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-50"
                  >
                    {t('student.remove_photo', 'Remove')}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{t('student.avatar_help', 'Select a picture file to update your student profile avatar.')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('student.first_name', 'First Name')}</label>
              <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('student.last_name', 'Last Name')}</label>
              <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('student.student_id', 'Student ID Code')}</label>
            <input type="text" disabled value={profileForm.studentId} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-xs font-mono font-bold outline-none cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('student.email_address', 'Email Address')}</label>
              <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('student.phone_number', 'Phone Number')}</label>
              <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> {t('student.notifications_header', 'Notifications')}
          </h3>
          <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
            <div>
              <p className="font-bold text-xs text-foreground">{t('student.email_notifications', 'Email Notifications')}</p>
              <p className="text-[10px] text-muted-foreground">{t('student.email_notifications_desc', 'Receive email alerts for published CBT exams and graded results.')}</p>
            </div>
            <input type="checkbox" checked={profileForm.emailNotifications} onChange={e => setProfileForm({...profileForm, emailNotifications: e.target.checked})} className="w-4 h-4 text-primary rounded" />
          </label>
          <button onClick={() => {
            showToast('Student profile & photo settings saved!');
          }} className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            {t('student.save_settings', 'Save Profile Settings')}
          </button>
        </div>
      </div>
    );

    return null;
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
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
