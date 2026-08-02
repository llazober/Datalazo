import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEmailStore } from '../store/emailStore';
import { useVoiceStore } from '../store/voiceStore';
import type { Email } from '../store/emailStore';

let socket: Socket | null = null;

export function useEmailSocket(userId?: string) {
  const { addEmail, updateEmail } = useEmailStore();
  const { addNotification } = useVoiceStore();

  useEffect(() => {
    if (!userId) return;

    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      withCredentials: true,
      auth: { userId },
    });

    socket.on('connect', () => console.log('[Socket] Connected'));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));

    socket.on('new_email', (email: Email) => {
      addEmail(email);
      addNotification(
        email.aiSummary || `New email from ${email.fromName}`,
        email.aiPriority === 'Critical' ? 'error' : email.aiPriority === 'High' ? 'warning' : 'info'
      );
    });

    socket.on('email_updated', ({ id, updates }: { id: string; updates: Partial<Email> }) => {
      updateEmail(id, updates);
    });

    socket.on('voice_announce', ({ text }: { text: string }) => {
      // Will be picked up by useVoice hook for TTS
      const event = new CustomEvent('voice_announce', { detail: { text } });
      window.dispatchEvent(event);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [userId]);
}
