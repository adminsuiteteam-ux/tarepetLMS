import { betterAuth } from 'better-auth';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// ── PostgreSQL pool connected to your Layerbase database ─────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Layerbase cloud PostgreSQL
  max: 10,
});

// ── Better Auth configuration ─────────────────────────────────────────────────
export const auth = betterAuth({
  // Base URL of THIS auth server
  baseURL: process.env.AUTH_SERVER_URL || 'http://localhost:3001',

  // Trusted origins that can make cross-origin auth requests
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://tarepetmontessorischool.com',
    'https://www.tarepetmontessorischool.com',
    process.env.FRONTEND_URL,
  ].filter(Boolean),

  // ── Database adapter: Pass the pg Pool directly (v1.6 built-in adapter) ──
  database: pool,

  // ── Email & password authentication ─────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  // ── Session settings ─────────────────────────────────────────────────────
  session: {
    expiresIn: 60 * 60 * 24 * 7,      // 7 days
    updateAge: 60 * 60 * 24,           // refresh window: 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                  // client-side cache: 5 min
    },
  },

  // ── Extra fields on the User table ──────────────────────────────────────
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'student',
        input: false,  // Never allow self-assignment of role
      },
      staffId: {
        type: 'string',
        required: false,
        input: false,
      },
      formClass: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },

  // ── Secret for session signing ────────────────────────────────────────
  secret: process.env.BETTER_AUTH_SECRET || process.env.SECRET_KEY,
});
