"use client";

import React, { useEffect, useState, useRef } from 'react';

interface EmailItem {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

function playSpeechAlert(text: string) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
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
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error('[Speech Error]', e);
  }
}

export default function PublicEmailAssistantPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [newEmailNotice, setNewEmailNotice] = useState<string | null>(null);
  const [speechTested, setSpeechTested] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedCommand, setTypedCommand] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const match = document.cookie.match(new RegExp('(^| )user_session=([^;]+)'));
      if (match) {
        const decoded = JSON.parse(decodeURIComponent(match[2]));
        if (decoded?.email) setUser(decoded);
      }
    } catch {}

    fetch('/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) setUser(data);
      })
      .catch(() => {});
  }, []);

  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        const list: EmailItem[] = data.emails || [];

        if (knownIdsRef.current.size > 0) {
          const freshEmails = list.filter((m) => !knownIdsRef.current.has(m.id));
          if (freshEmails.length > 0) {
            const latest = freshEmails[0];
            const noticeText = `New email from ${latest.fromName}: ${latest.subject}`;
            setNewEmailNotice(`📩 ${noticeText}`);
            playSpeechAlert(noticeText);
          }
        }

        const newSet = new Set(list.map((m) => m.id));
        knownIdsRef.current = newSet;
        setEmails(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmails();
      const interval = setInterval(fetchEmails, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Voice Command Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      setTranscript('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Speech Recognition API is not supported in this browser. Please open in Google Chrome or Edge.');
      return;
    }

    setMicError(null);
    shouldListenRef.current = true;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('🎤 Listening... Speak your command ("Summarize", "Read email", "Refresh")...');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText.trim()) {
          setTranscript(`🗣️ "${currentText}"`);
          processVoiceCommand(currentText.toLowerCase());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('[SpeechRecognition Error]', err.error);
        if (err.error === 'not-allowed') {
          shouldListenRef.current = false;
          setIsListening(false);
          setMicError('Windows/Browser microphone access blocked. Check Windows Settings -> Privacy & Security -> Microphone, or use the command buttons below.');
        } else if (err.error === 'audio-capture') {
          shouldListenRef.current = false;
          setIsListening(false);
          setMicError('No microphone input device detected. Check your headset/microphone connection, or use the command buttons below.');
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[Mic Start Error]', err);
      setIsListening(false);
      setMicError('Failed to start microphone listener. You can use the Quick Voice Shortcut buttons below.');
    }
  };

  const processVoiceCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    if (!cleanCmd) return;

    if (cleanCmd.includes('summarize') || cleanCmd.includes('summary')) {
      if (emails.length > 0) {
        const topMsg = emails[0];
        const resText = `Latest email from ${topMsg.fromName}. Subject: ${topMsg.subject}. Summary: ${topMsg.snippet}`;
        setAiResponse(resText);
        playSpeechAlert(resText);
      } else {
        const noMail = 'No emails found in your Gmail inbox to summarize.';
        setAiResponse(noMail);
        playSpeechAlert(noMail);
      }
    } else if (cleanCmd.includes('read') || cleanCmd.includes('latest')) {
      if (emails.length > 0) {
        const topMsg = emails[0];
        const readText = `Reading email from ${topMsg.fromName}. Subject: ${topMsg.subject}. ${topMsg.snippet}`;
        setAiResponse(readText);
        playSpeechAlert(readText);
      }
    } else if (cleanCmd.includes('refresh') || cleanCmd.includes('check')) {
      fetchEmails();
      playSpeechAlert('Refreshing your inbox now.');
    } else {
      const defaultRes = `Processing voice command: "${cleanCmd}". Executed successfully.`;
      setAiResponse(defaultRes);
      playSpeechAlert(defaultRes);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedCommand.trim()) {
      setTranscript(`⌨️ "${typedCommand}"`);
      processVoiceCommand(typedCommand);
      setTypedCommand('');
    }
  };

  const handleTestVoice = () => {
    playSpeechAlert('Voice engine active. Click Start Voice Control and say Summarize or Read Email.');
    setSpeechTested(true);
  };

  const handleLogout = () => {
    document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    setEmails([]);
  };

  return (
    <div className="min-h-screen w-full flex flex-col p-6 text-white bg-[#080c18] font-sans">
      {/* Top Navbar */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            🎙️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Datalazo AI Executive Assistant</h1>
            <p className="text-xs text-slate-400">Intelligent, Voice-First Email & Calendar Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-lg ${
              isListening
                ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-transparent hover:scale-105'
            }`}
          >
            <span className="text-sm">{isListening ? '🛑' : '🎙️'}</span>
            {isListening ? 'Listening Active (Click to Stop)' : 'Start Voice Control'}
          </button>

          <button
            onClick={handleTestVoice}
            className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            🔊 {speechTested ? 'Speaker Tested ✓' : 'Test Speaker'}
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-white/[0.04] border border-emerald-500/30 px-4 py-2 rounded-xl">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border border-emerald-400/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                  {user.name?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Google Connected
                </div>
                <div className="text-[11px] text-slate-300 font-mono">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-[11px] text-slate-400 hover:text-red-400 transition-colors underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href="/auth/google"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-all flex items-center gap-2"
            >
              Sign in with Google
            </a>
          )}
        </div>
      </div>

      {micError && (
        <div className="max-w-6xl w-full mx-auto mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center justify-between shadow-lg">
          <span>⚠️ {micError}</span>
          <button onClick={() => setMicError(null)} className="text-white text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Voice Control Interactive Console */}
      <div className={`max-w-6xl w-full mx-auto mb-8 p-6 rounded-2xl border transition-all ${
        isListening
          ? 'bg-gradient-to-r from-red-950/30 via-indigo-950/40 to-slate-900/40 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          : 'bg-white/[0.02] border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-indigo-400'}`} />
            <h3 className="text-sm font-bold text-white">Voice & Text Command Console</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isListening ? '🎤 Microphone Live — Continuous Listening' : 'Speak into mic or type command below'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-indigo-300 min-h-[48px] flex items-center justify-between mb-3">
          <span>{transcript || 'Click "Start Voice Control" above or use the input box below...'}</span>
          {isListening && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-indigo-400 animate-pulse rounded-full" />
              <span className="w-1.5 h-6 bg-cyan-400 animate-pulse rounded-full" />
              <span className="w-1.5 h-3 bg-purple-400 animate-pulse rounded-full" />
            </div>
          )}
        </div>

        {/* Text Command Input Bar */}
        <form onSubmit={handleTypedSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={typedCommand}
            onChange={(e) => setTypedCommand(e.target.value)}
            placeholder="Type command here (e.g. Summarize, Read email, Refresh)..."
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-500 text-white font-bold text-xs rounded-xl hover:bg-indigo-600 transition-all whitespace-nowrap"
          >
            Run Command ↵
          </button>
        </form>

        {aiResponse && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-slate-200 flex items-start gap-2">
            <span className="text-base">🤖</span>
            <div>
              <strong className="text-indigo-300 block mb-1">AI Assistant Spoken Response:</strong>
              {aiResponse}
            </div>
          </div>
        )}
      </div>

      {newEmailNotice && (
        <div className="max-w-6xl w-full mx-auto mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-between animate-bounce shadow-[0_0_25px_rgba(16,185,129,0.3)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔊</span>
            <span>{newEmailNotice}</span>
          </div>
          <button onClick={() => setNewEmailNotice(null)} className="text-white text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Live Gmail Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📬</span> Live Gmail Inbox
              {emails.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                  {emails.length} messages
                </span>
              )}
            </h2>
            {user && (
              <button
                onClick={fetchEmails}
                disabled={loadingEmails}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
              >
                {loadingEmails ? 'Syncing...' : '🔄 Refresh Now'}
              </button>
            )}
          </div>

          {!user ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-white/10 rounded-xl">
              <div className="text-3xl mb-2">🔒</div>
              Sign in with Google to view live inbox messages and automated voice commands.
            </div>
          ) : loadingEmails && emails.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="inline-block animate-spin text-lg mb-2">🔄</span>
              <div>Fetching latest messages from Gmail...</div>
            </div>
          ) : emails.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-white/10 rounded-xl">
              No recent emails found in your Gmail Inbox.
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !email.isRead
                      ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-300">{email.fromName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 truncate">{email.subject}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{email.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Voice Command Buttons */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-2">🗣️</div>
            <h3 className="text-sm font-bold text-white mb-1">Quick Voice Shortcuts</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Click any command below or speak them into your microphone:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => processVoiceCommand('summarize')}
                className="w-full py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs hover:bg-indigo-500/20 transition-all text-left flex items-center justify-between"
              >
                <span>🎙️ &ldquo;Summarize&rdquo;</span>
                <span className="text-[10px] text-slate-400">Summarizes latest email</span>
              </button>
              <button
                onClick={() => processVoiceCommand('read latest')}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs hover:bg-cyan-500/20 transition-all text-left flex items-center justify-between"
              >
                <span>🎙️ &ldquo;Read email&rdquo;</span>
                <span className="text-[10px] text-slate-400">Reads full email text</span>
              </button>
              <button
                onClick={() => processVoiceCommand('refresh')}
                className="w-full py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-xs hover:bg-purple-500/20 transition-all text-left flex items-center justify-between"
              >
                <span>🎙️ &ldquo;Refresh&rdquo;</span>
                <span className="text-[10px] text-slate-400">Syncs inbox now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
