import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authClient } from '@/lib/api-auth';
import { motion } from 'framer-motion';
import { 
  Plus, Trash2, Send, BookOpen, Clock, ChevronLeft, CheckCircle2,
  FileText, AlertTriangle, Eye, Users, FlaskConical, Palette, ClipboardList, Rocket, Lightbulb, Lock, Edit3, Unlock
} from 'lucide-react';
import { Link } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { useCustomDialog } from '@/context/DialogContext';

interface ExamForm {
  title: string;
  description: string;
  instructions: string;
  class: string;
  stream: string;
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
  explanation?: string;
  image_url?: string;
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
  correct_option: 'A', points: 1, explanation: '', image_url: '',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'DRAFT': return STATUS_STYLES.DRAFT;
    case 'PENDING': return STATUS_STYLES.PENDING;
    case 'APPROVED': return STATUS_STYLES.APPROVED;
    case 'REJECTED': return STATUS_STYLES.REJECTED;
    default: return 'bg-slate-100 text-slate-600';
  }
};

import { getStoredExams, saveCBTExam, updateExamStatus, getStoredSubmissions, subscribeToCBTStore, SENIOR_COURSES, JUNIOR_COURSES, getCoursesForClass, setExamResultsReleased, deleteCBTExam, SCHOOL_CLASSES, isSeniorSecondaryClass, getStoredTeachers } from '@/lib/cbt-store';
import { addRealtimeNotification } from '@/lib/notifications-store';

const ALL_CLASS_CARDS = [
  {
    key: 'SS1',
    label: 'SS1 (Senior Secondary 1)',
    subtext: 'Science & Art Streams',
    hasStreams: true,
    color: 'bg-blue-50/50 border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-700',
    accent: 'text-blue-700',
  },
  {
    key: 'SS2',
    label: 'SS2 (Senior Secondary 2)',
    subtext: 'Science & Art Streams',
    hasStreams: true,
    color: 'bg-purple-50/50 border-purple-200 hover:border-purple-400',
    iconBg: 'bg-purple-100 text-purple-700',
    accent: 'text-purple-700',
  },
  {
    key: 'SS3',
    label: 'SS3 (Senior Secondary 3)',
    subtext: 'SSCE / WAEC & NECO Prep (Science & Art)',
    hasStreams: true,
    color: 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-700',
    accent: 'text-emerald-700',
  },
];

export default function CBTBuilder() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useCustomDialog();

  const isAuthorizedToUseCBT = useMemo(() => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const prof = (user.profile as any) || {};
    const formCls = prof.form_teacher_of || prof.formTeacherOf || '';
    if (formCls && isSeniorSecondaryClass(formCls)) return true;

    const subs = Array.isArray(prof.subjects_taught) ? prof.subjects_taught : [];
    for (const item of subs) {
      const classStr = typeof item === 'string' ? item : (item?.class || item?.grade || item?.name || '');
      if (isSeniorSecondaryClass(classStr)) return true;
    }

    const allTeachers = getStoredTeachers();
    const match = allTeachers.find((t: any) => t.email === user.email || t.staffId === prof.teacher_id);
    if (match) {
      if (match.formTeacherOf && isSeniorSecondaryClass(match.formTeacherOf)) return true;
      if (Array.isArray(match.subjectsAssigned)) {
        for (const item of match.subjectsAssigned) {
          const classStr = typeof item === 'string' ? item : (item?.class || item?.grade || item?.name || '');
          if (isSeniorSecondaryClass(classStr)) return true;
        }
      }
    }
    return false;
  }, [user]);

  if (!isAuthorizedToUseCBT) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-lg text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">{t("CBT Builder Restricted")}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {t("The Computer-Based Testing (CBT) Examination System is strictly enabled for")} <strong>{t("Senior Secondary Classes (SS1 Art & Sci to SS3 Art & Sci)")}</strong>.
            <br /><br />
            {t("Creche, Nursery, Primary, and Junior Secondary (JSS 1-3) assessments are conducted via paper-based continuous evaluations.")}
          </p>
          <Link href="/teacher-dashboard">
            <button className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition shadow-md">
              {t("Return to Teacher Dashboard")}
            </button>
          </Link>
        </div>
      </div>
    );
  }
  const [view, setView] = useState<View>('list');
  const [openClassDropdown, setOpenClassDropdown] = useState<string | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState<QuestionForm>({ ...EMPTY_QUESTION });
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [attemptDetail, setAttemptDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mobileStackedOpen, setMobileStackedOpen] = useState<boolean>(false);
  const [form, setForm] = useState<ExamForm>({
    title: '', description: '', instructions: '',
    class: 'SS1', stream: 'Science', course: 'MTH-101',
    assessment_type: 'TEST', term: '2ND_TERM', duration_minutes: 45, questions_per_page: 2,
  });

  const availableCourses = getCoursesForClass(form.class, form.stream);

  const handleStreamChange = (newStream: string) => {
    const streamCourses = getCoursesForClass(form.class, newStream);
    setForm(prev => ({
      ...prev,
      stream: newStream,
      course: streamCourses[0]?.code || '',
    }));
  };

  const fetchExams = () => {
    const list = getStoredExams();
    setExams(list as any);
  };

  useEffect(() => {
    fetchExams();
    const unsub = subscribeToCBTStore(fetchExams);
    return () => unsub();
  }, []);

  const handleCreateExam = async () => {
    if (!form.title) {
      showAlert({ title: 'Title Required', message: 'Please enter exam title', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const selectedCourse = SENIOR_COURSES.find(c => c.code === form.course) || availableCourses[0] || SENIOR_COURSES[0];
      const created = await saveCBTExam({
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        course_code: selectedCourse.code,
        course_name: `${form.class} ${selectedCourse.name}`,
        class: form.class,
        stream: form.stream,
        assessment_type: form.assessment_type as any,
        term: form.term === '1ST_TERM' ? 'Term 1' : form.term === '2ND_TERM' ? 'Term 2' : 'Term 3',
        duration_minutes: form.duration_minutes,
        questions_per_page: form.questions_per_page,
        teacher_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Mrs. Okafor Chioma' : 'Mrs. Okafor Chioma',
        status: 'DRAFT',
        questions: [],
      });
      setSelectedExamId(created.id);
      setQuestions([]);
      setView('questions');
      fetchExams();
    } catch (err: any) {
      showAlert({ title: 'Error', message: 'Failed to create exam', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = (examId: number | string) => {
    const list = getStoredExams();
    const ex = list.find(e => Number(e.id) === Number(examId) || String(e.id) === String(examId))
            || exams.find(e => Number(e.id) === Number(examId) || String(e.id) === String(examId));
    setQuestions(ex?.questions ? [...ex.questions] : []);
  };

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [isLockedPreview, setIsLockedPreview] = useState<boolean>(false);

  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  const handleAddQuestion = async () => {
    if (!selectedExamId) {
      showAlert({ title: 'No Exam Selected', message: 'Please select an exam first.', type: 'warning' });
      return;
    }

    if (!newQuestion.question_text || !newQuestion.question_text.trim()) {
      showAlert({ title: 'Question Text Required', message: 'Please enter the question text.', type: 'warning' });
      return;
    }

    if (!newQuestion.option_a || !newQuestion.option_a.trim() || !newQuestion.option_b || !newQuestion.option_b.trim()) {
      showAlert({ title: 'Options Required', message: 'Please provide at least Option A and Option B answer choices.', type: 'warning' });
      return;
    }

    const examsList = getStoredExams();
    let ex = examsList.find(e => Number(e.id) === Number(selectedExamId) || String(e.id) === String(selectedExamId))
          || exams.find(e => Number(e.id) === Number(selectedExamId) || String(e.id) === String(selectedExamId));

    if (!ex) {
      ex = {
        id: selectedExamId,
        title: form.title || 'Live Exam Paper',
        description: form.description || '',
        instructions: form.instructions || '',
        course_code: form.course || 'ENG-101',
        course_name: `${form.class} ${form.course}`,
        class: form.class || 'SS1',
        stream: form.stream || 'Science',
        assessment_type: (form.assessment_type as any) || 'TEST',
        term: form.term === '1ST_TERM' ? 'Term 1' : form.term === '2ND_TERM' ? 'Term 2' : 'Term 3',
        duration_minutes: form.duration_minutes || 45,
        questions_per_page: form.questions_per_page || 2,
        teacher_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Teacher' : 'Teacher',
        status: 'DRAFT',
        questions: [],
        created_at: new Date().toISOString(),
      };
    }

    // Preserve existing questions from React state or store
    const currentQList = (questions && questions.length > 0) ? [...questions] : (ex.questions ? [...ex.questions] : []);
    let updatedQuestions: any[] = [];

    if (editingQuestionId) {
      // Update existing question
      updatedQuestions = currentQList.map((q: any) => {
        if (Number(q.id) === Number(editingQuestionId) || String(q.id) === String(editingQuestionId)) {
          return {
            ...q,
            question_text: newQuestion.question_text.trim(),
            option_a: newQuestion.option_a.trim() || 'Option A',
            option_b: newQuestion.option_b.trim() || 'Option B',
            option_c: newQuestion.option_c.trim() || 'Option C',
            option_d: newQuestion.option_d.trim() || 'Option D',
            correct_option: newQuestion.correct_option || 'A',
            points: Number(newQuestion.points) || 1,
            explanation: newQuestion.explanation?.trim() || '',
            image_url: newQuestion.image_url?.trim() || '',
          };
        }
        return q;
      });
      setEditingQuestionId(null);
    } else {
      // Add new question to stack with unique ID
      const newQId = Date.now() + Math.floor(Math.random() * 100000);
      const newQ = {
        id: newQId,
        question_text: newQuestion.question_text.trim(),
        option_a: newQuestion.option_a.trim() || 'Option A',
        option_b: newQuestion.option_b.trim() || 'Option B',
        option_c: newQuestion.option_c.trim() || 'Option C',
        option_d: newQuestion.option_d.trim() || 'Option D',
        correct_option: newQuestion.correct_option || 'A',
        points: Number(newQuestion.points) || 1,
        explanation: newQuestion.explanation?.trim() || '',
        image_url: newQuestion.image_url?.trim() || '',
      };
      updatedQuestions = [...currentQList, newQ];
      setJustAddedId(newQId);
      setTimeout(() => setJustAddedId(null), 3000);
    }

    ex.questions = updatedQuestions;
    ex.questions_count = updatedQuestions.length;
    await saveCBTExam(ex);
    setQuestions([...updatedQuestions]);
    fetchExams();
    setNewQuestion({ ...EMPTY_QUESTION });
  };

  const handleEditQuestion = (q: any) => {
    if (isLockedPreview) {
      showAlert({
        title: 'Preview Mode Locked',
        message: 'Question editing is locked while the exam is submitted for Admin approval. Click "Enable Editing" first.',
        type: 'info',
        badge: 'Read-Only Preview'
      });
      return;
    }
    setEditingQuestionId(q.id);
    setNewQuestion({
      question_text: q.question_text || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_option: q.correct_option || 'A',
      points: q.points || 1,
      explanation: q.explanation || '',
      image_url: q.image_url || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setNewQuestion({ ...EMPTY_QUESTION });
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!selectedExamId) return;
    if (isLockedPreview) {
      showAlert({
        title: 'Preview Mode Locked',
        message: 'Question deleting is locked while the exam is submitted for Admin approval. Click "Enable Editing" first.',
        type: 'info',
        badge: 'Read-Only Preview'
      });
      return;
    }
    const examsList = getStoredExams();
    let ex = examsList.find(e => Number(e.id) === Number(selectedExamId) || String(e.id) === String(selectedExamId))
            || exams.find(e => Number(e.id) === Number(selectedExamId) || String(e.id) === String(selectedExamId));
    if (!ex) return;

    const currentQList = (questions && questions.length > 0) ? [...questions] : (ex.questions ? [...ex.questions] : []);
    const updated = currentQList.filter((q: any) => Number(q.id) !== Number(qId) && String(q.id) !== String(qId));
    ex.questions = updated;
    ex.questions_count = updated.length;
    await saveCBTExam(ex);
    setQuestions([...updated]);
    fetchExams();
    if (editingQuestionId === qId) {
      handleCancelEdit();
    }
  };

  const handleBulkCSVImport = () => {
    if (!bulkCsvText.trim() || !selectedExamId) return;
    const examsList = getStoredExams();
    const ex = examsList.find(e => Number(e.id) === Number(selectedExamId) || String(e.id) === String(selectedExamId))
            || exams.find(e => Number(e.id) === Number(selectedExamId) || String(e.id) === String(selectedExamId));
    if (!ex) return;

    const lines = bulkCsvText.split('\n').filter(l => l.trim());
    let addedCount = 0;
    lines.forEach((line, idx) => {
      if (idx === 0 && (line.toLowerCase().includes('question') || line.toLowerCase().includes('option'))) return;
      const cols = line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
      if (cols.length >= 6) {
        const qObj = {
          id: Date.now() + idx + Math.floor(Math.random() * 1000),
          question_text: cols[0],
          option_a: cols[1],
          option_b: cols[2],
          option_c: cols[3],
          option_d: cols[4],
          correct_option: (cols[5] || 'A').toUpperCase(),
          points: parseFloat(cols[6]) || 1,
          explanation: cols[7] || '',
          image_url: cols[8] || '',
        };
        ex.questions.push(qObj);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      ex.questions_count = ex.questions.length;
      saveCBTExam(ex);
      fetchQuestions(selectedExamId);
      setBulkCsvText('');
      setShowBulkModal(false);
      showAlert({ title: 'Success', message: `Successfully imported ${addedCount} questions into exam!`, type: 'success' });
    } else {
      showAlert({ title: 'Error', message: 'Could not parse questions. Expected format: question_text, option_a, option_b, option_c, option_d, correct_option, points, explanation, image_url', type: 'error' });
    }
  };

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED'>('ALL');

  const handleSubmitForApproval = async () => {
    if (!selectedExamId) return;
    const ex = getStoredExams().find(e => e.id === selectedExamId);
    if (!ex) return;

    if (!ex.questions || ex.questions.length === 0) {
      showAlert({
        title: 'No Questions Added',
        message: 'Please add at least 1 question before submitting this exam for Admin approval.',
        type: 'warning',
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Submit Exam for Admin Approval?',
      message: `Are you ready to submit "${ex.title}" with ${ex.questions.length} stacked question(s) to the School Admin?\n\nOnce submitted, the Admin will review and approve the assessment for student portal access.`,
      type: 'confirm',
      badge: 'Admin Review',
      confirmText: 'Yes, Submit for Approval',
      cancelText: 'Keep Editing',
    });
    if (!confirmed) return;

    await updateExamStatus(selectedExamId, 'PENDING');
    showAlert({
      title: 'Submitted for Admin Approval',
      message: `Exam "${ex.title}" has been submitted to the School Admin. You will be notified once it is approved.`,
      type: 'success',
      badge: 'Pending Review',
    });
    fetchExams();
    setView('list');
  };

  const handleActivateProceed = (examId: number) => {
    updateExamStatus(examId, 'ACTIVE');
    showAlert({ title: 'Success', message: 'Exam has been activated and proceeded! Students can now see and start this exam in their portal.', type: 'success' });
    fetchExams();
  };

  const fetchAttempts = (examId: number) => {
    const subs = getStoredSubmissions().filter(s => s.exam_id === examId);
    const mapped: StudentAttempt[] = subs.map(s => ({
      id: s.id,
      student_name: s.student_name,
      score: s.score,
      total_possible: s.total_possible,
      percentage: s.percentage,
      auto_submitted: false,
      submitted_at: s.submitted_at,
      gradebook_synced: s.gradebook_synced,
    }));
    setAttempts(mapped);
  };

  const fetchAttemptDetail = (examId: number, attemptId: number) => {
    const sub = getStoredSubmissions().find(s => s.id === attemptId);
    const ex = getStoredExams().find(e => e.id === examId);
    if (sub && ex) {
      setAttemptDetail({
        ...sub,
        questions: ex.questions,
      });
    }
  };

  const handleSyncGradebook = async (attemptId: number) => {
    showAlert({ title: 'Success', message: 'Score synced to gradebook!', type: 'success' });
    if (selectedExamId) fetchAttempts(selectedExamId);
  };

  const handlePublishExam = async (examId: number) => {
    handleActivateProceed(examId);
  };

  const handleDeleteExam = async (examId: number, examTitle: string) => {
    const confirmed = await showConfirm({
      title: 'Delete CBT Examination?',
      message: `Are you sure you want to delete "${examTitle}"?\n\nThis will permanently remove this exam, its questions, and student submission records.`,
      type: 'confirm',
      badge: 'Delete Exam',
      confirmText: 'Yes, Delete Exam',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    deleteCBTExam(examId);
    fetchExams();
    showAlert({
      title: 'Exam Deleted',
      message: `"${examTitle}" has been successfully deleted.`,
      type: 'success',
      badge: 'CBT Exam Deleted',
    });
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition shadow-2xs";
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

  // ============ EXAM LIST ============
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/teacher">
                <button className="p-2 rounded-xl bg-card border border-border shadow-xs hover:bg-muted transition text-foreground"><ChevronLeft className="w-5 h-5" /></button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("CBT Exam Builder")}</h1>
                <p className="text-muted-foreground text-sm">{t("Select target class & department to set exams or tests for students")}</p>
              </div>
            </div>
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-md"
            >
              <Plus className="w-4 h-4" /> {t("New Exam")}
            </button>
          </div>

          {/* Class Selection Cards with Dropdowns */}
          <div className="mb-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {t("Select Target Class & Department Stream")}
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                {t("Click a class card below to drop down Science or Art stream options to configure tests or exams.")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {ALL_CLASS_CARDS.map(cls => {
                const sciExams = exams.filter(e => e.class === cls.key && (e.stream === 'Science' || e.stream === 'STEM'));
                const artExams = exams.filter(e => e.class === cls.key && (e.stream === 'Arts' || e.stream === 'Art' || e.stream === 'Humanities'));
                const genExams = exams.filter(e => e.class === cls.key);
                const totalCount = cls.hasStreams ? (sciExams.length + artExams.length) : genExams.length;

                return (
                  <div key={cls.key} className="relative">
                    <button
                      onClick={() => {
                        if (!cls.hasStreams) {
                          const juniorCourses = getCoursesForClass(cls.key);
                          setForm(prev => ({
                            ...prev,
                            class: cls.key,
                            stream: 'General',
                            course: juniorCourses[0]?.code || 'MTH-001',
                            title: `${cls.key} Continuous Assessment`,
                          }));
                          setOpenClassDropdown(null);
                          setView('create');
                        } else {
                          setOpenClassDropdown(prev => prev === cls.key ? null : cls.key);
                        }
                      }}
                      className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer ${cls.color} ${openClassDropdown === cls.key ? 'ring-2 ring-emerald-400' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                          {totalCount} Tests / Exams
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl text-slate-900 mb-1">{cls.label}</h3>
                      {cls.hasStreams ? (
                        <div className="flex gap-4 text-xs mt-2">
                          <span className="text-slate-500">{t("Science:")} <strong className={cls.accent}>{sciExams.length}</strong></span>
                          <span className="text-slate-500">{t("Art:")} <strong className={cls.accent}>{artExams.length}</strong></span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2 font-medium">{t("General Curriculum")}</p>
                      )}
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                        <span>{cls.hasStreams ? t("Select Stream") : t("Configure Exam")}</span>
                        {cls.hasStreams ? (
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Stream dropdown menu for SS classes */}
                    {cls.hasStreams && openClassDropdown === cls.key && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 py-2">
                        <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t("Choose Stream")}</p>
                        <button
                          onClick={() => {
                            const streamCourses = SENIOR_COURSES.filter(c => c.stream === 'Science');
                            setForm(prev => ({
                              ...prev,
                              class: cls.key,
                              stream: 'Science',
                              course: streamCourses[0]?.code || 'MTH-101',
                              title: `${cls.key} Science Assessment`,
                            }));
                            setOpenClassDropdown(null);
                            setView('create');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left cursor-pointer"
                        >
                          <span className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <FlaskConical className="w-4 h-4" />
                          </span>
                          Science Stream
                          <span className="ml-auto text-xs text-slate-400">{sciExams.length} available</span>
                        </button>

                        <button
                          onClick={() => {
                            const streamCourses = SENIOR_COURSES.filter(c => c.stream === 'Arts' || c.stream === 'Art');
                            setForm(prev => ({
                              ...prev,
                              class: cls.key,
                              stream: 'Arts',
                              course: streamCourses[0]?.code || 'ENG-101',
                              title: `${cls.key} Art Assessment`,
                            }));
                            setOpenClassDropdown(null);
                            setView('create');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left cursor-pointer"
                        >
                          <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                            <Palette className="w-4 h-4" />
                          </span>
                          Art Stream
                          <span className="ml-auto text-xs text-slate-400">{artExams.length} available</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Existing Exams Section Header with Filter Tabs */}
          <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("Configured CBT Exams")} ({exams.length})</h2>
                <p className="text-slate-500 text-xs">{t("Manage draft exams, view exams sent for approval, or launch approved tests.")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'ALL', label: `All Exams (${exams.length})` },
                  { key: 'DRAFT', label: `Drafts (${exams.filter(e => e.status === 'DRAFT').length})` },
                  { key: 'PENDING', label: `🕒 Sent for Approval (${exams.filter(e => e.status === 'PENDING').length})` },
                  { key: 'APPROVED', label: `✓ Approved & Active (${exams.filter(e => e.status === 'APPROVED' || e.status === 'ACTIVE' || e.status === 'PUBLISHED').length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === tab.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(() => {
            const filteredExams = exams.filter(e => {
              if (statusFilter === 'DRAFT') return e.status === 'DRAFT';
              if (statusFilter === 'PENDING') return e.status === 'PENDING';
              if (statusFilter === 'APPROVED') return e.status === 'APPROVED' || e.status === 'ACTIVE' || e.status === 'PUBLISHED';
              return true;
            });

            if (filteredExams.length === 0) {
              return (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">{t("No Exams Found")}</h3>
                  <p className="text-slate-400 mb-4">
                    {statusFilter === 'PENDING'
                      ? t("No exams are currently pending admin approval.")
                      : t("No exams found for the selected filter tab.")}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredExams.map(exam => (
                  <div key={exam.id} className={`bg-white rounded-2xl shadow-lg border p-5 transition-all ${exam.status === 'PENDING' ? 'border-amber-300 bg-amber-50/30' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {exam.status === 'PENDING' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> 🕒 Sent for Approval — Pending Admin Review
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusBadgeStyle(exam.status)}`}>
                              {exam.status === 'APPROVED' ? t("Approved by Admin") : exam.status === 'PUBLISHED' ? <><Rocket className="w-3 h-3 text-purple-600" /> {t("Live for Students")}</> : exam.status}
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {exam.class || 'SS1'} {exam.stream || 'Science'} • {exam.assessment_type === 'TEST' ? t("C.A. Test") : t("Final Exam")}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                        <p className="text-sm text-slate-500">{exam.course_name || exam.course_code} • {exam.duration_minutes} mins • {exam.questions_count || (exam.questions ? exam.questions.length : 0)} questions</p>
                        {exam.status === 'PENDING' && (
                          <p className="text-xs text-amber-800 mt-2 font-medium bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
                            ℹ️ Exam has been submitted to the School Admin for approval. You will receive a notification once approved.
                          </p>
                        )}
                        {exam.rejection_reason && (
                          <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t("Rejection Note:")} {exam.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        {(exam.status === 'DRAFT' || exam.status === 'REJECTED') && (
                          <button
                            onClick={() => { setSelectedExamId(exam.id); fetchQuestions(exam.id); setIsLockedPreview(false); setView('questions'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                          >
                            {t("Edit Questions")}
                          </button>
                        )}
                        {exam.status === 'PENDING' && (
                          <button
                            onClick={() => { setSelectedExamId(exam.id); fetchQuestions(exam.id); setIsLockedPreview(true); setView('questions'); }}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview Exam Questions (Locked)
                          </button>
                        )}
                        {exam.status === 'APPROVED' && (
                          <button
                            onClick={() => handleActivateProceed(exam.id)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-md ring-2 ring-emerald-400/50 animate-pulse"
                          >
                            <Send className="w-3.5 h-3.5" /> Launch / Activate Exam
                          </button>
                        )}
                        {(exam.status === 'APPROVED' || exam.status === 'ACTIVE' || exam.status === 'PUBLISHED') && (
                          <>
                            <button
                              onClick={() => { setSelectedExamId(exam.id); fetchAttempts(exam.id); setView('attempts'); }}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-1"
                            >
                              <Users className="w-3.5 h-3.5" /> View Submitted Exams
                            </button>
                            <button
                              onClick={() => {
                                const examObj = getStoredExams().find(e => e.id === exam.id);
                                const nextState = !examObj?.results_released;
                                setExamResultsReleased(exam.id, nextState);
                                showAlert({
                                  title: nextState ? 'Results Released' : 'Results Withheld',
                                  message: nextState ? `Examination results for "${exam.title}" are now visible to students in their portal!` : `Examination results for "${exam.title}" are now withheld from student view.`,
                                  type: nextState ? 'success' : 'info',
                                  badge: 'CBT Results',
                                });
                                fetchExams();
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                (exam as any).results_released
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                              }`}
                            >
                              {(exam as any).results_released ? '✓ Results Released' : <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Release Results</span>}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-200 flex items-center gap-1 shadow-2xs cursor-pointer"
                          title={t("Delete Exam")}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {t("Delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ============ CREATE EXAM ============
  if (view === 'create') {
    const inputClass = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
    const labelClass = 'text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1.5';

    return (
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setView('list')} className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5 text-slate-700" /></button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">{t("Create New CBT Exam")}</h1>
              <p className="text-xs text-slate-500">{t("Configure exam parameters and target student grade level.")}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 md:p-8 space-y-5">
            <div>
              <label className={labelClass}>{t("Exam Title")} <span className="text-rose-500">*</span></label>
              <input
                className={inputClass}
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. SS1 Science Mathematics Mid-Term Test"
              />
            </div>

            {/* Target Class & Stream / Department Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("Target Class")}</label>
                <select
                  className={inputClass}
                  value={form.class}
                  onChange={e => {
                    const newClass = e.target.value;
                    const courses = getCoursesForClass(newClass, form.stream || 'Science');
                    setForm({
                      ...form,
                      class: newClass,
                      course: courses[0]?.code || '',
                    });
                  }}
                >
                  {SCHOOL_CLASSES.filter(cls => isSeniorSecondaryClass(cls.id) || isSeniorSecondaryClass(cls.label)).map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>{t("Department / Stream")}</label>
                <select
                  className={inputClass}
                  value={form.stream}
                  onChange={e => handleStreamChange(e.target.value)}
                >
                  <option value="Science">{t("Science Department")}</option>
                  <option value="Arts">{t("Art Department")}</option>
                  <option value="Commercial">{t("Commercial Department")}</option>
                </select>
              </div>
            </div>

            {/* Course & Assessment Type Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("Subject / Course")}</label>
                <select
                  className={inputClass}
                  value={form.course}
                  onChange={e => setForm({...form, course: e.target.value})}
                >
                  {availableCourses.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>{t("Assessment Type")}</label>
                <select
                  className={inputClass}
                  value={form.assessment_type}
                  onChange={e => setForm({...form, assessment_type: e.target.value})}
                >
                  <option value="TEST">{t("Continuous Assessment Test")}</option>
                  <option value="EXAM">{t("Term Final Examination")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t("Term")}</label>
                <select className={inputClass} value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
                  <option value="1ST_TERM">{t("1st Term")}</option>
                  <option value="2ND_TERM">{t("2nd Term")}</option>
                  <option value="3RD_TERM">{t("3rd Term")}</option>
                </select>
              </div>
              <div><label className={labelClass}>{t("Duration (mins)")}</label><input type="number" className={inputClass} value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value) || 30})} min={5} max={180} /></div>
              <div><label className={labelClass}>{t("Questions/Page")}</label><input type="number" className={inputClass} value={form.questions_per_page} onChange={e => setForm({...form, questions_per_page: parseInt(e.target.value) || 1})} min={1} max={10} /></div>
            </div>
            <div><label className={labelClass}>{t("Instructions (optional)")}</label><textarea className={inputClass} rows={3} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="Instructions for students before starting..." /></div>
            <div><label className={labelClass}>{t("Description (optional)")}</label><textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <button
              onClick={handleCreateExam}
              disabled={!form.title || !form.course || loading}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
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
    const currentExam = exams.find(e => e.id === selectedExamId) || getStoredExams().find(e => e.id === selectedExamId);
    const totalExamPoints = questions.reduce((sum: number, q: any) => sum + (parseFloat(q.points) || 1), 0);

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        {/* Mobile floating eye icon with badge */}
        <div className="lg:hidden fixed bottom-6 right-5 z-40">
          <button
            type="button"
            onClick={() => setMobileStackedOpen((v: boolean) => !v)}
            className="relative w-14 h-14 rounded-full bg-foreground text-background shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            title="Preview Stacked Questions"
          >
            <Eye className="w-6 h-6" />
            {questions.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-extrabold border-2 border-background shadow-md">
                {questions.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile stacked questions drawer/modal */}
        {mobileStackedOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm" onClick={() => setMobileStackedOpen(false)}>
            <div className="mt-auto bg-card rounded-t-3xl border-t border-border shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Stacked Questions ({questions.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">Exam paper preview — add more below</p>
                </div>
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-xl border border-primary/20">
                  {totalExamPoints} Pts
                </span>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {questions.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/10 space-y-2">
                    <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No questions stacked yet</p>
                    <p className="text-xs text-muted-foreground">Add your first question below to start building the exam.</p>
                  </div>
                ) : (
                  questions.map((q: any, i: number) => (
                    <div key={q.id || i} className={`rounded-xl border p-3 transition-all ${
                      editingQuestionId === q.id ? 'border-primary bg-primary/5' :
                      justAddedId === q.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-card'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-snug mb-1.5">{q.question_text}</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            {['A','B','C','D'].map(opt => (
                              <span key={opt} className={`px-2 py-1 rounded-lg border truncate ${
                                q.correct_option === opt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-bold' : 'bg-muted/30 border-border text-muted-foreground'
                              }`}><strong>{opt}.</strong> {opt==='A'?q.option_a:opt==='B'?q.option_b:opt==='C'?q.option_c:q.option_d}{q.correct_option===opt&&' ✓'}</span>
                            ))}
                          </div>
                        </div>
                        <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-border">
                <button type="button" onClick={() => setMobileStackedOpen(false)} className="w-full py-2.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-muted transition">Close Preview</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Top Bar with Navigation & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="p-2 rounded-xl bg-muted border border-border shadow-2xs hover:bg-muted/80 transition text-foreground cursor-pointer"
                title="Back to Exam List"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg md:text-xl font-serif font-bold text-foreground truncate max-w-sm">
                    {currentExam?.title || t("Author Exam Questions")}
                  </h1>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase font-mono">
                    {currentExam?.status || 'DRAFT'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentExam?.class} {currentExam?.stream} · {currentExam?.course_name} · {currentExam?.duration_minutes} Mins · <strong className="text-primary">{questions.length} Question(s) Stacked</strong> ({totalExamPoints} pts)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted text-foreground font-bold border border-border hover:bg-muted/80 transition text-xs cursor-pointer"
                title="Bulk CSV Import"
              >
                📥 Bulk CSV
              </button>
              
              {questions.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary font-bold border border-primary/20 hover:bg-primary/20 transition text-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview Paper
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitForApproval}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-md text-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit to Admin
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Preview Exam Paper Modal */}
          {showPreviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="bg-card rounded-2xl max-w-2xl w-full border border-border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between bg-primary/5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Student CBT Exam Paper Preview</span>
                    <h3 className="font-serif font-bold text-lg text-foreground">{currentExam?.title || 'Exam Preview'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {currentExam?.class} {currentExam?.stream} · {currentExam?.course_name} · {questions.length} Questions ({totalExamPoints} pts) · {currentExam?.duration_minutes} Mins
                    </p>
                  </div>
                  <button onClick={() => setShowPreviewModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted font-bold">✕</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {currentExam?.instructions && (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground italic">
                      <strong>Instructions:</strong> {currentExam.instructions}
                    </div>
                  )}

                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No questions stacked in this draft paper yet.
                    </div>
                  ) : (
                    questions.map((q: any, idx: number) => (
                      <div key={q.id || idx} className="bg-muted/20 rounded-xl border border-border p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-foreground text-sm flex items-start gap-2">
                            <span className="text-primary font-mono">Q{idx + 1}.</span> {q.question_text}
                          </p>
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 shrink-0 font-mono">
                            {q.points || 1} pt
                          </span>
                        </div>
                        {q.image_url && (
                          <img src={q.image_url} alt={`Question ${idx + 1}`} className="max-h-48 rounded-lg border border-border object-contain my-2" />
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} className={`p-2 rounded-lg border ${q.correct_option === opt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold' : 'border-border bg-card text-foreground'}`}>
                              <span className="font-bold mr-1.5">{opt}.</span> {opt === 'A' ? q.option_a : opt === 'B' ? q.option_b : opt === 'C' ? q.option_c : q.option_d}
                              {q.correct_option === opt && ' ✓ (Key)'}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-[11px] text-muted-foreground pt-1 bg-muted/30 p-2 rounded-lg">
                            <strong className="text-foreground">Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Back to Editing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreviewModal(false);
                      handleSubmitForApproval();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit for Admin Approval
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk CSV Modal */}
          {showBulkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="bg-card rounded-2xl p-6 max-w-xl w-full border border-border shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    📥 {t("Bulk Import Questions via CSV")}
                  </h3>
                  <button onClick={() => setShowBulkModal(false)} className="text-muted-foreground hover:text-foreground font-bold">✕</button>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium">{t("Paste CSV content below (one line per question):")}</p>
                  <p className="bg-muted/50 p-2.5 rounded-lg border border-border font-mono text-[10px] text-muted-foreground">
                    {t("question_text, option_a, option_b, option_c, option_d, correct_option, points, explanation, image_url")}
                  </p>
                  <textarea
                    rows={8}
                    className="w-full border border-input rounded-xl p-3 text-xs font-mono bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                    value={bulkCsvText}
                    onChange={e => setBulkCsvText(e.target.value)}
                    placeholder={t("What is 2 + 2?, 3, 4, 5, 6, B, 1, Basic addition, https://...\nWhat is H2O?, Hydrogen, Oxygen, Water, Carbon, C, 1, Water molecule, ")}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted">{t("Cancel")}</button>
                  <button type="button" onClick={handleBulkCSVImport} disabled={!bulkCsvText.trim()} className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer">
                    {t("Parse & Import Questions")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── DESKTOP SIDE-BY-SIDE LAYOUT: LHS = Form, RHS = Stacked Questions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* ── LHS: QUESTION AUTHORING / INPUT FORM OR LOCKED PREVIEW CARD ── */}
          {isLockedPreview ? (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 dark:text-amber-200 text-base">
                    Read-Only Exam Preview Mode
                  </h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    This examination has been submitted for Admin approval. Question editing is currently locked to preserve submitted exam integrity.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-card p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Sent for Admin Approval
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Class & Stream:</span>
                  <span className="font-bold text-foreground">{currentExam?.class} {currentExam?.stream}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-bold text-foreground">{currentExam?.course_name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Stacked Questions:</span>
                  <span className="font-bold text-primary">{questions.length} Questions ({totalExamPoints} pts)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await showConfirm({
                      title: 'Unlock & Enable Question Editing?',
                      message: `Editing this examination will withdraw its current approval submission and return it to Draft status so you can modify questions.\n\nOnce finished, you can re-submit the updated paper to the Admin.`,
                      type: 'confirm',
                      badge: 'Enable Question Editing',
                      confirmText: 'Yes, Enable Editing',
                      cancelText: 'Keep in Read-Only Preview',
                    });
                    if (confirmed) {
                      setIsLockedPreview(false);
                      if (currentExam) {
                        currentExam.status = 'DRAFT';
                        await saveCBTExam(currentExam);
                        fetchExams();
                      }
                      showAlert({
                        title: 'Editing Unlocked',
                        message: 'Question editing is now enabled! You can now add, edit, or remove questions.',
                        type: 'success',
                        badge: 'CBT Authoring'
                      });
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Enable Editing / Unlock Questions
                </button>
                <p className="text-[11px] text-center text-muted-foreground">
                  Clicking "Enable Editing" unlocks authoring and allows you to make changes before resubmitting.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm p-6 border-2 border-primary/20 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground text-sm md:text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  {editingQuestionId ? `Edit Question` : `Add Question #${questions.length + 1}`}
                </h3>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg border border-border hover:bg-muted"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelClass}>{t("Question Text")} <span className="text-rose-500">*</span></label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={newQuestion.question_text}
                    onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    placeholder="e.g. Solve for x in the equation: 3x + 9 = 24"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t("Option A")} <span className="text-rose-500">*</span></label>
                    <input
                      className={inputClass}
                      value={newQuestion.option_a}
                      onChange={e => setNewQuestion({...newQuestion, option_a: e.target.value})}
                      placeholder="Option A answer text"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("Option B")} <span className="text-rose-500">*</span></label>
                    <input
                      className={inputClass}
                      value={newQuestion.option_b}
                      onChange={e => setNewQuestion({...newQuestion, option_b: e.target.value})}
                      placeholder="Option B answer text"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("Option C")}</label>
                    <input
                      className={inputClass}
                      value={newQuestion.option_c}
                      onChange={e => setNewQuestion({...newQuestion, option_c: e.target.value})}
                      placeholder="Option C answer text"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("Option D")}</label>
                    <input
                      className={inputClass}
                      value={newQuestion.option_d}
                      onChange={e => setNewQuestion({...newQuestion, option_d: e.target.value})}
                      placeholder="Option D answer text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t("Correct Answer Key")} <span className="text-rose-500">*</span></label>
                    <select
                      className={inputClass}
                      value={newQuestion.correct_option}
                      onChange={e => setNewQuestion({...newQuestion, correct_option: e.target.value})}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t("Points / Weight")}</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={newQuestion.points}
                      onChange={e => setNewQuestion({...newQuestion, points: parseFloat(e.target.value) || 1})}
                      min={0.5}
                      step={0.5}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{t("Answer Explanation / Solution (Optional)")}</label>
                  <input
                    className={inputClass}
                    value={newQuestion.explanation || ''}
                    onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="e.g. 3x = 24 - 9 => 3x = 15 => x = 5"
                  />
                </div>

                <div>
                  <label className={labelClass}>{t("Question Image Attachment URL (Optional)")}</label>
                  <input
                    type="url"
                    className={inputClass}
                    value={newQuestion.image_url || ''}
                    onChange={e => setNewQuestion({...newQuestion, image_url: e.target.value})}
                    placeholder="https://example.com/geometry-diagram.png"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {editingQuestionId ? 'Save Question Changes' : `Add Question #${questions.length + 1} to Stack`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RHS: LIVE STACKED QUESTIONS PANEL (desktop only — mobile uses floating button) ── */}
          <div className="hidden lg:block sticky top-6">
            <div className="bg-card rounded-2xl border border-border shadow-xs p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Stacked Exam Questions ({questions.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Questions appear here as you add them. Edit or delete inline.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-xl border border-primary/20 shrink-0">
                  {totalExamPoints} Pts
                </span>
              </div>

            {questions.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/10 space-y-2">
                <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-semibold text-foreground">No questions stacked yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Use the question authoring form below to add your first multiple-choice question. Each added question will stack here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {questions.map((q: any, i: number) => {
                  const isJustAdded = justAddedId === q.id;
                  const isBeingEdited = editingQuestionId === q.id;

                  return (
                    <div
                      key={q.id || i}
                      className={`rounded-xl border p-4 transition-all ${
                        isBeingEdited
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : isJustAdded
                          ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30'
                          : 'border-border bg-card hover:border-primary/30 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground text-sm leading-snug">
                              {q.question_text}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                {q.points || 1} pt
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEditQuestion(q)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                  isBeingEdited
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-primary bg-primary/10 hover:bg-primary/20'
                                }`}
                                title="Edit Question"
                              >
                                {isBeingEdited ? 'Editing...' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </button>
                            </div>
                          </div>

                          {q.image_url && (
                            <img src={q.image_url} alt={`Question ${i + 1}`} className="max-h-36 rounded-lg border border-border object-contain my-1" />
                          )}

                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {['A', 'B', 'C', 'D'].map(opt => {
                              const isCorrect = q.correct_option === opt;
                              const val = opt === 'A' ? q.option_a : opt === 'B' ? q.option_b : opt === 'C' ? q.option_c : q.option_d;
                              return (
                                <span
                                  key={opt}
                                  className={`px-2.5 py-1.5 rounded-lg border text-xs truncate ${
                                    isCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold'
                                      : 'bg-muted/30 border-border text-muted-foreground'
                                  }`}
                                >
                                  <strong>{opt}.</strong> {val || `[Option ${opt}]`} {isCorrect && ' ✓'}
                                </span>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-primary bg-primary/5 p-2 rounded-lg border border-primary/15 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span><strong>Rationale:</strong> {q.explanation}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* close the lg:grid container */}
          </div>



          {/* ── SECTION 3: BOTTOM SUBMISSION BAR ── */}
          {questions.length > 0 && (
            <div className="bg-card rounded-2xl p-5 border border-border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-serif font-bold text-sm text-foreground">
                  Ready to Submit {questions.length} Stacked Questions?
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitting will send this assessment to the School Administrator for review & activation.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-xs transition"
                >
                  Save Draft & Exit
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Submit for Admin Approval
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ============ VIEW STUDENT ATTEMPTS ============
  if (view === 'attempts' && selectedExamId) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setView('list')} className="p-2 rounded-xl bg-card border border-border shadow-xs hover:bg-muted transition text-foreground"><ChevronLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("Student Results")}</h1>
              <p className="text-muted-foreground text-sm">{attempts.length} submission(s)</p>
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">{t("No Submissions Yet")}</h3>
              <p className="text-muted-foreground">{t("Students haven't taken this exam yet.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map(a => (
                <div key={a.id} className="bg-card rounded-2xl shadow-sm border border-border p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">{a.student_name}</h4>
                    <p className="text-sm text-muted-foreground">{t("Score:")} {a.score}/{a.total_possible} ({a.percentage}%) {a.auto_submitted && '⏱ Auto-submitted'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { fetchAttemptDetail(selectedExamId, a.id); setView('attempt-detail'); }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                    {!a.gradebook_synced && (
                      <button
                        onClick={() => handleSyncGradebook(a.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sync to Gradebook
                      </button>
                    )}
                    {a.gradebook_synced && (
                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-muted text-muted-foreground">✓ Synced</span>
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
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('attempts')} className="p-2 rounded-xl bg-card border border-border shadow-xs hover:bg-muted transition text-foreground"><ChevronLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{attempt.student_name}'s Submission</h1>
              <p className="text-muted-foreground text-sm">{t("Score:")} {attempt.score}/{attempt.total_possible} ({attempt.percentage}%)</p>
            </div>
          </div>
          <div className="space-y-3">
            {answersList.map((a: any) => (
              <div key={a.question_order} className={`bg-card rounded-xl p-4 border-l-4 shadow-sm border border-border ${a.is_correct ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                <p className="font-medium text-foreground text-sm mb-2"><span className="text-muted-foreground mr-1">Q{a.question_order}.</span> {a.question_text}</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {['A', 'B', 'C', 'D'].map((opt: string) => {
                    const isCorrect = a.correct_option === opt;
                    const isSelected = a.selected_option === opt;
                    return (
                      <span key={opt} className={`px-2 py-1 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-800 font-bold' : isSelected && !isCorrect ? 'bg-red-100 text-red-600 line-through' : 'bg-muted text-muted-foreground'}`}>
                        {opt}. {opt === 'A' ? a.option_a : opt === 'B' ? a.option_b : opt === 'C' ? a.option_c : a.option_d} {isCorrect && '✓'} {isSelected && !isCorrect && '✗'}
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
