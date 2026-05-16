"use client";

import React from 'react';
import Link from 'next/link';

export default function AnalyticsDashboard() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/dashboard" className="text-xs font-bold text-cyan-500 hover:text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Overview
            </Link>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
              Visitor <span className="text-cyan-500">Analytics</span>
            </h1>
            <p className="text-slate-400">Tracking engine status and configuration.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Card */}
          <div className="glass p-10 border-l-4 border-cyan-500 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${measurementId ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  <div className={`w-2 h-2 rounded-full ${measurementId ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {measurementId ? 'Active' : 'Offline'}
                </div>
             </div>
             
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Tracking Engine</div>
             <h2 className="text-2xl font-bold uppercase italic tracking-tighter mb-6">Global <span className="text-cyan-400">Traffic Stream</span></h2>
             
             <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Measurement ID</p>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-cyan-400">
                    {measurementId || 'NOT_CONFIGURED'}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5">
                   <p className="text-sm text-slate-400 leading-relaxed">
                     The Google Analytics 4 (GA4) engine is currently integrated sitewide. It is tracking sessions, page views, and user interactions across all Datalazo matrix nodes.
                   </p>
                </div>
             </div>
          </div>

          {/* External Dashboard Card */}
          <div className="glass p-10 border-white/10 shadow-2xl flex flex-col justify-between">
            <div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Command Center</div>
               <h2 className="text-2xl font-bold uppercase italic tracking-tighter mb-6">Full <span className="text-indigo-400">Intelligence</span></h2>
               <p className="text-slate-400 mb-8">
                 Access the Google Analytics property dashboard to view real-time traffic maps, user demographics, and advanced behavior flow reports.
               </p>
            </div>
            
            <a 
              href="https://analytics.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all group"
            >
              <span className="font-black uppercase italic tracking-tighter">Open Google Dashboard</span>
              <svg className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l7 7m-7 7h18" />
              </svg>
            </a>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-12 glass p-8 border-white/5">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-600 mb-6">Technical Implementation</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-cyan-500 font-bold mb-2">01. Strategy</div>
                <p className="text-xs text-slate-500">Implemented using Next.js `afterInteractive` strategy to ensure zero impact on PageSpeed scores.</p>
              </div>
              <div>
                <div className="text-indigo-500 font-bold mb-2">02. Persistence</div>
                <p className="text-xs text-slate-500">Tracking persists through client-side navigations using standard Google gtag configuration.</p>
              </div>
              <div>
                <div className="text-purple-500 font-bold mb-2">03. Privacy</div>
                <p className="text-xs text-slate-500">Automated IP anonymization is active by default in the GA4 engine setup.</p>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
        }
      `}</style>
    </div>
  );
}
