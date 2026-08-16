import axios from 'axios';
import { layerbaseAuth } from './layerbase-auth';

// Enterprise API Client for Django / Layerbase JWT Authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tarepet-backend-4iw6.onrender.com/api/v1';

// ── In-memory token store ─────────────────────────────────────────────────────
// Tokens are NEVER written to localStorage or any browser storage.
// They live only in these module-level variables for the lifetime of the browser session.
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  _accessToken = access;
  _refreshToken = refresh;
  layerbaseAuth.setSessionTokens(access, refresh);
}

export function clearTokens(): void {
  _accessToken = null;
  _refreshToken = null;
  layerbaseAuth.clearSessionTokens();
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function getRefreshToken(): string | null {
  return _refreshToken;
}

/**
 * Redirect to a same-origin path only.
 * Rejects non-relative paths and scheme-relative URLs ('//' or '/\')
 * to prevent open redirect vulnerabilities (CWE-601).
 */
export function safeRedirect(target: string): void {
  const safe = target.trimStart();
  if (!safe.startsWith('/') || safe.startsWith('//') || safe.startsWith('/\\')) {
    console.error('[Auth] Blocked unsafe redirect to:', target);
    window.location.href = '/sign-in';
    return;
  }
  window.location.href = safe;
}

/**
 * Sanitize an email address for safe mailto: link usage.
 * Rejects control characters, spaces, and dangerous URI injection sequences.
 */
export function sanitizeMailto(email: string): string {
  const cleanEmail = email.trim().replace(/[\r\n\s]/g, '');
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return 'mailto:';
  }
  return `mailto:${encodeURIComponent(cleanEmail)}`;
}
// ─────────────────────────────────────────────────────────────────────────────

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token from memory
authClient.interceptors.request.use(
  (config) => {
    if (_accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Token Refresh on 401
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (_refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: _refreshToken,
          });
          const { access, refresh } = res.data;
          _accessToken = access;
          if (refresh) {
            _refreshToken = refresh;
          }
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return authClient(originalRequest);
        } catch (refreshError) {
          // Token refresh failed — clear in-memory tokens silently without forcing browser redirect
          clearTokens();
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
