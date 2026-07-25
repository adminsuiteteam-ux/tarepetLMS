import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authClient } from '@/lib/api-auth';
import { motion } from 'framer-motion';
import { 
  Plus, Trash2, Send, BookOpen, Clock, ChevronLeft, CheckCircle2,
  FileText, AlertTriangle, Eye, Users
} from 'lucide-react';
import { Link } from 'wouter';

interface ExamForm {
  title: string;
  description: string;
  instructions: string;
  course: string;
  assessment_type: string;
  term: string;
  duration_minutes: number;
  questions_per_page: number;
}

interface QuestionForm {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  points: number;
}

interface Exam {
  id: number;
  title: string;
  status: string;
  assessment_type: string;
  term: string;
  duration_minutes: number;
  questions_count: number;
  course_detail: { name: string; code: string } | null;
  rejection_reason: string | null;
  created_at: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface StudentAttempt {
  id: number;
  student_name: string;
  score: number;
  total_possible: number;
  percentage: number;
  auto_submitted: boolean;
  submitted_at: string;
  gradebook_synced: boolean;
}

type View = 'list' | 'create' | 'questions' | 'attempts' | 'attempt-detail';

const EMPTY_QUESTION: QuestionForm = {
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'A', points: 1,
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function CBTBuilder() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('list');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState<QuestionForm>({ ...EMPTY_QUESTION });
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [attemptDetail, setAttemptDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ExamForm>({
    title: '', description: '', instructions: '', course: '',
    assessment_type: 'TEST', term: '1ST_TERM', duration_minutes: 30, questions_per_page: 1,
  });

  const fetchExams = () => {
    authClient.get('/assessments/cbt-exams/').then(res => setExams(res.data.results || res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchExams();
    authClient.get('/lms/courses/').then(res => setCourses(res.data.results || res.data)).catch(() => {});
  }, []);

  const handleCreateExam = async () => {
    setLoading(true);
    try {
      const res = await authClient.post('/assessments/cbt-exams/', form);
      setSelectedExamId(res.data.id);
      setView('questions');
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = (examId: number) => {
    authClient.get(`/assessments/cbt-exams/${examId}/questions/`).then(res => setQuestions(res.data)).catch(() => {});
  };

  const handleAddQuestion = async () => {
    if (!selectedExamId) return;
    try {
      await authClient.post(`/assessments/cbt-exams/${selectedExamId}/add_question/`, {
        ...newQuestion,
        order: questions.length + 1,
      });
      fetchQuestions(selectedExamId);
      setNewQuestion({ ...EMPTY_QUESTION });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add question');
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedExamId) return;
    try {
      await authClient.post(`/assessments/cbt-exams/${selectedExamId}/submit_for_approval/`);
      alert('Exam submitted for admin approval!');
      fetchExams();
      setView('list');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Submission failed');
    }
  };

  const fetchAttempts = (examId: number) => {
    authClient.get(`/assessments/cbt-exams/${examId}/attempts/`).then(res => setAttempts(res.data)).catch(() => {});
  };

  const fetchAttemptDetail = (examId: number, attemptId: number) => {
    authClient.get(`/assessments/cbt-exams/${examId}/attempt-detail/${attemptId}/`).then(res => setAttemptDetail(res.data)).catch(() => {});
  };

  const handleSyncGradebook = async (attemptId: number) => {
    try {
      await authClient.post(`/assessments/cbt-attempts/${attemptId}/sync_to_gradebook/`);
      alert('Score synced to student gradebook!');
      if (selectedExamId) fetchAttempts(selectedExamId);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Sync failed');
    }
  };

  const handlePublishExam = async (examId: number) => {
    try {
      await authClient.post(`/assessments/cbt-exams/${examId}/publish/`);
      alert('Exam uploaded and published to your students!');
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Publish failed');
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  // ============ EXAM LIST ============
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/teacher">
                <button className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">CBT Exam Builder</h1>
                <p className="text-slate-500 text-sm">Create, manage, and upload CBT exams to students</p>
              </div>
            </div>
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-lg"
            >
              <Plus className="w-4 h-4" /> New Exam
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Exams Created Yet</h3>
              <p className="text-slate-400 mb-4">Click "New Exam" to create your first CBT exam.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => (
                <div key={exam.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[exam.status] || ''}`}>
                          {exam.status === 'APPROVED' ? 'Approved by Admin' : exam.status === 'PUBLISHED' ? '🚀 Live for Students' : exam.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {exam.assessment_type === 'TEST' ? 'C.A. Test' : 'Final Exam'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                      <p className="text-sm text-slate-500">{exam.course_detail?.name} • {exam.duration_minutes} mins • {exam.questions_count} questions</p>
                      {exam.rejection_reason && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {exam.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(exam.status === 'DRAFT' || exam.status === 'REJECTED') && (
                        <button
                          onClick={() => { setSelectedExamId(exam.id); fetchQuestions(exam.id); setView('questions'); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          Edit Questions
                        </button>
                      )}
                      {exam.status === 'APPROVED' && (
                        <button
                          onClick={() => handlePublishExam(exam.id)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1 shadow-md animate-bounce"
                        >
                          <Send className="w-3.5 h-3.5" /> Upload / Publish to Students
                        </button>
                      )}
                      {(exam.status === 'APPROVED' || exam.status === 'PUBLISHED') && (
                        <button
                          onClick={() => { setSelectedExamId(exam.id); fetchAttempts(exam.id); setView('attempts'); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" /> View Student Results
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ CREATE EXAM ============
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setView('list')} className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
            <h1 className="text-2xl font-bold text-slate-900">Create New CBT Exam</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div><label className={labelClass}>Exam Title</label><input className={inputClass} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Mathematics Mid-Term Test" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Course</label>
                <select className={inputClass} value={form.course} onChange={e => setForm({...form, course: e.target.value})}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Assessment Type</label>
                <select className={inputClass} value={form.assessment_type} onChange={e => setForm({...form, assessment_type: e.target.value})}>
                  <option value="TEST">Continuous Assessment Test</option>
                  <option value="EXAM">Term Final Examination</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelClass}>Term</label>
                <select className={inputClass} value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
                  <option value="1ST_TERM">1st Term</option>
                  <option value="2ND_TERM">2nd Term</option>
                  <option value="3RD_TERM">3rd Term</option>
                </select>
              </div>
              <div><label className={labelClass}>Duration (mins)</label><input type="number" className={inputClass} value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value) || 30})} min={5} max={180} /></div>
              <div><label className={labelClass}>Questions/Page</label><input type="number" className={inputClass} value={form.questions_per_page} onChange={e => setForm({...form, questions_per_page: parseInt(e.target.value) || 1})} min={1} max={10} /></div>
            </div>
            <div><label className={labelClass}>Instructions (optional)</label><textarea className={inputClass} rows={3} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="Instructions for students before starting..." /></div>
            <div><label className={labelClass}>Description (optional)</label><textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <button
              onClick={handleCreateExam}
              disabled={!form.title || !form.course || loading}
              className="w-full h-12 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create & Add Questions →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ ADD QUESTIONS ============
  if (view === 'questions' && selectedExamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Add Questions</h1>
                <p className="text-sm text-slate-500">{questions.length} question(s) added so far</p>
              </div>
            </div>
            {questions.length > 0 && (
              <button
                onClick={handleSubmitForApproval}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                <Send className="w-4 h-4" /> Submit for Approval
              </button>
            )}
          </div>

          {/* Existing Questions */}
          {questions.length > 0 && (
            <div className="space-y-3 mb-6">
              {questions.map((q: any, i: number) => (
                <div key={q.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm mb-2">{q.question_text}</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <span key={opt} className={`px-2 py-1 rounded-lg ${q.correct_option === opt ? 'bg-green-100 text-green-700 font-semibold' : 'bg-slate-50 text-slate-500'}`}>
                            {opt}. {q[`option_${opt.toLowerCase()}`]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Question Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-dashed border-emerald-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600" /> Add Question #{questions.length + 1}</h3>
            <div className="space-y-3">
              <div><label className={labelClass}>Question Text</label><textarea className={inputClass} rows={2} value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} placeholder="Enter the question..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Option A</label><input className={inputClass} value={newQuestion.option_a} onChange={e => setNewQuestion({...newQuestion, option_a: e.target.value})} /></div>
                <div><label className={labelClass}>Option B</label><input className={inputClass} value={newQuestion.option_b} onChange={e => setNewQuestion({...newQuestion, option_b: e.target.value})} /></div>
                <div><label className={labelClass}>Option C</label><input className={inputClass} value={newQuestion.option_c} onChange={e => setNewQuestion({...newQuestion, option_c: e.target.value})} /></div>
                <div><label className={labelClass}>Option D</label><input className={inputClass} value={newQuestion.option_d} onChange={e => setNewQuestion({...newQuestion, option_d: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Correct Answer</label>
                  <select className={inputClass} value={newQuestion.correct_option} onChange={e => setNewQuestion({...newQuestion, correct_option: e.target.value})}>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
                <div><label className={labelClass}>Points</label><input type="number" className={inputClass} value={newQuestion.points} onChange={e => setNewQuestion({...newQuestion, points: parseFloat(e.target.value) || 1})} min={0.5} step={0.5} /></div>
              </div>
              <button
                onClick={handleAddQuestion}
                disabled={!newQuestion.question_text || !newQuestion.option_a || !newQuestion.option_b}
                className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VIEW STUDENT ATTEMPTS ============
  if (view === 'attempts' && selectedExamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setView('list')} className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Student Results</h1>
              <p className="text-slate-500 text-sm">{attempts.length} submission(s)</p>
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">No Submissions Yet</h3>
              <p className="text-slate-400">Students haven't taken this exam yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map(a => (
                <div key={a.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{a.student_name}</h4>
                    <p className="text-sm text-slate-500">Score: {a.score}/{a.total_possible} ({a.percentage}%) {a.auto_submitted && '⏱ Auto-submitted'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { fetchAttemptDetail(selectedExamId, a.id); setView('attempt-detail'); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                    {!a.gradebook_synced && (
                      <button
                        onClick={() => handleSyncGradebook(a.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sync to Gradebook
                      </button>
                    )}
                    {a.gradebook_synced && (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400">✓ Synced</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ ATTEMPT DETAIL ============
  if (view === 'attempt-detail' && attemptDetail) {
    const { attempt, answers: answersList } = attemptDetail;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('attempts')} className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{attempt.student_name}'s Submission</h1>
              <p className="text-slate-500 text-sm">Score: {attempt.score}/{attempt.total_possible} ({attempt.percentage}%)</p>
            </div>
          </div>
          <div className="space-y-3">
            {answersList.map((a: any) => (
              <div key={a.question_order} className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${a.is_correct ? 'border-green-500' : 'border-red-400'}`}>
                <p className="font-medium text-slate-800 text-sm mb-2"><span className="text-slate-400 mr-1">Q{a.question_order}.</span> {a.question_text}</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {['A', 'B', 'C', 'D'].map((opt: string) => {
                    const isCorrect = a.correct_option === opt;
                    const isSelected = a.selected_option === opt;
                    return (
                      <span key={opt} className={`px-2 py-1 rounded-lg ${isCorrect ? 'bg-green-100 text-green-700 font-bold' : isSelected && !isCorrect ? 'bg-red-100 text-red-600 line-through' : 'bg-slate-50 text-slate-500'}`}>
                        {opt}. {a[`option_${opt.toLowerCase()}`]} {isCorrect && '✓'} {isSelected && !isCorrect && '✗'}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
