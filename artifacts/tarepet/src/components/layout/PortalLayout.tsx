import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import tarepetLogo from '@assets/tarepet__1784835204178.png';
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, Award,
  Calendar, LogOut, Bell, Menu, X, UserCheck, ShieldAlert,
  FileText, MessageSquare, BarChart2, Building2, Settings,
  Briefcase, PenLine, Star, Library, ClipboardList, Trophy,
  CreditCard, HeartHandshake, School, Shield,
} from 'lucide-react';

export interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  title: string;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const ROLE_NAV: Record<string, NavSection[]> = {
  ADMIN: [
    { id: 'overview',   label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'users',      label: 'Manage Users',        icon: Users },
    { id: 'exams',      label: 'Manage Exams',        icon: ClipboardList },
    { id: 'courses',    label: 'All Courses',          icon: BookOpen },
    { id: 'operations', label: 'School Operations',   icon: Building2 },
    { id: 'settings',   label: 'System Settings',      icon: Settings },
  ],
  TEACHER: [
    { id: 'overview',  label: 'Overview',           icon: LayoutDashboard },
    { id: 'students',  label: 'Manage Students',    icon: Users },
    { id: 'exams',     label: 'Manage Exams',       icon: ClipboardList },
    { id: 'results',   label: 'Manage Results',     icon: FileText },
    { id: 'settings',  label: 'Settings',           icon: Settings },
  ],
  STUDENT: [
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'courses',   label: 'My course',       icon: BookOpen },
    { id: 'exams',     label: 'Exams/Test',      icon: ClipboardList },
    { id: 'results',   label: 'Check Results',   icon: BarChart2 },
    { id: 'payments',  label: 'Payment Page',    icon: CreditCard },
    { id: 'calendar',  label: 'Calendar',        icon: Calendar },
    { id: 'settings',  label: 'Setting/profile', icon: Settings },
  ],
  PARENT: [
    { id: 'overview',    label: 'Dashboard Overview',       icon: LayoutDashboard },
    { id: 'academic',    label: 'Academic Progress',        icon: GraduationCap },
    { id: 'montessori',  label: 'Montessori Development',   icon: Star },
    { id: 'attendance',  label: 'Attendance & Leave',       icon: UserCheck },
    { id: 'messages',    label: 'Messages & Conferences',   icon: MessageSquare },
    { id: 'houses',      label: 'House System',             icon: Trophy },
    { id: 'fees',        label: 'Fee Management & Pay',     icon: CreditCard },
    { id: 'support',     label: 'Support & Behavior',       icon: HeartHandshake },
    { id: 'engagement',  label: 'School & PTA Engagement',  icon: School },
    { id: 'settings',    label: 'Settings & Parent Tools',  icon: Settings },
  ],
};

function getRoleColor(role?: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-rose-500/10 text-rose-600 border-rose-200';
    case 'TEACHER': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    case 'STUDENT': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'PARENT': return 'bg-amber-500/10 text-amber-600 border-amber-200';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
}

function getRoleNav(role?: string): NavSection[] {
  switch (role) {
    case 'ADMIN': return ROLE_NAV.ADMIN;
    case 'TEACHER': return ROLE_NAV.TEACHER;
    case 'STUDENT': return ROLE_NAV.STUDENT;
    case 'PARENT': return ROLE_NAV.PARENT;
    default: return [];
  }
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children, title, activeSection, onNavigate,
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const roleColor = getRoleColor(user?.role);
  const navItems = getRoleNav(user?.role);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-border flex items-center gap-3 shrink-0">
        <img src={tarepetLogo} alt="Tare Pet Logo" className="w-10 h-10 object-contain" />
        <div className="flex flex-col">
          <h2 className="font-serif font-bold text-base text-foreground leading-tight">{t('common.app_name', 'Tare Pet LMS')}</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('common.portal_system', 'Portal System')}</p>
        </div>
      </div>

      {/* Role indicator */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border text-center ${roleColor}`}>
          {user?.role} PORTAL
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative text-left ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`ml-auto text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-primary text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User card & logout */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
              {user?.first_name?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user?.first_name} {user?.last_name}</p>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${roleColor}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/20 relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-72 bg-card border-r border-border h-full flex flex-col shadow-2xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:bg-accent z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground leading-tight">{title}</h1>
              <p className="text-xs text-muted-foreground">
                {navItems.find(n => n.id === activeSection)?.label ?? 'Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full text-muted-foreground hover:bg-accent transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
            <Link href="/" className="text-xs font-medium text-primary hover:underline hidden sm:inline-block">
              ← Public Site
            </Link>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
