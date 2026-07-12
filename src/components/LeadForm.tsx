"use client";

import React, { useState } from 'react';


export default function LeadForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());


    try {
      // Point to internal API instead of direct n8n URL to avoid CORS
      const WEBHOOK_URL = '/api/lead';
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="glass p-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">Request Received!</h3>
        <p className="text-slate-400 mb-8">Please check your email. We&apos;ve sent you a link to schedule your AI Audit and finalize your request.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-medium border border-white/10"
        >
          Close
        </button>
      </div>

    );
  }


  return (
    <div className="glass p-8 md:p-12">
      <h3 className="text-2xl font-bold mb-6">Scale Your Business Today</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            type="text"
            placeholder="Your Name"
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors"
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </div>
        <input
          name="company"
          type="text"
          placeholder="Company Name"
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors"
        />
        <select 
          name="service"
          required
          defaultValue=""
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors text-slate-400"
        >
          <option value="" disabled>Select a service</option>
          <option value="automation">Business Process Automation</option>
          <option value="ai-agents">AI Customer Service</option>
          <option value="seo">SEO & Marketing</option>
          <option value="full-stack">Full AI Digital Presence</option>
        </select>
        <textarea
          name="message"
          rows={4}
          placeholder="How can we help you?"
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors"
        />



        <button

          type="submit"
          disabled={status === 'loading'}
          className="w-full py-4 bg-gradient-to-r from-accent-cyan to-accent-indigo text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === 'loading' ? 'Processing...' : 'Submit Request'}
        </button>
        {status === 'error' && (
          <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
