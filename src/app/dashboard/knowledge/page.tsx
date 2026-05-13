"use client";

import React, { useState } from 'react';

export default function KnowledgePage() {
  const [files, setFiles] = useState([
    { name: 'Price_List_2026.pdf', size: '1.2 MB', type: 'PDF', status: 'Indexed' },
    { name: 'Service_Catalog.docx', size: '850 KB', type: 'DOCX', status: 'Indexed' },
    { name: 'Onboarding_Process.txt', size: '12 KB', type: 'TXT', status: 'Processing' },
  ]);

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Knowledge Base</h1>
          <p className="text-slate-400">Upload manuals, price lists, and documentation to train your AI agents.</p>
        </div>
        <button className="px-6 py-3 bg-accent-cyan text-black font-bold rounded-xl hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          + Upload Document
        </button>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-accent-cyan/50 transition-all bg-white/[0.01] cursor-pointer group">
        <div className="w-16 h-16 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
           <svg className="w-8 h-8 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
           </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Drag & drop files here</h3>
        <p className="text-slate-500 text-sm">PDF, TXT, or DOCX (Max 10MB per file)</p>
      </div>

      {/* Document List */}
      <div className="glass overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-bold">Managed Documents</h3>
        </div>
        <div className="divide-y divide-white/5">
          {files.map((file, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl">
                  {file.type === 'PDF' ? '📄' : '📝'}
                </div>
                <div>
                  <div className="font-bold">{file.name}</div>
                  <div className="text-xs text-slate-500">{file.size} • {file.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  file.status === 'Indexed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {file.status}
                </span>
                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Memory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 border-l-4 border-accent-cyan">
          <div className="text-sm text-slate-400 mb-1">Knowledge Density</div>
          <div className="text-3xl font-bold">14.2k <span className="text-sm text-slate-500 font-normal">Vectors</span></div>
        </div>
        <div className="glass p-8 border-l-4 border-emerald-400">
          <div className="text-sm text-slate-400 mb-1">AI Accuracy</div>
          <div className="text-3xl font-bold">96.8%</div>
        </div>
        <div className="glass p-8 border-l-4 border-amber-400">
          <div className="text-sm text-slate-400 mb-1">Last Sync</div>
          <div className="text-3xl font-bold text-lg">2 hours ago</div>
        </div>
      </div>
    </div>
  );
}
