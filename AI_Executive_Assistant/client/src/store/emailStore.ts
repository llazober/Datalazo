import { create } from 'zustand';

export type EmailCategory = 'Customer'|'Vendor'|'Accounting'|'Banking'|'Personal'|'Internal'|'Marketing'|'Newsletter'|'Spam'|'Unknown';
export type EmailPriority = 'Critical'|'High'|'Medium'|'Low';

export interface Email {
  id: string;
  gmailMessageId: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  labels: string[];
  attachments: any[];
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  aiSummary: string;
  aiCategory: EmailCategory;
  aiPriority: EmailPriority;
  hasMeetingRequest: boolean;
  meetingDetails?: any;
  receivedAt: string;
}

interface EmailStore {
  emails: Email[];
  selectedEmail: Email | null;
  isLoading: boolean;
  isSyncing: boolean;
  filter: { category?: string; priority?: string };
  page: number;
  setEmails: (emails: Email[]) => void;
  addEmail: (email: Email) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  setSelectedEmail: (email: Email | null) => void;
  setLoading: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setFilter: (filter: { category?: string; priority?: string }) => void;
  setPage: (page: number) => void;
  removeEmail: (id: string) => void;
}

export const useEmailStore = create<EmailStore>((set) => ({
  emails: [],
  selectedEmail: null,
  isLoading: false,
  isSyncing: false,
  filter: {},
  page: 1,
  setEmails: (emails) => set({ emails }),
  addEmail: (email) => set((s) => ({ emails: [email, ...s.emails] })),
  updateEmail: (id, updates) => set((s) => ({
    emails: s.emails.map(e => e.id === id ? { ...e, ...updates } : e),
    selectedEmail: s.selectedEmail?.id === id ? { ...s.selectedEmail, ...updates } : s.selectedEmail,
  })),
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  setLoading: (v) => set({ isLoading: v }),
  setSyncing: (v) => set({ isSyncing: v }),
  setFilter: (filter) => set({ filter, page: 1 }),
  setPage: (page) => set({ page }),
  removeEmail: (id) => set((s) => ({
    emails: s.emails.filter(e => e.id !== id),
    selectedEmail: s.selectedEmail?.id === id ? null : s.selectedEmail,
  })),
}));
