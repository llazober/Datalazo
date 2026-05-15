"use client";

import React, { useState } from 'react';
import GrowthReportPDF from './GrowthReportPDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GrowthMetrics {
  keywordsGained: number;
  contentPieces: number;
  avgRanking: number;
  conversionRate: string;
}

export default function GrowthReport({ metrics, onInfo }: { metrics: GrowthMetrics, onInfo: (title: string, content: string) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      console.log('Starting PDF generation...');
      const element = document.getElementById('datalazo-report-template');
      if (!element) {
        console.error('PDF template not found');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
      });
      
      console.log('Canvas generated, creating PDF...');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Datalazo_ROI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('PDF saved successfully');
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
      {/* Hidden PDF Template */}
      <GrowthReportPDF metrics={metrics} />


      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase italic tracking-tighter">Growth <span className="text-accent-cyan">Intelligence</span></h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">Module 04 Output • Confidential</p>
        </div>
        <button 
          onClick={generatePDF}
          disabled={isGenerating}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-white/10 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Export PDF'}
        </button>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Keywords Gained', value: `+${metrics.keywordsGained}`, color: 'text-emerald-400', info: 'KEYWORDS GAINED: This tracks your search footprint expansion. For every primary keyword we target, our Matrix helps you rank for 4+ related terms naturally.' },
          { label: 'Content Pieces', value: metrics.contentPieces, color: 'text-white', info: 'CONTENT PIECES: This is your asset library. Each article is a digital asset that works 24/7 to capture search traffic and build brand authority.' },
          { label: 'Avg. Ranking', value: `#${metrics.avgRanking}`, color: 'text-cyan-400', info: 'AVG. RANKING: This is the average position of your business on Google. We optimize your content to move this number closer to #1.' },
          { label: 'Conversion', value: metrics.conversionRate, color: 'text-indigo-400', info: 'CONVERSION RATE: This is your revenue efficiency. We target high-intent keywords to ensure visitors turn into high-value leads.' },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => onInfo(stat.label, stat.info)}
            className="space-y-1 cursor-help hover:bg-white/5 p-2 rounded-xl transition-all"
          >
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color} italic tracking-tighter`}>{stat.value}</p>
          </div>
        ))}

      </div>


      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent-cyan to-accent-indigo w-[85%] shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
          </div>
          <span className="text-xs font-black text-accent-cyan">85% OPTIMIZED</span>
        </div>
      </div>
    </div>
  );
}
