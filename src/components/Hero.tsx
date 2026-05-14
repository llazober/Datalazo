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
          

        </div>
      </div>
    </section>
  );
}
