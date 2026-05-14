"use client";

import React from 'react';

export default function SEOPlanPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-6">
            Module 04: Growth Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-6">
            AI SEO <span className="text-cyan-500">Matrix</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            A self-operating growth system that monitors keywords, generates optimized content, and automates technical SEO to dominate search results.
          </p>
        </div>

        {/* Roadmap Steps */}
        <div className="space-y-12">
          {/* Phase 1 */}
          <div className="glass p-10 border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-16 h-16 shrink-0 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center text-3xl font-black">
                01
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-cyan-400 transition-colors uppercase italic">Intelligence & Discovery</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  We integrate your domain with the search intelligence grid. The AI identifies "Low-Hanging Fruit" keywords that your business can rank for instantly.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Automated Keyword Research
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Competitor Gap Analysis
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="glass p-10 border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-16 h-16 shrink-0 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl font-black">
                02
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-400 transition-colors uppercase italic">Automated Content Engine</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  The AI doesn't just write; it architecturally constructs content that Google loves. It uses your unique Knowledge Base to ensure every article is expert-level and factual.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Semantic Keyword Clustering
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Auto-Formatted H1-H4 Tags
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="glass p-10 border-purple-500/10 hover:border-purple-500/30 transition-all group">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-16 h-16 shrink-0 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-3xl font-black">
                03
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors uppercase italic">Technical Optimization Shield</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Continuous monitoring of your site's health. The Matrix fixes technical errors, optimizes meta descriptions, and updates internal links in real-time.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Automated JSON-LD Schema
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Weekly Content Refreshing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 p-12 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-3xl border border-white/5 text-center">
          <h2 className="text-3xl font-bold mb-4 italic uppercase">Unlock the Matrix</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Ready to deploy the Growth Engine for your brand? Contact our lead consultants to activate Module 04.
          </p>
          <button 
            onClick={() => window.location.href = '/#contact'}
            className="px-12 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            Activate Now
          </button>
        </div>
      </div>
    </div>
  );
}
