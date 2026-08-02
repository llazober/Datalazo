import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'profile',
  'email',
];

export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  });
}

export async function getAuthenticatedOAuth2Client(userId: string): Promise<OAuth2Client> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.accessToken) throw new Error('User not authenticated with Google');

  const auth = createOAuth2Client();
  auth.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken || undefined,
    expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
  });

  // Auto-refresh token if expired and save new token to DB
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await db.update(users)
        .set({
          accessToken: tokens.access_token,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  });

  return auth;
}

export async function getGmailClient(userId: string): Promise<gmail_v1.Gmail> {
  const auth = await getAuthenticatedOAuth2Client(userId);
  return google.gmail({ version: 'v1', auth });
}

export async function listMessages(
  userId: string,
  maxResults = 20,
  pageToken?: string,
  query?: string
): Promise<{ messages: gmail_v1.Schema$Message[]; nextPageToken?: string; resultSizeEstimate?: number }> {
  const gmail = await getGmailClient(userId);
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    pageToken,
    q: query || 'in:inbox -category:promotions',
    labelIds: ['INBOX'],
  });
  return {
    messages: res.data.messages || [],
    nextPageToken: res.data.nextPageToken || undefined,
    resultSizeEstimate: res.data.resultSizeEstimate || 0,
  };
}

export async function getMessage(userId: string, messageId: string): Promise<gmail_v1.Schema$Message> {
  const gmail = await getGmailClient(userId);
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return res.data;
}

export function parseEmailHeaders(message: gmail_v1.Schema$Message): Record<string, string> {
  const headers: Record<string, string> = {};
  const payload = message.payload;
  if (!payload?.headers) return headers;
  for (const h of payload.headers) {
    if (h.name && h.value) headers[h.name.toLowerCase()] = h.value;
  }
  return headers;
}

export function extractBody(message: gmail_v1.Schema$Message): { text: string; html: string } {
  const result = { text: '', html: '' };
  const payload = message.payload;
  if (!payload) return result;

  function decodeBase64(data: string): string {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  }

  function walkParts(parts: gmail_v1.Schema$MessagePart[]) {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        result.text += decodeBase64(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        result.html += decodeBase64(part.body.data);
      }
      if (part.parts) walkParts(part.parts);
    }
  }

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    result.text = decodeBase64(payload.body.data);
  } else if (payload.mimeType === 'text/html' && payload.body?.data) {
    result.html = decodeBase64(payload.body.data);
  } else if (payload.parts) {
    walkParts(payload.parts);
  }

  return result;
}

export function extractAttachments(message: gmail_v1.Schema$Message) {
  const attachments: Array<{ filename: string; mimeType: string; size: number; attachmentId: string }> = [];
  const payload = message.payload;
  if (!payload) return attachments;

  function walkParts(parts: gmail_v1.Schema$MessagePart[]) {
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        });
      }
      if (part.parts) walkParts(part.parts);
    }
  }

  if (payload.parts) walkParts(payload.parts);
  return attachments;
}

export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<string> {
  const gmail = await getGmailClient(userId);

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\n');

  const encoded = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encoded,
      threadId,
    },
  });
  return res.data.id!;
}

export async function archiveEmail(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['INBOX'] },
  });
}

export async function trashEmail(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.trash({ userId: 'me', id: messageId });
}

export async function markAsRead(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

export async function markAsUnread(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { addLabelIds: ['UNREAD'] },
  });
}

export async function starEmail(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { addLabelIds: ['STARRED'] },
  });
}

export async function forwardEmail(
  userId: string,
  messageId: string,
  forwardTo: string
): Promise<string> {
  const message = await getMessage(userId, messageId);
  const headers = parseEmailHeaders(message);
  const body = extractBody(message);

  const forwardBody = `---------- Forwarded message ----------\nFrom: ${headers['from']}\nDate: ${headers['date']}\nSubject: ${headers['subject']}\n\n${body.text}`;
  const fwdSubject = `Fwd: ${headers['subject'] || '(no subject)'}`;

  return sendEmail(userId, forwardTo, fwdSubject, forwardBody);
}

export async function getProfile(userId: string): Promise<{ email: string; messagesTotal: number }> {
  const gmail = await getGmailClient(userId);
  const res = await gmail.users.getProfile({ userId: 'me' });
  return {
    email: res.data.emailAddress || '',
    messagesTotal: res.data.messagesTotal || 0,
  };
}

export async function watchInbox(userId: string): Promise<{ historyId: string; expiration: string }> {
  const gmail = await getGmailClient(userId);
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const topicName = process.env.PUBSUB_TOPIC_NAME || 'gmail-push-notifications';

  if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');

  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      labelIds: ['INBOX'],
      topicName: `projects/${projectId}/topics/${topicName}`,
    },
  });

  return {
    historyId: res.data.historyId || '',
    expiration: res.data.expiration || '',
  };
}

export async function getHistory(
  userId: string,
  startHistoryId: string
): Promise<gmail_v1.Schema$History[]> {
  const gmail = await getGmailClient(userId);
  try {
    const res = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded'],
      labelId: 'INBOX',
    });
    return res.data.history || [];
  } catch {
    return [];
  }
}

export async function listSentMessages(userId: string, maxResults = 50): Promise<gmail_v1.Schema$Message[]> {
  const gmail = await getGmailClient(userId);
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds: ['SENT'],
  });
  return res.data.messages || [];
}
