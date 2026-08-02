import 'dotenv/config';
import path from 'path';
// Load env from root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cron from 'node-cron';

import { db, initSchema, pool } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { setSocketServer } from './services/email.service';
import { syncInbox } from './services/email.service';
import { watchInbox } from './services/gmail.service';

import authRouter from './routes/auth';
import emailsRouter from './routes/emails';
import aiRouter from './routes/ai';
import calendarRouter from './routes/calendar';
import contactsRouter from './routes/contacts';
import automationRouter from './routes/automation';
import configRouter from './routes/config';
import webhooksRouter from './routes/webhooks';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.VITE_API_URL?.replace('3001', '3000') || 'http://localhost:3000';

// ── Socket.io ─────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
});

setSocketServer(io);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} connected`);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket] User ${userId} disconnected`);
  });
});

// ── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Session (PostgreSQL store) ────────────────────────────
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    schemaName: 'email_assistant',
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Passport ──────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/automation', automationRouter);
app.use('/api/config', configRouter);
app.use('/webhooks', webhooksRouter);

// ── Health check ──────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Cron: Refresh Gmail watches daily (they expire after 7 days) ──
cron.schedule('0 6 * * *', async () => {
  console.log('[Cron] Refreshing Gmail watches...');
  try {
    const allUsers = await db.select({ id: users.id, accessToken: users.accessToken }).from(users);
    for (const user of allUsers) {
      if (!user.accessToken) continue;
      try {
        const result = await watchInbox(user.id);
        await db.update(users).set({
          historyId: result.historyId,
          pubsubWatchExpiry: new Date(parseInt(result.expiration)),
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));
      } catch (e) {
        console.error(`[Cron] Watch refresh failed for ${user.id}:`, e);
      }
    }
  } catch (e) {
    console.error('[Cron] Watch refresh error:', e);
  }
});

// ── Cron: Fallback polling every 2 minutes if Pub/Sub not configured ──
cron.schedule('*/2 * * * *', async () => {
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) return; // Skip if Pub/Sub is active
  try {
    const allUsers = await db.select({ id: users.id, accessToken: users.accessToken }).from(users);
    for (const user of allUsers) {
      if (!user.accessToken) continue;
      await syncInbox(user.id, 10).catch(() => {});
    }
  } catch (e) {
    console.error('[Cron] Polling error:', e);
  }
});

// ── Start ─────────────────────────────────────────────────
async function start() {
  await initSchema();

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   AI Executive Email Assistant            ║
║   Server running on http://localhost:${PORT} ║
╚═══════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);
