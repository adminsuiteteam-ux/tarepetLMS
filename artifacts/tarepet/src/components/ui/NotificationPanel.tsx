import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, BookOpen, CreditCard, UserCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import {
  getNotificationsForRole,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications,
  subscribeToNotifications,
  syncNotificationsWithBackend,
  type NotifRole,
  type Notification,
} from '@/lib/notifications-store';

// ─── Type icon & color helpers ────────────────────────────────────────────────


function getTypeStyle(type: Notification['type']): { icon: React.ElementType; bg: string; text: string; dot: string } {
  switch (type) {
    case 'success':    return { icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-600',  dot: 'bg-emerald-500' };
    case 'warning':    return { icon: AlertTriangle, bg: 'bg-amber-500/10',   text: 'text-amber-600',    dot: 'bg-amber-500' };
    case 'exam':       return { icon: BookOpen,       bg: 'bg-blue-500/10',    text: 'text-blue-600',     dot: 'bg-blue-500' };
    case 'fee':        return { icon: CreditCard,      bg: 'bg-rose-500/10',   text: 'text-rose-600',     dot: 'bg-rose-500' };
    case 'attendance': return { icon: UserCheck,       bg: 'bg-violet-500/10', text: 'text-violet-600',   dot: 'bg-violet-500' };
    default:           return { icon: Info,            bg: 'bg-primary/10',    text: 'text-primary',      dot: 'bg-primary' };
  }
}

function parseDate(iso: any): Date {
  if (!iso) return new Date();
  if (iso instanceof Date) return isNaN(iso.getTime()) ? new Date() : iso;
  
  if (typeof iso === 'number' || (/^\d+$/.test(String(iso).trim()))) {
    const num = Number(iso);
    return new Date(num > 1e11 ? num : num * 1000);
  }

  const str = String(iso).trim();
  const normalized = str.includes('T') ? str : str.replace(' ', 'T');
  const withZ = (normalized.endsWith('Z') || normalized.includes('+') || (normalized.length > 10 && normalized.slice(10).includes('-')))
    ? normalized
    : `${normalized}Z`;
  
  const d = new Date(withZ);
  if (!isNaN(d.getTime())) return d;

  const direct = new Date(str);
  return isNaN(direct.getTime()) ? new Date() : direct;
}

function timeAgo(iso: string): string {
  try {
    const date = parseDate(iso);
    const now = Date.now();
    const diff = now - date.getTime();

    if (diff < 45000) return 'just now';

    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'just now';
  }
}

function formatExactTime(iso: string): string {
  try {
    const date = parseDate(iso);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '';
  }
}

// ─── Notification Panel ───────────────────────────────────────────────────────

interface NotificationPanelProps {
  role: NotifRole;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ role }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync from store
  const syncNotifs = () => {
    setNotifications(getNotificationsForRole(role));
    setUnreadCount(getUnreadCount(role));
  };

  useEffect(() => {
    syncNotifs();
    syncNotificationsWithBackend(role);
    const unsub = subscribeToNotifications(syncNotifs);
    return unsub;
  }, [role]);


  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleBellClick = () => setOpen(prev => !prev);

  const handleMarkAllRead = () => markAllAsRead(role);

  const handleClearAll = () => {
    clearAllNotifications(role);
    setOpen(false);
  };

  const handleItemClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    clearNotification(id);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        id="notif-bell-btn"
        aria-label="Open notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Bell className={`w-5 h-5 transition-all ${open ? 'text-primary' : ''}`} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-sm animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-[calc(100%+10px)] w-auto sm:w-[360px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ maxHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}
          >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">{`Notifications`}</h2>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Clear all notifications"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{`All caught up!`}</p>
                <p className="text-xs text-muted-foreground mt-1">{`No notifications to show.`}</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n, i) => {
                  const style = getTypeStyle(n.type);
                  const TypeIcon = style.icon;
                  return (
                    <li
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`relative flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-0 group
                        ${n.read ? 'bg-card hover:bg-muted/30' : 'bg-primary/[0.03] hover:bg-primary/[0.07]'}
                      `}
                    >
                      {/* Icon */}
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${style.bg}`}>
                        <TypeIcon className={`w-3.5 h-3.5 ${style.text}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-tight ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0" title={formatExactTime(n.time)}>
                            {timeAgo(n.time)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <span className={`absolute right-3 top-3.5 w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
                      )}

                      {/* Remove button */}
                      <button
                        onClick={(e) => handleRemove(e, n.id)}
                        className="absolute right-3 bottom-2.5 hidden group-hover:flex p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="p-2 border-t border-border bg-card text-center shrink-0">
            <button
              onClick={() => {
                setOpen(false);
                if (typeof window !== 'undefined') window.location.href = '/notifications';
              }}
              className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Full Notification Center Page</span>
            </button>
          </div>
        </div>
      </>
    )}
  </div>
  );
};

export default NotificationPanel;
