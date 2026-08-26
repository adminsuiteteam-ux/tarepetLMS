import React from 'react';
import { t } from '@/lib/i18n';

// Sentry Client Instrumentation for Vite / React
export interface SentryConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
}

let isSentryInitialized = false;

export function initSentry() {
  if (typeof window === 'undefined' || isSentryInitialized) return;

  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  if (!dsn) {
    // Sentry DSN not provided; running without external telemetry
    return;
  }

  const env = (import.meta as any).env?.MODE || 'production';

  try {
    const pkg = '@sentry/react';
    // Dynamically import Sentry if available in bundle
    // @ts-ignore
    import(/* @vite-ignore */ pkg)
      .then((Sentry) => {
        Sentry.init({
          dsn,
          environment: env,
          tracesSampleRate: 0.2,
          sendDefaultPii: false,
        });
        isSentryInitialized = true;
        // Expose test helper on browser console for instant verification
        (window as any).__triggerSentryTest = () => {
          Sentry.captureMessage('Tarepet LMS Frontend: Sentry Verification Ping', 'info');
          Sentry.captureException(new Error('Tarepet LMS Frontend: Test Sentry Verification Error'));
          console.log('%c[Sentry Verified]%c Test error dispatched to your Sentry dashboard!', 'color: #10b981; font-weight: bold;', 'color: inherit;');
          return 'Dispatched test error to Sentry! Check your Sentry dashboard (Issues page).';
        };
      })
      .catch(() => {
        // @sentry/react not installed; fallback gracefully
      });
  } catch {
    // Gracefully ignore initialization failure
  }
}

export function captureException(error: any, context?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    const pkg = '@sentry/react';
    // @ts-ignore
    import(/* @vite-ignore */ pkg).then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    }).catch(() => {
      console.error('[Error Logger]', error, context);
    });
  } catch {
    console.error('[Error Logger]', error, context);
  }
}

export class SentryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const errMessage = this.state.error?.message || String(this.state.error || '');
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800 font-sans">
          <div className="max-w-md w-full p-6 bg-white rounded-3xl shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              ⚠️
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-900">{t('common.somethingWentWrong', 'Something went wrong')}</h2>
            <p className="text-xs text-slate-500">
              {t('common.unexpectedErrorDesc', 'An unexpected error occurred. The incident has been recorded for review.')}
            </p>
            {errMessage && (
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-x-auto max-h-32 border border-slate-200">
                {errMessage}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition shadow-sm"
              >
                {t('common.reloadApp', 'Reload Application')}
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.clear();
                      sessionStorage.clear();
                    } catch (e) {}
                    window.location.href = '/';
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition"
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
