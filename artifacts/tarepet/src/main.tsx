import { createRoot } from 'react-dom/client';

import './i18n';
import App from './App';
import { initSentry, SentryErrorBoundary } from './lib/sentry';

import './index.css';

// Initialize Sentry telemetry
initSentry();

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

