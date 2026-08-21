import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import {
  Edit3, User, School, BookOpen, GraduationCap,
  Award, Phone, Mail, LogOut, CheckCircle2, MapPin,
  FileBadge, CreditCard, BarChart2, ClipboardList, Users
} from 'lucide-react';

export interface ProfileCardItem {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  badge?: string;
  badgeColor?: string;
  color?: string;
  onClick?: () => void;
}

export interface MobileProfileViewProps {
  name: string;
  email: string;
  staffId?: string;
  roleTitle?: string;
  formClass?: string;
  specialization?: string;
  qualification?: string;
  phone?: string;
  subjectsAssigned?: Array<any>;
  avatarUrl?: string;
  roleBadge?: string;
  location?: string;
  onBack?: () => void;
  onEditProfile: () => void;
  onLogout?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  customCards?: ProfileCardItem[];
}

export const MobileProfileView: React.FC<MobileProfileViewProps> = ({
  name,
  email,
  staffId,
  roleTitle,
  formClass,
  specialization,
  qualification,
  phone,
  subjectsAssigned = [],
  avatarUrl,
  roleBadge,
  location = 'Tarepet Montessori Academy, Yenagoa',
  onBack,
  onEditProfile,
  onLogout,
  onNavigateSection,
  customCards
}) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const effectiveStaffId = staffId || (user as any)?.staffId || (user?.profile as any)?.teacher_id || (user?.profile as any)?.student_id || 'TMS/TCH/0007';
  const effectiveName = name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || 'Abiola Adeniyi Adegemo';
  const effectiveRole = roleTitle || (formClass && formClass !== 'None' ? `Form Teacher (${formClass})` : (user?.role === 'TEACHER' ? 'Form Teacher (Senior Science)' : (user?.role || 'Staff Member')));
  const effectiveFormClass = formClass || 'Senior Science';
  const effectiveSpecialization = specialization || 'Physics (PRI - SS3) & Financial Accounting (JSS 1)';
  const effectiveQualification = qualification || 'Not Specified';
  const effectivePhone = phone || user?.phone || '+234 800 000 0000';
  const effectiveEmail = email || user?.email || 'adeniyiabiola2@gmail.com';

  const subjectsList = subjectsAssigned && subjectsAssigned.length > 0
    ? subjectsAssigned.map(s => (typeof s === 'string' ? s : s.name || 'Physics'))
    : ['Physics'];

  const officialCards: ProfileCardItem[] = customCards || [
    {
      icon: FileBadge,
      label: 'Staff ID Number',
      value: (
        <span className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs border border-primary/20">
          {effectiveStaffId}
        </span>
      ),
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: User,
      label: 'Full Name & Title',
      value: effectiveName,
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: School,
      label: 'Staff Role / Duty',
      value: effectiveRole,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      icon: Award,
      label: 'Academic Specialization',
      value: effectiveSpecialization,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: BookOpen,
      label: 'Qualifications & Degrees',
      value: effectiveQualification,
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      icon: GraduationCap,
      label: 'Form Teacher Class Assignment',
      value: (
        <span className="inline-block px-3 py-1 rounded-lg bg-secondary/10 text-secondary font-bold text-xs border border-secondary/20">
          {effectiveFormClass}
        </span>
      ),
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: Phone,
      label: 'Contact Phone',
      value: effectivePhone,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      icon: Mail,
      label: 'Official Email',
      value: <span className="font-semibold text-foreground underline break-all">{effectiveEmail}</span>,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: BookOpen,
      label: `Assigned Subjects & Classes (${subjectsList.length})`,
      value: (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {subjectsList.map((sub, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {sub}
            </span>
          ))}
        </div>
      ),
      color: 'bg-primary/10 text-primary',
    },
  ];

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="w-full pb-28 relative" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent pointer-events-none -z-10" />

      {/* Main Profile Hero Card */}
      <div className="bg-card rounded-3xl border border-border/80 shadow-md p-6 text-center space-y-4 relative overflow-hidden mb-5">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-primary/20 shadow-md bg-muted flex items-center justify-center mx-auto">
            {avatarUrl ? (
              <img src={avatarUrl} alt={effectiveName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 text-primary font-bold font-serif text-2xl flex items-center justify-center">
                {effectiveName?.[0] || user?.first_name?.[0] || 'A'}
              </div>
            )}
          </div>
          <button
            onClick={onEditProfile}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white shadow-md hover:scale-110 active:scale-95 transition-all border-2 border-card cursor-pointer"
            title="Edit Avatar / Profile"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">{effectiveName}</h2>
          <p className="text-xs text-muted-foreground font-normal break-all">{effectiveEmail}</p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium pt-1 flex-wrap">
            <span className="font-semibold text-primary">{effectiveRole}</span>
            <span>•</span>
            <span className="inline-block font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[10px]">
              ID: {effectiveStaffId}
            </span>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onEditProfile}
            className="px-8 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md shadow-primary/25 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('profile.edit_profile', 'Edit Profile')}</span>
          </button>
        </div>
      </div>

      {/* Official Information Cards (Strictly holding the user details) */}
      <div className="space-y-2.5">
        {officialCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={card.onClick}
              className={`bg-card rounded-2xl border border-border/80 p-4 shadow-xs flex flex-col gap-1 transition-all ${
                card.onClick ? 'cursor-pointer hover:bg-muted/40 active:scale-[0.99]' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-xl ${card.color || 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <div className="pl-9.5 text-xs font-bold text-foreground">
                {typeof card.value === 'string' ? (
                  <span className="text-sm font-semibold">{card.value}</span>
                ) : (
                  card.value
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Academic Navigation Cards */}
        {onNavigateSection && (
          <div className="pt-4 pb-1 space-y-2.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Academic Navigation & Records
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigateSection('results')}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col items-start gap-1 hover:bg-muted/40 active:scale-[0.98] transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Manage Results</span>
                <span className="text-[10px] text-muted-foreground">Term grading & report cards</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('history')}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col items-start gap-1 hover:bg-muted/40 active:scale-[0.98] transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Academic History</span>
                <span className="text-[10px] text-muted-foreground">Promotion cohorts & archives</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('exams')}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col items-start gap-1 hover:bg-muted/40 active:scale-[0.98] transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Manage Exams</span>
                <span className="text-[10px] text-muted-foreground">CBT test question bank</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('students')}
                className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col items-start gap-1 hover:bg-muted/40 active:scale-[0.98] transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Manage Students</span>
                <span className="text-[10px] text-muted-foreground">Student directory & roster</span>
              </button>
            </div>
          </div>
        )}

        {/* Sign Out Card */}
        <div
          onClick={handleSignOut}
          className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-rose-500/10 active:scale-[0.99] transition-all mt-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {t('nav.logout', 'Sign Out')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
