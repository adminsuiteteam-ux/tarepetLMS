import { authClient } from './api-auth';
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

// Payment items structured with 0 default amounts (configured dynamically by Admin)
const DEFAULT_PAYMENT_ITEMS: PaymentItem[] = [
  {
    id: 'school_fees',
    name: 'School Fees',
    category: 'Tuition & Basic',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-15',
    description: 'Term 1 Tuition and Educational Materials',
    isRequired: true,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'lesson',
    name: 'Lesson Fee',
    category: 'Academic Support',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-20',
    description: 'After-school academic coaching and tutorial lessons',
    isRequired: false,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'boarding',
    name: 'Boarding Fee',
    category: 'Accommodation',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-10',
    description: 'Full term boarding and hostel accommodation',
    isRequired: false,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'school_bus',
    name: 'School Bus',
    category: 'Transport',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-20',
    description: 'Daily door-to-door school shuttle service',
    isRequired: false,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'books',
    name: 'Books & Workbooks',
    category: 'Supplies',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-15',
    description: 'Official curriculum textbooks and exercise workbooks',
    isRequired: true,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'uniform',
    name: 'School Uniform Package',
    category: 'Attire',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-10',
    description: 'Complete set of regular uniform, sportswear, and cardigan',
    isRequired: true,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'exam',
    name: 'Internal Exam Fee',
    category: 'Assessments',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-11-01',
    description: 'Terminal examinations and CBT continuous assessment processing',
    isRequired: true,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'lab_fee',
    name: 'Laboratory Fee',
    category: 'Science & Labs',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-09-30',
    description: 'Science lab consumables, chemicals, and equipment maintenance',
    isRequired: true,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'end_of_year',
    name: 'End of Year Activities',
    category: 'Events',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-06-15',
    description: 'Graduation, Speech & Prize Giving Day, and Cultural Day celebration',
    isRequired: false,
    term: '3RD_TERM',
    session: '2026/2027'
  },
  {
    id: 'lost_id',
    name: 'Lost ID Card Replacement',
    category: 'Identity',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-06-30',
    description: 'Replacement of lost or damaged student ID card',
    isRequired: false,
    term: 'ALL',
    session: '2026/2027'
  },
  {
    id: 'extracurricular',
    name: 'Extracurricular Activities Fee',
    category: 'Events & Activities',
    amount: 0,
    currency: 'NGN',
    dueDate: '2026-10-15',
    description: 'Sports clubs, arts, drama, debate, and inter-house competition levy',
    isRequired: false,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'outstanding_balance',
    name: 'Outstanding Fee Balance',
    category: 'Special',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-06-30',
    description: 'Clear any remaining unpaid balance from previous or current term',
    isRequired: false,
    term: 'ALL',
    session: '2026/2027'
  },
  {
    id: 'change_of_class',
    name: 'Change of Class / Stream',
    category: 'Administrative',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-06-30',
    description: 'Administrative processing fee for requesting a class or stream change',
    isRequired: false,
    term: 'ALL',
    session: '2026/2027'
  },
  {
    id: 'ext_int_exam_parent',
    name: 'External / Internal Exam',
    category: 'External Assessments',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-03-01',
    description: 'Standardized national & state board examination fees',
    isRequired: false,
    term: 'ALL',
    session: '2026/2027'
  },
  {
    id: 'waec',
    name: 'WAEC Examination Fee',
    category: 'External Assessments',
    parentId: 'ext_int_exam_parent',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-01-30',
    description: 'WASSCE Senior Secondary School Certificate Registration',
    isRequired: false,
    term: '2ND_TERM',
    session: '2026/2027'
  },
  {
    id: 'neco',
    name: 'NECO Examination Fee',
    category: 'External Assessments',
    parentId: 'ext_int_exam_parent',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-02-15',
    description: 'National Examinations Council Senior Certificate Registration',
    isRequired: false,
    term: '2ND_TERM',
    session: '2026/2027'
  },
  {
    id: 'jss3_bece',
    name: 'JSS3 BECE (Basic Education Certificate)',
    category: 'External Assessments',
    parentId: 'ext_int_exam_parent',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-03-10',
    description: 'Junior Secondary 3 National & State BECE Examination',
    isRequired: false,
    term: '2ND_TERM',
    session: '2026/2027'
  },
  {
    id: 'fslc',
    name: 'FSLC (First School Leaving Certificate)',
    category: 'External Assessments',
    parentId: 'ext_int_exam_parent',
    amount: 0,
    currency: 'NGN',
    dueDate: '2027-04-01',
    description: 'Primary 5 First School Leaving Certificate State Exam',
    isRequired: false,
    term: '3RD_TERM',
    session: '2026/2027'
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

let _paymentItems: PaymentItem[] = loadSavedPaymentItems();
let _transactions: PaymentTransaction[] = loadSavedTransactions();

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
  if (grade && item.gradeAmounts && item.gradeAmounts[grade] !== undefined) {
    return item.gradeAmounts[grade];
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

export async function syncPaymentsWithBackend(): Promise<void> {
  try {
    const [itemsRes, txRes] = await Promise.allSettled([
      authClient.get('/finance/fee-items/?page_size=200'),
      authClient.get('/finance/transactions/?page_size=500')
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

export function savePaymentItem(itemData: Partial<PaymentItem> & { name: string; amount: number }): PaymentItem {
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

  broadcastPaymentMutation();

  // Save to Django PostgreSQL/SQLite backend in real-time
  authClient.post('/finance/fee-items/bulk-save/', { items: [newItem] }).catch(() => {});

  return newItem;
}

export function updateFeeItemAmount(id: string, amount: number, targetGrade: string = 'ALL'): boolean {
  const item = _paymentItems.find(i => i.id === id);
  if (!item) return false;

  const validAmount = Math.max(0, Number(amount));

  if (targetGrade === 'ALL') {
    item.amount = validAmount;
  } else {
    if (!item.gradeAmounts) item.gradeAmounts = {};
    item.gradeAmounts[targetGrade] = validAmount;
  }

  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_items', JSON.stringify(_paymentItems)); } catch (e) {}
  }

  broadcastPaymentMutation();

  // Save updated price to Django backend
  authClient.post('/finance/fee-items/bulk-save/', { items: [item] }).catch(() => {});

  return true;
}

export function deletePaymentItem(itemId: string): boolean {
  _paymentItems = _paymentItems.filter(i => i.id !== itemId && i.parentId !== itemId);
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_items', JSON.stringify(_paymentItems)); } catch (e) {}
  }
  broadcastPaymentMutation();

  // Async delete from Django API backend
  authClient.delete(`/finance/fee-items/${itemId}/`).catch(() => {});

  return true;
}

// ── TRANSACTION / PAYMENT RECORDING ──────────────────────────────────────────

export function recordTransaction(txData: Omit<PaymentTransaction, 'id' | 'paidAt'>): PaymentTransaction {
  const newTx: PaymentTransaction = {
    ...txData,
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    paidAt: new Date().toISOString()
  };

  _transactions.unshift(newTx);
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('tarepet_fee_transactions', JSON.stringify(_transactions)); } catch (e) {}
  }
  broadcastPaymentMutation();

  // Trigger real-time notification to admin
  addRealtimeNotification({
    title: '💳 Payment Received',
    message: `${newTx.studentName} paid ₦${newTx.amount.toLocaleString()} for ${newTx.itemName}`,
    category: 'BILLING',
    type: 'fee',
    recipientRole: 'ADMIN'
  });

  // Async sync with Django API backend
  authClient.post('/finance/transactions/', newTx).catch(() => {});

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
        callback: (response: { reference: string; status: string }) => {
          const tx = recordTransaction({
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
  const isConfirmed = window.confirm(
    `[Paystack Payment Portal]\n\n` +
    `School: Tarepet Montessori School\n` +
    `Item: ${itemName}\n` +
    `Student: ${studentName}\n` +
    `Amount Due: ₦${amount.toLocaleString()}\n` +
    `Ref: ${ref}\n\n` +
    `Click OK to complete payment.`
  );

  if (isConfirmed) {
    const tx = recordTransaction({
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
