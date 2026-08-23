// ─── Password Security Policy Utility ─────────────────────────────────────────
// Enforces minimum length, complexity, and prevents trivial passwords
// ─────────────────────────────────────────────────────────────────────────────

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
  strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

const FORBIDDEN_PASSWORDS = [
  'admin',
  'admin123',
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty',
  'tarepet',
  'tarepet123',
  'admin@123',
  'adminpass',
];

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const trimmed = (password || '').trim();

  if (trimmed.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(trimmed)) {
    errors.push('Must contain at least one uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(trimmed)) {
    errors.push('Must contain at least one lowercase letter (a-z)');
  }

  if (!/[0-9]/.test(trimmed)) {
    errors.push('Must contain at least one number (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmed)) {
    errors.push('Must contain at least one special character (!@#$%^&*)');
  }

  if (FORBIDDEN_PASSWORDS.includes(trimmed.toLowerCase())) {
    errors.push('Password is too common or easily guessable');
  }

  // Calculate strength score
  let score = 0;
  if (trimmed.length >= 8) score++;
  if (/[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)) score++;
  if (/[0-9]/.test(trimmed)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmed) && trimmed.length >= 10) score++;

  let strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score === 2) strengthLabel = 'Fair';
  else if (score === 3) strengthLabel = 'Good';
  else if (score >= 4) strengthLabel = 'Strong';

  return {
    isValid: errors.length === 0,
    score,
    errors,
    strengthLabel,
  };
}

// ─── Brute-Force Rate Limiting Helper ─────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitState {
  attempts: number;
  lockoutUntil: number | null;
}

export function checkLoginRateLimit(): { isLocked: boolean; remainingSeconds: number } {
  if (typeof window === 'undefined') return { isLocked: false, remainingSeconds: 0 };
  try {
    const raw = localStorage.getItem('tarepet_auth_ratelimit');
    if (!raw) return { isLocked: false, remainingSeconds: 0 };
    const state: RateLimitState = JSON.parse(raw);
    if (state.lockoutUntil && state.lockoutUntil > Date.now()) {
      const remainingSeconds = Math.ceil((state.lockoutUntil - Date.now()) / 1000);
      return { isLocked: true, remainingSeconds };
    }
  } catch {}
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedLoginAttempt(): { isLocked: boolean; remainingSeconds: number } {
  if (typeof window === 'undefined') return { isLocked: false, remainingSeconds: 0 };
  try {
    const raw = localStorage.getItem('tarepet_auth_ratelimit');
    let state: RateLimitState = { attempts: 0, lockoutUntil: null };
    if (raw) {
      state = JSON.parse(raw);
    }

    state.attempts += 1;
    if (state.attempts >= MAX_FAILED_ATTEMPTS) {
      state.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    localStorage.setItem('tarepet_auth_ratelimit', JSON.stringify(state));

    if (state.lockoutUntil && state.lockoutUntil > Date.now()) {
      const remainingSeconds = Math.ceil((state.lockoutUntil - Date.now()) / 1000);
      return { isLocked: true, remainingSeconds };
    }
  } catch {}
  return { isLocked: false, remainingSeconds: 0 };
}

export function resetLoginRateLimit(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('tarepet_auth_ratelimit');
  } catch {}
}
