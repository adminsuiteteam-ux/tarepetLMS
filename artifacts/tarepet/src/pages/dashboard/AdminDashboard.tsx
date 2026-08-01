import React, { useState } from 'react';
import { useTranslation } from '@/i18n';
import { Link } from 'wouter';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getStoredExams, updateExamStatus, saveCBTExam, subscribeToCBTStore, generateAdmissionNumber } from '@/lib/cbt-store';

import {
  Users, BookOpen, Server, CheckCircle2,
  Plus, FileText, Download, Upload, Search,
  Activity, DollarSign, CreditCard,
  AlertCircle, BarChart2, Settings,
  ChevronLeft, ChevronDown, RefreshCw, Lock, Clock, X,
  ClipboardList, Printer, QrCode,
  ArrowUpRight, ArrowDownRight, Building2,
  Mail, Phone, MapPin, Calendar, Shield, GraduationCap, Award,
  Briefcase, UserCog, BookMarked, MessageSquare, KeyRound,
  BadgeCheck, Ban, RotateCcw, FileDown, Send, FlaskConical, Palette,
  School, CalendarCheck, Megaphone, UserPlus, FileSpreadsheet, TrendingUp, Sparkles, ChevronRight, Eye, Layers, ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  FaChalkboardUser, FaBriefcase, FaUserShield, FaUserGraduate,
  FaPen, FaTrash, FaIdCard, FaEnvelope, FaLock, FaCalendarCheck,
  FaBookOpen, FaChartBar, FaFileLines, FaBan, FaKey, FaPhone,
  FaLocationDot, FaMoneyBillWave, FaGraduationCap, FaChalkboard,
  FaUserCheck, FaClipboardList, FaMessage, FaDownload, FaPrint,
} from 'react-icons/fa6';

// ── Types ────────────────────────────────────────────────────
interface TabProps { id: string; label: string; icon: React.ReactNode; badge?: number }

const MOCK_USERS: any[] = [];
const MOCK_STUDENTS: any[] = [
  { id: 1, name: 'Chidi Nwosu', admissionNo: 'TMS/JS1/4092', email: 'chidi.nwosu@tarepet.com', grade: 'JSS1', stream: 'General', house: 'Blue House (Eagle)', status: 'ACTIVE', dob: '2012-05-14', gender: 'Male', country: 'Nigeria', stateOfOrigin: 'Anambra', lga: 'Nnewi South', address: '12 Swali Road, Yenagoa', parentName: 'Chief Nwosu', parentPhone: '08031112233' },
  { id: 2, name: 'Amaka Okafor', admissionNo: 'TMS/JS1/8193', email: 'amaka.okafor@tarepet.com', grade: 'JSS1', stream: 'General', house: 'Purple House (Phoenix)', status: 'ACTIVE', dob: '2012-09-20', gender: 'Female', country: 'Nigeria', stateOfOrigin: 'Enugu', lga: 'Nsukka', address: '45 Mbiama Yenagoa Road', parentName: 'Dr. Okafor', parentPhone: '08032223344' },
  { id: 3, name: 'Kemebradikumo Danjuma', admissionNo: 'TMS/JS2/5102', email: 'kemebradikumo.danjuma@tarepet.com', grade: 'JSS2', stream: 'General', house: 'Green House (Jaguar)', status: 'ACTIVE', dob: '2011-03-11', gender: 'Male', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Southern Ijaw', address: '8 Isaac Boro Expressway', parentName: 'Engr. Danjuma', parentPhone: '08033334455' },
  { id: 4, name: 'Tari Ebimobowei', admissionNo: 'TMS/JS3/3029', email: 'tari.ebimobowei@tarepet.com', grade: 'JSS3', stream: 'General', house: 'Red House (Falcon)', status: 'ACTIVE', dob: '2010-11-05', gender: 'Female', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Ekeremor', address: '22 Amarata Street', parentName: 'Mr. Ebimobowei', parentPhone: '08034445566' },
  { id: 5, name: 'Emmanuel Adebayo', admissionNo: 'TMS/SS1/SCI/7281', email: 'emmanuel.adebayo@tarepet.com', grade: 'SS1', stream: 'Science', house: 'Blue House (Eagle)', status: 'ACTIVE', dob: '2009-07-19', gender: 'Male', country: 'Nigeria', stateOfOrigin: 'Oyo', lga: 'Ibadan North', address: '15 Kpansia Market Road', parentName: 'Pastor Adebayo', parentPhone: '08035556677' },
  { id: 6, name: 'Fatima Abubakar', admissionNo: 'TMS/SS1/ART/9104', email: 'fatima.abubakar@tarepet.com', grade: 'SS1', stream: 'Art', house: 'Purple House (Phoenix)', status: 'ACTIVE', dob: '2009-01-30', gender: 'Female', country: 'Nigeria', stateOfOrigin: 'Kano', lga: 'Kano Municipal', address: '3 Tombia Link Road', parentName: 'Alhaji Abubakar', parentPhone: '08036667788' },
  { id: 7, name: 'Buchi Nnamdi', admissionNo: 'TMS/SS2/SCI/6291', email: 'buchi.nnamdi@tarepet.com', grade: 'SS2', stream: 'Science', house: 'Green House (Jaguar)', status: 'ACTIVE', dob: '2008-08-12', gender: 'Male', country: 'Nigeria', stateOfOrigin: 'Abia', lga: 'Umuahia North', address: '7 Obele Estate', parentName: 'Chief Nnamdi', parentPhone: '08037778899' },
  { id: 8, name: 'Aisha Bello', admissionNo: 'TMS/SS2/ART/4810', email: 'aisha.bello@tarepet.com', grade: 'SS2', stream: 'Art', house: 'Red House (Falcon)', status: 'ACTIVE', dob: '2008-04-25', gender: 'Female', country: 'Nigeria', stateOfOrigin: 'Kaduna', lga: 'Zaria', address: '19 Etegwe Close', parentName: 'Mallam Bello', parentPhone: '08038889900' },
  { id: 9, name: 'Zainab Mohammed', admissionNo: 'TMS/SS3/SCI/8391', email: 'zainab.mohammed@tarepet.com', grade: 'SS3', stream: 'Science', house: 'Blue House (Eagle)', status: 'ACTIVE', dob: '2007-12-02', gender: 'Female', country: 'Nigeria', stateOfOrigin: 'Sokoto', lga: 'Sokoto North', address: '30 Azikoro Road', parentName: 'Dr. Mohammed', parentPhone: '08039990011' },
  { id: 10, name: 'David Danjuma', admissionNo: 'TMS/SS3/ART/2749', email: 'david.danjuma@tarepet.com', grade: 'SS3', stream: 'Art', house: 'Purple House (Phoenix)', status: 'ACTIVE', dob: '2007-06-18', gender: 'Male', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Yenagoa', address: '11 Ovom Street', parentName: 'Engr. Danjuma', parentPhone: '08030001122' },
];
const MOCK_SS_STUDENTS = MOCK_STUDENTS;
const MOCK_SUBJECTS: any[] = [
  { id: 1, code: 'MTH-001', title: 'Junior Mathematics', grade: 'JSS1', stream: 'General', teacher: 'Mr. Okonkwo Paul', studentsCount: 42 },
  { id: 2, code: 'ENG-001', title: 'English Language', grade: 'JSS1', stream: 'General', teacher: 'Mrs. Okafor Chioma', studentsCount: 42 },
  { id: 3, code: 'BSC-001', title: 'Basic Science', grade: 'JSS1', stream: 'General', teacher: 'Mrs. Okafor Chioma', studentsCount: 42 },
  { id: 4, code: 'BTC-001', title: 'Basic Technology', grade: 'JSS2', stream: 'General', teacher: 'Engr. Emeka David', studentsCount: 38 },
  { id: 5, code: 'CIV-001', title: 'Civic Education', grade: 'JSS2', stream: 'General', teacher: 'Dr. Grace Bassey', studentsCount: 38 },
  { id: 6, code: 'SOC-001', title: 'Social Studies', grade: 'JSS3', stream: 'General', teacher: 'Dr. Grace Bassey', studentsCount: 40 },
  { id: 7, code: 'ICT-001', title: 'Computer Studies / ICT', grade: 'JSS3', stream: 'General', teacher: 'Engr. Emeka David', studentsCount: 40 },
  { id: 11, code: 'MTH-101', title: 'Senior Mathematics', grade: 'SS1', stream: 'Science', teacher: 'Mr. Okonkwo Paul', studentsCount: 35 },
  { id: 12, code: 'PHY-101', title: 'Physics I', grade: 'SS1', stream: 'Science', teacher: 'Engr. Emeka David', studentsCount: 35 },
  { id: 13, code: 'CHM-101', title: 'Chemistry I', grade: 'SS1', stream: 'Science', teacher: 'Mrs. Okafor Chioma', studentsCount: 35 },
  { id: 14, code: 'ENG-101', title: 'English Language', grade: 'SS1', stream: 'Art', teacher: 'Dr. Grace Bassey', studentsCount: 28 },
  { id: 15, code: 'LIT-101', title: 'Literature in English', grade: 'SS1', stream: 'Art', teacher: 'Dr. Grace Bassey', studentsCount: 28 },
  { id: 16, code: 'MTH-201', title: 'Senior Mathematics II', grade: 'SS2', stream: 'Science', teacher: 'Mr. Okonkwo Paul', studentsCount: 32 },
  { id: 17, code: 'GOV-201', title: 'Government II', grade: 'SS2', stream: 'Art', teacher: 'Dr. Grace Bassey', studentsCount: 25 },
  { id: 18, code: 'MTH-301', title: 'Senior Mathematics III', grade: 'SS3', stream: 'Science', teacher: 'Mr. Okonkwo Paul', studentsCount: 30 },
  { id: 19, code: 'HIS-301', title: 'History III', grade: 'SS3', stream: 'Art', teacher: 'Dr. Grace Bassey', studentsCount: 22 },
];

const MOCK_HOUSES = [
  { name: 'Blue House (Eagle)', color: '#3B82F6', motto: 'Wisdom & Integrity', points: 520, students: 0, head: 'Mrs. Okafor Chioma' },
  { name: 'Purple House (Phoenix)', color: '#8B5CF6', motto: 'Royalty & Distinction', points: 510, students: 0, head: 'Mr. James Eze' },
  { name: 'Green House (Jaguar)', color: '#10B981', motto: 'Growth & Resilience', points: 480, students: 0, head: 'Ms. Adaobi' },
  { name: 'Red House (Falcon)', color: '#EF4444', motto: 'Passion & Determination', points: 450, students: 0, head: 'Mr. Bello' },
];

const MOCK_AUDIT_LOGS = [
  { id: 1, user: 'admin@tarepet.edu.ng', action: 'LOGIN', target: 'Auth System', ip: '127.0.0.1', timestamp: '2026-07-24 07:00:12', status: 'SUCCESS' },
  { id: 2, user: 'admin@tarepet.edu.ng', action: 'BULK_IMPORT', target: 'System Users', ip: '127.0.0.1', timestamp: '2026-07-24 07:02:48', status: 'SUCCESS' },
  { id: 3, user: 'teacher@tarepet.edu.ng', action: 'MARK_ATTENDANCE', target: 'SS1 Science Class', ip: '192.168.1.20', timestamp: '2026-07-24 08:05:00', status: 'SUCCESS' },
  { id: 4, user: 'admin@tarepet.edu.ng', action: 'AWARD_HOUSE_POINTS', target: 'Blue House Eagle (+25 pts)', ip: '127.0.0.1', timestamp: '2026-07-24 09:10:02', status: 'SUCCESS' },
  { id: 5, user: 'admin@tarepet.edu.ng', action: 'UPDATE_SETTINGS', target: 'School Config (Grading Schema)', ip: '127.0.0.1', timestamp: '2026-07-24 09:45:00', status: 'SUCCESS' },
];

const INITIAL_EXAMS: any[] = [];

// ── Sub-components ───────────────────────────────────────────
const MetricCard = ({
  label, value, sub, icon: Icon, color, trend
}: {
  label: string; value: string; sub?: string; icon: any;
  color: string; trend?: 'up' | 'down' | 'neutral';
}) => (
  <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <h3 className="text-2xl font-serif font-bold text-foreground mt-1 truncate">{value}</h3>
      {sub && (
        <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-muted-foreground'
        }`}>
          {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const SystemHealthBar = ({ label, value, unit, max = 100, color }: {
  label: string; value: number; unit: string; max?: number; color: string;
}) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="font-medium text-foreground">{label}</span>
      <span className={`font-bold ${color}`}>{value}{unit}</span>
    </div>
    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color.includes('emerald') ? 'bg-emerald-500' : color.includes('amber') ? 'bg-amber-500' : color.includes('blue') ? 'bg-blue-500' : 'bg-rose-500'}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

const RoleBadge = ({ role }: { role: string }) => {
  let safeClass = 'bg-muted text-muted-foreground border-border';
  switch (role) {
    case 'ADMIN':
      safeClass = 'bg-rose-500/10 text-rose-600 border-rose-200';
      break;
    case 'TEACHER':
      safeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      break;
    case 'STUDENT':
      safeClass = 'bg-blue-500/10 text-blue-600 border-blue-200';
      break;
    case 'PARENT':
      safeClass = 'bg-amber-500/10 text-amber-600 border-amber-200';
      break;
  }
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${safeClass}`}>
      {role}
    </span>
  );
};


const StudentIDModal = ({ student, onClose }: { student: any; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-foreground">{t('idCard.title')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6">
          <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 mb-4">
            <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">{t('idCard.schoolName')}</p>
                <p className="text-xs opacity-70">{t('idCard.location')}</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xs">{t('idCard.abbr')}</span>
              </div>
            </div>
            <div className="p-5 flex gap-5 items-center">
              <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-serif font-bold text-primary">{student.name[0]}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{student.name}</h4>
                <p className="text-xs text-muted-foreground font-medium mt-1">{student.grade || t('idCard.class')}</p>
                <p className="text-xs text-muted-foreground">{student.house || t('idCard.house')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t('idCard.studentId')}</span>
                    <p className="font-bold text-foreground">{student.admissionNo || t('idCard.sampleId')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('idCard.validUntil')}</span>
                    <p className="font-bold text-foreground">{t('idCard.validDate')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Printer className="w-4 h-4" /> Print ID Card
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkImportModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [rows] = useState([
    { email: 'chidi.nwosu@example.com', first_name: 'Chidi', last_name: 'Nwosu', role: 'STUDENT', grade_level: 'JSS2' },
    { email: 'amaka.okafor@example.com', first_name: 'Amaka', last_name: 'Okafor', role: 'STUDENT', grade_level: 'JSS1' },
    { email: 'tunde.adeyemi@example.com', first_name: 'Tunde', last_name: 'Adeyemi', role: 'TEACHER', grade_level: 'N/A' },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-foreground">{t('bulkImport.title')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {step === 'upload' && (
            <>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">{t('bulkImport.dropHint')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('bulkImport.requiredCols')}</p>
              </div>
              <button onClick={() => setStep('preview')} className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                {t('bulkImport.loadPreview')}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{rows.length} users detected in CSV</p>
                <span className="text-xs text-emerald-600 font-bold">✓ All rows valid</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wider">
                    <tr>
                      {['Email', 'First Name', 'Last Name', 'Role', 'Grade'].map(h => (
                        <th key={h} className="py-2 px-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="py-2 px-3 text-muted-foreground">{r.email}</td>
                        <td className="py-2 px-3 font-medium">{r.first_name}</td>
                        <td className="py-2 px-3 font-medium">{r.last_name}</td>
                        <td className="py-2 px-3"><RoleBadge role={r.role} /></td>
                        <td className="py-2 px-3 text-muted-foreground">{r.grade_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('done')} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  ✓ Import {rows.length} Users
                </button>
                <button onClick={() => setStep('upload')} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">
                  {t('bulkImport.back')}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h4 className="font-serif font-bold text-xl text-foreground mb-2">{t('bulkImport.importSuccess')}</h4>
              <p className="text-muted-foreground text-sm">3 users created · 0 skipped · 0 errors</p>
              <button onClick={onClose} className="mt-6 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                {t('bulkImport.done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AwardPointsModal = ({ house, onClose }: { house: any; onClose: () => void }) => {
  const { t } = useTranslation();
  const [pts, setPts] = useState('10');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        {!done ? (
          <>
            <h3 className="font-serif font-bold text-xl text-foreground mb-1">{t('housePoints.title')}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t('housePoints.awardingTo')}<strong>{house.name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('housePoints.pointsLabel')}</label>
                <input type="number" value={pts} onChange={e => setPts(e.target.value)} min="1" max="100"
                  className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary text-lg font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('housePoints.reasonLabel')}</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Won inter-house debate competition"
                  className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDone(true)} className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  {t('housePoints.awardBtn')}{pts} Points
                </button>
                <button onClick={onClose} className="border border-border px-4 py-3 rounded-xl text-sm hover:bg-accent transition-colors">{t('housePoints.cancel')}</button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🏆</div>
            <h4 className="font-serif font-bold text-xl text-foreground">{pts} Points Awarded!</h4>
            <p className="text-muted-foreground text-sm mt-1">{house.name} now has {house.points + parseInt(pts)} total points.</p>
            <button onClick={onClose} className="mt-5 bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">{t('housePoints.done')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ExamPreviewModal = ({ exam, onClose }: { exam: any; onClose: () => void }) => {
  const { t } = useTranslation();
  // Objective Multiple Choice Questions (A, B, C, D)
  const questions = exam.questions || [
    {
      num: 1,
      text: `Which of the following represents the primary theorem/rule applied in ${exam.subject || 'this course'}?`,
      options: ['Option A: Fundamental Principle I', 'Option B: Secondary Derivation II', 'Option C: Empirical Postulate III', 'Option D: Auxiliary Rule IV'],
      correct: 'Option A: Fundamental Principle I'
    },
    {
      num: 2,
      text: `In Montessori practical application, what is the main objective during ${exam.subject || 'this subject'} practical work?`,
      options: ['Option A: Theoretical memorization', 'Option B: Self-directed experiential learning', 'Option C: Group lectures', 'Option D: Rote repetition'],
      correct: 'Option B: Self-directed experiential learning'
    },
    {
      num: 3,
      text: `Identify the correct unit or standard formula used when calculating metrics in ${exam.subject || 'this topic'}:`,
      options: ['Option A: Formula X = a + b', 'Option B: Formula Y = m * c^2', 'Option C: Standard Metric Alpha', 'Option D: Derived Constant Beta'],
      correct: 'Option C: Standard Metric Alpha'
    },
    {
      num: 4,
      text: `Which scientist or scholar is credited with establishing the foundational theory of ${exam.subject || 'this domain'}?`,
      options: ['Option A: Dr. Maria Montessori', 'Option B: Isaac Newton', 'Option C: Albert Einstein', 'Option D: Michael Faraday'],
      correct: 'Option A: Dr. Maria Montessori'
    },
  ];

  const rules = exam.rules || [
    "All questions are 100% Objective Multiple Choice (A, B, C, D).",
    "Select your answers using the CBT computer terminal interface.",
    "Arrive at the exam venue at least 15 minutes before the start time.",
    "No mobile phones, smartwatches, or other unauthorized electronic devices allowed.",
    "Automatic timer submission is enforced when exam time expires.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-muted/20 rounded-t-3xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
              {exam.class} · {exam.stream} · Objective CBT
            </span>
            <h3 className="font-serif font-bold text-xl text-foreground mt-2">{exam.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t('examPreview.subject')}<span className="text-foreground font-semibold">{exam.subject}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/10 p-4 rounded-2xl border border-border/50">
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.date')}& Time</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.date}<br />{exam.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.duration')}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.duration}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.venue')}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.venue}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{t('examPreview.teacher')}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{exam.invigilator || 'Not Assigned'}</p>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-primary" /> Rules & Regulations
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
              {rules.map((rule: string, i: number) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Objective Questions Preview */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" /> {t('examPreview.objectiveTitle')}
            </h4>
            <div className="space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={i} className="p-4 border border-border rounded-xl bg-card hover:bg-muted/10 transition-colors space-y-2">
                  <p className="font-bold text-foreground">{t('examPreview.question')}{q.num || i + 1}:</p>
                  <p className="text-foreground leading-relaxed text-sm">{q.text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(q.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((opt: string, optIdx: number) => {
                      const OPTION_KEYS = new Map([[0, 'A'], [1, 'B'], [2, 'C'], [3, 'D']]);
                      const isCorrect = q.correct === opt || q.correct_option === OPTION_KEYS.get(optIdx);
                      return (
                        <div key={optIdx} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          isCorrect ? 'bg-emerald-500/10 border-emerald-300 text-emerald-800 font-bold' : 'bg-muted/30 border-border/60 text-muted-foreground'
                        }`}>
                          <span>{opt}</span>
                          {isCorrect && <span className="text-emerald-600">{t('examPreview.correct')}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-muted/10 rounded-b-3xl">
          <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            {t('examPreview.closePreview')}
          </button>
        </div>
      </div>
    </div>
  );
};


const CreateSubjectModal = ({ onClose, onCreated, defaultClass, defaultStream }: { onClose: () => void; onCreated: (sub: any) => void; defaultClass?: string; defaultStream?: string }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    code: 'BIO-201',
    title: 'Advanced Biology II',
    teacher: 'Mr. Okonkwo Paul',
    grade: defaultClass || 'SS2',
    stream: defaultStream || 'Science',
    category: 'STEM',
    enrolled: 25
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreated(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif font-bold text-xl text-foreground">{t('addSubject.title')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.codeLabel')}</label>
            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.nameLabel')}</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.instructorLabel')}</label>
            <input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.classLevel')}</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="SS1">{t('addSubject.ss1')}</option>
                <option value="SS2">{t('addSubject.ss2')}</option>
                <option value="SS3">{t('addSubject.ss3')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('addSubject.stream')}</label>
              <select value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Science">{t('addSubject.science')}</option>
                <option value="Art">{t('addSubject.art')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              {t('addSubject.addBtn')}
            </button>
            <button type="button" onClick={onClose} className="border border-border px-5 py-2.5 rounded-xl hover:bg-accent transition-colors">
              {t('addSubject.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AddUserModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', role: 'STUDENT', status: 'Active' });
  const [created, setCreated] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        <h3 className="font-serif font-bold text-xl text-foreground mb-4">{t('createUser.title')}</h3>
        {!created ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.fullName')}</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. Ngozi Eze" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.email')}</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. ngozi.eze@tarepet.edu.ng" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createUser.role')}</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="STUDENT">{t('createUser.student')}</option>
                <option value="TEACHER">{t('createUser.teacher')}</option>
                <option value="PARENT">{t('createUser.parent')}</option>
                <option value="ADMIN">{t('createUser.admin')}</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCreated(true)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">{t('createUser.createBtn')}</button>
              <button onClick={onClose} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">{t('createUser.cancel')}</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-lg">{t('createUser.created')}</h4>
            <p className="text-xs text-muted-foreground">{t('createUser.credentials')} & login instructions sent to {form.email}.</p>
            <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold mt-2">{t('createUser.done')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Create User For Type Modal ────────────────────────────────
const CreateUserForTypeModal = ({
  typeLabel, defaultRole, onClose, onCreated
}: {
  typeLabel: string;
  defaultRole: string;
  onClose: () => void;
  onCreated: (user: any) => void;
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    subject: '',
    department: '',
    staffId: '',
    grade: '',
  });
  const [created, setCreated] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    setCreated(true);
    onCreated({ name: form.name, email: form.email, role: defaultRole === 'STAFF' ? 'PARENT' : defaultRole });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {!created ? (
          <>
            <div className="mb-5">
              <h3 className="font-serif font-bold text-xl text-foreground">{t('createStaff.createNew')}{typeLabel.replace(/s$/, '')} Account</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('createStaff.fillDetails')}</p>
            </div>

            <div className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.fullName')}<span className="text-rose-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mrs. Ngozi Okafor"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.email')}<span className="text-rose-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ngozi@tarepet.edu.ng"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 801 234 5678"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.dob')}</label>
                  <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Role-specific fields */}
              {defaultRole === 'TEACHER' && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.subjectsTaught')}</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Montessori Mathematics, Agronomy"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
              {defaultRole === 'STAFF' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.department')}</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">{t('createStaff.selectDept')}</option>
                      <option>{t('createStaff.administration')}</option>
                      <option>{t('createStaff.library')}</option>
                      <option>{t('createStaff.security')}</option>
                      <option>{t('createStaff.kitchen')}</option>
                      <option>{t('createStaff.maintenance')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.staffId')}</label>
                    <input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}
                      placeholder="e.g. STF-2026-001"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}
              {defaultRole === 'ADMIN' && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.adminRole')}</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t('createStaff.selectRole')}</option>
                    <option>{t('createStaff.principal')}</option>
                    <option>{t('createStaff.vicePrincipal')}</option>
                    <option>{t('createStaff.hod')}</option>
                    <option>{t('createStaff.platformAdmin')}</option>
                    <option>{t('createStaff.registrar')}</option>
                  </select>
                </div>
              )}
              {defaultRole === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.gradeLevel')}</label>
                    <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">{t('createStaff.selectGrade')}</option>
                      <option>{t('createStaff.jss1')}</option><option>{t('createStaff.jss2')}</option><option>{t('createStaff.jss3')}</option>
                      <option>{t('createStaff.shs1')}</option><option>{t('createStaff.shs2')}</option><option>{t('createStaff.shs3')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('createStaff.houseAssignment')}</label>
                    <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>{t('createStaff.autoAssign')}</option>
                      <option>{t('createStaff.blueHouse')}</option>
                      <option>{t('createStaff.purpleHouse')}</option>
                      <option>{t('createStaff.greenHouse')}</option>
                      <option>{t('createStaff.redHouse')}</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="bg-muted/20 border border-border rounded-xl p-3 text-xs text-muted-foreground">
                🔒 A temporary password will be auto-generated and emailed to the user. They'll be prompted to change it on first login.
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  {t('createStaff.createAccount')}
                </button>
                <button onClick={onClose} className="border border-border px-5 py-3 rounded-xl text-sm hover:bg-accent transition-colors">
                  {t('createStaff.cancel')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h4 className="font-serif font-bold text-foreground text-xl">{t('createStaff.accountCreated')}</h4>
            <p className="text-sm text-muted-foreground">
              <strong>{form.name}</strong> has been added to {typeLabel}.<br />
              Login credentials have been sent to <strong>{form.email}</strong>.
            </p>
            <button onClick={onClose} className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors mt-2">
              {t('createStaff.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('overview');
  const [userSubPage, setUserSubPage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState('');
  const [idCardUser, setIdCardUser] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCreateForType, setShowCreateForType] = useState(false);
  const [awardHouse, setAwardHouse] = useState<any>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [usersList, setUsersList] = useState(MOCK_USERS);
  const [studentsList, setStudentsList] = useState(MOCK_STUDENTS);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    grade: 'JSS1',
    stream: 'General',
    country: 'Nigeria',
    stateOfOrigin: 'Bayelsa',
    lga: 'Yenagoa',
    address: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    profileImage: '',
  });
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  // Student class drill-down
  const [selectedClass, setSelectedClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedStream, setSelectedStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openClassDropdown, setOpenClassDropdown] = useState<string | null>(null); // which class card has dropdown open
  const [examsList, setExamsList] = useState(INITIAL_EXAMS);
  const [previewExam, setPreviewExam] = useState<any>(null);

  // Manage exams drill-down state
  const [selectedExamClass, setSelectedExamClass] = useState<string | null>(null);   // 'SS1' | 'SS2' | 'SS3'
  const [selectedExamStream, setSelectedExamStream] = useState<string | null>(null); // 'Science' | 'Art'
  const [openExamClassDropdown, setOpenExamClassDropdown] = useState<string | null>(null); // dropdown toggle
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);    // 'Test' | 'Exam' | 'All'
  const [examRepoFilter, setExamRepoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Manage subjects drill-down state
  const [selectedSubjectClass, setSelectedSubjectClass] = useState<string | null>(null);
  const [selectedSubjectStream, setSelectedSubjectStream] = useState<string | null>(null);
  const [openSubjectClassDropdown, setOpenSubjectClassDropdown] = useState<string | null>(null);
  const [showSubjectsActionsDropdown, setShowSubjectsActionsDropdown] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [subjectsListState, setSubjectsListState] = useState(MOCK_SUBJECTS);
  const [selectedSubjectPreview, setSelectedSubjectPreview] = useState<any>(null);
  const [settingsTab, setSettingsTab] = useState<'general' | 'academic' | 'security' | 'database'>('general');

  const syncAdminExams = () => {
    const stored = getStoredExams();
    const mapped = stored.map(e => ({
      id: e.id,
      title: e.title,
      type: e.assessment_type === 'TEST' ? 'Test' : 'Exam',
      subject: e.course_name || e.course_code,
      class: e.class || 'SS1',
      stream: e.stream === 'Arts' || e.stream === 'Art' ? 'Art' : 'Science',
      date: new Date(e.created_at).toISOString().split('T')[0],
      time: '09:00',
      duration: `${e.duration_minutes} mins`,
      questionsCount: e.questions_count || e.questions?.length || 0,
      venue: 'CBT Hall A',
      status: e.status === 'APPROVED' ? 'Approved' : e.status === 'REJECTED' ? 'Rejected' : e.status === 'ACTIVE' ? 'Approved' : 'Pending Approval',
      invigilator: e.teacher_name || 'Mrs. Okafor Chioma',
      totalCandidates: 25,
      questions: e.questions,
    }));
    setExamsList(mapped);
  };

  React.useEffect(() => {
    syncAdminExams();
    const unsub = subscribeToCBTStore(syncAdminExams);
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (activeSection === 'users') {
      setUserSubPage('STUDENT');
    } else {
      setUserSubPage(null); setSelectedUser(null);
      setSelectedClass(null); setSelectedStream(null); setOpenClassDropdown(null);
    }
    if (activeSection !== 'courses') {
      setSelectedSubjectClass(null); setSelectedSubjectStream(null); setOpenSubjectClassDropdown(null);
      setSelectedSubjectPreview(null);
      setShowSubjectsActionsDropdown(false);
    }
    if (activeSection !== 'exams') {
      setSelectedExamClass(null); setSelectedExamStream(null);
      setOpenExamClassDropdown(null); setSelectedExamType(null);
      setExamRepoFilter('all');
    }
  }, [activeSection]);
  React.useEffect(() => {
    if (!userSubPage) {
      setSelectedUser(null);
      setSelectedClass(null); setSelectedStream(null); setOpenClassDropdown(null);
    }
  }, [userSubPage]);
  React.useEffect(() => {
    if (!selectedClass) { setSelectedStream(null); setOpenClassDropdown(null); }
  }, [selectedClass]);

  const filteredUsers = (role: string) =>
    usersList.filter(u => {
      const q = userSearch.toLowerCase();
      return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && u.role === role;
    });

  // SS student filter by class + stream
  const filteredSSStudents = studentsList.filter(s => {
    const q = userSearch.toLowerCase();
    const matchClass  = !selectedClass  || s.grade  === selectedClass;
    const matchStream = !selectedStream || s.stream === selectedStream;
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
    return matchClass && matchStream && matchSearch;
  });

  const STUDENT_CLASSES = [
    { label: 'JSS 1', key: 'JSS1', hasStreams: false, color: 'border-blue-500/30 bg-blue-500/5', iconBg: 'bg-blue-500/10 text-blue-600', accent: 'text-blue-600',
      totalCount: studentsList.filter(s => s.grade === 'JSS1').length },
    { label: 'JSS 2', key: 'JSS2', hasStreams: false, color: 'border-indigo-500/30 bg-indigo-500/5', iconBg: 'bg-indigo-500/10 text-indigo-600', accent: 'text-indigo-600',
      totalCount: studentsList.filter(s => s.grade === 'JSS2').length },
    { label: 'JSS 3', key: 'JSS3', hasStreams: false, color: 'border-teal-500/30 bg-teal-500/5', iconBg: 'bg-teal-500/10 text-teal-600', accent: 'text-teal-600',
      totalCount: studentsList.filter(s => s.grade === 'JSS3').length },
    { label: 'SS 1', key: 'SS1', hasStreams: true, color: 'border-primary/30 bg-primary/5', iconBg: 'bg-primary/10 text-primary', accent: 'text-primary',
      sciCount: studentsList.filter(s => s.grade === 'SS1' && s.stream === 'Science').length,
      artCount: studentsList.filter(s => s.grade === 'SS1' && s.stream === 'Art').length },
    { label: 'SS 2', key: 'SS2', hasStreams: true, color: 'border-secondary/30 bg-secondary/5', iconBg: 'bg-secondary/10 text-secondary', accent: 'text-secondary',
      sciCount: studentsList.filter(s => s.grade === 'SS2' && s.stream === 'Science').length,
      artCount: studentsList.filter(s => s.grade === 'SS2' && s.stream === 'Art').length },
    { label: 'SS 3', key: 'SS3', hasStreams: true, color: 'border-amber-500/30 bg-amber-500/5', iconBg: 'bg-amber-500/10 text-amber-600', accent: 'text-amber-600',
      sciCount: studentsList.filter(s => s.grade === 'SS3' && s.stream === 'Science').length,
      artCount: studentsList.filter(s => s.grade === 'SS3' && s.stream === 'Art').length },
  ];
  const SS_CLASSES = STUDENT_CLASSES;

  const filteredLogs = MOCK_AUDIT_LOGS.filter(l =>
    l.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(auditSearch.toLowerCase())
  );

  // Exam status filter — must live at component level (Rules of Hooks)
  const [examFilterStatus, setExamFilterStatus] = useState<string>('All');

  // ── User type definitions (FA icons) ──────────────────────
  const USER_TYPES = [
    {
      key: 'TEACHER',
      label: 'Teaching Staff',
      description: 'Subject teachers and class educators responsible for delivering Montessori curriculum.',
      Icon: FaChalkboardUser,
      color: 'border-emerald-200 bg-emerald-500/5',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      accentColor: 'text-emerald-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
      count: usersList.filter(u => u.role === 'TEACHER').length,
      formRole: 'TEACHER',
    },
    {
      key: 'STAFF',
      label: 'Non-Teaching Staff',
      description: 'Administrative assistants, security, librarians, kitchen & maintenance staff.',
      Icon: FaBriefcase,
      color: 'border-blue-200 bg-blue-500/5',
      iconBg: 'bg-blue-500/10 text-blue-600',
      accentColor: 'text-blue-600',
      badgeColor: 'bg-blue-500/10 text-blue-600',
      count: usersList.filter(u => u.role === 'PARENT').length,
      formRole: 'STAFF',
    },
    {
      key: 'ADMIN',
      label: 'Administrators',
      description: 'School principal, vice principals, heads of departments and platform administrators.',
      Icon: FaUserShield,
      color: 'border-rose-200 bg-rose-500/5',
      iconBg: 'bg-rose-500/10 text-rose-600',
      accentColor: 'text-rose-600',
      badgeColor: 'bg-rose-500/10 text-rose-600',
      count: usersList.filter(u => u.role === 'ADMIN').length,
      formRole: 'ADMIN',
    },
  ];

  const activeType = USER_TYPES.find(t => t.key === userSubPage);

  const renderSection = () => {
    // 1. OVERVIEW & SCHOOL EXECUTIVE ANALYTICS
    if (activeSection === 'overview' || activeSection === 'analytics') {
      const classPerformanceData = [
        { class: 'JS 1', score: 78 },
        { class: 'JS 2', score: 82 },
        { class: 'JS 3', score: 85 },
        { class: 'SS 1', score: 88 },
        { class: 'SS 2', score: 84 },
        { class: 'SS 3', score: 91 },
      ];

      const weeklyAttendanceData = [
        { day: 'Mon', attendance: 95 },
        { day: 'Tue', attendance: 98 },
        { day: 'Wed', attendance: 94 },
        { day: 'Thu', attendance: 96 },
        { day: 'Fri', attendance: 97 },
      ];

      const quickActionButtons = [
        { label: 'Add Student', icon: UserPlus, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => { setActiveSection('users'); setUserSubPage('STUDENT'); } },
        { label: 'Add Teacher', icon: GraduationCap, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20', action: () => { setActiveSection('users'); setUserSubPage('TEACHER'); } },
        { label: 'Create Announcement', icon: Megaphone, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => setActiveSection('announcements') },
        { label: 'Upload Results', icon: FileSpreadsheet, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20', action: () => setActiveSection('results') },
        { label: 'View Attendance', icon: CalendarCheck, color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20', action: () => setActiveSection('attendance') },
        { label: 'Generate Reports', icon: BarChart2, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20', action: () => setActiveSection('reports') },
      ];

      const recentActivities = [
        { text: 'New student registered', detail: 'John Doe enrolled in SS1 Science', time: '10 mins ago', icon: UserPlus, color: 'text-primary bg-primary/10' },
        { text: 'Teacher submitted results', detail: 'Mathematics Second Term Continuous Assessment', time: '45 mins ago', icon: FileText, color: 'text-secondary bg-secondary/10' },
        { text: 'Attendance updated', detail: 'SS2 Class Attendance marked at 98% presence', time: '2 hours ago', icon: CalendarCheck, color: 'text-amber-600 bg-amber-500/10' },
        { text: 'New announcement published', detail: 'Mid-Term Exam Timetable released to parents', time: '4 hours ago', icon: Megaphone, color: 'text-primary bg-primary/10' },
      ];

      const upcomingEvents = [
        { title: 'Mid-Term Examination', date: 'Oct 15 - Oct 20, 2026', scope: 'All Classes', badgeColor: 'bg-primary/10 text-primary border-primary/20' },
        { title: 'Parents Meeting', date: 'Oct 24, 2026', scope: 'School Auditorium', badgeColor: 'bg-secondary/10 text-secondary border-secondary/20' },
        { title: 'Sports Competition', date: 'Nov 05, 2026', scope: 'Main Sports Field', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200' },
      ];

      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          {/* Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-xl text-foreground mb-1">{t('dashboard.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('dashboard.welcome')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 2025/2026 Academic Session
              </span>
            </div>
          </div>

          {/* 4 Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Students */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.totalStudents')}</p>
                <h3 className="text-3xl font-bold text-foreground">385</h3>
                <p className="text-[11px] text-secondary font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% from last term
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Teachers */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.teachers')}</p>
                <h3 className="text-3xl font-bold text-foreground">28</h3>
                <p className="text-[11px] text-muted-foreground font-medium">{t('dashboard.fullTimeFaculty')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Classes */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.classes')}</p>
                <h3 className="text-3xl font-bold text-foreground">12</h3>
                <p className="text-[11px] text-muted-foreground font-medium">{t('dashboard.junior')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <School className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Attendance Today */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboard.attendanceToday')}</p>
                <h3 className="text-3xl font-bold text-secondary">96%</h3>
                <p className="text-[11px] text-muted-foreground font-medium">{t('dashboard.dailyAverage')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row (Bar + Line) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Class Performance */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">{t('dashboard.classPerformance')}</h3>
                  <p className="text-xs text-muted-foreground">{t('dashboard.classPerformanceDesc')}</p>
                </div>
                <span className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <BarChart2 className="w-4 h-4" />
                </span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="class" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(val: any) => [`${val}%`, 'Average Score']}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart: Weekly Attendance */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">{t('dashboard.weeklyAttendance')}</h3>
                  <p className="text-xs text-muted-foreground">{t('dashboard.weeklyAttendanceDesc')}</p>
                </div>
                <span className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} domain={[80, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(val: any) => [`${val}%`, 'Attendance']}
                    />
                    <Line type="monotone" dataKey="attendance" stroke="#0F8A3D" strokeWidth={3} dot={{ r: 5, fill: '#0F8A3D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Quick Actions, Recent Activities & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Quick Actions */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-base text-foreground">{t('dashboard.quickActions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActionButtons.map((btn, idx) => {
                  const Icon = btn.icon;
                  return (
                    <button
                      key={idx}
                      onClick={btn.action}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 space-y-2 ${btn.color}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold leading-tight">{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Recent Activities */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">{t('dashboard.recentActivities')}</h3>
                <span className="text-xs text-muted-foreground">{t('dashboard.today')}</span>
              </div>
              <div className="space-y-3">
                {recentActivities.map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                      <div className={`p-2 rounded-xl shrink-0 ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{act.text}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{act.detail}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{act.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Upcoming Events */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">{t('dashboard.upcomingEvents')}</h3>
                <button onClick={() => setActiveSection('calendar')} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  {t('common.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((evt, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">{evt.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}>
                        {evt.scope}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> {evt.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. USER MANAGEMENT — Overview → Type List → Profile
    if (activeSection === 'users') {


      // ── LEVEL S1: Student class picker (JSS1 - SS3) ─────────
      if ((!userSubPage || userSubPage === 'STUDENT') && !selectedClass && !selectedUser) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground font-semibold">{t('students.selectClass')}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{t('students.juniorSenior')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('students.selectInstruction')}</p>
              </div>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setNewStudentForm({
                    name: '', dob: '', gender: 'Male', grade: 'JSS1', stream: 'General', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Yenagoa', address: '', phone: '', parentName: '', parentPhone: '', profileImage: ''
                  });
                  setShowAddStudentModal(true);
                }}
                className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-4 h-4" /> {t('students.addStudent')}
              </button>
            </div>

            {/* Summary bar */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-6 items-center">
              <div className="text-center">
                <p className="text-2xl font-serif font-bold text-foreground">{studentsList.length}</p>
                <p className="text-[10px] text-muted-foreground">{t('students.totalStudents')}</p>
              </div>
              {STUDENT_CLASSES.map(c => {
                const count = c.hasStreams ? (c.sciCount! + c.artCount!) : c.totalCount!;
                return (
                  <div key={c.key} className="text-center">
                    <p className={`text-xl font-serif font-bold ${c.accent}`}>{count}</p>
                    <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Class Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {STUDENT_CLASSES.map(cls => {
                const totalStudents = cls.hasStreams ? (cls.sciCount! + cls.artCount!) : cls.totalCount!;
                return (
                  <div key={cls.key} className="relative">
                    {/* Card */}
                    <button
                      onClick={() => {
                        if (!cls.hasStreams) {
                          setSelectedClass(cls.key);
                          setSelectedStream(null);
                          setOpenClassDropdown(null);
                        } else {
                          setOpenClassDropdown(prev => prev === cls.key ? null : cls.key);
                        }
                      }}
                      className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${cls.color} ${openClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                          {totalStudents} {t('students.title')}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                      {cls.hasStreams ? (
                        <div className="flex gap-4 text-xs mt-2">
                          <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{cls.sciCount}</strong></span>
                          <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{cls.artCount}</strong></span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{t('students.generalCurriculum')}</p>
                      )}
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                        <span>{cls.hasStreams ? t('students.chooseStream') : t('students.viewProfile')}</span>
                        {cls.hasStreams ? (
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Stream Dropdown for SS classes */}
                    {cls.hasStreams && openClassDropdown === cls.key && (
                      <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                        <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
                        <button
                          onClick={() => { setSelectedClass(cls.key); setSelectedStream('Science'); setOpenClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FlaskConical className="w-4 h-4" />
                          </span>
                          {t('addSubject.science')}
                          <span className="ml-auto text-xs text-muted-foreground">{cls.sciCount} {t('students.title').toLowerCase()}</span>
                        </button>
                        <button
                          onClick={() => { setSelectedClass(cls.key); setSelectedStream('Art'); setOpenClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <Palette className="w-4 h-4" />
                          </span>
                          {t('addSubject.art')}
                          <span className="ml-auto text-xs text-muted-foreground">{cls.artCount} {t('students.title').toLowerCase()}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // ── LEVEL S2: Class student roster view ─────────────────
      if (userSubPage === 'STUDENT' && selectedClass && (!STUDENT_CLASSES.find(c => c.key === selectedClass)?.hasStreams || selectedStream) && !selectedUser) {
        const cls = STUDENT_CLASSES.find(c => c.key === selectedClass)!;
        return (
          <div className="space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setSelectedClass(null); setSelectedStream(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('students.selectClass')}
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{cls.label} {selectedStream ? `(${selectedStream})` : ''}</span>
            </div>

            {/* Header + toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{cls.label} {selectedStream ? `— ${selectedStream}` : 'Student Roster'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredSSStudents.length} students found</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setNewStudentForm({
                      name: '', dob: '', gender: 'Male', grade: cls.key, stream: selectedStream || 'General', country: 'Nigeria', stateOfOrigin: 'Bayelsa', lga: 'Yenagoa', address: '', phone: '', parentName: '', parentPhone: '', profileImage: ''
                    });
                    setShowAddStudentModal(true);
                  }}
                  className="px-3.5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> {t('students.addStudent')}
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
                </div>
              </div>
            </div>

            {/* Student table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t('students.fullNameCol')}</th>
                    <th className="py-3 px-4">{t('students.admissionNoCol')}</th>
                    <th className="py-3 px-4">{t('students.classStreamCol')}</th>
                    <th className="py-3 px-4">{t('students.houseCol')}</th>
                    <th className="py-3 px-4">{t('students.statusCol')}</th>
                    <th className="py-3 px-4 text-right">{t('students.actionCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSSStudents.length > 0 ? filteredSSStudents.map(s => (
                    <tr key={s.id}
                      onClick={() => setSelectedUser(s)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${cls.iconBg}`}>
                            {s.profileImage ? (
                              <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                            ) : s.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground font-mono">{s.studentId}</td>
                      <td className="py-4 px-4 text-muted-foreground">{s.house}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          {t('students.viewProfile')} <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{t('students.noStudents')}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // ── LEVEL 3: Individual Student Profile Page ──────────────────────
      if (selectedUser) {
        const u = selectedUser;

        return (
          <div className="space-y-6">
            {/* Breadcrumb back */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium">
                <ChevronLeft className="w-4 h-4" /> {t('students.backToClasses')}
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{t('studentProfile.breadcrumb')}{u.name}</span>
            </div>

            {/* Profile Specification Card (Exact Match to User Reference Image) */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header Actions Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('studentProfile.cardTitle')}</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsDropdown(prev => !prev)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                  >
                    {t('studentProfile.actions')}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showActionsDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 py-1.5 text-xs divide-y divide-border">
                      <div className="py-1">
                        <button onClick={() => { setIdCardUser(u); setShowActionsDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-muted/50 flex items-center gap-2 font-medium">
                          <FaIdCard className="w-3.5 h-3.5 text-primary" /> {t('studentProfile.generateIdCard')}
                        </button>
                        <button onClick={() => {
                          setNewStudentForm({
                            name: u.name || '',
                            dob: u.dob || '',
                            gender: u.gender || 'Male',
                            grade: u.grade || 'JSS1',
                            stream: u.stream || 'General',
                            country: u.country || 'Nigeria',
                            stateOfOrigin: u.stateOfOrigin || 'Bayelsa',
                            lga: u.lga || 'Yenagoa',
                            address: u.address || '',
                            phone: u.phone || '',
                            parentName: u.parentName || '',
                            parentPhone: u.parentPhone || '',
                            profileImage: u.profileImage || '',
                          });
                          setWizardStep(1);
                          setShowAddStudentModal(true);
                          setShowActionsDropdown(false);
                        }} className="w-full text-left px-4 py-2 hover:bg-muted/50 flex items-center gap-2 font-medium">
                          <FaPen className="w-3.5 h-3.5 text-muted-foreground" /> {t('studentProfile.editProfile')}
                        </button>
                      </div>
                      <div className="py-1">
                        <button onClick={() => {
                          if (confirm(`Are you sure you want to delete student "${u.name}"?`)) {
                            setStudentsList(prev => prev.filter(s => s.id !== u.id));
                            setSelectedUser(null);
                          }
                          setShowActionsDropdown(false);
                        }} className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 font-medium">
                          <FaTrash className="w-3.5 h-3.5 text-rose-500" /> {t('studentProfile.deleteStudent')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3-Column Specification Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
                {/* Column 1: Student Photo */}
                <div className="md:col-span-3 flex flex-col items-center">
                  <div className="w-44 h-52 rounded-xl border-2 border-border shadow-md overflow-hidden bg-muted/20 flex items-center justify-center">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-4xl font-serif font-bold text-primary">
                        {u.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                    {t('common.status')} {u.status || 'Active'}
                  </span>
                </div>

                {/* Column 2: Personal Identifiers */}
                <div className="md:col-span-4 space-y-3.5 text-xs leading-relaxed">
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.studentIdLabel')}</span>
                    <strong className="text-foreground font-mono font-bold text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded border border-primary/20">
                      {u.admissionNo || generateAdmissionNumber(u.grade || 'JSS1', u.stream)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.nameLabel')}</span>
                    <strong className="text-foreground font-bold text-sm uppercase">{u.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.genderLabel')}</span>
                    <strong className="text-foreground font-bold">{u.gender || 'Male'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.maritalStatus')}</span>
                    <strong className="text-foreground font-bold">{t('studentProfile.single')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.dobLabel')}</span>
                    <strong className="text-foreground font-bold">{u.dob || '2004-10-22'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.phoneLabel')}</span>
                    <strong className="text-foreground font-bold">{u.phone || 'Not Available'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.countryLabel')}</span>
                    <strong className="text-foreground font-bold">{u.country || 'Nigeria'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.stateLabel')}</span>
                    <strong className="text-foreground font-bold">{u.stateOfOrigin || 'Bayelsa'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.lgaLabel')}</span>
                    <strong className="text-foreground font-bold">{u.lga || 'Yenagoa'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.emailLabel')}</span>
                    <strong className="text-foreground font-bold underline">{u.email}</strong>
                  </div>
                </div>

                {/* Column 3: Academic & Guardian Information */}
                <div className="md:col-span-5 space-y-3.5 text-xs leading-relaxed border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.addressLabel')}</span>
                    <strong className="text-foreground font-bold">{u.address || 'Azikoro village, Yenagoa, Bayelsa State'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.classLabel')}</span>
                    <strong className="text-foreground font-bold">
                      {u.grade ? `${u.grade} ${u.stream ? `(${u.stream} Stream)` : ''}` : 'JSS 1'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.programmeLabel')}</span>
                    <strong className="text-foreground font-bold">
                      {u.grade && u.grade.startsWith('SS') ? 'Senior Secondary Certificate (SSCE)' : 'Basic Education Certificate (BECE)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.parentNameLabel')}</span>
                    <strong className="text-foreground font-bold">{u.parentName || 'Ayaebi Dimaro'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.statusLabel')}</span>
                    <strong className="text-emerald-600 font-bold">{t('studentProfile.active')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">{t('studentProfile.studyModeLabel')}</span>
                    <strong className="text-foreground font-bold">{t('studentProfile.fullTime')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── LEVEL 2: User type list (clickable rows) ───────────────
      if (userSubPage && activeType) {
        const usersForType = filteredUsers(activeType.key === 'STAFF' ? 'PARENT' : activeType.key);
        const TypeIcon = activeType.Icon;
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setUserSubPage(null); setUserSearch(''); }}
                className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium">
                <ChevronLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${activeType.iconBg}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-foreground">{activeType.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeType.description}</p>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder={`Search ${activeType.label.toLowerCase()}...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={() => setShowBulkImport(true)}
                className="bg-secondary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-secondary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <Upload className="w-4 h-4" /> Bulk CSV
              </button>
              <button onClick={() => setShowCreateForType(true)}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Add {activeType.label.replace(/s$/, '')}
              </button>
            </div>

            {/* Clickable table — NO actions column */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t('userList.fullName')}</th>
                    <th className="py-3 px-4">{t('userList.email')}</th>
                    <th className="py-3 px-4">{t('userList.dateJoined')}</th>
                    <th className="py-3 px-4">{t('userList.status')}</th>
                    <th className="py-3 px-4 text-right text-[10px]">{t('userList.clickToView')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersForType.length > 0 ? usersForType.map(u => (
                    <tr key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${activeType.badgeColor}`}>
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.phone ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-4 px-4 text-muted-foreground">{u.joined}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>{u.status}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          {t('userList.viewProfile')} <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{t('userList.noUser')}{activeType.label.toLowerCase()} found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showCreateForType && activeType && (
              <CreateUserForTypeModal
                typeLabel={activeType.label}
                defaultRole={activeType.formRole}
                onClose={() => setShowCreateForType(false)}
                onCreated={(newUser: any) => {
                  setUsersList(prev => [...prev, { ...newUser, id: prev.length + 1, status: 'Active', joined: '2026-07-24', lastLogin: '2026-07-24', phone: '', location: '' }]);
                  setShowCreateForType(false);
                }}
              />
            )}
          </div>
        );
      }

    }

    // 3-EX. MANAGE EXAMS
    if (activeSection === 'exams') {
      const EXAM_STATUSES = ['Pending Approval', 'Approved', 'Ongoing', 'Completed', 'Cancelled', 'Rejected'] as const;
      type ExamStatus = typeof EXAM_STATUSES[number];

      const statusColor = (s: ExamStatus) => {
        switch (s) {
          case 'Pending Approval': return 'bg-amber-500/10 text-amber-600 border-amber-200';
          case 'Approved':         return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
          case 'Ongoing':          return 'bg-secondary/10 text-secondary border-secondary/20';
          case 'Completed':        return 'bg-muted text-muted-foreground border-border';
          case 'Cancelled':        return 'bg-rose-500/10 text-rose-600 border-rose-200';
          case 'Rejected':         return 'bg-red-500/10 text-red-600 border-red-200';
        }
      };

      const handleApprove = (id: number) => {
        updateExamStatus(id, 'APPROVED');
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
      };

      const handleReject = (id: number) => {
        updateExamStatus(id, 'REJECTED', 'Returned by Administrator');
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
      };

      const handleCancel = (id: number) => {
        updateExamStatus(id, 'REJECTED', 'Cancelled by Administrator');
        setExamsList(prev => prev.map(e => e.id === id ? { ...e, status: 'Cancelled' } : e));
      };

      const counts = {
        total:     examsList.length,
        pending:   examsList.filter(e => e.status === 'Pending Approval').length,
        approved:  examsList.filter(e => e.status === 'Approved').length,
        rejected:  examsList.filter(e => e.status === 'Rejected').length,
        ongoing:   examsList.filter(e => e.status === 'Ongoing').length,
      };

      // Helper to render exam card grid
      const renderExamCardsGrid = (exams: typeof examsList) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.length > 0 ? exams.map(exam => (
            <div key={exam.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {exam.type || 'Exam'}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">{exam.subject}</span>
                  </div>
                  <h3 className="font-serif font-bold text-foreground text-base leading-snug">{exam.title}</h3>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor(exam.status as ExamStatus)}`}>
                  {exam.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.date} · {exam.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.duration} ({exam.questionsCount || 30} Qs)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{exam.totalCandidates} Candidates</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{exam.class}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  exam.stream === 'Science' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                }`}>{exam.stream}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{t('exams.invigilator')}<strong className="text-foreground">{exam.invigilator}</strong></span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border items-center">
                <button
                  onClick={() => setPreviewExam(exam)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-border hover:bg-muted/40 transition-colors text-foreground"
                >
                  <FileText className="w-3.5 h-3.5" /> {t('exams.preview')}
                </button>

                {exam.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => handleApprove(exam.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('exams.approve')}
                    </button>
                    <button
                      onClick={() => handleReject(exam.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> {t('exams.reject')}
                    </button>
                  </>
                )}

                {exam.status === 'Approved' && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 ml-auto">
                    <CheckCircle2 className="w-4 h-4" /> Approved for CBT
                  </span>
                )}
                {exam.status === 'Rejected' && (
                  <button
                    onClick={() => handleApprove(exam.id)}
                    className="text-xs font-bold text-rose-600 hover:underline ml-auto"
                  >
                    {t('exams.reApprove')}
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-2 py-16 text-center bg-card rounded-2xl border border-border">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{t('exams.noExams')}</p>
            </div>
          )}
        </div>
      );

      // STEP 1: CLASS SELECTION CARDS (SS1, SS2, SS3)
      if (!selectedExamClass || !selectedExamStream) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{t('exams.manageExams')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('exams.selectCardDesc')}</p>
              </div>

              {/* Status Repository Filter Badges */}
              <div className="flex gap-2 flex-wrap text-xs font-bold">
                <button
                  onClick={() => { setExamRepoFilter('all'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted/40'}`}
                >
                  {t('exams.allFilter')}{counts.total})
                </button>
                <button
                  onClick={() => { setExamRepoFilter('pending'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'pending' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20'}`}
                >
                  ⏳ Pending ({counts.pending})
                </button>
                <button
                  onClick={() => { setExamRepoFilter('approved'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20'}`}
                >
                  ✅ Approved ({counts.approved})
                </button>
                <button
                  onClick={() => { setExamRepoFilter('rejected'); }}
                  className={`px-3.5 py-2 rounded-xl border transition-colors ${examRepoFilter === 'rejected' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-500/10 text-rose-700 border-rose-200 hover:bg-rose-500/20'}`}
                >
                  ❌ Rejected ({counts.rejected})
                </button>
              </div>
            </div>

            {/* Direct Status Repository View (When a filter repository is selected) */}
            {examRepoFilter !== 'all' && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
                  <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
                    {examRepoFilter === 'pending' && '⏳ Pending Approval Repository'}
                    {examRepoFilter === 'approved' && '✅ Approved Exams & Tests Repository'}
                    {examRepoFilter === 'rejected' && '❌ Rejected Exams & Tests Repository'}
                  </h3>
                  <button onClick={() => setExamRepoFilter('all')} className="text-xs font-bold text-primary hover:underline">
                    {t('exams.backToDrilldown')}
                  </button>
                </div>
                {renderExamCardsGrid(examsList.filter(e => {
                  if (examRepoFilter === 'pending') return e.status === 'Pending Approval';
                  if (examRepoFilter === 'approved') return e.status === 'Approved';
                  if (examRepoFilter === 'rejected') return e.status === 'Rejected';
                  return true;
                }))}
              </div>
            )}

            {/* 3 Class Cards: SS1, SS2, SS3 */}
            {examRepoFilter === 'all' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {STUDENT_CLASSES.map(cls => {
                    const sciExams = examsList.filter(e => e.class === cls.key && (e.stream === 'Science' || e.stream === 'STEM'));
                    const artExams = examsList.filter(e => e.class === cls.key && (e.stream === 'Arts' || e.stream === 'Art'));
                    const genExams = examsList.filter(e => e.class === cls.key);
                    const totalCount = cls.hasStreams ? (sciExams.length + artExams.length) : genExams.length;

                    return (
                      <div key={cls.key} className="relative">
                        <button
                          onClick={() => {
                            if (!cls.hasStreams) {
                              setSelectedExamClass(cls.key);
                              setSelectedExamStream('General');
                              setOpenExamClassDropdown(null);
                            } else {
                              setOpenExamClassDropdown(prev => prev === cls.key ? null : cls.key);
                            }
                          }}
                          className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${cls.color} ${openExamClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                              <ClipboardList className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                              {totalCount} Tests / Exams
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                          {cls.hasStreams ? (
                            <div className="flex gap-4 text-xs mt-2">
                              <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{sciExams.length}</strong></span>
                              <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{artExams.length}</strong></span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2 font-medium">{t('students.generalCurriculum')}</p>
                          )}
                          <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                            <span>{cls.hasStreams ? 'Select Stream' : 'View Assessments'}</span>
                            {cls.hasStreams ? (
                              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openExamClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>

                        {/* Stream dropdown menu: Science or Art */}
                        {cls.hasStreams && openExamClassDropdown === cls.key && (
                          <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                            <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
                            <button
                              onClick={() => { setSelectedExamClass(cls.key); setSelectedExamStream('Science'); setOpenExamClassDropdown(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                            >
                              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FlaskConical className="w-4 h-4" />
                              </span>
                              Science Stream
                              <span className="ml-auto text-xs text-muted-foreground">{sciExams.length} available</span>
                            </button>
                            <button
                              onClick={() => { setSelectedExamClass(cls.key); setSelectedExamStream('Art'); setOpenExamClassDropdown(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                            >
                              <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                <Palette className="w-4 h-4" />
                              </span>
                              Art Stream
                              <span className="ml-auto text-xs text-muted-foreground">{artExams.length} available</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status Repositories Cards Box */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-lg text-foreground">{t('exams.examRepos')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div onClick={() => setExamRepoFilter('pending')} className="p-4 rounded-xl border border-amber-200 bg-amber-500/5 cursor-pointer hover:border-amber-400 transition-all space-y-1">
                      <div className="flex items-center justify-between text-amber-700 font-bold text-xs">
                        <span>{t('exams.pendingApproval')}</span>
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-amber-800">{counts.pending}</p>
                      <p className="text-[10px] text-amber-600">{t('exams.pendingDesc')}</p>
                    </div>

                    <div onClick={() => setExamRepoFilter('approved')} className="p-4 rounded-xl border border-emerald-200 bg-emerald-500/5 cursor-pointer hover:border-emerald-400 transition-all space-y-1">
                      <div className="flex items-center justify-between text-emerald-700 font-bold text-xs">
                        <span>{t('exams.approvedExams')}</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-emerald-800">{counts.approved}</p>
                      <p className="text-[10px] text-emerald-600">{t('exams.approvedDesc')}</p>
                    </div>

                    <div onClick={() => setExamRepoFilter('rejected')} className="p-4 rounded-xl border border-rose-200 bg-rose-500/5 cursor-pointer hover:border-rose-400 transition-all space-y-1">
                      <div className="flex items-center justify-between text-rose-700 font-bold text-xs">
                        <span>{t('exams.rejectedExams')}</span>
                        <Ban className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-rose-800">{counts.rejected}</p>
                      <p className="text-[10px] text-rose-600">{t('exams.rejectedDesc')}</p>
                    </div>

                    <div onClick={() => setExamRepoFilter('all')} className="p-4 rounded-xl border border-border bg-muted/20 cursor-pointer hover:border-primary/40 transition-all space-y-1">
                      <div className="flex items-center justify-between text-foreground font-bold text-xs">
                        <span>{t('exams.totalAssessments')}</span>
                        <ClipboardList className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-foreground">{counts.total}</p>
                      <p className="text-[10px] text-muted-foreground">{t('exams.allTests')}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }

      // STEP 2: ASSESSMENT TYPE SELECTION (Test vs Exam request)
      if (selectedExamClass && selectedExamStream && !selectedExamType) {
        const clsLabel = SS_CLASSES.find(c => c.key === selectedExamClass)?.label || selectedExamClass;
        const matchingExams = examsList.filter(e => e.class === selectedExamClass && e.stream === selectedExamStream);
        const testCount = matchingExams.filter(e => e.type === 'Test').length;
        const examCount = matchingExams.filter(e => e.type === 'Exam').length;

        return (
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => { setSelectedExamClass(null); setSelectedExamStream(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium">
                <ChevronLeft className="w-4 h-4" /> Manage Exams
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{clsLabel} ({selectedExamStream} Stream)</span>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{t('exams.selectTypeTitle')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('exams.selectTypeDesc')}{clsLabel} {selectedExamStream}.</p>
            </div>

            {/* Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <button
                onClick={() => setSelectedExamType('Test')}
                className="group text-left bg-card rounded-2xl border-2 border-border p-6 shadow-sm hover:border-primary hover:shadow-md hover:scale-[1.02] transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">{t('exams.caTitle')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.caDesc')}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="font-bold text-primary">{testCount} Tests Available</span>
                  <ArrowUpRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setSelectedExamType('Exam')}
                className="group text-left bg-card rounded-2xl border-2 border-border p-6 shadow-sm hover:border-emerald-500 hover:shadow-md hover:scale-[1.02] transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors">{t('exams.terminalTitle')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.terminalDesc')}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="font-bold text-emerald-600">{examCount} Exams Available</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setSelectedExamType('All')}
                className="group text-left bg-card rounded-2xl border-2 border-border p-6 shadow-sm hover:border-purple-500 hover:shadow-md hover:scale-[1.02] transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 w-fit">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-purple-600 transition-colors">{t('exams.viewAll')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.browseDesc')}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="font-bold text-purple-600">{matchingExams.length} Total</span>
                  <ArrowUpRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        );
      }

      // STEP 3: AVAILABLE EXAMS / TESTS LISTING & ACTIONS
      const clsLabel = SS_CLASSES.find(c => c.key === selectedExamClass)?.label || selectedExamClass;
      const filteredExamsList = examsList.filter(e => {
        const matchClass = !selectedExamClass || e.class === selectedExamClass;
        const matchStream = !selectedExamStream || e.stream === selectedExamStream;
        const matchType = !selectedExamType || selectedExamType === 'All' || e.type === selectedExamType;
        const q = userSearch.toLowerCase();
        const matchSearch = !q || e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
        const matchStatus = examFilterStatus === 'All' || e.status === examFilterStatus;
        return matchClass && matchStream && matchType && matchSearch && matchStatus;
      });

      return (
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button onClick={() => { setSelectedExamClass(null); setSelectedExamStream(null); setSelectedExamType(null); }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Manage Exams
            </button>
            <span className="text-muted-foreground">/</span>
            <button onClick={() => setSelectedExamType(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              {clsLabel} ({selectedExamStream})
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{t('exams.available')}{selectedExamType === 'Test' ? 'C.A. Tests' : selectedExamType === 'Exam' ? 'Terminal Exams' : 'Assessments'}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{clsLabel} {selectedExamStream} — {selectedExamType} List</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredExamsList.length} assessment(s) available.</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by title, subject..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', 'Pending Approval', 'Approved', 'Rejected'].map(s => (
                <button key={s} onClick={() => setExamFilterStatus(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    examFilterStatus === s
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/40'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Cards Grid */}
          {renderExamCardsGrid(filteredExamsList)}
        </div>
      );
    }

    // 3. MANAGE SUBJECTS
    if (activeSection === 'courses') {
      const cls = selectedSubjectClass ? STUDENT_CLASSES.find(c => c.key === selectedSubjectClass) : null;
      const filteredSubjects = subjectsListState.filter(s => {
        const q = userSearch.toLowerCase();
        const matchClass = !selectedSubjectClass || s.grade === selectedSubjectClass;
        const matchStream = !selectedSubjectStream || !cls?.hasStreams || s.stream === selectedSubjectStream;
        const matchSearch = !q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
        return matchClass && matchStream && matchSearch;
      });

      // Level 1: select class (JSS1-SS3)
      if (!selectedSubjectClass) {
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{t('subjects.title')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('subjects.selectClassCard')}</p>
              </div>
              
              {/* Subjects Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectsActionsDropdown(prev => !prev)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                >
                  {t('subjects.actions')}
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showSubjectsActionsDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showSubjectsActionsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2">
                    <button onClick={() => { setShowCreateSubjectModal(true); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <Plus className="w-3.5 h-3.5 text-primary" /> Add Subject
                    </button>
                    <button onClick={() => { alert('Exporting curriculum as PDF...'); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Export Curriculum
                    </button>
                    <button onClick={() => { alert('Assigning teacher to subject...'); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" /> Assign Teacher
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Class Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {STUDENT_CLASSES.map(cls => {
                const sciCount = subjectsListState.filter(s => s.grade === cls.key && s.stream === 'Science').length;
                const artCount = subjectsListState.filter(s => s.grade === cls.key && s.stream === 'Art').length;
                const genCount = subjectsListState.filter(s => s.grade === cls.key).length;
                const totalCount = cls.hasStreams ? (sciCount + artCount) : genCount;

                return (
                  <div key={cls.key} className="relative">
                    <button
                      onClick={() => {
                        if (!cls.hasStreams) {
                          setSelectedSubjectClass(cls.key);
                          setSelectedSubjectStream('General');
                          setOpenSubjectClassDropdown(null);
                        } else {
                          setOpenSubjectClassDropdown(prev => prev === cls.key ? null : cls.key);
                        }
                      }}
                      className={`group w-full text-left rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 ${cls.color} ${openSubjectClassDropdown === cls.key ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${cls.iconBg}`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls.iconBg}`}>
                          {totalCount} Subjects
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl text-foreground mb-1">{cls.label}</h3>
                      {cls.hasStreams ? (
                        <div className="flex gap-4 text-xs mt-2">
                          <span className="text-muted-foreground">{t('students.scienceLabel')}<strong className={cls.accent}>{sciCount}</strong></span>
                          <span className="text-muted-foreground">{t('students.artLabel')}<strong className={cls.accent}>{artCount}</strong></span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{t('students.generalCurriculum')}</p>
                      )}
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${cls.accent}`}>
                        <span>{cls.hasStreams ? 'Select Stream' : 'View Subjects'}</span>
                        {cls.hasStreams ? (
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openSubjectClassDropdown === cls.key ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Stream dropdown for SS classes */}
                    {cls.hasStreams && openSubjectClassDropdown === cls.key && (
                      <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-40 py-2">
                        <p className="px-4 pt-1 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('students.chooseStream')}</p>
                        <button
                          onClick={() => { setSelectedSubjectClass(cls.key); setSelectedSubjectStream('Science'); setOpenSubjectClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FlaskConical className="w-4 h-4" />
                          </span>
                          Science
                          <span className="ml-auto text-xs text-muted-foreground">{sciCount} subjects</span>
                        </button>
                        <button
                          onClick={() => { setSelectedSubjectClass(cls.key); setSelectedSubjectStream('Art'); setOpenSubjectClassDropdown(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/5 hover:text-secondary transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <Palette className="w-4 h-4" />
                          </span>
                          Art
                          <span className="ml-auto text-xs text-muted-foreground">{artCount} subjects</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Level 3: Preview Subject's Scheme of Work
      if (selectedSubjectClass && selectedSubjectStream && selectedSubjectPreview) {
        const sub = selectedSubjectPreview;
        const schemeOfWork = [
          { week: 1, topic: 'Introduction & Curriculum Review', objectives: 'Foundational review, term syllabus guidelines, and course references.' },
          { week: 2, topic: 'Core Concepts & Theories', objectives: 'Examine primary formulas, historical milestones, and fundamental rules.' },
          { week: 3, topic: 'Practical Lab Sessions & Observations', objectives: 'Hands-on experiments with physical materials, and observational logging.' },
          { week: 4, topic: 'Group Project Discussion', objectives: 'Define research groups, select study topics, and register assignments.' },
          { week: 5, topic: 'Mid-term Revision & Quiz', objectives: 'Interactive quiz based on topics taught in weeks 1-4.' },
          { week: 6, topic: 'Advanced Methodology & Case Studies', objectives: 'Examine practical scenarios, identify limits, and propose optimizations.' },
          { week: 7, topic: 'Collaborative Problem Solving', objectives: 'Apply theoretical learnings to solve real-world industry case files.' },
          { week: 8, topic: 'Review of Assignments & Projects', objectives: 'Evaluation of group projects, peer assessment, and tutor feedback.' },
          { week: 9, topic: 'Final Examination Preparations', objectives: 'Exam outlines, past question drills, and exam rules review.' },
          { week: 10, topic: 'End of Term Assessment', objectives: 'Written and practical final evaluations for grading.' },
        ];

        return (
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setSelectedSubjectClass(null); setSelectedSubjectStream(null); setSelectedSubjectPreview(null); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Manage Subjects
              </button>
              <span className="text-muted-foreground">/</span>
              <button onClick={() => { setSelectedSubjectPreview(null); }}
                className="text-muted-foreground hover:text-foreground transition-colors">{cls?.label} ({selectedSubjectStream})</button>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{sub.title}</span>
            </div>

            {/* Header info */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg font-mono">{sub.code}</span>
                  <h2 className="text-xl font-serif font-bold text-foreground mt-2">{sub.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{t('subjects.instructor')}<span className="text-foreground font-semibold">{sub.teacher}</span> · Enrolled: <span className="text-foreground font-semibold">{sub.enrolled} Students</span></p>
                </div>
                <button
                  onClick={() => setSelectedSubjectPreview(null)}
                  className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Subjects
                </button>
              </div>
            </div>

            {/* Scheme of Work List */}
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" /> Scheme of Work (Term 2)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('subjects.timelineDesc')}</p>
              </div>

              <div className="space-y-3">
                {schemeOfWork.map((item, idx) => (
                  <div key={item.week} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      idx < 5 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {t('subjects.weekPrefix')}{item.week}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-sm text-foreground">{item.topic}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          idx < 5 ? 'bg-emerald-500/5 text-emerald-600 border-emerald-200' : 'bg-amber-500/5 text-amber-600 border-amber-200'
                        }`}>
                          {idx < 5 ? 'Completed' : 'Scheduled'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.objectives}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // Level 2: List subjects for class + stream
      return (
        <div className="space-y-5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button onClick={() => { setSelectedSubjectClass(null); setSelectedSubjectStream(null); }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Manage Subjects
            </button>
            <span className="text-muted-foreground">/</span>
            <button onClick={() => { setSelectedSubjectStream(null); setOpenSubjectClassDropdown(cls?.key ?? null); }}
              className="text-muted-foreground hover:text-foreground transition-colors">{cls?.label}</button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{selectedSubjectStream} Stream</span>
          </div>

          {/* Header + Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">{cls?.label} — {selectedSubjectStream} Subjects</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredSubjects.length} subjects available</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Subjects Actions Dropdown on Listing */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectsActionsDropdown(prev => !prev)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors select-none"
                >
                  {t('subjects.actions')}
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showSubjectsActionsDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showSubjectsActionsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2">
                    <button onClick={() => { setShowCreateSubjectModal(true); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <Plus className="w-3.5 h-3.5 text-primary" /> Add Subject
                    </button>
                    <button onClick={() => { alert('Exporting list as CSV...'); setShowSubjectsActionsDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors text-left">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Export to CSV
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search subjects..."
                  className="pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
              </div>
            </div>
          </div>

          {/* Subjects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.length > 0 ? filteredSubjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectPreview(sub)}
                className="group text-left bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 hover:border-primary/40 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{sub.code}</span>
                  <span className="text-xs text-muted-foreground font-medium">{sub.category}</span>
                </div>
                <h3 className="font-serif font-bold text-foreground text-base group-hover:text-primary transition-colors">{sub.title}</h3>
                <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs w-full">
                  <p className="text-muted-foreground">{t('subjects.instructor')}<strong className="text-foreground">{sub.teacher}</strong></p>
                  <p className="text-muted-foreground"><strong className="text-foreground">{sub.enrolled}</strong> Enrolled</p>
                </div>
              </button>
            )) : (
              <div className="col-span-2 py-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{t('subjects.noSubjects')}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. SCHOOL OPERATIONS
    if (activeSection === 'operations') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('operations.title')}</h2>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <p className="text-xs text-muted-foreground">{t('operations.subtitle')}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-border rounded-xl bg-muted/10"><p className="font-bold text-foreground">{t('operations.currentTerm')}</p><p className="text-muted-foreground">Term 2 · 2025/2026</p></div>
            <div className="p-3 border border-border rounded-xl bg-muted/10"><p className="font-bold text-foreground">{t('operations.totalClassrooms')}</p><p className="text-muted-foreground">12 Active Spaces</p></div>
          </div>
        </div>
      </div>
    );

    // 5. HOUSE POINTS
    if (activeSection === 'houses') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('houseSystem.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_HOUSES.map((h, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-foreground text-base">{h.name}</h3>
                <p className="text-xs text-muted-foreground">{h.points} Points · {h.head}</p>
              </div>
              <button onClick={() => setAwardHouse(h)} className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors">
                + Points
              </button>
            </div>
          ))}
        </div>
      </div>
    );

    // 6. AUDIT LOGS
    if (activeSection === 'logs') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('auditLogs.title')}</h2>
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">{t('auditLogs.user')}</th>
                <th className="py-3 px-4">{t('auditLogs.action')}</th>
                <th className="py-3 px-4">{t('auditLogs.target')}</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">{t('auditLogs.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map(l => (
                <tr key={l.id}>
                  <td className="py-3 px-4 font-bold text-foreground">{l.user}</td>
                  <td className="py-3 px-4 font-mono">{l.action}</td>
                  <td className="py-3 px-4 text-muted-foreground">{l.target}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{l.ip}</td>
                  <td className="py-3 px-4"><span className={`font-bold ${l.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    // 7. SYSTEM SETTINGS
    if (activeSection === 'settings') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">{t('settings.title')}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('settings.subtitle')}</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border gap-2 overflow-x-auto pb-px text-xs font-bold">
            {[
              { id: 'general',  label: 'General Info',     icon: Building2 },
              { id: 'academic', label: 'Academic & Terms', icon: GraduationCap },
              { id: 'security', label: 'Security Rules',   icon: Shield },
              { id: 'database', label: 'Database & API',   icon: Server },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    settingsTab === tab.id
                      ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-t-xl'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: General Info */}
          {settingsTab === 'general' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">{t('settings.schoolIdentity')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.schoolName')}</label>
                  <input type="text" defaultValue="Tarepet Montessori School" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.schoolMotto')}</label>
                  <input type="text" defaultValue="Excellence Through Observation & Character" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.officialEmail')}</label>
                  <input type="email" defaultValue="info@tarepet.edu.ng" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.portalAddress')}</label>
                  <input type="text" defaultValue="https://portal.tarepet.edu.ng" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => alert('General settings updated successfully!')} className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                  {t('settings.saveGeneral')}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Academic & Terms */}
          {settingsTab === 'academic' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">{t('settings.currentCalendar')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.currentSession')}</label>
                  <select defaultValue="2025/2026" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026 (Active)</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.currentTerm')}</label>
                  <select defaultValue="Term 2" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Term 1">{t('settings.firstTerm')}</option>
                    <option value="Term 2">{t('settings.secondTermActive')}</option>
                    <option value="Term 3">{t('settings.thirdTerm')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">{t('settings.passMark')}</label>
                  <input type="text" defaultValue="50%" className="w-full border border-border rounded-xl px-4 py-2.5 text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider text-[10px]">{t('settings.gradingScale')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 border border-border rounded-xl bg-emerald-500/5 border-emerald-200"><p className="font-bold text-emerald-700">{t('settings.gradeA')}</p><p className="text-muted-foreground text-[10px]">75% - 100%</p></div>
                  <div className="p-3 border border-border rounded-xl bg-blue-500/5 border-blue-200"><p className="font-bold text-blue-700">{t('settings.gradeB')}</p><p className="text-muted-foreground text-[10px]">65% - 74%</p></div>
                  <div className="p-3 border border-border rounded-xl bg-amber-500/5 border-amber-200"><p className="font-bold text-amber-700">{t('settings.gradeC')}</p><p className="text-muted-foreground text-[10px]">50% - 64%</p></div>
                  <div className="p-3 border border-border rounded-xl bg-rose-500/5 border-rose-200"><p className="font-bold text-rose-700">{t('settings.gradeF')}</p><p className="text-muted-foreground text-[10px]">0% - 49%</p></div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => alert('Academic calendar settings updated!')} className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                  {t('settings.saveAcademic')}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Security Rules */}
          {settingsTab === 'security' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">Authentication & Access Policies</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                  <div>
                    <p className="font-bold text-foreground">{t('settings.jwtRotation')}</p>
                    <p className="text-muted-foreground text-[11px]">{t('settings.jwtDesc')}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">{t('settings.enforced')}</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                  <div>
                    <p className="font-bold text-foreground">{t('settings.admin2fa')}</p>
                    <p className="text-muted-foreground text-[11px]">{t('settings.admin2faDesc')}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">{t('settings.active')}</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                  <div>
                    <p className="font-bold text-foreground">{t('settings.maxLoginThrottling')}</p>
                    <p className="text-muted-foreground text-[11px]">{t('settings.maxLoginDesc')}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">5 Attempts</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Database & API */}
          {settingsTab === 'database' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base text-foreground">{t('settings.dbHealth')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-1">
                  <p className="text-muted-foreground font-semibold uppercase text-[10px]">{t('settings.dbConnection')}</p>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> PostgreSQL (Production Ready)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('settings.dbHostInfo')}</p>
                </div>
                <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-1">
                  <p className="text-muted-foreground font-semibold uppercase text-[10px]">{t('settings.autoBackups')}</p>
                  <p className="text-sm font-bold text-foreground">{t('settings.backupSchedule')}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('settings.retentionPolicy')}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-border">
                <span className="text-xs text-muted-foreground font-mono">{t('settings.apiVersion')}</span>
                <button onClick={() => alert('Database backup initiated. Snapshot queued!')} className="bg-secondary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Trigger Manual Backup
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    const renderModuleHeader = (title: string, desc: string, icon: React.ElementType) => {
      const Icon = icon;
      return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground mb-1">{title} Module</h2>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <button className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add {title.replace(/s$/, '')}
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground">{title} Management System</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              This module provides operational control for {title.toLowerCase()}. View records, manage assignments, export custom reports, and synchronize real-time updates across the school LMS.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl shadow-xs hover:bg-primary/90 transition-all">
                {t('common.viewAll')} {title}
              </button>
              <button className="px-4 py-2 text-xs font-bold bg-muted text-foreground rounded-xl border border-border hover:bg-accent transition-all">
                {t('common.exportData')}
              </button>
            </div>
          </div>
        </div>
      );
    };

    if (activeSection === 'teachers') return renderModuleHeader('Teachers', 'View teachers, add faculty members, assign subject loads and track attendance.', GraduationCap);
    if (activeSection === 'classes') return renderModuleHeader('Classes', 'Manage junior & senior classes, assign form teachers, and monitor rosters.', School);
    if (activeSection === 'subjects') return renderModuleHeader('Subjects', 'Manage school curriculum subjects, assign teachers, and review syllabi.', BookOpen);
    if (activeSection === 'results') return renderModuleHeader('Results', 'View student grades, approve examination results, and print terminal report cards.', FileText);
    if (activeSection === 'attendance') return renderModuleHeader('Attendance', 'Track daily student and teacher presence, log leave requests, and view trends.', CalendarCheck);
    if (activeSection === 'announcements') return renderModuleHeader('Announcements', 'Publish announcements to parents, teachers, and students.', Megaphone);
    if (activeSection === 'calendar') return renderModuleHeader('School Calendar', 'View academic session terms, exam schedules, and official school holidays.', Calendar);
    if (activeSection === 'reports') return renderModuleHeader('Reports', 'Generate comprehensive academic, attendance, teacher, and student analytical reports.', BarChart2);

    return null;
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <PortalLayout title="Admin Control Center" activeSection={activeSection} onNavigate={setActiveSection}>
        {idCardUser && <StudentIDModal student={idCardUser} onClose={() => setIdCardUser(null)} />}
        {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}
        {awardHouse && <AwardPointsModal house={awardHouse} onClose={() => setAwardHouse(null)} />}
        {previewExam && <ExamPreviewModal exam={previewExam} onClose={() => setPreviewExam(null)} />}
        {showCreateSubjectModal && (
          <CreateSubjectModal
            defaultClass={selectedSubjectClass || undefined}
            defaultStream={selectedSubjectStream || undefined}
            onClose={() => setShowCreateSubjectModal(false)}
            onCreated={(newSub) => {
              setSubjectsListState(prev => [...prev, { ...newSub, id: prev.length + 1 }]);
              setShowCreateSubjectModal(false);
            }}
          />
        )}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" /> {t('wizard.registerTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('addStudentWizard.step')} {wizardStep} {t('addStudentWizard.of')} 5 — Progressive Enrollment Wizard</p>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-muted/40 h-1.5 flex">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(wizardStep / 5) * 100}%` }} />
              </div>

              {/* Steps Pill Header */}
              <div className="px-6 pt-3 pb-2 border-b border-border/40 flex justify-between text-[11px] font-bold text-muted-foreground">
                <span className={wizardStep >= 1 ? 'text-primary' : ''}>1. Personal</span>
                <span className={wizardStep >= 2 ? 'text-primary' : ''}>2. Class</span>
                <span className={wizardStep >= 3 ? 'text-primary' : ''}>3. Address</span>
                <span className={wizardStep >= 4 ? 'text-primary' : ''}>4. Photo</span>
                <span className={wizardStep >= 5 ? 'text-primary' : ''}>5. Admission No</span>
              </div>

              {/* Slide Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Slide 1: Basic Information */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.personalId')}</h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.fullName')}</label>
                      <input type="text" placeholder="e.g. Kelechi Amadi" value={newStudentForm.name}
                        onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.dob')}</label>
                        <input type="date" value={newStudentForm.dob}
                          onChange={e => setNewStudentForm({ ...newStudentForm, dob: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.gender')}</label>
                        <select value={newStudentForm.gender}
                          onChange={e => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="Male">{t('wizard.male')}</option>
                          <option value="Female">{t('wizard.female')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 2: Class & Stream Assignment */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.academicLevel')}</h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.targetClass')}</label>
                      <select value={newStudentForm.grade}
                        onChange={e => {
                          const val = e.target.value;
                          const isJSS = val.startsWith('JSS');
                          setNewStudentForm({
                            ...newStudentForm,
                            grade: val,
                            stream: isJSS ? 'General' : 'Science',
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="JSS1">{t('wizard.jss1')}</option>
                        <option value="JSS2">{t('wizard.jss2')}</option>
                        <option value="JSS3">{t('wizard.jss3')}</option>
                        <option value="SS1">{t('wizard.ss1')}</option>
                        <option value="SS2">{t('wizard.ss2')}</option>
                        <option value="SS3">{t('wizard.ss3')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.streamAssignment')}</label>
                      {newStudentForm.grade.startsWith('JSS') ? (
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground font-medium">
                          {t('wizard.jssGeneralNote')}
                        </div>
                      ) : (
                        <select value={newStudentForm.stream}
                          onChange={e => setNewStudentForm({ ...newStudentForm, stream: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="Science">{t('wizard.sciOption')}</option>
                          <option value="Art">{t('wizard.artOption')}</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Slide 3: Origin, Location & Guardian Contacts */}
                {wizardStep === 3 && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.originTitle')}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.country')}</label>
                        <input type="text" value={newStudentForm.country}
                          onChange={e => setNewStudentForm({ ...newStudentForm, country: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.stateOfOrigin')}</label>
                        <input type="text" placeholder="e.g. Bayelsa" value={newStudentForm.stateOfOrigin}
                          onChange={e => setNewStudentForm({ ...newStudentForm, stateOfOrigin: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">L.G.A *</label>
                        <input type="text" placeholder="e.g. Yenagoa" value={newStudentForm.lga}
                          onChange={e => setNewStudentForm({ ...newStudentForm, lga: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.address')}</label>
                      <input type="text" placeholder="e.g. Azikoro village, Yenagoa" value={newStudentForm.address}
                        onChange={e => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.parentName')}</label>
                        <input type="text" placeholder="e.g. Ayaebi Dimaro" value={newStudentForm.parentName}
                          onChange={e => setNewStudentForm({ ...newStudentForm, parentName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">{t('wizard.parentPhone')}</label>
                        <input type="tel" placeholder="e.g. 08031234567" value={newStudentForm.parentPhone}
                          onChange={e => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 4: Student Profile Picture Local Upload */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">{t('wizard.photoTitle')}</h4>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/20 text-center">
                      <div className="w-24 h-24 rounded-2xl border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden mb-3 shadow-inner">
                        {newStudentForm.profileImage ? (
                          <img src={newStudentForm.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-10 h-10 text-primary" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground mb-1">{t('wizard.uploadPhoto')}</p>
                      <p className="text-[11px] text-muted-foreground mb-4">{t('wizard.selectPhotoHint')}</p>

                      <input
                        type="file"
                        id="studentPhotoLocalInput"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStudentForm(prev => ({ ...prev, profileImage: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => document.getElementById('studentPhotoLocalInput')?.click()}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" /> Add Photo from File
                      </button>
                    </div>
                  </div>
                )}

                {/* Slide 5: Generated Admission Number & Credentials Summary */}
                {wizardStep === 5 && (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-serif font-bold text-foreground">{t('wizard.readyTitle')}</h4>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-left space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t('wizard.genCredentials')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.admissionNo')}</span>
                        <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/30">
                          {generateAdmissionNumber(newStudentForm.grade, newStudentForm.stream)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.genEmail')}</span>
                        <span className="text-xs font-bold text-foreground underline">
                          {(() => {
                            const parts = newStudentForm.name.trim().toLowerCase().split(/\s+/);
                            const fn = parts[0] || 'student';
                            const sn = parts.slice(1).join('') || 'tarepet';
                            return `${fn}.${sn}@tarepet.com`;
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-foreground">{t('wizard.assignedClass')}</span>
                        <span className="text-xs font-bold text-foreground">
                          {newStudentForm.grade} {newStudentForm.grade.startsWith('SS') ? `(${newStudentForm.stream})` : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('wizard.admissionNote')}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-between">
                {wizardStep > 1 ? (
                  <button onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors">
                    {t('wizard.back')}
                  </button>
                ) : <div />}

                {wizardStep < 5 ? (
                  <button
                    disabled={wizardStep === 1 && !newStudentForm.name}
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {t('wizard.nextStep')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const generatedId = generateAdmissionNumber(newStudentForm.grade, newStudentForm.stream);
                      const parts = newStudentForm.name.trim().toLowerCase().split(/\s+/);
                      const fn = parts[0] || 'student';
                      const sn = parts.slice(1).join('') || 'tarepet';
                      const autoEmail = `${fn}.${sn}@tarepet.com`;

                      const createdStudent = {
                        id: studentsList.length + 1,
                        name: newStudentForm.name,
                        admissionNo: generatedId,
                        email: autoEmail,
                        grade: newStudentForm.grade,
                        stream: newStudentForm.stream,
                        house: 'Blue House (Eagle)',
                        status: 'ACTIVE',
                        dob: newStudentForm.dob,
                        gender: newStudentForm.gender,
                        country: newStudentForm.country || 'Nigeria',
                        stateOfOrigin: newStudentForm.stateOfOrigin || 'Bayelsa',
                        lga: newStudentForm.lga || 'Yenagoa',
                        address: newStudentForm.address,
                        parentName: newStudentForm.parentName,
                        parentPhone: newStudentForm.parentPhone,
                        profileImage: newStudentForm.profileImage,
                      };
                      setStudentsList([createdStudent, ...studentsList]);
                      setShowAddStudentModal(false);
                    }}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Save & Register Student
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
