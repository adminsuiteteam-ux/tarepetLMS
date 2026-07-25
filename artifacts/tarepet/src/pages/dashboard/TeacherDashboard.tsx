import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  BookOpen, Users, FileText, UserCheck, Award, Calendar,
  BarChart2, Star, Clock, CheckCircle2, AlertCircle, Plus,
  Search, Filter, Upload, Download, Send, Eye, Edit2, Trash2,
  TrendingUp, Play, Lock, MessageSquare, ChevronDown,
  CheckSquare, XCircle, RefreshCw, PenLine, Globe, Layers, ArrowUpRight,
  ClipboardList, Settings, ShieldCheck, User, Bell
} from 'lucide-react';

// ─── Initial Seed Data ─────────────────────────────────────────
const TEACHER_CLASSES = [
  { id: 1, code: 'MTH-101', title: 'Montessori Applied Mathematics', grade: 'JSS1', students: 24, avgGrade: '88%', pendingGrading: 2, schedule: 'Mon/Wed/Thu 8:00 AM', room: 'Room 5' },
  { id: 2, code: 'BOT-102', title: 'Practical Agronomy & Field Botany', grade: 'JSS1', students: 22, avgGrade: '81%', pendingGrading: 1, schedule: 'Mon/Wed/Fri 10:00 AM', room: 'Farm Area' },
  { id: 3, code: 'ENG-103', title: 'Language Arts & Creative Writing', grade: 'JSS1', students: 19, avgGrade: '92%', pendingGrading: 0, schedule: 'Mon/Wed 1:00 PM', room: 'Room 8' },
];

const PENDING_SUBMISSIONS = [
  { id: 101, student: 'Emeka Amadi', classCode: 'MTH-101', title: 'Agronomy Micro-Economy Financial Ledger', submittedAt: 'Yesterday 4:30 PM', file: 'emeka_ledger_v2.pdf', score: 0, maxScore: 100, feedback: '' },
  { id: 102, student: 'Ada Obi', classCode: 'MTH-101', title: 'Agronomy Micro-Economy Financial Ledger', submittedAt: 'Yesterday 6:15 PM', file: 'ada_math_ledger.pdf', score: 0, maxScore: 100, feedback: '' },
  { id: 103, student: 'Kufre Bassey', classCode: 'BOT-102', title: 'Cassava Planting Observations', submittedAt: 'Jul 22 2:10 PM', file: 'kufre_botany_field.docx', score: 0, maxScore: 100, feedback: '' },
];

const STUDENT_ROSTER = [
  { id: 1, name: 'Emeka Amadi', code: 'STU-2026-001', grade: 'JSS1', house: 'Blue House (Eagle)', gpa: '3.85', attendance: '98%', status: 'Active', atRisk: false },
  { id: 2, name: 'Ada Obi', code: 'STU-2026-002', grade: 'JSS1', house: 'Purple House (Phoenix)', gpa: '3.92', attendance: '100%', status: 'Active', atRisk: false },
  { id: 3, name: 'Kufre Bassey', code: 'STU-2026-003', grade: 'JSS1', house: 'Green House (Jaguar)', gpa: '2.80', attendance: '82%', status: 'Needs Intervention', atRisk: true },
  { id: 4, name: 'Chidimma Eke', code: 'STU-2026-004', grade: 'JSS1', house: 'Red House (Falcon)', gpa: '3.45', attendance: '94%', status: 'Active', atRisk: false },
  { id: 5, name: 'Tari Okoro', code: 'STU-2026-005', grade: 'JSS1', house: 'Blue House (Eagle)', gpa: '3.60', attendance: '96%', status: 'Active', atRisk: false },
];

const MONTESSORI_OBSERVATIONS = [
  { id: 1, student: 'Emeka Amadi', category: 'Practical Life', observation: 'Emeka organized the agronomy tools independently before the field work session.', date: 'Jul 23, 2026', mastery: 'Exemplary' },
  { id: 2, student: 'Kufre Bassey', category: 'Mathematics', observation: 'Struggled with 3D projection scaling; provided extra control of error materials.', date: 'Jul 22, 2026', mastery: 'Developing' },
  { id: 3, student: 'Ada Obi', category: 'Language Arts', observation: 'Demonstrated outstanding narrative flow and vocabulary during short story presentation.', date: 'Jul 21, 2026', mastery: 'Exemplary' },
];

const TIMETABLE = [
  { time: '8:00 - 9:30 AM', class: 'MTH-101', title: 'Montessori Applied Mathematics', room: 'Room 5', days: 'Mon, Wed, Thu' },
  { time: '10:00 - 11:30 AM', class: 'BOT-102', title: 'Practical Agronomy & Field Botany', room: 'Farm Area', days: 'Mon, Wed, Fri' },
  { time: '1:00 - 2:30 PM', class: 'ENG-103', title: 'Language Arts & Creative Writing', room: 'Room 8', days: 'Mon, Wed' },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  // Sub-tab states
  const [studentSubTab, setStudentSubTab] = useState<'roster' | 'attendance' | 'montessori'>('roster');
  const [resultsSubTab, setResultsSubTab] = useState<'queue' | 'gradebook'>('queue');

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
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsForm, setObsForm] = useState({ student: 'Emeka Amadi', category: 'Practical Life', observation: '', mastery: 'Proficient' });
  const [obsList, setObsList] = useState(MONTESSORI_OBSERVATIONS);
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointForm, setPointForm] = useState({ student: 'Emeka Amadi', points: 15, category: 'Academic Excellence', house: 'Blue House (Eagle)' });

  // Settings State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || 'Teacher',
    lastName: user?.last_name || 'Suite',
    email: user?.email || 'teacher@tarepet.edu.ng',
    phone: '+234 803 123 4567',
    specialization: 'Mathematics & Agronomy',
    emailAlerts: true,
    cbtAlerts: true,
  });

  const [gradebookScores, setGradebookScores] = useState<Record<number, { ca1: number; ca2: number; midterm: number; exam: number }>>({
    1: { ca1: 9, ca2: 9, midterm: 18, exam: 52 },
    2: { ca1: 10, ca2: 10, midterm: 19, exam: 54 },
    3: { ca1: 6, ca2: 7, midterm: 12, exam: 38 },
    4: { ca1: 8, ca2: 9, midterm: 16, exam: 48 },
    5: { ca1: 9, ca2: 8, midterm: 17, exam: 50 },
  });

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

  const handleAddObservation = () => {
    if (!obsForm.observation) return;
    setObsList(prev => [{
      id: prev.length + 1,
      student: obsForm.student,
      category: obsForm.category,
      observation: obsForm.observation,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      mastery: obsForm.mastery,
    }, ...prev]);
    setShowObsModal(false);
    showToast(`Montessori observation logged for ${obsForm.student}.`);
    setObsForm({ student: 'Emeka Amadi', category: 'Practical Life', observation: '', mastery: 'Proficient' });
  };

  const handleAwardPoints = () => {
    setShowPointModal(false);
    showToast(`Awarded ${pointForm.points} House Points to ${pointForm.student} (${pointForm.house})! 🎉`);
  };

  const filteredRoster = roster.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.code.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const renderSection = () => {
    // =========================================================
    // 1. OVERVIEW
    // =========================================================
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block mb-3">Teacher Management Portal</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-1">Welcome back, {user?.first_name ?? 'Teacher'}! 👋</h2>
          <p className="text-emerald-100 text-sm">Managing 3 classes · 65 active students · {submissions.length} pending submissions to grade.</p>
        </div>

        {/* CBT Exam Engine Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-1.5 inline-block">CBT Assessment System</span>
            <h3 className="text-xl font-bold">CBT Exam Builder & Management</h3>
            <p className="text-blue-100 text-xs mt-1">Create CBT tests/exams, submit for admin approval, upload to students & sync scores to report cards.</p>
          </div>
          <Link href="/dashboard/cbt-builder">
            <button className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition shadow-md whitespace-nowrap">
              Open CBT Builder →
            </button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Assigned Classes', val: '3', sub: '65 Students', icon: BookOpen, color: 'text-primary bg-primary/10 border-primary/20' },
            { label: 'Pending Grading', val: `${submissions.length}`, sub: 'Action required', icon: FileText, color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
            { label: 'At-Risk Students', val: '1', sub: 'Requires intervention', icon: AlertCircle, color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
            { label: 'Avg Attendance', val: '94%', sub: 'This week', icon: UserCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
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
          <h3 className="font-serif font-bold text-foreground mb-4">Quick Portal Access</h3>
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
            <Calendar className="w-4 h-4 text-primary" /> Today's Class Schedule
          </h3>
          <div className="space-y-2.5">
            {TIMETABLE.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t.class}</span>
                  <h4 className="font-bold text-sm text-foreground mt-1">{t.title}</h4>
                  <p className="text-xs text-muted-foreground">{t.room} • {t.days}</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 2. MANAGE STUDENTS
    // =========================================================
    if (activeSection === 'students') return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Manage Students</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Roster profiles, daily attendance, and Montessori observations.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowObsModal(true)} className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all">
              <Star className="w-3.5 h-3.5" /> Log Observation
            </button>
            <button onClick={() => setShowPointModal(true)} className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
              <Award className="w-3.5 h-3.5" /> Award House Points
            </button>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex border-b border-border gap-2">
          {[
            { id: 'roster', label: 'Student Roster', icon: Users },
            { id: 'attendance', label: 'Daily Attendance', icon: UserCheck },
            { id: 'montessori', label: 'Montessori & Behavior', icon: Star },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setStudentSubTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                studentSubTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
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
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">House</th>
                    <th className="p-3">GPA</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoster.map(s => (
                    <tr key={s.id} className="hover:bg-muted/10">
                      <td className="p-3 font-bold text-foreground">{s.name}</td>
                      <td className="p-3 text-muted-foreground font-mono">{s.code}</td>
                      <td className="p-3 font-semibold text-primary">{s.grade}</td>
                      <td className="p-3 text-muted-foreground">{s.house}</td>
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
                <h3 className="font-serif font-bold text-foreground">Mark Attendance — MTH-101</h3>
                <p className="text-xs text-muted-foreground">Select present, late, or absent status for today's session.</p>
              </div>
              <button onClick={() => showToast('Attendance saved successfully!')} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
                Save Attendance
              </button>
            </div>
            <div className="space-y-2">
              {roster.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10">
                  <span className="font-bold text-sm text-foreground">{s.name} ({s.code})</span>
                  <div className="flex gap-2">
                    {['present', 'late', 'absent'].map(st => (
                      <button
                        key={st}
                        onClick={() => setAttendanceState(prev => ({ ...prev, [s.id]: st }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          attendanceState[s.id] === st
                            ? st === 'present' ? 'bg-emerald-600 text-white' : st === 'late' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-tab 3: Montessori Observations */}
        {studentSubTab === 'montessori' && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {obsList.map(o => (
                <div key={o.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-foreground text-sm">{o.student} • <span className="text-primary">{o.category}</span></span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{o.mastery}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.observation}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{o.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    // =========================================================
    // 3. MANAGE EXAMS
    // =========================================================
    if (activeSection === 'exams') return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">CBT Examination System</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Manage & Build CBT Exams</h2>
            <p className="text-blue-100 text-xs mt-1 max-w-xl">Create MCQs, submit for admin approval, upload/publish approved exams to students, and review auto-graded submissions.</p>
          </div>
          <Link href="/dashboard/cbt-builder">
            <button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
              Launch CBT Exam Builder →
            </button>
          </Link>
        </div>

        {/* CBT Workflow Pipeline Explanation */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-serif font-bold text-foreground text-lg mb-4">CBT Exam Lifecycle & Approval Flow</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1. Set & Create', title: 'Set Questions', desc: 'Add MCQs with Options A-D, duration & instructions.', color: 'border-blue-500 bg-blue-50/50 text-blue-700' },
              { step: '2. Submit', title: 'Admin Review', desc: 'Submit for Admin approval. Admin gets real-time notification.', color: 'border-amber-500 bg-amber-50/50 text-amber-700' },
              { step: '3. Upload', title: 'Publish to Class', desc: 'Receive approval message, then click Upload to publish live for students.', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700' },
              { step: '4. Results', title: 'Auto-Graded & Sync', desc: 'Students start exam with timer. Auto-grades score & syncs to gradebook.', color: 'border-purple-500 bg-purple-50/50 text-purple-700' },
            ].map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border-l-4 ${s.color}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70 mb-1">{s.step}</span>
                <h4 className="font-bold text-sm mb-1">{s.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launch Card */}
        <div className="bg-muted/20 rounded-2xl border border-border p-8 text-center space-y-4">
          <ClipboardList className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-xl font-serif font-bold text-foreground">Ready to set a test or exam?</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">Access the full CBT Builder to set questions, set timers, choose questions per view, and send for admin approval.</p>
          <Link href="/dashboard/cbt-builder">
            <button className="bg-primary text-white hover:bg-primary/90 font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-md">
              Open CBT Builder Now
            </button>
          </Link>
        </div>
      </div>
    );

    // =========================================================
    // 4. MANAGE RESULTS
    // =========================================================
    if (activeSection === 'results') return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Manage Results & Gradebook</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Grade student assignment submissions and record term CA & exam scores.</p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex border-b border-border gap-2">
          {[
            { id: 'queue', label: `Pending Submissions (${submissions.length})`, icon: FileText },
            { id: 'gradebook', label: 'Term Gradebook & Scores', icon: BarChart2 },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setResultsSubTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                resultsSubTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Sub-tab 1: Grading Queue */}
        {resultsSubTab === 'queue' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-foreground text-lg">All Submissions Graded!</h4>
                <p className="text-xs text-muted-foreground">There are no pending student submissions requiring evaluation.</p>
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
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted by: <strong>{s.student}</strong> • File: <span className="font-mono text-primary">{s.file}</span></p>
                    </div>
                    <button onClick={() => setSelectedSub(s)} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors self-start md:self-auto">
                      Grade Submission
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Grading Modal */}
            {selectedSub && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSub(null)}>
                <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif font-bold text-lg text-foreground">Grade: {selectedSub.student}</h3>
                  <p className="text-xs text-muted-foreground">{selectedSub.title} ({selectedSub.classCode})</p>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Score (out of 100)</label>
                    <input type="number" min={0} max={100} value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder="e.g. 85" className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Feedback Comments</label>
                    <textarea rows={3} value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Provide constructive feedback for student..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedSub(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent">Cancel</button>
                    <button onClick={handleGradeSubmit} disabled={!gradeInput} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50">Submit Grade</button>
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
                <h3 className="font-serif font-bold text-foreground">Class Gradebook — MTH-101</h3>
                <p className="text-xs text-muted-foreground">Record and review CA1 (10%), CA2 (10%), Midterm (20%), and Final Exam (60%) scores.</p>
              </div>
              <button onClick={() => showToast('Gradebook scores saved & synced to student report cards!')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
                Sync Scores to Report Cards
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3 text-center">CA 1 (10%)</th>
                    <th className="p-3 text-center">CA 2 (10%)</th>
                    <th className="p-3 text-center">Midterm (20%)</th>
                    <th className="p-3 text-center">Final Exam (60%)</th>
                    <th className="p-3 text-center">Total (100%)</th>
                    <th className="p-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roster.map(s => {
                    const sc = gradebookScores[s.id] || { ca1: 0, ca2: 0, midterm: 0, exam: 0 };
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
    // 5. SETTINGS
    // =========================================================
    if (activeSection === 'settings') return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Teacher Portal Settings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your profile details, assigned courses, and notification alerts.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profile Information
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
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
              <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Phone Number</label>
              <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Subject Specialization</label>
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
                <p className="font-bold text-xs text-foreground">CBT Exam Submission Alerts</p>
                <p className="text-[10px] text-muted-foreground">Receive real-time alerts when students submit completed CBT exams.</p>
              </div>
              <input type="checkbox" checked={profileForm.cbtAlerts} onChange={e => setProfileForm({...profileForm, cbtAlerts: e.target.checked})} className="w-4 h-4 text-primary rounded" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
              <div>
                <p className="font-bold text-xs text-foreground">Admin Approval Notifications</p>
                <p className="text-[10px] text-muted-foreground">Get notified when an Admin approves or rejects your drafted CBT exams.</p>
              </div>
              <input type="checkbox" checked={profileForm.emailAlerts} onChange={e => setProfileForm({...profileForm, emailAlerts: e.target.checked})} className="w-4 h-4 text-primary rounded" />
            </label>
          </div>
          <button onClick={() => showToast('Teacher profile & preferences updated!')} className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    );

    // Fallback for any unknown section
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Teacher Management Portal</h2>
        <p className="text-xs text-muted-foreground">Select a section from the sidebar menu to begin.</p>
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

        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
