import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  X,
  BookOpen,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import {
  getNotificationsForRole,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications,
  subscribeToNotifications,
  type NotifRole,
  type Notification,
} from '@/lib/notifications-store';

function getTypeStyle(type: Notification['type']): { icon: React.ElementType; bg: string; text: string; dot: string; label: string } {
  switch (type) {
    case 'success':    return { icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-600',  dot: 'bg-emerald-500', label: 'Success' };
    case 'warning':    return { icon: AlertTriangle, bg: 'bg-amber-500/10',   text: 'text-amber-600',    dot: 'bg-amber-500', label: 'Warning' };
    case 'exam':       return { icon: BookOpen,       bg: 'bg-blue-500/10',    text: 'text-blue-600',     dot: 'bg-blue-500', label: 'Academic & CBT' };
    case 'fee':        return { icon: CreditCard,      bg: 'bg-rose-500/10',   text: 'text-rose-600',     dot: 'bg-rose-500', label: 'Fee Payment' };
    case 'attendance': return { icon: UserCheck,       bg: 'bg-violet-500/10', text: 'text-violet-600',   dot: 'bg-violet-500', label: 'Profile / Staff' };
    default:           return { icon: Info,            bg: 'bg-primary/10',    text: 'text-primary',      dot: 'bg-primary', label: 'System Notice' };
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

    if (diff < 45000) return 'Just now';

    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'Just now';
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

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<NotifRole>('ADMIN');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const sync = () => {
    setNotifications(getNotificationsForRole(selectedRole));
    setUnreadCount(getUnreadCount(selectedRole));
  };

  useEffect(() => {
    sync();
    const unsub = subscribeToNotifications(sync);
    return unsub;
  }, [selectedRole]);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter === 'UNREAD') return !n.read;
    if (typeFilter !== 'ALL' && typeFilter !== 'UNREAD') return n.type === typeFilter;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold border border-emerald-500/20 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-foreground">Notification Center & Activity Feed</h1>
            <p className="text-xs text-muted-foreground">Manage real-time portal alerts, profile update notifications, and CBT academic activity.</p>
          </div>
        </div>

        <button
          onClick={() => setLocation('/dashboard')}
          className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>

      {/* Metrics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Notifications</span>
            <h3 className="text-2xl font-serif font-bold text-foreground mt-0.5">{notifications.length}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unread Alerts</span>
            <h3 className="text-2xl font-serif font-bold text-emerald-600 mt-0.5">{unreadCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Academic / CBT</span>
            <h3 className="text-2xl font-serif font-bold text-blue-600 mt-0.5">
              {notifications.filter((n) => n.type === 'exam').length}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fees & Payments</span>
            <h3 className="text-2xl font-serif font-bold text-rose-600 mt-0.5">
              {notifications.filter((n) => n.type === 'fee').length}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { role: 'ADMIN', label: 'Admin Portal' },
            { role: 'TEACHER', label: 'Teacher Portal' },
            { role: 'STUDENT', label: 'Student Portal' },
            { role: 'PARENT', label: 'Parent Portal' },
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role as NotifRole)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === r.role
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground bg-card border border-border'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead(selectedRole)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => clearAllNotifications(selectedRole)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Category Type Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Type:
        </span>
        {[
          { key: 'ALL', label: 'All Types' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'attendance', label: 'Teacher Profiles' },
          { key: 'exam', label: 'CBT Exams' },
          { key: 'fee', label: 'Fees & Finance' },
          { key: 'warning', label: 'System Alerts' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              typeFilter === f.key
                ? 'bg-primary text-white border-primary'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const style = getTypeStyle(n.type);
            const TypeIcon = style.icon;

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer relative group ${
                  n.read ? 'bg-card border-border hover:border-muted-foreground/30' : 'bg-emerald-500/[0.04] border-emerald-500/30 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                    <TypeIcon className={`w-5 h-5 ${style.text}`} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground" title={formatExactTime(n.time)}>{timeAgo(n.time)}</span>
                      {!n.read && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                          NEW
                        </span>
                      )}
                    </div>

                    <h4 className={`font-serif font-bold text-sm sm:text-base ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  </div>
                </div>

                {/* Right remove button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(n.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="Remove notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 bg-card border border-border rounded-3xl p-8">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-lg text-foreground">No notifications found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You are completely caught up! New alerts regarding teacher edits, student records, and CBT exams will appear here in real time.
          </p>
        </div>
      )}
    </div>
  );
}
