import React, { useState, useEffect } from 'react';
import {
  CreditCard, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight,
  Download, History, Receipt, ShieldCheck, DollarSign, Calendar, Sparkles
} from 'lucide-react';
import {
  getPaymentItems,
  getStudentTransactions,
  getStudentItemStatus,
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

export function StudentPaymentPanel({
  studentId,
  studentName,
  studentEmail,
  gradeLevel = 'SS1'
}: StudentPaymentPanelProps) {
  const [items, setItems] = useState<PaymentItem[]>(() => getPaymentItems());
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => getStudentTransactions(studentId));
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ext_int_exam_parent: false
  });

  const [selectedItemForHistory, setSelectedItemForHistory] = useState<PaymentItem | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const refreshData = () => {
      setItems(getPaymentItems());
      setTransactions(getStudentTransactions(studentId));
    };

    refreshData();
    const unsub = subscribeToPaymentStore(refreshData);
    return () => unsub();
  }, [studentId]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handlePayItem = (item: PaymentItem) => {
    setFeedbackMessage(null);
    setIsProcessing(item.id);

    const itemStatus = getStudentItemStatus(studentId, item.id);
    const remainingAmount = item.amount - itemStatus.paidAmount;

    if (remainingAmount <= 0) {
      setFeedbackMessage({ type: 'success', text: `You have already fully paid for ${item.name}.` });
      setIsProcessing(null);
      return;
    }

    processPaystackPayment({
      email: studentEmail,
      amount: remainingAmount,
      itemName: item.name,
      itemId: item.id,
      studentId,
      studentName,
      onSuccess: (tx) => {
        setIsProcessing(null);
        setFeedbackMessage({
          type: 'success',
          text: `Payment of ₦${tx.amount.toLocaleString()} for ${item.name} completed successfully! Ref: ${tx.reference}`
        });
      },
      onError: (msg) => {
        setIsProcessing(null);
        setFeedbackMessage({ type: 'error', text: msg });
      },
      onClose: () => {
        setIsProcessing(null);
      }
    });
  };

  // Group top-level items and children
  const topLevelItems = items.filter(i => !i.parentId);
  const getChildItems = (parentId: string) => items.filter(i => i.parentId === parentId);

  const totalPaid = transactions.filter(t => t.status === 'SUCCESS').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paystack Secure Portal</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Payments & Fee Statements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage school fees, examination registrations, and ancillary payments for <span className="font-semibold text-foreground">{studentName}</span> ({gradeLevel}).
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shrink-0 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total Payments Verified</span>
            <span className="text-xl font-serif font-bold text-emerald-600">₦{totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs underline font-semibold ml-4">Dismiss</button>
        </div>
      )}

      {/* Payment Items Tree View */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
            <span>Payment Schedules & Categories</span>
          </h3>
          <span className="text-xs text-muted-foreground font-mono">Session 2026/2027</span>
        </div>

        <div className="space-y-3">
          {topLevelItems.map((item) => {
            const children = getChildItems(item.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedNodes[item.id];
            const itemStatus = getStudentItemStatus(studentId, item.id);
            const itemHistory = transactions.filter(t => t.itemId === item.id);

            return (
              <div key={item.id} className="border border-border rounded-xl bg-card/50 overflow-hidden transition-all">
                {/* Main Item Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/40 transition-colors">
                  <div className="flex items-start gap-3">
                    {hasChildren ? (
                      <button
                        onClick={() => toggleNode(item.id)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    ) : (
                      <div className="w-6 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
                        {item.isRequired && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Compulsory
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" /> Due: {item.dueDate}
                        </span>
                        <span>Term: {item.term.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    {!hasChildren && (
                      <div className="text-right">
                        <div className="text-base font-serif font-bold text-foreground">
                          ₦{item.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${
                            itemStatus.status === 'PAID' ? 'bg-emerald-500' : itemStatus.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            itemStatus.status === 'PAID' ? 'text-emerald-600' : itemStatus.status === 'PARTIAL' ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {itemStatus.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {hasChildren && (
                      <button
                        onClick={() => toggleNode(item.id)}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Options' : `View ${children.length} Options`}</span>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}

                    {!hasChildren && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedItemForHistory(item)}
                          title="View Payment Log & Receipts"
                          className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePayItem(item)}
                          disabled={itemStatus.status === 'PAID' || isProcessing === item.id}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                            itemStatus.status === 'PAID'
                              ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                              : 'bg-primary text-white hover:bg-primary/90 hover:scale-[1.02]'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isProcessing === item.id ? 'Connecting...' : itemStatus.status === 'PAID' ? 'Paid' : 'Pay Now'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-items Tree (e.g. WAEC, NECO, JSS3 BECE, FSLC under External / Internal Exam) */}
                {hasChildren && isExpanded && (
                  <div className="bg-muted/30 border-t border-border p-4 pl-12 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Select specific exam board or assessment:
                    </p>
                    {children.map(child => {
                      const childStatus = getStudentItemStatus(studentId, child.id);
                      return (
                        <div key={child.id} className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-foreground text-xs">{child.name}</h5>
                              <span className="text-[9px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {child.id.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{child.description}</p>
                            <span className="text-[10px] text-muted-foreground font-mono mt-1 block">Due: {child.dueDate}</span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                            <div className="text-right">
                              <div className="text-sm font-serif font-bold text-foreground">₦{child.amount.toLocaleString()}</div>
                              <span className={`text-[9px] font-bold uppercase ${
                                childStatus.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {childStatus.status}
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedItemForHistory(child)}
                              title="History"
                              className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handlePayItem(child)}
                              disabled={childStatus.status === 'PAID' || isProcessing === child.id}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                childStatus.status === 'PAID'
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-primary text-white hover:bg-primary/90'
                              }`}
                            >
                              {isProcessing === child.id ? 'Connecting...' : childStatus.status === 'PAID' ? 'Paid' : 'Pay Now'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Payment History & Receipt Modal */}
      {selectedItemForHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">{selectedItemForHistory.name}</h3>
                <p className="text-xs text-muted-foreground">Payment Log & Official Receipts</p>
              </div>
              <button
                onClick={() => setSelectedItemForHistory(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Item Details */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium text-foreground">{selectedItemForHistory.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Amount:</span>
                <span className="font-serif font-bold text-foreground">₦{selectedItemForHistory.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-mono text-foreground">{selectedItemForHistory.dueDate}</span>
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction Records</h4>
              {transactions.filter(t => t.itemId === selectedItemForHistory.id).length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                  No payment records found for this schedule.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {transactions
                    .filter(t => t.itemId === selectedItemForHistory.id)
                    .map(tx => (
                      <div key={tx.id} className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-foreground">₦{tx.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Ref: {tx.reference}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(tx.paidAt).toLocaleString()}</div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {tx.status}
                          </span>
                          <button
                            onClick={() => alert(`Official Receipt:\n\nStudent: ${studentName}\nItem: ${tx.itemName}\nAmount: ₦${tx.amount.toLocaleString()}\nRef: ${tx.reference}\nDate: ${tx.paidAt}`)}
                            className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" /> Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItemForHistory(null)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
