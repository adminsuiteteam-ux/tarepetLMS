import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authClient } from '@/lib/api-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, 
  BookOpen, Timer, Send, Shield, ChevronLeft, Calculator, Flag, GraduationCap,
  Lock, Maximize2, ShieldAlert, EyeOff, Copy, Layers, ShieldCheck, FileText, Play, Check
} from 'lucide-react';
import { Link } from 'wouter';
import { useCustomDialog } from '@/context/DialogContext';
import tarepetLogo from '@assets/tarepet__1784835204178.png';

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

import { getStoredExams, submitStudentCBTAttempt, subscribeToCBTStore, hasStudentSubmittedExam, getStudentSubmission, isStudentMarkedPresent, CBTIntegrityFlag } from '@/lib/cbt-store';

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

// ── Persistent CBT Lockout & Session Storage ──────────────────────────────
const CBT_SESSION_STORAGE_PREFIX = 'tarepet_cbt_active_session_';
const CBT_LOCKOUT_STORAGE_PREFIX = 'tarepet_cbt_lockout_';

interface SavedLockout {
  studentId: string;
  examId: number | string;
  lockoutUntil: number; // Unix timestamp in ms
  integrityFlags: CBTIntegrityFlag[];
  pauseEvents?: Array<{ timestamp: string; durationMinutes: number }>;
  savedAt: number;
}

interface SavedSession {
  examId: number | string;
  attemptId: number | string;
  startedAt: string;
  durationMinutes: number;
  timeLeft: number;
  answers: Record<number, string>;
  flaggedQuestions: Record<number, boolean>;
  currentPage: number;
  integrityFlags: CBTIntegrityFlag[];
  autoPaused: boolean;
  pauseEvents?: Array<{ timestamp: string; durationMinutes: number }>;
  savedAt: number;
  examData?: ExamData;
}

function getSessionKey(studentId: string, examId: number | string): string {
  return `${CBT_SESSION_STORAGE_PREFIX}${studentId}_${examId}`;
}

function getLockoutKey(studentId: string, examId: number | string): string {
  return `${CBT_LOCKOUT_STORAGE_PREFIX}${studentId}_${examId}`;
}

function saveLockout(
  studentId: string,
  examId: number | string,
  lockoutUntil: number,
  integrityFlags: CBTIntegrityFlag[],
  pauseEvents?: Array<{ timestamp: string; durationMinutes: number }>
) {
  if (!studentId || !examId || typeof window === 'undefined') return;
  try {
    const data: SavedLockout = {
      studentId: String(studentId),
      examId: String(examId),
      lockoutUntil,
      integrityFlags,
      pauseEvents,
      savedAt: Date.now(),
    };
    localStorage.setItem(getLockoutKey(studentId, examId), JSON.stringify(data));
  } catch (e) {}
}

function getActiveLockout(studentId: string, examId: number | string): (SavedLockout & { remainingSeconds: number }) | null {
  if (!studentId || !examId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getLockoutKey(studentId, examId));
    if (!raw) return null;
    const data: SavedLockout = JSON.parse(raw);
    const remaining = Math.ceil((data.lockoutUntil - Date.now()) / 1000);
    if (remaining > 0) {
      return { ...data, remainingSeconds: remaining };
    } else {
      localStorage.removeItem(getLockoutKey(studentId, examId));
      return null;
    }
  } catch (e) {
    return null;
  }
}

function findActiveLockoutForStudent(studentId: string): (SavedLockout & { remainingSeconds: number }) | null {
  if (!studentId || typeof window === 'undefined') return null;
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CBT_LOCKOUT_STORAGE_PREFIX) && key.includes(`_${studentId}_`)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed: SavedLockout = JSON.parse(raw);
        const remaining = Math.ceil((parsed.lockoutUntil - now) / 1000);
        if (remaining > 0) {
          return { ...parsed, remainingSeconds: remaining };
        } else {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {}
  return null;
}

function clearLockout(studentId: string, examId: number | string) {
  if (!studentId || !examId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getLockoutKey(studentId, examId));
  } catch (e) {}
}

function saveActiveSession(studentId: string, examId: number | string, partial: Partial<SavedSession>) {
  if (!studentId || !examId || typeof window === 'undefined') return;
  try {
    const key = getSessionKey(studentId, examId);
    const existing = getActiveSession(studentId, examId) || {};
    const updated: SavedSession = {
      ...existing,
      ...partial,
      studentId: String(studentId),
      examId: String(examId),
      savedAt: Date.now(),
    } as SavedSession;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}
}

function getActiveSession(studentId: string, examId: number | string): SavedSession | null {
  if (!studentId || !examId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getSessionKey(studentId, examId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function findActiveSessionForStudent(studentId: string): SavedSession | null {
  if (!studentId || typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CBT_SESSION_STORAGE_PREFIX) && key.includes(`_${studentId}_`)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        return JSON.parse(raw);
      }
    }
  } catch (e) {}
  return null;
}

function clearActiveSession(studentId: string, examId: number | string) {
  if (!studentId || !examId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getSessionKey(studentId, examId));
  } catch (e) {}
}

export default function StudentCBTExam() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useCustomDialog();
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
  const [showAttendanceNoticeModal, setShowAttendanceNoticeModal] = useState(false);

  // Anti-Cheat & Integrity State
  const [integrityFlags, setIntegrityFlags] = useState<CBTIntegrityFlag[]>([]);
  const [autoPaused, setAutoPaused] = useState(false);
  const [pauseCountdown, setPauseCountdown] = useState(300); // 5 minutes = 300s
  const [pauseEvents, setPauseEvents] = useState<Array<{ timestamp: string; durationMinutes: number }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeWarningToast, setActiveWarningToast] = useState<string | null>(null);

  const autoPausedRef = useRef(false);
  autoPausedRef.current = autoPaused;
  const flagsRef = useRef<CBTIntegrityFlag[]>([]);
  flagsRef.current = integrityFlags;
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestBrowserFullscreen = useCallback(() => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.warn('[CBTExam] Fullscreen request blocked:', err);
        });
      }
    } catch (e) {
      console.warn('[CBTExam] Fullscreen API error:', e);
    }
  }, []);

  const getStudentIdentifier = useCallback((u: any): string => {
    if (!u) {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('tarepet_auth_user') || sessionStorage.getItem('tarepet_auth_user');
          if (stored) {
            const p = JSON.parse(stored);
            if (p) return getStudentIdentifier(p);
          }
        } catch (e) {}
      }
      return 'student_session';
    }
    return (
      u.profile?.student_id ||
      u.profile?.studentId ||
      u.profile?.admission_number ||
      u.student_id ||
      u.studentId ||
      u.admissionNo ||
      u.code ||
      u.email ||
      String(u.id || '') ||
      'student_session'
    );
  }, []);

  const recordIntegrityFlag = useCallback((type: CBTIntegrityFlag['type'], detail?: string) => {
    if (submittedRef.current) return;
    const now = new Date().toISOString();
    setIntegrityFlags(prev => {
      const nextCount = prev.length + 1;
      const newFlag: CBTIntegrityFlag = {
        type,
        timestamp: now,
        flagCount: nextCount,
        detail,
      };
      const updated = [...prev, newFlag];
      const stId = getStudentIdentifier(user);

      // Auto-pause locks exam for 5 minutes when 5 flags are reached
      if (nextCount >= 5 && !autoPausedRef.current) {
        setAutoPaused(true);
        autoPausedRef.current = true;
        const durationSeconds = 300;
        setPauseCountdown(durationSeconds);
        const lockoutUntil = Date.now() + durationSeconds * 1000;
        const newEvents = [...pauseEvents, { timestamp: now, durationMinutes: 5 }];
        setPauseEvents(newEvents);
        if (selectedExam) {
          saveLockout(stId, selectedExam.id, lockoutUntil, updated, newEvents);
          saveActiveSession(stId, selectedExam.id, {
            examId: selectedExam.id,
            integrityFlags: updated,
            autoPaused: true,
            pauseEvents: newEvents,
            examData: examData || undefined,
            answers,
            flaggedQuestions,
            currentPage,
            timeLeft,
          });
        }
        requestBrowserFullscreen();
      } else if (selectedExam) {
        saveActiveSession(stId, selectedExam.id, {
          integrityFlags: updated,
        });
      }
      return updated;
    });

    if (warningToastTimeoutRef.current) clearTimeout(warningToastTimeoutRef.current);
    setActiveWarningToast(detail || `Integrity Warning: ${type.replace(/_/g, ' ')} detected!`);
    warningToastTimeoutRef.current = setTimeout(() => {
      setActiveWarningToast(null);
    }, 4500);
  }, [user, selectedExam, examData, answers, flaggedQuestions, currentPage, timeLeft, pauseEvents, requestBrowserFullscreen, getStudentIdentifier]);

  // 5-minute Auto-pause countdown timer synced in real-time with stored lockoutUntil
  useEffect(() => {
    if (!autoPaused) {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
      return;
    }

    requestBrowserFullscreen();

    const updateCountdown = () => {
      const stId = getStudentIdentifier(user);
      const examId = selectedExam?.id;
      if (stId && examId) {
        const lock = getActiveLockout(stId, examId);
        if (lock && lock.remainingSeconds > 0) {
          setPauseCountdown(lock.remainingSeconds);
          return;
        } else if (lock && lock.remainingSeconds <= 0) {
          setPauseCountdown(0);
          if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
          return;
        }
      }
      setPauseCountdown(prev => {
        if (prev <= 1) {
          if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    };

    updateCountdown();
    pauseTimerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };
  }, [autoPaused, selectedExam, user, requestBrowserFullscreen, getStudentIdentifier]);

  // Full Screen Lockdown & Tamper Prevention: block key shortcuts, contextmenu, beforeunload while autoPaused
  useEffect(() => {
    if (!autoPaused) return;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDownLock = (e: KeyboardEvent) => {
      // Intercept reload keys: F5, Ctrl+R, Cmd+R
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Intercept navigation keys: Escape, Backspace, Alt+Left, F11, F12
      if (['Escape', 'Backspace', 'F11', 'F12'].includes(e.key) || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your examination session is currently locked due to integrity violations. Leaving or refreshing will NOT clear your lockout.';
      return e.returnValue;
    };

    const handleContextMenuLock = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDownLock, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('contextmenu', handleContextMenuLock);

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDownLock, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('contextmenu', handleContextMenuLock);
    };
  }, [autoPaused]);

  // Anti-Cheat Event Listeners (Fullscreen exit, window blur, tab switch, copy, contextmenu, key shortcuts)
  useEffect(() => {
    if (phase !== 'exam') return;

    const handleFsChange = () => {
      const inFs = Boolean(document.fullscreenElement);
      setIsFullscreen(inFs);
      if (!inFs && !submittedRef.current) {
        recordIntegrityFlag('FULLSCREEN_EXIT', 'Exited fullscreen examination mode.');
      }
    };

    const handleBlur = () => {
      if (!submittedRef.current) {
        recordIntegrityFlag('TAB_SWITCH', 'Lost window focus or switched application.');
      }
    };

    const handleVisibility = () => {
      if (document.hidden && !submittedRef.current) {
        recordIntegrityFlag('TAB_SWITCH', 'Browser tab minimized or switched away.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (!submittedRef.current) {
        recordIntegrityFlag('RIGHT_CLICK', 'Context menu / right-click attempted on examination.');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (!submittedRef.current) {
        recordIntegrityFlag('COPY_ATTEMPT', 'Clipboard copy attempted on questions.');
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      if (!submittedRef.current) {
        recordIntegrityFlag('COPY_ATTEMPT', 'Clipboard cut attempted.');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        recordIntegrityFlag('SCREENSHOT_ATTEMPT', 'PrintScreen key pressed (Screenshot attempt).');
        return;
      }
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier) {
        const key = e.key.toLowerCase();
        if (['c', 'v', 'x', 'u', 'p', 'a', 's'].includes(key)) {
          e.preventDefault();
          recordIntegrityFlag('COPY_ATTEMPT', `Keyboard shortcut Ctrl/Cmd+${key.toUpperCase()} blocked.`);
        }
      }
      if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
        e.preventDefault();
        recordIntegrityFlag('TAB_SWITCH', 'Alt+Tab / Alt+F4 hotkey combination detected.');
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, recordIntegrityFlag]);

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

  // Auto-restore active exam session or active lockout on page reload/mount
  useEffect(() => {
    if (!user) return;
    const stId = getStudentIdentifier(user);
    if (!stId) return;

    // 1. Check if there is an active lockout for this student
    const activeLock = findActiveLockoutForStudent(stId);
    if (activeLock && activeLock.remainingSeconds > 0) {
      const allExams = getStoredExams();
      const matched = allExams.find(e => String(e.id) === String(activeLock.examId));
      if (matched) {
        const savedSession = getActiveSession(stId, matched.id);
        const mappedExam: AvailableExam = {
          ...matched,
          course_detail: { name: matched.course_name, code: matched.course_code },
        };
        setSelectedExam(mappedExam);

        const fullData: ExamData = savedSession?.examData || {
          attempt_id: savedSession?.attemptId ? Number(savedSession.attemptId) : Date.now(),
          started_at: savedSession?.startedAt || new Date().toISOString(),
          duration_minutes: matched.duration_minutes || 45,
          questions_per_page: matched.questions_per_page || 2,
          instructions: matched.instructions || 'Answer all objective questions.',
          questions: matched.questions as any[],
        };
        setExamData(fullData);
        if (savedSession?.answers) setAnswers(savedSession.answers);
        if (savedSession?.flaggedQuestions) setFlaggedQuestions(savedSession.flaggedQuestions);
        if (savedSession?.currentPage !== undefined) setCurrentPage(savedSession.currentPage);
        if (savedSession?.timeLeft !== undefined) setTimeLeft(savedSession.timeLeft);
        else setTimeLeft(fullData.duration_minutes * 60);

        setIntegrityFlags(activeLock.integrityFlags || []);
        flagsRef.current = activeLock.integrityFlags || [];
        setPauseEvents(activeLock.pauseEvents || []);
        setAutoPaused(true);
        autoPausedRef.current = true;
        setPauseCountdown(activeLock.remainingSeconds);
        setPhase('exam');
        requestBrowserFullscreen();
        return;
      }
    }

    // 2. Check if there is an active session in progress that hasn't expired and hasn't been submitted
    const activeSession = findActiveSessionForStudent(stId);
    if (activeSession && phase === 'list' && !submittedRef.current) {
      const allExams = getStoredExams();
      const matched = allExams.find(e => String(e.id) === String(activeSession.examId));
      if (matched && !hasStudentSubmittedExam(matched.id, stId)) {
        const elapsedSinceSave = Math.floor((Date.now() - activeSession.savedAt) / 1000);
        const remainingTime = Math.max(0, activeSession.timeLeft - (activeSession.autoPaused ? 0 : elapsedSinceSave));
        if (remainingTime > 0) {
          const mappedExam: AvailableExam = {
            ...matched,
            course_detail: { name: matched.course_name, code: matched.course_code },
          };
          setSelectedExam(mappedExam);
          setExamData(activeSession.examData || {
            attempt_id: activeSession.attemptId ? Number(activeSession.attemptId) : Date.now(),
            started_at: activeSession.startedAt || new Date().toISOString(),
            duration_minutes: matched.duration_minutes || 45,
            questions_per_page: matched.questions_per_page || 2,
            instructions: matched.instructions || 'Answer all objective questions.',
            questions: matched.questions as any[],
          });
          setAnswers(activeSession.answers || {});
          setFlaggedQuestions(activeSession.flaggedQuestions || {});
          setCurrentPage(activeSession.currentPage || 0);
          setTimeLeft(remainingTime);
          setIntegrityFlags(activeSession.integrityFlags || []);
          flagsRef.current = activeSession.integrityFlags || [];
          setPauseEvents(activeSession.pauseEvents || []);
          if (activeSession.autoPaused) {
            const lock = getActiveLockout(stId, matched.id);
            if (lock && lock.remainingSeconds > 0) {
              setAutoPaused(true);
              autoPausedRef.current = true;
              setPauseCountdown(lock.remainingSeconds);
            }
          }
          setPhase('exam');
          requestBrowserFullscreen();
        }
      }
    }
  }, [user, requestBrowserFullscreen, getStudentIdentifier, phase]);

  // Timer (pauses countdown during auto-pause)
  useEffect(() => {
    if (phase !== 'exam' || timeLeft <= 0 || autoPaused) return;
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
  }, [phase, timeLeft, autoPaused]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCalcBtn = (val: string) => {
    if (val === 'C') { setCalcInput('0'); return; }
    if (val === '=') {
      try {
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

  const handleResumeFromLock = () => {
    if (pauseCountdown > 0) return;
    const studentIdentifier = getStudentIdentifier(user);
    if (selectedExam) {
      clearLockout(studentIdentifier, selectedExam.id);
      saveActiveSession(studentIdentifier, selectedExam.id, {
        autoPaused: false,
      });
    }
    setAutoPaused(false);
    autoPausedRef.current = false;
    requestBrowserFullscreen();
  };

  const handleStartExam = async () => {
    if (!selectedExam) return;
    const studentIdentifier = getStudentIdentifier(user);
    const studentName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Student';

    if (hasStudentSubmittedExam(selectedExam.id, studentIdentifier)) {
      showAlert({
        title: 'Single Attempt Restriction',
        message: 'Security Notice: You have already completed this examination. Re-entry is restricted to a single attempt per student.',
        type: 'warning',
        badge: 'CBT Anti-Cheat',
        confirmText: 'Return to Exams',
      });
      setPhase('list');
      return;
    }

    if (!isStudentMarkedPresent(selectedExam.id, studentIdentifier) && !isStudentMarkedPresent(selectedExam.id, studentName)) {
      setShowAttendanceNoticeModal(true);
      return;
    }

    // CHECK IF CURRENTLY LOCKED OUT: PREVENT BYPASS AND RE-ENGAGE FULLSCREEN LOCK
    const activeLock = getActiveLockout(studentIdentifier, selectedExam.id);
    if (activeLock && activeLock.remainingSeconds > 0) {
      const fullEx = getStoredExams().find(e => e.id === selectedExam.id);
      const savedSession = getActiveSession(studentIdentifier, selectedExam.id);
      const data: ExamData = savedSession?.examData || {
        attempt_id: savedSession?.attemptId ? Number(savedSession.attemptId) : Date.now(),
        started_at: savedSession?.startedAt || new Date().toISOString(),
        duration_minutes: fullEx?.duration_minutes || 45,
        questions_per_page: fullEx?.questions_per_page || 2,
        instructions: fullEx?.instructions || 'Answer all objective questions.',
        questions: fullEx?.questions as any[],
      };
      setExamData(data);
      if (savedSession?.answers) setAnswers(savedSession.answers);
      if (savedSession?.flaggedQuestions) setFlaggedQuestions(savedSession.flaggedQuestions);
      if (savedSession?.currentPage !== undefined) setCurrentPage(savedSession.currentPage);
      if (savedSession?.timeLeft !== undefined) setTimeLeft(savedSession.timeLeft);
      else setTimeLeft(data.duration_minutes * 60);

      setIntegrityFlags(activeLock.integrityFlags || []);
      flagsRef.current = activeLock.integrityFlags || [];
      setPauseEvents(activeLock.pauseEvents || []);
      setAutoPaused(true);
      autoPausedRef.current = true;
      setPauseCountdown(activeLock.remainingSeconds);
      setPhase('exam');
      requestBrowserFullscreen();
      return;
    }

    setLoading(true);
    try {
      const fullEx = getStoredExams().find(e => e.id === selectedExam.id);
      if (!fullEx) throw new Error('Exam not found');

      // Check if resuming an ongoing attempt
      const savedSession = getActiveSession(studentIdentifier, selectedExam.id);
      const data: ExamData = savedSession?.examData || {
        attempt_id: savedSession?.attemptId ? Number(savedSession.attemptId) : Date.now(),
        started_at: savedSession?.startedAt || new Date().toISOString(),
        duration_minutes: fullEx.duration_minutes || 45,
        questions_per_page: fullEx.questions_per_page || 2,
        instructions: fullEx.instructions || 'Answer all objective questions.',
        questions: fullEx.questions as any[],
      };

      setExamData(data);
      const remainingTime = savedSession?.timeLeft !== undefined ? savedSession.timeLeft : data.duration_minutes * 60;
      setTimeLeft(remainingTime);
      setAnswers(savedSession?.answers || {});
      setCurrentPage(savedSession?.currentPage || 0);
      setFlaggedQuestions(savedSession?.flaggedQuestions || {});
      setIntegrityFlags(savedSession?.integrityFlags || []);
      flagsRef.current = savedSession?.integrityFlags || [];
      setAutoPaused(false);
      autoPausedRef.current = false;
      setPauseEvents(savedSession?.pauseEvents || []);
      submittedRef.current = false;

      saveActiveSession(studentIdentifier, selectedExam.id, {
        examId: selectedExam.id,
        attemptId: data.attempt_id,
        startedAt: data.started_at,
        durationMinutes: data.duration_minutes,
        timeLeft: remainingTime,
        answers: savedSession?.answers || {},
        flaggedQuestions: savedSession?.flaggedQuestions || {},
        currentPage: savedSession?.currentPage || 0,
        integrityFlags: savedSession?.integrityFlags || [],
        autoPaused: false,
        examData: data,
      });

      setPhase('exam');
      requestBrowserFullscreen();
    } catch (err: any) {
      showAlert({
        title: 'Exam Launch Failed',
        message: 'Unable to start examination. Please contact your invigilator or administrator.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (questionId: number, option: string) => {
    const nextAnswers = { ...answers, [questionId]: option };
    setAnswers(nextAnswers);
    const studentIdentifier = getStudentIdentifier(user);
    if (selectedExam) {
      saveActiveSession(studentIdentifier, selectedExam.id, {
        answers: nextAnswers,
        currentPage,
        timeLeft,
      });
    }
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current || !selectedExam || !examData) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);

    if (typeof document !== 'undefined' && document.fullscreenElement) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch (e) {}
    }

    try {
      const studentName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student' : 'Student';
      const studentEmail = user?.email || 'student@tarepet.com';
      const studentId = getStudentIdentifier(user) || 'TMS-STU-001';
      const studentClass = (user?.profile as any)?.grade_level || (user?.profile as any)?.grade || (user as any)?.grade || selectedExam.class || 'SS1';
      const studentStream = (user?.profile as any)?.stream || (user as any)?.stream || selectedExam.stream || 'Science';

      const subResult = await submitStudentCBTAttempt(selectedExam.id, answers, {
        name: studentName,
        email: studentEmail,
        student_id: studentId,
        class: studentClass,
        stream: studentStream,
      }, {
        flags: flagsRef.current,
        autoPaused: autoPausedRef.current,
        pauseEvents: pauseEvents,
      }, auto);

      // Clear storage on successful submission
      clearLockout(studentId, selectedExam.id);
      clearActiveSession(studentId, selectedExam.id);

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
      showAlert({
        title: 'Submission Error',
        message: 'Failed to record your exam attempt. Please check your internet connection and retry.',
        type: 'error',
      });
      submittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedExam, examData, answers, user, showAlert, getStudentIdentifier, pauseEvents]);

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
    const studentIdentifier = getStudentIdentifier(user);

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

                const activeLock = getActiveLockout(studentIdentifier, exam.id);

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
                          showAlert({
                            title: 'Results Withheld',
                            message: 'Security Notice: You have already completed this examination. Single attempt restriction is enforced. Results are currently withheld until officially released by school administration.',
                            type: 'info',
                            badge: 'Attempt Recorded',
                            confirmText: 'Understood',
                          });
                        }
                      } else {
                        setSelectedExam(exam);
                        const lock = getActiveLockout(studentIdentifier, exam.id);
                        if (lock && lock.remainingSeconds > 0) {
                          const fullEx = getStoredExams().find(e => e.id === exam.id);
                          const savedSession = getActiveSession(studentIdentifier, exam.id);
                          const data: ExamData = savedSession?.examData || {
                            attempt_id: savedSession?.attemptId ? Number(savedSession.attemptId) : Date.now(),
                            started_at: savedSession?.startedAt || new Date().toISOString(),
                            duration_minutes: fullEx?.duration_minutes || 45,
                            questions_per_page: fullEx?.questions_per_page || 2,
                            instructions: fullEx?.instructions || 'Answer all objective questions.',
                            questions: fullEx?.questions as any[],
                          };
                          setExamData(data);
                          if (savedSession?.answers) setAnswers(savedSession.answers);
                          if (savedSession?.flaggedQuestions) setFlaggedQuestions(savedSession.flaggedQuestions);
                          if (savedSession?.currentPage !== undefined) setCurrentPage(savedSession.currentPage);
                          if (savedSession?.timeLeft !== undefined) setTimeLeft(savedSession.timeLeft);
                          else setTimeLeft(data.duration_minutes * 60);

                          setIntegrityFlags(lock.integrityFlags || []);
                          flagsRef.current = lock.integrityFlags || [];
                          setPauseEvents(lock.pauseEvents || []);
                          setAutoPaused(true);
                          autoPausedRef.current = true;
                          setPauseCountdown(lock.remainingSeconds);
                          setPhase('exam');
                          requestBrowserFullscreen();
                          return;
                        }
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
                          {!submitted && activeLock && activeLock.remainingSeconds > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                              <Lock className="w-3.5 h-3.5 text-rose-600" /> Locked ({formatTime(activeLock.remainingSeconds)})
                            </span>
                          )}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#140608] to-slate-900 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Ambient Brand Background Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#C8102E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#0F8A3D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/3 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-slate-800 max-w-4xl w-full overflow-hidden relative z-10 flex flex-col"
        >
          {/* Top Brand Banner */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img
                src={tarepetLogo}
                alt="Tarepet Montessori Logo"
                className="w-9 h-9 object-contain drop-shadow-sm rounded-full bg-white p-0.5"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#C8102E]">
                    Tarepet Montessori School
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[11px] font-semibold text-slate-500">CBT Portal</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Computer-Based Assessment Center
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                selectedExam.assessment_type === 'TEST'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  : 'bg-[#C8102E]/10 text-[#C8102E] dark:text-red-400 border-[#C8102E]/20'
              }`}>
                {selectedExam.assessment_type === 'TEST' ? 'Continuous Assessment' : 'Terminal Examination'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-[#0F8A3D] dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F8A3D] animate-pulse"></span>
                Anti-Cheat Active
              </span>
            </div>
          </div>

          {/* Landscape 2-Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
            {/* Left Column: Exam Details & Parameters */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>{selectedExam.course_detail?.name || 'Academic Course'}</span>
                  {selectedExam.course_detail?.code && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">{selectedExam.course_detail.code}</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mt-1">
                  {selectedExam.title}
                </h2>
                <div className="flex items-center flex-wrap gap-y-1 gap-x-4 mt-2.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E]" />
                    Term: <strong className="text-slate-700 dark:text-slate-200">{selectedExam.term || 'Current Term'}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    Examiner: <strong className="text-slate-700 dark:text-slate-200">{selectedExam.teacher_name || 'Academic Faculty'}</strong>
                  </span>
                </div>
              </div>

              {/* Metrics Grid (2x2) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-[#C8102E] flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Duration</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedExam.duration_minutes} Minutes
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Continuous countdown</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#0F8A3D] flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Questions</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedExam.questions_count} Questions
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Standard objective</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Layout</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedExam.questions_per_page} Per Page
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Paginated navigation</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Attempts</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Single Attempt</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Auto-submits on timeout</span>
                  </div>
                </div>
              </div>

              {/* Strict Warning Banner */}
              <div className="bg-[#C8102E]/5 border border-[#C8102E]/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold block">
                    Immediate Countdown & Auto-Submission
                  </strong>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Once you start, the timer begins immediately. If your time elapses, all saved answers are automatically locked and submitted for grading.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Instructions & Actions */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C8102E]" /> Candidate Honor Code
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                    Proctored
                  </span>
                </div>

                {selectedExam.instructions && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 mb-1.5">
                      <span>📌 Exam Instructions:</span>
                    </div>
                    <p className="text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium">
                      {selectedExam.instructions}
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-[#0F8A3D] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Fullscreen browser lock is enforced throughout the examination.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-[#0F8A3D] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Switching tabs, minimizing, or copying text flags an integrity violation.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-[#0F8A3D] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Built-in scratch calculator is accessible from the top toolbar.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {(() => {
                  const studentIdentifier = getStudentIdentifier(user);
                  const activeLock = selectedExam ? getActiveLockout(studentIdentifier, selectedExam.id) : null;
                  const isLocked = Boolean(activeLock && activeLock.remainingSeconds > 0);

                  return (
                    <button
                      onClick={handleStartExam}
                      disabled={loading}
                      className={`w-full h-12 rounded-xl text-white font-bold transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] cursor-pointer text-sm ${
                        isLocked
                          ? 'bg-rose-700 hover:bg-rose-800 shadow-rose-950/30'
                          : 'bg-[#C8102E] hover:bg-[#A60D25] shadow-red-900/20'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Initializing Session...
                        </span>
                      ) : isLocked ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Exam Locked ({formatTime(activeLock!.remainingSeconds)} remaining)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Examination</span>
                        </>
                      )}
                    </button>
                  );
                })()}

                <button
                  onClick={() => setPhase('list')}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Exam Catalog</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Clearance Notice Modal */}
          {showAttendanceNoticeModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-card border-2 border-[#C8102E]/30 rounded-3xl shadow-2xl w-full max-w-md p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-[#C8102E]/10 border-2 border-[#C8102E]/20 text-[#C8102E] flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">Attendance Verification Required</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    You have not yet been marked <strong className="text-[#C8102E]">PRESENT</strong> by your exam invigilator/subject teacher for this CBT session.
                  </p>
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 text-left">
                    <strong>📌 Instructions:</strong> Please report to your class invigilator in the CBT exam hall to verify your physical presence and mark your attendance before clicking Start Examination.
                  </div>
                </div>
                <button
                  onClick={() => setShowAttendanceNoticeModal(false)}
                  className="w-full py-3 bg-[#C8102E] hover:bg-[#A60D25] text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                >
                  Understand & Dismiss
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ============ FULL SCREEN SECURITY LOCKOUT VIEW ============
  if (autoPaused) {
    const studentIdentifier = getStudentIdentifier(user);
    const candidateName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Student';
    const examTitle = selectedExam?.title || examData?.instructions || 'CBT Assessment';
    const lockoutProgress = Math.min(100, Math.max(0, ((300 - pauseCountdown) / 300) * 100));

    return (
      <div className="fixed inset-0 z-[999999] w-screen h-screen min-h-screen bg-[#070B14] text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden font-sans">
        {/* Top Security Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img
              src={tarepetLogo}
              alt="Tarepet Montessori Logo"
              className="w-10 h-10 object-contain drop-shadow bg-white/10 p-1 rounded-full border border-white/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#C8102E]">
                  Tarepet Montessori School
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-400">Security Operations Center</span>
              </div>
              <h2 className="text-xs font-semibold text-slate-300">
                Automated Integrity Lockdown Engine
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isFullscreen && (
              <button
                onClick={requestBrowserFullscreen}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition cursor-pointer"
                title="Enter Fullscreen Lockdown"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Enforce Fullscreen
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>LOCKOUT ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Center Lockdown Card */}
        <div className="max-w-xl mx-auto w-full bg-slate-900/95 border-2 border-rose-500/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(225,29,72,0.3)] text-center space-y-4 backdrop-blur-xl relative overflow-hidden my-auto">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/50 text-rose-400 mx-auto flex items-center justify-center animate-pulse shadow-lg shadow-rose-950">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono uppercase tracking-widest font-bold">
              Maximum Integrity Violations Exceeded
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight">
              Examination Screen Locked
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              The CBT proctor detected <strong className="text-rose-400">{integrityFlags.length} security flags</strong> (window focus loss, fullscreen exit, or forbidden hotkeys). Your examination is locked for mandatory security enforcement.
            </p>
          </div>

          {/* Countdown Display Box */}
          <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-bold">
              <span>Mandatory Lockout Countdown</span>
              <span className="text-rose-400 font-mono font-bold animate-pulse">Testing Session Paused</span>
            </div>

            <div className="text-4xl sm:text-6xl font-mono font-black text-rose-400 tracking-wider py-1 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              {Math.floor(pauseCountdown / 60).toString().padStart(2, '0')}:{(pauseCountdown % 60).toString().padStart(2, '0')}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 transition-all duration-1000"
                style={{ width: `${lockoutProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 pt-0.5">
              {pauseCountdown > 0
                ? '🔒 Refreshing the page, closing the tab, or reopening the browser will NOT bypass this lock. The lockout countdown is strictly enforced.'
                : '✓ Mandatory lockout time has elapsed. You may now resume your examination.'}
            </p>
          </div>

          {/* Anti-Tamper Notice Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-left flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Anti-Bypass Protection Active</strong>
              <span>Your responses and remaining exam time are protected. Testing time is frozen so you will not lose exam minutes while locked.</span>
            </div>
          </div>

          {/* Violation Log */}
          <div className="text-left bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-[11px] text-slate-300 space-y-1 max-h-24 overflow-y-auto font-mono">
            <div className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center justify-between">
              <span>Recorded Integrity Flags ({integrityFlags.length}):</span>
              <span className="text-rose-400 text-[9px]">Logged to Invigilator</span>
            </div>
            {integrityFlags.slice(-4).map((f, i) => (
              <div key={i} className="flex justify-between items-center text-slate-300 text-[10px]">
                <span className="text-rose-400 font-semibold">#{f.flagCount} {f.type}</span>
                <span className="text-slate-500">{new Date(f.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleResumeFromLock}
            disabled={pauseCountdown > 0}
            className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
              pauseCountdown > 0
                ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed opacity-80'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 animate-pulse'
            }`}
          >
            {pauseCountdown > 0 ? (
              <>
                <Lock className="w-4 h-4" /> Locked ({Math.floor(pauseCountdown / 60)}:{(pauseCountdown % 60).toString().padStart(2, '0')} remaining)
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Acknowledge Violations & Resume Examination
              </>
            )}
          </button>
        </div>

        {/* Bottom Status Footer */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0 flex-wrap gap-2">
          <span>Candidate: <strong className="text-slate-200">{candidateName}</strong></span>
          <span>Exam: <strong className="text-slate-200">{examTitle}</strong></span>
          <span className="text-slate-500">Need help? Raise your hand in the CBT hall to notify your invigilator.</span>
        </div>
      </div>
    );
  }

  // ============ EXAM INTERFACE ============
  if (phase === 'exam' && examData) {
    const currentQ = examData.questions[currentPage] || examData.questions[0];

    return (
      <div className="min-h-screen bg-background flex flex-col font-sans select-none">
        {/* Fullscreen Alert Banner */}
        {!isFullscreen && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-50 sticky top-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Fullscreen Required: Exiting fullscreen mode is flagged as an exam integrity violation.</span>
            </div>
            <button
              onClick={requestBrowserFullscreen}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Re-enter Fullscreen
            </button>
          </div>
        )}

        {/* Floating Anti-Cheat Toast */}
        {activeWarningToast && (
          <div className="fixed top-14 right-6 z-50 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-rose-400 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
            <ShieldAlert className="w-5 h-5 text-white shrink-0" />
            <div>
              <p className="text-xs font-bold">Anti-Cheat Alert</p>
              <p className="text-[11px] text-rose-100">{activeWarningToast}</p>
            </div>
          </div>
        )}

        {/* Top Sticky Header with Timer */}
        <div className={`sticky ${!isFullscreen ? 'top-8' : 'top-0'} z-40 px-4 md:px-6 py-3.5 flex items-center justify-between border-b shadow-sm ${timerWarning ? 'bg-red-600 text-white' : 'bg-primary text-primary-foreground'}`}>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/student">
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-white/80" />
              <h1 className="font-serif font-bold text-sm md:text-base text-white truncate max-w-xs md:max-w-md">
                {selectedExam?.title || 'CBT Assessment'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {/* Integrity Flags Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ${integrityFlags.length > 0 ? 'bg-rose-500/25 text-white border border-rose-400/50' : 'bg-white/15 text-white/90'}`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{integrityFlags.length} {integrityFlags.length === 1 ? 'Violation' : 'Violations'}</span>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 font-mono text-sm md:text-base font-bold text-white ${timerWarning ? 'animate-pulse bg-red-700' : ''}`}>
              <Clock className="w-4 h-4 text-white/80" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="px-3 py-1.5 rounded-xl bg-card text-foreground font-bold text-xs transition border border-border flex items-center gap-1.5 shadow-xs hover:bg-muted"
                title="Toggle Calculator"
              >
                <Calculator className="w-3.5 h-3.5 text-primary" /> Calculator
              </button>
              {integrityFlags.length > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Warnings: {integrityFlags.length}
                </span>
              )}
              <button
                onClick={async () => {
                  const confirmed = await showConfirm({
                    title: 'Submit Examination?',
                    message: `You have answered ${answeredCount} of ${examData?.questions.length || 0} questions.\n\nAre you sure you want to finish and submit your exam now?`,
                    type: 'confirm',
                    badge: 'Final Submission',
                    confirmText: 'Yes, Submit Exam',
                    cancelText: 'Continue Testing',
                  });
                  if (confirmed) handleSubmit(false);
                }}
                disabled={isSubmitting}
                className="bg-white text-primary hover:bg-slate-100 font-bold px-4 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

          {/* Full Screen Anti-Cheat Security Lockout is handled globally above */}

          {/* Left Primary Sidebar */}
          <div className="w-64 bg-card border-r border-border p-5 flex flex-col justify-between hidden lg:flex shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary shadow-2xs border border-primary/20">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base leading-tight text-foreground">Tarepet Montessori</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">CBT Exam Center</p>
                </div>
              </div>

              <nav className="space-y-1 text-sm font-semibold">
                <div className="px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold flex items-center gap-3 border border-primary/20 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>CBT Assessment</span>
                </div>
                <div className="px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition flex items-center gap-3 cursor-pointer">
                  <span>Questions Palette</span>
                </div>
                <div className="px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition flex items-center gap-3 cursor-pointer">
                  <span>Student Profile</span>
                </div>
              </nav>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-sm text-primary">
                  {user?.first_name?.[0] || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Student'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">Tarepet Montessori Student</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Work Area: Left Info Cards Column + Right Question Card Column */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-background">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column (Cards: Test, Timer, Question Palette) */}
              <div className="lg:col-span-4 space-y-4">

                {/* Card 1: Test Info */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-xs space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Examination</p>
                  <h3 className="font-serif font-bold text-base text-foreground">{selectedExam?.title || 'CBT Assessment'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedExam?.assessment_type === 'TEST' ? 'Continuous Assessment Test' : 'Terminal Examination'} • {selectedExam?.course_detail?.name || 'Subject Exam'}</p>
                </div>

                {/* Card 2: Timer Display */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-xs space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center justify-between">
                    <span>Time Remaining</span>
                    {timerWarning && <span className="text-red-500 font-extrabold animate-pulse">⏰ Time Ending Soon!</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-6 h-6 ${timerWarning ? 'text-red-500 animate-bounce' : 'text-primary'}`} />
                    <span className={`font-mono font-extrabold text-2xl tracking-wider ${timerWarning ? 'text-red-600' : 'text-foreground'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-1000 ${timerWarning ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${(timeLeft / ((examData?.duration_minutes || 1) * 60)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card 3: Question Palette Grid */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Questions Palette</p>
                    <span className="text-xs font-semibold text-muted-foreground">{answeredCount}/{examData.questions.length} Answered</span>
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
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : isAnswered
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : isCurrent
                                  ? 'bg-primary/15 text-primary ring-2 ring-primary font-extrabold'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {i + 1}
                          {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Answered</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Flagged</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30"></span> Pending</span>
                  </div>
                </div>

              </div>

              {/* Right Column (Question Card) */}
              <div className="lg:col-span-8">
                <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-xs space-y-6">

                  {/* Top Bar: Previous | Question X | Flag | Next */}
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    <div className="flex items-center gap-3">
                      <h3 className="font-serif font-bold text-lg text-foreground">
                        Question {currentPage + 1} <span className="text-muted-foreground font-normal text-sm">/ {examData.questions.length}</span>
                      </h3>
                      <button
                        onClick={() => toggleFlag(currentQ.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          flaggedQuestions[currentQ.id]
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        title="Flag for Review"
                      >
                        <Flag className="w-3.5 h-3.5" /> {flaggedQuestions[currentQ.id] ? 'Flagged' : 'Flag'}
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(examData.questions.length - 1, p + 1))}
                      disabled={currentPage >= examData.questions.length - 1}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="py-2">
                    <p className="text-foreground font-medium text-sm md:text-base leading-relaxed">
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
                              ? 'border-primary bg-primary/5 text-foreground shadow-2xs ring-1 ring-primary/20'
                              : 'border-border hover:border-primary/40 hover:bg-muted/30 text-foreground'
                          }`}
                        >
                          {/* Custom Radio Button Circle */}
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-primary bg-card' : 'border-muted-foreground/40 bg-card'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>

                          <span className="text-sm font-medium leading-normal flex-1">
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {answers[currentQ.id] ? (
                        <span className="text-primary font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Option {answers[currentQ.id]} selected
                        </span>
                      ) : (
                        <span>Please select an option to mark answer</span>
                      )}
                    </div>

                    <button
                      onClick={async () => {
                        if (currentPage < examData.questions.length - 1) {
                          setCurrentPage(p => p + 1);
                        } else {
                          const confirmed = await showConfirm({
                            title: 'Submit Examination?',
                            message: `You have answered ${answeredCount} of ${examData.questions.length} questions.\n\nAre you sure you want to finish and submit your exam now?`,
                            type: 'confirm',
                            badge: 'Final Submission',
                            confirmText: 'Yes, Submit Exam',
                            cancelText: 'Continue Testing',
                          });
                          if (confirmed) {
                            handleSubmit(false);
                          }
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
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

