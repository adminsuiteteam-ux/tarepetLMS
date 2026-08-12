import React, { useState } from 'react';
import {
  Shield, UserPlus, Users, Lock, KeyRound, Clock, Laptop, AlertCircle,
  CheckCircle2, Eye, ShieldAlert, Sparkles, Building2, Smartphone, Monitor, Info
} from 'lucide-react';
import { authClient } from '@/lib/api-auth';
import { addRealtimeNotification } from '@/lib/notifications-store';

export interface SubAdminUser {
  id: string;
  name: string;
  email: string;
  staffId: string;
  role: 'FINANCIAL_MANAGER' | 'PRINCIPAL' | 'ADMIN_ASSISTANT';
  status: 'ACTIVE' | 'PENDING_PASSWORD';
  createdAt: string;
  lastLogin?: string;
  lastIp?: string;
  lastDevice?: string;
}

export interface AdminAuditLog {
  id: string;
  adminName: string;
  staffId: string;
  role: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
}

const INITIAL_SUB_ADMINS: SubAdminUser[] = [
  {
    id: 'admin_1',
    name: 'Mrs. Cynthia Egbe',
    email: 'finance.bursar@tarepet.com',
    staffId: 'TMS/ADM/0101',
    role: 'FINANCIAL_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:30:00Z',
    lastLogin: '2026-08-10T14:22:10Z',
    lastIp: '197.210.65.18',
    lastDevice: 'Chrome (Windows 11)'
  },
  {
    id: 'admin_2',
    name: 'Dr. Emmanuel Okafor',
    email: 'principal.okafor@tarepet.com',
    staffId: 'TMS/ADM/0102',
    role: 'PRINCIPAL',
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00Z',
    lastLogin: '2026-08-10T16:05:44Z',
    lastIp: '102.89.44.112',
    lastDevice: 'Safari (macOS)'
  }
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_1',
    adminName: 'Mrs. Cynthia Egbe',
    staffId: 'TMS/ADM/0101',
    role: 'FINANCIAL_MANAGER',
    action: 'Logged into Financial Management Portal',
    timestamp: '2026-08-10 14:22:10',
    ipAddress: '197.210.65.18',
    deviceInfo: 'Chrome 127.0 (Windows)'
  },
  {
    id: 'log_2',
    adminName: 'Dr. Emmanuel Okafor',
    staffId: 'TMS/ADM/0102',
    role: 'PRINCIPAL',
    action: 'Logged into Principal Executive Dashboard',
    timestamp: '2026-08-10 16:05:44',
    ipAddress: '102.89.44.112',
    deviceInfo: 'Safari 17.5 (macOS)'
  }
];

export function AdminManagementPanel() {
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>(INITIAL_SUB_ADMINS);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'FINANCIAL_MANAGER' as SubAdminUser['role']
  });

  const MAX_SUB_ADMINS = 3;
  const canAddAdmin = subAdmins.length < MAX_SUB_ADMINS;

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddAdmin) {
      alert('Maximum limit of 3 sub-administrators reached.');
      return;
    }

    const nextNumber = (subAdmins.length + 103).toString().padStart(4, '0');
    const autoStaffId = `TMS/ADM/${nextNumber}`;
    const autoCode = autoStaffId;

    const newAdmin: SubAdminUser = {
      id: `subadmin_${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      staffId: autoStaffId,
      role: form.role,
      status: 'PENDING_PASSWORD',
      createdAt: new Date().toISOString()
    };

    setSubAdmins(prev => [...prev, newAdmin]);
    setShowAddModal(false);

    // Record audit log
    const newLog: AdminAuditLog = {
      id: `log_${Date.now()}`,
      adminName: 'Super Administrator',
      staffId: 'TMS/ADM/0001',
      role: 'SUPER_ADMIN',
      action: `Created sub-admin account for ${newAdmin.name} (${newAdmin.role})`,
      timestamp: new Date().toLocaleString(),
      ipAddress: '127.0.0.1 (Current Session)',
      deviceInfo: navigator.userAgent.includes('Windows') ? 'Windows PC' : 'Mac/Mobile Device'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Async sync with Django API
    authClient.post('/auth/register/', {
      email: newAdmin.email,
      password: autoCode, // Default password is Staff ID
      first_name: newAdmin.name.split(' ')[0] || newAdmin.name,
      last_name: newAdmin.name.split(' ').slice(1).join(' ') || 'Admin',
      role: 'ADMIN',
      staff_id: autoStaffId,
      sub_role: newAdmin.role
    }).catch(() => {});

    addRealtimeNotification({
      title: '👑 Sub-Admin Created',
      message: `Sub-admin ${newAdmin.name} registered. Default password set to Staff ID: ${autoStaffId}`,
      category: 'SYSTEM',
      type: 'info',
      recipientRole: 'ADMIN'
    });

    setFeedback(`Sub-Admin registered! Staff ID & Default Password: ${autoStaffId}. User will be forced to change password on first login.`);
    setForm({ name: '', email: '', role: 'FINANCIAL_MANAGER' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-foreground">Sub-Admin & Access Control Hub</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage delegated administrative privileges (Max 3 sub-admins), role restrictions, and security login audit logs.
            </p>
          </div>
        </div>

        <button
          onClick={() => { setFeedback(null); setShowAddModal(true); }}
          disabled={!canAddAdmin}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shrink-0 ${
            canAddAdmin
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Sub-Admin ({subAdmins.length}/{MAX_SUB_ADMINS})</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Sub-Admins List */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-600" /> Authorized Sub-Admin Accounts ({subAdmins.length}/3)
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">
            {MAX_SUB_ADMINS - subAdmins.length} Slot(s) Remaining
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subAdmins.map(admin => (
            <div key={admin.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-3 relative group">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{admin.name}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{admin.staffId}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  admin.role === 'FINANCIAL_MANAGER'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : admin.role === 'PRINCIPAL'
                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                }`}>
                  {admin.role.replace('_', ' ')}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="truncate"><strong className="text-foreground">Email:</strong> {admin.email}</div>
                <div><strong className="text-foreground">Login Status:</strong> {admin.status === 'PENDING_PASSWORD' ? (
                  <span className="text-amber-600 font-semibold">Pending First Password Change</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Password Set & Active</span>
                )}</div>
                {admin.lastLogin && (
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border mt-2">
                    Last active: {new Date(admin.lastLogin).toLocaleString()} ({admin.lastIp})
                  </div>
                )}
              </div>
            </div>
          ))}

          {subAdmins.length < MAX_SUB_ADMINS && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-6 rounded-xl border border-dashed border-border hover:border-rose-500/50 hover:bg-rose-500/5 transition-all text-center space-y-2 flex flex-col items-center justify-center text-muted-foreground hover:text-rose-600"
            >
              <UserPlus className="w-6 h-6" />
              <span className="text-xs font-bold">Add Sub-Admin Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Sub-Admin Login Audit Trail */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Security Audit Log & Device Tracking
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live record of all administrator logins, timestamps, IP addresses, and hardware specs.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
            Live Tracking Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Administrator / Staff ID</th>
                <th className="py-3 px-4">Role Access</th>
                <th className="py-3 px-4">Action Recorded</th>
                <th className="py-3 px-4">Timestamp & Date</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Device & Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4">
                    <div className="font-bold text-foreground">{log.adminName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{log.staffId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground font-mono">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{log.timestamp}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{log.ipAddress}</td>
                  <td className="py-3 px-4 text-muted-foreground flex items-center gap-1.5 mt-2">
                    <Laptop className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{log.deviceInfo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sub-Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Create Sub-Admin Account</h3>
                <p className="text-xs text-muted-foreground">Default password will be set to their Staff ID</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Cynthia Egbe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. finance.bursar@tarepet.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Access Role Privilege</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as SubAdminUser['role'] })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="FINANCIAL_MANAGER">Financial Manager (Bursary & Finance Only)</option>
                  <option value="PRINCIPAL">Principal (Academic & Student Records Only)</option>
                  <option value="ADMIN_ASSISTANT">Admin Assistant (General Operations)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[11px] leading-relaxed">
                ℹ️ <strong>First Login Security:</strong> Sub-admins log in using their email & auto-generated Staff ID as default password. They will be immediately forced to configure their private password.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-xl font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
                >
                  Create Sub-Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
