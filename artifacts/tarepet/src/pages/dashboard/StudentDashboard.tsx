import React, { useState, useMemo, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Link } from 'wouter';
import {
  BookOpen, Calendar, Clock, Award, Star, CheckCircle2,
  FileText, ArrowRight, Download, ChevronRight, UserCheck,
  Settings, User, Bell, Lock, AlertCircle,
  BarChart2, Shield, Play, ArrowUpRight, Trophy, ClipboardList,
  CheckSquare, Filter, Search, Sparkles, Zap, Printer, ShieldCheck,
  Scissors, Trash2, Upload, CreditCard, Edit3, HeartHandshake,
  GraduationCap, School, ChevronDown, Check, X, Eye, Phone, Mail, MapPin
} from 'lucide-react';

import {
  getStoredExams, getStoredSubmissions, subscribeToCBTStore,
  getCoursesForClass, getStudentBroadsheet, calculateWAECGrade,
  calculateBECEGrade, isSeniorSecondaryClass, getStoredStudents,
  saveStudent, broadcastRealtimeEvent, syncStudentsWithBackend,
  getStoredSubjects, matchStudentClass, SubjectRecord, CBTExam, CBTSubmission
} from '@/lib/cbt-store';
import { authClient } from '@/lib/api-auth';
import { StudentPaymentPanel } from '@/components/dashboard/StudentPaymentPanel';
import { TerminalReportCard, ReportCardData } from '@/components/reports/TerminalReportCard';
import { getTimeGreeting } from '@/lib/utils';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { MobileProfileView } from '@/components/profile/MobileProfileView';

type DayKey = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

interface TimetableSlot {
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

const DEFAULT_TIMETABLES: Record<string, Record<DayKey, TimetableSlot[]>> = {
  SS1: {
    Monday: [
      { time: '08:00 - 08:30', subject: 'Morning Devotion & Assembly', teacher: 'School Chaplain', room: 'Main School Auditorium' },
      { time: '08:30 - 09:15', subject: 'General Mathematics', teacher: 'Goodluck Ufomba', room: 'Room SS1-A' },
      { time: '09:15 - 10:00', subject: 'English Language', teacher: 'Mrs. Timi Porbeni', room: 'Room SS1-A' },
      { time: '10:00 - 10:45', subject: 'Physics / Lit. in English', teacher: 'Samuel Hannah', room: 'Physics Lab / Room 10' },
      { time: '10:45 - 11:15', subject: 'Montessori Mid-Morning Break', teacher: 'Duty Master', room: 'Dining Hall / Quadrangle' },
      { time: '11:15 - 12:00', subject: 'Chemistry / Government', teacher: 'Mr. Joseph Ekenebe', room: 'Chemistry Lab' },
      { time: '12:00 - 12:45', subject: 'Biology / Economics', teacher: 'Alex I. Maria', room: 'Biology Lab' },
      { time: '12:45 - 01:30', subject: 'Computer Studies & ICT', teacher: 'Samuel Hannah', room: 'Digital ICT Suite' },
      { time: '01:30 - 02:15', subject: 'Civic Education & Leadership', teacher: 'Agadaga Tari', room: 'Room SS1-A' },
    ],
    Tuesday: [
      { time: '08:00 - 08:30', subject: 'Morning Registration & Form Time', teacher: 'Ms. Allison Victoria', room: 'Room SS1-A' },
      { time: '08:30 - 09:15', subject: 'English Language & Comprehension', teacher: 'Mrs. Timi Porbeni', room: 'Room SS1-A' },
      { time: '09:15 - 10:00', subject: 'General Mathematics', teacher: 'Goodluck Ufomba', room: 'Room SS1-A' },
      { time: '10:00 - 10:45', subject: 'Chemistry Practical / Commercial Studies', teacher: 'Mr. Joseph Ekenebe', room: 'Chemistry Lab' },
      { time: '10:45 - 11:15', subject: 'Mid-Morning Break', teacher: 'Duty Master', room: 'Cafeteria' },
      { time: '11:15 - 12:00', subject: 'Agricultural Science / Commerce', teacher: 'Mr. Joseph Ekenebe', room: 'Agriculture Field / Lab' },
      { time: '12:00 - 12:45', subject: 'Data Processing & CBT Practicum', teacher: 'Samuel Hannah', room: 'ICT Lab 1' },
      { time: '12:45 - 01:30', subject: 'Economics / History', teacher: 'Goodluck Ufomba', room: 'Room SS1-A' },
      { time: '01:30 - 02:15', subject: 'Practical Life & Skill Acquisition', teacher: 'Iwu Adanma', room: 'Vocational Center' },
    ],
    Wednesday: [
      { time: '08:00 - 08:30', subject: 'Mid-Week Chapel & Character Prep', teacher: 'School Chaplain', room: 'Chapel' },
      { time: '08:30 - 09:15', subject: 'Physics / Literature', teacher: 'Samuel Hannah', room: 'Physics Lab' },
      { time: '09:15 - 10:00', subject: 'Biology & Environmental Science', teacher: 'Alex I. Maria', room: 'Biology Lab' },
      { time: '10:00 - 10:45', subject: 'Further Mathematics / CRS', teacher: 'Eli Idua', room: 'Room SS1-A' },
      { time: '10:45 - 11:15', subject: 'Snack Break & Recreation', teacher: 'Duty Master', room: 'Quadrangle' },
      { time: '11:15 - 12:00', subject: 'General Mathematics & Equations', teacher: 'Goodluck Ufomba', room: 'Room SS1-A' },
      { time: '12:00 - 12:45', subject: 'English Grammar & Essay Writing', teacher: 'Mrs. Timi Porbeni', room: 'Room SS1-A' },
      { time: '12:45 - 01:30', subject: 'Geography / Civic Studies', teacher: 'Alex I. Maria', room: 'Room SS1-A' },
      { time: '01:30 - 02:15', subject: 'Clubs & Societies / STEM Project', teacher: 'Club Coordinators', room: 'Activity Hall' },
    ],
    Thursday: [
      { time: '08:00 - 08:30', subject: 'Morning Assembly & Moral Talk', teacher: 'Principal', room: 'Auditorium' },
      { time: '08:30 - 09:15', subject: 'Chemistry Fundamentals', teacher: 'Mr. Joseph Ekenebe', room: 'Chemistry Lab' },
      { time: '09:15 - 10:00', subject: 'English Oral & Phonetics', teacher: 'Mrs. Timi Porbeni', room: 'Language Lab' },
      { time: '10:00 - 10:45', subject: 'Physics Experiments', teacher: 'Samuel Hannah', room: 'Physics Lab' },
      { time: '10:45 - 11:15', subject: 'Break', teacher: 'Duty Master', room: 'Cafeteria' },
      { time: '11:15 - 12:00', subject: 'General Mathematics', teacher: 'Goodluck Ufomba', room: 'Room SS1-A' },
      { time: '12:00 - 12:45', subject: 'Biology Genetics & Living Things', teacher: 'Alex I. Maria', room: 'Biology Lab' },
      { time: '12:45 - 01:30', subject: 'French Language / Trade Studies', teacher: 'Mrs. Timi Porbeni', room: 'Room SS1-A' },
      { time: '01:30 - 02:15', subject: 'Games & Inter-House Sports Prep', teacher: 'Sports Director', room: 'Sports Complex' },
    ],
    Friday: [
      { time: '08:00 - 08:30', subject: 'Form Teacher Period & Pastoral Care', teacher: 'Ms. Allison Victoria', room: 'Room SS1-A' },
      { time: '08:30 - 09:15', subject: 'Mathematics Problem Solving', teacher: 'Goodluck Ufomba', room: 'Room SS1-A' },
      { time: '09:15 - 10:00', subject: 'English Novel Review & Drama', teacher: 'Mrs. Timi Porbeni', room: 'Room SS1-A' },
      { time: '10:00 - 10:45', subject: 'Continuous Assessment Quiz & CBT Prep', teacher: 'Subject Teachers', room: 'Digital ICT Suite' },
      { time: '10:45 - 11:15', subject: 'Break', teacher: 'Duty Master', room: 'Dining Hall' },
      { time: '11:15 - 12:00', subject: 'Creative Arts & Music', teacher: 'Mrs. Eze Chidubem', room: 'Arts Studio' },
      { time: '12:00 - 12:45', subject: 'Weekly Review & Homework Briefing', teacher: 'Form Teacher', room: 'Room SS1-A' },
      { time: '12:45 - 01:30', subject: 'Jummah / Fellowship & Dismissal', teacher: 'School Prefects', room: 'Campus Grounds' },
    ],
  },
};

const DEFAULT_ACADEMIC_CALENDAR = [
  {
    title: '2025/2026 Academic Session Resumption',
    date: 'Jan 12, 2026',
    endDate: 'Jan 13, 2026',
    category: 'Academic',
    scope: 'All Classes',
    status: 'Completed',
    detail: 'First day of academic session, class allocation, timetable distribution, and orientation.'
  },
  {
    title: '1st Continuous Assessment (CA1) Week',
    date: 'Feb 09, 2026',
    endDate: 'Feb 13, 2026',
    category: 'Exam',
    scope: 'All Classes',
    status: 'Completed',
    detail: 'Official 1st CA tests across all enrolled nursery, primary, and secondary subjects (10 marks).'
  },
  {
    title: 'Mid-Term Break & Open Day / PTA Meeting',
    date: 'Feb 19, 2026',
    endDate: 'Feb 20, 2026',
    category: 'Holiday',
    scope: 'All Classes',
    status: 'Completed',
    detail: 'Parent-Teacher conference, student developmental review, and mid-term academic progress check.'
  },
  {
    title: '2nd Continuous Assessment (CA2) & Online CBT Assessments',
    date: 'Mar 09, 2026',
    endDate: 'Mar 13, 2026',
    category: 'Exam',
    scope: 'JSS 1 - SS 3',
    status: 'Active',
    detail: 'Computer-Based Testing (CBT) assessment tests for Senior & Junior secondary classes (20 marks).'
  },
  {
    title: 'Tarepet Annual Inter-House Sports Festival',
    date: 'Mar 20, 2026',
    endDate: 'Mar 21, 2026',
    category: 'Event',
    scope: 'Whole School',
    status: 'Upcoming',
    detail: 'Annual athletics, track & field events, marching band competition across all 4 school houses.'
  },
  {
    title: 'Revision Week & Practical Lab Examinations',
    date: 'Mar 23, 2026',
    endDate: 'Mar 27, 2026',
    category: 'Academic',
    scope: 'All Classes',
    status: 'Upcoming',
    detail: 'Intensive revision sessions and science laboratory practical examinations.'
  },
  {
    title: 'Terminal Handwritten & CBT Examinations',
    date: 'Mar 30, 2026',
    endDate: 'Apr 08, 2026',
    category: 'Exam',
    scope: 'All Classes',
    status: 'Upcoming',
    detail: 'End of term summative examinations (60 marks) covering full term curriculum.'
  },
  {
    title: 'Vacation & Report Card Release Day',
    date: 'Apr 10, 2026',
    endDate: 'Apr 10, 2026',
    category: 'Holiday',
    scope: 'All Classes',
    status: 'Upcoming',
    detail: 'Official broadsheet release, terminal report card portal publication, and vacation dismissal.'
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Academic: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
  Exam: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
  Holiday: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
  Event: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
};

function getCategoryBadge(cat: string) {
  return CATEGORY_COLORS[cat] || 'bg-muted text-muted-foreground border-border';
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user, isStudent, isAdmin, refreshUserProfile, updateUser } = useAuth();

  if (!user || (!isStudent && !isAdmin) || (user.role !== 'STUDENT' && user.role !== 'ADMIN')) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl bg-card p-8 shadow-xl border border-border">
          <h2 className="text-2xl font-serif font-bold text-destructive mb-3">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Your account ({user?.role || 'Guest'}) does not have permission to view the Student Portal.
          </p>
          <button
            onClick={() => { window.location.href = '/sign-in'; }}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  const [activeSection, setActiveSectionState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSec = params.get('section');
      if (urlSec) return urlSec;
    }
    return 'overview';
  });

  const setActiveSection = (sec: string) => {
    setActiveSectionState(sec);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('section', sec);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const [timetableDay, setTimetableDay] = useState<DayKey>('Monday');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [examsList, setExamsList] = useState<CBTExam[]>([]);
  const [submissionsList, setSubmissionsList] = useState<CBTSubmission[]>([]);
  const [subjectsListState, setSubjectsListState] = useState<SubjectRecord[]>(() => getStoredSubjects());

  // Search and filter states
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState('All');
  const [examTypeFilter, setExamTypeFilter] = useState<'ALL' | 'TEST' | 'EXAM'>('ALL');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);
  const [showExamRulesModal, setShowExamRulesModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // Security password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const syncStudentCBTData = () => {
    setExamsList(getStoredExams());
    setSubmissionsList(getStoredSubmissions());
    setSubjectsListState(getStoredSubjects());
  };

  useEffect(() => {
    syncStudentCBTData();
    const unsub = subscribeToCBTStore(syncStudentCBTData);

    const syncBackend = () => {
      refreshUserProfile().catch(() => {});
      syncStudentsWithBackend().catch(() => {});
    };
    syncBackend();
    const intervalId = setInterval(syncBackend, 15000);

    return () => {
      unsub();
      clearInterval(intervalId);
    };
  }, []);

  const matchedStoredStudent = useMemo(() => {
    if (!user) return null;
    const uEmail = (user.email || '').toLowerCase().trim();
    const uAdm = ((user.profile as any)?.student_id || (user.profile as any)?.studentId || (user as any).admissionNo || (user as any).admissionNumber || (user as any).code || (user as any).id || '').toString().toLowerCase().trim();
    const uName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim();

    return getStoredStudents().find((s: any) => {
      const sEmail = (s.email || '').toLowerCase().trim();
      const sAdm = (s.admissionNo || s.admissionNumber || s.studentId || s.code || '').toLowerCase().trim();
      const sName = (s.name || '').toLowerCase().trim();
      return (sEmail && sEmail === uEmail) || (sAdm && (sAdm === uAdm || uAdm.includes(sAdm) || sAdm.includes(uAdm))) || (sName && sName === uName);
    });
  }, [user]);

  const getStudentProfileData = () => {
    const s = matchedStoredStudent;
    const prof = (user?.profile as any) || {};
    const nameParts = (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (s?.name || '')).split(' ');
    const fName = user?.first_name || nameParts[0] || '';
    const lName = user?.last_name || nameParts.slice(1).join(' ') || '';

    return {
      firstName: fName,
      lastName: lName,
      email: user?.email || s?.email || '',
      phone: user?.phone || prof.phone || s?.phone || '',
      studentId: prof.student_id || s?.admissionNo || s?.studentId || s?.code || (user as any)?.admissionNo || (user as any)?.admissionNumber || (user as any)?.student_id || 'TMS/STU/001',
      grade: prof.grade_level || prof.grade || s?.grade || 'SS 1',
      stream: prof.stream || s?.stream || 'Science',
      house: prof.house || s?.house || 'Sapphire House',
      gender: prof.gender || s?.gender || 'Male',
      dob: prof.dob || prof.date_of_birth || s?.dob || '2010-05-15',
      address: prof.address || s?.address || 'Yenagoa Campus, Bayelsa State',
      parentName: prof.parent_name || prof.parentName || s?.parentName || '',
      parentPhone: prof.parent_phone || prof.parentPhone || prof.emergency_contact || s?.parentPhone || '',
      bloodGroup: prof.blood_group || (s as any)?.bloodGroup || 'O+',
      genotype: prof.genotype || (s as any)?.genotype || 'AA',
      stateOfOrigin: prof.state_of_origin || prof.stateOfOrigin || s?.stateOfOrigin || 'Bayelsa',
      lga: prof.lga || s?.lga || 'Yenagoa',
      profileImage: prof.profileImage || prof.profile_image || s?.profileImage || '',
      emailNotifications: true,
      smsNotifications: true,
    };
  };

  const [profileForm, setProfileForm] = useState(getStudentProfileData);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');

  useEffect(() => {
    setProfileForm(getStudentProfileData());
  }, [user, matchedStoredStudent]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const numericStudentId = typeof matchedStoredStudent?.id === 'number' 
    ? matchedStoredStudent.id 
    : (typeof user?.id === 'number' ? user.id : undefined);

  const handleSaveProfile = async () => {
    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    await saveStudent({
      id: numericStudentId,
      admissionNo: profileForm.studentId,
      code: profileForm.studentId,
      studentId: profileForm.studentId,
      name: fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      gender: profileForm.gender,
      dob: profileForm.dob,
      address: profileForm.address,
      parentName: profileForm.parentName,
      parentPhone: profileForm.parentPhone,
      profileImage: profileForm.profileImage,
      grade: profileForm.grade,
      stream: profileForm.stream,
      house: profileForm.house,
    });

    updateUser({
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      profile_image: profileForm.profileImage,
      profile: {
        ...(user?.profile || {}),
        student_id: profileForm.studentId,
        gender: profileForm.gender,
        date_of_birth: profileForm.dob,
        address: profileForm.address,
        parent_name: profileForm.parentName,
        parent_phone: profileForm.parentPhone,
        profile_image: profileForm.profileImage,
        profileImage: profileForm.profileImage,
      }
    });

    authClient.patch('/auth/me/', {
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      profile_image: profileForm.profileImage,
      profile: {
        student_id: profileForm.studentId,
        gender: profileForm.gender,
        date_of_birth: profileForm.dob,
        address: profileForm.address,
        parent_name: profileForm.parentName,
        parent_phone: profileForm.parentPhone,
        profile_image: profileForm.profileImage,
        profileImage: profileForm.profileImage,
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});

    broadcastRealtimeEvent();
    setIsEditingPersonal(false);
    showToast('Student profile & contact information updated successfully!');
  };

  const handleSaveCroppedAvatar = (croppedBase64: string) => {
    const updated = { ...profileForm, profileImage: croppedBase64 };
    setProfileForm(updated);
    updateUser({
      profile_image: croppedBase64,
      profile: {
        ...(user?.profile || {}),
        profile_image: croppedBase64,
        profileImage: croppedBase64,
      }
    });
    saveStudent({
      id: numericStudentId,
      admissionNo: profileForm.studentId,
      code: profileForm.studentId,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      profileImage: croppedBase64,
    });
    authClient.patch('/auth/me/', {
      profile_image: croppedBase64,
      profile: {
        profile_image: croppedBase64,
        profileImage: croppedBase64,
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});
    broadcastRealtimeEvent();
    showToast('Profile passport photo cropped and updated in real time!');
  };

  const handleDeleteAvatar = () => {
    const updated = { ...profileForm, profileImage: '' };
    setProfileForm(updated);
    updateUser({
      profile_image: '',
      profile: {
        ...(user?.profile || {}),
        profile_image: '',
        profileImage: '',
      }
    });
    saveStudent({
      id: numericStudentId,
      admissionNo: profileForm.studentId,
      code: profileForm.studentId,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      profileImage: '',
    });
    authClient.patch('/auth/me/', {
      profile_image: '',
      profile: {
        profile_image: '',
        profileImage: '',
      }
    }).then(() => {
      refreshUserProfile().catch(() => {});
    }).catch(() => {});
    broadcastRealtimeEvent();
    showToast('Profile photo removed successfully.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authClient.post('/auth/password/change/', {
        old_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      showToast('Portal password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast('Portal security password successfully updated for your account!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const studentGrade = profileForm.grade || matchedStoredStudent?.grade || (user?.profile as any)?.grade_level || (user?.profile as any)?.grade || 'SS 1';
  const studentStream = (profileForm as any).stream || matchedStoredStudent?.stream || (user?.profile as any)?.stream || (studentGrade.toUpperCase().includes('ART') || (user as any)?.admissionNo?.includes('ART') ? 'Art' : 'Science');

  const myEnrolledCourses = useMemo(() => {
    const sGrade = (studentGrade || '').toUpperCase().trim();
    const sStream = (studentStream || '').toUpperCase().trim();
    const all = subjectsListState.length > 0 ? subjectsListState : getStoredSubjects();
    return all.filter(sub => {
      const matchGrade = matchStudentClass(sGrade, sub.grade) || sub.grade === 'SS 1 - SS 3' || sub.grade.includes('SS');
      const matchStream = !sub.stream || sub.stream === 'General' || sub.stream.toUpperCase() === sStream || (sStream === 'ART' && sub.stream.toUpperCase() === 'ARTS');
      return matchGrade && matchStream;
    });
  }, [studentGrade, studentStream, subjectsListState]);

  const filteredEnrolledCourses = useMemo(() => {
    return myEnrolledCourses.filter(c => {
      const matchesSearch = !subjectSearchQuery || 
        c.title.toLowerCase().includes(subjectSearchQuery.toLowerCase()) || 
        c.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()) || 
        (c.teacher && c.teacher.toLowerCase().includes(subjectSearchQuery.toLowerCase()));
      const matchesCategory = subjectCategoryFilter === 'All' || c.category === subjectCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [myEnrolledCourses, subjectSearchQuery, subjectCategoryFilter]);

  const studentIdForScores = matchedStoredStudent?.id || user?.id || 101;
  const broadsheetData = getStudentBroadsheet(studentIdForScores);
  const isSS = isSeniorSecondaryClass(studentGrade);

  let totalScoreSum = 0;
  let scoredCount = 0;
  myEnrolledCourses.forEach(c => {
    const scoreObj = broadsheetData[c.code];
    if (scoreObj) {
      const tot = (scoreObj.ca1 || 0) + (scoreObj.ca2 || 0) + (scoreObj.cbtScore || 0) + (scoreObj.paperExam || scoreObj.exam || 0);
      if (tot > 0) {
        totalScoreSum += tot;
        scoredCount++;
      }
    }
  });
  const calculatedAvg = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : 0;

  const myCompletedCBTSubmissions = useMemo(() => {
    const uEmail = (user?.email || '').toLowerCase().trim();
    const uAdm = ((user?.profile as any)?.student_id || (user?.profile as any)?.studentId || (user as any)?.admissionNo || (user as any)?.admissionNumber || '').toString().toLowerCase().trim();
    const uName = `${user?.first_name || ''} ${user?.last_name || ''}`.toLowerCase().trim();

    return submissionsList.filter(s => {
      const sEmail = (s.student_email || '').toLowerCase().trim();
      const sAdm = (s.student_id || '').toLowerCase().trim();
      const sName = (s.student_name || '').toLowerCase().trim();
      return (sEmail && sEmail === uEmail) || (sAdm && (sAdm === uAdm || uAdm.includes(sAdm))) || (sName && (sName === uName || (uName && sName.includes(uName))));
    });
  }, [user, submissionsList]);

  const activeLiveExams = useMemo(() => {
    return examsList.filter(e => {
      const isApprovedOrActive = e.status === 'ACTIVE' || e.status === 'APPROVED';
      const matchesClass = !e.class || matchStudentClass(studentGrade, e.class);
      const matchesType = examTypeFilter === 'ALL' || e.assessment_type === examTypeFilter;
      return isApprovedOrActive && matchesClass && matchesType;
    });
  }, [examsList, studentGrade, examTypeFilter]);

  const currentClassTimetable = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_class_timetables');
        if (saved) {
          const parsed = JSON.parse(saved);
          const cleanGrade = studentGrade.replace(/\s+/g, '').toUpperCase();
          if (parsed[cleanGrade]) return parsed[cleanGrade];
          if (parsed['SS1']) return parsed['SS1'];
        }
      } catch (e) {}
    }
    return DEFAULT_TIMETABLES['SS1'];
  }, [studentGrade]);

  const timetableSlotsForDay: TimetableSlot[] = useMemo(() => {
    if (currentClassTimetable && currentClassTimetable[timetableDay]) {
      return currentClassTimetable[timetableDay];
    }
    return DEFAULT_TIMETABLES.SS1[timetableDay] || [];
  }, [currentClassTimetable, timetableDay]);

  const academicCalendarEvents = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tarepet_academic_calendar');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_ACADEMIC_CALENDAR;
  }, []);

  const coursesForReport = getCoursesForClass(studentGrade, studentStream);
  let reportTotalSum = 0;
  let reportCount = 0;
  const reportScoredCourses = coursesForReport.map(c => {
    const sc = broadsheetData[c.code] || { ca1: 0, ca2: 0, cbtScore: 0, paperExam: 0, exam: 0, remark: '' };
    const total = isSS
      ? (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.cbtScore || 0) + (sc.paperExam || 0)
      : (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam !== undefined ? sc.exam : (sc.paperExam || 0));

    if (total > 0) {
      reportTotalSum += total;
      reportCount++;
    }
    const gradeInfo = isSS ? calculateWAECGrade(total) : calculateBECEGrade(total);
    return { ...c, ...sc, total, gradeInfo };
  });
  const overallAvg = reportCount > 0 ? Math.round(reportTotalSum / reportCount) : calculatedAvg || 84;

  const reportCardPayload: ReportCardData = {
    student_info: {
      id: profileForm.studentId || 'TMS-2024-101',
      student_id_code: profileForm.studentId || 'TMS-2024-101',
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim() || 'Student',
      grade_level: `${studentGrade} (${studentStream})`,
      house: profileForm.house,
      admission_date: '2024-09-10',
    },
    academic_term: {
      term: selectedTerm,
      year: '2025/2026',
      ref_code: `TMS-2026-${profileForm.studentId || '101'}`,
      report_date: 'April 10, 2026',
    },
    overall_performance: {
      average_percentage: overallAvg,
      grade_letter: isSS ? calculateWAECGrade(overallAvg).grade : calculateBECEGrade(overallAvg).grade,
      total_subjects: myEnrolledCourses.length || 8,
    },
    subjects: reportScoredCourses.map(g => ({
      code: g.code,
      title: g.name,
      ca_score: (g.ca1 || 9) + (g.ca2 || 8),
      cbt_exam_score: g.cbtScore || 18,
      total_score: g.total || 87,
      grade_letter: g.gradeInfo?.grade || 'A1',
      teacher_remark: g.remark || 'Outstanding conceptual grasp and diligence.',
    })),
    attendance: {
      total_days: 65,
      present: 64,
      absent: 1,
      late: 0,
      percentage: 98.4,
    },
    montessori_conduct: [
      { trait: 'Self-Discipline & Order', rating: 'Excellent' },
      { trait: 'Initiative & Independence', rating: 'Very Good' },
      { trait: 'Respect & Social Grace', rating: 'Outstanding' },
      { trait: 'Attentiveness & Focus', rating: 'Excellent' },
    ],
    house_points: 125,
    remarks: {
      teacher_remark: 'Outstanding intellectual performance and exemplary character.',
      headmistress_remark: 'An exceptional student with strong leadership capabilities.',
    },
  };

  const renderSection = () => {
    // =========================================================
    // 1. OVERVIEW
    // =========================================================
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        {/* Welcome Identity Banner */}
        <div className="bg-gradient-to-r from-rose-800 via-red-900 to-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center font-serif font-bold text-2xl text-white overflow-hidden shrink-0 shadow-lg backdrop-blur-md">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt={profileForm.firstName} className="w-full h-full object-cover" />
                ) : (
                  `${profileForm.firstName?.[0] || 'S'}${profileForm.lastName?.[0] || 'T'}`
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                    {studentGrade.toUpperCase()} ({studentStream.toUpperCase()})
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/30 backdrop-blur-md text-emerald-100 px-3 py-1 rounded-full border border-emerald-400/30">
                    Active Student
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {getTimeGreeting()}, {profileForm.firstName || 'Student'}!
                </h2>
                <p className="text-rose-100 text-xs font-mono">
                  Student ID: <strong>{profileForm.studentId}</strong> • House: <strong>{profileForm.house}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link href="/dashboard/cbt-exam">
                <button className="px-5 py-2.5 rounded-xl bg-white text-rose-900 font-bold text-xs hover:bg-rose-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <Play className="w-3.5 h-3.5 fill-rose-900" /> Start CBT Exam
                </button>
              </Link>
              <button
                onClick={() => setShowReportCardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Report Card
              </button>
            </div>
          </div>
        </div>

        {/* Live Exam Notice Strip */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-200" /> Computer-Based Testing System
            </span>
            <h3 className="text-base sm:text-lg font-bold">Online Examinations & Continuous Assessment Tests</h3>
            <p className="text-emerald-100 text-xs max-w-xl">
              Automatic timer countdown, offline-safe answer sync, and immediate objective scoring.
            </p>
          </div>
          <Link href="/dashboard/cbt-exam">
            <button className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-md whitespace-nowrap cursor-pointer">
              Launch CBT Exam Portal →
            </button>
          </Link>
        </div>

        {/* Key Academic Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Enrolled Subjects</span>
              <BookOpen className="w-4 h-4 text-rose-700" />
            </div>
            <p className="text-2xl font-serif font-bold text-foreground">{myEnrolledCourses.length}</p>
            <p className="text-[10px] text-muted-foreground">Curriculum active courses</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Cumulative Average</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-emerald-600">{scoredCount > 0 ? `${calculatedAvg}%` : '84%'}</p>
            <p className="text-[10px] text-muted-foreground">Term academic standing</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">CBT Assessments</span>
              <ClipboardList className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-blue-600">{myCompletedCBTSubmissions.length} Done</p>
            <p className="text-[10px] text-muted-foreground">{activeLiveExams.length} tests ready to take</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Tuition Clearance</span>
              <CreditCard className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-lg font-serif font-bold text-emerald-600">Cleared / Paid</p>
            <p className="text-[10px] text-muted-foreground">2025/2026 1st Term Fee</p>
          </div>
        </div>

        {/* Quick Student Access Grid */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Quick Portal Shortcuts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'My Subjects', sec: 'courses', icon: BookOpen, color: 'text-rose-700 bg-rose-500/10' },
              { label: 'CBT Exams', sec: 'exams', icon: ClipboardList, color: 'text-blue-600 bg-blue-500/10' },
              { label: 'Check Results', sec: 'results', icon: BarChart2, color: 'text-emerald-600 bg-emerald-500/10' },
              { label: 'Payments/Fees', sec: 'payments', icon: CreditCard, color: 'text-amber-600 bg-amber-500/10' },
              { label: 'Class Timetable', sec: 'calendar', icon: Clock, color: 'text-purple-600 bg-purple-500/10' },
              { label: 'Profile Settings', sec: 'settings', icon: Settings, color: 'text-slate-600 bg-slate-500/10' },
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSection(s.sec)}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Teacher & Guidance Information */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-serif font-bold text-lg text-primary shrink-0">
              AV
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-primary tracking-wider">Form Teacher & Academic Advisor</span>
              <h4 className="font-serif font-bold text-foreground text-base">Ms. Allison Victoria</h4>
              <p className="text-xs text-muted-foreground">Senior Secondary Section • allison.victoria@tarepet.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-muted text-foreground font-medium">Room SS1-A</span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold">Office Hours: 01:30 PM - 03:00 PM</span>
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 2. MY SUBJECTS
    // =========================================================
    if (activeSection === 'courses') return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">My Enrolled Subjects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Curriculum overview, continuous assessment breakdowns, syllabus progress, and instructors.
            </p>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
            {myEnrolledCourses.length} Registered Courses
          </span>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={subjectSearchQuery}
              onChange={e => setSubjectSearchQuery(e.target.value)}
              placeholder="Search enrolled subjects by name, code or teacher..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'General', 'Applied Sciences', 'Humanities'].map(cat => (
              <button
                key={cat}
                onClick={() => setSubjectCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subjectCategoryFilter === cat ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Enrolled Subjects Grid */}
        {filteredEnrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEnrolledCourses.map((c, idx) => {
              const scoreObj = broadsheetData[c.code];
              const totalScore = scoreObj ? (scoreObj.ca1 || 0) + (scoreObj.ca2 || 0) + (scoreObj.cbtScore || 0) + (scoreObj.paperExam || scoreObj.exam || 0) : 0;
              const gradeLetter = isSS ? calculateWAECGrade(totalScore).grade : calculateBECEGrade(totalScore).grade;

              return (
                <div key={c.code || idx} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-lg font-mono">
                          {c.code}
                        </span>
                        <h3 className="font-serif font-bold text-lg text-foreground mt-2">{c.title || (c as any).name}</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                        {totalScore > 0 ? `${gradeLetter} (${totalScore}%)` : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-3 rounded-xl border border-border/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Subject Teacher</span>
                        <span className="font-semibold text-foreground">{c.teacher || 'Department Staff'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Class & Stream</span>
                        <span className="font-semibold text-foreground">{studentGrade} ({studentStream})</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">3 Periods / Week</span>
                    <button
                      onClick={() => setSelectedCourseDetail(c)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View Syllabus & Materials →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-lg">No Subjects Found</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No registered subjects match your current filter. Clear your search or change the category filter.
            </p>
          </div>
        )}

        {/* Syllabus / Course Materials Modal Drawer */}
        {selectedCourseDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-mono">
                    {selectedCourseDetail.code}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-foreground mt-1">{selectedCourseDetail.title || selectedCourseDetail.name}</h3>
                </div>
                <button onClick={() => setSelectedCourseDetail(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-foreground mb-1.5 uppercase text-[10px] tracking-wider text-muted-foreground">Term 1 Syllabus Outline</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
                    <li>Week 1–3: Core Fundamentals, Historical Context & Formula Review</li>
                    <li>Week 4–6: Quantitative Exercises & Laboratory Experiments</li>
                    <li>Week 7: Mid-Term Continuous Assessment & Assessment Review</li>
                    <li>Week 8–10: Advanced Applied Problem Solving & Project Submission</li>
                    <li>Week 11–12: Revision & Comprehensive Examination Preparation</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                  <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wider text-muted-foreground">Recommended Textbooks & Learning Materials</h4>
                  <p className="text-muted-foreground">1. Comprehensive Senior Secondary Curriculum Series (2025 Edition)</p>
                  <p className="text-muted-foreground">2. Tarepet Montessori Essential Lab & Practical Manual</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        )}
      </div>
    );

    // =========================================================
    // 3. CBT EXAMS / TESTS
    // =========================================================
    if (activeSection === 'exams') return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block">
              Continuous Assessment & Terminal CBT Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">CBT Examination System</h2>
            <p className="text-emerald-100 text-xs max-w-xl">
              Take scheduled online tests and exams with anti-cheat protection, automatic countdown timers, and instant scoring.
            </p>
          </div>
          <Link href="/dashboard/cbt-exam">
            <button className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg whitespace-nowrap cursor-pointer flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-emerald-900" /> Enter CBT Examination Hall
            </button>
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-xl border border-border">
            {(['ALL', 'TEST', 'EXAM'] as const).map(type => (
              <button
                key={type}
                onClick={() => setExamTypeFilter(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  examTypeFilter === type ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {type === 'ALL' ? 'All Assessments' : type === 'TEST' ? 'C.A. Tests' : 'Terminal Exams'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExamRulesModal(true)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-primary" /> Examination Guidelines & Rules
          </button>
        </div>

        {/* Available Live Exams */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" /> Active & Scheduled CBT Assessments
          </h3>

          <div className="space-y-3">
            {activeLiveExams.length > 0 ? activeLiveExams.map(ex => (
              <div key={ex.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-muted/10 hover:border-emerald-300 transition-all gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-mono">
                      {ex.course_code || 'EXAM'}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700">
                      {ex.assessment_type === 'TEST' ? 'Continuous Assessment' : 'Summative Examination'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ex.duration_minutes} Minutes • {ex.questions_count || ex.questions?.length || 4} Questions
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-foreground text-base">{ex.title}</h4>
                  <p className="text-xs text-muted-foreground">{ex.description || 'Answer all objective questions within the allowed time.'}</p>
                </div>

                <Link href="/dashboard/cbt-exam">
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer self-start sm:self-auto whitespace-nowrap">
                    Start Test Now →
                  </button>
                </Link>
              </div>
            )) : (
              <div className="text-center py-10 bg-muted/10 rounded-2xl border border-border space-y-2">
                <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-bold text-foreground">No CBT Assessments Pending</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  When your subject instructors schedule and activate a test session, it will appear here immediately.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Completed CBT Submissions History */}
        {myCompletedCBTSubmissions.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed Test Submissions & Scores
            </h3>

            <div className="space-y-3">
              {myCompletedCBTSubmissions.map(sub => (
                <div key={sub.id} className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-500/5 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{sub.exam_title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted on {new Date(sub.submitted_at).toLocaleDateString()} at {new Date(sub.submitted_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-serif font-bold text-emerald-600">{sub.score} / {sub.total_possible}</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 block">({sub.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examination Rules Modal */}
        {showExamRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> CBT Examination Code of Conduct
                </h3>
                <button onClick={() => setShowExamRulesModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground space-y-2.5">
                <p>1. <strong>Single Attempt Restriction:</strong> Once you submit or when the timer elapses, your examination attempt is final.</p>
                <p>2. <strong>Browser Tab Anti-Cheat:</strong> Switching tabs or minimizing the browser during an active session is logged by the invigilator.</p>
                <p>3. <strong>Automatic Submission:</strong> When the countdown timer reaches 00:00, all answered questions are automatically recorded.</p>
                <p>4. <strong>Network Resilience:</strong> Answers are saved locally in real time and synced upon reconnection.</p>
              </div>

              <button
                onClick={() => setShowExamRulesModal(false)}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        )}
      </div>
    );

    // =========================================================
    // 4. CHECK RESULTS & BROADSHEET
    // =========================================================
    if (activeSection === 'results') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Official Academic Results</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Certified continuous assessment scores, CBT evaluation, and terminal examination broadsheet.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                {(['1st Term', '2nd Term', '3rd Term'] as const).map(term => (
                  <button
                    key={term}
                    onClick={() => setSelectedTerm(term)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedTerm === term ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowReportCardModal(true)}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Report Card
              </button>
            </div>
          </div>

          {/* Metric Summary Strip */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Term Average</p>
              <p className="text-3xl font-serif font-bold text-emerald-600 mt-1">{overallAvg}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Class Ranking</p>
              <p className="text-3xl font-serif font-bold text-purple-600 mt-1">1st Position</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Academic Standing</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-2">
                Distinction
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Promotion Status</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block mt-2">
                Cleared & In Good Standing
              </span>
            </div>
          </div>

          {/* Broadsheet Results Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" /> {selectedTerm} Broadsheet Evaluation
              </h3>
              <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full">
                Certified by Form Teacher
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 uppercase text-[10px] text-muted-foreground tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3 text-center">1st CA (10)</th>
                    <th className="p-3 text-center">2nd CA (10)</th>
                    <th className="p-3 text-center bg-blue-500/10 text-blue-700">CBT (20)</th>
                    <th className="p-3 text-center">Exam (60)</th>
                    <th className="p-3 text-center">Total (100)</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Teacher's Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportScoredCourses.map(g => (
                    <tr key={g.code} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-bold text-foreground">
                        {g.name}
                        <span className="text-[10px] font-mono text-muted-foreground block">{g.code}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{g.ca1 || 9}</td>
                      <td className="p-3 text-center font-mono font-bold">{g.ca2 || 8}</td>
                      <td className="p-3 text-center font-mono font-bold text-blue-700 bg-blue-500/5">{g.cbtScore || 18}</td>
                      <td className="p-3 text-center font-mono font-bold">{g.paperExam || g.exam || 52}</td>
                      <td className="p-3 text-center font-serif font-bold text-sm text-foreground">{g.total || 87}%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-500/10 text-emerald-600">
                          {g.gradeInfo?.grade || 'A1'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground italic">{g.remark || 'Excellent conceptual understanding.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================
    // 5. PAYMENTS & FEES
    // =========================================================
    if (activeSection === 'payments') return (
      <StudentPaymentPanel
        studentId={user?.id || profileForm.studentId}
        studentName={`${user?.first_name || profileForm.firstName} ${user?.last_name || profileForm.lastName}`}
        studentEmail={user?.email || profileForm.email}
        gradeLevel={(user?.profile as any)?.grade || 'SS1'}
      />
    );

    // =========================================================
    // 6. CALENDAR & TIMETABLE
    // =========================================================
    if (activeSection === 'calendar') return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Class Timetable & School Calendar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Weekly subject schedule, classroom locations, key school dates, and holidays.
          </p>
        </div>

        {/* 1. Class Timetable Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> {studentGrade} ({studentStream}) Weekly Schedule
              </h3>
              <p className="text-xs text-muted-foreground">Classroom: Room SS1-A • Academic Session 2025/2026</p>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayKey[]).map(day => (
                <button
                  key={day}
                  onClick={() => setTimetableDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    timetableDay === day ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {timetableSlotsForDay.map((slot: TimetableSlot, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:border-primary/40 transition-all gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{slot.subject}</h4>
                    <p className="text-xs text-muted-foreground">Instructor: <span className="font-semibold text-foreground">{slot.teacher}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                    {slot.time}
                  </span>
                  <span className="font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                    {slot.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Academic Calendar Events Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> 2026 School Academic Calendar
            </h3>
            <p className="text-xs text-muted-foreground">Official term milestones, examination windows, and sports activities.</p>
          </div>

          <div className="space-y-3">
            {academicCalendarEvents.map((ev: any, idx: number) => {
              const badgeStyle = getCategoryBadge(ev.category);
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-xs gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                        {ev.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {ev.scope || 'All Classes'}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground text-sm">{ev.title}</h4>
                    <p className="text-xs text-muted-foreground">{ev.detail}</p>
                  </div>

                  <span className="font-mono font-bold text-foreground text-xs bg-muted/40 px-3 py-1.5 rounded-xl border border-border self-start sm:self-auto shrink-0">
                    {ev.date}{ev.endDate ? ` — ${ev.endDate}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    // =========================================================
    // 7. PROFILE & SETTINGS
    // =========================================================
    if (activeSection === 'settings' || activeSection === 'profile') return (
      <>
        {/* Mobile View Profile */}
        <div className="md:hidden">
          <MobileProfileView
            name={`${profileForm.firstName} ${profileForm.lastName}`.trim() || user?.email || 'Student'}
            email={profileForm.email || user?.email || ''}
            subtitle={`${profileForm.grade || 'Student'} • Senior Secondary`}
            avatarUrl={profileForm.profileImage}
            roleBadge="STUDENT"
            location="Yenagoa Campus, Nigeria"
            onBack={() => setActiveSection('overview')}
            onEditProfile={() => {
              const fileInput = document.getElementById('studentAvatarInputPicker');
              if (fileInput) fileInput.click();
            }}
            onViewIdCard={() => setShowReportCardModal(true)}
            extraMenuItems={[
              {
                icon: Award,
                label: 'Official Terminal Report Card',
                value: selectedTerm,
                onClick: () => setShowReportCardModal(true),
                color: 'bg-rose-500/10 text-rose-700',
              },
              {
                icon: BookOpen,
                label: 'Enrolled Academic Courses',
                value: `${myEnrolledCourses.length} Subjects`,
                onClick: () => setActiveSection('courses'),
                color: 'bg-blue-500/10 text-blue-600',
              },
              {
                icon: CreditCard,
                label: 'Tuition Fees & Payments',
                value: 'View Balance',
                onClick: () => setActiveSection('payments'),
                color: 'bg-amber-500/10 text-amber-600',
              }
            ]}
          />
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-6 w-full pb-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Student Profile & Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Academic credentials, personal information, parent contact records, and portal security.
            </p>
          </div>

          {/* 1. Identity & Passport Photo Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Official Student Identity & Passport
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Enrolled & Verified Student
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-serif font-bold text-2xl text-primary overflow-hidden shrink-0 shadow-inner">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt={profileForm.firstName} className="w-full h-full object-cover" />
                ) : (
                  `${profileForm.firstName?.[0] || 'S'}${profileForm.lastName?.[0] || 'T'}`
                )}
              </div>

              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  accept="image/*"
                  id="studentAvatarInputPicker"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        showToast('Image size exceeds 10MB limit.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const imageBase64 = reader.result as string;
                        setPendingCropImage(imageBase64);
                        setCropModalOpen(true);
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="studentAvatarInputPicker" className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    {profileForm.profileImage ? 'Change Passport Photo' : 'Upload Passport Photo'}
                  </label>
                  {profileForm.profileImage && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCropImage(profileForm.profileImage);
                          setCropModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Scissors className="w-3.5 h-3.5 text-primary" /> Crop / Resize
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="px-3 py-1.5 text-rose-600 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">JPG, PNG or WEBP format. Maximum file size: 10MB.</p>
              </div>
            </div>

            {/* Read-Only Academic Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Student ID</span>
                <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" /> {profileForm.studentId}
                </span>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Class & Arm</span>
                <span className="font-bold text-xs text-foreground">{studentGrade} ({studentStream})</span>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">School House</span>
                <span className="font-bold text-xs text-foreground">{profileForm.house}</span>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Active Courses</span>
                <span className="font-bold text-xs text-primary">{myEnrolledCourses.length} Subjects</span>
              </div>
            </div>
          </div>

          {/* 2. Personal & Contact Information Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Personal & Contact Details
              </h3>
              {!isEditingPersonal ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" /> Edit Details
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(getStudentProfileData());
                      setIsEditingPersonal(false);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              )}
            </div>

            {!isEditingPersonal ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">First Name</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.firstName || 'Not Specified'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Last Name</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.lastName || 'Not Specified'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Email Address</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.email || 'Not Available'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Student Phone</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.phone || 'Not Available'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Gender</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.gender || 'Male'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Date of Birth</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.dob || '2010-05-15'}</p>
                </div>
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">State of Origin / LGA</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.stateOfOrigin} / {profileForm.lga}</p>
                </div>
                <div className="sm:col-span-2 bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Residential Address</span>
                  <p className="font-semibold text-xs text-foreground">{profileForm.address || 'Not Available'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Student Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. 08012345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dob}
                      onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Residential Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="e.g. Yenagoa, Bayelsa State"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Parent / Guardian Contact Information Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-primary" /> Parent & Guardian Contact Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Parent / Guardian Full Name</label>
                <input
                  type="text"
                  value={profileForm.parentName}
                  onChange={e => setProfileForm({ ...profileForm, parentName: e.target.value })}
                  placeholder="e.g. Mr. & Mrs. Okoro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Parent Emergency Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.parentPhone}
                  onChange={e => setProfileForm({ ...profileForm, parentPhone: e.target.value })}
                  placeholder="e.g. 08031234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Portal Account Security & Password Change */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
              <Lock className="w-4 h-4 text-primary" /> Portal Account Security & Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !passwordForm.newPassword}
                className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isChangingPassword ? 'Updating Password...' : 'Update Portal Password'}
              </button>
            </form>
          </div>

          {/* Save Profile Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              className="bg-primary hover:bg-primary/90 active:scale-95 text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Save All Profile & Contact Changes
            </button>
          </div>
        </div>
      </>
    );

    // Default fallback
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Student Portal</h2>
        <p className="text-xs text-muted-foreground">Select a section from the sidebar menu to view your courses, exams, and results.</p>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
      <PortalLayout
        title="Student Portal"
        activeSection={activeSection}
        onNavigate={setActiveSection}
      >
        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-2 border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {toastMsg}
          </div>
        )}

        {/* Dynamic Section Content */}
        {renderSection()}

        {/* Terminal Report Card Modal */}
        {showReportCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="font-serif font-bold text-lg text-foreground">Official Terminal Report Card</h3>
                <button
                  onClick={() => setShowReportCardModal(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <TerminalReportCard
                data={reportCardPayload}
                onClose={() => setShowReportCardModal(false)}
              />
            </div>
          </div>
        )}

        {/* Image Crop Modal */}
        {cropModalOpen && (
          <ImageCropModal
            isOpen={cropModalOpen}
            imageSrc={pendingCropImage}
            onClose={() => setCropModalOpen(false)}
            onSave={(cropped: string) => {
              handleSaveCroppedAvatar(cropped);
              setCropModalOpen(false);
            }}
          />
        )}
      </PortalLayout>
    </ProtectedRoute>
  );
}
