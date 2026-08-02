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

export default function PublicEmailAssistantPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [newEmailNotice, setNewEmailNotice] = useState<string | null>(null);
  const prevEmailCount = useRef<number>(0);

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
        setEmails(list);

        if (prevEmailCount.current > 0 && list.length > prevEmailCount.current) {
          const latest = list[0];
          setNewEmailNotice(`📩 New Email: "${latest.subject}" from ${latest.fromName}`);
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`New email received from ${latest.fromName}: ${latest.subject}`);
            window.speechSynthesis.speak(utterance);
          }
        }
        prevEmailCount.current = list.length;
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
      const interval = setInterval(fetchEmails, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    setEmails([]);
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

      {newEmailNotice && (
        <div className="max-w-6xl w-full mx-auto mb-6 p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-bold text-xs flex items-center justify-between animate-bounce">
          <span>{newEmailNotice}</span>
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
              Sign in with Google to view live inbox messages and automated AI summaries.
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

        {/* Right 1 Col: AI Voice Assistant Modules */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-2">🎙️</div>
            <h3 className="text-sm font-bold text-white mb-1">Voice Notifications</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Spoken alerts automatically play when a new email arrives in your connected Gmail account.
            </p>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg inline-block ${
              user ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-white/5'
            }`}>
              {user ? '🟢 Speech Synthesis Live' : 'Requires Google Login'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="text-sm font-bold text-white mb-1">GPT-4o Auto Summaries</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Incoming test emails are instantly analyzed for action items, meeting requests, and sentiment.
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
