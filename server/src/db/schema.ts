import {
  pgSchema,
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  index,
} from 'drizzle-orm/pg-core';

// ── Schema namespace ──────────────────────────────────────
export const emailAssistantSchema = pgSchema('email_assistant');

// ── Users ─────────────────────────────────────────────────
export const users = emailAssistantSchema.table('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: varchar('google_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  picture: text('picture'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  historyId: varchar('history_id', { length: 50 }),      // Gmail history ID for push notifications
  pubsubWatchExpiry: timestamp('pubsub_watch_expiry'),
  styleProfile: jsonb('style_profile'),                  // Learned writing style
  preferences: jsonb('preferences').$type<UserPreferences>().default({
    defaultSignature: '',
    defaultGreeting: 'Hi',
    defaultClosing: 'Best regards',
    voiceSpeed: 1.0,
    voiceName: '',
    language: 'en-US',
    alwaysOnListening: true,
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── API Config (editable from settings page) ──────────────
export const apiConfig = emailAssistantSchema.table('api_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),        // e.g., 'openai_api_key'
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Email Threads ─────────────────────────────────────────
export const emailThreads = emailAssistantSchema.table('email_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gmailThreadId: varchar('gmail_thread_id', { length: 255 }).notNull(),
  subject: text('subject').default('(no subject)'),
  messageCount: integer('message_count').default(1),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_threads_user').on(t.userId),
  index('idx_threads_gmail').on(t.gmailThreadId),
]);

// ── Emails ────────────────────────────────────────────────
export const emails = emailAssistantSchema.table('emails', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gmailMessageId: varchar('gmail_message_id', { length: 255 }).unique().notNull(),
  threadId: uuid('thread_id').references(() => emailThreads.id),
  gmailThreadId: varchar('gmail_thread_id', { length: 255 }),
  fromEmail: varchar('from_email', { length: 255 }),
  fromName: varchar('from_name', { length: 255 }),
  toEmail: text('to_email'),
  ccEmail: text('cc_email'),
  subject: text('subject').default('(no subject)'),
  snippet: text('snippet'),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  labels: jsonb('labels').$type<string[]>().default([]),
  attachments: jsonb('attachments').$type<EmailAttachment[]>().default([]),
  isRead: boolean('is_read').default(false),
  isStarred: boolean('is_starred').default(false),
  isArchived: boolean('is_archived').default(false),
  isTrashed: boolean('is_trashed').default(false),
  // AI-generated fields
  aiSummary: text('ai_summary'),
  aiCategory: varchar('ai_category', { length: 50 }).$type<EmailCategory>(),
  aiPriority: varchar('ai_priority', { length: 20 }).$type<EmailPriority>(),
  aiProcessed: boolean('ai_processed').default(false),
  hasMeetingRequest: boolean('has_meeting_request').default(false),
  meetingDetails: jsonb('meeting_details').$type<MeetingDetails>(),
  receivedAt: timestamp('received_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_emails_user').on(t.userId),
  index('idx_emails_received').on(t.receivedAt),
  index('idx_emails_category').on(t.aiCategory),
  index('idx_emails_priority').on(t.aiPriority),
]);

// ── Contacts ──────────────────────────────────────────────
export const contacts = emailAssistantSchema.table('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  company: varchar('company', { length: 255 }),
  preferredGreeting: varchar('preferred_greeting', { length: 100 }).default('Hi'),
  preferredClosing: varchar('preferred_closing', { length: 100 }).default('Best regards'),
  communicationStyle: varchar('communication_style', { length: 50 }).default('professional'),
  typicalResponseLength: varchar('typical_response_length', { length: 20 }).default('medium'),
  notes: text('notes'),
  emailCount: integer('email_count').default(0),
  lastContactAt: timestamp('last_contact_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('idx_contacts_user_email').on(t.userId, t.email),
]);

// ── Drafts ────────────────────────────────────────────────
export const drafts = emailAssistantSchema.table('drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  emailId: uuid('email_id').references(() => emails.id),
  gmailMessageId: varchar('gmail_message_id', { length: 255 }),
  toEmail: text('to_email').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  userInstruction: text('user_instruction'),
  status: varchar('status', { length: 20 }).default('pending').$type<'pending' | 'approved' | 'sent' | 'discarded'>(),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Automation Rules ──────────────────────────────────────
export const automationRules = emailAssistantSchema.table('automation_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(), // 'sender', 'subject_contains', 'category', 'label'
  triggerValue: text('trigger_value').notNull(),
  action: varchar('action', { length: 50 }).notNull(),           // 'archive', 'delete', 'reply', 'forward', 'label'
  actionValue: text('action_value'),                              // reply template, forward address, label name
  requiresConfirmation: boolean('requires_confirmation').default(false),
  executionCount: integer('execution_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Style Memory ──────────────────────────────────────────
export const styleMemory = emailAssistantSchema.table('style_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sampleType: varchar('sample_type', { length: 50 }).notNull(), // 'sent_email', 'user_instruction', 'correction'
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Conversation Context ──────────────────────────────────
export const conversationContext = emailAssistantSchema.table('conversation_context', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  currentEmailId: uuid('current_email_id').references(() => emails.id),
  sessionMessages: jsonb('session_messages').$type<ChatMessage[]>().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Audit Log ─────────────────────────────────────────────
export const auditLog = emailAssistantSchema.table('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),          // 'send', 'delete', 'archive', 'reply', etc.
  emailId: uuid('email_id').references(() => emails.id),
  gmailMessageId: varchar('gmail_message_id', { length: 255 }),
  details: jsonb('details'),
  confirmedBy: varchar('confirmed_by', { length: 50 }),          // 'voice', 'click', 'automation'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Calendar Events (cache) ───────────────────────────────
export const calendarEvents = emailAssistantSchema.table('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  googleEventId: varchar('google_event_id', { length: 255 }).unique(),
  title: text('title'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  attendees: jsonb('attendees').$type<string[]>().default([]),
  location: text('location'),
  meetLink: text('meet_link'),
  relatedEmailId: uuid('related_email_id').references(() => emails.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── TypeScript Types ──────────────────────────────────────
export type EmailCategory =
  | 'Customer' | 'Vendor' | 'Accounting' | 'Banking'
  | 'Personal' | 'Internal' | 'Marketing' | 'Newsletter'
  | 'Spam' | 'Unknown';

export type EmailPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface UserPreferences {
  defaultSignature: string;
  defaultGreeting: string;
  defaultClosing: string;
  voiceSpeed: number;
  voiceName: string;
  language: string;
  alwaysOnListening: boolean;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface MeetingDetails {
  proposedTime?: string;
  duration?: number;
  location?: string;
  attendees?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
