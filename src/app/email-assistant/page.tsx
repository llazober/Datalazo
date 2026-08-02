"use client";

import React, { useEffect, useState } from 'react';

interface UserSession {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
}

export default function EmailAssistantPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session cookie or fetch auth status
    try {
      const match = document.cookie.match(new RegExp('(^| )user_session=([^;]+)'));
      if (match) {
        const decoded = JSON.parse(decodeURIComponent(match[2]));
        if (decoded?.email) setUser(decoded);
      }
    } catch {}

    // Fallback: fetch /auth/me or /api/auth/me
    fetch('/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) setUser(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col p-6 text-white bg-[#080c18] font-sans">
      {/* Top Navbar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            🎙️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Datalazo AI Executive Assistant</h1>
            <p className="text-xs text-slate-400">Intelligent, Voice-First Email & Calendar Companion</p>
          </div>
        </div>

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
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </a>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all">
          <div className="text-3xl mb-3">🎙️</div>
          <h3 className="text-base font-bold text-white mb-1">Voice-First Experience</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Hands-free email processing. Speak naturally to summarize, reply, or draft emails while working.
          </p>
          <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg inline-block ${
            user ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10'
          }`}>
            {user ? '🟢 Microphone & Voice Active' : 'Always-on listening'}
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-base font-bold text-white mb-1">GPT-4o Writing Style</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Learns your unique writing voice from sent mail to compose natural, professional responses.
          </p>
          <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg inline-block ${
            user ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-cyan-400 bg-cyan-500/10'
          }`}>
            {user ? '🟢 Style Trained from Sent Mail' : 'Style Memory Engine'}
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-base font-bold text-white mb-1">Smart Automation</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Set rule triggers to auto-archive noise, flag high priority messages, and schedule meetings.
          </p>
          <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg inline-block ${
            user ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-purple-400 bg-purple-500/10'
          }`}>
            {user ? '🟢 Inbox Rules Active' : 'Auto Rule Processing'}
          </span>
        </div>
      </div>

      {/* Connection Banner */}
      <div className={`max-w-6xl w-full mx-auto p-8 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
        user
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-slate-900/40 border-emerald-500/40'
          : 'bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900/40 border-indigo-500/30'
      }`}>
        <div>
          {user ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-400 font-bold text-lg">✅ Google Account Connected</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Your Gmail inbox and Google Calendar are actively synced. Voice commands, automated drafting, and scheduling are live for <strong className="text-white font-mono">{user.email}</strong>.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Ready to manage emails by voice?</h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Authenticate with Google to connect Gmail and Google Calendar securely. Your data stays protected.
              </p>
            </>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs hover:bg-emerald-500/30 transition-all flex items-center gap-2"
            >
              🔄 Sync Inbox Now
            </button>
          </div>
        ) : (
          <a
            href="/auth/google"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 transition-all text-center whitespace-nowrap"
          >
            Sign in with Google ➔
          </a>
        )}
      </div>
    </div>
  );
}
