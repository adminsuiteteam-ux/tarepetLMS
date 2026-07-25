import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen, Users, FileText, UserCheck, Award, Calendar,
  BarChart2, Star, Clock, CheckCircle2, AlertCircle, Plus,
  Search, Filter, Upload, Download, Send, Eye, Edit2, Trash2,
  TrendingUp, TrendingDown, Play, Lock, MessageSquare, ChevronDown,
  CheckSquare, XCircle, RefreshCw, PenLine, Globe, Layers, ArrowUpRight,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────
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
  const [submissions, setSubmissions] = useState(PENDING_SUBMISSIONS);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [roster, setRoster] = useState(STUDENT_ROSTER);
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({
    1: 'present', 2: 'present', 3: 'late', 4: 'present', 5: 'present'
  });
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', classCode: 'MTH-101', type: 'Video', duration: '20 min' });
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsForm, setObsForm] = useState({ student: 'Emeka Amadi', category: 'Practical Life', observation: '', mastery: 'Proficient' });
  const [obsList, setObsList] = useState(MONTESSORI_OBSERVATIONS);
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointForm, setPointForm] = useState({ student: 'Emeka Amadi', points: 15, category: 'Academic Excellence', house: 'Blue House (Eagle)' });
  
  // New Enhanced States
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [gradingSubTab, setGradingSubTab] = useState<'queue' | 'gradebook'>('queue');
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', classCode: 'MTH-101', subject: 'Mathematics', date: '2026-08-10', venue: 'Hall A', duration: '3hrs' });
  const [selectedSchemeCourse, setSelectedSchemeCourse] = useState<string | null>(null);
  const [completedWeeks, setCompletedWeeks] = useState<Record<string, number[]>>({
    'MTH-101': [1, 2, 3, 4],
    'BOT-102': [1, 2, 3],
    'ENG-103': [1, 2, 3, 4, 5],
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

  // Handlers
  const handleGradeSubmit = () => {
    if (!selectedSub) return;
    setSubmissions(prev => prev.filter(s => s.id !== selectedSub.id));
    setSelectedSub(null);
    setGradeInput('');
    setFeedbackInput('');
    showToast(`Graded submission for ${selectedSub.student} successfully!`);
  };

  const handleCreateLesson = () => {
    if (!lessonForm.title) return;
    setShowLessonModal(false);
    showToast(`Lesson "${lessonForm.title}" published successfully!`);
    setLessonForm({ title: '', classCode: 'MTH-101', type: 'Video', duration: '20 min' });
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

  const handleCreateExam = () => {
    if (!examForm.title) return;
    setShowExamModal(false);
    showToast(`Exam paper "${examForm.title}" submitted to Admin for approval!`);
    setExamForm({ title: '', classCode: 'MTH-101', subject: 'Mathematics', date: '2026-08-10', venue: 'Hall A', duration: '3hrs' });
  };

  const toggleWeekCompletion = (courseCode: string, weekNum: number) => {
    setCompletedWeeks(prev => {
      const current = prev[courseCode] || [];
      const updated = current.includes(weekNum)
        ? current.filter(w => w !== weekNum)
        : [...current, weekNum];
      return { ...prev, [courseCode]: updated };
    });
  };

  const renderSection = () => {
    // 1. OVERVIEW
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block mb-3">Teacher Management Portal</p>
          <h2 className="text-3xl font-serif font-bold mb-1">Welcome back, {user?.first_name ?? 'Teacher'}! 👋</h2>
          <p className="text-emerald-100 text-sm">Managing 3 classes · 65 total students · {submissions.length} pending submissions to grade.</p>
        </div>

        {/* CBT Quick Action Banner */}
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

        {/* Quick Action Buttons */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Quick Management Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Grade Queue', section: 'grading', icon: FileText },
              { label: 'Mark Attendance', section: 'attendance', icon: UserCheck },
              { label: 'Add Observation', section: 'montessori', icon: Star },
              { label: 'Lesson Builder', section: 'content', icon: PenLine },
            ].map((a, i) => (
              <button key={i} onClick={() => setActiveSection(a.section)} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold text-foreground">
                <span className="flex items-center gap-2"><a.icon className="w-4 h-4 text-primary" />{a.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    // 2. MY CLASSES & COURSES
    if (activeSection === 'classes') return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">My Assigned Courses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage syllabus, scheme of work, and submit exams to admin.</p>
          </div>
          <button onClick={() => setShowExamModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Draft & Submit Exam Paper
          </button>
        </div>

        {selectedSchemeCourse ? (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{selectedSchemeCourse}</span>
                <h3 className="font-serif font-bold text-xl text-foreground mt-1">Scheme of Work — Term 2 Syllabus</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Track weekly topic progress and completion status.</p>
              </div>
              <button onClick={() => setSelectedSchemeCourse(null)} className="text-xs font-bold border border-border px-3.5 py-2 rounded-xl hover:bg-accent transition-colors">
                Back to Courses
              </button>
            </div>

            <div className="space-y-3">
              {[
                { week: 1, topic: 'Introduction & Curriculum Setup', detail: 'Foundational review, syllabus guidelines, and course material introduction.' },
                { week: 2, topic: 'Core Theoretical Framework', detail: 'Primary theories, key definitions, and practical demonstrations.' },
                { week: 3, topic: 'Applied Practical Fieldwork', detail: 'Hands-on practical session, tool organization, and field observations.' },
                { week: 4, topic: 'Montessori Control of Error Analysis', detail: 'Self-correction exercises, peer collaboration, and material scaling.' },
                { week: 5, topic: 'Mid-Term Assessment & Review', detail: 'Comprehensive mid-term evaluation and student feedback.' },
                { week: 6, topic: 'Advanced Problem Solving', detail: 'Complex problem analysis, case studies, and application.' },
                { week: 7, topic: 'Collaborative Project Workshop', detail: 'Group ledgers, practical life applications, and presentations.' },
                { week: 8, topic: 'Revision & Interactive Drills', detail: 'Targeted revision drills for developing student competencies.' },
                { week: 9, topic: 'Terminal Exam Revision', detail: 'Mock tests, exam rules review, and final questions practice.' },
                { week: 10, topic: 'Final Terminal Examination', detail: 'Official term examination administration and evaluation.' },
              ].map(w => {
                const isDone = (completedWeeks[selectedSchemeCourse] || []).includes(w.week);
                return (
                  <div key={w.week} className={`p-4 rounded-xl border transition-all ${isDone ? 'bg-emerald-500/5 border-emerald-200' : 'bg-muted/10 border-border'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleWeekCompletion(selectedSchemeCourse, w.week)}
                          className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border bg-card'}`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <p className="font-bold text-foreground text-sm">Week {w.week}: {w.topic}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{w.detail}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDone ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-amber-500/10 text-amber-600 border border-amber-200'}`}>
                        {isDone ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEACHER_CLASSES.map(c => (
              <div key={c.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{c.code}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Avg: {c.avgGrade}</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-foreground text-lg">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.grade} · {c.students} Students</p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>📍 {c.room}</p>
                  <p>⏰ {c.schedule}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setSelectedSchemeCourse(c.code)} className="flex-1 bg-primary/10 text-primary border border-primary/20 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">
                    Scheme of Work
                  </button>
                  <button onClick={() => setActiveSection('content')} className="flex-1 bg-muted/40 text-foreground border border-border py-2 rounded-xl text-xs font-bold hover:bg-accent transition-colors">
                    Manage Lessons
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    // 3. LESSON BUILDER & CONTENT
    if (activeSection === 'content') return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground">Lesson Builder & Content Creation</h2>
          <button onClick={() => setShowLessonModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Create Lesson
          </button>
        </div>

        {showLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 space-y-4">
              <h3 className="font-serif font-bold text-xl text-foreground">Create New Lesson</h3>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Course</label>
                <select value={lessonForm.classCode} onChange={e => setLessonForm({ ...lessonForm, classCode: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                  {TEACHER_CLASSES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Lesson Title</label>
                <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. Micro-Economy Ledger Analysis" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Type</label>
                  <select value={lessonForm.type} onChange={e => setLessonForm({ ...lessonForm, type: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Video</option><option>PDF</option><option>Interactive</option><option>Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Est. Duration</label>
                  <input value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreateLesson} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">Publish Lesson</button>
                <button onClick={() => setShowLessonModal(false)} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <h3 className="font-serif font-bold text-foreground">Course Modules & Materials</h3>
          {['Module 1: Foundations & Real-World Application', 'Module 2: Practical Agronomy Fieldwork'].map((mod, i) => (
            <div key={i} className="border border-border rounded-xl p-4 bg-muted/10 space-y-2">
              <p className="font-bold text-foreground text-sm">{mod}</p>
              <div className="space-y-1.5 pl-3 border-l-2 border-primary/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-foreground">1. Geometric Solids in Architecture</span>
                  <span className="text-muted-foreground">Video · 18 min</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-foreground">2. Micro-Economy Ledger Project</span>
                  <span className="text-muted-foreground">Assignment · 45 min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // 4. GRADING & RUBRICS
    if (activeSection === 'grading') return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-serif font-bold text-foreground">Grading & Score Entry</h2>
          <div className="flex bg-muted p-1 rounded-xl gap-1">
            <button
              onClick={() => setGradingSubTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${gradingSubTab === 'queue' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Submissions Queue ({submissions.length})
            </button>
            <button
              onClick={() => setGradingSubTab('gradebook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${gradingSubTab === 'gradebook' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Term CA Gradebook Sheet
            </button>
          </div>
        </div>

        {gradingSubTab === 'queue' && (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{sub.classCode}</span>
                    <span className="text-xs font-bold text-foreground">{sub.student}</span>
                  </div>
                  <h4 className="font-serif font-bold text-foreground text-base">{sub.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Submitted: {sub.submittedAt} · File: <strong className="text-primary">{sub.file}</strong></p>
                </div>
                <button onClick={() => setSelectedSub(sub)} className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                  Grade Submission
                </button>
              </div>
            ))}
            {submissions.length === 0 && (
              <div className="text-center py-10 bg-card rounded-2xl border border-border">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-serif font-bold text-foreground text-lg">All Submissions Graded!</p>
                <p className="text-xs text-muted-foreground mt-1">Great job! There are no pending items in your queue.</p>
              </div>
            )}
          </div>
        )}

        {gradingSubTab === 'gradebook' && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-foreground text-base">Continuous Assessment (CA) & Exam Score Sheet</h3>
                <p className="text-xs text-muted-foreground">Class: JSS1 · Course: MTH-101 (Montessori Applied Mathematics)</p>
              </div>
              <button onClick={() => showToast('Gradebook scores saved & synchronized!')} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                Save Gradebook
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-bold uppercase">
                  <tr>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3 text-center">CA1 (10%)</th>
                    <th className="py-3 px-3 text-center">CA2 (10%)</th>
                    <th className="py-3 px-3 text-center">Mid-Term (20%)</th>
                    <th className="py-3 px-3 text-center">Terminal Exam (60%)</th>
                    <th className="py-3 px-3 text-center">Total (100%)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roster.map(st => {
                    const sc = gradebookScores[st.id] || { ca1: 0, ca2: 0, midterm: 0, exam: 0 };
                    const total = sc.ca1 + sc.ca2 + sc.midterm + sc.exam;
                    const gradeLetter = total >= 85 ? 'A' : total >= 75 ? 'B+' : total >= 65 ? 'B' : total >= 50 ? 'C' : 'F';
                    return (
                      <tr key={st.id} className="hover:bg-muted/20">
                        <td className="py-3 px-3 font-bold text-foreground">{st.name}</td>
                        <td className="py-2 px-2 text-center">
                          <input type="number" max="10" min="0" value={sc.ca1}
                            onChange={e => setGradebookScores(prev => ({ ...prev, [st.id]: { ...sc, ca1: Number(e.target.value) } }))}
                            className="w-14 text-center border border-border rounded-lg py-1 font-bold text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary" />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input type="number" max="10" min="0" value={sc.ca2}
                            onChange={e => setGradebookScores(prev => ({ ...prev, [st.id]: { ...sc, ca2: Number(e.target.value) } }))}
                            className="w-14 text-center border border-border rounded-lg py-1 font-bold text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary" />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input type="number" max="20" min="0" value={sc.midterm}
                            onChange={e => setGradebookScores(prev => ({ ...prev, [st.id]: { ...sc, midterm: Number(e.target.value) } }))}
                            className="w-14 text-center border border-border rounded-lg py-1 font-bold text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary" />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input type="number" max="60" min="0" value={sc.exam}
                            onChange={e => setGradebookScores(prev => ({ ...prev, [st.id]: { ...sc, exam: Number(e.target.value) } }))}
                            className="w-16 text-center border border-border rounded-lg py-1 font-bold text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary" />
                        </td>
                        <td className="py-3 px-3 text-center font-serif font-bold text-primary text-sm">{total}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${total >= 75 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-amber-500/10 text-amber-600 border border-amber-200'}`}>
                            {gradeLetter}
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

        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-serif font-bold text-xl text-foreground">Grade: {selectedSub.student}</h3>
              <p className="text-xs text-muted-foreground">{selectedSub.title}</p>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Score (Out of {selectedSub.maxScore})</label>
                <input type="number" value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder="e.g. 92" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Feedback Comments</label>
                <textarea rows={3} value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Excellent work on analytical steps..." className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleGradeSubmit} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">Submit Grade</button>
                <button onClick={() => setSelectedSub(null)} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    // 5. ATTENDANCE & MARKING
    if (activeSection === 'attendance') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">Attendance Marker — JSS1 Class</h2>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <span className="text-xs font-bold text-muted-foreground">Student Name</span>
            <span className="text-xs font-bold text-muted-foreground">Attendance Status</span>
          </div>
          <div className="space-y-3">
            {roster.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.code} · {s.house}</p>
                </div>
                <div className="flex gap-1">
                  {['present', 'absent', 'late', 'excused'].map(st => (
                    <button key={st} onClick={() => setAttendanceState(prev => ({ ...prev, [s.id]: st }))}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-all ${attendanceState[s.id] === st ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                      {st[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">Save Today's Attendance</button>
        </div>
      </div>
    );

    // 6. STUDENT ROSTER & SUPPORT
    if (activeSection === 'students') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">Student Roster & Support</h2>
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">House</th>
                <th className="py-3 px-4">GPA</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.map(r => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-bold text-foreground">{r.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.house}</td>
                  <td className="py-3 px-4 font-bold text-primary">{r.gpa}</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">{r.attendance}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.atRisk ? 'bg-rose-500/10 text-rose-600 border border-rose-200' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    // 7. MONTESSORI & OBSERVATIONS
    if (activeSection === 'montessori') return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-foreground">Montessori Observation Logs</h2>
          <button onClick={() => setShowObsModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Log Observation
          </button>
        </div>

        {showObsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-serif font-bold text-xl text-foreground">New Observation</h3>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Student</label>
                <select value={obsForm.student} onChange={e => setObsForm({ ...obsForm, student: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                  {roster.map(r => <option key={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Observation Notes</label>
                <textarea rows={3} value={obsForm.observation} onChange={e => setObsForm({ ...obsForm, observation: e.target.value })} placeholder="Observed independent practical life tool usage..." className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddObservation} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">Save Observation</button>
                <button onClick={() => setShowObsModal(false)} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {obsList.map(o => (
            <div key={o.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground text-sm">{o.student}</span>
                <span className="text-[10px] text-muted-foreground">{o.date}</span>
              </div>
              <p className="text-xs text-muted-foreground">{o.observation}</p>
            </div>
          ))}
        </div>
      </div>
    );

    // 8. MESSAGES
    if (activeSection === 'messages') return (
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">Teacher Messages</h2>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <p className="text-xs text-muted-foreground">Select a student or parent to broadcast announcements or send individual messages.</p>
          <input placeholder="Type announcement or message..." className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
          <button className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">Send Broadcast</button>
        </div>
      </div>
    );

    // 9. TIMETABLE
    if (activeSection === 'timetable') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">Teaching Schedule</h2>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          {TIMETABLE.map((t, i) => (
            <div key={i} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
              <div>
                <p className="font-serif font-bold text-foreground text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.days} · {t.room}</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{t.time}</span>
            </div>
          ))}
        </div>
      </div>
    );

    // 10. ANALYTICS
    if (activeSection === 'analytics') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">Class Performance Analytics</h2>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Class Average</p>
              <p className="text-3xl font-serif font-bold text-primary mt-1">87.0%</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Pass Rate</p>
              <p className="text-3xl font-serif font-bold text-emerald-600 mt-1">100%</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Mastery Rate</p>
              <p className="text-3xl font-serif font-bold text-purple-600 mt-1">82%</p>
            </div>
          </div>
        </div>
      </div>
    );

    return null;
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
      <PortalLayout title="Teacher Portal" activeSection={activeSection} onNavigate={setActiveSection}>
        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
