"use client";

import React, { useState } from 'react';
import Hero from "@/components/Hero";
import LeadForm from "@/components/LeadForm";
import Link from 'next/link';
import VoiceAgent from "@/components/VoiceAgent";
import ServiceEducationModal from "@/components/ServiceEducationModal";
import SEORoadmap from "@/components/SEORoadmap";
import { translations } from '@/lib/translations';

export default function Home() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const t = translations[lang];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Education Modal */}
      {selectedService && (
        <ServiceEducationModal 
          serviceTitle={selectedService} 
          onClose={() => setSelectedService(null)} 
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Datalazo Logo" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:scale-105 transition-transform" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#services" className="hover:text-accent-cyan transition-colors">{t.nav.services}</a>
            <a href="#automation" className="hover:text-accent-cyan transition-colors">{t.nav.automation}</a>
            <a href="#contact" className="hover:text-accent-cyan transition-colors">{t.nav.contact}</a>
            
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            
            <div className="flex gap-2">
              <button 
                onClick={() => setLang('en')}
                className={`w-8 h-8 rounded-full border transition-all ${lang === 'en' ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' : 'border-white/5 text-slate-500'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('es')}
                className={`w-8 h-8 rounded-full border transition-all ${lang === 'es' ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' : 'border-white/5 text-slate-500'}`}
              >
                ES
              </button>
            </div>
          </nav>

          <Link href="/dashboard" className="px-6 py-2.5 bg-accent-cyan text-black text-sm font-black uppercase tracking-widest rounded-full hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            {t.nav.dashboard}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <Hero lang={lang} />

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t.services.title}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t.services.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.services.list.map((s, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedService(s.title)}
                className="glass p-8 hover:bg-white/[0.05] transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-accent-cyan transition-colors">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                <div className="mt-4 text-[10px] font-bold text-accent-cyan uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to learn more
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Roadmap Section */}
      <SEORoadmap lang={lang} content={t.seo_roadmap} />

      {/* Lead Generation Section */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">{t.contact.title}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              {t.contact.description}
            </p>
            <ul className="space-y-4">
              {t.contact.features.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-8">
             <h3 className="text-2xl font-bold mb-6 text-center">{t.contact.form_title}</h3>
             <LeadForm />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between gap-10 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">{t.stats.automated}</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">{t.stats.agents}</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">5x</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">{t.stats.efficiency}</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">SEO+</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">{t.stats.growth}</div>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-slate-500 text-sm border-t border-white/5">
        &copy; 2026 {t.footer}
      </footer>
      <VoiceAgent />
    </div>
  );
}

 
