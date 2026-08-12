import React, { useState, useEffect } from 'react';
import {
  CreditCard, CheckCircle2, AlertCircle, ChevronRight,
  Download, History, Receipt, ShieldCheck, Home, BookOpen,
  FlaskConical, Users, GraduationCap, Shirt, Bus,
  Trophy, XCircle, FileText, Banknote, LayoutList,
  ChevronDown, BadgeAlert, RefreshCw, Sparkles, X
} from 'lucide-react';
import {
  getPaymentItems,
  getStudentTransactions,
  getStudentItemStatus,
  getItemAmountForGrade,
  processPaystackPayment,
  subscribeToPaymentStore,
  PaymentItem,
  PaymentTransaction
} from '@/lib/payments-store';

interface StudentPaymentPanelProps {
  studentId: string | number;
  studentName: string;
  studentEmail: string;
  gradeLevel?: string;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
  type: 'item' | 'heading' | 'action';
  itemId?: string;
}

const SIDEBAR_MENU: SidebarSection[] = [
  { id: 'header_accommodation', label: 'Accommodation', icon: Home, type: 'heading' },
  { id: 'boarding', label: 'Hostel / Boarding Fee', icon: Home, type: 'item', itemId: 'boarding' },
  { id: 'header_tuition', label: 'Tuition & Core', icon: BookOpen, type: 'heading' },
  { id: 'school_fees', label: 'Pay School Fees', icon: BookOpen, type: 'item', itemId: 'school_fees' },
  { id: 'lesson', label: 'Pay Lesson Fee', icon: BookOpen, type: 'item', itemId: 'lesson' },
  { id: 'books', label: 'Pay Books & Workbooks', icon: BookOpen, type: 'item', itemId: 'books' },
  { id: 'header_lab', label: 'Science & Labs', icon: FlaskConical, type: 'heading' },
  { id: 'lab_fee', label: 'Pay Laboratory Fee', icon: FlaskConical, type: 'item', itemId: 'lab_fee' },
  { id: 'header_attire', label: 'Attire & Identity', icon: Shirt, type: 'heading' },
  { id: 'uniform', label: 'Pay School Uniform', icon: Shirt, type: 'item', itemId: 'uniform' },
  { id: 'lost_id', label: 'Lost ID Card Replacement', icon: BadgeAlert, type: 'item', itemId: 'lost_id' },
  { id: 'header_transport', label: 'Transport', icon: Bus, type: 'heading' },
  { id: 'school_bus', label: 'Pay School Bus Fee', icon: Bus, type: 'item', itemId: 'school_bus' },
  { id: 'header_exams', label: 'Examinations', icon: GraduationCap, type: 'heading' },
  { id: 'exam', label: 'Pay Internal Exam Fee', icon: GraduationCap, type: 'item', itemId: 'exam' },
  { id: 'ext_int_exam_parent', label: 'External / Internal Exam', icon: GraduationCap, type: 'item', itemId: 'ext_int_exam_parent' },
  { id: 'header_activities', label: 'Activities & Events', icon: Trophy, type: 'heading' },
  { id: 'end_of_year', label: 'End of Year Activities', icon: Trophy, type: 'item', itemId: 'end_of_year' },
  { id: 'extracurricular', label: 'Pay Extracurricular Fee', icon: Users, type: 'item', itemId: 'extracurricular' },
  { id: 'header_special', label: 'Special Payments', icon: Banknote, type: 'heading' },
  { id: 'outstanding_balance', label: 'Pay Outstanding Balance', icon: Banknote, type: 'item', itemId: 'outstanding_balance' },
  { id: 'change_of_class', label: 'Change of Class / Stream', icon: RefreshCw, type: 'item', itemId: 'change_of_class' },
  { id: 'header_records', label: 'Records & History', icon: FileText, type: 'heading' },
  { id: 'payment_history', label: 'Payment History', icon: History, type: 'action' },
  { id: 'failed_transactions', label: 'Failed Transactions', icon: XCircle, type: 'action' },
];

const EXTRA_ITEMS: PaymentItem[] = [
  { id: 'lab_fee', name: 'Laboratory Fee', category: 'Science & Labs', amount: 12000, currency: 'NGN', dueDate: '2026-09-30', description: 'Science lab consumables, chemicals, and equipment maintenance', isRequired: true, term: '1ST_TERM', session: '2026/2027' },
  { id: 'lost_id', name: 'Lost ID Card Replacement', category: 'Identity', amount: 2500, currency: 'NGN', dueDate: '2027-06-30', description: 'Replacement of lost or damaged student ID card', isRequired: false, term: 'ALL', session: '2026/2027' },
  { id: 'extracurricular', name: 'Extracurricular Activities Fee', category: 'Events & Activities', amount: 8000, currency: 'NGN', dueDate: '2026-10-15', description: 'Sports clubs, arts, drama, debate, and inter-house competition levy', isRequired: false, term: '1ST_TERM', session: '2026/2027' },
  { id: 'outstanding_balance', name: 'Outstanding Fee Balance', category: 'Special', amount: 10000, currency: 'NGN', dueDate: '2027-06-30', description: 'Clear any remaining unpaid balance from previous or current term', isRequired: false, term: 'ALL', session: '2026/2027' },
  { id: 'change_of_class', name: 'Change of Class / Stream', category: 'Administrative', amount: 5000, currency: 'NGN', dueDate: '2027-06-30', description: 'Administrative processing fee for requesting a class or stream change', isRequired: false, term: 'ALL', session: '2026/2027' },
];

export function StudentPaymentPanel({ studentId, studentName, studentEmail, gradeLevel = 'SS1' }: StudentPaymentPanelProps) {
  const [storeItems, setStoreItems] = useState<PaymentItem[]>(() => getPaymentItems());
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => getStudentTransactions(studentId));
  const [activeSection, setActiveSection] = useState<string>('school_fees');
  const [expandedExam, setExpandedExam] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [receiptModal, setReceiptModal] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    const refreshData = () => {
      setStoreItems(getPaymentItems());
      setTransactions(getStudentTransactions(studentId));
    };
    refreshData();
    const unsub = subscribeToPaymentStore(refreshData);
    return () => unsub();
  }, [studentId]);

  const allItems: PaymentItem[] = [
    ...storeItems,
    ...EXTRA_ITEMS.filter(e => !storeItems.find(s => s.id === e.id))
  ];

  const getItem = (id: string) => allItems.find(i => i.id === id);
  const getChildren = (parentId: string) => allItems.filter(i => i.parentId === parentId);

  const totalPaid = transactions.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0);
  const failedTxs = transactions.filter(t => t.status === 'FAILED');
  const successTxs = transactions.filter(t => t.status === 'SUCCESS');

  const handlePayItem = (item: PaymentItem) => {
    setFeedbackMessage(null);
    setIsProcessing(item.id);
    const itemAmount = getItemAmountForGrade(item, gradeLevel);
    const itemStatus = getStudentItemStatus(studentId, item.id, gradeLevel);
    const remaining = itemAmount - itemStatus.paidAmount;
    if (remaining <= 0) {
      setFeedbackMessage({ type: 'success', text: `You have already fully paid for ${item.name}.` });
      setIsProcessing(null);
      return;
    }
    processPaystackPayment({
      email: studentEmail,
      amount: remaining,
      itemName: item.name,
      itemId: item.id,
      studentId,
      studentName,
      onSuccess: (tx) => { setIsProcessing(null); setFeedbackMessage({ type: 'success', text: `Payment of ₦${tx.amount.toLocaleString()} for ${item.name} completed! Ref: ${tx.reference}` }); },
      onError: (msg) => { setIsProcessing(null); setFeedbackMessage({ type: 'error', text: msg }); },
      onClose: () => setIsProcessing(null),
    });
  };

  const renderContent = () => {
    if (activeSection === 'payment_history') {
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <History className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">Payment History</h3>
              <p className="text-xs text-muted-foreground">All verified transactions for {studentName}</p>
            </div>
          </div>
          {successTxs.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <LayoutList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No payment records yet</p>
              <p className="text-xs text-muted-foreground mt-1">Completed payments will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {successTxs.map(tx => (
                <div key={tx.id} className="p-4 rounded-xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{tx.itemName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">Ref: {tx.reference}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <span className="font-serif font-bold text-base text-emerald-600">₦{tx.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Verified</span>
                    <button onClick={() => setReceiptModal(tx)} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                      <Receipt className="w-3.5 h-3.5" /> Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'failed_transactions') {
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <XCircle className="w-5 h-5 text-destructive" />
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">Failed Transactions</h3>
              <p className="text-xs text-muted-foreground">Payments that could not be processed</p>
            </div>
          </div>
          {failedTxs.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No failed transactions</p>
              <p className="text-xs text-muted-foreground mt-1">All your payments have been successful</p>
            </div>
          ) : (
            <div className="space-y-2">
              {failedTxs.map(tx => (
                <div key={tx.id} className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{tx.itemName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">Ref: {tx.reference}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <span className="font-serif font-bold text-base text-destructive">₦{tx.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">Failed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const sidebarEntry = SIDEBAR_MENU.find(s => s.id === activeSection);
    const itemId = sidebarEntry?.itemId || activeSection;
    const item = getItem(itemId);
    if (!item) {
      return (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <LayoutList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Select a payment item from the sidebar</p>
        </div>
      );
    }

    const effectiveAmount = getItemAmountForGrade(item, gradeLevel);
    const itemStatus = getStudentItemStatus(studentId, item.id, gradeLevel);
    const children = getChildren(item.id);
    const hasChildren = children.length > 0;
    const itemTxs = transactions.filter(t => t.itemId === item.id && t.status === 'SUCCESS');
    const remaining = effectiveAmount > 0 ? effectiveAmount - itemStatus.paidAmount : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-bold text-xl text-foreground">{item.name}</h3>
              {item.isRequired && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">Required</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
              <span>Category: <span className="font-semibold text-foreground">{item.category}</span></span>
              <span>Due: <span className="font-semibold text-foreground">{item.dueDate}</span></span>
              <span>Term: <span className="font-semibold text-foreground">{item.term.replace('_', ' ')}</span></span>
            </div>
          </div>
          {!hasChildren && effectiveAmount > 0 && (
            <div className="shrink-0 text-right">
              <div className="text-2xl font-serif font-bold text-foreground">₦{effectiveAmount.toLocaleString()}</div>
              <div className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                itemStatus.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                itemStatus.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                'bg-rose-500/10 text-rose-600 border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${itemStatus.status === 'PAID' ? 'bg-emerald-500' : itemStatus.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                {itemStatus.status}
              </div>
            </div>
          )}
        </div>

        {feedbackMessage && (
          <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${feedbackMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span className="text-xs">{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-xs font-bold ml-4 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {hasChildren && (
          <div className="space-y-3">
            <button
              onClick={() => setExpandedExam(p => !p)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition"
            >
              <span className="text-sm font-bold text-foreground">Available Examination Boards / Options</span>
              {expandedExam ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-primary" />}
            </button>
            {expandedExam && (
              <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                {children.map(child => {
                  const cStatus = getStudentItemStatus(studentId, child.id);
                  return (
                    <div key={child.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="font-bold text-sm text-foreground">{child.name}</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">{child.description}</p>
                        <span className="text-[10px] font-mono text-muted-foreground">Due: {child.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-serif font-bold text-foreground">₦{child.amount.toLocaleString()}</div>
                          <span className={`text-[9px] font-bold uppercase ${cStatus.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>{cStatus.status}</span>
                        </div>
                        <button
                          onClick={() => handlePayItem(child)}
                          disabled={cStatus.status === 'PAID' || isProcessing === child.id}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${cStatus.status === 'PAID' ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {isProcessing === child.id ? 'Connecting…' : cStatus.status === 'PAID' ? 'Paid ✓' : 'Pay Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!hasChildren && effectiveAmount === 0 && (
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>Fee Amount Pending Admin Setup</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              The school administration has not configured the price for {item.name} yet. Once the Bursar sets the official fee amount in the Financial Management portal, the payment option will appear here automatically.
            </p>
          </div>
        )}

        {!hasChildren && effectiveAmount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Due</p>
              <p className="text-xl font-serif font-bold text-foreground">₦{effectiveAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Amount Paid</p>
              <p className="text-xl font-serif font-bold text-emerald-600">₦{itemStatus.paidAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Balance</p>
              <p className="text-xl font-serif font-bold text-amber-600">₦{Math.max(remaining, 0).toLocaleString()}</p>
            </div>
          </div>
        )}

        {!hasChildren && item.amount > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handlePayItem(item)}
              disabled={itemStatus.status === 'PAID' || isProcessing === item.id}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                itemStatus.status === 'PAID'
                  ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                  : 'bg-primary text-white hover:bg-primary/90 hover:scale-[1.01]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing === item.id ? 'Connecting to Paystack…' : itemStatus.status === 'PAID' ? 'Payment Completed ✓' : `Pay ₦${Math.max(remaining, 0).toLocaleString()} via Paystack`}
            </button>
            <button
              onClick={() => setActiveSection('payment_history')}
              className="px-5 py-3.5 rounded-2xl text-sm font-bold border border-border text-muted-foreground hover:bg-muted transition flex items-center gap-2"
            >
              <History className="w-4 h-4" /> View Receipt Log
            </button>
          </div>
        )}

        {!hasChildren && itemTxs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Payments for This Item</h4>
            <div className="space-y-2">
              {itemTxs.slice(0, 5).map(tx => (
                <div key={tx.id} className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">₦{tx.amount.toLocaleString()}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">Ref: {tx.reference}</p>
                      <p className="text-[9px] text-muted-foreground">{new Date(tx.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={() => setReceiptModal(tx)} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                    <Receipt className="w-3 h-3" /> Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paystack Secure Payment Portal · Session 2026/2027</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Payments & Fee Schedules</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage fees & payments for <span className="font-semibold text-foreground">{studentName}</span> ({gradeLevel})</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shrink-0 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total Verified Payments</span>
            <span className="text-xl font-serif font-bold text-emerald-600">₦{totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-2 py-1">Payment Page</h4>
          </div>
          <nav className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
            {SIDEBAR_MENU.map(section => {
              if (section.type === 'heading') {
                return (
                  <div key={section.id} className="px-3 pt-3 pb-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60">{section.label}</span>
                  </div>
                );
              }
              const isActive = activeSection === section.id;
              const Icon = section.icon;
              let statusDot: string | null = null;
              if (section.type === 'item' && section.itemId) {
                const it = getItem(section.itemId);
                if (it && it.amount > 0 && getChildren(section.itemId).length === 0) {
                  const s = getStudentItemStatus(studentId, section.itemId);
                  statusDot = s.status === 'PAID' ? 'bg-emerald-500' : s.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-rose-400';
                }
              }
              return (
                <button
                  key={section.id}
                  onClick={() => { setActiveSection(section.id); setFeedbackMessage(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 truncate">{section.label}</span>
                  {statusDot && <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot} ${isActive ? 'opacity-80' : ''}`} />}
                  {section.type === 'action' && section.id === 'failed_transactions' && failedTxs.length > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-destructive/10 text-destructive'}`}>{failedTxs.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane */}
        <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm p-6">
          {renderContent()}
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Official Receipt</h3>
                <p className="text-xs text-muted-foreground">Tarepet Montessori School — Fee Clearance</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2.5">
              {[
                ['Student', studentName],
                ['Item', receiptModal.itemName],
                ['Amount Paid', `₦${receiptModal.amount.toLocaleString()}`],
                ['Reference', receiptModal.reference],
                ['Channel', receiptModal.channel.toUpperCase()],
                ['Date', new Date(receiptModal.paidAt).toLocaleString()],
                ['Session', receiptModal.session],
                ['Term', receiptModal.term.replace('_', ' ')],
                ['Status', receiptModal.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground text-xs font-medium">{label}</span>
                  <span className={`text-xs font-bold text-right ${label === 'Status' ? 'text-emerald-600' : label === 'Amount Paid' ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => alert(`TAREPET MONTESSORI SCHOOL\nFEE PAYMENT RECEIPT\n\nStudent: ${studentName}\nItem: ${receiptModal.itemName}\nAmount: ₦${receiptModal.amount.toLocaleString()}\nRef: ${receiptModal.reference}\nDate: ${new Date(receiptModal.paidAt).toLocaleString()}\nStatus: ${receiptModal.status}`)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button onClick={() => setReceiptModal(null)} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}