import { authClient } from './api-auth';
import { addRealtimeNotification } from './notifications-store';

export interface PaymentItem {
  id: string;
  name: string;
  category: string; // e.g. "Core Fees", "Transport & Living", "Exams"
  parentId?: string; // For nested items like External / Internal Exam -> WAEC, NECO, JSS3, FSLC
  amount: number;
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

// Default payment items structured as requested
let _paymentItems: PaymentItem[] = [
  {
    id: 'school_fees',
    name: 'School Fees',
    category: 'Tuition & Basic',
    amount: 85000,
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
    amount: 15000,
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
    amount: 120000,
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
    amount: 25000,
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
    amount: 30000,
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
    amount: 22000,
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
    amount: 10000,
    currency: 'NGN',
    dueDate: '2026-11-01',
    description: 'Terminal examinations and CBT continuous assessment processing',
    isRequired: true,
    term: '1ST_TERM',
    session: '2026/2027'
  },
  {
    id: 'end_of_year',
    name: 'End of Year Activities',
    category: 'Events',
    amount: 18000,
    currency: 'NGN',
    dueDate: '2027-06-15',
    description: 'Graduation, Speech & Prize Giving Day, and Cultural Day celebration',
    isRequired: false,
    term: '3RD_TERM',
    session: '2026/2027'
  },

  // External / Internal Exam parent node and sub-items
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
    amount: 45000,
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
    amount: 40000,
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
    amount: 25000,
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
    amount: 15000,
    currency: 'NGN',
    dueDate: '2027-04-01',
    description: 'Primary 5 First School Leaving Certificate State Exam',
    isRequired: false,
    term: '3RD_TERM',
    session: '2026/2027'
  }
];

let _transactions: PaymentTransaction[] = [];

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

export function getStudentItemStatus(studentId: string | number, itemId: string): {
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  paidAmount: number;
  totalAmount: number;
  lastPaymentDate?: string;
} {
  const item = _paymentItems.find(i => i.id === itemId);
  if (!item) return { status: 'UNPAID', paidAmount: 0, totalAmount: 0 };

  const itemTxs = _transactions.filter(
    t => String(t.studentId) === String(studentId) && t.itemId === itemId && t.status === 'SUCCESS'
  );

  const paidAmount = itemTxs.reduce((sum, t) => sum + t.amount, 0);

  let status: 'PAID' | 'UNPAID' | 'PARTIAL' = 'UNPAID';
  if (paidAmount >= item.amount && item.amount > 0) {
    status = 'PAID';
  } else if (paidAmount > 0) {
    status = 'PARTIAL';
  }

  const lastTx = itemTxs.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];

  return {
    status,
    paidAmount,
    totalAmount: item.amount,
    lastPaymentDate: lastTx ? lastTx.paidAt : undefined
  };
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

  broadcastPaymentMutation();

  // Async sync with Django API backend
  authClient.post('/payments/categories/', newItem).catch(() => {});

  return newItem;
}

export function deletePaymentItem(itemId: string): boolean {
  _paymentItems = _paymentItems.filter(i => i.id !== itemId && i.parentId !== itemId);
  broadcastPaymentMutation();

  // Async sync with Django API backend
  authClient.delete(`/payments/categories/${itemId}/`).catch(() => {});

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
  authClient.post('/payments/transactions/', newTx).catch(() => {});

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

    const existingScript = document.getElementById('paystack-inline-js');
    if (existingScript) return resolve(true);

    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
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

  // If no Paystack key is set, show seamless fallback simulation for test environment
  if (!paystackKey || paystackKey === '' || paystackKey.includes('YOUR_PUBLIC_KEY')) {
    const isConfirmed = window.confirm(
      `[Paystack Test Gateway]\n\nProcessing payment for ${itemName}\nAmount: ₦${amount.toLocaleString()}\nStudent: ${studentName}\nRef: ${ref}\n\nClick OK to simulate successful payment.`
    );
    if (isConfirmed) {
      const tx = recordTransaction({
        studentId,
        studentName,
        studentEmail: email,
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
    return;
  }

  const loaded = await loadPaystackScript();
  if (!loaded || !window.PaystackPop) {
    onError('Unable to load Paystack payment gateway. Please check your internet connection.');
    return;
  }

  try {
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email,
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
          studentEmail: email,
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
  } catch (err: any) {
    onError(err?.message || 'Error initializing Paystack gateway');
  }
}
