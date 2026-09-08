// ─── Notifications Store ─────────────────────────────────────────────────────
// Persistent notification store with dismissed-ID tracking to prevent
// cleared notifications from reappearing after page refresh / backend sync.
// ─────────────────────────────────────────────────────────────────────────────
import { authClient } from './api-auth';
import { sendWebSocketEvent, subscribeToWebSocketEvents } from './websocket-client';

export type NotifRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ALL';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;            // ISO timestamp
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'exam' | 'fee' | 'attendance';
  role: NotifRole;         // which role this belongs to (for filtering)
  actionUrl?: string;      // optional deep-link; clicking the card navigates here
}

// ── Dismissed-notification tracking ──────────────────────────────────────────
// Tracks individually dismissed notification IDs and per-role "clear all"
// timestamps so that backend sync never re-introduces cleared items.
const DISMISSED_IDS_KEY = 'tarepet_dismissed_notification_ids';
const CLEAR_ALL_TS_KEY  = 'tarepet_clear_all_timestamps';

function loadDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function saveDismissedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    // Cap at 500 to avoid localStorage bloat
    const arr = [...ids].slice(-500);
    localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(arr));
  } catch {}
}

function loadClearAllTimestamps(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CLEAR_ALL_TS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveClearAllTimestamps(ts: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CLEAR_ALL_TS_KEY, JSON.stringify(ts)); } catch {}
}

let _dismissedIds = loadDismissedIds();
let _clearAllTimestamps = loadClearAllTimestamps();

/** Returns true if a notification should be hidden (was dismissed or cleared). */
function isDismissed(n: { id: string; role?: string; time?: string }): boolean {
  if (_dismissedIds.has(n.id)) return true;
  // Check role-level "clear all" timestamp
  const role = n.role || 'ALL';
  const clearedAt = _clearAllTimestamps[role];
  if (clearedAt) {
    const notifTime = n.time ? new Date(n.time).getTime() : 0;
    if (notifTime <= clearedAt) return true;
  }
  return false;
}

// ── Persistent state with LocalStorage + Real-time Sync ──────────────────────
function loadSavedNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('tarepet_notifications_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter(n => !isDismissed(n));
    }
  } catch (e) {}
  return [];
}

let _notifications: Notification[] = loadSavedNotifications();

function getAll(): Notification[] {
  return _notifications;
}

function setAll(notifications: Notification[]) {
  _notifications = notifications;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tarepet_notifications_list', JSON.stringify(_notifications));
    } catch (e) {}
  }
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function subscribeToNotifications(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Listen to incoming real-time notifications from WebSocket
if (typeof window !== 'undefined') {
  subscribeToWebSocketEvents((event) => {
    if (event.type === 'NOTIFICATION_RECEIVED' && event.payload) {
      const p = event.payload;
      const notifId = String(p.id || `notif-${Date.now()}`);
      // Skip dismissed notifications and duplicates
      if (_dismissedIds.has(notifId) || _notifications.some(n => n.id === notifId)) return;
      const incomingNotif: Notification = {
        id: notifId,
        title: p.title || 'Notification',
        message: p.message || '',
        time: p.time || new Date().toISOString(),
        read: Boolean(p.read),
        type: (p.type || 'info').toLowerCase() as any,
        role: (p.role || 'ALL') as NotifRole,
        actionUrl: p.actionUrl || undefined,
      };
      // Also check clearAll timestamps
      if (isDismissed(incomingNotif)) return;
      _notifications = [incomingNotif, ..._notifications];
      setAll(_notifications);
      notifyListeners();
    }
  });
}

// ── Backend API Sync Integration ─────────────────────────────────────────────

export async function syncNotificationsWithBackend(role: NotifRole): Promise<void> {
  try {
    const response = await authClient.get(`/communication/notifications/?role=${role}`).catch(() =>
      authClient.get(`/notifications/?role=${role}`)
    );

    if (response && response.data) {
      const serverNotifs: any[] = Array.isArray(response.data?.results)
        ? response.data.results
        : Array.isArray(response.data)
        ? response.data
        : (response.data.notifications || []);

      if (serverNotifs.length > 0) {
        const mappedServerNotifs: Notification[] = serverNotifs.map(sn => ({
          id: String(sn.id || sn.pk),
          title: sn.title || 'Notification',
          message: sn.message || '',
          time: sn.created_at || sn.time || new Date().toISOString(),
          read: Boolean(sn.is_read ?? sn.read),
          type: (sn.notification_type || sn.type || 'info').toLowerCase() as any,
          role: (sn.recipient_role || sn.role || role) as NotifRole,
          actionUrl: sn.action_url || sn.actionUrl || undefined,
        }));

        // ★ Filter out any dismissed or cleared notifications before merging
        const filteredNotifs = mappedServerNotifs.filter(n => !isDismissed(n));

        const existing = getAll();
        const otherRoles = existing.filter(n => n.role !== role);

        // ★ Preserve locally-added notifications (client-generated IDs) that
        //   the backend hasn't processed yet. These have IDs starting with
        //   'notif-' and are kept if they were created within the last 60 seconds.
        const now = Date.now();
        const localOnlyNotifs = existing.filter(n => {
          if (n.role !== role && n.role !== 'ALL') return false;
          const isLocalId = typeof n.id === 'string' && n.id.startsWith('notif-');
          if (!isLocalId) return false;
          // Keep if created less than 60s ago (backend may not have it yet)
          const createdAt = n.time ? new Date(n.time).getTime() : 0;
          return (now - createdAt) < 60000;
        });

        // Merge: server notifications + preserved local notifications + other roles
        const serverIds = new Set(filteredNotifs.map(n => n.id));
        const uniqueLocalNotifs = localOnlyNotifs.filter(n => !serverIds.has(n.id));
        setAll([...uniqueLocalNotifs, ...filteredNotifs, ...otherRoles]);
        notifyListeners();
      }
    }
  } catch (error) {
    console.debug('[NotificationsStore] Backend unreachable, using in-memory state.');
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getNotificationsForRole(role: NotifRole): Notification[] {
  return getAll()
    .filter(n => n.role === role || n.role === 'ALL')
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function getUnreadCount(role: NotifRole): number {
  return getNotificationsForRole(role).filter(n => !n.read).length;
}

export function markAsRead(id: string) {
  const updated = getAll().map(n => n.id === id ? { ...n, read: true } : n);
  setAll(updated);
  notifyListeners();
  authClient.post(`/communication/notifications/${id}/mark_read/`).catch(() =>
    authClient.post(`/notifications/${id}/mark_read/`).catch(() => {})
  );
}

export function markAllAsRead(role: NotifRole) {
  const updated = getAll().map(n => n.role === role ? { ...n, read: true } : n);
  setAll(updated);
  notifyListeners();
  authClient.post(`/communication/notifications/mark_all_read/`, { role }).catch(() =>
    authClient.post(`/notifications/mark_all_read/`, { role }).catch(() => {})
  );
}

export function clearNotification(id: string) {
  // ★ Persist the dismissed ID so it survives refresh + backend re-sync
  _dismissedIds.add(id);
  saveDismissedIds(_dismissedIds);

  setAll(getAll().filter(n => n.id !== id));
  notifyListeners();
  authClient.delete(`/communication/notifications/${id}/`).catch(() =>
    authClient.delete(`/notifications/${id}/`).catch(() => {})
  );
}

export function clearAllNotifications(role: NotifRole) {
  // ★ Record the "clear all" timestamp for this role
  _clearAllTimestamps[role] = Date.now();
  saveClearAllTimestamps(_clearAllTimestamps);

  // Also add every current notification for this role to the dismissed set
  const toClear = getAll().filter(n => n.role === role);
  toClear.forEach(n => _dismissedIds.add(n.id));
  saveDismissedIds(_dismissedIds);

  setAll(getAll().filter(n => n.role !== role));
  notifyListeners();
  authClient.post(`/communication/notifications/clear-all/`, { role }).catch(() =>
    authClient.post(`/notifications/clear-all/`, { role }).catch(() => {})
  );
}

export function addNotification(notif: Omit<Notification, 'id' | 'read' | 'time'>) {
  const newNotif: Notification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    read: false,
    time: new Date().toISOString(),
  };
  setAll([newNotif, ...getAll()]);
  notifyListeners();

  // Send real-time notification to all connected portal sessions via WebSocket
  sendWebSocketEvent('NOTIFICATION_RECEIVED', newNotif);

  // Async persist to Django backend database
  authClient.post(`/communication/notifications/`, {
    title: notif.title,
    message: notif.message,
    notification_type: notif.type,
    type: notif.type,
    recipient_role: notif.role,
    role: notif.role,
    action_url: notif.actionUrl || null,
    is_read: false,
  }).catch(() => {});
}

export function addRealtimeNotification(options: {
  title: string;
  message: string;
  category?: string;
  type?: 'info' | 'success' | 'warning' | 'exam' | 'fee' | 'attendance';
  recipientRole?: NotifRole;
  /** Deep-link: clicking the notification card will navigate the user here */
  actionUrl?: string;
}) {
  addNotification({
    title: options.title,
    message: options.message,
    type: options.type === 'fee' || options.type === 'exam' || options.type === 'warning' || options.type === 'success' ? options.type : 'info',
    role: options.recipientRole || 'ADMIN',
    actionUrl: options.actionUrl,
  });
}