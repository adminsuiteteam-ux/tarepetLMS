import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft, Edit3, Globe, Coins, Sun, Moon, ShieldCheck,
  Smartphone, KeyRound, CreditCard, LogOut, ChevronRight,
  MapPin, CheckCircle2, User, Sparkles, Printer
} from 'lucide-react';

export interface MobileProfileViewProps {
  name: string;
  email: string;
  subtitle?: string;
  avatarUrl?: string;
  roleBadge?: string;
  location?: string;
  onBack?: () => void;
  onEditProfile: () => void;
  onViewIdCard?: () => void;
  onChangePassword?: () => void;
  onPrintProfile?: () => void;
  extraMenuItems?: Array<{
    icon: React.ElementType;
    label: string;
    value?: string;
    onClick: () => void;
    color?: string;
  }>;
}

export const MobileProfileView: React.FC<MobileProfileViewProps> = ({
  name,
  email,
  subtitle,
  avatarUrl,
  roleBadge,
  location = 'Yenagoa, Nigeria',
  onBack,
  onEditProfile,
  onViewIdCard,
  onChangePassword,
  onPrintProfile,
  extraMenuItems = []
}) => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, setLanguage, availableLanguages } = useTranslation();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showCurrenciesModal, setShowCurrenciesModal] = useState(false);

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

  const roleTitle = roleBadge || user?.role || 'Member';

  return (
    <div className="w-full pb-24 relative" style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Tarepet brand ambient gradient background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent pointer-events-none -z-10" />

      {/* Main Profile Hero Card (Prominent Rounded Card with Original User Data) */}
      <div className="bg-card rounded-3xl border border-border/80 shadow-md p-6 text-center space-y-4 relative overflow-hidden mb-5">
        {/* Subtle brand glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Circular Avatar */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-primary/20 shadow-md bg-muted flex items-center justify-center mx-auto">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 text-primary font-bold font-serif text-2xl flex items-center justify-center">
                {name?.[0] || user?.first_name?.[0] || 'U'}
              </div>
            )}
          </div>
          <button
            onClick={onEditProfile}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white shadow-md hover:scale-110 active:scale-95 transition-all border-2 border-card"
            title="Edit Avatar / Profile"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Name and Contact */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">
              {name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Official User')}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-normal break-all">
            {email || user?.email || 'user@tarepet.com'}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium pt-1 flex-wrap">
            <span className="font-semibold text-primary">{subtitle || roleTitle}</span>
            {location && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-secondary shrink-0" />
                  {location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tarepet Brand Primary Pill Button: "Edit Profile" */}
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

      {/* Menu Options List Cards */}
      <div className="space-y-2.5">
        {/* 1. Language */}
        <div
          onClick={() => setShowLanguageModal(true)}
          className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t('profile.language', 'Language')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] font-medium uppercase text-muted-foreground/80">{currentLanguage || 'English'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 2. Currencies / Fees */}
        <div
          onClick={() => setShowCurrenciesModal(true)}
          className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t('profile.currencies', 'Currencies & Billing')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] font-medium text-muted-foreground/80">NGN (₦)</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Appearance */}
        <div
          onClick={toggleDarkMode}
          className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-primary" />}
            </div>
            <span className="text-xs font-semibold text-foreground">{t('profile.appearance', 'Appearance')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] font-medium text-muted-foreground/80">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 4. Application Security */}
        <div
          onClick={() => setShowSecurityModal(true)}
          className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t('profile.app_security', 'Application Security')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Secure</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 5. Manage Devices */}
        <div
          onClick={() => setShowDevicesModal(true)}
          className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">{t('profile.manage_devices', 'Manage Devices')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] font-medium text-muted-foreground/80">1 Active</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 6. Change Password */}
        {onChangePassword && (
          <div
            onClick={onChangePassword}
            className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">{t('profile.change_password', 'Change Password')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* 7. View Digital ID Card (if provided) */}
        {onViewIdCard && (
          <div
            onClick={onViewIdCard}
            className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">Digital Identity Card</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* 8. Print Profile (if provided) */}
        {onPrintProfile && (
          <div
            onClick={onPrintProfile}
            className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">Print Official Records</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* Extra Role-Specific Menu Items */}
        {extraMenuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={item.onClick}
              className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color || 'bg-primary/10 text-primary'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {item.value && <span className="text-[11px] font-medium text-muted-foreground/80">{item.value}</span>}
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}

        {/* Sign Out */}
        <div
          onClick={logout}
          className="bg-card rounded-2xl border border-rose-500/20 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-rose-500/10 active:scale-[0.99] transition-all mt-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-rose-600">{t('common.logout', 'Sign Out')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </div>
      </div>

      {/* Language Switcher Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Select Language
              </h3>
              <button onClick={() => setShowLanguageModal(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                Done
              </button>
            </div>
            <div className="space-y-2">
              {[
                { code: 'en', name: 'English (US & UK)', flag: '🇬🇧' },
                { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
                { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
                { code: 'ig', name: 'Igbo (Asụsụ Igbo)', flag: '🇳🇬' },
                { code: 'yo', name: 'Yorùbá (Èdè Yorùbá)', flag: '🇳🇬' },
                { code: 'ha', name: 'Hausa (Harshen)', flag: '🇳🇬' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all ${
                    currentLanguage === lang.code
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted/30 text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                  {currentLanguage === lang.code && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currencies Modal */}
      {showCurrenciesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-secondary" /> Currency & Fees Schedule
              </h3>
              <button onClick={() => setShowCurrenciesModal(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Nigerian Naira (NGN - ₦)</p>
                  <p className="text-[10px] text-muted-foreground">Primary School Tuition & CBT Billing</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-secondary" />
              </div>
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">US Dollar (USD - $)</p>
                  <p className="text-[10px] text-muted-foreground">International Students / Foreign Transfer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Status Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Application Security
              </h3>
              <button onClick={() => setShowSecurityModal(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                Close
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-secondary">
                  <CheckCircle2 className="w-4 h-4" /> Account Protected
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your session is encrypted with TLS 1.3 and verified via JWT tokens.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/20 border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role Level:</span>
                  <span className="font-bold text-foreground">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session Status:</span>
                  <span className="font-bold text-secondary">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Devices Modal */}
      {showDevicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Authorized Devices
              </h3>
              <button onClick={() => setShowDevicesModal(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-bold text-foreground">Current Active Device</p>
                    <p className="text-[10px] text-muted-foreground">Web Session • Online now</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">This device</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
