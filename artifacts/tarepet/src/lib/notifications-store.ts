// ─── Notifications Store ─────────────────────────────────────────────────────
// Pure API-backed notification store. No localStorage. In-memory state only.
// ─────────────────────────────────────────────────────────────────────────────
import { authClient } from './api-auth';
import { sendWebSocketEvent, subscribeToWebSocketEvents } from './websocket-client';

export type NotifRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;            // ISO timestamp
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'exam' | 'fee' | 'attendance';
  role: NotifRole;         // which role this belongs to (for filtering)
}

// ── In-memory state (no localStorage) ────────────────────────────────────────
let _notifications: Notification[] = [];

function getAll(): Notification[] {
  return _notifications;
}

function setAll(notifications: Notification[]) {
  _notifications = notifications;
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
      if (!_notifications.some(n => n.id === notifId)) {
        const incomingNotif: Notification = {
          id: notifId,
          title: p.title || 'Notification',
          message: p.message || '',
          time: p.time || new Date().toISOString(),
          read: Boolean(p.read),
          type: (p.type || 'info').toLowerCase() as any,
          role: (p.role || 'ALL') as NotifRole,
        };
        _notifications = [incomingNotif, ..._notifications];
        notifyListeners();
      }
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
        }));

        const existing = getAll();
        const otherRoles = existing.filter(n => n.role !== role);
        setAll([...mappedServerNotifs, ...otherRoles]);
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
  setAll(getAll().filter(n => n.id !== id));
  notifyListeners();
  authClient.delete(`/communication/notifications/${id}/`).catch(() =>
    authClient.delete(`/notifications/${id}/`).catch(() => {})
  );
}

export function clearAllNotifications(role: NotifRole) {
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
    is_read: false,
  }).catch(() => {});
}

export function addRealtimeNotification(options: {
  title: string;
  message: string;
  category?: string;
  type?: 'info' | 'success' | 'warning' | 'exam' | 'fee' | 'attendance';
  recipientRole?: NotifRole;
}) {
  addNotification({
    title: options.title,
    message: options.message,
    type: options.type === 'fee' || options.type === 'exam' || options.type === 'warning' || options.type === 'success' ? options.type : 'info',
    role: options.recipientRole || 'ADMIN'
  });
}