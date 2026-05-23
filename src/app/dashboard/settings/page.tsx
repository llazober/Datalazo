"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [apifyApiKey, setApifyApiKey] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [models, setModels] = useState({
    voiceChat: 'gpt-4o-mini',
    outreach: 'gpt-4o-mini',
    proposal: 'gpt-4o',
    chat: 'gpt-4o-mini',
    seo: 'gpt-4o'
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSenderName(data.senderName || '');
          setSenderEmail(data.senderEmail || '');
          setAgencyName(data.agencyName || '');
          setApifyApiKey(data.apifyApiKey || '');
          setResendApiKey(data.resendApiKey || '');
          setStripeSecretKey(data.stripeSecretKey || '');
          setStripeWebhookSecret(data.stripeWebhookSecret || '');
          if (data.models) {
            setModels({
              voiceChat: data.models.voiceChat || 'gpt-4o-mini',
              outreach: data.models.outreach || 'gpt-4o-mini',
              proposal: data.models.proposal || 'gpt-4o',
              chat: data.models.chat || 'gpt-4o-mini',
              seo: data.models.seo || 'gpt-4o'
            });
          }
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
        body: JSON.stringify({
          senderName,
          senderEmail,
          agencyName,
          apifyApiKey,
          resendApiKey,
          stripeSecretKey,
          stripeWebhookSecret,
          models
        })
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
          <p className="text-slate-400">Manage your global agency variables, email configurations, and API integrations.</p>
        </div>
        <Link 
          href="/dashboard"
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="glass p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500" />
        
        {status === 'loading' ? (
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-white/10 rounded w-full"></div>
            <div className="h-10 bg-white/10 rounded w-full"></div>
            <div className="h-10 bg-white/10 rounded w-full"></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Section 1: Email Configuration */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Sender Configuration
              </h2>
              
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
                    placeholder="e.g. luis@datalazo.net"
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
            </div>

            {/* Section 2: API Credentials */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Marketing API Credentials (stored in datalazo.config.json)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Apify API Key</label>
                  <input 
                    type="password" 
                    value={apifyApiKey}
                    onChange={(e) => setApifyApiKey(e.target.value)}
                    placeholder="e.g. apify_api_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Leave empty to use global environment variables.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Resend API Key</label>
                  <input 
                    type="password" 
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="e.g. re_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Leave empty to use global environment variables.</p>
                </div>
              </div>
            </div>

            {/* Section 3: Stripe API Credentials */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Stripe Payments Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Stripe Secret Key</label>
                  <input 
                    type="password" 
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="e.g. sk_live_... / sk_test_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Stripe Private API Key. Leave empty to use system environment variables.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Stripe Webhook Secret</label>
                  <input 
                    type="password" 
                    value={stripeWebhookSecret}
                    onChange={(e) => setStripeWebhookSecret(e.target.value)}
                    placeholder="e.g. whsec_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Stripe Webhook signing secret. Leave empty to use system environment variables.</p>
                </div>
              </div>
            </div>

            {/* Section 4: AI Model Selection */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Models Routing & Options
              </h2>

              <p className="text-xs text-slate-400 mb-6 font-medium">
                Assign specific models to each AI feature. We support standard GPT-4o models, reasoning models, and early-access next-generation GPT-5 models.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Voice Agent Chat Model */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Voice Agent Chat Model</label>
                  <select 
                    value={models.voiceChat}
                    onChange={(e) => setModels({ ...models, voiceChat: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors text-slate-200"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Default, Ultra-Low Latency)</option>
                    <option value="gpt-4o">GPT-4o (High-Precision, Smart)</option>
                    <option value="o1-mini">o1 Mini (Advanced Reasoning)</option>
                    <option value="gpt-5-mini">GPT-5 Mini (Next-Gen Fast)</option>
                    <option value="gpt-5-preview">GPT-5 Preview (Next-Gen Reasoning)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Requires ultra-fast response speeds for active voice calls.</p>
                </div>

                {/* 2. Marketing Outreach Pitch Model */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Outreach Pitch Generation Model</label>
                  <select 
                    value={models.outreach}
                    onChange={(e) => setModels({ ...models, outreach: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors text-slate-200"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Default, Cost-Efficient)</option>
                    <option value="gpt-4o">GPT-4o (Advanced copywriting)</option>
                    <option value="o1-preview">o1 Preview (Reasoning-based copy)</option>
                    <option value="gpt-5-mini">GPT-5 Mini (Next-Gen Creative)</option>
                    <option value="gpt-5">GPT-5 (Next-Gen Full-Power)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Generates customized outreach cold emails for marketing leads.</p>
                </div>

                {/* 3. AI Lead Proposal Generator */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Proposal Generation Model</label>
                  <select 
                    value={models.proposal}
                    onChange={(e) => setModels({ ...models, proposal: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors text-slate-200"
                  >
                    <option value="gpt-4o">GPT-4o (Default, High Performance)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                    <option value="o1-preview">o1 Preview (Deep strategy)</option>
                    <option value="gpt-5">GPT-5 (Next-Gen Full-Power)</option>
                    <option value="gpt-5-preview">GPT-5 Preview (Next-Gen Logic)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Drafts custom agency proposals based on discovery inputs.</p>
                </div>

                {/* 4. Support Consultative Chat */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Public Consultative Chat Model</label>
                  <select 
                    value={models.chat}
                    onChange={(e) => setModels({ ...models, chat: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors text-slate-200"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Default, Cost-Efficient & Quick)</option>
                    <option value="gpt-4o">GPT-4o (Smart conversationalist)</option>
                    <option value="o1-mini">o1 Mini (High reasoning answers)</option>
                    <option value="gpt-5-mini">GPT-5 Mini (Next-Gen Conversational)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Handles public Q&A on the landing page.</p>
                </div>

                {/* 5. SEO Article Matrix Generator */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">SEO Article Matrix Generator</label>
                  <select 
                    value={models.seo}
                    onChange={(e) => setModels({ ...models, seo: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors text-slate-200"
                  >
                    <option value="gpt-4o">GPT-4o (Default, High Performance & Professional Formatting)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Quick & Cost-Effective)</option>
                    <option value="o1-preview">o1 Preview (Thorough structured layouts)</option>
                    <option value="gpt-5">GPT-5 (Next-Gen Full-Power Authoritative)</option>
                    <option value="gpt-5-preview">GPT-5 Preview (Next-Gen Reasoning SEO)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Generates comprehensive 1,000-word SEO-ready landing pages and blogs.</p>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Ensure sender email exactly matches your verified domain in Resend.com.
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
                Settings saved successfully! Central JSON configuration has been updated.
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
