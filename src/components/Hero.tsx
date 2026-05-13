"use client";

import React from 'react';
import { translations } from '@/lib/translations';

export default function Hero({ lang }: { lang: 'en' | 'es' }) {
  const t = translations[lang].hero;
  
  return (
    <section className="relative pt-56 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-bold tracking-widest uppercase mb-6">
            {t.tag}
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            {t.title} <br />
            <span className="gradient-text">{t.subtitle}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-10 py-5 bg-accent-cyan hover:bg-cyan-500 text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              {t.cta_primary}
            </button>
            <button className="px-10 py-5 glass hover:bg-white/10 font-bold rounded-full transition-all">
              {t.cta_secondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
