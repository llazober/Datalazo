"use client";

import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function InfoModal({ isOpen, onClose, title, content }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in zoom-in-95 fade-in duration-300">

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold uppercase italic tracking-tighter text-white">
            Intelligence <span className="text-cyan-500">Briefing</span>
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.3em]">
            {title}
          </p>
          <p className="text-slate-300 leading-relaxed font-medium">
            {content}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-cyan-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            Acknowledged
          </button>
        </div>
      </div>
    </div>
  );
}
