"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';

export type EmailCategory =
  | 'Customer'
  | 'Vendor'
  | 'Accounting'
  | 'Banking'
  | 'Personal'
  | 'Internal'
  | 'Marketing'
  | 'Newsletter'
  | 'Spam'
  | 'Unknown';

export type EmailPriority = 'Critical' | 'High' | 'Medium' | 'Low';

interface EmailItem {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  aiCategory?: EmailCategory;
  aiPriority?: EmailPriority;
  aiSummary?: string;
  hasAttachments?: boolean;
  attachments?: { id?: string; filename: string; mimeType: string; size: number }[];
}

function formatEmailDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timePart;

    const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${datePart}, ${timePart}`;
  } catch {
    return dateStr;
  }
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Play a short chime to confirm action
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function isSpanishText(text: string): boolean {
  if (!text) return false;
  if (/[áéíóúñ¿¡ÁÉÍÓÚÑ]/i.test(text)) return true;
  const esRegex = /\b(el|la|los|las|un|una|unos|unas|del|que|por|para|con|sin|como|pero|más|mas|este|esta|esto|estos|estas|ese|esa|eso|aqui|aquí|sobre|entre|después|despues|cuando|también|tambien|hola|gracias|saludos|atentamente|estimado|estimada|asunto|mensaje|correo|buenos|buenas|favor|usted|ustedes|tengo|necesito|quiero|hacer|estar|buen|día|dia|noche|tarde)\b/i;
  return esRegex.test(text);
}

// Speak text via browser TTS with auto English/Spanish voice selection and natural rate
function speakText(text: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.90; // Natural, unhurried, comfortable pace
    utt.pitch = 1.05; // Natural female cadence

    const isEs = isSpanishText(text);
    utt.lang = isEs ? 'es-ES' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const maleNames = ['jorge', 'david', 'guy', 'mark', 'pablo', 'manuel', 'raul', 'george', 'james', 'richard'];
      const femaleKeywords = ['sabina', 'monica', 'paulina', 'lucia', 'helena', 'zira', 'jenny', 'aria', 'samantha', 'victoria', 'karen', 'female', 'woman', 'google us english', 'google uk english female'];

      const isMatchingLang = (v: SpeechSynthesisVoice) => {
        const langL = v.lang.toLowerCase();
        const nameL = v.name.toLowerCase();
        if (isEs) return langL.includes('es') || nameL.includes('spanish') || nameL.includes('español');
        return langL.includes('en') || nameL.includes('english');
      };

      const langVoices = voices.filter(isMatchingLang);
      const pool = langVoices.length > 0 ? langVoices : voices;

      const preferredVoice =
        pool.find((v) => femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw)) && !maleNames.some((m) => v.name.toLowerCase().includes(m))) ||
        pool.find((v) => !maleNames.some((m) => v.name.toLowerCase().includes(m))) ||
        pool[0];

      if (preferredVoice) {
        utt.voice = preferredVoice;
        utt.lang = preferredVoice.lang;
      }
    }

    window.speechSynthesis.speak(utt);
  } catch {}
}

// Play audio from Blob or Base64 string
function playAudioInput(input: Blob | string) {
  try {
    const url = typeof input === 'string' ? input : URL.createObjectURL(input);
    const audio = new Audio(url);
    if (typeof input !== 'string') {
      audio.onended = () => URL.revokeObjectURL(url);
    }
    audio.play().catch(() => {});
  } catch {}
}

function getCategoryBadge(cat?: EmailCategory) {
  switch (cat) {
    case 'Customer':
      return { label: '🏢 Customer', style: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    case 'Vendor':
      return { label: '📦 Vendor', style: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    case 'Accounting':
      return { label: '🧾 Accounting', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    case 'Banking':
      return { label: '🏦 Banking', style: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    case 'Internal':
      return { label: '👥 Internal', style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    case 'Marketing':
      return { label: '📢 Marketing', style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    case 'Newsletter':
      return { label: '📰 Newsletter', style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    case 'Spam':
      return { label: '⛔ Spam', style: 'bg-red-500/20 text-red-300 border-red-500/40' };
    case 'Personal':
      return { label: '👤 Personal', style: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
    default:
      return { label: '📧 General', style: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
  }
}

function getPriorityBadge(priority?: EmailPriority) {
  switch (priority) {
    case 'Critical':
      return { label: '🚨 URGENT', style: 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse font-bold' };
    case 'High':
      return { label: '⚡ HIGH', style: 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold' };
    case 'Medium':
      return { label: '🔹 NORMAL', style: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    case 'Low':
      return { label: '⚪ LOW', style: 'bg-slate-800 text-slate-400 border-slate-700' };
    default:
      return { label: '🔹 NORMAL', style: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  }
}

export default function DashboardEmailAssistantPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [newEmailNotice, setNewEmailNotice] = useState<string | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Selected Email state
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Typed command
  const [typedCommand, setTypedCommand] = useState('');

  // Search & Batch state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveFolderModalOpen, setMoveFolderModalOpen] = useState(false);
  const [targetFolderName, setTargetFolderName] = useState('');

  // Errors
  const [micError, setMicError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const activeSearchRef = useRef('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    activeSearchRef.current = activeSearch;
  }, [activeSearch]);

  // ── Session detection ────────────────────────────────────────────
  useEffect(() => {
    try {
      const profileMatch = document.cookie.match(new RegExp('(^| )user_profile=([^;]+)'));
      if (profileMatch) {
        const decoded = JSON.parse(decodeURIComponent(profileMatch[2]));
        if (decoded?.email) {
          setUser(decoded);
          return;
        }
      }
    } catch {}

    try {
      const match = document.cookie.match(new RegExp('(^| )user_session=([^;]+)'));
      if (match) {
        const decoded = JSON.parse(decodeURIComponent(match[2]));
        if (decoded?.email) {
          setUser(decoded);
          return;
        }
      }
    } catch {}

    fetch('/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.email) setUser(d);
      })
      .catch(() => {});
  }, []);

  // ── Email fetch ──────────────────────────────────────────────────
  const fetchEmails = async (overrideQuery?: string) => {
    setLoadingEmails(true);
    setEmailError(null);
    try {
      const q = overrideQuery !== undefined ? overrideQuery : activeSearchRef.current;
      const url = q ? `/api/emails?q=${encodeURIComponent(q)}` : '/api/emails';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setEmailError(`Gmail sync: ${data?.error || `Error ${res.status}`}`);
        return;
      }
      const list: EmailItem[] = data.emails || [];
      if (knownIdsRef.current.size > 0 && !q) {
        // Only notify for genuinely new emails (unseen AND received within the last 10 minutes)
        const fresh = list.filter((m) => {
          if (knownIdsRef.current.has(m.id)) return false;
          try {
            const emailTime = new Date(m.date).getTime();
            return !isNaN(emailTime) && Date.now() - emailTime < 10 * 60 * 1000;
          } catch {
            return false;
          }
        });

        if (fresh.length > 0) {
          const latest = fresh[0];
          const msg = `New email from ${latest.fromName}: ${latest.subject}`;
          setNewEmailNotice(`📩 ${msg}`);
          playChime();
          speakText(msg);
        }
      }
      if (!q) {
        knownIdsRef.current = new Set(list.map((m) => m.id));
      }
      setEmails(list);
    } catch (e: any) {
      setEmailError(`Network error: ${e.message}`);
    } finally {
      setLoadingEmails(false);
    }
  };

  const executeSearch = (rawQuery: string) => {
    let clean = rawQuery.trim();

    const folderWithSub = clean.match(/(?:search\s+emails?\s+)?(?:in\s+folder|in\s+label|folder)\s+["']?(.+?)["']?\s+(?:for|from|about)\s+(.+)$/i);
    const folderOnly = clean.match(/(?:search\s+emails?\s+)?(?:in\s+folder|in\s+label|folder)\s+["']?(.+?)["']?$/i);

    if (folderWithSub) {
      const folder = folderWithSub[1].trim();
      const sub = folderWithSub[2].trim();
      clean = `folder:"${folder}" ${sub}`;
    } else if (folderOnly) {
      const folder = folderOnly[1].trim();
      clean = `folder:"${folder}"`;
    } else if (!clean.toLowerCase().includes('label:') && !clean.toLowerCase().includes('folder:') && !clean.toLowerCase().includes('in:')) {
      clean = clean.replace(/^(please\s+|can\s+you\s+|i\s+want\s+to\s+)?(search|find|show\s+me|get|look\s+for|busca|buscar|mostrar)\s+/i, '');
      clean = clean.replace(/^(emails?\s+|messages?\s+|correos?\s+|mensajes?\s+)/i, '');
      clean = clean.replace(/^(in\s+inbox\s+folder\s+for|in\s+inbox\s+for|from\s+inbox\s+for|in\s+inbox\s+folder|in\s+inbox|from\s+inbox|for|from|about|de|para|sobre)\s+/i, '');
      clean = clean.replace(/^(inbox\s+folder\s+for|inbox\s+for|emails?\s+for|emails?\s+from|emails?\s+about)\s+/i, '');
      clean = clean.replace(/^(for|from|about|de|para|sobre)\s+/i, '');
      clean = clean.trim();
    }

    const finalQ = clean || rawQuery.trim();
    setSearchInput(finalQ);
    setActiveSearch(finalQ);
    activeSearchRef.current = finalQ;
    fetchEmails(finalQ);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      executeSearch(searchInput);
    } else {
      clearSearch();
    }
  };

  const clearSearch = () => {
    activeSearchRef.current = '';
    setSearchInput('');
    setActiveSearch('');
    fetchEmails('');
  };

  const handleBatchAction = async (action: 'move' | 'archive' | 'trash' | 'restore', folderName?: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, messageIds: ids, folderName }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        setMoveFolderModalOpen(false);
        setTargetFolderName('');
        fetchEmails();
      }
    } catch (err) {
      console.error('Batch action error', err);
    }
  };

  const toggleSelectEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (user) {
      fetchEmails(activeSearchRef.current);
      const interval = setInterval(() => {
        fetchEmails(activeSearchRef.current);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ── MediaRecorder voice (Whisper-based) ─────────────────────────
  const startRecording = async () => {
    setMicError(null);
    setTranscript('');
    setAiResponse(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err: any) {
      const code = err.name || 'Unknown';
      if (code === 'NotAllowedError') {
        setMicError('Microphone blocked. Click the tune-sliders icon in the Chrome address bar → Microphone → Allow.');
      } else if (code === 'NotFoundError') {
        setMicError('No microphone hardware found. Check Windows Sound → Recording tab.');
      } else if (code === 'NotReadableError') {
        setMicError('Mic busy (another app is using it — close Teams/Zoom/Discord, then try again).');
      } else {
        setMicError(`Mic error: ${code} — ${err.message}`);
      }
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/ogg';

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      await processRecording(mimeType);
    };

    recorder.start(100);
    setIsRecording(true);
    setVoiceStatus('🎤 Recording... Click Stop to send to AI');
    playChime();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVoiceStatus('🔄 Processing with Whisper AI...');
    }
  };

  const processRecording = async (mimeType: string) => {
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    audioChunksRef.current = [];

    if (audioBlob.size < 1000) {
      setVoiceStatus('⚠️ Recording too short. Hold the button longer while speaking.');
      setIsProcessing(false);
      return;
    }

    try {
      setVoiceStatus('🧠 Sending to Whisper + GPT-4o...');
      const form = new FormData();
      form.append('file', audioBlob, `audio.${mimeType.includes('ogg') ? 'ogg' : 'webm'}`);
      form.append('mode', 'fast');

      const headers: Record<string, string> = {};
      if (selectedEmailId) {
        headers['x-selected-email-id'] = selectedEmailId;
      }

      const res = await fetch('/api/voice', { method: 'POST', body: form, headers });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setVoiceStatus(`❌ Error: ${err.error || res.status}`);
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      const transcriptText = data.transcript || '';
      const replyText = data.reply || '';
      const actionObj = data.action || null;

      if (transcriptText) setTranscript(`🗣️ "${transcriptText}"`);
      if (replyText) setAiResponse(replyText);

      let handledAction = false;
      if (actionObj) {
        if (actionObj.type === 'search' && actionObj.query) {
          executeSearch(actionObj.query);
          handledAction = true;
        } else if (actionObj.type === 'refresh') {
          fetchEmails();
          handledAction = true;
        }
      }

      if (!handledAction && transcriptText) {
        const tLower = transcriptText.toLowerCase().trim();
        if (
          tLower.includes('search') ||
          tLower.includes('find') ||
          tLower.includes('show') ||
          tLower.includes('busca') ||
          tLower.includes('buscar') ||
          tLower.includes('emails from') ||
          tLower.includes('correos de')
        ) {
          executeSearch(transcriptText);
        }
      }

      if (data.audioBase64) {
        playAudioInput(data.audioBase64);
        setVoiceStatus(`✅ AI replied. Ready to record again.`);
      } else {
        if (replyText) speakText(replyText);
        setVoiceStatus('✅ Done.');
      }
    } catch (e: any) {
      setVoiceStatus(`❌ Network error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Typed command ────────────────────────────────────────────────
  const processTextCommand = (cmd: string) => {
    const c = cmd.toLowerCase().trim();
    if (!c) return;
    setTranscript(`⌨️ "${cmd}"`);

    if (c.startsWith('search') || c.startsWith('find') || c.startsWith('show')) {
      executeSearch(cmd);
      return;
    }

    const targetEmail = selectedEmail || (emails.length > 0 ? emails[0] : null);

    if (c.includes('summarize') || c.includes('summary')) {
      const text = targetEmail
        ? `Email from ${targetEmail.fromName}. Subject: ${targetEmail.subject}. Categorized as ${targetEmail.aiCategory || 'Customer'}, Priority: ${targetEmail.aiPriority || 'Medium'}. ${targetEmail.snippet}`
        : 'No emails found in inbox.';
      setAiResponse(text);
      playChime();
      speakText(text);
    } else if (c.includes('read') || c.includes('latest')) {
      if (targetEmail) {
        const text = `From ${targetEmail.fromName}: ${targetEmail.subject}. ${targetEmail.snippet}`;
        setAiResponse(text);
        playChime();
        speakText(text);
      }
    } else if (c.includes('refresh') || c.includes('check')) {
      fetchEmails();
      speakText('Refreshing inbox.');
    } else {
      const text = `Command received: ${cmd}`;
      setAiResponse(text);
      speakText(text);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedCommand.trim()) {
      processTextCommand(typedCommand);
      setTypedCommand('');
    }
  };

  const handleLogout = () => {
    document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user_profile=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    setEmails([]);
    setEmailError(null);
    setSelectedEmailId(null);
  };

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  // Filtered email list with smart sender matching & prioritization
  const filteredEmails = useMemo(() => {
    let list = emails;

    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();

      const isFolderSearch =
        q.includes('folder:') ||
        q.includes('label:') ||
        q.includes('in:') ||
        q.includes('folder ') ||
        q.includes('in folder');

      if (isFolderSearch) {
        return list;
      } else {
        const directMatches = list.filter(
          (e) =>
            (e.fromName && e.fromName.toLowerCase().includes(q)) ||
            (e.fromEmail && e.fromEmail.toLowerCase().includes(q))
        );

        if (directMatches.length > 0) {
          list = directMatches;
        } else {
          list = list.filter(
            (e) =>
              (e.fromName && e.fromName.toLowerCase().includes(q)) ||
              (e.fromEmail && e.fromEmail.toLowerCase().includes(q)) ||
              (e.subject && e.subject.toLowerCase().includes(q)) ||
              (e.snippet && e.snippet.toLowerCase().includes(q))
          );
        }
      }
    }

    if (activeFilter === 'All') return list;
    if (activeFilter === 'Urgent') return list.filter((e) => e.aiPriority === 'Critical' || e.aiPriority === 'High');
    return list.filter((e) => e.aiCategory === activeFilter);
  }, [emails, activeSearch, activeFilter]);

  return (
    <div className="w-full h-full flex flex-col p-6 text-white bg-[#0a0a0c]">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">🎙️</span>
            AI Executive Email Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Click any row to select · Whisper Voice Controls · Interactive Email Operations
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border shadow-lg disabled:opacity-50 ${
              isRecording
                ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-transparent hover:scale-105'
            }`}
          >
            {isRecording ? (
              <><span className="text-lg">⏹️</span> Stop &amp; Send to AI</>
            ) : isProcessing ? (
              <><span className="text-lg animate-spin inline-block">⚙️</span> Processing...</>
            ) : (
              <><span className="text-lg">🎤</span> Hold &amp; Speak to AI</>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-white/[0.04] border border-emerald-500/30 px-4 py-2 rounded-xl">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border border-emerald-400/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                  {user.name?.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Google Connected
                </div>
                <div className="text-[11px] text-slate-300 font-mono">{user.email}</div>
              </div>
              <button onClick={handleLogout} className="ml-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors underline">
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href="/auth/google"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-all"
            >
              Sign in with Google
            </a>
          )}
        </div>
      </div>

      {/* Selected Email Notice Banner */}
      {selectedEmail && (
        <div className="max-w-6xl w-full mb-6 p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-bold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">📌</span>
            <span>
              Selected Row: <strong className="text-white">{selectedEmail.fromName}</strong> — "{selectedEmail.subject}"
            </span>
          </div>
          <button
            onClick={() => setSelectedEmailId(null)}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 text-xs transition-colors"
          >
            Clear Selection ✕
          </button>
        </div>
      )}

      {/* Error banners */}
      {micError && (
        <div className="max-w-6xl w-full mb-4 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center justify-between">
          <span>⚠️ {micError}</span>
          <button onClick={() => setMicError(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
      {emailError && (
        <div className="max-w-6xl w-full mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-between">
          <span>📧 {emailError}</span>
          <button onClick={() => setEmailError(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Voice Console */}
      <div className={`max-w-6xl w-full mb-8 p-6 rounded-2xl border transition-all ${
        isRecording
          ? 'bg-red-950/30 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          : isProcessing
          ? 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
          : 'bg-white/[0.02] border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : isProcessing ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`} />
            <h3 className="text-sm font-bold text-white">Voice Command Console <span className="text-slate-400 font-normal text-xs ml-1">· Whisper AI</span></h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isRecording ? '🎤 Recording live...' : isProcessing ? '🧠 Whisper + GPT-4o thinking...' : selectedEmail ? `Targeting Selected Email from ${selectedEmail.fromName}` : 'Click "Hold & Speak to AI" above'}
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-1 mb-4 h-8">
            {[...Array(20)].map((_, i) => (
              <span
                key={i}
                className="flex-1 rounded-full bg-red-400"
                style={{
                  height: `${Math.random() * 100}%`,
                  animation: `pulse ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate`,
                  opacity: 0.7 + Math.random() * 0.3,
                }}
              />
            ))}
          </div>
        )}

        {voiceStatus && (
          <div className="mb-3 text-xs font-mono text-indigo-300 bg-black/30 rounded-lg px-4 py-2">
            {voiceStatus}
          </div>
        )}

        {transcript && (
          <div className="mb-3 p-3 rounded-xl bg-black/30 border border-white/5 font-mono text-xs text-slate-300">
            {transcript}
          </div>
        )}

        {aiResponse && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-slate-200 flex items-start gap-2">
            <span className="text-base">🤖</span>
            <div>
              <strong className="text-indigo-300 block mb-1">AI Assistant Response (spoken aloud):</strong>
              {aiResponse}
            </div>
          </div>
        )}

        <form onSubmit={handleTypedSubmit} className="flex items-center gap-2 mt-4">
          <input
            type="text"
            value={typedCommand}
            onChange={(e) => setTypedCommand(e.target.value)}
            placeholder={selectedEmail ? `Run command on selected email from ${selectedEmail.fromName}: "Summarize", "Reply...", "Delete"` : 'Type a command: "Summarize", "Read email", "Reply to latest saying..."'}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="px-4 py-2.5 bg-indigo-500 text-white font-bold text-xs rounded-xl hover:bg-indigo-600 transition-all whitespace-nowrap">
            Run ↵
          </button>
        </form>
      </div>

      {newEmailNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-between animate-bounce shadow-[0_0_25px_rgba(16,185,129,0.3)]">
          <div className="flex items-center gap-2"><span className="text-lg">🔊</span><span>{newEmailNotice}</span></div>
          <button onClick={() => setNewEmailNotice(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Gmail Inbox */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              📬 Live Categorized Gmail Inbox
              {filteredEmails.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                  {filteredEmails.length}
                </span>
              )}
            </h2>
            {user && (
              <button onClick={() => fetchEmails()} disabled={loadingEmails} className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">
                {loadingEmails ? 'Syncing...' : '🔄 Refresh'}
              </button>
            )}
          </div>

          {/* Search Bar & Scope Controls */}
          <div className="flex items-center gap-2 mb-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search inbox or folders (e.g. 'Amazon', 'invoice', 'from:John')..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <span className="absolute left-3 top-2 text-slate-500 text-xs">🔍</span>
                {searchInput && (
                  <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs">
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md">
                Search
              </button>
            </form>
          </div>

          {/* AI Category & Dynamic Search Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-white/5 no-scrollbar">
            {activeSearch && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)] whitespace-nowrap">
                <span>🔍 Search: "{activeSearch}"</span>
                <button onClick={clearSearch} className="ml-1 opacity-70 hover:opacity-100 text-white font-bold">✕</button>
              </div>
            )}
            {['All', 'Urgent', 'Customer', 'Accounting', 'Banking', 'Vendor', 'Internal', 'Newsletter', 'Marketing'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  activeFilter === cat && !activeSearch
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                {cat === 'All' ? '🌐 All' : cat === 'Urgent' ? '🚨 Urgent' : cat}
              </button>
            ))}
          </div>

          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-between flex-wrap gap-2 text-xs shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <div className="flex items-center gap-2 font-bold text-indigo-200">
                <span>☑️ {selectedIds.size} Selected</span>
                <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-white underline font-normal text-[11px]">
                  Deselect All
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setMoveFolderModalOpen(true)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center gap-1 shadow"
                >
                  📁 Move to Folder
                </button>
                <button
                  onClick={() => handleBatchAction('restore')}
                  className="px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 shadow"
                >
                  📥 Move to Inbox
                </button>
                <button
                  onClick={() => handleBatchAction('archive')}
                  className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold transition-colors flex items-center gap-1"
                >
                  📦 Archive
                </button>
                <button
                  onClick={() => handleBatchAction('trash')}
                  className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold transition-colors flex items-center gap-1 shadow"
                >
                  🗑️ Trash
                </button>
              </div>
            </div>
          )}

          {!user ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="mb-4 text-slate-300">Sign in with your Google Account to access live inbox, search &amp; batch operations.</p>
              <a
                href="/auth/google"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>🔑</span> Sign in with Google
              </a>
            </div>
          ) : loadingEmails && emails.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="inline-block animate-spin text-lg mb-2">🔄</span>
              <div>Fetching &amp; Categorizing Gmail messages...</div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-white/10 rounded-xl">
              No emails matching {activeSearch ? `search "${activeSearch}"` : `filter "${activeFilter}"`}.
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredEmails.map((email) => {
                const catBadge = getCategoryBadge(email.aiCategory);
                const prioBadge = getPriorityBadge(email.aiPriority);
                const isSelected = selectedEmailId === email.id;
                const isChecked = selectedIds.has(email.id);

                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmailId(isSelected ? null : email.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.35)] ring-1 ring-indigo-500'
                        : !email.isRead
                        ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-400/50'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectEmail(email.id, e as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-500 text-white font-bold animate-pulse">
                            ✓ Selected
                          </span>
                        )}
                        <span className="text-xs font-bold text-indigo-300">{email.fromName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border ${catBadge.style}`}>
                          {catBadge.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border ${prioBadge.style}`}>
                          {prioBadge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1">
                          {formatEmailDate(email.date)}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-1 truncate">{email.subject}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{email.snippet}</p>

                    {email.hasAttachments && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                          📎 {email.attachments?.length || 1} Attachment(s)
                        </span>
                        {email.attachments?.map((att, i) => (
                          <a
                            key={i}
                            href={`/api/emails/attachment?messageId=${email.id}&attachmentId=${att.id || ''}&filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/25 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1.5 transition-all hover:scale-105 font-medium truncate max-w-[240px]"
                            title={`Click to open/download ${att.filename}`}
                          >
                            <span>📄</span>
                            <span className="truncate">{att.filename}</span>
                            <span className="text-[9px] opacity-70">↗️</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Quick Row Action Bar if Selected */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-500/30 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => processTextCommand('read email')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 text-[11px] font-bold transition-all border border-indigo-500/40 flex items-center gap-1"
                        >
                          🔊 Read Aloud
                        </button>
                        <button
                          onClick={() => processTextCommand('summarize')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[11px] font-bold transition-all border border-cyan-500/40 flex items-center gap-1"
                        >
                          📧 Summarize
                        </button>
                        <button
                          onClick={() => {
                            const replyText = prompt(`Type reply to ${email.fromName}:`);
                            if (replyText) processTextCommand(`reply saying ${replyText}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 text-[11px] font-bold transition-all border border-purple-500/40 flex items-center gap-1"
                        >
                          ✍️ Reply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Commands */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
          <div className="text-2xl">🗣️</div>
          <h3 className="text-sm font-bold text-white">Quick Voice Shortcuts</h3>
          <p className="text-xs text-slate-400">
            {selectedEmail ? `Targeting: ${selectedEmail.fromName}` : 'Click any email row on the left to select it!'}
          </p>
          <button
            onClick={() => processTextCommand('summarize')}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs hover:bg-indigo-500/20 transition-all text-left flex items-center justify-between"
          >
            <span>📧 Summarize {selectedEmail ? 'selected' : 'latest'}</span>
            <span className="text-[10px] text-slate-400">→ speaks summary</span>
          </button>
          <button
            onClick={() => processTextCommand('read email')}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs hover:bg-cyan-500/20 transition-all text-left flex items-center justify-between"
          >
            <span>🔊 Read {selectedEmail ? 'selected' : 'latest'} email</span>
            <span className="text-[10px] text-slate-400">→ speaks full email</span>
          </button>
          <button
            onClick={() => fetchEmails()}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-xs hover:bg-purple-500/20 transition-all text-left flex items-center justify-between"
          >
            <span>🔄 Refresh &amp; Categorize</span>
            <span className="text-[10px] text-slate-400">→ syncs inbox now</span>
          </button>

          <div className="mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 block mb-1">💡 Row Selection:</strong>
            • Click any email card to select it.<br />
            • The selected email lights up with <strong className="text-indigo-300">✓ Selected</strong>.<br />
            • All voice &amp; text commands target your selected email!
          </div>
        </div>
      </div>

      {/* Move to Folder Modal */}
      {moveFolderModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              📁 Move {selectedIds.size} Email{selectedIds.size > 1 ? 's' : ''} to Folder
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter target folder or label name (e.g., "Work", "Finance", "Personal"). It will be created automatically if it doesn't exist.
            </p>
            <input
              type="text"
              value={targetFolderName}
              onChange={(e) => setTargetFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && targetFolderName.trim()) {
                  handleBatchAction('move', targetFolderName);
                }
              }}
              placeholder="Folder Name..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white mb-5 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setMoveFolderModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBatchAction('move', targetFolderName)}
                disabled={!targetFolderName.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow"
              >
                Move {selectedIds.size} Email{selectedIds.size > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
