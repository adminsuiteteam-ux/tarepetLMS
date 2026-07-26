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

import { getStoredExams, updateExamStatus, getStoredSubmissions, subscribeToCBTStore } from '@/lib/cbt-store';

// ─── Initial Seed Data (SS1 Science Teacher) ─────────────────
const TEACHER_CLASSES: any[] = [];

const PENDING_SUBMISSIONS: any[] = [];
const STUDENT_ROSTER: any[] = [];
const MONTESSORI_OBSERVATIONS: any[] = [];

const TIMETABLE: any[] = [];

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
    setObsForm({ student: '', category: 'Practical Life', observation: '', mastery: 'Proficient' });
  };

  const handleAwardPoints = () => {
    setShowPointModal(false);
    showToast(`Awarded ${pointForm.points} House Points! 🎉`);
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
          <p className="text-emerald-100 text-sm">Manage classes, CBT assessments, and student progress.</p>
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
                <p className="text-xs font-semibold">No class schedule configured for today.</p>
              </div>
            )}
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
    // 3. MANAGE EXAMS & CBT LIFECYCLE
    // =========================================================
    if (activeSection === 'exams') {
      const allExams = getStoredExams();
      const allSubmissions = getStoredSubmissions();
      const approvedExams = allExams.filter(e => e.status === 'APPROVED');
      const activeExams = allExams.filter(e => e.status === 'ACTIVE');
      const pendingExams = allExams.filter(e => e.status === 'PENDING');

      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2">CBT Examination System</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">SS1 Science CBT Exam Control</h2>
              <p className="text-blue-100 text-xs mt-1 max-w-xl">Create MCQs, monitor Admin approvals, click Proceed to activate live exams for SS1 Science students, and review submitted scores.</p>
            </div>
            <Link href="/dashboard/cbt-builder">
              <button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg whitespace-nowrap">
                Launch CBT Exam Builder →
              </button>
            </Link>
          </div>

          {/* Action Required: Approved Exams Waiting to Proceed */}
          {approvedExams.length > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Admin Approved Exams Ready to Proceed ({approvedExams.length})</span>
              </div>
              <p className="text-xs text-emerald-700">The Admin has reviewed and approved the following exams. Click <strong>"Proceed / Activate Exam"</strong> so your SS1 Science students can receive and take the exam in their portal.</p>
              <div className="space-y-3 pt-1">
                {approvedExams.map(ex => (
                  <div key={ex.id} className="bg-white p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{ex.course_code}</span>
                      <h4 className="font-bold text-foreground text-sm mt-1">{ex.title}</h4>
                      <p className="text-xs text-muted-foreground">{ex.duration_minutes} mins · {ex.questions_count || ex.questions?.length} Objective Questions</p>
                    </div>
                    <button
                      onClick={() => {
                        updateExamStatus(ex.id, 'ACTIVE');
                        showToast(`Activated "${ex.title}"! SS1 Science students can now start this exam.`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 self-start sm:self-auto ring-2 ring-emerald-400/50 animate-pulse"
                    >
                      <Send className="w-4 h-4" /> Proceed / Activate Exam for Students
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
                      <p className="text-xs text-muted-foreground">{ex.course_code} · {ex.duration_minutes} mins · SS1 Science Students</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                      Receiving Submissions...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-Time Student CBT Submissions Queue */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-foreground text-base">Received Student CBT Submissions ({allSubmissions.length})</h3>
              <span className="text-xs font-semibold text-muted-foreground">Auto-Graded & Verified</span>
            </div>

            {allSubmissions.length > 0 ? (
              <div className="space-y-3">
                {allSubmissions.map(sub => (
                  <div key={sub.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-sm">{sub.student_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{sub.class} {sub.stream}</span>
                        <span className="text-xs text-muted-foreground">({sub.student_id})</span>
                      </div>
                      <h4 className="font-semibold text-foreground text-xs">{sub.exam_title} ({sub.course_code})</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Submitted: {new Date(sub.submitted_at).toLocaleTimeString()} · Score: <strong>{sub.score} / {sub.total_possible}</strong></p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-lg font-serif font-bold text-emerald-600">{sub.percentage}%</span>
                        <p className="text-[9px] font-bold uppercase text-emerald-700">Auto-Graded</p>
                      </div>
                      <button
                        onClick={() => showToast(`Synced ${sub.student_name}'s score (${sub.percentage}%) to official gradebook!`)}
                        className="bg-primary text-white font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-primary/90 transition-colors"
                      >
                        Sync Gradebook
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-border/50">
                <p className="text-sm font-semibold">No student submissions received yet.</p>
                <p className="text-xs mt-1">Once students start and submit their exams in the student portal, their scores will appear here automatically.</p>
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
