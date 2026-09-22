import axios from 'axios';
import { layerbaseAuth } from './layerbase-auth';

// Enterprise API Client for Django / Layerbase JWT Authentication
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://tarepet-backend-4iw6.onrender.com/api/v1';
  }
  const hostname = window.location.hostname;
  const protocol = window.location.protocol || 'http:';

  // 1. If accessing via localhost / 127.0.0.1 on the host machine
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//127.0.0.1:8000/api/v1`;
  }

  // 2. If accessing via LAN IP (e.g. 192.168.x.x, 10.x.x.x, 172.x.x.x) from Device B
  const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isLanIp) {
    return `${protocol}//${hostname}:8000/api/v1`;
  }

  // 3. If explicit non-localhost production URL configured in env
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
  if (envBase && !envBase.includes('localhost') && !envBase.includes('127.0.0.1')) {
    return envBase;
  }

  // 4. Production default live cloud backend (Render)
  return 'https://tarepet-backend-4iw6.onrender.com/api/v1';
}

export const API_BASE_URL = getApiBaseUrl();

// ── Persistent & Cached Token Store ──────────────────────────────────────────
// Tokens are cached in localStorage + sessionStorage so users remain securely logged in across page reloads.
let _accessToken: string | null = typeof window !== 'undefined' 
  ? (localStorage.getItem('tarepet_access_token') || sessionStorage.getItem('tarepet_access_token')) 
  : null;
let _refreshToken: string | null = typeof window !== 'undefined' 
  ? (localStorage.getItem('tarepet_refresh_token') || sessionStorage.getItem('tarepet_refresh_token')) 
  : null;

export function setTokens(access: string, refresh?: string): void {
  _accessToken = access;
  if (refresh !== undefined && refresh !== null) {
    _refreshToken = refresh;
  }
  if (typeof window !== 'undefined') {
    if (access) {
      localStorage.setItem('tarepet_access_token', access);
      sessionStorage.setItem('tarepet_access_token', access);
    }
    if (refresh) {
      localStorage.setItem('tarepet_refresh_token', refresh);
      sessionStorage.setItem('tarepet_refresh_token', refresh);
    }
  }
  layerbaseAuth.setSessionTokens(access, _refreshToken || '');
}

export function clearTokens(): void {
  _accessToken = null;
  _refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tarepet_access_token');
    sessionStorage.removeItem('tarepet_access_token');
    localStorage.removeItem('tarepet_refresh_token');
    sessionStorage.removeItem('tarepet_refresh_token');
  }
  layerbaseAuth.clearSessionTokens();
}

export function getAccessToken(): string | null {
  if (!_accessToken && typeof window !== 'undefined') {
    _accessToken = localStorage.getItem('tarepet_access_token') || sessionStorage.getItem('tarepet_access_token');
  }
  return _accessToken;
}

export function getRefreshToken(): string | null {
  if (!_refreshToken && typeof window !== 'undefined') {
    _refreshToken = localStorage.getItem('tarepet_refresh_token') || sessionStorage.getItem('tarepet_refresh_token');
  }
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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token reliably and dynamically ensure correct API host
authClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      const rToken = getRefreshToken();
      if (rToken && !rToken.startsWith('mock_')) {
        try {
          const res = await axios.post(`${getApiBaseUrl()}/auth/refresh/`, {
            refresh: rToken,
          });
          const { access, refresh } = res.data;
          if (access) {
            setTokens(access, refresh || rToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }
            return authClient(originalRequest);
          }
        } catch (refreshError) {
          // Token refresh failed - clear stale tokens to prevent repeated 401 loops
          clearTokens();
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
