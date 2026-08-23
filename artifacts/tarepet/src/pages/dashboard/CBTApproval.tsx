import { useState, useEffect } from 'react';
import { authClient } from '@/lib/api-auth';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Eye, ChevronLeft, Clock, BookOpen, 
  AlertTriangle, FileText, Shield
} from 'lucide-react';
import { Link } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { getStoredExams, updateExamStatus, subscribeToCBTStore } from '@/lib/cbt-store';

interface PendingExam {
  id: number;
  title: string;
  description: string;
  instructions: string;
  assessment_type: string;
  term: string;
  duration_minutes: number;
  questions_count: number;
  questions_per_page: number;
  course_detail: { name: string; code: string } | null;
  teacher_name: string;
  questions: any[];
  created_at: string;
  status: string;
}

type View = 'queue' | 'preview';

function getStatusStyle(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'APPROVED':
    case 'ACTIVE':
      return 'bg-green-100 text-green-700';
    case 'REJECTED':
      return 'bg-red-100 text-red-700';
    case 'DRAFT':
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getQuestionOptionText(q: any, opt: string): string {
  if (!q) return '';
  switch (opt) {
    case 'A': return q.option_a || '';
    case 'B': return q.option_b || '';
    case 'C': return q.option_c || '';
    case 'D': return q.option_d || '';
    default: return '';
  }
}

export default function AdminCBTApproval() {
  const { t } = useTranslation();
  const { showAlert } = useCustomDialog();
  const [view, setView] = useState<View>('queue');
  const [exams, setExams] = useState<PendingExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchExams = () => {
    const list = getStoredExams();
    const mapped = list.map(e => ({
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

  const pendingExams = exams.filter(e => e.status === 'PENDING');
  const otherExams = exams.filter(e => e.status !== 'PENDING');

  const handleApprove = async (examId: number) => {
    updateExamStatus(examId, 'APPROVED');
    showAlert({
      title: 'Exam Approved',
      message: 'Examination approved! The teacher can now click "Proceed / Activate Exam" in their portal to begin the test session.',
      type: 'success',
      badge: 'Admin Approved',
    });
    fetchExams();
    setView('queue');
    setSelectedExam(null);
  };

  const handleReject = async (examId: number) => {
    updateExamStatus(examId, 'REJECTED', rejectReason || 'Requires revision');
    setShowRejectModal(false);
    setRejectReason('');
    showAlert({
      title: 'Exam Returned for Revision',
      message: 'Examination rejected and returned to the form/subject teacher with your feedback notes.',
      type: 'warning',
      badge: 'Revision Requested',
    });
    fetchExams();
    setView('queue');
    setSelectedExam(null);
  };

  // ============ APPROVAL QUEUE ============
  if (view === 'queue') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/dashboard/admin">
              <button className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t('cbt.approval_hub', 'CBT Approval Hub')}</h1>
              <p className="text-slate-500 text-sm">{pendingExams.length} {t('cbt.exams_pending_approval', 'exam(s) pending your approval')}</p>
            </div>
          </div>

          {/* Pending Section */}
          {pendingExams.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {t('cbt.pending_approval', 'Pending Approval')}</h2>
              <div className="space-y-3">
                {pendingExams.map(exam => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border-l-4 border-amber-400 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">⏳ {t('cbt.pending', 'Pending')}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {exam.assessment_type === 'TEST' ? t('cbt.ca_test', 'C.A. Test') : t('cbt.final_exam', 'Final Exam')}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                        <p className="text-sm text-slate-500">{exam.course_detail?.name} • {exam.term.replace('_', ' ')} • {exam.duration_minutes} mins • {exam.questions_count} questions</p>
                        <p className="text-xs text-slate-400 mt-1">{t('cbt.submitted_by', 'Submitted by: ')}{exam.teacher_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedExam(exam); setView('preview'); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> {t('cbt.preview', 'Preview')}
                        </button>
                        <button
                          onClick={() => handleApprove(exam.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('cbt.approve', 'Approve')}
                        </button>
                        <button
                          onClick={() => { setSelectedExam(exam); setShowRejectModal(true); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> {t('cbt.reject', 'Reject')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {pendingExams.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-8">
              <Shield className="w-16 h-16 mx-auto text-green-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">{t('cbt.all_clear', 'All Clear!')}</h3>
              <p className="text-slate-400">{t('cbt.no_pending_exams', 'No pending exams requiring your approval.')}</p>
            </div>
          )}

          {/* All Exams Section */}
          {otherExams.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-3">{t('cbt.all_exams', 'All Exams')}</h2>
              <div className="space-y-2">
                {otherExams.map(exam => (
                  <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(exam.status)}`}>{exam.status}</span>
                        <span className="text-xs text-slate-400">{exam.assessment_type === 'TEST' ? t('cbt.ca_test', 'C.A. Test') : t('cbt.exam', 'Exam')}</span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm">{exam.title}</h4>
                      <p className="text-xs text-slate-400">{exam.course_detail?.name} • {exam.teacher_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedExam && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('cbt.reject_title', 'Reject: ')}{selectedExam.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{t('cbt.provide_feedback', 'Provide feedback for the teacher (optional):')}</p>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-400 outline-none mb-4"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition">{t('common.cancel', 'Cancel')}</button>
                  <button onClick={() => handleReject(selectedExam.id)} className="flex-1 h-11 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition">{t('cbt.reject_exam', 'Reject Exam')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ PREVIEW ============
  if (view === 'preview' && selectedExam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('queue')} className="p-2 rounded-lg bg-white shadow hover:bg-slate-50 transition"><ChevronLeft className="w-5 h-5" /></button>
              <h1 className="text-xl font-bold text-slate-900">{t('cbt.previewing', 'Previewing: ')}{selectedExam.title}</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(selectedExam.id)} className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {t('cbt.approve_publish', 'Approve & Publish')}
              </button>
              <button onClick={() => { setShowRejectModal(true); }} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm flex items-center gap-1">
                <XCircle className="w-4 h-4" /> {t('cbt.reject', 'Reject')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">{t('cbt.course', 'Course:')}</span> <strong>{selectedExam.course_detail?.name}</strong></div>
              <div><span className="text-slate-400">{t('cbt.type', 'Type:')}</span> <strong>{selectedExam.assessment_type === 'TEST' ? t('cbt.ca_test', 'C.A. Test') : t('cbt.final_exam', 'Final Exam')}</strong></div>
              <div><span className="text-slate-400">{t('cbt.term', 'Term:')}</span> <strong>{selectedExam.term.replace('_', ' ')}</strong></div>
              <div><span className="text-slate-400">{t('cbt.duration', 'Duration:')}</span> <strong>{selectedExam.duration_minutes} minutes</strong></div>
              <div><span className="text-slate-400">{t('cbt.questions_per_page', 'Questions/Page:')}</span> <strong>{selectedExam.questions_per_page}</strong></div>
              <div><span className="text-slate-400">{t('cbt.total_questions', 'Total Questions:')}</span> <strong>{selectedExam.questions_count}</strong></div>
            </div>
            {selectedExam.instructions && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">{t('cbt.instructions', 'Instructions:')}</p>
                <p className="text-sm text-amber-800">{selectedExam.instructions}</p>
              </div>
            )}
          </div>

          <h3 className="font-bold text-slate-700 mb-3">{t('cbt.questions_preview', 'Questions Preview')}</h3>
          <div className="space-y-3">
            {selectedExam.questions.map((q: any, i: number) => (
              <div key={q.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <p className="font-medium text-slate-800 text-sm mb-2"><span className="text-slate-400">Q{i + 1}.</span> {q.question_text} <span className="text-xs text-slate-300">({q.points} pt)</span></p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {['A', 'B', 'C', 'D'].map((opt: string) => (
                    <span key={opt} className={`px-2 py-1 rounded-lg ${q.correct_option === opt ? 'bg-green-100 text-green-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                      {opt}. {getQuestionOptionText(q, opt)} {q.correct_option === opt && '✓'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('cbt.reject_title', 'Reject: ')}{selectedExam.title}</h3>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-400 outline-none mb-4"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">{t('common.cancel', 'Cancel')}</button>
                  <button onClick={() => handleReject(selectedExam.id)} className="flex-1 h-11 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">{t('cbt.reject', 'Reject')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
