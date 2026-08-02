import { useEffect, useRef, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useVoiceStore } from '../store/voiceStore';
import { useEmailStore } from '../store/emailStore';
import { api } from '../lib/api';

const CONFIRMATION_WORDS = ['send', 'yes', 'go ahead', 'approve', 'confirmed', 'confirm'];
const CANCEL_WORDS = ['cancel', 'no', 'stop', 'discard', 'abort'];

export function useVoice(userId?: string) {
  const {
    setStatus, setTranscript, setAiResponse, setPendingDraft, setPendingAction,
    awaitingConfirmation, setAwaitingConfirmation, pendingDraft, pendingAction,
    addNotification,
  } = useVoiceStore();

  const { selectedEmail, updateEmail, removeEmail } = useEmailStore();
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // ── Speak text aloud ──────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    setStatus('speaking');
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1.0;

    const isEs = /[áéíóúñ¿¡ÁÉÍÓÚÑ]/.test(text) || /\b(el|la|los|las|un|una|unos|unas|del|que|por|para|con|sin|como|pero|más|mas|este|esta|esto|estos|estas|ese|esa|eso|aqui|aquí|sobre|entre|después|despues|cuando|también|tambien|hola|gracias|saludos|atentamente|estimado|estimada|asunto|mensaje|correo|buenos|buenas|favor|usted|ustedes)\b/i.test(text);
    utter.lang = isEs ? 'es-ES' : 'en-US';

    // Try to pick a natural voice
    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = isEs ? 'es' : 'en';
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.toLowerCase().startsWith(targetPrefix)) ||
                      voices.find(v => v.name.includes('Microsoft') && v.lang.toLowerCase().startsWith(targetPrefix)) ||
                      voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
    if (preferred) utter.voice = preferred;

    utter.onend = () => {
      setStatus('listening');
      onEnd?.();
    };
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [setStatus]);

  // ── Stop speaking ─────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus('listening');
  }, [setStatus]);

  // ── Process transcript after silence ─────────────────
  const processTranscript = useCallback(async (text: string) => {
    if (processingRef.current || !text.trim()) return;
    processingRef.current = true;

    resetTranscript();
    setTranscript(text);
    setStatus('processing');

    const lower = text.toLowerCase().trim();

    // Check if awaiting confirmation for send/action
    if (awaitingConfirmation && pendingDraft) {
      if (CONFIRMATION_WORDS.some(w => lower.includes(w))) {
        speak('Sending now.');
        try {
          await api.post(`/api/emails/${pendingDraft.emailId}/send-draft`, { draftId: pendingDraft.id });
          updateEmail(pendingDraft.emailId, { isRead: true });
          addNotification('Email sent successfully', 'success');
          setAiResponse('Email sent.');
          setPendingDraft(null);
          setAwaitingConfirmation(false);
        } catch {
          speak('I had trouble sending that email. Please try again.');
        }
      } else if (CANCEL_WORDS.some(w => lower.includes(w))) {
        speak('Cancelled. The email was not sent.');
        setPendingDraft(null);
        setAwaitingConfirmation(false);
      } else {
        speak('Please say "send" to confirm, or "cancel" to discard.');
      }
      processingRef.current = false;
      return;
    }

    // Send to AI
    try {
      const { data } = await api.post('/api/ai/command', {
        transcript: text,
        currentEmailId: selectedEmail?.id,
      });

      const { response, action } = data;
      setAiResponse(response);

      // Handle action
      if (action?.type && action.type !== 'none') {
        await handleAction(action, response);
      } else {
        speak(response);
      }
    } catch {
      speak('I had trouble processing that command. Please try again.');
    }

    processingRef.current = false;
  }, [awaitingConfirmation, pendingDraft, selectedEmail, resetTranscript]);

  // ── Handle AI-returned action ─────────────────────────
  const handleAction = useCallback(async (action: { type: string; params?: any }, response: string) => {
    if (!selectedEmail) {
      speak(response);
      return;
    }

    switch (action.type) {
      case 'archive':
        speak(`Archiving email from ${selectedEmail.fromName}. Confirm?`);
        setAwaitingConfirmation(true, 'archive');
        setPendingAction({ type: 'archive', params: { emailId: selectedEmail.id, gmailId: selectedEmail.gmailMessageId } });
        break;

      case 'delete':
        speak(`Deleting email from ${selectedEmail.fromName}. This cannot be undone. Confirm?`);
        setAwaitingConfirmation(true, 'delete');
        setPendingAction({ type: 'delete', params: { emailId: selectedEmail.id } });
        break;

      case 'reply':
        speak(response);
        break;

      case 'draft_reply':
        speak('Let me draft that reply for you.');
        try {
          const { data } = await api.post('/api/ai/generate-reply', {
            emailId: selectedEmail.id,
            instruction: action.params?.instruction || response,
          });
          const draft = data.draft;
          setPendingDraft({
            id: draft.id,
            toEmail: draft.toEmail,
            subject: draft.subject,
            body: draft.body,
            emailId: selectedEmail.id,
          });
          speak(`Here's the draft: ${draft.body.substring(0, 200)}... Would you like me to send it?`);
          setAwaitingConfirmation(true, 'send_draft');
        } catch {
          speak('I had trouble drafting that reply. Please try again.');
        }
        break;

      case 'mark_unread':
        await api.patch(`/api/emails/${selectedEmail.id}/action`, { action: 'mark_unread', confirmedBy: 'voice' });
        updateEmail(selectedEmail.id, { isRead: false });
        speak(response);
        break;

      case 'star':
        await api.patch(`/api/emails/${selectedEmail.id}/action`, { action: 'star', confirmedBy: 'voice' });
        updateEmail(selectedEmail.id, { isStarred: true });
        speak(response);
        break;

      case 'read_email':
        speak(`${selectedEmail.bodyText?.substring(0, 500) || selectedEmail.snippet || 'No content'}`);
        break;

      case 'summarize':
        speak(selectedEmail.aiSummary || `Email from ${selectedEmail.fromName}: ${selectedEmail.snippet}`);
        break;

      default:
        speak(response);
    }
  }, [selectedEmail, updateEmail, removeEmail]);

  // ── Listen for silence (auto-submit after 1.5s) ───────
  useEffect(() => {
    if (!transcript) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (transcript.trim().length > 2) processTranscript(transcript);
    }, 1500);
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [transcript, processTranscript]);

  // ── Always-on listening ───────────────────────────────
  useEffect(() => {
    if (!browserSupportsSpeechRecognition || !userId) return;
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    setStatus('listening');
    return () => { SpeechRecognition.stopListening(); };
  }, [userId, browserSupportsSpeechRecognition]);

  // ── Sync listening status ─────────────────────────────
  useEffect(() => {
    if (listening) setStatus('listening');
  }, [listening, setStatus]);

  return {
    transcript,
    listening,
    speak,
    stopSpeaking,
    browserSupportsSpeechRecognition,
    processTranscript,
  };
}
