import { db } from '../db';
import {
  emails, emailThreads, users, contacts, automationRules, auditLog,
  type EmailCategory, type EmailPriority,
} from '../db/schema';
import {
  listMessages, getMessage, parseEmailHeaders, extractBody, extractAttachments,
  archiveEmail as gmailArchive, trashEmail as gmailTrash, getHistory,
} from './gmail.service';
import { analyzeEmail } from './ai.service';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer) {
  io = server;
}

// ── Sync inbox ────────────────────────────────────────────
export async function syncInbox(userId: string, maxResults = 30): Promise<number> {
  const msgs = await listMessages(userId, maxResults);
  let newCount = 0;

  for (const msg of msgs.messages) {
    if (!msg.id) continue;

    // Skip if already in DB
    const existing = await db.select({ id: emails.id })
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.gmailMessageId, msg.id)))
      .limit(1);

    if (existing.length > 0) continue;

    try {
      const full = await getMessage(userId, msg.id);
      await processAndStoreEmail(userId, full);
      newCount++;
    } catch (e) {
      console.error(`[Sync] Failed to process message ${msg.id}:`, e);
    }
  }

  return newCount;
}

// ── Process a single Gmail message ───────────────────────
export async function processAndStoreEmail(userId: string, gmailMessage: any): Promise<string | null> {
  if (!gmailMessage.id) return null;

  const headers = parseEmailHeaders(gmailMessage);
  const body = extractBody(gmailMessage);
  const attachments = extractAttachments(gmailMessage);

  const fromRaw = headers['from'] || '';
  const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/) || ['', fromRaw, fromRaw];
  const fromName = fromMatch[1].replace(/"/g, '').trim() || fromMatch[2];
  const fromEmail = fromMatch[2] || fromRaw;

  const subject = headers['subject'] || '(no subject)';
  const receivedAt = new Date(parseInt(gmailMessage.internalDate || Date.now().toString()));

  // Ensure thread record
  let threadDbId: string | undefined;
  if (gmailMessage.threadId) {
    const existingThread = await db.select().from(emailThreads)
      .where(and(eq(emailThreads.userId, userId), eq(emailThreads.gmailThreadId, gmailMessage.threadId)))
      .limit(1);

    if (existingThread.length > 0) {
      threadDbId = existingThread[0].id;
      await db.update(emailThreads)
        .set({ messageCount: existingThread[0].messageCount! + 1, lastMessageAt: receivedAt })
        .where(eq(emailThreads.id, threadDbId));
    } else {
      const [newThread] = await db.insert(emailThreads).values({
        userId, gmailThreadId: gmailMessage.threadId, subject, lastMessageAt: receivedAt,
      }).returning({ id: emailThreads.id });
      threadDbId = newThread.id;
    }
  }

  const labels: string[] = gmailMessage.labelIds || [];
  const isRead = !labels.includes('UNREAD');

  // AI analysis
  let analysis;
  try {
    analysis = await analyzeEmail(fromName || fromEmail, subject, body.text || body.html, userId);
  } catch {
    analysis = {
      category: 'Unknown' as EmailCategory,
      priority: 'Medium' as EmailPriority,
      summary: `New email from ${fromName || fromEmail} about "${subject}".`,
      hasMeetingRequest: false,
      suggestedActions: ['Reply', 'Archive'],
    };
  }

  const [inserted] = await db.insert(emails).values({
    userId,
    gmailMessageId: gmailMessage.id,
    threadId: threadDbId,
    gmailThreadId: gmailMessage.threadId,
    fromEmail,
    fromName,
    toEmail: headers['to'],
    ccEmail: headers['cc'],
    subject,
    snippet: gmailMessage.snippet,
    bodyText: body.text.substring(0, 50000),
    bodyHtml: body.html.substring(0, 50000),
    labels,
    attachments,
    isRead,
    isStarred: labels.includes('STARRED'),
    isArchived: !labels.includes('INBOX'),
    isTrashed: labels.includes('TRASH'),
    aiSummary: analysis.summary,
    aiCategory: analysis.category,
    aiPriority: analysis.priority,
    aiProcessed: true,
    hasMeetingRequest: analysis.hasMeetingRequest,
    meetingDetails: analysis.meetingDetails,
    receivedAt,
  }).onConflictDoNothing().returning({ id: emails.id });

  if (!inserted) return null;

  // Update/create contact record
  await upsertContact(userId, fromEmail, fromName);

  // Check automation rules
  await applyAutomationRules(userId, inserted.id, { fromEmail, subject, category: analysis.category });

  // Emit socket event for real-time UI update
  if (io) {
    const emailData = { ...inserted, analysis, fromName, fromEmail, subject, receivedAt };
    io.to(`user:${userId}`).emit('new_email', emailData);

    // Announce via voice if high/critical priority
    if (analysis.priority === 'Critical' || analysis.priority === 'High') {
      io.to(`user:${userId}`).emit('voice_announce', { text: analysis.summary });
    }
  }

  return inserted.id;
}

// ── Upsert contact ────────────────────────────────────────
async function upsertContact(userId: string, email: string, name?: string): Promise<void> {
  const existing = await db.select().from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.email, email))).limit(1);

  if (existing.length > 0) {
    await db.update(contacts).set({
      emailCount: (existing[0].emailCount || 0) + 1,
      lastContactAt: new Date(),
      name: name || existing[0].name,
      updatedAt: new Date(),
    }).where(eq(contacts.id, existing[0].id));
  } else {
    await db.insert(contacts).values({ userId, email, name, emailCount: 1, lastContactAt: new Date() }).onConflictDoNothing();
  }
}

// ── Automation rules engine ───────────────────────────────
async function applyAutomationRules(
  userId: string,
  emailId: string,
  context: { fromEmail: string; subject: string; category: string }
): Promise<void> {
  const rules = await db.select().from(automationRules)
    .where(and(eq(automationRules.userId, userId), eq(automationRules.isActive, true)));

  for (const rule of rules) {
    let matches = false;
    const val = rule.triggerValue.toLowerCase();

    switch (rule.triggerType) {
      case 'sender': matches = context.fromEmail.toLowerCase().includes(val); break;
      case 'subject_contains': matches = context.subject.toLowerCase().includes(val); break;
      case 'category': matches = context.category.toLowerCase() === val; break;
    }

    if (!matches) continue;

    const [email] = await db.select().from(emails).where(eq(emails.id, emailId)).limit(1);
    if (!email) continue;

    try {
      switch (rule.action) {
        case 'archive':
          await gmailArchive(userId, email.gmailMessageId);
          await db.update(emails).set({ isArchived: true }).where(eq(emails.id, emailId));
          break;
        case 'delete':
          await gmailTrash(userId, email.gmailMessageId);
          await db.update(emails).set({ isTrashed: true }).where(eq(emails.id, emailId));
          break;
      }

      await db.update(automationRules)
        .set({ executionCount: (rule.executionCount || 0) + 1 })
        .where(eq(automationRules.id, rule.id));

      await db.insert(auditLog).values({
        userId, action: `automation:${rule.action}`, emailId,
        gmailMessageId: email.gmailMessageId,
        details: { ruleId: rule.id, ruleName: rule.name },
        confirmedBy: 'automation',
      });
    } catch (e) {
      console.error(`[Automation] Rule ${rule.name} failed:`, e);
    }
  }
}

// ── Handle Pub/Sub push for new messages ──────────────────
export async function handleGmailPush(
  userId: string,
  historyId: string
): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.historyId) return;

  const history = await getHistory(userId, user.historyId);

  for (const entry of history) {
    const added = (entry as any).messagesAdded || [];
    for (const { message } of added) {
      if (!message?.id) continue;
      try {
        const full = await getMessage(userId, message.id);
        await processAndStoreEmail(userId, full);
      } catch (e) {
        console.error(`[PubSub] Error processing ${message.id}:`, e);
      }
    }
  }

  // Update historyId
  await db.update(users).set({ historyId, updatedAt: new Date() }).where(eq(users.id, userId));
}
