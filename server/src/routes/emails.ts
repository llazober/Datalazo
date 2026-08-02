import { Router, Request, Response } from 'express';
import { db } from '../db';
import { emails, drafts, contacts, auditLog } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  getMessage, sendEmail, archiveEmail, trashEmail, markAsRead,
  markAsUnread, starEmail, forwardEmail,
} from '../services/gmail.service';
import { requireAuth } from '../middleware/auth';
import { syncInbox } from '../services/email.service';

const router = Router();
router.use(requireAuth);

// ── List emails ───────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;
    const priority = req.query.priority as string;
    const showArchived = req.query.archived === 'true';
    const showTrashed = req.query.trashed === 'true';

    const conditions = [
      eq(emails.userId, userId),
      eq(emails.isArchived, showArchived),
      eq(emails.isTrashed, showTrashed),
    ];
    if (category) conditions.push(eq(emails.aiCategory, category as any));
    if (priority) conditions.push(eq(emails.aiPriority, priority as any));

    const result = await db.select().from(emails)
      .where(and(...conditions))
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

    res.json({ emails: result, page, limit });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Sync inbox ────────────────────────────────────────────
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const count = await syncInbox(userId, 30);
    res.json({ synced: count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get single email ──────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const emailId = String(req.params.id);
    const [email] = await db.select().from(emails)
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId))).limit(1);

    if (!email) return res.status(404).json({ error: 'Email not found' });

    // Mark as read in Gmail too
    if (!email.isRead) {
      await markAsRead(userId, email.gmailMessageId).catch(() => {});
      await db.update(emails).set({ isRead: true }).where(eq(emails.id, email.id));
    }

    res.json(email);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Search emails ─────────────────────────────────────────
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const q = req.query.q as string;
    if (!q) return res.json({ emails: [] });

    const likeQ = `%${q.toLowerCase()}%`;
    const result = await db.execute(
      sql`SELECT * FROM email_assistant.emails
          WHERE user_id = ${userId}
            AND (
              LOWER(subject) LIKE ${likeQ}
              OR LOWER(from_name) LIKE ${likeQ}
              OR LOWER(from_email) LIKE ${likeQ}
              OR LOWER(body_text) LIKE ${likeQ}
              OR LOWER(ai_summary) LIKE ${likeQ}
            )
          ORDER BY received_at DESC
          LIMIT 20`
    );

    res.json({ emails: result.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Email actions (archive, delete, flag, etc.) ───────────
router.patch('/:id/action', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const emailId = String(req.params.id);
    const { action } = req.body;
    const [email] = await db.select().from(emails)
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId))).limit(1);
    if (!email) return res.status(404).json({ error: 'Email not found' });

    switch (action) {
      case 'archive':
        await archiveEmail(userId, email.gmailMessageId);
        await db.update(emails).set({ isArchived: true }).where(eq(emails.id, email.id));
        break;
      case 'delete':
        await trashEmail(userId, email.gmailMessageId);
        await db.update(emails).set({ isTrashed: true }).where(eq(emails.id, email.id));
        break;
      case 'mark_unread':
        await markAsUnread(userId, email.gmailMessageId);
        await db.update(emails).set({ isRead: false }).where(eq(emails.id, email.id));
        break;
      case 'mark_read':
        await markAsRead(userId, email.gmailMessageId);
        await db.update(emails).set({ isRead: true }).where(eq(emails.id, email.id));
        break;
      case 'star':
        await starEmail(userId, email.gmailMessageId);
        await db.update(emails).set({ isStarred: true }).where(eq(emails.id, email.id));
        break;
    }

    await db.insert(auditLog).values({
      userId, action, emailId: email.id, gmailMessageId: email.gmailMessageId,
      confirmedBy: req.body.confirmedBy || 'click',
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Forward email ─────────────────────────────────────────
router.post('/:id/forward', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const emailId = String(req.params.id);
    const { to } = req.body;
    const [email] = await db.select().from(emails)
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId))).limit(1);
    if (!email) return res.status(404).json({ error: 'Email not found' });

    const sentId = await forwardEmail(userId, email.gmailMessageId, to);

    await db.insert(auditLog).values({
      userId, action: 'forward', emailId: email.id, gmailMessageId: email.gmailMessageId,
      details: { forwardedTo: to, sentMessageId: sentId }, confirmedBy: 'voice',
    });

    res.json({ success: true, sentMessageId: sentId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Send draft ────────────────────────────────────────────
router.post('/:id/send-draft', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { draftId } = req.body;

    const [draft] = await db.select().from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId))).limit(1);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const emailId2 = String(req.params.id);
    const [email] = await db.select().from(emails)
      .where(eq(emails.id, emailId2)).limit(1);

    const sentId = await sendEmail(
      userId,
      draft.toEmail,
      draft.subject || `Re: ${email?.subject || ''}`,
      draft.body,
      email?.gmailThreadId || undefined
    );

    await db.update(drafts).set({ status: 'sent', sentAt: new Date() }).where(eq(drafts.id, draftId));

    await db.insert(auditLog).values({
      userId, action: 'send', emailId: email?.id, gmailMessageId: email?.gmailMessageId,
      details: { sentMessageId: sentId, draftId }, confirmedBy: 'voice',
    });

    res.json({ success: true, sentMessageId: sentId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
