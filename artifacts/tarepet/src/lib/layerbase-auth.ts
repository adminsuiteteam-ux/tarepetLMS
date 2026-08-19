import axios from 'axios';

// Enterprise Layerbase Authentication Client Configuration
const LAYERBASE_API_URL =
  import.meta.env.VITE_LAYERBASE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://tarepet-backend-4iw6.onrender.com/api/v1';

export interface LayerbaseUser {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  mfa_enabled?: boolean;
  profile?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  access?: string;
  refresh?: string;
  user?: LayerbaseUser;
  mfaRequired?: boolean;
  mfaToken?: string;
  message?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0 (weak) to 4 (strong)
}

/**
 * Validate password strength against OWASP & SecureCoder security requirements:
 * - Minimum 8 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Digit
 * - Special character
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9).');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

export class LayerbaseAuthClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = LAYERBASE_API_URL) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('tarepet_access_token') || sessionStorage.getItem('tarepet_access_token');
      this.refreshToken = localStorage.getItem('tarepet_refresh_token') || sessionStorage.getItem('tarepet_refresh_token');
    }
  }

  /**
   * Set active tokens in memory & persistent cache
   */
  public setSessionTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
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
  }

  /**
   * Clear active session tokens
   */
  public clearSessionTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tarepet_access_token');
      sessionStorage.removeItem('tarepet_access_token');
      localStorage.removeItem('tarepet_refresh_token');
      sessionStorage.removeItem('tarepet_refresh_token');
    }
  }

  public getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('tarepet_access_token') || sessionStorage.getItem('tarepet_access_token');
    }
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('tarepet_refresh_token') || sessionStorage.getItem('tarepet_refresh_token');
    }
    return this.refreshToken;
  }

  /**
   * Authenticate user credentials with Layerbase Auth service
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/login/`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );

      const data = response.data;
      if (data.mfa_required || data.mfaRequired) {
        return {
          success: true,
          mfaRequired: true,
          mfaToken: data.mfa_token || data.mfaToken,
          message: 'Multi-Factor Authentication code required.',
        };
      }

      if (data.access && data.user) {
        const normalizedRole = (data.user.role || 'STUDENT').toUpperCase() as LayerbaseUser['role'];
        const user: LayerbaseUser = { ...data.user, role: normalizedRole };
        this.setSessionTokens(data.access, data.refresh || '');
        return {
          success: true,
          access: data.access,
          refresh: data.refresh,
          user,
        };
      }

      return {
        success: false,
        message: data.detail || data.message || 'Authentication failed.',
      };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message;
      return {
        success: false,
        message: msg || 'Authentication server unreachable.',
      };
    }
  }

  /**
   * Verify MFA TOTP 6-digit code for step-up authentication
   */
  public async verifyMFA(mfaToken: string, code: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/mfa/verify/`,
        { mfa_token: mfaToken, code: code.trim() },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );

      const data = response.data;
      if (data.access && data.user) {
        const normalizedRole = (data.user.role || 'STUDENT').toUpperCase() as LayerbaseUser['role'];
        const user: LayerbaseUser = { ...data.user, role: normalizedRole };
        this.setSessionTokens(data.access, data.refresh || '');
        return {
          success: true,
          access: data.access,
          refresh: data.refresh,
          user,
        };
      }

      return {
        success: false,
        message: data.detail || 'Invalid MFA verification code.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.detail || 'MFA verification failed. Please try again.',
      };
    }
  }

  /**
   * Rotate access token using in-memory refresh token
   */
  public async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh/`, {
        refresh: this.refreshToken,
      });
      if (response.data?.access) {
        this.accessToken = response.data.access;
        if (response.data.refresh) {
          this.refreshToken = response.data.refresh;
        }
        return true;
      }
      this.clearSessionTokens();
      return false;
    } catch {
      this.clearSessionTokens();
      return false;
    }
  }

  /**
   * Invalidate Layerbase session
   */
  public async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await axios.post(`${this.baseURL}/auth/logout/`, { refresh: this.refreshToken });
      } catch {
        // Silently ignore network failures on logout
      }
    }
    this.clearSessionTokens();
  }
}

// Singleton Layerbase Authentication Instance
export const layerbaseAuth = new LayerbaseAuthClient();
