import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Link } from 'wouter';
import {
  BookOpen, Calendar, Clock, Award, Star, CheckCircle2,
  FileText, ArrowRight, Download, ChevronRight, UserCheck,
  CreditCard, Settings, User, Bell, Lock, AlertCircle,
  BarChart2, Shield, Play, ArrowUpRight, Trophy, ClipboardList,
  CheckSquare, Filter, Search, Sparkles
} from 'lucide-react';

import { getStoredExams, getStoredSubmissions, subscribeToCBTStore } from '@/lib/cbt-store';

// ─── Initial Seed Data (SS1 Science) ─────────────────────────
const MY_COURSES: any[] = [];

const GRADE_REPORT: any[] = [];

const FEE_BREAKDOWN = [
  { item: 'Tuition Fee (2nd Term 2026)', amount: 150000, paid: 150000, status: 'Paid', date: 'Jan 10, 2026' },
  { item: 'Development & Facility Levy', amount: 25000, paid: 25000, status: 'Paid', date: 'Jan 10, 2026' },
  { item: 'CBT Examination & Tech Fee', amount: 15000, paid: 15000, status: 'Paid', date: 'Jan 10, 2026' },
  { item: 'Montessori Practical Life Kit', amount: 10000, paid: 10000, status: 'Paid', date: 'Jan 10, 2026' },
];

const TERM_ACADEMIC_CALENDAR = [
  { date: 'Jan 12, 2026', title: '2nd Term Resumption & Orientation', category: 'Academic', status: 'Completed', detail: 'Classes commence for JSS1-SS3' },
  { date: 'Feb 16 - Feb 20, 2026', title: 'Mid-Term CBT Continuous Assessments', category: 'Exam', status: 'Completed', detail: 'Online C.A. Tests 1 & 2 across all subjects' },
  { date: 'Feb 23 - Feb 27, 2026', title: 'Mid-Term Break', category: 'Holiday', status: 'Completed', detail: 'School closed for mid-term holidays' },
  { date: 'Mar 12, 2026', title: 'Montessori Practical Life Exhibition', category: 'Event', status: 'Completed', detail: 'Student showcase & parent open house' },
  { date: 'Aug 10 - Aug 14, 2026', title: 'Revision Week & Mock Exercises', category: 'Academic', status: 'Upcoming', detail: 'Final prep for 2nd Term examinations' },
  { date: 'Aug 17 - Aug 28, 2026', title: '2nd Term Terminal CBT Examinations', category: 'Exam', status: 'Upcoming', detail: 'CBT Hall A & B terminal examination sessions' },
  { date: 'Sep 04, 2026', title: 'Vacation & Report Card Publication', category: 'Holiday', status: 'Upcoming', detail: 'End of 2nd Term & online report release' },
];

type DayKey = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

const WEEKLY_TIMETABLE: Record<DayKey, Array<{ time: string; subject: string; teacher: string; room: string }>> = {
  Monday: [
    { time: '08:00 AM - 09:00 AM', subject: 'Applied Mathematics (MTH-101)', teacher: 'Mr. Okonkwo Paul', room: 'Room 5' },
    { time: '09:00 AM - 10:00 AM', subject: 'Practical Agronomy (BOT-102)', teacher: 'Mrs. Stella Obi', room: 'Farm Area' },
    { time: '10:00 AM - 10:30 AM', subject: 'Short Break & Morning Refreshment', teacher: 'Faculty Staff', room: 'Cafeteria' },
    { time: '10:30 AM - 11:30 AM', subject: 'General Science & Lab (SCI-104)', teacher: 'Engr. Emeka David', room: 'Lab 2' },
    { time: '01:00 PM - 02:00 PM', subject: 'Language Arts (ENG-103)', teacher: 'Dr. Grace Bassey', room: 'Room 8' },
  ],
  Tuesday: [
    { time: '08:00 AM - 09:00 AM', subject: 'Language Arts (ENG-103)', teacher: 'Dr. Grace Bassey', room: 'Room 8' },
    { time: '09:00 AM - 10:00 AM', subject: 'Montessori Practical Life Kit', teacher: 'Mrs. Stella Obi', room: 'Workshop 1' },
    { time: '10:00 AM - 10:30 AM', subject: 'Short Break & Morning Refreshment', teacher: 'Faculty Staff', room: 'Cafeteria' },
    { time: '10:30 AM - 11:30 AM', subject: 'General Science & Lab (SCI-104)', teacher: 'Engr. Emeka David', room: 'Lab 2' },
    { time: '01:00 PM - 02:00 PM', subject: 'Cultural & Creative Arts', teacher: 'Mr. Okonkwo Paul', room: 'Arts Studio' },
  ],
  Wednesday: [
    { time: '08:00 AM - 09:00 AM', subject: 'Applied Mathematics (MTH-101)', teacher: 'Mr. Okonkwo Paul', room: 'Room 5' },
    { time: '09:00 AM - 10:00 AM', subject: 'Practical Agronomy (BOT-102)', teacher: 'Mrs. Stella Obi', room: 'Farm Area' },
    { time: '10:00 AM - 10:30 AM', subject: 'Short Break & Morning Refreshment', teacher: 'Faculty Staff', room: 'Cafeteria' },
    { time: '10:30 AM - 11:30 AM', subject: 'CBT Practice & Computer Skills', teacher: 'Tech Facilitator', room: 'CBT Lab A' },
    { time: '01:00 PM - 02:00 PM', subject: 'Language Arts (ENG-103)', teacher: 'Dr. Grace Bassey', room: 'Room 8' },
  ],
  Thursday: [
    { time: '08:00 AM - 09:00 AM', subject: 'Applied Mathematics (MTH-101)', teacher: 'Mr. Okonkwo Paul', room: 'Room 5' },
    { time: '09:00 AM - 10:00 AM', subject: 'General Science (SCI-104)', teacher: 'Engr. Emeka David', room: 'Lab 2' },
    { time: '10:00 AM - 10:30 AM', subject: 'Short Break & Morning Refreshment', teacher: 'Faculty Staff', room: 'Cafeteria' },
    { time: '10:30 AM - 11:30 AM', subject: 'Montessori Applied Mathematics', teacher: 'Mr. Okonkwo Paul', room: 'Room 5' },
    { time: '01:00 PM - 02:00 PM', subject: 'Physical & Health Education', teacher: 'Coach Ibrahim', room: 'Sports Complex' },
  ],
  Friday: [
    { time: '08:00 AM - 09:00 AM', subject: 'Practical Agronomy (BOT-102)', teacher: 'Mrs. Stella Obi', room: 'Farm Area' },
    { time: '09:00 AM - 10:00 AM', subject: 'Language Arts & Library Reading', teacher: 'Dr. Grace Bassey', room: 'Library' },
    { time: '10:00 AM - 10:30 AM', subject: 'Short Break & Morning Refreshment', teacher: 'Faculty Staff', room: 'Cafeteria' },
    { time: '10:30 AM - 11:30 AM', subject: 'Weekly Assessment & Quiz Review', teacher: 'Subject Instructors', room: 'Hall B' },
    { time: '11:30 AM - 12:30 PM', subject: 'House Assembly & Club Activities', teacher: 'House Masters', room: 'Auditorium' },
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  Academic: 'bg-blue-100 text-blue-700',
  Exam: 'bg-rose-100 text-rose-700',
  Holiday: 'bg-purple-100 text-purple-700',
  Event: 'bg-amber-100 text-amber-700',
};

function getCategoryColorClass(cat: string): string {
  if (Object.prototype.hasOwnProperty.call(CATEGORY_COLORS, cat)) {
    return CATEGORY_COLORS[cat];
  }
  return 'bg-muted text-muted-foreground';
}

function getTimetableForDay(day: DayKey) {
  if (Object.prototype.hasOwnProperty.call(WEEKLY_TIMETABLE, day)) {
    return WEEKLY_TIMETABLE[day] || [];
  }
  return [];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('overview');
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

  // Settings form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || 'Student',
    lastName: user?.last_name || 'Suite',
    email: user?.email || 'student@tarepet.edu.ng',
    phone: '+234 812 345 6789',
    studentId: 'STU-2026-001',
    house: 'Blue House (Eagle)',
    emailNotifications: true,
  });

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
              SS1 SCIENCE · BLUE HOUSE EAGLE · TERM 2 2026
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1">
            Good morning, {user?.first_name ?? 'Student'}! 👋
          </h2>
          <p className="text-rose-100 text-sm mb-3">
            Welcome to your student portal. Check your active courses and upcoming CBT exams.
          </p>
          <p className="text-xs italic text-rose-200/90 font-serif border-t border-white/10 pt-2.5">
            "Knowledge is Power." — Tarepet Guiding Principle
          </p>
        </div>

        {/* Live CBT Exam Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-1.5 inline-block">CBT Examinations</span>
            <h3 className="text-xl font-bold">Online CBT Exams & C.A. Tests</h3>
            <p className="text-emerald-100 text-xs mt-1">Take your online tests and exams with automatic timer submission and instant scoring.</p>
          </div>
          <Link href="/dashboard/cbt-exam">
            <button className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition shadow-md whitespace-nowrap">
              Take CBT Exam →
            </button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Courses', val: '0', sub: '0% avg progress', icon: BookOpen, color: 'text-rose-700 bg-rose-500/10 border-rose-200' },
            { label: 'Current GPA', val: '0.00', sub: 'No GPA recorded', icon: Star, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            { label: 'Attendance', val: '0%', sub: 'No attendance recorded', icon: UserCheck, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
            { label: 'Fee Status', val: 'CLEARED', sub: 'No Outstanding Fees', icon: CreditCard, color: 'text-purple-600 bg-purple-500/10 border-purple-200' },
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
          <h3 className="font-serif font-bold text-foreground mb-4">Quick Student Access</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'My course', section: 'courses', icon: BookOpen },
              { label: 'Exams/Test', section: 'exams', icon: ClipboardList },
              { label: 'Check Results', section: 'results', icon: BarChart2 },
              { label: 'Payment Page', section: 'payments', icon: CreditCard },
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
          <h2 className="text-2xl font-serif font-bold text-foreground">My course</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Active subjects, course progress, and assigned teachers.</p>
        </div>

        {MY_COURSES.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MY_COURSES.map(c => (
              <div key={c.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{c.code}</span>
                    <h3 className="font-serif font-bold text-lg text-foreground mt-2">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">Instructor: {c.teacher}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Grade: {c.grade} ({c.score})</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Syllabus Progress</span>
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
            <h4 className="font-serif font-bold text-foreground text-lg">No Enrolled Courses</h4>
            <p className="text-xs text-muted-foreground">You do not have any active course enrollments at this time.</p>
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
              <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">CBT Examination System</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">Online CBT Exams & Assessments</h2>
              <p className="text-emerald-100 text-xs mt-1 max-w-xl">Take active CBT continuous assessment tests and terminal exams. Automatic timer submission & instant results.</p>
            </div>
            <Link href="/dashboard/cbt-exam">
              <button className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
                Open CBT Portal →
              </button>
            </Link>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-lg mb-2">Available Live CBT Exams & Tests</h3>
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
                      Start Exam Now
                    </button>
                  </Link>
                </div>
              )) : (
                <div className="py-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-border/60">
                  <p className="text-sm font-semibold">No active exams at this moment.</p>
                  <p className="text-xs mt-1">When your teacher activates an approved exam, it will appear here instantly!</p>
                </div>
              )}
            </div>
          </div>

          {/* Submitted Exams History */}
          {studentSubs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-foreground text-base">Completed CBT Exam Submissions</h3>
              <div className="space-y-3">
                {studentSubs.map(sub => (
                  <div key={sub.id} className="p-4 rounded-xl border border-border bg-emerald-500/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{sub.course_code}</span>
                      <h4 className="font-bold text-foreground text-sm mt-1">{sub.exam_title}</h4>
                      <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submitted_at).toLocaleTimeString()} · Score: {sub.score} / {sub.total_possible}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-serif font-bold text-emerald-600">{sub.percentage}%</span>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase">Graded & Synced</p>
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
            <h2 className="text-2xl font-serif font-bold text-foreground">Check Academic Results</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Term report card, continuous assessments, and exam breakdown.</p>
          </div>
          <button onClick={() => showToast('Official Report Card PDF downloaded!')} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto">
            <Download className="w-4 h-4" /> Download Official Report Card (PDF)
          </button>
        </div>

        {/* Result Summary Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Cumulative GPA</p><p className="text-3xl font-serif font-bold text-primary mt-1">3.85</p></div>
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Overall Average</p><p className="text-3xl font-serif font-bold text-emerald-600 mt-1">86.5%</p></div>
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Class Position</p><p className="text-3xl font-serif font-bold text-purple-600 mt-1">2nd / 24</p></div>
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Term Status</p><p className="text-3xl font-serif font-bold text-blue-600 mt-1">PASSED</p></div>
        </div>

        {/* Subject Score Breakdown */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="font-serif font-bold text-foreground">2nd Term Subject Scores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">CA 1 (10%)</th>
                  <th className="p-3 text-center">CA 2 (10%)</th>
                  <th className="p-3 text-center">Midterm (20%)</th>
                  <th className="p-3 text-center">Final Exam (60%)</th>
                  <th className="p-3 text-center">Total (100%)</th>
                  <th className="p-3 text-center">Grade</th>
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
      </div>
    );

    // =========================================================
    // 5. PAYMENT PAGE
    // =========================================================
    if (activeSection === 'payments') return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Payment & Fee Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">School fees summary, payment receipts, and online payment options.</p>
        </div>

        {/* Fee Status Card */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">2nd Term 2026</span>
            <h3 className="text-2xl font-bold">Total Fees: ₦200,000</h3>
            <p className="text-purple-100 text-xs mt-1">Paid in Full • Outstanding Balance: ₦0.00</p>
          </div>
          <button onClick={() => showToast('Official Fee Receipt (PDF) downloaded!')} className="bg-white text-purple-800 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-purple-50 transition-colors shadow-md">
            Download Official Receipt
          </button>
        </div>

        {/* Breakdown Table */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground">Paid Fee Items</h3>
          <div className="space-y-2">
            {FEE_BREAKDOWN.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10 text-xs">
                <div>
                  <h4 className="font-bold text-foreground">{f.item}</h4>
                  <p className="text-[10px] text-muted-foreground">Paid on {f.date}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-foreground block">₦{f.paid.toLocaleString()}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">✓ {f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 6. CALENDAR & TIMETABLE
    // =========================================================
    if (activeSection === 'calendar') return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Academic Calendar & Class Timetable</h2>
          <p className="text-xs text-muted-foreground mt-0.5">2nd Term 2026 Academic Milestones, Exam Dates & Weekly Class Timetable.</p>
        </div>

        {/* 1. Class Timetable Component */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-700" /> SS1 Science Class Timetable
              </h3>
              <p className="text-xs text-muted-foreground">Daily class schedule, subject periods, instructors, and rooms.</p>
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
            {getTimetableForDay(timetableDay).map((slot, idx) => (
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
            ))}
          </div>
        </div>

        {/* 2. Term Academic Calendar Component */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-700" /> {t('student.academic_calendar_title', '2nd Term 2026 Academic Calendar')}
            </h3>
            <p className="text-xs text-muted-foreground">{t('student.academic_calendar_desc', 'Important school key dates, continuous assessment tests, holidays, and term exams.')}</p>
          </div>

          <div className="space-y-3">
            {TERM_ACADEMIC_CALENDAR.map((ev, i) => {
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
                        {ev.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground text-sm">{ev.title}</h4>
                    <p className="text-xs text-muted-foreground">{ev.detail}</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-bold text-foreground text-xs block font-mono bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                      {ev.date}
                    </span>
                  </div>
                </div>
              );
            })}
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
          <h2 className="text-2xl font-serif font-bold text-foreground">Setting/profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your student profile, account security, and notifications.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Student Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">First Name</label>
              <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Last Name</label>
              <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Student ID Code</label>
              <input type="text" disabled value={profileForm.studentId} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-xs font-mono font-bold outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Assigned House</label>
              <input type="text" disabled value={profileForm.house} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-xs font-bold outline-none cursor-not-allowed" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
              <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Phone Number</label>
              <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notifications
          </h3>
          <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
            <div>
              <p className="font-bold text-xs text-foreground">Email Notifications</p>
              <p className="text-[10px] text-muted-foreground">Receive email alerts for published CBT exams and graded results.</p>
            </div>
            <input type="checkbox" checked={profileForm.emailNotifications} onChange={e => setProfileForm({...profileForm, emailNotifications: e.target.checked})} className="w-4 h-4 text-primary rounded" />
          </label>
          <button onClick={() => showToast('Student settings saved!')} className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            Save Profile Settings
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
