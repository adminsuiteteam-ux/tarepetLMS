import { authClient, getAccessToken } from './api-auth';
import { addRealtimeNotification } from './notifications-store';
import { sendWebSocketEvent } from './websocket-client';

export interface PaymentItem {
  id: string;
  name: string;
  category: string; // e.g. "Core Fees", "Transport & Living", "Exams"
  parentId?: string; // For nested items like External / Internal Exam -> WAEC, NECO, JSS3, FSLC
  amount: number;
  gradeAmounts?: Record<string, number>; // Class-specific prices e.g. { NUR1: 45000, PRI1: 65000, JSS1: 75000, SS1: 85000 }
  currency: string;
  dueDate: string;
  description?: string;
  isRequired: boolean;
  term: '1ST_TERM' | '2ND_TERM' | '3RD_TERM' | 'ALL';
  session: string;
}

export interface PaymentTransaction {
  id: string;
  studentId: string | number;
  studentName: string;
  studentEmail: string;
  itemId: string;
  itemName: string;
  amount: number;
  currency: string;
  reference: string;
  channel: 'paystack' | 'bank_transfer' | 'cash';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  paidAt: string;
  receiptUrl?: string;
  term: string;
  session: string;
}

// Payment items structured with 0 default amounts (configured dynamically by Admin/Bursar)
const DEFAULT_PAYMENT_ITEMS: PaymentItem[] = [
  {
    id: 'school_fees',
    name: 'School Tuition Fees',
    category: 'Tuition & Basic',
    amount: 0,
    currency: 'NGN',
    dueDate: 'Term Scheduled Date',
    description: 'Core academic tuition and instructional services',
    isRequired: true,
    term: '1ST_TERM',
    session: '2025/2026'
  },
  {
    id: 'uniform',
    name: 'School Uniform Package',
    category: 'Attire',
    amount: 0,
    currency: 'NGN',
    dueDate: 'Term Scheduled Date',
    description: 'Official school uniform set, sports wear, and school cardigan',
    isRequired: false,
    term: '1ST_TERM',
    session: '2025/2026'
  },
  {
    id: 'books',
    name: 'Curriculum Textbooks & Materials',
    category: 'Educational Supplies',
    amount: 0,
    currency: 'NGN',
    dueDate: 'Term Scheduled Date',
    description: 'Prescribed academic textbooks, exercise notebooks, and learning materials',
    isRequired: false,
    term: '1ST_TERM',
    session: '2025/2026'
  },
  {
    id: 'exam',
    name: 'Terminal Assessment & Examination Fee',
    category: 'Assessments',
    amount: 0,
    currency: 'NGN',
    dueDate: 'Term Scheduled Date',
    description: 'Continuous assessment and terminal examination processing',
    isRequired: false,
    term: '1ST_TERM',
    session: '2025/2026'
  },
  {
    id: 'boarding',
    name: 'Hostel & Boarding Accommodation',
    category: 'Accommodation',
    amount: 0,
    currency: 'NGN',
    dueDate: 'Term Scheduled Date',
    description: 'Termly hostel accommodation and welfare for boarding students',
    isRequired: false,
    term: '1ST_TERM',
    session: '2025/2026'
  },
  {
    id: 'school_bus',
    name: 'School Bus Transport',
    category: 'Transport',
    amount: 0,
    currency: 'NGN',
    dueDate: 'Term Scheduled Date',
    description: 'Daily school shuttle transport service',
    isRequired: false,
    term: '1ST_TERM',
    session: '2025/2026'
  }
];

function loadSavedPaymentItems(): PaymentItem[] {
  if (typeof window === 'undefined') return DEFAULT_PAYMENT_ITEMS;
  try {
    const saved = localStorage.getItem('tarepet_fee_items');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure all fields are intact
        return DEFAULT_PAYMENT_ITEMS.map(def => {
          const match = parsed.find((p: any) => p.id === def.id);
          return match ? { ...def, amount: Number(match.amount), gradeAmounts: match.gradeAmounts || def.gradeAmounts || {} } : def;
        });
      }
    }
  } catch (e) { /* fallback */ }
  return DEFAULT_PAYMENT_ITEMS;
}

function loadSavedTransactions(): PaymentTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_fee_transactions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { /* fallback */ }
  return [];
}

export interface ClassFeeSchedule {
  id?: number | string;
  class_level: string;
  division: 'CRECHE_NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';
  tuition_fee: number;
  development_levy: number;
  books_materials: number;
  uniform_sports: number;
  pta_medical: number;
  exam_levy: number;
  total_fee?: number;
  session?: string;
  term?: string;
}

export interface DiscountPolicy {
  id?: number | string;
  code: string;
  name: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
  is_active: boolean;
}

export const DEFAULT_CLASS_FEE_SCHEDULES: ClassFeeSchedule[] = [
  { class_level: 'Nursery 1', division: 'CRECHE_NURSERY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Nursery 2', division: 'CRECHE_NURSERY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Nursery 3', division: 'CRECHE_NURSERY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Primary 1', division: 'PRIMARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Primary 2', division: 'PRIMARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Primary 3', division: 'PRIMARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Primary 4', division: 'PRIMARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Primary 5', division: 'PRIMARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'Primary 6', division: 'PRIMARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'JSS 1', division: 'JUNIOR_SECONDARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'JSS 2', division: 'JUNIOR_SECONDARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'JSS 3', division: 'JUNIOR_SECONDARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'SS 1', division: 'SENIOR_SECONDARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'SS 2', division: 'SENIOR_SECONDARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
  { class_level: 'SS 3', division: 'SENIOR_SECONDARY', tuition_fee: 0, development_levy: 0, books_materials: 0, uniform_sports: 0, pta_medical: 0, exam_levy: 0, session: '2025/2026', term: '2nd Term' },
];

export const DEFAULT_DISCOUNT_POLICIES: DiscountPolicy[] = [];

function loadSavedClassSchedules(): ClassFeeSchedule[] {
  if (typeof window === 'undefined') return DEFAULT_CLASS_FEE_SCHEDULES;
  try {
    const saved = localStorage.getItem('tarepet_class_fee_schedules');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasLegacyMock = Array.isArray(parsed) && parsed.some((p: any) => p.class_level === 'Nursery 1' && p.tuition_fee === 35000);
      if (hasLegacyMock) {
        localStorage.removeItem('tarepet_class_fee_schedules');
        return DEFAULT_CLASS_FEE_SCHEDULES;
      }
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_CLASS_FEE_SCHEDULES;
}

function loadSavedDiscountPolicies(): DiscountPolicy[] {
  if (typeof window === 'undefined') return DEFAULT_DISCOUNT_POLICIES;
  try {
    const saved = localStorage.getItem('tarepet_discount_policies');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasLegacyMock = Array.isArray(parsed) && parsed.some((p: any) => p.code === 'SIBLING_2ND');
      if (hasLegacyMock) {
        localStorage.removeItem('tarepet_discount_policies');
        return DEFAULT_DISCOUNT_POLICIES;
      }
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_DISCOUNT_POLICIES;
}

let _paymentItems: PaymentItem[] = loadSavedPaymentItems();
let _transactions: PaymentTransaction[] = loadSavedTransactions();
let _classSchedules: ClassFeeSchedule[] = loadSavedClassSchedules();
let _discountPolicies: DiscountPolicy[] = loadSavedDiscountPolicies();

// Broadcast Channel for real-time payments across tabs
let paymentBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    paymentBroadcastChannel = new BroadcastChannel('tarepet_realtime_payments');
  } catch (e) {
    // fallback
  }
}

function broadcastPaymentMutation() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('tarepet_payments_updated'));
  if (paymentBroadcastChannel) {
    try {
      paymentBroadcastChannel.postMessage({ type: 'PAYMENTS_MUTATED', timestamp: Date.now() });
    } catch (e) { /* ignore */ }
  }
  // Send via WebSocket to sync fee transactions live across tabs and devices
  sendWebSocketEvent('PAYMENTS_MUTATED');
}

export function subscribeToPaymentStore(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleEvent = () => callback();
  window.addEventListener('tarepet_payments_updated', handleEvent);

  let messageListener: ((e: MessageEvent) => void) | null = null;
  if (paymentBroadcastChannel) {
    messageListener = () => callback();
    paymentBroadcastChannel.addEventListener('message', messageListener);
  }

  return () => {
    window.removeEventListener('tarepet_payments_updated', handleEvent);
    if (paymentBroadcastChannel && messageListener) {
      paymentBroadcastChannel.removeEventListener('message', messageListener);
    }
  };
}

// ── GETTERS ───────────────────────────────────────────────────────────────────

export function getPaymentItems(): PaymentItem[] {
  return _paymentItems;
}

export function getPaymentTransactions(): PaymentTransaction[] {
  return _transactions;
}

export function getStudentTransactions(studentId: string | number): PaymentTransaction[] {
  return _transactions.filter(t => String(t.studentId) === String(studentId));
}

export function getItemAmountForGrade(item: PaymentItem, grade?: string): number {
  if (grade && item.gradeAmounts && Object.prototype.hasOwnProperty.call(item.gradeAmounts, grade)) {
    const customAmount = item.gradeAmounts[grade];
    if (typeof customAmount === 'number') {
      return customAmount;
    }
  }
  return item.amount;
}

export function getStudentItemStatus(studentId: string | number, itemId: string, studentGrade?: string): {
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  paidAmount: number;
  totalAmount: number;
  lastPaymentDate?: string;
} {
  const item = _paymentItems.find(i => i.id === itemId);
  if (!item) return { status: 'UNPAID', paidAmount: 0, totalAmount: 0 };

  const targetAmount = getItemAmountForGrade(item, studentGrade);

  const itemTxs = _transactions.filter(
    t => String(t.studentId) === String(studentId) && t.itemId === itemId && t.status === 'SUCCESS'
  );

  const paidAmount = itemTxs.reduce((sum, t) => sum + t.amount, 0);

  let status: 'PAID' | 'UNPAID' | 'PARTIAL' = 'UNPAID';
  if (paidAmount >= targetAmount && targetAmount > 0) {
    status = 'PAID';
  } else if (paidAmount > 0) {
    status = 'PARTIAL';
  }

  const lastTx = itemTxs.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];

  return {
    status,
    paidAmount,
    totalAmount: targetAmount,
    lastPaymentDate: lastTx ? lastTx.paidAt : undefined
  };
}

export function getClassFeeSchedules(): ClassFeeSchedule[] {
  return _classSchedules;
}

export function updateClassFeeSchedule(schedule: ClassFeeSchedule): void {
  const idx = _classSchedules.findIndex(s => s.class_level === schedule.class_level);
  if (idx >= 0) {
    _classSchedules[idx] = { ..._classSchedules[idx], ...schedule };
  } else {
    _classSchedules.push(schedule);
  }
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_class_fee_schedules', JSON.stringify(_classSchedules)); } catch (e) {}
  }
  authClient.post('/finance/fee-schedules/bulk-update/', { schedules: [schedule] }).catch(() => {});
  broadcastPaymentMutation();
}

export async function bulkUpdateClassFeeSchedules(schedules: ClassFeeSchedule[]): Promise<void> {
  _classSchedules = schedules;
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_class_fee_schedules', JSON.stringify(_classSchedules)); } catch (e) {}
  }
  await authClient.post('/finance/fee-schedules/bulk-update/', { schedules }).catch(() => {});
  broadcastPaymentMutation();
}

export function getDiscountPolicies(): DiscountPolicy[] {
  return _discountPolicies;
}

export async function saveDiscountPolicy(policy: DiscountPolicy): Promise<void> {
  const idx = _discountPolicies.findIndex(p => p.code === policy.code);
  if (idx >= 0) {
    _discountPolicies[idx] = { ..._discountPolicies[idx], ...policy };
  } else {
    _discountPolicies.push(policy);
  }
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_discount_policies', JSON.stringify(_discountPolicies)); } catch (e) {}
  }
  await authClient.post('/finance/discount-policies/', policy).catch(() => {});
  broadcastPaymentMutation();
}

export async function syncPaymentsWithBackend(): Promise<void> {
  const token = getAccessToken();
  if (!token) return;

  try {
    const [itemsRes, txRes, schedulesRes, discountsRes] = await Promise.allSettled([
      authClient.get('/finance/fee-items/?page_size=200'),
      authClient.get('/finance/transactions/?page_size=500'),
      authClient.get('/finance/fee-schedules/?page_size=100'),
      authClient.get('/finance/discount-policies/?page_size=50'),
    ]);

    if (itemsRes.status === 'fulfilled' && itemsRes.value.data) {
      const results = Array.isArray(itemsRes.value.data?.results) 
        ? itemsRes.value.data.results 
        : (Array.isArray(itemsRes.value.data) ? itemsRes.value.data : []);
      
      if (results.length > 0) {
        _paymentItems = results.map((item: any) => ({
          id: item.id || item.item_key,
          name: item.name,
          category: item.category,
          parentId: item.parent_id || item.parentId,
          amount: Number(item.amount) || 0,
          gradeAmounts: item.grade_amounts || item.gradeAmounts || {},
          currency: item.currency || 'NGN',
          dueDate: item.due_date || item.dueDate || '2026-09-15',
          description: item.description || '',
          isRequired: item.is_required ?? item.isRequired ?? false,
          term: item.term || '1ST_TERM',
          session: item.session || '2026/2027'
        }));
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('tarepet_fee_items', JSON.stringify(_paymentItems)); } catch (e) {}
        }
      } else {
        // If backend database is empty, seed it with DEFAULT_PAYMENT_ITEMS automatically
        authClient.post('/finance/fee-items/bulk-save/', { items: DEFAULT_PAYMENT_ITEMS }).catch(() => {});
      }
    }

    if (schedulesRes.status === 'fulfilled' && schedulesRes.value.data) {
      const schResults = Array.isArray(schedulesRes.value.data?.results)
        ? schedulesRes.value.data.results
        : (Array.isArray(schedulesRes.value.data) ? schedulesRes.value.data : []);
      if (schResults.length > 0) {
        _classSchedules = schResults.map((s: any) => ({
          id: s.id,
          class_level: s.class_level,
          division: s.division,
          tuition_fee: Number(s.tuitionFee || s.tuition_fee) || 0,
          development_levy: Number(s.devLevy || s.development_levy) || 0,
          books_materials: Number(s.booksMaterials || s.books_materials) || 0,
          uniform_sports: Number(s.uniformSports || s.uniform_sports) || 0,
          pta_medical: Number(s.ptaMedical || s.pta_medical) || 0,
          exam_levy: Number(s.examLevy || s.exam_levy) || 0,
          total_fee: Number(s.totalFee || s.total_fee) || 0,
          session: s.session || '2025/2026',
          term: s.term || '2nd Term'
        }));
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('tarepet_class_fee_schedules', JSON.stringify(_classSchedules)); } catch (e) {}
        }
      }
    }

    if (discountsRes.status === 'fulfilled' && discountsRes.value.data) {
      const discResults = Array.isArray(discountsRes.value.data?.results)
        ? discountsRes.value.data.results
        : (Array.isArray(discountsRes.value.data) ? discountsRes.value.data : []);
      if (discResults.length > 0) {
        _discountPolicies = discResults.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          discount_type: d.discount_type,
          value: Number(d.value) || 0,
          description: d.description || '',
          is_active: d.is_active ?? true
        }));
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('tarepet_discount_policies', JSON.stringify(_discountPolicies)); } catch (e) {}
        }
      }
    }

    if (txRes.status === 'fulfilled' && txRes.value.data) {
      const txResults = Array.isArray(txRes.value.data?.results)
        ? txRes.value.data.results
        : (Array.isArray(txRes.value.data) ? txRes.value.data : []);
      if (txResults.length > 0) {
        _transactions = txResults.map((t: any) => ({
          id: String(t.id),
          studentId: t.studentId || t.student_id || '',
          studentName: t.studentName || t.student_name || '',
          studentEmail: t.studentEmail || t.student_email || '',
          itemId: t.itemId || t.item_key || '',
          itemName: t.itemName || t.item_name || '',
          amount: Number(t.amount) || 0,
          currency: t.currency || 'NGN',
          reference: t.reference || '',
          channel: t.channel || 'paystack',
          status: t.status || 'SUCCESS',
          paidAt: t.paidAt || t.paid_at || new Date().toISOString(),
          receiptUrl: t.receiptUrl || t.receipt_url,
          term: t.term || '1ST_TERM',
          session: t.session || '2026/2027'
        }));
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('tarepet_fee_transactions', JSON.stringify(_transactions)); } catch (e) {}
        }
      }
    }
    broadcastPaymentMutation();
  } catch (err) {
    // Network fallback — keep existing items in memory
  }
}

// Auto-trigger sync on module load
if (typeof window !== 'undefined') {
  syncPaymentsWithBackend().catch(() => {});
}

// ── ADMIN CATEGORY / ITEM MANAGEMENT ─────────────────────────────────────────

export async function savePaymentItem(itemData: Partial<PaymentItem> & { name: string; amount: number }): Promise<PaymentItem> {
  const id = itemData.id || `item_${Date.now()}`;
  const newItem: PaymentItem = {
    id,
    name: itemData.name,
    category: itemData.category || 'General Fees',
    parentId: itemData.parentId,
    amount: Number(itemData.amount),
    gradeAmounts: itemData.gradeAmounts || {},
    currency: itemData.currency || 'NGN',
    dueDate: itemData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: itemData.description || '',
    isRequired: itemData.isRequired ?? false,
    term: itemData.term || '1ST_TERM',
    session: itemData.session || '2026/2027'
  };

  const existingIndex = _paymentItems.findIndex(i => i.id === id);
  if (existingIndex >= 0) {
    _paymentItems[existingIndex] = newItem;
  } else {
    _paymentItems.push(newItem);
  }

  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_items', JSON.stringify(_paymentItems)); } catch (e) {}
  }

  try {
    await authClient.post('/finance/fee-items/bulk-save/', { items: [newItem] });
  } catch (err) {}

  broadcastPaymentMutation();
  return newItem;
}

export async function updateFeeItemAmount(id: string, amount: number, targetGrade: string = 'ALL'): Promise<boolean> {
  const item = _paymentItems.find(i => i.id === id);
  if (!item) return false;

  const validAmount = Math.max(0, Number(amount));

  if (targetGrade === 'ALL') {
    item.amount = validAmount;
  } else if (targetGrade && typeof targetGrade === 'string' && !['__proto__', 'constructor', 'prototype'].includes(targetGrade)) {
    if (!item.gradeAmounts) item.gradeAmounts = {};
    Object.assign(item.gradeAmounts, { [targetGrade]: validAmount });
  }

  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_items', JSON.stringify(_paymentItems)); } catch (e) {}
  }

  try {
    await authClient.post('/finance/fee-items/bulk-save/', { items: [item] });
  } catch (err) {}

  broadcastPaymentMutation();
  return true;
}

export async function deletePaymentItem(itemId: string): Promise<boolean> {
  _paymentItems = _paymentItems.filter(i => i.id !== itemId && i.parentId !== itemId);
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_items', JSON.stringify(_paymentItems)); } catch (e) {}
  }

  try {
    await authClient.delete(`/finance/fee-items/${itemId}/`);
  } catch (err) {}

  broadcastPaymentMutation();
  return true;
}

// ── TRANSACTION / PAYMENT RECORDING ──────────────────────────────────────────

export async function recordTransaction(txData: Omit<PaymentTransaction, 'id' | 'paidAt'>): Promise<PaymentTransaction> {
  const newTx: PaymentTransaction = {
    ...txData,
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    paidAt: new Date().toISOString()
  };

  _transactions.unshift(newTx);
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_transactions', JSON.stringify(_transactions)); } catch (e) {}
  }

  try {
    await authClient.post('/finance/transactions/', newTx);
  } catch (err) {}

  broadcastPaymentMutation();

  addRealtimeNotification({
    title: '💳 Payment Received',
    message: `${newTx.studentName} paid ₦${newTx.amount.toLocaleString()} for ${newTx.itemName}`,
    category: 'BILLING',
    type: 'fee',
    recipientRole: 'ADMIN'
  });

  return newTx;
}

// ── PAYSTACK INLINE SDK HELPER ────────────────────────────────────────────────

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number; // in kobo (NGN * 100)
        ref: string;
        currency?: string;
        metadata?: any;
        callback: (response: { reference: string; status: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.PaystackPop) return resolve(true);

    let script = document.getElementById('paystack-inline-js') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'paystack-inline-js';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.PaystackPop) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= 40) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

export async function processPaystackPayment({
  email,
  amount,
  itemName,
  itemId,
  studentId,
  studentName,
  onSuccess,
  onError,
  onClose
}: {
  email: string;
  amount: number;
  itemName: string;
  itemId: string;
  studentId: string | number;
  studentName: string;
  onSuccess: (tx: PaymentTransaction) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}) {
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_0cebdc3e1ca9d0ef71d0aa988c85be3675a7a675';
  const ref = `TRP_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const loaded = await loadPaystackScript();

  if (loaded && window.PaystackPop && paystackKey && !paystackKey.includes('YOUR_PUBLIC_KEY')) {
    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: email || 'student@tarepetmontessori.org',
        amount: Math.round(amount * 100), // Paystack requires amount in Kobo
        ref,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: 'Student Name', variable_name: 'student_name', value: studentName },
            { display_name: 'Student ID', variable_name: 'student_id', value: String(studentId) },
            { display_name: 'Item Name', variable_name: 'item_name', value: itemName }
          ]
        },
        callback: async (response: { reference: string; status: string }) => {
          const tx = await recordTransaction({
            studentId,
            studentName,
            studentEmail: email || 'student@tarepetmontessori.org',
            itemId,
            itemName,
            amount,
            currency: 'NGN',
            reference: response.reference || ref,
            channel: 'paystack',
            status: 'SUCCESS',
            term: '1ST_TERM',
            session: '2026/2027'
          });
          onSuccess(tx);
        },
        onClose: () => {
          onClose();
        }
      });

      handler.openIframe();
      return;
    } catch (err) {
      console.warn('Paystack popup setup error, using fallback popup:', err);
    }
  }

  // Fallback simulator for offline environments or blocked CDN scripts
  let isConfirmed = false;
  if (typeof window !== 'undefined' && (window as any).showTarepetConfirm) {
    isConfirmed = await (window as any).showTarepetConfirm(
      `Item: ${itemName}\nStudent: ${studentName}\nAmount Due: ₦${amount.toLocaleString()}\nRef: ${ref}\n\nConfirm to process settlement with Tarepet Bursary.`,
      'Paystack Payment Portal'
    );
  }

  if (isConfirmed) {
    const tx = await recordTransaction({
      studentId,
      studentName,
      studentEmail: email || 'student@tarepetmontessori.org',
      itemId,
      itemName,
      amount,
      currency: 'NGN',
      reference: ref,
      channel: 'paystack',
      status: 'SUCCESS',
      term: '1ST_TERM',
      session: '2026/2027'
    });
    onSuccess(tx);
  } else {
    onClose();
  }
}

/**
 * Purge cached payment transactions and fee item overrides from local storage and memory.
 */
export function clearPaymentStoreData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('tarepet_fee_items');
    localStorage.removeItem('tarepet_fee_transactions');
  } catch {}
  _transactions = [];
  broadcastPaymentMutation();
}
