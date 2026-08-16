import { createAuthClient } from 'better-auth/react';

/**
 * Tarepet Better Auth Client
 *
 * All auth requests are sent to the Better Auth microservice.
 * - Development:  http://localhost:3001
 * - Production:   Set VITE_AUTH_URL in your deployment environment
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:3001',
});

// Named convenience exports used throughout the app
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// ── Type helpers ────────────────────────────────────────────────────────────
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
