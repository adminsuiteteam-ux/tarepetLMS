import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import {
  GraduationCap, UserCheck, MessageSquare, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Send, Star, BookOpen,
  ArrowUpRight, BarChart2, Award, Calendar, CreditCard,
  HeartHandshake, School, Shield, Download, FileText,
  Plus, Search, Filter, CheckSquare, XCircle, RefreshCw,
  Video, Phone, User, Users, ChevronRight, Lock, Bell,
  DollarSign, Check, ChevronDown, Zap, ShieldCheck
} from 'lucide-react';
import { authClient } from '@/lib/api-auth';
import { getStoredExams, getStoredSubmissions, subscribeToCBTStore, getCoursesForClass, getStudentBroadsheet, calculateWAECGrade, syncStudentsWithBackend, broadcastRealtimeEvent } from '@/lib/cbt-store';
import { subscribeToPaymentStore, syncPaymentsWithBackend } from '@/lib/payments-store';
import { RealTimeSyncStatus } from '@/components/cbt/RealTimeSyncStatus';
import { TerminalReportCard } from '@/components/reports/TerminalReportCard';
import { getTimeGreeting } from '@/lib/utils';
import { MobileProfileView } from '@/components/profile/MobileProfileView';

// ── Data Definitions ────────────────────────────
const CHILDREN: any[] = [];

const SUBJECTS_EMEKA: any[] = [];

const MONTESSORI_SKILLS = [
  { area: 'Practical Life Competencies', mastery: 'Exemplary', score: 94, color: 'hsl(var(--secondary))' },
  { area: 'Mathematical Understanding', mastery: 'Exemplary', score: 95, color: 'hsl(var(--primary))' },
  { area: 'Physical Science Application', mastery: 'Exemplary', score: 88, color: 'hsl(var(--secondary))' },
  { area: 'Chemical & Biological Inquiry', mastery: 'Exemplary', score: 90, color: 'hsl(var(--primary))' },
  { area: 'Sensorial & Field Observations', mastery: 'Proficient', score: 82, color: 'hsl(var(--secondary))' },
  { area: 'Social & Leadership Growth', mastery: 'Exemplary', score: 92, color: 'hsl(var(--primary))' },
];

const TEACHERS = [
  { name: 'Ms. Allison Victoria', subject: 'English Language & Senior Secondary Studies', online: true, role: 'Form Teacher (SS 1)' },
  { name: 'Mrs. Timi Porbeni', subject: 'English Language & Literature in English', online: true, role: 'Senior Instructor (SS1 - SS3)' },
  { name: 'Abiola Adeniyi Adegemo', subject: 'Physics & Financial Accounting', online: true, role: 'Senior Science Instructor' },
  { name: 'Eli Idua', subject: 'Mathematics & Further Mathematics', online: true, role: 'Form Teacher (SS 1 Art)' },
];

const INVOICES = [
  { id: 'INV-2026-001', term: 'Term 2 Tuition & Activities', amount: '₦185,000', dueDate: 'Aug 10, 2026', status: 'Pending', itemized: ['Tuition: ₦140,000', 'Agronomy Fieldwork: ₦25,000', 'ICT & Lab: ₦20,000'] },
  { id: 'INV-2026-000', term: 'Term 1 Tuition & Registration', amount: '₦210,000', dueDate: 'Apr 15, 2026', status: 'Paid', receipt: 'RCP-88421' },
];

const BEHAVIOR_LOGS = [
  { id: 1, type: 'Positive', category: 'Grace & Courtesy', title: 'Independent Tool Organization', date: 'Jul 23, 2026', detail: 'Emeka voluntarily organized agronomy tools and assisted peers after class.', points: '+15 House Pts' },
  { id: 2, type: 'Positive', category: 'Self-Discipline', title: 'Led Practical Life Session', date: 'Jul 18, 2026', detail: 'Demonstrated exceptional focus and self-reliance during farming lab.', points: '+10 House Pts' },
];

const PTA_EVENTS = [
  { title: 'Parent-Teacher General Assembly', date: 'Aug 12, 2026 · 3:00 PM', venue: 'School Hall / Zoom', RSVP: 'Registered' },
  { title: 'Montessori Erdkinder Open Day', date: 'Aug 25, 2026 · 10:00 AM', venue: 'School Farm', RSVP: 'Open' },
];

export default function ParentDashboard() {
  const { user, refreshUserProfile, updateUser } = useAuth();
  const { t } = useTranslation();
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
  const [selectedChildId, setSelectedChildId] = useState<number>(1);
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0].name);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, from: 'Mrs. Okafor Chioma', role: 'Teacher', time: 'Yesterday 10:30 AM', text: 'Good day! Emeka has been demonstrating remarkable leadership in mathematics and agronomy ledgers.', fromParent: false },
    { id: 2, from: 'Me', role: 'Parent', time: 'Yesterday 11:15 AM', text: 'Thank you Mrs. Okafor! We are very proud of his growth.', fromParent: true },
  ]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [confDate, setConfDate] = useState('Aug 10, 2026 - 2:00 PM');
  const [confBooked, setConfBooked] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [parentProfile, setParentProfile] = useState(() => ({
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Parent Member',
    profileImage: user?.profile?.profile_image || (user as any)?.profile_image || user?.profile?.profileImage || '',
  }));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-time backend sync on mount & periodic polling
  React.useEffect(() => {
    const syncBackend = () => {
      refreshUserProfile().catch(() => {});
      syncStudentsWithBackend().catch(() => {});
      syncPaymentsWithBackend().catch(() => {});
    };
    syncBackend();
    const intervalId = setInterval(syncBackend, 15000);

    const handleStoreUpdate = () => {
      // Re-read student and exam data when store updates
    };
    const unsubCBT = subscribeToCBTStore(handleStoreUpdate);
    const unsubPayments = subscribeToPaymentStore(handleStoreUpdate);
    window.addEventListener('cbt_store_updated', handleStoreUpdate);

    return () => {
      unsubCBT();
      unsubPayments();
      window.removeEventListener('cbt_store_updated', handleStoreUpdate);
      clearInterval(intervalId);
    };
  }, []);

  const activeChild = CHILDREN.find(c => c.id === selectedChildId) ?? CHILDREN[0];

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    setChatHistory(prev => [...prev, {
      id: prev.length + 1,
      from: 'Me',
      role: 'Parent',
      time: 'Just now',
      text: chatMsg,
      fromParent: true,
    }]);
    setChatMsg('');
  };

  const renderSection = () => {
    // 1. OVERVIEW & MULTI-CHILD
    if (activeSection === 'overview') return (
      <div className="space-y-6">
        <RealTimeSyncStatus title="Parent LMS & CBT Real-Time Portal" />

        {/* Child Selector Tabs */}
        <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border">
          <span className="text-xs font-bold uppercase text-muted-foreground ml-2">{t('Select Child:')}</span>
          {CHILDREN.map(child => (
            <button key={child.id} onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedChildId === child.id ? 'bg-primary text-white shadow-sm' : 'bg-muted/30 text-foreground hover:bg-accent'}`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">{child.avatar}</span>
              {child.name} ({child.grade})
            </button>
          ))}
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white">{t('Parent Portal')}</span>
              <span className="text-xs text-white/80">{activeChild.house}</span>
            </div>
            <h2 className="text-3xl font-serif font-bold mb-1 text-white">{getTimeGreeting()}, {user?.first_name ?? 'Parent'}!</h2>
            <p className="text-white/90 text-sm">{t('Monitoring academic progress & development for ')}<strong className="underline">{activeChild.name}</strong> ({activeChild.grade})</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Overall Average', val: '88.5%', sub: 'Exemplary', icon: GraduationCap, color: 'text-primary bg-primary/10 border-primary/20' },
            { label: 'Class Rank', val: `#${activeChild.rank}/${activeChild.classSize}`, sub: 'Top 15%', icon: Star, color: 'text-secondary bg-secondary/10 border-secondary/20' },
            { label: 'Attendance Rate', val: activeChild.attendance, sub: `${activeChild.absences} Absence`, icon: UserCheck, color: 'text-secondary bg-secondary/10 border-secondary/20' },
            { label: 'Pending Fees', val: '₦185,000', sub: 'Due Aug 10', icon: CreditCard, color: 'text-primary bg-primary/10 border-primary/20' },
          ].map((s, i) => (
            <div key={i} className={`bg-card rounded-2xl border p-4 shadow-sm ${s.color.split(' ').slice(2).join(' ')}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
              </div>
              <p className={`text-2xl font-serif font-bold ${s.color.split(' ')[0]}`}>{s.val}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Action Shortcuts */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">{t('Quick Actions')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'View Gradebook', section: 'academic', icon: GraduationCap },
              { label: 'Pay School Fees', section: 'fees', icon: CreditCard },
              { label: 'Attendance & Leave', section: 'attendance', icon: UserCheck },
              { label: 'Montessori Development', section: 'montessori', icon: Star },
            ].map((a, i) => (
              <button key={i} onClick={() => setActiveSection(a.section)} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold text-foreground">
                <span className="flex items-center gap-2"><a.icon className="w-4 h-4 text-primary" />{a.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    // 2. ACADEMIC PROGRESS & GRADEBOOK
    if (activeSection === 'academic') return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground">{activeChild.name}'s Academic Gradebook</h2>
          <button onClick={() => setShowReportCardModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Official Terminal Report Card (PDF)
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-serif font-bold text-foreground mb-4">{t('Subject Grades & Trends')}</h3>
          <div className="space-y-4">
            {SUBJECTS_EMEKA.map(s => (
              <div key={s.code} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-2">{s.code}</span>
                    <span className="font-semibold text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({s.teacher})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{s.score}%</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{s.grade}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable Official Terminal Report Card Modal */}
        {showReportCardModal && (
          <TerminalReportCard onClose={() => setShowReportCardModal(false)} />
        )}
      </div>
    );

    // 3. MONTESSORI DEVELOPMENT
    if (activeSection === 'montessori') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('Montessori Development & Skill Mastery')}</h2>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground">{t('Erdkinder Skill Matrix')}</h3>
          <div className="space-y-3">
            {MONTESSORI_SKILLS.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{s.area}</span>
                  <span className="font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">{s.mastery} ({s.score}%)</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // 4. ATTENDANCE & LEAVE
    if (activeSection === 'attendance') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('Attendance & Leave Management')}</h2>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground">{t('Submit Leave Request for ')}{activeChild.name}</h3>
          {!leaveSubmitted ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('Reason for Absence')}</label>
                <input placeholder={t('e.g. Medical Appointment / Family Event')} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('Start Date')}</label>
                  <input type="date" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('End Date')}</label>
                  <input type="date" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <button onClick={() => setLeaveSubmitted(true)} className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                {t('Submit Leave Notice')}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl text-center text-xs text-secondary font-medium">
              ✓ Leave request submitted successfully to school administration!
            </div>
          )}
        </div>
      </div>
    );

    // 5. MESSAGES & CONFERENCES
    if (activeSection === 'messages') return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-foreground">{t('Teacher Messaging & Conferences')}</h2>
          <button onClick={() => setShowConferenceModal(true)} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {t('Book Parent-Teacher Conference')}
          </button>
        </div>

        {showConferenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-serif font-bold text-xl text-foreground">{t('Book Parent-Teacher Conference')}</h3>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('Select Teacher')}</label>
                <select className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                  {TEACHERS.map(t => <option key={t.name}>{t.name} ({t.subject})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">{t('Available Slot')}</label>
                <select value={confDate} onChange={e => setConfDate(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>{t('Aug 10, 2026 - 2:00 PM')}</option>
                  <option>{t('Aug 10, 2026 - 2:30 PM')}</option>
                  <option>{t('Aug 11, 2026 - 4:00 PM')}</option>
                </select>
              </div>
              {!confBooked ? (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setConfBooked(true)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">{t('Confirm Booking')}</button>
                  <button onClick={() => setShowConferenceModal(false)} className="border border-border px-4 py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">{t('Cancel')}</button>
                </div>
              ) : (
                <div className="text-center space-y-2 pt-2">
                  <p className="text-xs text-secondary font-bold">✓ Conference Booked for {confDate}!</p>
                  <button onClick={() => { setShowConferenceModal(false); setConfBooked(false); }} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold">{t('Done')}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messaging Box */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">C</div>
            <div>
              <p className="font-bold text-foreground text-sm" aria-label={selectedTeacher}>{selectedTeacher}</p>
              <p className="text-[10px] text-muted-foreground">{t('Class Teacher · Re:')} {activeChild.name}</p>
            </div>
          </div>
          <div className="space-y-3 h-48 overflow-y-auto">
            {chatHistory.map(m => (
              <div key={m.id} className={`flex ${m.fromParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.fromParent ? 'bg-primary text-white' : 'bg-muted/30 border border-border text-foreground'}`}>
                  <p>{m.text}</p>
                  <p className="text-[9px] opacity-70 mt-1">{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={t('Send a message to teacher...')} className="flex-1 border border-border rounded-xl px-3 py-2 text-xs bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={sendMessage} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /><span>{t('send_message')}</span></button>
          </div>
        </div>
      </div>
    );

    // 6. HOUSE SYSTEM
    if (activeSection === 'houses') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('House System & Character Growth')}</h2>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
              <h3 className="font-serif font-bold text-foreground text-lg">{activeChild.name} {activeChild.house ? `— ${activeChild.house}` : ''}</h3>
              {activeChild.house && (
                <p className="text-xs text-muted-foreground">{t('House Membership Active')}</p>
              )}
          </div>
        </div>
      </div>
    );

    // 7. FEE MANAGEMENT & PAY
    if (activeSection === 'fees') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('Fee Management & Online Payments')}</h2>
        <div className="space-y-4">
          {INVOICES.map(inv => (
            <div key={inv.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inv.status === 'Paid' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>{inv.status}</span>
                <h4 className="font-serif font-bold text-foreground text-base mt-1">{inv.term}</h4>
                <p className="text-xs text-muted-foreground">{t('Invoice: ')}{inv.id} · Due: {inv.dueDate}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <span className="text-2xl font-serif font-bold text-foreground">{inv.amount}</span>
                {inv.status === 'Pending' ? (
                  <button onClick={() => setShowPaymentModal(true)} className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                    {t('Pay Now')}
                  </button>
                ) : (
                  <span className="text-xs text-secondary font-bold">✓ Receipt {inv.receipt}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-serif font-bold text-xl text-foreground">{t('Pay School Fees')}</h3>
              <p className="text-xs text-muted-foreground">{t('Amount: ')}<strong className="text-foreground text-base">₦185,000</strong></p>
              {!paymentSuccess ? (
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-xl bg-muted/20 text-xs space-y-1">
                    <p className="font-bold text-foreground">{t('Card / Bank Transfer (Flutterwave / Paystack)')}</p>
                    <p className="text-muted-foreground">{t('Encrypted & instant school ledger update')}</p>
                  </div>
                  <button onClick={() => setPaymentSuccess(true)} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors">
                    {t('Confirm & Complete Payment')}
                  </button>
                  <button onClick={() => setShowPaymentModal(false)} className="w-full border border-border py-2.5 rounded-xl text-xs hover:bg-accent transition-colors">
                    {t('Cancel')}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3 py-4">
                  <CheckCircle2 className="w-12 h-12 text-secondary mx-auto" />
                  <p className="font-serif font-bold text-foreground text-lg">{t('Payment Successful!')}</p>
                  <p className="text-xs text-muted-foreground">{t('Receipt RCP-99120 sent to your registered email.')}</p>
                  <button onClick={() => { setShowPaymentModal(false); setPaymentSuccess(false); }} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold">{t('Done')}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );

    // 8. SUPPORT & BEHAVIOR
    if (activeSection === 'support') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('Behavior & Student Support')}</h2>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <h3 className="font-serif font-bold text-foreground">{t('Character Growth Logs')}</h3>
          {BEHAVIOR_LOGS.map(b => (
            <div key={b.id} className="p-3 border border-border rounded-xl bg-muted/10 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">{b.title} ({b.category})</span>
                <span className="text-secondary font-bold">{b.points}</span>
              </div>
              <p className="text-xs text-muted-foreground">{b.detail}</p>
            </div>
          ))}
        </div>
      </div>
    );

    // 9. SCHOOL & PTA ENGAGEMENT
    if (activeSection === 'engagement') return (
      <div className="space-y-5">
        <h2 className="text-xl font-serif font-bold text-foreground">{t('PTA & School Events')}</h2>
        <div className="space-y-3">
          {PTA_EVENTS.map((e, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex justify-between items-center">
              <div>
                <h4 className="font-serif font-bold text-foreground">{e.title}</h4>
                <p className="text-xs text-muted-foreground">{e.date} · {e.venue}</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{e.RSVP}</span>
            </div>
          ))}
        </div>
      </div>
    );

    // 10. SETTINGS & PARENT TOOLS
    if (activeSection === 'settings' || activeSection === 'profile') return (
      <>
        {/* Mobile View Profile */}
        <div className="md:hidden">
          <MobileProfileView
            name={parentProfile.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Parent Member')}
            email={user?.email || 'parent@tarepet.com'}
            subtitle="Montessori Parent / Guardian"
            avatarUrl={parentProfile.profileImage}
            roleBadge="PARENT"
            location="Yenagoa Campus, Nigeria"
            onBack={() => setActiveSection('overview')}
            onEditProfile={() => {
              const fileInput = document.getElementById('parentAvatarPicker');
              if (fileInput) fileInput.click();
            }}
            extraMenuItems={[
              {
                icon: GraduationCap,
                label: 'Enrolled Children Records',
                value: 'View Progress',
                onClick: () => setActiveSection('academic'),
                color: 'bg-emerald-500/10 text-emerald-600',
              },
              {
                icon: CreditCard,
                label: 'Tuition Fees & Invoices',
                value: 'Fee Portal',
                onClick: () => setActiveSection('fees'),
                color: 'bg-amber-500/10 text-amber-600',
              },
              {
                icon: School,
                label: 'PTA & School Engagements',
                value: 'Open Forum',
                onClick: () => setActiveSection('engagement'),
                color: 'bg-blue-500/10 text-blue-600',
              }
            ]}
          />
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-5">
          <h2 className="text-xl font-serif font-bold text-foreground">{t('Parent Settings & Profile')}</h2>
        
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profile Photo & Information
          </h3>

          <div className="flex items-center gap-4 pb-3 border-b border-border">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-serif font-bold text-xl text-primary overflow-hidden shrink-0">
              {parentProfile.profileImage ? (
                <img src={parentProfile.profileImage} alt="Parent Avatar" className="w-full h-full object-cover" />
              ) : (
                'P'
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <input
                type="file"
                accept="image/*"
                id="parentAvatarPicker"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showToast('Image size exceeds 5MB limit.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const imageBase64 = reader.result as string;
                      const updated = { ...parentProfile, profileImage: imageBase64 };
                      setParentProfile(updated);
                      updateUser({
                        profile_image: imageBase64,
                        profile: {
                          ...(user?.profile || {}),
                          profile_image: imageBase64,
                          profileImage: imageBase64,
                        }
                      });
                      authClient.put('/auth/me/', {
                        profile_image: imageBase64,
                        profile: {
                          profile_image: imageBase64,
                          profileImage: imageBase64,
                        }
                      }).then(() => {
                        refreshUserProfile().catch(() => {});
                      }).catch(() => {});
                      broadcastRealtimeEvent();
                      showToast('Profile photo updated in real time!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <label htmlFor="parentAvatarPicker" className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                  Upload Profile Photo
                </label>
                {parentProfile.profileImage && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...parentProfile, profileImage: '' };
                      setParentProfile(updated);
                      updateUser({
                        profile_image: '',
                        profile: {
                          ...(user?.profile || {}),
                          profile_image: '',
                          profileImage: '',
                        }
                      });
                      authClient.put('/auth/me/', {
                        profile_image: '',
                        profile: {
                          profile_image: '',
                          profileImage: '',
                        }
                      }).then(() => {
                        refreshUserProfile().catch(() => {});
                      }).catch(() => {});
                      broadcastRealtimeEvent();
                      showToast('Photo removed!');
                    }}
                    className="px-3 py-1.5 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-50"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Select an image file to update your parent profile avatar in real time.</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-foreground">{t('Notification Preferences')}</h3>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
              <span>{t('Email notification for new assignment grades')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
              <span>{t('SMS alert for unexcused attendance absences')}</span>
            </label>
          </div>
        </div>
      </div>
      </>
    );

    // Fallback if section is not matched
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Parent Portal</h2>
        <p className="text-xs text-muted-foreground">Select an option from the sidebar to view your child's academic progress.</p>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['PARENT', 'ADMIN']}>
      <PortalLayout title="Parent Portal" activeSection={activeSection} onNavigate={setActiveSection}>
        {renderSection()}
      </PortalLayout>
    </ProtectedRoute>
  );
}
