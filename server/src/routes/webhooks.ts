import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { watchInbox } from '../services/gmail.service';
import { handleGmailPush } from '../services/email.service';

// This route handles Google Pub/Sub push notifications
// NOTE: This must be publicly accessible (ngrok/tunnel in dev)
const router = Router();

// ── Gmail push webhook (no auth — verified by Pub/Sub token) ──
router.post('/gmail-push', async (req: Request, res: Response) => {
  try {
    const message = req.body?.message;
    if (!message?.data) return res.sendStatus(204);

    // Decode Pub/Sub message
    const decoded = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decoded);
    const emailAddress = notification.emailAddress;
    const historyId = notification.historyId?.toString();

    if (!emailAddress || !historyId) return res.sendStatus(204);

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, emailAddress)).limit(1);
    if (!user) return res.sendStatus(204);

    // Process new messages since last historyId
    await handleGmailPush(user.id, historyId);

    res.sendStatus(204);
  } catch (e) {
    console.error('[PubSub webhook]', e);
    res.sendStatus(204); // Always return 204 to avoid Pub/Sub retries
  }
});

// ── Setup Gmail watch for a user ──────────────────────────
router.post('/setup-watch', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const result = await watchInbox(userId);

    await db.update(users).set({
      historyId: result.historyId,
      pubsubWatchExpiry: new Date(parseInt(result.expiration)),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
