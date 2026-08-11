// ─── Notifications Store ─────────────────────────────────────────────────────
// Pure API-backed notification store. No localStorage. In-memory state only.
// ─────────────────────────────────────────────────────────────────────────────
import { authClient } from './api-auth';

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

// ── Backend API Sync Integration ─────────────────────────────────────────────

export async function syncNotificationsWithBackend(role: NotifRole): Promise<void> {
  try {
    const response = await authClient.get(`/cbt-notifications/`).catch(() =>
      authClient.get(`/notifications?role=${role}`)
    );

    if (response && response.data) {
      const serverNotifs: any[] = Array.isArray(response.data)
        ? response.data
        : (response.data.notifications || response.data.results || []);

      if (serverNotifs.length > 0) {
        const mappedServerNotifs: Notification[] = serverNotifs.map(sn => ({
          id: String(sn.id || sn.pk),
          title: sn.title || 'Notification',
          message: sn.message || '',
          time: sn.created_at || sn.time || new Date().toISOString(),
          read: Boolean(sn.is_read ?? sn.read),
          type: (sn.notification_type || sn.type || 'info').toLowerCase() as any,
          role: role,
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
    .filter(n => n.role === role)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function getUnreadCount(role: NotifRole): number {
  return getNotificationsForRole(role).filter(n => !n.read).length;
}

export function markAsRead(id: string) {
  const updated = getAll().map(n => n.id === id ? { ...n, read: true } : n);
  setAll(updated);
  notifyListeners();
  authClient.post(`/cbt-notifications/${id}/mark_read/`).catch(() =>
    authClient.post(`/notifications/${id}/read`).catch(() => {})
  );
}

export function markAllAsRead(role: NotifRole) {
  const updated = getAll().map(n => n.role === role ? { ...n, read: true } : n);
  setAll(updated);
  notifyListeners();
  authClient.post(`/cbt-notifications/mark_all_read/`).catch(() =>
    authClient.post(`/notifications/read-all`, { role }).catch(() => {})
  );
}

export function clearNotification(id: string) {
  setAll(getAll().filter(n => n.id !== id));
  notifyListeners();
  authClient.delete(`/notifications/${id}`).catch(() => {});
}

export function clearAllNotifications(role: NotifRole) {
  setAll(getAll().filter(n => n.role !== role));
  notifyListeners();
  authClient.delete(`/notifications/clear-all`, { data: { role } }).catch(() => {});
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
  authClient.post(`/notifications`, notif).catch(() => {});
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