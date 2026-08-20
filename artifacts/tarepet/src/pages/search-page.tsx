import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  CreditCard,
  ArrowUpRight,
  Filter,
  X,
  Sparkles,
  School,
  Building2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { getStoredTeachers, getStoredStudents, getStoredExams } from '@/lib/cbt-store';

const DEFAULT_SUBJECTS = [
  { id: 1, name: 'Mathematics', code: 'MTH-101', department: 'Science & Logic', classesCount: 6 },
  { id: 2, name: 'English Language', code: 'ENG-101', department: 'Humanities & Languages', classesCount: 6 },
  { id: 3, name: 'Basic Science', code: 'BSC-102', department: 'Sciences', classesCount: 3 },
  { id: 4, name: 'Physics', code: 'PHY-301', department: 'Senior Science', classesCount: 3 },
  { id: 5, name: 'Chemistry', code: 'CHM-301', department: 'Senior Science', classesCount: 3 },
  { id: 6, name: 'Biology', code: 'BIO-301', department: 'Senior Science', classesCount: 3 },
  { id: 7, name: 'Government', code: 'GOV-301', department: 'Senior Arts', classesCount: 3 },
  { id: 8, name: 'Literature in English', code: 'LIT-301', department: 'Senior Arts', classesCount: 3 },
  { id: 9, name: 'Civic Education', code: 'CVE-101', department: 'General Academics', classesCount: 6 },
];

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'teachers' | 'subjects' | 'exams'>('all');

  // Load datasets
  const teachers = useMemo(() => getStoredTeachers(), []);
  const students = useMemo(() => getStoredStudents(), []);

  // Filtered search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchedStudents = students
      .filter((s: any) => {
        if (!q) return true;
        const name = (s.name || '').toLowerCase();
        const id = (s.studentId || s.admissionNo || '').toLowerCase();
        const grade = (s.grade || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        return name.includes(q) || id.includes(q) || grade.includes(q) || email.includes(q);
      })
      .map((s: any) => ({
        id: `stu-${s.id}`,
        type: 'students',
        title: s.name,
        subtitle: `${s.studentId || s.admissionNo || 'TP-STU-001'} · Class: ${s.grade || 'JSS 1'} ${s.stream || ''}`,
        badge: s.grade || 'Student',
        category: 'Student Roster',
        icon: GraduationCap,
        badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        targetUrl: `/dashboard/admin?section=students&id=${s.id}`,
      }));

    const matchedTeachers = teachers
      .filter((t: any) => {
        if (!q) return true;
        const name = (t.name || '').toLowerCase();
        const staffId = (t.staffId || '').toLowerCase();
        const dept = (t.department || '').toLowerCase();
        const spec = (t.specialization || '').toLowerCase();
        const email = (t.email || '').toLowerCase();
        return name.includes(q) || staffId.includes(q) || dept.includes(q) || spec.includes(q) || email.includes(q);
      })
      .map((t: any) => ({
        id: `tch-${t.id}`,
        type: 'teachers',
        title: t.name,
        subtitle: `${t.staffId} · ${t.specialization || t.department || 'Faculty Member'}`,
        badge: t.formTeacherOf && t.formTeacherOf !== 'None' ? `Form Teacher: ${t.formTeacherOf}` : 'Educator',
        category: 'Faculty Directory',
        icon: Users,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        targetUrl: `/dashboard/admin?section=teachers&id=${t.id}`,
      }));

    const matchedSubjects = DEFAULT_SUBJECTS
      .filter((s: any) => {
        if (!q) return true;
        const name = (s.name || '').toLowerCase();
        const code = (s.code || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        return name.includes(q) || code.includes(q) || dept.includes(q);
      })
      .map((s: any) => ({
        id: `sub-${s.id}`,
        type: 'subjects',
        title: s.name,
        subtitle: `${s.code} · Department: ${s.department}`,
        badge: `${s.classesCount || 3} Classes`,
        category: 'Curriculum Subject',
        icon: BookOpen,
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        targetUrl: `/dashboard/admin?section=courses`,
      }));

    const storedExams = getStoredExams();
    const matchedExams = storedExams
      .filter((e: any) => {
        if (!q) return true;
        const title = (e.title || e.course_name || '').toLowerCase();
        const subject = (e.course_name || e.subject || '').toLowerCase();
        const code = (e.course_code || e.code || '').toLowerCase();
        return title.includes(q) || subject.includes(q) || code.includes(q);
      })
      .map((e: any) => ({
        id: `ex-${e.id}`,
        type: 'exams',
        title: e.title || e.course_name,
        subtitle: `${e.course_code || 'CBT'} · Class: ${e.class || 'JSS 3'} · ${e.duration_minutes || 45} Mins`,
        badge: e.status || 'Active CBT',
        category: 'CBT Assessment',
        icon: FileText,
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        targetUrl: `/dashboard/admin?section=exams`,
      }));

    return {
      all: [...matchedStudents, ...matchedTeachers, ...matchedSubjects, ...matchedExams],
      students: matchedStudents,
      teachers: matchedTeachers,
      subjects: matchedSubjects,
      exams: matchedExams,
    };
  }, [query, teachers, students]);

  const activeResults = results[activeTab] || [];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold border border-emerald-500/20 shadow-xs">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-foreground">Global Portal Search & Directory</h1>
            <p className="text-xs text-muted-foreground">Search across students, faculty teachers, curriculum subjects, and CBT exams.</p>
          </div>
        </div>

        <button
          onClick={() => setLocation('/dashboard')}
          className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <X className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>

      {/* Main Search Input Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by student name, admission no, teacher staff ID, subject code, or CBT exam..."
          className="w-full pl-12 pr-12 py-3.5 text-sm sm:text-base bg-card border-2 border-emerald-500/30 rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Popular Search Suggestions / Tags */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Popular Tags:
        </span>
        {['Evelyn Alaere', 'JSS 1', 'Mathematics', 'Form Teacher', 'TMS/TCH/0119', 'BECE Exam'].map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            className="px-3 py-1 rounded-full bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-700 border border-border text-muted-foreground transition-all cursor-pointer font-medium"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Results', count: results.all.length },
          { key: 'students', label: 'Students Roster', count: results.students.length },
          { key: 'teachers', label: 'Faculty Directory', count: results.teachers.length },
          { key: 'subjects', label: 'Subjects & Courses', count: results.subjects.length },
          { key: 'exams', label: 'CBT Assessments', count: results.exams.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Results Grid */}
      {activeResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeResults.map((item: any) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setLocation(item.targetUrl)}
                className="p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-emerald-700 transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                  View <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 bg-card border border-border rounded-3xl p-8">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-lg text-foreground">No records matched "{query}"</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Try adjusting your search keywords, clearing search filters, or checking spelling for teacher staff IDs and student numbers.
          </p>
          <button
            onClick={() => setQuery('')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
}
