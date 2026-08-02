"use client";

import React from 'react';

export default function EmailAssistantPage() {
  return (
    <div className="w-full h-full flex flex-col p-6 text-white bg-[#0a0a0c]">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              🎙️
            </span>
            AI Executive Email Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Voice-first intelligent email management powered by GPT-4o
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Active
          </span>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all">
          <div className="text-3xl mb-3">🎙️</div>
          <h3 className="text-base font-bold text-white mb-1">Voice Commands</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Hands-free email processing. Say &ldquo;Summarize&rdquo;, &ldquo;Reply&rdquo;, or &ldquo;Read full email&rdquo;.
          </p>
          <div className="text-[11px] text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1.5 rounded-lg inline-block">
            Always-on listening
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-base font-bold text-white mb-1">Writing Style Memory</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            AI learns your tone from sent emails and drafts personalized replies automatically.
          </p>
          <div className="text-[11px] text-cyan-400 font-mono bg-cyan-500/10 px-3 py-1.5 rounded-lg inline-block">
            GPT-4o Trained
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-base font-bold text-white mb-1">Automation Rules</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Auto-categorize inbox, flag urgent tasks, and process meeting requests seamlessly.
          </p>
          <div className="text-[11px] text-purple-400 font-mono bg-purple-500/10 px-3 py-1.5 rounded-lg inline-block">
            Auto Rules Active
          </div>
        </div>
      </div>

      {/* Gmail Auth Action Section */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900/40 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Connect Gmail & Google Calendar</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Sign in with Google to enable real-time inbox synchronization, automated drafting, and voice controls directly inside Datalazo.
          </p>
        </div>
        <a
          href="/auth/google"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] hover:scale-105 transition-all text-center whitespace-nowrap flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
