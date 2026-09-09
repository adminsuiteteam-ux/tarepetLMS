import { createRoot } from 'react-dom/client';

import './i18n';
import App from './App';
import { initSentry, SentryErrorBoundary } from './lib/sentry';

import './index.css';

// Initialize Sentry telemetry
initSentry();

// Catch dynamic import errors at the global level before they hit React's ErrorBoundary
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('Failed to fetch dynamically imported module') ||
      reason.includes('Importing a module script failed') ||
      reason.includes('ChunkLoadError')
    ) {
      event.preventDefault();
      const key = 'tarepet_chunk_reload_count';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(key, String(count + 1));
        window.location.reload();
      }
    }
  });
}

// Unregister any old service workers & clear stale browser caches automatically
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <SentryErrorBoundary>
    <App />
  </SentryErrorBoundary>
);

