import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Forward, Archive, Trash2, Star, MailOpen, ChevronDown, ChevronUp, Calendar, Sparkles, Paperclip, Send, Volume2, Edit3, X } from 'lucide-react';
import { useEmailStore } from '../store/emailStore';
import { useVoiceStore } from '../store/voiceStore';
import { api } from '../lib/api';
import { formatFull } from '../lib/dateUtils';

export function EmailDetail() {
  const { selectedEmail, updateEmail, removeEmail } = useEmailStore();
  const { setPendingDraft, setAwaitingConfirmation, addNotification } = useVoiceStore();
  const [showFullBody, setShowFullBody] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyInstruction, setReplyInstruction] = useState('');
  const [draft, setDraft] = useState<{ id: string; body: string; toEmail: string; subject: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!selectedEmail) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">✉️</div>
          <div className="empty-state-title">Select an email</div>
          <div className="empty-state-sub">Or say "Summarize" to hear your latest email</div>
        </div>
      </div>
    );
  }

  const email = selectedEmail;

  const handleAction = async (action: string) => {
    try {
      await api.patch(`/api/emails/${email.id}/action`, { action, confirmedBy: 'click' });
      if (action === 'archive') { updateEmail(email.id, { isArchived: true }); addNotification('Email archived', 'success'); }
      if (action === 'delete') { removeEmail(email.id); addNotification('Email deleted', 'info'); }
      if (action === 'star') { updateEmail(email.id, { isStarred: !email.isStarred }); }
      if (action === 'mark_unread') { updateEmail(email.id, { isRead: false }); }
    } catch {}
  };

  const generateReply = async () => {
    if (!replyInstruction.trim()) return;
    setIsGenerating(true);
    try {
      const { data } = await api.post('/api/ai/generate-reply', {
        emailId: email.id,
        instruction: replyInstruction,
      });
      setDraft(data.draft);
      // Speak the draft
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(`Here's the draft: ${data.draft.body.substring(0, 200)}. Would you like me to send it?`);
      synth.speak(utter);
    } catch { addNotification('Failed to generate reply', 'error'); }
    finally { setIsGenerating(false); }
  };

  const sendDraft = async () => {
    if (!draft) return;
    setIsSending(true);
    try {
      await api.post(`/api/emails/${email.id}/send-draft`, { draftId: draft.id });
      addNotification('Email sent!', 'success');
      setDraft(null);
      setIsReplying(false);
      setReplyInstruction('');
    } catch { addNotification('Failed to send email', 'error'); }
    finally { setIsSending(false); }
  };

  const readAloud = (text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;

    const isEs = /[áéíóúñ¿¡ÁÉÍÓÚÑ]/.test(text) || /\b(el|la|los|las|un|una|unos|unas|del|que|por|para|con|sin|como|pero|más|mas|este|esta|esto|estos|estas|ese|esa|eso|aqui|aquí|sobre|entre|después|despues|cuando|también|tambien|hola|gracias|saludos|atentamente|estimado|estimada|asunto|mensaje|correo|buenos|buenas|favor|usted|ustedes)\b/i.test(text);
    utter.lang = isEs ? 'es-ES' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = isEs ? 'es' : 'en';
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix));
    const maleNames = ['jorge', 'david', 'guy', 'mark', 'pablo', 'manuel', 'raul', 'george', 'james', 'richard'];
    const femaleKeywords = ['sabina', 'monica', 'paulina', 'lucia', 'helena', 'zira', 'jenny', 'aria', 'samantha', 'victoria', 'karen', 'female', 'woman'];

    const preferredFemale =
      langVoices.find(v => femaleKeywords.some(kw => v.name.toLowerCase().includes(kw)) && !maleNames.some(m => v.name.toLowerCase().includes(m))) ||
      langVoices.find(v => v.name.includes('Google') && !maleNames.some(m => v.name.toLowerCase().includes(m))) ||
      langVoices.find(v => v.name.includes('Microsoft') && !maleNames.some(m => v.name.toLowerCase().includes(m))) ||
      langVoices.find(v => !maleNames.some(m => v.name.toLowerCase().includes(m))) ||
      langVoices[0];

    if (preferredFemale) utter.voice = preferredFemale;

    window.speechSynthesis.speak(utter);
  };

  const initials = (email.fromName || email.fromEmail || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const priorityColor = { Critical: '#ef4444', High: '#f97316', Medium: '#6366f1', Low: '#475569' }[email.aiPriority || 'Low'] || '#475569';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="email-detail" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <div className="email-detail-header">
          <div className="email-detail-subject">{email.subject}</div>
          <div className="email-detail-from">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{email.fromName || email.fromEmail}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{email.fromEmail} · {formatFull(email.receivedAt)}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span className={`badge badge-${(email.aiPriority || 'low').toLowerCase()}`}>{email.aiPriority}</span>
              {email.aiCategory && <span className="badge badge-category">{email.aiCategory}</span>}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="email-detail-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { setIsReplying(!isReplying); setDraft(null); }}>
            <Reply size={13} /> Reply
          </button>
          <button className="btn btn-ghost btn-sm" onClick={async () => {
            const to = prompt('Forward to:');
            if (to) { await api.post(`/api/emails/${email.id}/forward`, { to }); addNotification(`Forwarded to ${to}`, 'success'); }
          }}>
            <Forward size={13} /> Forward
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleAction('archive')}>
            <Archive size={13} /> Archive
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleAction('star')}>
            <Star size={13} fill={email.isStarred ? 'var(--priority-high)' : 'none'} color={email.isStarred ? 'var(--priority-high)' : undefined} />
            {email.isStarred ? 'Unstar' : 'Star'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleAction('mark_unread')}>
            <MailOpen size={13} /> Unread
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete this email?')) handleAction('delete'); }}>
            <Trash2 size={13} /> Delete
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => readAloud(email.aiSummary || email.snippet || email.bodyText || '')}>
            <Volume2 size={13} /> Read
          </button>
        </div>

        {/* AI Summary */}
        <div className="ai-summary-card">
          <div className="ai-summary-label">
            <Sparkles size={12} /> AI Summary
          </div>
          <div className="ai-summary-text">{email.aiSummary || 'Processing summary...'}</div>
        </div>

        {/* Meeting Detection */}
        {email.hasMeetingRequest && (
          <div className="meeting-card">
            <Calendar size={20} className="meeting-card-icon" />
            <div className="meeting-card-content">
              <div className="meeting-card-title">Meeting Request Detected</div>
              <div className="meeting-card-sub">
                {email.meetingDetails?.proposedTime || 'Check email for proposed time'} · 
                {email.meetingDetails?.duration ? ` ${email.meetingDetails.duration} min` : ''}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => addNotification('Opening calendar...', 'info')}>
              Check Availability
            </button>
          </div>
        )}

        {/* Attachments */}
        {email.attachments?.length > 0 && (
          <div style={{ margin: '0 24px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {email.attachments.map((att: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                <Paperclip size={12} /> {att.filename}
              </div>
            ))}
          </div>
        )}

        {/* Email Body */}
        <div style={{ padding: '0 24px 24px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowFullBody(!showFullBody)}
            style={{ marginBottom: 12 }}
          >
            {showFullBody ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showFullBody ? 'Collapse' : 'Show full email'}
          </button>

          <AnimatePresence>
            {showFullBody && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 400,
                  overflowY: 'auto',
                }}>
                  {email.bodyText || email.snippet || '(no content)'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reply Panel */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
          >
            {!draft ? (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Tell me what you want to say — I'll write the professional reply.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder='e.g. "Tell them the report is ready tomorrow morning"'
                    value={replyInstruction}
                    onChange={e => setReplyInstruction(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateReply()}
                    autoFocus
                  />
                  <button className="btn btn-primary" onClick={generateReply} disabled={isGenerating || !replyInstruction.trim()}>
                    {isGenerating ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={14} />}
                    Draft
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => setIsReplying(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="draft-editor">
                <div className="draft-editor-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} color="var(--primary)" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>AI Draft — To: {draft.toEmail}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => readAloud(draft.body)}>
                      <Volume2 size={13} /> Read
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDraft(null)}>
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
                <textarea
                  className="draft-editor-body"
                  value={draft.body}
                  onChange={e => setDraft({ ...draft, body: e.target.value })}
                />
                <div className="draft-editor-actions">
                  <button className="btn btn-primary" onClick={sendDraft} disabled={isSending}>
                    {isSending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={13} />}
                    Send
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Edit Instructions</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(null); setIsReplying(false); }}>Discard</button>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    Or say <em>"Send"</em> to confirm via voice
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
