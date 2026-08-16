import React from 'react';
import { Download, X, Award, ShieldCheck, CheckCircle2, Calendar, User, BookOpen, GraduationCap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface SubjectScore {
  code: string;
  title: string;
  ca_score: number;
  cbt_exam_score: number;
  total_score: number;
  grade_letter: string;
  teacher_remark: string;
}

export interface ReportCardData {
  student_info: {
    id: number | string;
    student_id_code: string;
    name: string;
    grade_level: string;
    house: string;
    admission_date?: string;
  };
  academic_term: {
    term: string;
    year: string;
    ref_code: string;
    report_date: string;
  };
  overall_performance: {
    average_percentage: number;
    grade_letter: string;
    total_subjects: number;
  };
  subjects: SubjectScore[];
  attendance: {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  montessori_conduct: Array<{
    trait: string;
    rating: string;
  }>;
  house_points: number;
  remarks: {
    teacher_remark: string;
    headmistress_remark: string;
  };
}

interface TerminalReportCardProps {
  data?: ReportCardData | null;
  onClose: () => void;
}

const DEFAULT_REPORT_DATA: ReportCardData = {
  student_info: {
    id: 'STD-2026-001',
    student_id_code: 'STD-2026-001',
    name: 'Emeka Okafor',
    grade_level: 'Primary 5 - Erdkinder Track',
    house: 'Red House (Ignis)',
    admission_date: '2022-09-12',
  },
  academic_term: {
    term: 'Term 2 Academic Session',
    year: '2025/2026',
    ref_code: 'TRP-2026-T2-0841',
    report_date: 'August 16, 2026',
  },
  overall_performance: {
    average_percentage: 91.2,
    grade_letter: 'A+',
    total_subjects: 6,
  },
  subjects: [
    { code: 'MTH-101', title: 'Mathematics & Algorithmic Thinking', ca_score: 28.5, cbt_exam_score: 66.5, total_score: 95.0, grade_letter: 'A+', teacher_remark: 'Outstanding analytical prowess & problem solving' },
    { code: 'AGR-101', title: 'Montessori Agronomy & Soil Science', ca_score: 29.0, cbt_exam_score: 65.0, total_score: 94.0, grade_letter: 'A+', teacher_remark: 'Exemplary practical farm plot management' },
    { code: 'ENG-101', title: 'Language Arts & Public Discourse', ca_score: 27.0, cbt_exam_score: 64.0, total_score: 91.0, grade_letter: 'A+', teacher_remark: 'Fluent rhetoric & essay composition' },
    { code: 'PHY-101', title: 'Physical Sciences & Mechanics', ca_score: 26.5, cbt_exam_score: 61.5, total_score: 88.0, grade_letter: 'A', teacher_remark: 'Solid grasp of physical lab dynamics' },
    { code: 'CHM-101', title: 'Chemical Inquiry & Soil Chemistry', ca_score: 28.0, cbt_exam_score: 62.0, total_score: 90.0, grade_letter: 'A+', teacher_remark: 'Excellent experimental diligence' },
    { code: 'ICT-101', title: 'Computer Science & CBT Skills', ca_score: 27.5, cbt_exam_score: 62.0, total_score: 89.5, grade_letter: 'A', teacher_remark: 'Fast computer exam execution' },
  ],
  attendance: {
    total_days: 65,
    present: 63,
    absent: 1,
    late: 1,
    percentage: 96.9,
  },
  montessori_conduct: [
    { trait: 'Practical Life Competencies', rating: 'Exemplary' },
    { trait: 'Grace & Courtesy to Peers', rating: 'Exemplary' },
    { trait: 'Self-Discipline & Orderliness', rating: 'Exemplary' },
    { trait: 'Agronomy Tool Care', rating: 'Proficient' },
    { trait: 'Social & Team Leadership', rating: 'Exemplary' },
  ],
  house_points: 45,
  remarks: {
    teacher_remark: 'Emeka is an outstanding scholar who consistently demonstrates Montessori practical leadership and high academic standards.',
    headmistress_remark: 'Passed with Distinction. Promoted with High Recommendation for Term 3 Honors Track.',
  },
};

export const TerminalReportCard: React.FC<TerminalReportCardProps> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const report = data || DEFAULT_REPORT_DATA;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 md:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-4xl p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible text-foreground">
        
        {/* Top Action Bar (Hidden during print) */}
        <div className="flex justify-between items-center border-b border-border pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">{t('Official Academic Report Card')}</h3>
              <p className="text-xs text-muted-foreground">{t('Tarepet Montessori International College · Verified Record')}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handlePrint}
              className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" /> {t('Print / Export PDF')}
            </button>
            <button
              onClick={onClose}
              className="border border-border text-foreground hover:bg-accent text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Official Printable Academic Document */}
        <div className="space-y-6 bg-white text-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 text-xs font-sans print:p-0 print:border-none">
          
          {/* Header & Crest */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-800 text-white flex items-center justify-center font-serif font-extrabold text-2xl shadow-md border border-white/20">
                TM
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg md:text-xl text-primary uppercase tracking-wide">
                  Tarepet Montessori International College
                </h1>
                <p className="text-[11px] font-medium text-slate-600">
                  Motto: Excellence, Integrity & Practical Life Erdkinder Mastery
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  43 Lt. Col Edor Obi Road Kpansia, Yenagoa, Bayelsa State · www.tarepet.edu.ng
                </p>
              </div>
            </div>
            
            <div className="text-right border-l border-slate-200 pl-5">
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Transcript
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 block">Report Reference</p>
              <p className="font-mono font-bold text-slate-900 text-sm">{report.academic_term.ref_code}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{report.academic_term.report_date}</p>
            </div>
          </div>

          {/* Student Profile Info Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('Student Name')}</span>
              <strong className="text-slate-900 text-sm font-semibold">{report.student_info.name}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('Student Reg Code')}</span>
              <strong className="text-slate-800 font-mono">{report.student_info.student_id_code}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('Class Level')}</span>
              <strong className="text-slate-800">{report.student_info.grade_level}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('House Squad')}</span>
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                <Award className="w-3.5 h-3.5" /> {report.student_info.house}
              </span>
            </div>
          </div>

          {/* Academic Scores Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> {t('Academic Performance & CBT Score Breakdown')}
              </h4>
              <span className="text-[10px] text-slate-500 italic">Continuous Assessment (30%) + CBT Exam (70%)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">Course Code & Title</th>
                    <th className="p-3 text-center">CA (30%)</th>
                    <th className="p-3 text-center">CBT Exam (70%)</th>
                    <th className="p-3 text-center">Total (100%)</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Instructor Assessment & Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {report.subjects.map((sub, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 font-medium">
                        <span className="font-mono font-bold text-primary text-[11px] block">{sub.code}</span>
                        <span>{sub.title}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold">{sub.ca_score}</td>
                      <td className="p-3 text-center font-mono font-semibold">{sub.cbt_exam_score}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 text-sm">{sub.total_score}%</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          sub.grade_letter.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                          sub.grade_letter.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                          sub.grade_letter.startsWith('C') ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sub.grade_letter}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">{sub.teacher_remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Performance & Summary Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-white p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center font-bold text-lg text-emerald-400 border border-emerald-500/30">
                {report.overall_performance.average_percentage}%
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('Term Average')}</span>
                <strong className="text-white text-sm font-serif">{report.overall_performance.grade_letter} Distinction Grade</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('Attendance Track')}</span>
                <strong className="text-white text-xs">{report.attendance.present} / {report.attendance.total_days} Days ({report.attendance.percentage}%)</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('House Points Contributed')}</span>
                <strong className="text-white text-xs">+{report.house_points} Points Logged</strong>
              </div>
            </div>
          </div>

          {/* Montessori Conduct & Skill Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <h4 className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t('Montessori Practical Life & Character Ratings')}
              </h4>
              <div className="space-y-1.5 text-[11px]">
                {report.montessori_conduct.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-200/60 pb-1">
                    <span className="text-slate-700 font-medium">{item.trait}</span>
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px]">{item.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks Box */}
            <div className="space-y-3 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('Form Teacher Remarks')}</span>
                <p className="text-[11px] text-slate-800 font-serif italic mt-0.5">"{report.remarks.teacher_remark}"</p>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('Headmistress Decision & Recommendation')}</span>
                <p className="text-[11px] text-slate-800 font-serif italic mt-0.5">"{report.remarks.headmistress_remark}"</p>
              </div>
            </div>
          </div>

          {/* Signatures & Official Stamp Footer */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
            <div>
              <div className="h-10 border-b border-slate-400 flex items-end pb-1 font-serif text-slate-700 italic">
                Mrs. Okafor C. (Senior Instructor)
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mt-1">Form Teacher Signature</span>
            </div>
            
            <div className="text-right">
              <div className="h-10 border-b border-slate-400 flex items-end justify-end pb-1 font-serif text-primary font-bold italic">
                Dr. (Mrs.) Tarepet E. (Headmistress)
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mt-1">School Seal & Headmistress Stamp</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
