"use client";

import Link from 'next/link';
import UsageDashboard from '@/components/UsageDashboard';

export default function UsagePage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Overview
        </Link>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2 text-white">
          Intelligence <span className="text-indigo-400">Consumption Matrix</span>
        </h1>
        <p className="text-slate-400">Detailed breakdown of AI processing, token usage, and agency cost efficiency.</p>
      </div>

      <UsageDashboard />

      <div className="glass p-8 border-white/5 bg-white/[0.01]">
        <h3 className="text-lg font-bold mb-4 uppercase italic text-slate-300">Operational Notes</h3>
        <ul className="space-y-4 text-sm text-slate-500">
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">▶</span>
            <span>Usage is calculated in real-time based on actual tokens returned by the OpenAI API.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">▶</span>
            <span>Costs are estimates based on GPT-4o ($5/$15) and GPT-4o-mini ($0.15/$0.60) pricing tiers per 1M tokens.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-indigo-400 font-bold">▶</span>
            <span>Token consumption includes both prompt context (Knowledge Base) and AI completion output.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
