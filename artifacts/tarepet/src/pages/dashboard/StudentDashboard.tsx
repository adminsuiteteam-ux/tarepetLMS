import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen, Award, Calendar, Clock, CheckCircle2, Upload,
  Star, ChevronRight, FileText, Play, Lock, ArrowUpRight,
  BarChart2, TrendingUp, TrendingDown, Download, Send,
  User, Target, Flame, Zap, Bell, Search, Filter,
  Plus, Edit2, Trash2, Eye, XCircle, AlertCircle,
  BookMarked, PenLine, Image, Mic, Video, Globe,
  CheckSquare, MessageSquare, RefreshCw, ChevronDown,
  Moon, Sun, Monitor, ChevronUp, Briefcase, UserCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
interface Course {
  id: number; code: string; title: string; teacher: string;
  progress: number; grade: string; nextDue: string;
  thumbnail: string; color: string; enrolled: number;
}

// ─── Mock Data ────────────────────────────────────────────────
const COURSES: Course[] = [
  { id: 1, code: 'MTH-101', title: 'Montessori Applied Mathematics', teacher: 'Mrs. Okafor Chioma', progress: 78, grade: 'A', nextDue: 'Aug 15', thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop', color: '#3B82F6', enrolled: 24 },
  { id: 2, code: 'BOT-102', title: 'Practical Agronomy & Field Botany', teacher: 'Mr. Amadi Ebi', progress: 62, grade: 'B+', nextDue: 'Aug 18', thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=600&auto=format&fit=crop', color: '#10B981', enrolled: 22 },
  { id: 3, code: 'ENG-103', title: 'Language Arts & Creative Writing', teacher: 'Mrs. Dada Kemi', progress: 91, grade: 'A+', nextDue: 'Jul 30', thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop', color: '#8B5CF6', enrolled: 19 },
  { id: 4, code: 'SCI-104', title: 'Integrated Science & Environment', teacher: 'Mr. Okonkwo Paul', progress: 55, grade: 'B', nextDue: 'Aug 5', thumbnail: 'https://images.unsplash.com/photo-1532094349884-543559769de8?q=80&w=600&auto=format&fit=crop', color: '#F59E0B', enrolled: 21 },
];

const LESSONS: Record<number, any[]> = {
  1: [
    { title: 'Geometric Solids in Architecture', done: true, type: 'Video', duration: '18 min' },
    { title: 'Practical Measurement in Agronomy', done: true, type: 'Video', duration: '22 min' },
    { title: 'Micro-Economy Ledger Basics', done: true, type: 'PDF', duration: '15 min' },
    { title: 'Farm Profit Calculation Project', done: false, type: 'Assignment', duration: '45 min' },
    { title: 'End-of-Module Quiz 1', done: false, type: 'Quiz', locked: true, duration: '20 min' },
  ],
  2: [
    { title: 'Introduction to Erdkinder Farm', done: true, type: 'Video', duration: '20 min' },
    { title: 'Plant Classification Methods', done: true, type: 'Video', duration: '25 min' },
    { title: 'Field Study Report Guide', done: false, type: 'PDF', duration: '10 min' },
    { title: 'Cassava Harvest Ledger', done: false, type: 'Assignment', duration: '60 min' },
  ],
  3: [
    { title: 'The Art of Storytelling', done: true, type: 'Video', duration: '15 min' },
    { title: 'Character Development Workshop', done: true, type: 'Interactive', duration: '30 min' },
    { title: 'Essay Structure Masterclass', done: true, type: 'PDF', duration: '20 min' },
    { title: 'Short Story Draft', done: true, type: 'Assignment', duration: '2 hrs' },
    { title: 'Poetry Composition', done: false, type: 'Assignment', duration: '1 hr' },
  ],
  4: [
    { title: 'Ecosystem Dynamics', done: true, type: 'Video', duration: '25 min' },
    { title: 'The Water Cycle Lab', done: false, type: 'Interactive', duration: '40 min' },
    { title: 'Environmental Science Report', done: false, type: 'Assignment', duration: '90 min' },
  ],
};

const ASSIGNMENTS = [
  { id: 1, title: 'Agronomy Micro-Economy Financial Ledger', course: 'MTH-101', dueDate: 'Aug 15, 2026', daysLeft: 21, status: 'pending', maxScore: 100, priority: 'high', description: 'Create a comprehensive financial ledger for a small agronomy business. Include income, expenses, profit calculation, and a 3-month forecast.' },
  { id: 2, title: 'Botany Field Study Report', course: 'BOT-102', dueDate: 'Aug 18, 2026', daysLeft: 24, status: 'pending', maxScore: 100, priority: 'medium', description: 'Document your field observations from the school farm. Include sketches, plant identification, and growth analysis.' },
  { id: 3, title: 'Short Story Draft', course: 'ENG-103', dueDate: 'Jul 30, 2026', daysLeft: 6, status: 'submitted', score: 92, maxScore: 100, priority: 'low', description: 'Write a 1500-word short story demonstrating narrative technique, character development, and Montessori values.' },
  { id: 4, title: 'Science Lab Report #1', course: 'SCI-104', dueDate: 'Jul 20, 2026', daysLeft: 0, status: 'graded', score: 85, maxScore: 100, priority: 'low', description: 'Formal lab report for the Ecosystem Dynamics experiment.', feedback: 'Excellent observation skills! Your hypothesis was well-supported with data. Consider expanding your conclusion section next time.' },
];

const QUIZ_QUESTIONS = [
  { id: 1, text: 'What is the primary goal of Montessori Secondary (Erdkinder) education?', options: ['Prepare for university exams only', 'Develop independence, social responsibility, and practical skills', 'Focus exclusively on academic subjects', 'Minimize physical activity'], correct: 1 },
  { id: 2, text: 'Which type of ledger tracks money coming into a business?', options: ['Expense Ledger', 'Profit & Loss Statement', 'Income Ledger', 'Depreciation Schedule'], correct: 2 },
  { id: 3, text: 'What is photosynthesis?', options: ['The process by which plants absorb water', 'The process by which plants convert sunlight into glucose', 'The reproduction cycle of plants', 'The process of seed germination'], correct: 1 },
];

const GRADE_DATA = [
  { subject: 'MTH-101', name: 'Mathematics', score: 88, grade: 'A', category_scores: { homework: 90, projects: 86, exams: 88 }, trend: 'up' },
  { subject: 'BOT-102', name: 'Agronomy', score: 81, grade: 'B+', category_scores: { homework: 85, projects: 79, exams: 80 }, trend: 'up' },
  { subject: 'ENG-103', name: 'Language Arts', score: 92, grade: 'A+', category_scores: { homework: 95, projects: 91, exams: 90 }, trend: 'up' },
  { subject: 'SCI-104', name: 'Science', score: 85, grade: 'A', category_scores: { homework: 88, projects: 84, exams: 83 }, trend: 'neutral' },
];

const ATTENDANCE_MONTHS = [
  { month: 'April', present: 22, absent: 0, late: 0, excused: 0, total: 22 },
  { month: 'May', present: 20, absent: 1, late: 0, excused: 1, total: 22 },
  { month: 'June', present: 21, absent: 0, late: 1, excused: 0, total: 22 },
  { month: 'July', present: 16, absent: 0, late: 0, excused: 0, total: 16 },
];

const HOUSES = [
  { name: 'Blue House (Eagle)', color: '#3B82F6', points: 520, rank: 1, me: true, motto: 'Wisdom & Integrity', members: 14 },
  { name: 'Purple House (Phoenix)', color: '#8B5CF6', points: 510, rank: 2, me: false, motto: 'Royalty & Distinction', members: 13 },
  { name: 'Green House (Jaguar)', color: '#10B981', points: 480, rank: 3, me: false, motto: 'Growth & Resilience', members: 12 },
  { name: 'Red House (Falcon)', color: '#EF4444', points: 450, rank: 4, me: false, motto: 'Passion & Determination', members: 11 },
];

const MY_POINTS_BREAKDOWN = [
  { category: 'Academic Achievements', points: 85, color: '#3B82F6', icon: '📚' },
  { category: 'Sports & Activities', points: 40, color: '#10B981', icon: '⚽' },
  { category: 'Community Service', points: 25, color: '#F59E0B', icon: '🤝' },
  { category: 'Positive Behaviour', points: 20, color: '#8B5CF6', icon: '⭐' },
];

const PORTFOLIO_ITEMS = [
  { id: 1, title: 'Agronomy Farm Sketch', category: 'Artwork', date: 'Jun 2026', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&auto=format&fit=crop', description: 'Detailed pencil sketch of the Erdkinder farm layout with plant labels.' },
  { id: 2, title: 'Short Story: The Cassava Dream', category: 'Writing', date: 'Jul 2026', type: 'document', thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop', description: 'A 1500-word creative story set in the school farm community.' },
  { id: 3, title: 'Micro-Economy Ledger Project', category: 'Project Work', date: 'Jun 2026', type: 'document', thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&auto=format&fit=crop', description: 'Full financial ledger for a simulated tomato farming business.' },
  { id: 4, title: 'Science Lab Report: Water Cycle', category: 'Project Work', date: 'May 2026', type: 'document', thumbnail: 'https://images.unsplash.com/photo-1532094349884-543559769de8?q=80&w=400&auto=format&fit=crop', description: 'Formal lab report with data tables and observations.' },
];

const PORTFOLIO_CATEGORIES = ['All', 'Artwork', 'Writing', 'Project Work', 'Presentations', 'Practical Life', 'Cultural Studies', 'Mathematics'];

const JOURNAL_ENTRIES = [
  { id: 1, date: 'Jul 24, 2026', title: 'Cassava Planting Day', activity: 'Agronomy Field Work', timeSpent: '3 hrs', reflection: 'Today we planted cassava on the south field. I learned how important soil spacing is for root development. Working with my group on the row layout was challenging but rewarding.', challenges: 'Carrying the heavy planting tools across the uneven farm terrain.', nextSteps: 'Research ideal cassava soil pH levels for our next session.', materials: 'Hoes, measuring rope, cassava stems, soil pH kit', teacherComment: 'Excellent observation, Emeka! Your soil analysis was very thorough.' },
  { id: 2, date: 'Jul 22, 2026', title: 'Geometry in Architecture', activity: 'Mathematics Lesson', timeSpent: '1.5 hrs', reflection: 'We studied how geometric principles are used in real architecture. I traced how triangles provide structural stability in roof designs. This connected math to real-world buildings in a way I had never seen before.', challenges: 'Understanding three-dimensional projections on a flat surface.', nextSteps: 'Practice more 3D sketching for the upcoming presentation.' },
];

const TIMETABLE_WEEK = [
  { day: 'Monday', periods: [
    { time: '8:00-9:30', subject: 'MTH-101', teacher: 'Mrs. Okafor', room: 'Room 5', color: '#3B82F6' },
    { time: '10:00-11:30', subject: 'BOT-102', teacher: 'Mr. Amadi', room: 'Farm Area', color: '#10B981' },
    { time: '11:30-12:00', subject: 'BREAK', teacher: '', room: '', color: '' },
    { time: '1:00-2:30', subject: 'ENG-103', teacher: 'Mrs. Dada', room: 'Room 8', color: '#8B5CF6' },
  ]},
  { day: 'Tuesday', periods: [
    { time: '8:00-9:30', subject: 'SCI-104', teacher: 'Mr. Okonkwo', room: 'Lab 1', color: '#F59E0B' },
    { time: '10:00-11:30', subject: 'Library', teacher: 'Ms. Pepple', room: 'Library', color: '#6B7280' },
    { time: '11:30-12:00', subject: 'BREAK', teacher: '', room: '', color: '' },
    { time: '1:00-2:30', subject: 'MTH-101', teacher: 'Mrs. Okafor', room: 'Room 5', color: '#3B82F6' },
  ]},
  { day: 'Wednesday', periods: [
    { time: '8:00-9:30', subject: 'BOT-102', teacher: 'Mr. Amadi', room: 'Farm Area', color: '#10B981' },
    { time: '10:00-11:30', subject: 'Practical Life', teacher: 'Ms. Adaobi', room: 'Workshop', color: '#EC4899' },
    { time: '11:30-12:00', subject: 'BREAK', teacher: '', room: '', color: '' },
    { time: '1:00-2:30', subject: 'ENG-103', teacher: 'Mrs. Dada', room: 'Room 8', color: '#8B5CF6' },
  ]},
  { day: 'Thursday', periods: [
    { time: '8:00-9:30', subject: 'MTH-101', teacher: 'Mrs. Okafor', room: 'Room 5', color: '#3B82F6' },
    { time: '10:00-11:30', subject: 'SCI-104', teacher: 'Mr. Okonkwo', room: 'Lab 1', color: '#F59E0B' },
    { time: '11:30-12:00', subject: 'BREAK', teacher: '', room: '', color: '' },
    { time: '1:00-3:00', subject: 'Sports & PE', teacher: 'Coach Bello', room: 'Sports Field', color: '#EF4444' },
  ]},
  { day: 'Friday', periods: [
    { time: '7:30-8:30', subject: 'Assembly', teacher: 'All Staff', room: 'Hall', color: '#6B7280' },
    { time: '9:00-10:30', subject: 'BOT-102', teacher: 'Mr. Amadi', room: 'Farm Area', color: '#10B981' },
    { time: '11:30-12:00', subject: 'BREAK', teacher: '', room: '', color: '' },
    { time: '1:00-3:00', subject: 'House Activities', teacher: 'House Heads', room: 'Various', color: '#3B82F6' },
  ]},
];

const MESSAGES_DATA = [
  { id: 1, from: 'Mrs. Okafor Chioma', role: 'Teacher', subject: 'MTH-101', avatar: 'O', time: '10:30 AM', preview: 'Your ledger project was outstanding! I especially loved...', unread: true, online: true },
  { id: 2, from: 'Mr. Amadi Ebi', role: 'Teacher', subject: 'BOT-102', avatar: 'A', time: 'Yesterday', preview: 'Please remember to submit your field report by...', unread: true, online: false },
  { id: 3, from: 'Ada Obi', role: 'Classmate', subject: 'Group Project', avatar: 'A', time: 'Yesterday', preview: "Hey Emeka, are you free to meet tomorrow to...", unread: false, online: true },
  { id: 4, from: 'Mrs. Dada Kemi', role: 'Teacher', subject: 'ENG-103', avatar: 'D', time: 'Jul 22', preview: 'Excellent story draft! Here are some suggestions for...', unread: false, online: false },
];

const CONVERSATIONS: Record<number, any[]> = {
  1: [
    { from: 'Mrs. Okafor Chioma', text: 'Hello Emeka! Your Micro-Economy Ledger project was outstanding! I especially loved your profit forecast section — very creative and mathematically accurate.', time: '10:15 AM', mine: false },
    { from: 'Me', text: 'Thank you so much, Mrs. Okafor! I worked really hard on it. Should I start on the next assignment already?', time: '10:28 AM', mine: true },
    { from: 'Mrs. Okafor Chioma', text: 'Yes! The next assignment is the Farm Profit Calculation Project. I\'ve uploaded the rubric on the portal. Let me know if you have any questions.', time: '10:30 AM', mine: false },
  ],
  2: [
    { from: 'Mr. Amadi Ebi', text: 'Good afternoon Emeka. Please remember to submit your Field Study Report by August 18th. You can use the observations from our Wednesday farm session.', time: 'Yesterday 2:15 PM', mine: false },
    { from: 'Me', text: 'Thank you sir. I\'ve already started drafting it. Do we need to include photos?', time: 'Yesterday 3:05 PM', mine: true },
    { from: 'Mr. Amadi Ebi', text: 'Yes, photos of your plant specimens are required. Please attach clear, well-lit images.', time: 'Yesterday 3:22 PM', mine: false },
  ],
};

const SKILL_MASTERY = [
  { area: 'Practical Life', level: 'Exemplary', score: 94, color: '#10B981' },
  { area: 'Mathematics', level: 'Exemplary', score: 88, color: '#3B82F6' },
  { area: 'Language Arts', level: 'Exemplary', score: 92, color: '#8B5CF6' },
  { area: 'Cultural Studies', level: 'Proficient', score: 81, color: '#F59E0B' },
  { area: 'Sensorial Development', level: 'Proficient', score: 77, color: '#EC4899' },
  { area: 'Social & Emotional', level: 'Exemplary', score: 90, color: '#6366F1' },
];

const TODAY = 'Thursday, July 24, 2026';
const TODAY_DAY = 'Thursday';

// ─── Shared small UI ─────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
    submitted: 'bg-blue-500/10 text-blue-600 border-blue-200',
    graded: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    late: 'bg-rose-500/10 text-rose-600 border-rose-200',
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${map[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
};

const MasteryBadge = ({ level }: { level: string }) => {
  const map: Record<string, string> = {
    Exemplary: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    Proficient: 'bg-blue-500/10 text-blue-600 border-blue-200',
    Developing: 'bg-amber-500/10 text-amber-600 border-amber-200',
    Beginning: 'bg-rose-500/10 text-rose-600 border-rose-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[level] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {level}
    </span>
  );
};

// ─── Upload Modal ─────────────────────────────────────────────
const UploadModal = ({ assignment, onClose }: { assignment: any; onClose: () => void }) => {
  const [step, setStep] = useState<'upload' | 'done'>('upload');
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6">
        {step === 'upload' ? (
          <>
            <h3 className="font-serif font-bold text-xl text-foreground mb-1">Submit Assignment</h3>
            <p className="text-sm text-muted-foreground mb-2">{assignment.title} · {assignment.course} · Due {assignment.dueDate}</p>
            <div className="bg-muted/30 border border-border rounded-xl p-4 text-sm text-muted-foreground mb-4">
              <p className="font-semibold text-foreground mb-1">Instructions</p>
              <p>{assignment.description}</p>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 bg-muted/10 mb-4">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Drop your file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX up to 50MB</p>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Comment for Teacher (Optional)</label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes for your teacher..." className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-muted/20" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('done')} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">Submit Assignment</button>
              <button onClick={onClose} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-serif font-bold text-xl text-foreground mb-1">Submitted!</h4>
            <p className="text-muted-foreground text-sm">Your assignment has been sent to {assignment.course}.</p>
            <p className="text-xs text-muted-foreground mt-1">Your teacher will grade it soon.</p>
            <button onClick={onClose} className="mt-5 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Quiz Interface ───────────────────────────────────────────
const QuizInterface = ({ onClose }: { onClose: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 min

  const q = QUIZ_QUESTIONS[current];
  const selected = answers[current];
  const score = submitted ? QUIZ_QUESTIONS.filter((q, i) => answers[i] === q.correct).length : 0;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">End-of-Module Quiz 1 · MTH-101</h3>
            <p className="text-xs text-muted-foreground">Question {current + 1} of {QUIZ_QUESTIONS.length} · 3 Attempts Allowed</p>
          </div>
          <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full ${timeLeft < 300 ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'}`}>
            <Clock className="w-4 h-4" />
            {mins}:{secs.toString().padStart(2, '0')}
          </div>
        </div>

        {!submitted ? (
          <div className="p-6">
            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {QUIZ_QUESTIONS.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i < current ? 'bg-primary' : i === current ? 'bg-primary/50' : 'bg-border'}`} />
              ))}
            </div>

            <p className="font-semibold text-foreground text-base mb-5">{q.text}</p>
            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [current]: i }))}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected === i ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-primary/30 hover:bg-primary/5'}`}>
                  <span className={`inline-block w-6 h-6 rounded-full border text-xs font-bold mr-3 items-center justify-center inline-flex shrink-0 ${selected === i ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
                className="border border-border px-4 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors disabled:opacity-40">← Previous</button>
              {current < QUIZ_QUESTIONS.length - 1 ? (
                <button onClick={() => setCurrent(current + 1)} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">Next →</button>
              ) : (
                <button onClick={() => setSubmitted(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">Submit Quiz</button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-serif font-bold text-white ${score >= 2 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              {score}/{QUIZ_QUESTIONS.length}
            </div>
            <h4 className="font-serif font-bold text-2xl text-foreground mb-2">
              {score === QUIZ_QUESTIONS.length ? 'Perfect Score! 🎉' : score >= 2 ? 'Well Done!' : 'Keep Practising!'}
            </h4>
            <p className="text-muted-foreground mb-1">You scored <strong>{Math.round((score / QUIZ_QUESTIONS.length) * 100)}%</strong></p>
            <p className="text-xs text-muted-foreground mb-6">Passing score: 60% · <MasteryBadge level={score >= 2 ? 'Proficient' : 'Developing'} /></p>
            <div className="space-y-3 text-left mb-6">
              {QUIZ_QUESTIONS.map((q, i) => (
                <div key={i} className={`p-3 rounded-xl border text-sm ${answers[i] === q.correct ? 'border-emerald-200 bg-emerald-500/5' : 'border-rose-200 bg-rose-500/5'}`}>
                  <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                    {answers[i] === q.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                    {q.text}
                  </p>
                  {answers[i] !== q.correct && (
                    <p className="text-xs text-emerald-600 ml-6">Correct: {q.options[q.correct]}</p>
                  )}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Journal Entry Modal ──────────────────────────────────────
const JournalModal = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState({ title: '', activity: '', timeSpent: '', materials: '', reflection: '', challenges: '', nextSteps: '' });
  const [saved, setSaved] = useState(false);
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="font-serif font-bold text-xl text-foreground">New Work Journal Entry</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {!saved ? (
          <div className="p-5 space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary font-medium">
              📝 Today's Reflection Prompt: <em>"What did you discover today that surprised you? How does it connect to what you already know?"</em>
            </div>
            {[
              ['title', 'Entry Title', 'e.g. Cassava Planting Day', 'input'],
              ['activity', 'Activity / Lesson', 'e.g. Agronomy Field Work', 'input'],
              ['timeSpent', 'Time Spent', 'e.g. 2 hours 30 minutes', 'input'],
              ['materials', 'Montessori Materials Used', 'e.g. Hoes, measuring rope, soil pH kit', 'input'],
              ['reflection', 'Personal Reflection', 'What did you learn? What stood out to you?', 'textarea'],
              ['challenges', 'Challenges Faced', 'What was difficult? How did you overcome it?', 'textarea'],
              ['nextSteps', 'Next Steps & Goals', 'What will you do differently next time?', 'textarea'],
            ].map(([key, label, ph, type]) => (
              <div key={key as string}>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{label as string}</label>
                {type === 'textarea' ? (
                  <textarea value={(form as any)[key as string]} onChange={f(key as string)} placeholder={ph as string} rows={3}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-muted/20" />
                ) : (
                  <input value={(form as any)[key as string]} onChange={f(key as string)} placeholder={ph as string}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-muted/20" />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSaved(true)} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">Save Journal Entry</button>
              <button onClick={onClose} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 px-6">
            <div className="text-5xl mb-4">📖</div>
            <h4 className="font-serif font-bold text-xl text-foreground mb-2">Journal Entry Saved!</h4>
            <p className="text-muted-foreground text-sm">Your reflection has been recorded. Your teacher will be notified.</p>
            <button onClick={onClose} className="mt-5 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [uploadModal, setUploadModal] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [courseView, setCourseView] = useState<'grid' | 'list'>('grid');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number>(1);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMap, setChatMap] = useState<Record<number, any[]>>(CONVERSATIONS);
  const [leaveStep, setLeaveStep] = useState<'form' | 'done'>('form');
  const [portfolioCat, setPortfolioCat] = useState('All');
  const [addPortfolioModal, setAddPortfolioModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    setChatMap(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] ?? []), { from: 'Me', text: chatMsg, time: 'Now', mine: true }],
    }));
    setChatMsg('');
  };

  const filteredCourses = COURSES.filter(c =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.teacher.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredPortfolio = portfolioCat === 'All' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter(p => p.category === portfolioCat);

  const selectedMsg = MESSAGES_DATA.find(m => m.id === selectedConversation);

  const renderSection = () => {
    // ══════════════════════════════════════════════
    // OVERVIEW
    // ══════════════════════════════════════════════
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        {/* Hero Welcome */}
        <div className="bg-gradient-to-r from-primary/90 to-primary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">JSS1 · Blue House Eagle · Term 2 2026</span>
              <span className="text-xs text-white/70">{TODAY}</span>
            </div>
            <h2 className="text-3xl font-serif font-bold mb-2">Good morning, {user?.first_name ?? 'Student'}! 👋</h2>
            <p className="text-white/90 text-sm max-w-xl">You have <strong>2 pending assignments</strong> this month. Your house is ranked <strong>#1</strong>! Keep up the great work.</p>
            <p className="text-white/60 text-xs mt-2 italic font-serif">"Not to Knowledge is Power." — Tarepet Guiding Principle</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Active Courses', value: '4', sub: '78% avg progress', icon: BookOpen, color: 'text-primary bg-primary/10 border-primary/20' },
            { label: 'Due in 7 Days', value: '2', sub: 'Assignments pending', icon: Clock, color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
            { label: 'Unread Messages', value: '2', sub: 'From teachers', icon: MessageSquare, color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
            { label: 'Current GPA', value: '3.85', sub: '↑ Exemplary', icon: Star, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            { label: 'Attendance', value: '98%', sub: '1 excused absence', icon: UserCheck, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
            { label: 'House Points', value: '170 pts', sub: 'Blue Eagle · #1 🏆', icon: Award, color: 'text-purple-600 bg-purple-500/10 border-purple-200' },
          ].map((s, i) => (
            <div key={i} className={`bg-card rounded-2xl border p-4 shadow-sm ${s.color.split(' ').slice(2).join(' ')}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
              </div>
              <p className={`text-xl font-serif font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-serif font-bold text-lg text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Today's Timetable", id: 'timetable', icon: Calendar, color: 'text-primary bg-primary/10 border-primary/20' },
              { label: 'Submit Assignment', id: 'assignments', icon: Upload, color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
              { label: 'My Courses', id: 'courses', icon: BookOpen, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
              { label: 'House Leaderboard', id: 'houses', icon: Award, color: 'text-purple-600 bg-purple-500/10 border-purple-200' },
              { label: 'View Grades', id: 'grades', icon: BarChart2, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
              { label: 'Message Teacher', id: 'messages', icon: MessageSquare, color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
              { label: 'My Portfolio', id: 'portfolio', icon: Briefcase, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-200' },
              { label: 'Work Journal', id: 'journal', icon: PenLine, color: 'text-pink-600 bg-pink-500/10 border-pink-200' },
            ].map(a => (
              <button key={a.id} onClick={() => setActiveSection(a.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border font-medium text-xs transition-all hover:shadow-sm ${a.color}`}>
                <a.icon className="w-4 h-4 shrink-0" />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Engagement + Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Engagement Score */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif font-bold text-foreground mb-4">Engagement Score</h3>
            <div className="space-y-3">
              {[
                { label: 'Class Participation', score: 88 },
                { label: 'Submission Rate', score: 100 },
                { label: 'Login Frequency', score: 95 },
                { label: 'Weekly Study Time', score: 76 },
                { label: 'House Engagement', score: 82 },
              ].map((e, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{e.label}</span>
                    <span className="font-bold text-foreground">{e.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full ${e.score >= 90 ? 'bg-emerald-500' : e.score >= 75 ? 'bg-primary' : 'bg-amber-500'}`} style={{ width: `${e.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif font-bold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle2, text: 'Short Story Draft submitted', time: 'Jul 22', color: 'text-emerald-500' },
                { icon: Star, text: 'Science Lab graded: 85/100', time: 'Jul 20', color: 'text-amber-500' },
                { icon: Award, text: 'Earned +25 House Points (Academic)', time: 'Jul 19', color: 'text-purple-500' },
                { icon: BookOpen, text: 'Completed: The Art of Storytelling', time: 'Jul 18', color: 'text-primary' },
                { icon: MessageSquare, text: 'Teacher feedback: ENG-103', time: 'Jul 17', color: 'text-rose-500' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <a.icon className={`w-4 h-4 shrink-0 ${a.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{a.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Montessori Insights */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif font-bold text-foreground mb-4">Montessori Insights</h3>
            <div className="space-y-3 mb-4">
              {SKILL_MASTERY.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{s.area}</span>
                  <MasteryBadge level={s.level} />
                </div>
              ))}
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary">
              <p className="font-bold mb-1">Today's Reflection Prompt</p>
              <p className="italic">"What did you discover today that connected learning to real life?"</p>
              <button onClick={() => setShowJournal(true)} className="mt-2 font-bold underline text-primary">Write Journal Entry →</button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-serif font-bold text-lg text-foreground mb-4">Upcoming School Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: 'Parent-Teacher Conference', date: 'Aug 10, 2026 · 2:00 PM', type: 'PTM', color: 'bg-amber-500/10 border-amber-200 text-amber-600' },
              { title: 'Inter-House Sports Day', date: 'Aug 5, 2026 · 8:00 AM', type: 'Sports', color: 'bg-emerald-500/10 border-emerald-200 text-emerald-600' },
              { title: 'End of Term Thanksgiving', date: 'Sep 12, 2026', type: 'Cultural', color: 'bg-primary/10 border-primary/20 text-primary' },
            ].map((ev, i) => (
              <div key={i} className={`p-3 rounded-xl border ${ev.color.split(' ').slice(1).join(' ')}`}>
                <span className={`text-[10px] font-bold ${ev.color.split(' ')[0]}`}>{ev.type}</span>
                <p className="font-semibold text-foreground text-sm mt-0.5">{ev.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{ev.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // MY COURSES
    // ══════════════════════════════════════════════
    if (activeSection === 'courses') return (
      <div className="space-y-5">
        {selectedLesson && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-foreground">{selectedLesson.title}</h3>
                <button onClick={() => setSelectedLesson(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-muted/30 rounded-xl h-48 flex items-center justify-center border border-border">
                  {selectedLesson.type === 'Video' && <div className="text-center"><Play className="w-12 h-12 text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Video Player · {selectedLesson.duration}</p></div>}
                  {selectedLesson.type === 'PDF' && <div className="text-center"><FileText className="w-12 h-12 text-rose-500 mx-auto mb-2" /><p className="text-sm text-muted-foreground">PDF Viewer · {selectedLesson.duration}</p></div>}
                  {selectedLesson.type === 'Interactive' && <div className="text-center"><Globe className="w-12 h-12 text-emerald-500 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Interactive Content · {selectedLesson.duration}</p></div>}
                  {selectedLesson.type === 'Assignment' && <div className="text-center"><Edit2 className="w-12 h-12 text-amber-500 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Assignment · {selectedLesson.duration}</p></div>}
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Private Notes</p>
                  <textarea rows={3} placeholder="Take notes while you learn..." className="w-full text-sm text-foreground bg-transparent resize-none focus:outline-none" />
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Mark as Complete
                  </button>
                  <button className="border border-border px-4 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-serif font-bold text-foreground">My Enrolled Courses</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)} placeholder="Search courses..."
                className="pl-9 pr-3 py-2 border border-border rounded-xl text-xs bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary w-44" />
            </div>
            <div className="flex bg-muted/30 rounded-xl border border-border overflow-hidden">
              <button onClick={() => setCourseView('grid')} className={`px-3 py-2 text-xs transition-colors ${courseView === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Grid</button>
              <button onClick={() => setCourseView('list')} className={`px-3 py-2 text-xs transition-colors ${courseView === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>List</button>
            </div>
          </div>
        </div>

        {courseView === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCourses.map(c => (
              <div key={c.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-36 overflow-hidden">
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute top-3 left-3 text-xs font-bold text-white bg-primary px-2.5 py-1 rounded-lg">{c.code}</span>
                  <span className="absolute top-3 right-3 text-lg font-bold text-white">{c.grade}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-foreground mb-0.5">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{c.teacher} · {c.enrolled} students</p>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Course Progress</span>
                      <span className="font-bold text-primary">{c.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.progress}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Next due: {c.nextDue}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
                      className="flex-1 text-xs font-bold text-foreground border border-border py-2 rounded-lg hover:bg-accent transition-colors">
                      {expandedCourse === c.id ? 'Hide Lessons' : 'View Lessons'}
                    </button>
                    <button className="flex-1 text-xs font-bold text-primary border border-primary/30 py-2 rounded-lg hover:bg-primary/5 transition-colors">Continue</button>
                  </div>
                  {expandedCourse === c.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {(LESSONS[c.id] ?? []).map((l, i) => (
                        <button key={i} disabled={l.locked}
                          onClick={() => !l.locked && setSelectedLesson(l)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${l.locked ? 'opacity-50 border-border cursor-not-allowed' : l.done ? 'border-emerald-200 bg-emerald-500/5' : 'border-border hover:border-primary/30 hover:bg-primary/5'}`}>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-xs ${l.done ? 'bg-emerald-500' : l.locked ? 'bg-muted-foreground/30' : 'bg-primary'}`}>
                            {l.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : l.locked ? <Lock className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{l.title}</p>
                            <p className="text-[10px] text-muted-foreground">{l.type} · {l.duration}</p>
                          </div>
                          {l.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            {filteredCourses.map(c => (
              <div key={c.id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                <img src={c.thumbnail} alt={c.title} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{c.code}</span>
                    <h4 className="font-semibold text-foreground text-sm truncate">{c.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.teacher}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden max-w-32">
                      <div className="h-full rounded-full" style={{ width: `${c.progress}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="text-xs font-bold text-foreground">{c.progress}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-foreground">{c.grade}</p>
                  <p className="text-xs text-muted-foreground">Due {c.nextDue}</p>
                </div>
                <button onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedCourse === c.id ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    // ══════════════════════════════════════════════
    // ASSIGNMENTS & QUIZZES
    // ══════════════════════════════════════════════
    if (activeSection === 'assignments') return (
      <div className="space-y-5">
        {uploadModal && <UploadModal assignment={uploadModal} onClose={() => setUploadModal(null)} />}
        {showQuiz && <QuizInterface onClose={() => setShowQuiz(false)} />}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: 2, color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
            { label: 'Submitted', count: 1, color: 'text-blue-600 bg-blue-500/10 border-blue-200' },
            { label: 'Graded', count: 1, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            { label: 'Quizzes Available', count: 1, color: 'text-purple-600 bg-purple-500/10 border-purple-200' },
          ].map(s => (
            <div key={s.label} className={`bg-card rounded-2xl border p-4 shadow-sm text-center ${s.color.split(' ').slice(1).join(' ')}`}>
              <p className={`text-3xl font-serif font-bold ${s.color.split(' ')[0]}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Assignments */}
        <h3 className="font-serif font-bold text-foreground text-lg">Assignments</h3>
        <div className="space-y-4">
          {ASSIGNMENTS.map(a => (
            <div key={a.id} className={`bg-card rounded-2xl border shadow-sm p-5 ${a.status === 'pending' && a.daysLeft <= 7 ? 'border-amber-200' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.course}</span>
                    <StatusBadge status={a.status} />
                    {a.daysLeft <= 7 && a.status === 'pending' && <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200">DUE SOON</span>}
                  </div>
                  <h4 className="font-serif font-bold text-foreground">{a.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due {a.dueDate}</span>
                    <span>Max: {a.maxScore} pts</span>
                    {(a as any).score && <span className="text-emerald-600 font-bold">Score: {(a as any).score}/{a.maxScore}</span>}
                    {a.status === 'pending' && <span className="text-amber-600 font-bold">{a.daysLeft} days left</span>}
                  </div>
                  {(a as any).feedback && (
                    <div className="mt-3 bg-emerald-500/5 border border-emerald-200 rounded-xl p-3 text-xs text-foreground">
                      <p className="font-bold text-emerald-600 mb-1">Teacher Feedback:</p>
                      <p>{(a as any).feedback}</p>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {a.status === 'pending' && (
                    <button onClick={() => setUploadModal(a)} className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" /> Submit
                    </button>
                  )}
                  {a.status === 'submitted' && <span className="text-xs text-blue-600 font-medium whitespace-nowrap">Awaiting Grade</span>}
                  {a.status === 'graded' && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">{(a as any).score}<span className="text-sm text-muted-foreground">/{a.maxScore}</span></p>
                      <MasteryBadge level={(a as any).score >= 90 ? 'Exemplary' : (a as any).score >= 75 ? 'Proficient' : 'Developing'} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quizzes */}
        <h3 className="font-serif font-bold text-foreground text-lg mt-2">Available Quizzes</h3>
        <div className="bg-card rounded-2xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">MTH-101</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200">NEW</span>
              </div>
              <h4 className="font-serif font-bold text-foreground">End-of-Module Quiz 1</h4>
              <p className="text-xs text-muted-foreground mt-0.5">3 questions · 20 min time limit · 3 attempts allowed</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Closes Aug 10, 2026</span>
                <span>Pass mark: 60%</span>
              </div>
            </div>
            <button onClick={() => setShowQuiz(true)} className="bg-purple-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Start Quiz
            </button>
          </div>
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // GRADES & ANALYTICS
    // ══════════════════════════════════════════════
    if (activeSection === 'grades') return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground">Grades & Academic Analytics</h2>
          <button className="flex items-center gap-1.5 border border-border px-4 py-2 rounded-xl text-xs font-bold hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> Download Transcript
          </button>
        </div>

        {/* GPA Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Cumulative GPA', value: '3.85/4.0', sub: 'Exemplary', color: 'text-primary' },
              { label: 'Class Rank', value: '#3/24', sub: 'Top 15%', color: 'text-emerald-600' },
              { label: 'Average Score', value: '86.5%', sub: 'Term 2, 2026', color: 'text-foreground' },
              { label: 'Mastery Level', value: 'Exemplary', sub: '4 of 4 subjects', color: 'text-purple-600' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xs font-bold uppercase text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-serif font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-5">Subject Performance</h3>
          <div className="space-y-5">
            {GRADE_DATA.map(s => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{s.subject}</span>
                      <span className="font-semibold text-foreground text-sm">{s.name}</span>
                      {s.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Homework: <strong className="text-foreground">{s.category_scores.homework}%</strong></span>
                      <span>Projects: <strong className="text-foreground">{s.category_scores.projects}%</strong></span>
                      <span>Exams: <strong className="text-foreground">{s.category_scores.exams}%</strong></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-foreground">{s.grade}</p>
                    <p className="text-sm font-bold text-muted-foreground">{s.score}%</p>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${s.score >= 90 ? 'bg-emerald-500' : s.score >= 75 ? 'bg-primary' : 'bg-amber-500'}`} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Montessori Mastery + Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif font-bold text-foreground mb-4">Montessori Skill Mastery</h3>
            <div className="space-y-3">
              {SKILL_MASTERY.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{s.area}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{s.score}%</span>
                      <MasteryBadge level={s.level} />
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif font-bold text-foreground mb-4">Predictive Analytics</h3>
            <div className="space-y-4">
              {[
                { label: 'Predicted Final GPA', value: '3.92/4.0', icon: Star, color: 'text-emerald-600 bg-emerald-500/10', sub: 'Based on current trajectory' },
                { label: 'Predicted Grade: MTH-101', value: 'A+', icon: TrendingUp, color: 'text-primary bg-primary/10', sub: '3 assignments remaining' },
                { label: 'At-Risk Alert', value: 'None', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10', sub: 'All subjects on track' },
                { label: 'Recommended Focus', value: 'SCI-104', icon: Target, color: 'text-amber-600 bg-amber-500/10', sub: 'Improve to push above 88%' },
              ].map((p, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${p.color.split(' ')[1]}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.color.split(' ')[1]}`}>
                    <p.icon className={`w-4 h-4 ${p.color.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                    <p className={`font-bold text-sm ${p.color.split(' ')[0]}`}>{p.value}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right shrink-0 max-w-24">{p.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // ATTENDANCE
    // ══════════════════════════════════════════════
    if (activeSection === 'attendance') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">Attendance Tracker</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Present', value: '79', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200' },
            { label: 'Absent', value: '1', color: 'text-rose-600 bg-rose-500/10 border-rose-200' },
            { label: 'Late Arrivals', value: '1', color: 'text-amber-600 bg-amber-500/10 border-amber-200' },
            { label: 'Overall Rate', value: '98%', color: 'text-primary bg-primary/10 border-primary/20' },
          ].map(s => (
            <div key={s.label} className={`bg-card p-4 rounded-2xl border shadow-sm ${s.color.split(' ').slice(1).join(' ')}`}>
              <p className="text-xs font-bold uppercase text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-serif font-bold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Monthly Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  {['Month', 'Total', 'Present', 'Absent', 'Late', 'Excused', 'Rate'].map(h => (
                    <th key={h} className="py-3 px-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ATTENDANCE_MONTHS.map(row => (
                  <tr key={row.month} className="hover:bg-muted/10">
                    <td className="py-3 px-4 font-semibold text-foreground">{row.month}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.total}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{row.present}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">{row.absent}</td>
                    <td className="py-3 px-4 text-amber-600 font-bold">{row.late}</td>
                    <td className="py-3 px-4 text-blue-600 font-bold">{row.excused}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{Math.round((row.present / row.total) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Request */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Request Leave of Absence</h3>
          {leaveStep === 'form' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Leave Type</label>
                  <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                    {['Medical / Sick', 'Family Emergency', 'Personal', 'Doctor Appointment', 'Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Duration</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="date" className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Reason</label>
                <textarea rows={3} placeholder="Provide a detailed reason for your leave request..." className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Supporting Document (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-primary/40 bg-muted/10">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  Doctor's note, letter, etc.
                </div>
              </div>
              <button onClick={() => setLeaveStep('done')} className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Submit Leave Request
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-serif font-bold text-foreground">Request Submitted!</h4>
              <p className="text-sm text-muted-foreground mt-1">Your leave request has been sent to the Admin and your parent for approval.</p>
              <button onClick={() => setLeaveStep('form')} className="mt-4 border border-border px-6 py-2 rounded-xl text-sm hover:bg-accent transition-colors">Submit Another</button>
            </div>
          )}
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // HOUSE SYSTEM
    // ══════════════════════════════════════════════
    if (activeSection === 'houses') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">House System</h2>
        {/* My House Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">🦅</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">My House</p>
              <h3 className="text-2xl font-serif font-bold">Blue House (Eagle)</h3>
              <p className="text-blue-200 italic text-sm">"Wisdom & Integrity"</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-4xl font-serif font-bold">🏆 #1</p>
              <p className="text-blue-200 text-sm">520 Total Points</p>
            </div>
          </div>
        </div>

        {/* My Personal Points */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">My Personal Contributions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {MY_POINTS_BREAKDOWN.map((p, i) => (
              <div key={i} className="text-center p-3 rounded-xl border border-border bg-muted/20">
                <p className="text-2xl mb-1">{p.icon}</p>
                <p className="text-xl font-serif font-bold text-foreground">{p.points}</p>
                <p className="text-[10px] text-muted-foreground">{p.category}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Personal Points</span>
            <span className="text-xl font-serif font-bold text-primary">170 pts</span>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">House Leaderboard · Term 2</h3>
          <div className="space-y-3">
            {HOUSES.map(h => (
              <div key={h.name} className={`p-4 rounded-2xl border ${h.me ? 'border-primary/40 ring-2 ring-primary/20' : 'border-border'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: h.color }}>
                    {h.rank === 1 ? '🏆' : `#${h.rank}`}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-foreground">{h.name}</h4>
                      {h.me && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">YOUR HOUSE</span>}
                    </div>
                    <p className="text-xs text-muted-foreground italic">"{h.motto}" · {h.members} members</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(h.points / 550) * 100}%`, backgroundColor: h.color }} />
                      </div>
                      <span className="font-bold text-sm shrink-0" style={{ color: h.color }}>{h.points} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Competitions */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Upcoming Competitions</h3>
          <div className="space-y-3">
            {[
              { name: 'Inter-House Debate', type: 'Academic', date: 'Aug 5 · 10:00 AM', venue: 'Assembly Hall', points: '+50 pts for winner', open: true },
              { name: 'Sports Day — 100m Race', type: 'Sports', date: 'Aug 5 · 9:00 AM', venue: 'Sports Field', points: '+20 pts for 1st place', open: true },
              { name: 'Cultural Arts Exhibition', type: 'Arts', date: 'Aug 20 · 2:00 PM', venue: 'Art Room', points: '+30 pts', open: false },
            ].map((comp, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/10 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{comp.type}</span>
                    <h4 className="font-semibold text-foreground text-sm">{comp.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{comp.date} · {comp.venue}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">{comp.points}</p>
                </div>
                <button className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors whitespace-nowrap ${comp.open ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'bg-muted text-muted-foreground border-border cursor-not-allowed'}`}>
                  {comp.open ? 'Register' : 'Closed'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // PORTFOLIO
    // ══════════════════════════════════════════════
    if (activeSection === 'portfolio') return (
      <div className="space-y-5">
        {addPortfolioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6">
              <h3 className="font-serif font-bold text-xl text-foreground mb-4">Add Portfolio Item</h3>
              <div className="space-y-3">
                {[['Title', 'e.g. Cassava Harvest Painting'], ['Description', 'Describe your work...']].map(([l, ph]) => (
                  <div key={l}>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{l}</label>
                    {l === 'Description' ? <textarea rows={2} placeholder={ph} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" /> : <input placeholder={ph} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />}
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Category</label>
                  <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                    {PORTFOLIO_CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 bg-muted/10">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Upload work sample (image, PDF, video)</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAddPortfolioModal(false)} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">Add to Portfolio</button>
                  <button onClick={() => setAddPortfolioModal(false)} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground">My Portfolio</h2>
          <button onClick={() => setAddPortfolioModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Work
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PORTFOLIO_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setPortfolioCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${portfolioCat === cat ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredPortfolio.map(item => (
            <div key={item.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-40 overflow-hidden">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 text-xs font-bold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">{item.category}</span>
                <div className="absolute bottom-3 right-3 flex gap-1">
                  <button className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/40 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  <button className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/40 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // WORK JOURNAL
    // ══════════════════════════════════════════════
    if (activeSection === 'journal') return (
      <div className="space-y-5">
        {showJournal && <JournalModal onClose={() => setShowJournal(false)} />}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground">Work Journal</h2>
          <button onClick={() => setShowJournal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <PenLine className="w-4 h-4" /> New Entry
          </button>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary flex items-start gap-3">
          <Star className="w-4 h-4 shrink-0 mt-0.5" />
          <p><strong>Today's Reflection Prompt:</strong> "What did you discover today that surprised you? How does it connect to what you already know?"</p>
        </div>
        <div className="space-y-4">
          {JOURNAL_ENTRIES.map(e => (
            <div key={e.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{e.activity}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{e.timeSpent}</span>
                  </div>
                  <h3 className="font-serif font-bold text-foreground text-lg">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{e.date}</p>
                </div>
                <button className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
              </div>
              {e.materials && (
                <div className="mb-3 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">Materials: </span>{e.materials}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Reflection</p>
                  <p className="text-sm text-foreground">{e.reflection}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Challenges</p>
                  <p className="text-sm text-foreground">{e.challenges}</p>
                </div>
                {e.nextSteps && (
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Next Steps</p>
                    <p className="text-sm text-foreground">{e.nextSteps}</p>
                  </div>
                )}
              </div>
              {e.teacherComment && (
                <div className="mt-4 bg-emerald-500/5 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-emerald-600 mb-1">Teacher Comment</p>
                  <p className="text-sm text-foreground">{e.teacherComment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // MESSAGES
    // ══════════════════════════════════════════════
    if (activeSection === 'messages') return (
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">Messages</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[640px]">
          {/* Inbox */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <input placeholder="Search messages..." className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-xs bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-border">
              {MESSAGES_DATA.map(msg => (
                <button key={msg.id} onClick={() => setSelectedConversation(msg.id)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors ${selectedConversation === msg.id ? 'bg-primary/5 border-r-2 border-primary' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{msg.avatar}</div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${msg.online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-xs font-bold truncate ${msg.unread ? 'text-foreground' : 'text-muted-foreground'}`}>{msg.from}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                      </div>
                      <p className="text-[10px] text-primary font-medium">{msg.subject}</p>
                      <p className={`text-xs mt-0.5 truncate ${msg.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{msg.preview}</p>
                    </div>
                    {msg.unread && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
            {selectedMsg && (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">{selectedMsg.avatar}</div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${selectedMsg.online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{selectedMsg.from}</p>
                    <p className="text-xs text-muted-foreground">{selectedMsg.role} · {selectedMsg.subject} · {selectedMsg.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(chatMap[selectedConversation] ?? []).map((msg: any, i: number) => (
                    <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${msg.mine ? 'bg-primary text-white rounded-br-none' : 'bg-muted/40 border border-border text-foreground rounded-bl-none'}`}>
                        {!msg.mine && <p className="text-[10px] font-bold text-primary mb-1">{selectedMsg.from}</p>}
                        {msg.text}
                        <p className={`text-[10px] mt-1 ${msg.mine ? 'text-white/60' : 'text-muted-foreground'}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border shrink-0">
                  <div className="flex gap-3">
                    <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder={`Message ${selectedMsg.from.split(' ')[0]}...`}
                      className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                    <button onClick={sendMessage} className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // CALENDAR & TIMETABLE
    // ══════════════════════════════════════════════
    if (activeSection === 'timetable') return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">Calendar & Timetable</h2>
            <p className="text-xs text-muted-foreground">Term 2 · 2025/2026 Academic Year</p>
          </div>
          <div className="flex bg-muted/30 rounded-xl border border-border overflow-hidden">
            <button onClick={() => setCalendarView('week')} className={`px-3 py-2 text-xs transition-colors ${calendarView === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Week</button>
            <button onClick={() => setCalendarView('month')} className={`px-3 py-2 text-xs transition-colors ${calendarView === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Month</button>
          </div>
        </div>

        {/* Today's Highlight */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">📅 Today — {TODAY}</p>
          <div className="flex flex-wrap gap-2">
            {TIMETABLE_WEEK.find(d => d.day === TODAY_DAY)?.periods.filter(p => p.subject !== 'BREAK').map((p, i) => (
              <span key={i} className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: p.color || '#6B7280' }}>
                {p.time} · {p.subject}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly Timetable */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-24 bg-muted/20">Day</th>
                  {['Period 1', 'Period 2', 'Break', 'Period 3/4'].map(p => (
                    <th key={p} className="py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TIMETABLE_WEEK.map((row, i) => {
                  const isToday = row.day === TODAY_DAY;
                  return (
                    <tr key={i} className={`${isToday ? 'bg-primary/5' : 'hover:bg-muted/10'} transition-colors`}>
                      <td className="py-4 px-4">
                        <p className={`font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{row.day}</p>
                        {isToday && <p className="text-[9px] font-bold text-primary uppercase tracking-wide">Today</p>}
                      </td>
                      {row.periods.map((period, j) => (
                        <td key={j} className="py-3 px-4">
                          {period.subject === 'BREAK' ? (
                            <span className="text-muted-foreground italic text-xs">Break</span>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: period.color }} />
                                <span className="font-bold text-foreground text-xs">{period.subject}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{period.teacher}</p>
                              <p className="text-[10px] text-muted-foreground">{period.room} · {period.time}</p>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Deadlines Calendar */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Assignment Deadline Calendar</h3>
          <div className="space-y-3">
            {ASSIGNMENTS.filter(a => a.status === 'pending').map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                  <p className="text-xs font-bold text-primary uppercase">{a.dueDate.split(' ')[0]}</p>
                  <p className="text-lg font-bold text-primary">{a.dueDate.split(' ')[1].replace(',', '')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.course}</span>
                    <span className="text-xs text-muted-foreground">{a.daysLeft} days left</span>
                  </div>
                </div>
                <button onClick={() => setUploadModal(a)} className="text-xs font-bold text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors whitespace-nowrap">Submit</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // ══════════════════════════════════════════════
    // SETTINGS & PROFILE
    // ══════════════════════════════════════════════
    if (activeSection === 'settings') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">Settings & Profile</h2>

        {/* Profile Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Personal Profile</h3>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary font-bold text-3xl font-serif flex items-center justify-center shrink-0 border-2 border-primary/20">
              {user?.first_name?.[0] ?? 'S'}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['First Name', user?.first_name ?? 'Emeka'],
                ['Last Name', user?.last_name ?? 'Amadi'],
                ['Email', user?.email ?? 'student@tarepet.edu.ng'],
                ['Phone', '+234 801 234 5678'],
                ['Grade Level', 'JSS1'],
                ['House', 'Blue House (Eagle)'],
              ].map(([label, val]) => (
                <div key={label}>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{label}</label>
                  <input defaultValue={val} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
            </div>
          </div>
          <button className="mt-4 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">Save Profile</button>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Appearance</h3>
          <div className="flex gap-3">
            {[
              { mode: 'light', label: 'Light', icon: Sun },
              { mode: 'dark', label: 'Dark', icon: Moon },
              { mode: 'system', label: 'System', icon: Monitor },
            ].map(t => (
              <button key={t.mode} onClick={() => setTheme(t.mode as any)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === t.mode ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                <t.icon className="w-5 h-5" />
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { label: 'Assignment due reminders (24h, 12h, 1h)', defaultOn: true },
              { label: 'Grade posted notifications', defaultOn: true },
              { label: 'Teacher message notifications', defaultOn: true },
              { label: 'House point earned notifications', defaultOn: true },
              { label: 'Announcement notifications', defaultOn: false },
              { label: 'Email daily digest', defaultOn: false },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
                <span className="text-sm text-foreground">{n.label}</span>
                <button className={`relative w-10 h-5 rounded-full transition-colors ${n.defaultOn ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.defaultOn ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">Change Password</h3>
          <div className="space-y-3">
            {['Current Password', 'New Password', 'Confirm New Password'].map(l => (
              <div key={l}>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{l}</label>
                <input type="password" placeholder="••••••••••••"
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-4/5" />
            </div>
            <p className="text-xs text-emerald-600 font-medium">Strong password</p>
            <button className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">Update Password</button>
          </div>
        </div>
      </div>
    );

    return null;
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
      <PortalLayout title="Student Academic Portal" activeSection={activeSection} onNavigate={setActiveSection}>
        {showJournal && <JournalModal onClose={() => setShowJournal(false)} />}
        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
