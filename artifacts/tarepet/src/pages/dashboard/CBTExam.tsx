import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authClient } from '@/lib/api-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, 
  BookOpen, Timer, Send, Shield, ChevronLeft, Calculator, Flag
} from 'lucide-react';
import { Link } from 'wouter';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  points: number;
  order: number;
}

interface ExamData {
  attempt_id: number;
  started_at: string;
  duration_minutes: number;
  questions_per_page: number;
  instructions: string;
  questions: Question[];
}

interface AvailableExam {
  id: number;
  title: string;
  description: string;
  instructions: string;
  course_detail: { name: string; code: string } | null;
  assessment_type: string;
  term: string;
  duration_minutes: number;
  questions_count: number;
  questions_per_page: number;
  teacher_name: string;
  results_released?: boolean;
}

type Phase = 'list' | 'confirm' | 'exam' | 'result';

import { getStoredExams, submitStudentCBTAttempt, subscribeToCBTStore, hasStudentSubmittedExam, getStudentSubmission } from '@/lib/cbt-store';

function getQuestionOption(q: Question, opt: 'A' | 'B' | 'C' | 'D'): string {
  switch (opt) {
    case 'A': return q.option_a;
    case 'B': return q.option_b;
    case 'C': return q.option_c;
    case 'D': return q.option_d;
  }
}

/**
 * Safe arithmetic evaluator — recursive descent parser.
 * Supports: numbers, +, -, *, /, parentheses, decimals.
 * Does NOT use eval() or Function() — no code injection possible.
 */
function safeEval(expr: string): number {
  let pos = 0;
  const peek = () => expr[pos];
  const consume = () => expr[pos++];

  function skipWS() { while (pos < expr.length && expr[pos] === ' ') pos++; }

  function parseNumber(): number {
    skipWS();
    let num = '';
    if (peek() === '-') { num += consume(); }
    while (pos < expr.length && /[0-9.]/.test(peek())) { num += consume(); }
    if (num === '' || num === '-') throw new Error('Invalid number');
    return parseFloat(num);
  }

  function parsePrimary(): number {
    skipWS();
    if (peek() === '(') {
      consume(); // '('
      const val = parseExpr();
      skipWS();
      if (consume() !== ')') throw new Error('Missing )');
      return val;
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let left = parsePrimary();
    skipWS();
    while (pos < expr.length && (peek() === '*' || peek() === '/')) {
      const op = consume();
      const right = parsePrimary();
      left = op === '*' ? left * right : left / right;
      skipWS();
    }
    return left;
  }

  function parseExpr(): number {
    let left = parseTerm();
    skipWS();
    while (pos < expr.length && (peek() === '+' || peek() === '-')) {
      const op = consume();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
      skipWS();
    }
    return left;
  }

  const result = parseExpr();
  if (pos !== expr.length) throw new Error('Unexpected character');
  return result;
}
export default function StudentCBTExam() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('list');
  const [exams, setExams] = useState<AvailableExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<AvailableExam | null>(null);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('0');
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (phase !== 'exam') return;
    const handleBlur = () => {
      setWarningCount(prev => prev + 1);
      setShowWarningModal(true);
    };
    const handleVisibility = () => {
      if (document.hidden) handleBlur();
    };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [phase]);

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const fetchExams = () => {
    const all = getStoredExams();
    const activeExams = all.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED');
    const mapped = activeExams.map(e => ({
      ...e,
      course_detail: { name: e.course_name, code: e.course_code },
    }));
    setExams(mapped as any);
  };

  useEffect(() => {
    fetchExams();
    const unsub = subscribeToCBTStore(fetchExams);
    return () => unsub();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'exam' || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!submittedRef.current) handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCalcBtn = (val: string) => {
    if (val === 'C') { setCalcInput('0'); return; }
    if (val === '=') {
      try {
        // Safe arithmetic evaluator — allows only digits and + - * / . ( ) whitespace
        // No eval() or Function() used — prevents code injection.
        const expr = calcInput.replace(/[^0-9+\-*/.() ]/g, '');
        if (!expr.trim()) { setCalcInput('Error'); return; }
        const result = safeEval(expr);
        setCalcInput(isFinite(result) ? String(result) : 'Error');
      } catch {
        setCalcInput('Error');
      }
      return;
    }
    setCalcInput(prev => (prev === '0' || prev === 'Error' ? val : prev + val));
  };

  const handleStartExam = async () => {
    if (!selectedExam) return;
    const studentIdentifier = user?.email || (user?.profile as any)?.studentId || 'TMS-2024-101';
    if (hasStudentSubmittedExam(selectedExam.id, studentIdentifier)) {
      alert('Security Notice: You have already completed this examination. Re-entry is restricted to a single attempt per student.');
      setPhase('list');
      return;
    }

    setLoading(true);
    try {
      const fullEx = getStoredExams().find(e => e.id === selectedExam.id);
      if (!fullEx) throw new Error('Exam not found');

      const data: ExamData = {
        attempt_id: Date.now(),
        started_at: new Date().toISOString(),
        duration_minutes: fullEx.duration_minutes || 45,
        questions_per_page: fullEx.questions_per_page || 2,
        instructions: fullEx.instructions || 'Answer all objective questions.',
        questions: fullEx.questions as any[],
      };

      setExamData(data);
      setTimeLeft(data.duration_minutes * 60);
      setAnswers({});
      setCurrentPage(0);
      submittedRef.current = false;
      setPhase('exam');
    } catch (err: any) {
      alert('Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current || !selectedExam || !examData) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const studentName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Emeka Amadi' : 'Emeka Amadi';
      const studentEmail = user?.email || 'emeka.amadi@tarepet.edu.ng';
      const studentId = (user?.profile as any)?.studentId || 'TMS-2024-101';

      const subResult = submitStudentCBTAttempt(selectedExam.id, answers, {
        name: studentName,
        email: studentEmail,
        student_id: studentId,
      });

      const isReleased = Boolean(selectedExam.results_released);

      setResult({
        exam_title: selectedExam.title,
        course_name: selectedExam.course_detail?.name || selectedExam.title,
        submitted_at: subResult.submitted_at,
        auto_submitted: auto,
        results_released: isReleased,
        score: subResult.score,
        total_possible: subResult.total_possible,
        percentage: subResult.percentage,
        passed: subResult.percentage >= 50,
      });

      setPhase('result');
    } catch (err: any) {
      alert('Submission failed');
      submittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedExam, examData, answers, user]);

  // Pagination
  const questionsPerPage = examData?.questions_per_page || 1;
  const totalPages = examData ? Math.ceil(examData.questions.length / questionsPerPage) : 0;
  const currentQuestions = examData?.questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  ) || [];

  const answeredCount = examData ? examData.questions.filter(q => answers[q.id]).length : 0;
  const timerWarning = timeLeft > 0 && timeLeft <= 300; // 5 min warning

  // ============ EXAM LIST ============
  if (phase === 'list') {
    const studentIdentifier = user?.email || (user?.profile as any)?.studentId || 'TMS-2024-101';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/dashboard/student">
              <button className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">CBT Examinations</h1>
              <p className="text-slate-500 text-sm">Select an exam to begin</p>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Exams Available</h3>
              <p className="text-slate-400">There are no approved exams at this time. Check back later.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map(exam => {
                const submitted = hasStudentSubmittedExam(exam.id, studentIdentifier);
                const isReleased = Boolean(exam.results_released);
                const subData = submitted ? getStudentSubmission(exam.id, studentIdentifier) : null;

                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl shadow-lg border border-slate-100 p-6 transition-all ${
                      submitted && !isReleased ? 'opacity-90 bg-slate-50/70 border-amber-200 cursor-default' : 'hover:shadow-xl cursor-pointer'
                    }`}
                    onClick={() => {
                      if (submitted) {
                        if (isReleased && subData) {
                          setSelectedExam(exam);
                          setResult({
                            ...subData,
                            exam_title: exam.title,
                            course_name: exam.course_detail?.name || exam.title,
                            results_released: true,
                            passed: subData.percentage >= 50,
                          });
                          setPhase('result');
                        } else {
                          alert('Security Notice: You have already completed this examination. Single attempt restriction is enforced. Results are currently withheld until released by school administration.');
                        }
                      } else {
                        setSelectedExam(exam);
                        setPhase('confirm');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            exam.assessment_type === 'TEST' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {exam.assessment_type === 'TEST' ? 'C.A. Test' : 'Final Exam'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {exam.term.replace('_', ' ')}
                          </span>
                          {submitted && !isReleased && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-amber-600" /> Submitted (Results Withheld)
                            </span>
                          )}
                          {submitted && isReleased && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed (Results Released)
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{exam.title}</h3>
                        <p className="text-sm text-slate-500 mb-3">{exam.course_detail?.name} ({exam.course_detail?.code})</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} mins</span>
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {exam.questions_count} questions</span>
                          <span>By: {exam.teacher_name}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        {submitted ? (
                          isReleased ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">View Score</span>
                          ) : (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">1 Attempt Used</span>
                          )
                        ) : (
                          <ArrowRight className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ PRE-EXAM CONFIRMATION ============
  if (phase === 'confirm' && selectedExam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Start?</h2>
            <p className="text-slate-500 text-sm">Please read the information below carefully before starting.</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
              <div><span className="text-xs text-slate-400">Exam</span><p className="font-semibold text-slate-800 text-sm">{selectedExam.title}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <Timer className="w-5 h-5 text-red-500 shrink-0" />
              <div><span className="text-xs text-slate-400">Duration</span><p className="font-semibold text-slate-800 text-sm">{selectedExam.duration_minutes} minutes</p></div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <Shield className="w-5 h-5 text-green-600 shrink-0" />
              <div><span className="text-xs text-slate-400">Questions</span><p className="font-semibold text-slate-800 text-sm">{selectedExam.questions_count} questions, {selectedExam.questions_per_page} per page</p></div>
            </div>
          </div>

          {selectedExam.instructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-amber-800 text-sm mb-1">Instructions:</h4>
              <p className="text-amber-700 text-xs leading-relaxed">{selectedExam.instructions}</p>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-xs font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> Once you start, the timer begins immediately. If the timer runs out, your exam will be <strong>automatically submitted</strong>.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('list')}
              className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
            >
              Go Back
            </button>
            <button
              onClick={handleStartExam}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Starting...' : 'Start Exam'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============ EXAM INTERFACE ============
  if (phase === 'exam' && examData) {
    const currentQ = examData.questions[currentPage] || examData.questions[0];

    return (
      <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-sans">
        {/* Top Sticky Header with Timer */}
        <div className={`sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between border-b shadow-sm ${timerWarning ? 'bg-red-600 text-white' : 'bg-emerald-800 text-white'}`}>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/student">
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-200" />
              <h1 className="font-serif font-bold text-sm md:text-base text-white truncate max-w-xs md:max-w-md">
                {selectedExam?.title || 'CBT Assessment'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 font-mono text-sm md:text-base font-bold text-white ${timerWarning ? 'animate-pulse bg-red-700' : ''}`}>
              <Clock className="w-4 h-4 text-emerald-200" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs transition border border-teal-500/30 flex items-center gap-1.5"
                title="Toggle Calculator"
              >
                <Calculator className="w-3.5 h-3.5 text-teal-400" /> Calculator
              </button>
              {warningCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Warnings: {warningCount}
                </span>
              )}
              <button
                onClick={() => { if (confirm('Are you sure you want to submit your exam now?')) handleSubmit(false); }}
                disabled={isSubmitting}
                className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Submit Exam
              </button>
            </div>
          </div>
        </div>

        {/* Main Interface Layout: Left Green Sidebar + Main Canvas */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Floating Scientific / Standard Calculator Widget */}
          {showCalculator && (
            <div className="absolute right-6 top-6 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 w-64 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5" /> Exam Calculator</span>
                <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded">✕</button>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl mb-3 text-right font-mono font-bold text-xl text-emerald-400 overflow-x-auto min-h-[44px] flex items-center justify-end border border-slate-800">
                {calcInput}
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {['C', '(', ')', '/'].map(btn => (
                  <button key={btn} onClick={() => handleCalcBtn(btn)} className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition">{btn}</button>
                ))}
                {['7', '8', '9', '*'].map(btn => (
                  <button key={btn} onClick={() => handleCalcBtn(btn)} className={`p-2.5 rounded-lg transition ${btn === '*' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-800/60 hover:bg-slate-800 text-white'}`}>{btn}</button>
                ))}
                {['4', '5', '6', '-'].map(btn => (
                  <button key={btn} onClick={() => handleCalcBtn(btn)} className={`p-2.5 rounded-lg transition ${btn === '-' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-800/60 hover:bg-slate-800 text-white'}`}>{btn}</button>
                ))}
                {['1', '2', '3', '+'].map(btn => (
                  <button key={btn} onClick={() => handleCalcBtn(btn)} className={`p-2.5 rounded-lg transition ${btn === '+' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-800/60 hover:bg-slate-800 text-white'}`}>{btn}</button>
                ))}
                {['0', '.', '='].map(btn => (
                  <button key={btn} onClick={() => handleCalcBtn(btn)} className={`p-2.5 rounded-lg transition ${btn === '=' ? 'col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800/60 hover:bg-slate-800 text-white'}`}>{btn}</button>
                ))}
              </div>
            </div>
          )}

          {/* Anti-Cheat Window Blur Warning Modal */}
          {showWarningModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-500 shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Anti-Cheat Warning Notice</h3>
                  <p className="text-xs text-slate-600">
                    Window blur / tab switching detected! Warning count: <span className="font-bold text-amber-600">{warningCount}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Please remain on the exam screen until completion. Excessive focus loss may be logged for teacher review.
                  </p>
                </div>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  I Understand — Return to Exam
                </button>
              </div>
            </div>
          )}

          {/* Left Emerald Sidebar */}
          <div className="w-64 bg-[#0D9488] text-white p-5 flex flex-col justify-between hidden lg:flex shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                  🎓
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base leading-tight text-white">Tarepet Montessori</h2>
                  <p className="text-[10px] text-teal-100/80 uppercase font-semibold tracking-wider">CBT Exam Center</p>
                </div>
              </div>

              <nav className="space-y-1 text-sm font-semibold">
                <div className="px-4 py-3 rounded-xl bg-white/10 text-teal-100 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Dashboard</span>
                </div>
                <div className="px-4 py-3 rounded-xl bg-white/20 text-white font-bold flex items-center gap-3 shadow-sm border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>Test Seleksi</span>
                </div>
                <div className="px-4 py-3 rounded-xl text-teal-100/80 hover:bg-white/10 transition flex items-center gap-3 cursor-pointer">
                  <span>Student Profile</span>
                </div>
              </nav>
            </div>

            <div className="pt-6 border-t border-white/20">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white">
                  {user?.first_name?.[0] || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user ? `${user.first_name} ${user.last_name}` : 'Emeka Amadi'}</p>
                  <p className="text-[10px] text-teal-100/70 truncate">Student (SS1 Science)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Work Area: Left Info Cards Column + Right Question Card Column */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column (Cards: Test, Sisa Waktu, Soal Palette, Test Selanjutnya) */}
              <div className="lg:col-span-4 space-y-4">

                {/* Card 1: Test Info */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Test</p>
                  <h3 className="font-serif font-bold text-base text-slate-800">{selectedExam?.title || 'Test Potensi Skolastik'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedExam?.assessment_type === 'TEST' ? 'Continuous Assessment Test' : 'Terminal Examination'} • {selectedExam?.course_detail?.name || 'Mathematics'}</p>
                </div>

                {/* Card 2: Sisa Waktu (Timer Display) */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center justify-between">
                    <span>Sisa Waktu</span>
                    {timerWarning && <span className="text-red-500 font-extrabold animate-pulse">⏰ Time Ending Soon!</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-6 h-6 ${timerWarning ? 'text-red-500 animate-bounce' : 'text-emerald-600'}`} />
                    <span className={`font-mono font-extrabold text-2xl tracking-wider ${timerWarning ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-1000 ${timerWarning ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(timeLeft / ((examData?.duration_minutes || 1) * 60)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card 3: Soal (Question Palette Grid) */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Questions Palette</p>
                    <span className="text-xs font-semibold text-slate-500">{answeredCount}/{examData.questions.length} Answered</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {examData.questions.map((q, i) => {
                      const isAnswered = Boolean(answers[q.id]);
                      const isFlagged = Boolean(flaggedQuestions[q.id]);
                      const isCurrent = currentPage === i;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentPage(i)}
                          className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                            isFlagged
                              ? 'bg-amber-500 text-white shadow-xs'
                              : isAnswered
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isCurrent
                                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 font-extrabold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {i + 1}
                          {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Answered</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Flagged</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Pending</span>
                  </div>
                </div>

              </div>

              {/* Right Column (Question Card) */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-md space-y-6">

                  {/* Top Bar: Previous | Pertanyaan X | Flag | Next */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 disabled:opacity-30 disabled:hover:text-slate-600 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previously
                    </button>

                    <div className="flex items-center gap-3">
                      <h3 className="font-serif font-bold text-lg text-emerald-600">
                        Question {currentPage + 1} <span className="text-slate-400 font-normal text-sm">/ {examData.questions.length}</span>
                      </h3>
                      <button
                        onClick={() => toggleFlag(currentQ.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          flaggedQuestions[currentQ.id]
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Flag for Review"
                      >
                        <Flag className="w-3.5 h-3.5" /> {flaggedQuestions[currentQ.id] ? 'Flagged' : 'Flag'}
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(examData.questions.length - 1, p + 1))}
                      disabled={currentPage >= examData.questions.length - 1}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 disabled:opacity-30 disabled:hover:text-slate-600 cursor-pointer"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="py-2">
                    <p className="text-slate-800 font-medium text-sm md:text-base leading-relaxed">
                      {currentQ.question_text}
                    </p>
                  </div>

                  {/* Radio Options List */}
                  <div className="space-y-3">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const optionText = getQuestionOption(currentQ, opt);
                      const isSelected = answers[currentQ.id] === opt;

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(currentQ.id, opt)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 text-slate-900 shadow-xs'
                              : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {/* Custom Radio Button Circle */}
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-emerald-600 bg-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                          </div>

                          <span className="text-sm font-medium leading-normal flex-1">
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {answers[currentQ.id] ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Option {answers[currentQ.id]} selected
                        </span>
                      ) : (
                        <span>Please select an option to mark answer</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (currentPage < examData.questions.length - 1) {
                          setCurrentPage(p => p + 1);
                        } else {
                          if (confirm('You have reached the last question. Would you like to submit your exam now?')) {
                            handleSubmit(false);
                          }
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {currentPage === examData.questions.length - 1 ? 'Submit Exam' : 'Next'}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ RESULT / CONFIRMATION PHASE ============
  if (phase === 'result' && result) {
    const isReleased = Boolean(result.results_released);
    const pct = result.percentage || 0;
    const passed = pct >= 50;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center"
        >
          {!isReleased ? (
            // SECURE SUBMISSION CONFIRMATION (WITHHELD RESULTS)
            <>
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-inner">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {result.auto_submitted ? "Time Expired — Exam Auto-Submitted!" : "Exam Submitted Successfully!"}
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Your examination responses have been logged securely.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Results Withheld Policy</span>
                </div>
                <p className="text-amber-700 text-xs leading-relaxed">
                  To protect exam confidentiality and maintain academic standards, student scores are not displayed immediately after submission. Your official result will be viewable once released by your teacher or school administrator.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Exam Title:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">{result.exam_title || selectedExam?.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Submitted At:</span>
                  <span className="font-mono text-slate-700">{result.submitted_at ? new Date(result.submitted_at).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Attempt Status:</span>
                  <span className="font-bold text-emerald-600">✓ 1 of 1 Attempt Recorded (Locked)</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPhase('list')}
                  className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Back to Exams
                </button>
                <Link href="/dashboard/student" className="flex-1">
                  <button className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer">
                    Dashboard
                  </button>
                </Link>
              </div>
            </>
          ) : (
            // RELEASED RESULTS VIEW
            <>
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                {passed ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <AlertTriangle className="w-10 h-10 text-red-500" />}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Official Results Released
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                {result.exam_title || selectedExam?.title}
              </p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                <div className="text-5xl font-black mb-2" style={{ color: passed ? '#16a34a' : '#dc2626' }}>
                  {pct}%
                </div>
                <p className="text-slate-500 text-sm">
                  Score: {result.score} / {result.total_possible}
                </p>
              </div>

              <Link href="/dashboard/student">
                <button className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer">
                  Back to Dashboard
                </button>
              </Link>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return null;
}

