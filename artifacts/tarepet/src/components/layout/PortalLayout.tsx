import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import tarepetLogo from '@assets/tarepet__1784835204178.png';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { getStoredStudents, getStoredTeachers, getStoredExams } from '@/lib/cbt-store';
import { initWebSocket } from '@/lib/websocket-client';
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, Award,
  Calendar, LogOut, Menu, X, UserCheck, ShieldAlert,
  FileText, MessageSquare, BarChart2, Building2, Settings,
  Briefcase, PenLine, Star, Library, ClipboardList, Trophy,
  CreditCard, HeartHandshake, School, Shield, Search,
  Megaphone, CalendarCheck, ChevronRight, Sun, Moon, DollarSign,
  ArrowRight, Radio, Activity, Home
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
    { id: 'overview',       label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'users',          label: 'Students',          icon: Users },
    { id: 'teachers',       label: 'Teachers',          icon: GraduationCap },
    { id: 'classes',        label: 'Classes',           icon: School },
    { id: 'subjects',       label: 'Subjects',          icon: BookOpen },
    { id: 'results',        label: 'Results',           icon: FileText },
    { id: 'attendance',     label: 'Attendance',        icon: CalendarCheck },
    { id: 'exams',          label: 'Manage Exams',      icon: ClipboardList },
    { id: 'finance',        label: 'Finance',           icon: DollarSign },
    { id: 'manage_admins',  label: 'Manage Sub-Admins', icon: ShieldAlert },
    { id: 'calendar',       label: 'School Calendar',   icon: Calendar },
    { id: 'reports',        label: 'Reports',           icon: BarChart2 },
    { id: 'profile',        label: 'My Profile',        icon: UserCheck },
    { id: 'settings',       label: 'Settings',          icon: Settings },
  ],
  TEACHER: [
    { id: 'overview',  label: 'Overview',           icon: LayoutDashboard },
    { id: 'students',  label: 'Manage Students',    icon: Users },
    { id: 'exams',     label: 'Manage Exams',       icon: ClipboardList },
    { id: 'results',   label: 'Manage Results',     icon: FileText },
    { id: 'history',   label: 'Academic History',   icon: GraduationCap },
    { id: 'profile',   label: 'My Profile',         icon: UserCheck },
    { id: 'settings',  label: 'Settings',           icon: Settings },
  ],
  STUDENT: [
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'courses',   label: 'My Subjects',     icon: BookOpen },
    { id: 'exams',     label: 'Exams/Test',      icon: ClipboardList },
    { id: 'results',   label: 'Check Results',   icon: BarChart2 },
    { id: 'payments',  label: 'Payments & Fees', icon: CreditCard },
    { id: 'calendar',  label: 'Calendar',        icon: Calendar },
    { id: 'settings',  label: 'Setting/profile', icon: Settings },
  ],
  PARENT: [
    { id: 'overview',    label: 'Dashboard Overview',       icon: LayoutDashboard },
    { id: 'academic',    label: 'Academic Progress',        icon: GraduationCap },
    { id: 'montessori',  label: 'Montessori Development',   icon: Star },
    { id: 'attendance',  label: 'Attendance & Leave',       icon: UserCheck },
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

function getMobileNavItems(role?: string): NavSection[] {
  switch (role) {
    case 'ADMIN':
      return [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'users', label: 'Students', icon: Users },
        { id: 'exams', label: 'Exams', icon: FileText },
        { id: 'profile', label: 'Profile', icon: UserCheck },
      ];
    case 'TEACHER':
      return [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'exams', label: 'Exams', icon: FileText },
        { id: 'results', label: 'Results', icon: BarChart2 },
        { id: 'history', label: 'History', icon: GraduationCap },
        { id: 'profile', label: 'Profile', icon: UserCheck },
      ];
    case 'STUDENT':
      return [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'courses', label: 'Subjects', icon: BookOpen },
        { id: 'exams', label: 'Exams', icon: FileText },
        { id: 'settings', label: 'Profile', icon: UserCheck },
      ];
    case 'PARENT':
      return [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'academic', label: 'Progress', icon: GraduationCap },
        { id: 'fees', label: 'Fees', icon: CreditCard },
        { id: 'settings', label: 'Profile', icon: UserCheck },
      ];
    default:
      return [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'profile', label: 'Profile', icon: UserCheck },
      ];
  }
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children, title, activeSection, onNavigate,
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
    const unsubWs = initWebSocket();
    return () => {
      unsubWs();
    };
  }, []);

  const roleColor = getRoleColor(user?.role);
  const navItems = getRoleNav(user?.role);
  const mobileNavItems = getMobileNavItems(user?.role);
  const userAvatar = user?.profile_image || (user as any)?.profileImage || user?.profile?.profile_image || user?.profile?.profileImage;

  const searchResults = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'Page' | 'Student' | 'Teacher' | 'Exam';
      sectionId: string;
      icon: React.ElementType;
    }> = [];

    // 1. Navigation items
    navItems.forEach(item => {
      if (item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) {
        results.push({
          id: `nav-${item.id}`,
          title: item.label,
          subtitle: 'Navigation Section',
          category: 'Page',
          sectionId: item.id,
          icon: item.icon,
        });
      }
    });

    // 2. Students
    try {
      const students = getStoredStudents();
      students.forEach(s => {
        const name = (s.name || '').toLowerCase();
        const adm = (s.admissionNo || s.code || '').toLowerCase();
        const cls = (s.grade || s.stream || '').toLowerCase();
        if (name.includes(q) || adm.includes(q) || cls.includes(q)) {
          results.push({
            id: `student-${s.id || s.admissionNo || s.code}`,
            title: s.name,
            subtitle: `${s.admissionNo || s.code} • ${s.grade || 'Student'}`,
            category: 'Student',
            sectionId: user?.role === 'ADMIN' ? 'users' : 'students',
            icon: Users,
          });
        }
      });
    } catch {}

    // 3. Teachers
    try {
      const teachers = getStoredTeachers();
      teachers.forEach(t => {
        const name = (t.name || '').toLowerCase();
        const staffId = (t.staffId || '').toLowerCase();
        const dept = (t.department || t.specialization || '').toLowerCase();
        if (name.includes(q) || staffId.includes(q) || dept.includes(q)) {
          results.push({
            id: `teacher-${t.id || t.staffId}`,
            title: t.name,
            subtitle: `${t.staffId} • ${t.department || t.specialization || 'Teacher'}`,
            category: 'Teacher',
            sectionId: user?.role === 'ADMIN' ? 'teachers' : 'overview',
            icon: GraduationCap,
          });
        }
      });
    } catch {}

    // 4. Exams
    try {
      const exams = getStoredExams();
      exams.forEach(ex => {
        const title = (ex.title || '').toLowerCase();
        const sub = (ex.course_name || ex.course_code || '').toLowerCase();
        const gr = (ex.class || ex.stream || '').toLowerCase();
        if (title.includes(q) || sub.includes(q) || gr.includes(q)) {
          results.push({
            id: `exam-${ex.id}`,
            title: ex.title,
            subtitle: `${ex.course_name || ex.course_code || 'Assessment'} (${ex.class || 'All Levels'})`,
            category: 'Exam',
            sectionId: 'exams',
            icon: ClipboardList,
          });
        }
      });
    } catch {}

    return results.slice(0, 8);
  }, [searchValue, navItems, user?.role]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Brand */}
      <div className="p-5 border-b border-border flex items-center gap-3 shrink-0">
        <img src={tarepetLogo} alt="Tare Pet Logo" className="w-7 h-7 object-contain rounded-lg" />
        <div className="flex flex-col">
          <h2 className="font-bold text-base text-foreground leading-tight">{t('common.app_name', 'Tare Pet LMS')}</h2>
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
              {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
            </button>
          );
        })}
      </nav>

      {/* User card & logout */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
          <div
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            title="View Profile"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors overflow-hidden border border-border">
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.first_name?.[0] ?? 'A'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{user?.first_name} {user?.last_name}</p>
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
    <div className="min-h-screen flex bg-muted/20 relative" style={{ fontFamily: 'var(--font-poppins)' }}>
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
        <header className="sticky top-0 z-30 bg-card border-b border-border px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-full text-muted-foreground hover:bg-accent transition-colors shrink-0"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo & Portal Title */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <img src={tarepetLogo} alt="Logo" className="w-6 h-6 object-contain rounded-full" />
              <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[130px] sm:max-w-[200px]">
                {title || 'Tarepet LMS'}
              </span>
            </div>

            {/* Desktop School Name / Breadcrumb */}
            <div className="hidden lg:block shrink-0">
              <h1 className="text-base font-bold text-foreground leading-tight">{title}</h1>
              <p className="text-[11px] text-muted-foreground">
                {navItems.find(n => n.id === activeSection)?.label ?? 'Dashboard'}
              </p>
            </div>

            {/* Desktop Search Bar Link */}
            <div
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/search';
              }}
              className="hidden md:flex flex-1 max-w-sm ml-2 relative cursor-pointer group"
              title="Click to open Search Page"
            >
              <div className="relative flex items-center w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <input
                  type="text"
                  readOnly
                  placeholder="Click to search students, teachers, exams, pages..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-muted/50 border border-border rounded-full focus:outline-none text-foreground placeholder:text-muted-foreground cursor-pointer hover:bg-muted/80 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right actions: Completely Rounded Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Icon Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/search';
              }}
              title="Search Portal"
              className="md:hidden p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <NotificationPanel role={(user?.role ?? 'STUDENT') as any} />

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Header Trigger */}
            <div
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-border cursor-pointer group"
              title="Click to view Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm group-hover:scale-105 transition-transform shadow-xs overflow-hidden border border-border">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.first_name?.[0] ?? 'A'
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{user?.first_name ?? 'User'} {user?.last_name ?? ''}</p>
                <p className="text-[10px] text-muted-foreground">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'Member'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-5 md:p-7 pb-24 lg:pb-7 overflow-y-auto">
          {children}
        </main>

        {/* Floating Minimalist Homebar with Completely Rounded Border Radius matching @jsav.design mockup */}
        <div className="lg:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <nav className="pointer-events-auto bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full p-1.5 flex items-center gap-2 sm:gap-4 transition-all duration-300">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-md scale-105 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

