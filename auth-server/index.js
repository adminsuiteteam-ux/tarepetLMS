import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

// ── CORS: allow requests from the Vite frontend and production domain ──────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://tarepetmontessorischool.com',
  'https://www.tarepetmontessorischool.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

// ── Better Auth handles ALL /api/auth/* routes ────────────────────────────────
// toNodeHandler converts Better Auth into a standard Node.js handler.
// ALL methods (GET, POST, etc.) must be forwarded — do NOT add bodyParser
// before this route, as Better Auth reads the raw stream itself.
app.all('/api/auth/*splat', toNodeHandler(auth));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tarepet-auth-server', ts: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Auth Server Error]', err);
  res.status(500).json({ error: 'Internal auth server error' });
});

app.listen(PORT, () => {
  console.log(`🔐 Tarepet Auth Server running on http://localhost:${PORT}`);
});
