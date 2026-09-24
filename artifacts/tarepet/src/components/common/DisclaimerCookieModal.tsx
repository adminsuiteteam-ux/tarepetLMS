import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Check, ChevronDown, ChevronUp, Lock, BarChart3, Sliders, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tarepet-backend-4iw6.onrender.com/api/v1';

export function DisclaimerCookieModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Preference states
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if consent has already been recorded in localStorage or cookies
    const storedConsent = localStorage.getItem('tarepet_cookie_consent');
    if (!storedConsent) {
      // Small timeout for smooth initial page entrance animation
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Event listener so user can reopen modal from Footer or Settings
    const handleOpen = () => {
      const storedConsent = localStorage.getItem('tarepet_cookie_consent');
      if (storedConsent) {
        try {
          const parsed = JSON.parse(storedConsent);
          setAnalyticsEnabled(parsed.analytics !== false);
          setFunctionalEnabled(parsed.functional !== false);
        } catch {}
      }
      setShowCustomizer(true);
      setIsOpen(true);
    };

    window.addEventListener('tarepet_open_cookie_modal', handleOpen);
    return () => window.removeEventListener('tarepet_open_cookie_modal', handleOpen);
  }, []);

  const saveConsent = async (status: 'ALL' | 'ESSENTIAL' | 'CUSTOM') => {
    setIsSubmitting(true);
    const analytics = status === 'ALL' ? true : status === 'ESSENTIAL' ? false : analyticsEnabled;
    const functional = status === 'ALL' ? true : status === 'ESSENTIAL' ? false : functionalEnabled;

    const payload = {
      consent_status: status,
      necessary: true,
      analytics,
      functional,
      security: true,
      disclaimer_acknowledged: true,
      timestamp: Date.now(),
    };

    // 1. Immediately store in localStorage so banner closes
    try {
      localStorage.setItem('tarepet_cookie_consent', JSON.stringify(payload));
    } catch {}

    setIsOpen(false);
    setIsSubmitting(false);

    // 2. Transmit to Django backend to persist in database & set secure HTTP response cookie
    try {
      await fetch(`${API_BASE}/communication/cookies/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Backend sync failure does not hinder user navigation
      console.warn('Backend cookie consent sync deferred:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-card text-card-foreground border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
      >
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/80 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 id="disclaimer-title" className="font-serif font-bold text-lg sm:text-xl leading-tight">
                {t('Institutional Disclaimer & Cookie Policy', 'Institutional Disclaimer & Cookie Policy')}
              </h2>
              <p className="text-xs text-white/80 font-sans">
                Tare Pet Montessori School Official LMS & Portal System
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white/95">
            <Lock className="w-3 h-3" /> {t('Secured', 'Secured')}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-muted-foreground">
          
          {/* Institutional Disclaimer Box */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-foreground space-y-2">
            <div className="flex items-center gap-2 font-serif font-bold text-sm text-primary">
              <Shield className="w-4 h-4 shrink-0 text-primary" />
              <span>{t('Official Educational & Privacy Disclaimer', 'Official Educational & Privacy Disclaimer')}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-normal">
              {t(
                'This portal is the official academic and administrative environment of Tare Pet Montessori School. All continuous assessments (CBT), academic records, terminal reports, and bursary schedules published herein represent verified school data. Access is governed by our strict code of academic integrity and student records protection policies.',
                'This portal is the official academic and administrative environment of Tare Pet Montessori School. All continuous assessments (CBT), academic records, terminal reports, and bursary schedules published herein represent verified school data. Access is governed by our strict code of academic integrity and student records protection policies.'
              )}
            </p>
          </div>

          {/* Cookie Notice Description */}
          <p className="text-xs text-muted-foreground">
            {t(
              'We use essential browser cookies and security tokens to safeguard user sessions, prevent fraudulent access, and maintain CBT test stability. With your consent, we also gather diagnostic telemetry to identify broken code, responsive defects, or network disruptions in real time.',
              'We use essential browser cookies and security tokens to safeguard user sessions, prevent fraudulent access, and maintain CBT test stability. With your consent, we also gather diagnostic telemetry to identify broken code, responsive defects, or network disruptions in real time.'
            )}
          </p>

          {/* Toggle Customize Section */}
          <div className="pt-1">
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors focus:outline-none"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showCustomizer ? t('Hide Cookie Preferences', 'Hide Cookie Preferences') : t('Customize Cookie Preferences', 'Customize Cookie Preferences')}
              {showCustomizer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Customizer Categories */}
          {showCustomizer && (
            <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
              
              {/* Necessary */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-foreground">{t('Strictly Necessary Cookies', 'Strictly Necessary Cookies')}</h4>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t('Always Active', 'Always Active')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Essential for authentication, CSRF validation, CBT exam session security, and basic navigation.', 'Essential for authentication, CSRF validation, CBT exam session security, and basic navigation.')}
                    </p>
                  </div>
                </div>
                <input type="checkbox" checked disabled className="mt-1.5 accent-primary h-4 w-4 rounded opacity-75 cursor-not-allowed" />
              </div>

              {/* Analytics & Error Telemetry */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{t('Diagnostics & Telemetry Alerts', 'Diagnostics & Telemetry Alerts')}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Permits automated error reporting to instantly email school engineers if a script or page fails.', 'Permits automated error reporting to instantly email school engineers if a script or page fails.')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="mt-1.5 accent-primary h-4 w-4 rounded cursor-pointer"
                  id="cookie-analytics"
                />
              </div>

              {/* Functional & Preferences */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Cookie className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{t('Personalization & UI Preferences', 'Personalization & UI Preferences')}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Remembers light/dark theme preference, selected language, and local offline CBT drafts.', 'Remembers light/dark theme preference, selected language, and local offline CBT drafts.')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={functionalEnabled}
                  onChange={(e) => setFunctionalEnabled(e.target.checked)}
                  className="mt-1.5 accent-primary h-4 w-4 rounded cursor-pointer"
                  id="cookie-functional"
                />
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>{t('By continuing, you agree to our policies.', 'By continuing, you agree to our policies.')}</span>
            <a href="/about" className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold">
              {t('Learn More', 'Learn More')} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {showCustomizer ? (
              <button
                onClick={() => saveConsent('CUSTOM')}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs transition"
              >
                {t('Save Custom Choice', 'Save Custom Choice')}
              </button>
            ) : (
              <button
                onClick={() => saveConsent('ESSENTIAL')}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs transition"
              >
                {t('Essential Only', 'Essential Only')}
              </button>
            )}

            <button
              onClick={() => saveConsent('ALL')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {t('Accept All & Enter', 'Accept All & Enter')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
