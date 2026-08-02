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
    // 1. Play Web Audio API notification chime
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }

    // 2. Play Web Speech API speech synthesis
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechTested, setSpeechTested] = useState(false);
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

        // Check for new emails that haven't been seen before
        if (knownIdsRef.current.size > 0) {
          const freshEmails = list.filter((m) => !knownIdsRef.current.has(m.id));
          if (freshEmails.length > 0) {
            const latest = freshEmails[0];
            const noticeText = `New email from ${latest.fromName}: ${latest.subject}`;
            setNewEmailNotice(`📩 ${noticeText}`);
            if (voiceEnabled) {
              playSpeechAlert(noticeText);
            }
          }
        }

        // Update known IDs set
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

  const handleTestVoice = () => {
    playSpeechAlert('Voice alerts are active. You will hear an audio notification when new emails arrive.');
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
            onClick={handleTestVoice}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/30 transition-all flex items-center gap-1.5"
          >
            🔊 {speechTested ? 'Voice Tested ✓' : 'Test Voice Alert'}
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
              Sign in with Google to view live inbox messages and automated voice alerts.
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

        {/* Right 1 Col: AI Voice Assistant Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-2">🎙️</div>
            <h3 className="text-sm font-bold text-white mb-1">Voice Alerts Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Web Audio chime & Speech Synthesis play spoken notifications when new emails arrive.
            </p>
            <button
              onClick={handleTestVoice}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-md hover:scale-102 transition-all flex items-center justify-center gap-2"
            >
              🔊 Click to Test Voice Speaker
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="text-sm font-bold text-white mb-1">GPT-4o Auto Summaries</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Incoming messages are continuously scanned and summarized in real time.
            </p>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg inline-block ${
              user ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-white/5'
            }`}>
              {user ? '🟢 AI Analysis Ready' : 'Requires Google Login'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
