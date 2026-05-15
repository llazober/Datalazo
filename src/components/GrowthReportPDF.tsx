"use client";

import React from 'react';

interface PDFReportProps {
  metrics: {
    keywordsGained: number;
    contentPieces: number;
    avgRanking: number;
    conversionRate: string;
  };
  clientUrl?: string;
}

export default function GrowthReportPDF({ metrics, clientUrl }: PDFReportProps) {
  return (
    <div 
      id="datalazo-report-template"
      className="p-12 bg-white text-black w-[800px] font-sans"
      style={{ 
        position: 'absolute', 
        top: '0', 
        left: '0', 
        opacity: 0, 
        pointerEvents: 'none',
        zIndex: -1
      }}
    >

      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
            Datalazo <span className="text-cyan-600">Intelligence</span>
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            Monthly Growth Matrix Report
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase text-gray-400">Date Generated</p>
          <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
          <p className="text-xs font-black uppercase text-gray-400 mt-2">Target Domain</p>
          <p className="text-sm font-bold text-cyan-600">{clientUrl || 'Global Matrix'}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-12">
        <h2 className="text-xl font-black uppercase italic mb-4 border-l-4 border-cyan-600 pl-4">Executive ROI Summary</h2>
        <p className="text-gray-600 leading-relaxed">
          The following intelligence report summarizes the search performance and asset production for the current period. 
          Our AI-driven Growth Matrix has successfully expanded your search footprint and automated the production of high-authority content assets.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-xs font-black uppercase text-gray-400 mb-1">Keywords Gained</p>
          <p className="text-4xl font-black text-cyan-600 italic">+{metrics.keywordsGained}</p>
          <p className="text-xs text-gray-500 mt-2 italic">Active search footprint expansion</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-xs font-black uppercase text-gray-400 mb-1">Content Assets</p>
          <p className="text-4xl font-black text-black italic">{metrics.contentPieces}</p>
          <p className="text-xs text-gray-500 mt-2 italic">High-authority articles published</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-xs font-black uppercase text-gray-400 mb-1">Avg. Ranking</p>
          <p className="text-4xl font-black text-indigo-600 italic">#{metrics.avgRanking}</p>
          <p className="text-xs text-gray-500 mt-2 italic">Average Page 1 search position</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-xs font-black uppercase text-gray-400 mb-1">Conversion Rank</p>
          <p className="text-4xl font-black text-emerald-600 italic">{metrics.conversionRate}</p>
          <p className="text-xs text-gray-500 mt-2 italic">Lead generation efficiency</p>
        </div>
      </div>

      {/* Strategic Roadmap */}
      <div className="bg-black text-white p-10 rounded-3xl">
        <h3 className="text-lg font-black uppercase italic mb-4 text-cyan-400">Strategic Roadmap: Next 30 Days</h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <span className="text-cyan-400">▶</span> Technical Audit Shield will perform a deep-scan of the new content cluster.
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="text-cyan-400">▶</span> AI Architect will begin drafting the next 10 high-volume keywords.
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="text-cyan-400">▶</span> Conversion optimization will be applied to the top-performing articles.
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-gray-100 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
          Confidential Intelligence Report | Datalazo v3.6
        </p>
      </div>
    </div>
  );
}
