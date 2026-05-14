"use client";

import React from 'react';

interface SEORoadmapProps {
  lang: 'en' | 'es';
  content: any;
}

export default function SEORoadmap({ lang, content }: SEORoadmapProps) {
  const t = content;

  return (
    <section id="automation" className="py-24 px-6 bg-[#050505]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center md:text-left">
          <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-6">
            {t.tag}
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-6">
            {t.title} <span className="text-cyan-500">{t.subtitle}</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto md:mx-0 leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* Roadmap Steps */}
        <div className="grid grid-cols-1 gap-8">
          {t.phases.map((phase: any, index: number) => (
            <div 
              key={index}
              className={`glass p-10 border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden`}
            >
              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl font-black ${
                  index === 0 ? 'bg-cyan-500/20 text-cyan-400' : 
                  index === 1 ? 'bg-indigo-500/20 text-indigo-400' : 
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {phase.id}
                </div>
                <div>
                  <h3 className={`text-2xl font-bold mb-4 uppercase italic transition-colors ${
                    index === 0 ? 'group-hover:text-cyan-400' : 
                    index === 1 ? 'group-hover:text-indigo-400' : 
                    'group-hover:text-purple-400'
                  }`}>
                    {phase.title}
                  </h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    {phase.desc}
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.features.map((feature: string, fIndex: number) => (
                      <li key={fIndex} className="flex items-center gap-3 text-sm text-slate-300">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          index === 0 ? 'bg-cyan-500' : 
                          index === 1 ? 'bg-indigo-500' : 
                          'bg-purple-500'
                        }`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Subtle accent background decoration */}
              <div className={`absolute -right-20 -bottom-20 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${
                index === 0 ? 'bg-cyan-500' : 
                index === 1 ? 'bg-indigo-500' : 
                'bg-purple-500'
              }`} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 p-12 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-3xl border border-white/5 text-center">
          <h2 className="text-3xl font-bold mb-4 italic uppercase">{t.cta.title}</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            {t.cta.desc}
          </p>
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-12 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            {t.cta.button}
          </button>
        </div>
      </div>
    </section>
  );
}
