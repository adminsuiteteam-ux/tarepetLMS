import React, { useState, useEffect } from 'react';
import {
  CreditCard, CheckCircle2, AlertCircle, ChevronRight,
  Download, History, Receipt, ShieldCheck, Home, BookOpen,
  FlaskConical, Users, GraduationCap, Shirt, Bus,
  Trophy, XCircle, FileText, Banknote, LayoutList,
  ChevronDown, BadgeAlert, RefreshCw, Sparkles, X, Building2
} from 'lucide-react';
import {
  getPaymentItems,
  getStudentTransactions,
  getStudentItemStatus,
  getItemAmountForGrade,
  processPaystackPayment,
  subscribeToPaymentStore,
  syncPaymentsWithBackend,
  PaymentItem,
  PaymentTransaction
} from '@/lib/payments-store';
import { useTranslation } from '@/lib/i18n';
import { useCustomDialog } from '@/context/DialogContext';

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
  { id: 'header_tuition', label: 'Tuition & Core Fees', icon: BookOpen, type: 'heading' },
  { id: 'school_fees', label: 'Tuition Fee', icon: BookOpen, type: 'item', itemId: 'school_fees' },
  { id: 'dev_levy', label: 'Development Levy', icon: Building2, type: 'item', itemId: 'dev_levy' },
  { id: 'books', label: 'Books & Materials', icon: BookOpen, type: 'item', itemId: 'books' },
  { id: 'uniform', label: 'Uniform & Sports Attire', icon: Shirt, type: 'item', itemId: 'uniform' },
  { id: 'pta_medical', label: 'PTA & Medical Retainership', icon: Users, type: 'item', itemId: 'pta_medical' },
  { id: 'exam', label: 'Exam / Assessment Levy', icon: GraduationCap, type: 'item', itemId: 'exam' },
  { id: 'header_services', label: 'Optional Student Services', icon: Bus, type: 'heading' },
  { id: 'boarding', label: 'Hostel & Boarding', icon: Home, type: 'item', itemId: 'boarding' },
  { id: 'school_bus', label: 'School Bus Transport', icon: Bus, type: 'item', itemId: 'school_bus' },
  { id: 'header_records', label: 'Records & Receipts', icon: FileText, type: 'heading' },
  { id: 'payment_history', label: 'Payment History', icon: History, type: 'action' },
  { id: 'failed_transactions', label: 'Failed Transactions', icon: XCircle, type: 'action' },
];

export function StudentPaymentPanel({ studentId, studentName, studentEmail, gradeLevel = 'SS1' }: StudentPaymentPanelProps) {
  const { t } = useTranslation();
  const { showAlert } = useCustomDialog();
  const [storeItems, setStoreItems] = useState<PaymentItem[]>(() => getPaymentItems());
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => getStudentTransactions(studentId));
  const [activeSection, setActiveSection] = useState<string>('school_fees');
  const [expandedExam, setExpandedExam] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [receiptModal, setReceiptModal] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    syncPaymentsWithBackend().catch(() => {});
    const refreshData = () => {
      setStoreItems(getPaymentItems());
      setTransactions(getStudentTransactions(studentId));
    };
    refreshData();
    const unsub = subscribeToPaymentStore(refreshData);
    return () => unsub();
  }, [studentId]);

  const allItems: PaymentItem[] = storeItems;

  const getItem = (id: string) => allItems.find(i => i.id === id);
  const getChildren = (parentId: string) => allItems.filter(i => i.parentId === parentId);

  const totalPaid = transactions.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0);
  const failedTxs = transactions.filter(t => t.status === 'FAILED');
  const successTxs = transactions.filter(t => t.status === 'SUCCESS');

  interface CheckoutFlowState {
    item: PaymentItem;
    amount: number;
    term: string;
    year: string;
    payerName: string;
    payerEmail: string;
    step: 'form' | 'preview';
  }

  const [checkoutFlow, setCheckoutFlow] = useState<CheckoutFlowState | null>(null);

  const handlePayItem = (item: PaymentItem) => {
    setFeedbackMessage(null);
    const itemAmount = getItemAmountForGrade(item, gradeLevel);
    const itemStatus = getStudentItemStatus(studentId, item.id, gradeLevel);
    const remaining = itemAmount - itemStatus.paidAmount;
    if (remaining <= 0) {
      setFeedbackMessage({ type: 'success', text: `You have already fully paid for ${item.name}.` });
      return;
    }
    setCheckoutFlow({
      item,
      amount: remaining,
      term: item.term || '1ST_TERM',
      year: item.session || '2026/2027',
      payerName: studentName,
      payerEmail: studentEmail || 'student@tarepetmontessori.org',
      step: 'form',
    });
  };

  const handleLaunchPaystack = () => {
    if (!checkoutFlow) return;
    const { item, amount, term, year, payerEmail, payerName } = checkoutFlow;
    setIsProcessing(item.id);
    processPaystackPayment({
      email: payerEmail,
      amount,
      itemName: item.name,
      itemId: item.id,
      studentId,
      studentName: payerName || studentName,
      term,
      session: year,
      onSuccess: (tx) => {
        setIsProcessing(null);
        setCheckoutFlow(null);
        setFeedbackMessage({
          type: 'success',
          text: `Payment of ₦${tx.amount.toLocaleString()} for ${item.name} (${term.replace('_', ' ')} ${year}) completed! Ref: ${tx.reference}`
        });
      },
      onError: (msg) => {
        setIsProcessing(null);
        setFeedbackMessage({ type: 'error', text: msg });
      },
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
              <h3 className="font-serif font-bold text-lg text-foreground">{t('Payment History', 'Payment History')}</h3>
              <p className="text-xs text-muted-foreground">{t('All verified transactions for ', 'All verified transactions for ')}{studentName}</p>
            </div>
          </div>
          {successTxs.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <LayoutList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">{t('No payment records yet', 'No payment records yet')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('Completed payments will appear here', 'Completed payments will appear here')}</p>
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
                      <p className="text-[10px] font-mono text-muted-foreground">{t('Ref: ', 'Ref: ')}{tx.reference}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <span className="font-serif font-bold text-base text-emerald-600">₦{tx.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{t('Verified', 'Verified')}</span>
                    <button onClick={() => setReceiptModal(tx)} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                      <Receipt className="w-3.5 h-3.5" /> {t('Receipt', 'Receipt')}
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
              <h3 className="font-serif font-bold text-lg text-foreground">{t('Failed Transactions', 'Failed Transactions')}</h3>
              <p className="text-xs text-muted-foreground">{t('Payments that could not be processed', 'Payments that could not be processed')}</p>
            </div>
          </div>
          {failedTxs.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">{t('No failed transactions', 'No failed transactions')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('All your payments have been successful', 'All your payments have been successful')}</p>
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
                      <p className="text-[10px] font-mono text-muted-foreground">{t('Ref: ', 'Ref: ')}{tx.reference}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <span className="font-serif font-bold text-base text-destructive">₦{tx.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t('Failed', 'Failed')}</span>
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
          <p className="text-sm text-muted-foreground font-medium">{t('Select a payment item from the sidebar', 'Select a payment item from the sidebar')}</p>
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
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">{t('Required', 'Required')}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
              <span>{t('Category: ', 'Category: ')}<span className="font-semibold text-foreground">{item.category}</span></span>
              <span>{t('Due: ', 'Due: ')}<span className="font-semibold text-foreground">{item.dueDate}</span></span>
              <span>{t('Term: ', 'Term: ')}<span className="font-semibold text-foreground">{item.term.replace('_', ' ')}</span></span>
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
              <span className="text-sm font-bold text-foreground">{t('Available Examination Boards / Options', 'Available Examination Boards / Options')}</span>
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
                        <span className="text-[10px] font-mono text-muted-foreground">{t('Due: ', 'Due: ')}{child.dueDate}</span>
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
                          {isProcessing === child.id ? t('Connecting…', 'Connecting…') : cStatus.status === 'PAID' ? t('Paid ✓', 'Paid ✓') : t('Pay Now', 'Pay Now')}
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
              <span>{t('Fee Amount Pending Admin Setup', 'Fee Amount Pending Admin Setup')}</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {t('The school administration has not configured the price for ', 'The school administration has not configured the price for ')}{item.name}{t(' yet. Once the Bursar sets the official fee amount in the Financial Management portal, the payment option will appear here automatically.', ' yet. Once the Bursar sets the official fee amount in the Financial Management portal, the payment option will appear here automatically.')}
            </p>
          </div>
        )}

        {!hasChildren && effectiveAmount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Total Due', 'Total Due')}</p>
              <p className="text-xl font-serif font-bold text-foreground">₦{effectiveAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Amount Paid', 'Amount Paid')}</p>
              <p className="text-xl font-serif font-bold text-emerald-600">₦{itemStatus.paidAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Balance', 'Balance')}</p>
              <p className="text-xl font-serif font-bold text-amber-600">₦{Math.max(remaining, 0).toLocaleString()}</p>
            </div>
          </div>
        )}

        {!hasChildren && effectiveAmount > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handlePayItem(item)}
              disabled={itemStatus.status === 'PAID' || isProcessing === item.id}
              className={`flex-1 py-4 px-6 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2.5 shadow-lg ${
                itemStatus.status === 'PAID'
                  ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border shadow-none'
                  : 'bg-primary text-white hover:bg-primary/90 hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing === item.id
                ? t('Connecting to Paystack…', 'Connecting to Paystack…')
                : itemStatus.status === 'PAID'
                ? t('Payment Completed ✓', 'Payment Completed ✓')
                : `${t('Proceed to Pay ', 'Proceed to Pay ')}₦${Math.max(remaining, 0).toLocaleString()}${t(' with Paystack', ' with Paystack')}`}
            </button>
            <button
              onClick={() => setActiveSection('payment_history')}
              className="px-5 py-4 rounded-2xl text-sm font-bold border border-border text-muted-foreground hover:bg-muted transition flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" /> {t('View Payment History', 'View Payment History')}
            </button>
          </div>
        )}

        {!hasChildren && itemTxs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('Recent Payments for This Item', 'Recent Payments for This Item')}</h4>
            <div className="space-y-2">
              {itemTxs.slice(0, 5).map(tx => (
                <div key={tx.id} className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">₦{tx.amount.toLocaleString()}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">{t('Ref: ', 'Ref: ')}{tx.reference}</p>
                      <p className="text-[9px] text-muted-foreground">{new Date(tx.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={() => setReceiptModal(tx)} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                    <Receipt className="w-3 h-3" /> {t('Receipt', 'Receipt')}
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
            <span>{t('Paystack Secure Payment Portal · Session 2026/2027', 'Paystack Secure Payment Portal · Session 2026/2027')}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{t('Payments & Fee Schedules', 'Payments & Fee Schedules')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('Manage fees & payments for ', 'Manage fees & payments for ')}<span className="font-semibold text-foreground">{studentName}</span> ({gradeLevel})</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shrink-0 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('Total Verified Payments', 'Total Verified Payments')}</span>
            <span className="text-xl font-serif font-bold text-emerald-600">₦{totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-2 py-1">{t('Payment Page', 'Payment Page')}</h4>
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

      {/* Checkout Flow Modal: Form -> Preview -> Continue to Paystack */}
      {checkoutFlow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">
                    {checkoutFlow.step === 'form' ? t('Payment Configuration', 'Payment Configuration') : t('Confirm & Preview Payment', 'Confirm & Preview Payment')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {checkoutFlow.step === 'form'
                      ? t('Step 1 of 2: Select term and academic year', 'Step 1 of 2: Select term and academic year')
                      : t('Step 2 of 2: Review details before Paystack checkout', 'Step 2 of 2: Review details before Paystack checkout')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutFlow(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded-lg text-center font-bold transition-all ${checkoutFlow.step === 'form' ? 'bg-primary text-white shadow-xs' : 'bg-muted/50 text-muted-foreground'}`}>
                1. {t('Fill Term & Year', 'Fill Term & Year')}
              </div>
              <div className={`p-2 rounded-lg text-center font-bold transition-all ${checkoutFlow.step === 'preview' ? 'bg-primary text-white shadow-xs' : 'bg-muted/50 text-muted-foreground'}`}>
                2. {t('Preview & Confirm', 'Preview & Confirm')}
              </div>
            </div>

            {/* Fee Snapshot Banner */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('Fee Item', 'Fee Item')}</span>
                <h4 className="font-serif font-bold text-foreground text-sm sm:text-base">{checkoutFlow.item.name}</h4>
                <p className="text-xs text-muted-foreground">{studentName} · {gradeLevel}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('Amount Due', 'Amount Due')}</span>
                <div className="text-xl sm:text-2xl font-serif font-bold text-primary">
                  ₦{checkoutFlow.amount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* STEP 1: FORM */}
            {checkoutFlow.step === 'form' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('Academic Term', 'Academic Term')} <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={checkoutFlow.term}
                    onChange={(e) => setCheckoutFlow({ ...checkoutFlow, term: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  >
                    <option value="1ST_TERM">{t('1st Term (First Term)', '1st Term (First Term)')}</option>
                    <option value="2ND_TERM">{t('2nd Term (Second Term)', '2nd Term (Second Term)')}</option>
                    <option value="3RD_TERM">{t('3rd Term (Third Term)', '3rd Term (Third Term)')}</option>
                    <option value="ALL">{t('Full Session / Annual', 'Full Session / Annual')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('Academic Year / Session', 'Academic Year / Session')} <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={checkoutFlow.year}
                    onChange={(e) => setCheckoutFlow({ ...checkoutFlow, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  >
                    <option value="2026/2027">{t('2026/2027 (Current Academic Session)', '2026/2027 (Current Academic Session)')}</option>
                    <option value="2025/2026">{t('2025/2026 (Previous Academic Session)', '2025/2026 (Previous Academic Session)')}</option>
                    <option value="2027/2028">{t('2027/2028 (Upcoming Academic Session)', '2027/2028 (Upcoming Academic Session)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('Payer / Student Name', 'Payer / Student Name')}
                  </label>
                  <input
                    type="text"
                    value={checkoutFlow.payerName}
                    onChange={(e) => setCheckoutFlow({ ...checkoutFlow, payerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="Enter payer full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('Email Address (for Receipt & Verification)', 'Email Address (for Receipt & Verification)')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={checkoutFlow.payerEmail}
                    onChange={(e) => setCheckoutFlow({ ...checkoutFlow, payerEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="name@example.com"
                  />
                </div>

                {/* Channels Guarantee Notice */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex items-start gap-2.5 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground">{t('Paystack Checkout Channels: ', 'Paystack Checkout Channels: ')}</span>
                    <span>{t('Strictly Card (Mastercard / Visa / Verve) and Bank Transfer only.', 'Strictly Card (Mastercard / Visa / Verve) and Bank Transfer only.')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutFlow(null)}
                    className="flex-1 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition cursor-pointer"
                  >
                    {t('Cancel', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutFlow({ ...checkoutFlow, step: 'preview' })}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    {t('Next: Preview & Confirm', 'Next: Preview & Confirm')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & CONFIRMATION */}
            {checkoutFlow.step === 'preview' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-medium">{t('Student Name', 'Student Name')}</span>
                    <span className="font-bold text-foreground">{checkoutFlow.payerName || studentName}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-medium">{t('Student ID / Class', 'Student ID / Class')}</span>
                    <span className="font-mono font-bold text-foreground">{studentId} · {gradeLevel}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-medium">{t('Fee Category & Item', 'Fee Category & Item')}</span>
                    <span className="font-bold text-foreground">{checkoutFlow.item.name}</span>
                  </div>
                  <div className="p-3 flex justify-between bg-primary/5">
                    <span className="text-primary font-bold">{t('Academic Term', 'Academic Term')}</span>
                    <span className="font-bold text-primary">{checkoutFlow.term.replace('_', ' ')}</span>
                  </div>
                  <div className="p-3 flex justify-between bg-primary/5">
                    <span className="text-primary font-bold">{t('Academic Session / Year', 'Academic Session / Year')}</span>
                    <span className="font-bold text-primary">{checkoutFlow.year}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground font-medium">{t('Receipt Recipient', 'Receipt Recipient')}</span>
                    <span className="font-mono text-foreground">{checkoutFlow.payerEmail}</span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center bg-muted/20">
                    <span className="font-bold text-foreground text-sm">{t('Total Amount to Pay', 'Total Amount to Pay')}</span>
                    <span className="font-serif font-extrabold text-xl text-emerald-600">₦{checkoutFlow.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment channel reminder */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-semibold">{t('Channels on Paystack: Card & Bank Transfer', 'Channels on Paystack: Card & Bank Transfer')}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full">{t('Instant', 'Instant')}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutFlow({ ...checkoutFlow, step: 'form' })}
                    className="flex-1 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    ← {t('Back / Edit Details', 'Back / Edit Details')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchPaystack}
                    disabled={isProcessing === checkoutFlow.item.id}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessing === checkoutFlow.item.id
                      ? t('Opening Paystack…', 'Opening Paystack…')
                      : t('Continue to Paystack', 'Continue to Paystack')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">{t('Official Receipt', 'Official Receipt')}</h3>
                <p className="text-xs text-muted-foreground">{t('Tarepet Montessori School — Fee Clearance', 'Tarepet Montessori School — Fee Clearance')}</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2.5">
              {[
                [t('Student', 'Student'), studentName],
                [t('Item', 'Item'), receiptModal.itemName],
                [t('Amount Paid', 'Amount Paid'), `₦${receiptModal.amount.toLocaleString()}`],
                [t('Reference', 'Reference'), receiptModal.reference],
                [t('Channel', 'Channel'), receiptModal.channel.toUpperCase()],
                [t('Date', 'Date'), new Date(receiptModal.paidAt).toLocaleString()],
                [t('Session', 'Session'), receiptModal.session],
                [t('Term', 'Term'), receiptModal.term.replace('_', ' ')],
                [t('Status', 'Status'), receiptModal.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground text-xs font-medium">{label}</span>
                  <span className={`text-xs font-bold text-right ${label === 'Status' ? 'text-emerald-600' : label === 'Amount Paid' ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => showAlert({
                  title: 'Fee Payment Receipt',
                  message: `Student: ${studentName}\nItem: ${receiptModal.itemName}\nAmount: ₦${receiptModal.amount.toLocaleString()}\nRef: ${receiptModal.reference}\nDate: ${new Date(receiptModal.paidAt).toLocaleString()}\nStatus: Verified (${receiptModal.status})`,
                  type: 'success',
                  badge: 'Tarepet Bursary',
                  confirmText: 'Print / Save Receipt',
                })}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> {t('Download', 'Download')}
              </button>
              <button onClick={() => setReceiptModal(null)} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition">{t('Close', 'Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}