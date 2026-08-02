import { create } from 'zustand';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface Draft {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  emailId: string;
}

interface VoiceStore {
  status: VoiceStatus;
  transcript: string;
  aiResponse: string;
  pendingDraft: Draft | null;
  pendingAction: { type: string; params?: any } | null;
  awaitingConfirmation: boolean;
  confirmationMessage: string;
  notifications: Array<{ id: string; text: string; type: 'info'|'success'|'warning'|'error' }>;
  setStatus: (status: VoiceStatus) => void;
  setTranscript: (t: string) => void;
  setAiResponse: (r: string) => void;
  setPendingDraft: (draft: Draft | null) => void;
  setPendingAction: (action: { type: string; params?: any } | null) => void;
  setAwaitingConfirmation: (v: boolean, msg?: string) => void;
  addNotification: (text: string, type?: 'info'|'success'|'warning'|'error') => void;
  removeNotification: (id: string) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  status: 'idle',
  transcript: '',
  aiResponse: '',
  pendingDraft: null,
  pendingAction: null,
  awaitingConfirmation: false,
  confirmationMessage: '',
  notifications: [],
  setStatus: (status) => set({ status }),
  setTranscript: (transcript) => set({ transcript }),
  setAiResponse: (aiResponse) => set({ aiResponse }),
  setPendingDraft: (pendingDraft) => set({ pendingDraft }),
  setPendingAction: (pendingAction) => set({ pendingAction }),
  setAwaitingConfirmation: (awaitingConfirmation, confirmationMessage = '') => set({ awaitingConfirmation, confirmationMessage }),
  addNotification: (text, type = 'info') => set((s) => ({
    notifications: [...s.notifications, { id: Date.now().toString(), text, type }].slice(-5),
  })),
  removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}));
