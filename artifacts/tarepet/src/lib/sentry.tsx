import React from 'react';

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
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
          <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-500">
              An unexpected error occurred. The incident has been recorded for review.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-xs hover:bg-primary/90 transition shadow-md"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
