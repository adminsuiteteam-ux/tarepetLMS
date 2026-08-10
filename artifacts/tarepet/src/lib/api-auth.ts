import axios from 'axios';

// Enterprise API Client for Django JWT Authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tarepet-backend-4iw6.onrender.com/api/v1';

// ── In-memory token store ─────────────────────────────────────────────────────
// Tokens are NEVER written to localStorage or any browser storage.
// They live only in these module-level variables for the lifetime of the browser session.
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  _accessToken = access;
  _refreshToken = refresh;
}

export function clearTokens(): void {
  _accessToken = null;
  _refreshToken = null;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function getRefreshToken(): string | null {
  return _refreshToken;
}

/**
 * Redirect to a same-origin path only.
 * Throws if the target is not a relative path (starts with '/'), preventing
 * open redirect attacks from misconfigured environment variables.
 */
export function safeRedirect(target: string): void {
  // Strip any leading whitespace and ensure the path starts with '/'
  const safe = target.trimStart();
  if (!safe.startsWith('/')) {
    console.error('[Auth] Blocked unsafe redirect to:', target);
    window.location.href = '/sign-in';
    return;
  }
  window.location.href = safe;
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
          // Refresh token expired — clear memory and force re-login
          clearTokens();
          const baseUrl = import.meta.env.BASE_URL || '/';
          const target = baseUrl.endsWith('/') ? `${baseUrl}sign-in` : `${baseUrl}/sign-in`;
          safeRedirect(target);
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
