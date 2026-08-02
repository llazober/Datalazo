import { Router, Request, Response } from 'express';
import { db } from '../db';
import { emails, drafts, conversationContext, auditLog } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { processVoiceCommand, generateReply, updateConversationContext } from '../services/ai.service';
import { requireAuth } from '../middleware/auth';
import type { ChatMessage } from '../db/schema';

const router = Router();
router.use(requireAuth);

// ── Process voice command ─────────────────────────────────
router.post('/command', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { transcript, currentEmailId } = req.body;

    if (!transcript?.trim()) return res.status(400).json({ error: 'transcript required' });

    // Get current context
    const [ctx] = await db.select().from(conversationContext)
      .where(eq(conversationContext.userId, userId)).limit(1);

    const emailId = currentEmailId || ctx?.currentEmailId;
    let emailContext: any = {};

    if (emailId) {
      const [email] = await db.select().from(emails)
        .where(and(eq(emails.id, emailId), eq(emails.userId, userId))).limit(1);
      if (email) {
        emailContext = {
          emailId: email.id,
          from: `${email.fromName} <${email.fromEmail}>`,
          subject: email.subject,
          summary: email.aiSummary,
          body: email.bodyText,
          toEmail: email.fromEmail,
        };
      }
    }

    const sessionHistory = (ctx?.sessionMessages as ChatMessage[]) || [];
    const result = await processVoiceCommand(transcript, emailContext, sessionHistory, userId);

    // Update context
    await updateConversationContext(userId, transcript, result.response, emailId || undefined);

    res.json(result);
  } catch (e: any) {
    console.error('[AI Command]', e);
    res.status(500).json({ error: e.message, response: 'I encountered an error. Please try again.' });
  }
});

// ── Generate reply draft ──────────────────────────────────
router.post('/generate-reply', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { emailId, instruction } = req.body;

    if (!emailId || !instruction) return res.status(400).json({ error: 'emailId and instruction required' });

    const [email] = await db.select().from(emails)
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId))).limit(1);
    if (!email) return res.status(404).json({ error: 'Email not found' });

    const draftBody = await generateReply(
      { from: email.fromName || email.fromEmail || '', subject: email.subject || '', body: email.bodyText || '' },
      instruction,
      userId
    );

    // Save draft
    const [draft] = await db.insert(drafts).values({
      userId,
      emailId: email.id,
      gmailMessageId: email.gmailMessageId,
      toEmail: email.fromEmail || '',
      subject: `Re: ${email.subject}`,
      body: draftBody,
      userInstruction: instruction,
      status: 'pending',
    }).returning();

    res.json({ draft, readAloud: draftBody });
  } catch (e: any) {
    console.error('[AI Reply]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── Update draft body ─────────────────────────────────────
router.patch('/drafts/:draftId', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { body } = req.body;
    const draftId = String(req.params.draftId);
    await db.update(drafts)
      .set({ body, updatedAt: new Date() })
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Discard draft ─────────────────────────────────────────
router.delete('/drafts/:draftId', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const draftId = String(req.params.draftId);
    await db.update(drafts)
      .set({ status: 'discarded' })
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Clear conversation context ────────────────────────────
router.delete('/context', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    await db.update(conversationContext)
      .set({ sessionMessages: [], currentEmailId: null as any, updatedAt: new Date() })
      .where(eq(conversationContext.userId, userId));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
