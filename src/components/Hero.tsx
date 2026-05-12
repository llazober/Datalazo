"use client";

import React from 'react';

export default function Hero() {
  return (
    <section className="relative pt-56 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Automate Your Business <br />
            <span className="gradient-text">Empower Your Growth</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Datalazo integrates cutting-edge AI agents, automated workflows, and 
            advanced SEO to scale your online presence while you focus on what matters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-accent-cyan hover:bg-cyan-500 text-black font-semibold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Get Started
            </button>
            <button className="px-8 py-4 glass hover:bg-white/10 font-semibold rounded-full transition-all">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "AI Agents", desc: "24/7 intelligent customer engagement." },
            { title: "Smart Workflows", desc: "Zero-labor business process automation." },
            { title: "SEO Matrix", desc: "AI-driven organic growth strategy." }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 group hover:border-accent-cyan/50 transition-colors">
              <h3 className="text-xl font-bold mb-3 group-hover:text-accent-cyan transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
