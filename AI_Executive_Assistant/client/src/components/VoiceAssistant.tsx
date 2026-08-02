import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, X } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useVoiceStore } from '../store/voiceStore';
import { useEmailStore } from '../store/emailStore';

interface Props {
  userId?: string;
}

const WAVEFORM_BARS = 20;

export function VoiceAssistant({ userId }: Props) {
  const { status, aiResponse, pendingDraft, awaitingConfirmation, confirmationMessage, notifications, removeNotification } = useVoiceStore();
  const { selectedEmail } = useEmailStore();
  const { transcript, listening, speak, browserSupportsSpeechRecognition } = useVoice(userId);

  // Announce new voice events from socket
  useEffect(() => {
    const handler = (e: Event) => {
      const { text } = (e as CustomEvent).detail;
      speak(text);
    };
    window.addEventListener('voice_announce', handler);
    return () => window.removeEventListener('voice_announce', handler);
  }, [speak]);

  const statusLabel = {
    idle: 'Idle',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Speaking...',
  }[status];

  const getBarHeight = (index: number): number => {
    if (status === 'idle') return 8;
    if (status === 'listening') return 8 + Math.sin((Date.now() / 200) + index) * 8 + Math.random() * 4;
    if (status === 'speaking') return 16 + Math.sin((Date.now() / 100) + index * 0.8) * 24;
    if (status === 'processing') return 12 + Math.sin((Date.now() / 300) + index) * 6;
    return 8;
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="voice-panel" style={{ padding: 24 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          ⚠️ Voice not supported in this browser. Use Chrome for voice features.
        </div>
      </div>
    );
  }

  return (
    <div className="voice-panel">
      {/* Header */}
      <div className="voice-panel-header">
        <motion.div
          className={`voice-status-dot ${status}`}
          animate={{ scale: status === 'listening' ? [1, 1.3, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Assistant</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{statusLabel}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {status === 'speaking' && (
            <button className="btn btn-ghost btn-sm btn-icon" title="Stop speaking" onClick={() => window.speechSynthesis.cancel()}>
              <VolumeX size={14} />
            </button>
          )}
          <Sparkles size={16} color="var(--primary)" />
        </div>
      </div>

      {/* Context hint */}
      {selectedEmail && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,0.04)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Currently reviewing</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedEmail.fromName} — {selectedEmail.subject}
          </div>
        </div>
      )}

      {/* Waveform */}
      <div className={`waveform-container ${status}`} style={{ padding: '16px 20px' }}>
        {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
          <motion.div
            key={i}
            className="waveform-bar"
            animate={{
              height: status === 'idle' ? 8 :
                      status === 'processing' ? [8, 20, 8] :
                      [8 + Math.random() * 40, 8 + Math.random() * 40],
            }}
            transition={{
              duration: status === 'processing' ? 0.6 : 0.15,
              repeat: Infinity,
              delay: i * 0.04,
              ease: 'easeInOut',
            }}
            style={{ '--delay': `${i * 0.05}s` } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Transcript + Response area */}
      <div className="transcript-area">
        {/* Welcome message */}
        {!transcript && !aiResponse && (
          <motion.div
            className="transcript-bubble assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            I'm listening. Try saying: <em>"What's in my inbox?"</em> or select an email and say <em>"Summarize"</em> or <em>"Reply"</em>.
          </motion.div>
        )}

        {/* AI response */}
        <AnimatePresence>
          {aiResponse && (
            <motion.div
              key={aiResponse}
              className="transcript-bubble assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Sparkles size={14} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{aiResponse}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Awaiting confirmation */}
        {awaitingConfirmation && pendingDraft && (
          <motion.div
            className="transcript-bubble assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)' }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Awaiting Confirmation
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Say <strong style={{ color: 'var(--text-primary)' }}>"Send"</strong> to send or <strong style={{ color: 'var(--text-primary)' }}>"Cancel"</strong> to discard.
            </div>
            <div style={{ fontSize: 12, background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>
              {pendingDraft.body.substring(0, 300)}{pendingDraft.body.length > 300 ? '...' : ''}
            </div>
          </motion.div>
        )}
      </div>

      {/* Live transcript bar */}
      <div className="transcript-input-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Mic size={14} color={listening ? 'var(--accent)' : 'var(--text-muted)'} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Always-on voice • Say your command</span>
        </div>
        <div className="live-transcript">
          {transcript || 'Waiting for voice input...'}
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <div className="notifications-container" style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                className={`notification ${n.type}`}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                onClick={() => removeNotification(n.id)}
              >
                <span style={{ fontSize: 13 }}>{n.text}</span>
                <X size={12} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
