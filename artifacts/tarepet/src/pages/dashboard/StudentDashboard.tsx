import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  BookOpen, Calendar, Clock, Award, Star, CheckCircle2,
  FileText, ArrowRight, Download, ChevronRight, UserCheck,
  CreditCard, Settings, User, Bell, Lock, AlertCircle,
  BarChart2, Shield, Play, ArrowUpRight, Trophy, ClipboardList,
  CheckSquare, Filter, Search, Sparkles
} from 'lucide-react';

// ─── Initial Seed Data ─────────────────────────────────────────
const MY_COURSES = [
  { id: 1, code: 'MTH-101', name: 'Montessori Applied Mathematics', teacher: 'Mr. Okonkwo Paul', progress: 85, score: '88%', grade: 'A', room: 'Room 5', schedule: 'Mon/Wed/Thu 8:00 AM' },
  { id: 2, code: 'BOT-102', name: 'Practical Agronomy & Field Botany', teacher: 'Mrs. Stella Obi', progress: 78, score: '81%', grade: 'B+', room: 'Farm Area', schedule: 'Mon/Wed/Fri 10:00 AM' },
  { id: 3, code: 'ENG-103', name: 'Language Arts & Creative Writing', teacher: 'Dr. Grace Bassey', progress: 92, score: '92%', grade: 'A+', room: 'Room 8', schedule: 'Mon/Wed 1:00 PM' },
  { id: 4, code: 'SCI-104', name: 'General Science & Lab Experiments', teacher: 'Engr. Emeka David', progress: 80, score: '85%', grade: 'A', room: 'Lab 2', schedule: 'Tue/Thu 11:00 AM' },
];

const GRADE_REPORT = [
  { subject: 'MTH-101', name: 'Applied Mathematics', ca1: 9, ca2: 9, midterm: 18, exam: 52, total: 88, grade: 'A' },
  { subject: 'BOT-102', name: 'Practical Agronomy', ca1: 8, ca2: 8, midterm: 16, exam: 49, total: 81, grade: 'B+' },
  { subject: 'ENG-103', name: 'Language Arts', ca1: 10, ca2: 9, midterm: 19, exam: 54, total: 92, grade: 'A+' },
  { subject: 'SCI-104', name: 'General Science', ca1: 8, ca2: 9, midterm: 17, exam: 51, total: 85, grade: 'A' },
];

const FEE_BREAKDOWN = [
  { item: 'Tuition Fee (2nd Term 2026)', amount: 150000, paid: 150000, status: 'Paid', date: 'Jan 10, 2026' },
  { item: 'Development & Facility Levy', amount: 25000, paid: 25000, status: 'Paid', date: 'Jan 10, 2026' },
  { item: 'CBT Examination & Tech Fee', amount: 15000, paid: 15000, status: 'Paid', date: 'Jan 10, 2026' },
  { item: 'Montessori Practical Life Kit', amount: 10000, paid: 10000, status: 'Paid', date: 'Jan 10, 2026' },
];

const CALENDAR_EVENTS = [
  { date: 'Aug 10, 2026', time: '8:00 AM', title: 'Mathematics Mid-Term CBT Test', type: 'Exam', room: 'CBT Hall A' },
  { date: 'Aug 12, 2026', time: '10:00 AM', title: 'Agronomy Fieldwork Submission', type: 'Assignment', room: 'Farm Area' },
  { date: 'Aug 15, 2026', time: '1:00 PM', title: 'Language Arts Essay Evaluation', type: 'Test', room: 'Room 8' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block mb-3">Student Portal</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1">Welcome back, {user?.first_name ?? 'Student'}! 👋</h2>
          <p className="text-blue-100 text-sm">JSS1 Student · GPA: 3.85 (A) · House: Blue House (Eagle) #1 🏆</p>
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
            { label: 'Active Courses', val: '4', sub: '86% avg progress', icon: BookOpen, color: 'text-primary bg-primary/10 border-primary/20' },
            { label: 'Current GPA', val: '3.85', sub: 'Grade A (Exemplary)', icon: Star, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            { label: 'Attendance', val: '98%', sub: 'Regular attendee', icon: UserCheck, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
            { label: 'Fee Status', val: 'PAID', sub: '100% Cleared', icon: CreditCard, color: 'text-purple-600 bg-purple-500/10 border-purple-200' },
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

        {/* Navigation Quick Shortcuts */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Quick Student Access</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'My Courses', section: 'courses', icon: BookOpen },
              { label: 'CBT Exam Portal', href: '/dashboard/cbt-exam', icon: ClipboardList },
              { label: 'Check Results', section: 'results', icon: BarChart2 },
              { label: 'Payment Page', section: 'payments', icon: CreditCard },
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
      </div>
    );

    // =========================================================
    // 2. MY COURSES
    // =========================================================
    if (activeSection === 'courses') return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">My Enrolled Courses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Active subjects, course progress, and assigned teachers.</p>
        </div>

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
      </div>
    );

    // =========================================================
    // 3. EXAMS / TEST
    // =========================================================
    if (activeSection === 'exams') return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-blue-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">CBT Examination System</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Online CBT Exams & Tests</h2>
            <p className="text-emerald-100 text-xs mt-1 max-w-xl">Take timed CBT continuous assessment tests and terminal exams. Automatic timer submission & instant results.</p>
          </div>
          <Link href="/dashboard/cbt-exam">
            <button className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
              Take CBT Exam Now →
            </button>
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-lg mb-2">Upcoming CBT Tests & Exams</h3>
          <div className="space-y-3">
            {[
              { title: 'Mathematics Mid-Term Test', course: 'MTH-101', type: 'C.A. Test', duration: '30 mins', questions: 20, status: 'Ready to Start' },
              { title: 'Practical Agronomy Evaluation', course: 'BOT-102', type: 'C.A. Test', duration: '20 mins', questions: 15, status: 'Ready to Start' },
              { title: 'Terminal Language Arts Examination', course: 'ENG-103', type: 'Final Exam', duration: '60 mins', questions: 40, status: 'Scheduled' },
            ].map((ex, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{ex.course}</span>
                    <span className="text-xs text-muted-foreground">{ex.type} • {ex.duration} • {ex.questions} questions</span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                </div>
                <Link href="/dashboard/cbt-exam">
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors self-start sm:self-auto">
                    Start Exam
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

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
    // 6. CALENDAR
    // =========================================================
    if (activeSection === 'calendar') return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Academic Calendar & Timetable</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Upcoming tests, assignment deadlines, and exam dates.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Upcoming Academic Schedule
          </h3>
          <div className="space-y-3">
            {CALENDAR_EVENTS.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{e.type}</span>
                  <h4 className="font-bold text-foreground text-sm mt-1">{e.title}</h4>
                  <p className="text-xs text-muted-foreground">{e.room}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground text-xs block">{e.date}</span>
                  <span className="text-xs font-mono text-emerald-600">{e.time}</span>
                </div>
              </div>
            ))}
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
          <h2 className="text-2xl font-serif font-bold text-foreground">Setting & Profile</h2>
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
