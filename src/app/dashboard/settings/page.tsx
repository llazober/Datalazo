"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSenderName(data.senderName || '');
          setSenderEmail(data.senderEmail || '');
          setAgencyName(data.agencyName || '');
        }
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName, senderEmail, agencyName })
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Settings</h1>
          <p className="text-slate-400">Manage your global agency variables and email configuration.</p>
        </div>
        <Link 
          href="/dashboard"
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
        >
          ← Back to Leads
        </Link>
      </div>

      <div className="glass p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500" />
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Sender Configuration
        </h2>
        
        {status === 'loading' ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-10 bg-white/10 rounded w-full"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Sender Name</label>
                <input 
                  type="text" 
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Luis Lazo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Sender Email (Verified in Resend)</label>
                <input 
                  type="email" 
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. luis@nelsonmar.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Agency Name</label>
                <input 
                  type="text" 
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Datalazo Intelligence"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Ensure the Sender Email exactly matches your verified domain in Resend.com.
              </p>
              <button 
                type="submit"
                disabled={status === 'saving'}
                className="px-8 py-3 bg-fuchsia-500 text-white font-black uppercase rounded-xl hover:bg-fuchsia-400 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] disabled:opacity-50 flex items-center gap-2"
              >
                {status === 'saving' ? 'Saving...' : '💾 Save Settings'}
              </button>
            </div>
            
            {status === 'success' && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold text-center animate-in fade-in">
                Settings saved successfully! All automated emails will now use this sender.
              </div>
            )}
            {status === 'error' && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold text-center animate-in fade-in">
                Failed to save settings. Please try again.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
