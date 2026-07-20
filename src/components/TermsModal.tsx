"use client";

import React, { useState } from 'react';

interface TermsModalProps {
  onAccepted: () => void;
}

export default function TermsModal({ onAccepted }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/client-auth/accept-terms', {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to accept terms');
      }

      onAccepted();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020203]/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh]">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight italic text-white">
            Terms of Service & <span className="text-indigo-400">Agreement</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Please review and accept our agreement to unlock dashboard access.</p>
        </div>

        {/* Scrollable Terms Text */}
        <div className="flex-1 overflow-y-auto bg-black/40 border border-white/5 rounded-xl p-4 md:p-6 text-sm text-slate-300 space-y-4 mb-6 leading-relaxed select-none">
          <h3 className="font-bold text-white text-base">1. Acceptance of Terms</h3>
          <p>
            By checking the agreement box and accessing this platform, you agree to comply with and be bound by the following terms and conditions of use. If you disagree with any part of these terms, you may not access or use the application.
          </p>

          <h3 className="font-bold text-white text-base">2. Scope of Services</h3>
          <p>
            Datalazo LLC provides business automation, artificial intelligence processing tools, document analysis, and SEO strategy generation. The system performance and uptime depend on underlying cloud integrations and service APIs.
          </p>

          <h3 className="font-bold text-white text-base">3. Monthly Usage & Cost Allocation</h3>
          <p>
            Client usage of artificial intelligence capabilities (prompt and completion tokens) is monitored. Monthly token allocations, actual consumption, and usage metrics are displayed in real-time. Exceeding agreed thresholds may result in billing adjustments or service throttling.
          </p>

          <h3 className="font-bold text-white text-base">4. Data Processing and Privacy</h3>
          <p>
            Any documents, files, or information uploaded to the platform are processed using secure cloud networks. Datalazo LLC holds no liability for the content or errors derived from automated OCR processing or AI parsing pipelines.
          </p>

          <h3 className="font-bold text-white text-base">5. Governing Law</h3>
          <p>
            This agreement is governed by and construed in accordance with the local laws, without regard to conflict of law principles. Any legal proceedings arising from this service must be conducted in the jurisdiction of Datalazo LLC's registration.
          </p>
        </div>

        {/* Agreement Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/10 text-indigo-500 bg-white/5 focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer"
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
              I have read, understood, and accept the Terms of Service, User Agreement, and Monthly Usage policy. I authorize Datalazo LLC to record my agreement details (timestamp and IP address) for compliance audit trails.
            </span>
          </label>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!agreed || isSubmitting}
            className="w-full py-4 bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-30 disabled:shadow-none"
          >
            {isSubmitting ? 'Recording Agreement...' : 'Accept Agreement & Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
