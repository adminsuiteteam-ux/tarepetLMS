/**
 * Tarepet Live Telemetry & Error Alerting Guardian
 * Automatically monitors the browser for:
 * - Broken code & uncaught runtime errors (window.onerror)
 * - Unhandled Promise rejections
 * - Unresponsive UI / main thread freezes
 * - Network degradation & offline events
 * - Security anomalies
 * 
 * Sends live feedback to the Django backend which dispatches instant email alerts to administrators.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tarepet-backend-4iw6.onrender.com/api/v1';

const _sentAlerts: Record<string, number> = {};

export interface TelemetryAlertPayload {
  alert_type: 'BROKEN_CODE' | 'BACKEND_ERROR' | 'UNRESPONSIVE_UI' | 'DATABASE_USAGE' | 'SECURITY_BREACH' | 'NETWORK_FAILURE';
  title: string;
  details: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  url?: string;
}

export function reportTelemetryAlert({
  alert_type,
  title,
  details,
  severity = 'HIGH',
  url = typeof window !== 'undefined' ? window.location.href : '',
}: TelemetryAlertPayload): void {
  if (typeof window === 'undefined') return;

  // Rate-limit identical alerts (max 1 per 5 minutes)
  const fingerprint = `${alert_type}_${title.slice(0, 60)}`;
  const now = Date.now();
  if (_sentAlerts[fingerprint] && now - _sentAlerts[fingerprint] < 300000) {
    return;
  }
  _sentAlerts[fingerprint] = now;

  let userStr = 'Anonymous / Guest';
  try {
    const rawUser = localStorage.getItem('tarepet_auth_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      userStr = `${parsed.email || parsed.username || 'User'} (${parsed.role || 'ROLE'})`;
    }
  } catch {}

  const payload = {
    alert_type,
    title,
    details: `${details}\n\nClient Time: ${new Date().toISOString()}\nActive User: ${userStr}`,
    severity,
    url,
    device: navigator.userAgent,
    screen_resolution: `${window.innerWidth}x${window.innerHeight}`,
  };

  try {
    const endpoint = `${API_BASE}/communication/telemetry/alert/`;
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    // Fail-safe to ensure reporting itself never throws
  }
}

let _isInitialized = false;

export function initTelemetry(): void {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;

  // 1. Uncaught runtime JavaScript errors (broken code)
  window.addEventListener('error', (event) => {
    // Filter out normal browser extension errors or benign resize observer alerts
    const msg = event.message || '';
    if (
      msg.includes('ResizeObserver') ||
      msg.includes('Extension') ||
      msg.includes('Script error.')
    ) {
      return;
    }

    reportTelemetryAlert({
      alert_type: 'BROKEN_CODE',
      title: `Uncaught Exception: ${msg.slice(0, 100)}`,
      details: `Message: ${msg}\nSource: ${event.filename}:${event.lineno}:${event.colno}\nStack:\n${event.error?.stack || 'No stack trace available'}`,
      severity: 'HIGH',
      url: window.location.href,
    });
  });

  // 2. Unhandled Promise Rejections (e.g. failed async API actions or unhandled fetch)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');

    // Ignore chunk reloads which are auto-recovered by Vite chunk handler
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('ChunkLoadError')
    ) {
      return;
    }

    reportTelemetryAlert({
      alert_type: 'BROKEN_CODE',
      title: `Unhandled Promise Rejection: ${msg.slice(0, 100)}`,
      details: `Rejection Reason: ${msg}\nStack:\n${reason?.stack || 'No stack trace available'}`,
      severity: 'HIGH',
      url: window.location.href,
    });
  });

  // 3. Network Drop / Offline Alerts
  window.addEventListener('offline', () => {
    reportTelemetryAlert({
      alert_type: 'NETWORK_FAILURE',
      title: 'Client Network Drop / Connection Lost',
      details: 'Browser detected navigator.onLine transitioned to FALSE during active session.',
      severity: 'MEDIUM',
      url: window.location.href,
    });
  });

  // 4. UI Unresponsiveness / Main Thread Freeze Detector
  let lastHeartbeat = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delay = now - lastHeartbeat;
    // If the browser thread froze for more than 5.5 seconds (5000ms threshold)
    if (delay > 5500) {
      reportTelemetryAlert({
        alert_type: 'UNRESPONSIVE_UI',
        title: `Browser Thread Freeze Detected (${Math.round(delay / 1000)}s stall)`,
        details: `The JavaScript event loop was blocked for ${delay}ms without yielding execution.`,
        severity: 'MEDIUM',
        url: window.location.href,
      });
    }
    lastHeartbeat = now;
  }, 1000);
}
