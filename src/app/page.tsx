"use client";
// v3.8 - HYBRID UPGRADE: 2026-05-16

import React, { useState } from 'react';
import Hero from "@/components/Hero";
import LeadForm from "@/components/LeadForm";
import Link from 'next/link';
import VoiceAgent from "@/components/VoiceAgent";
import ServiceEducationModal from "@/components/ServiceEducationModal";
import Image from 'next/image';
import { translations } from '@/lib/translations';

// --- HYBRID SECTIONS ---

const OutcomesV2 = ({ t }: { t: any }) => (
  <section id="outcomes" className="py-24 px-6 relative border-y border-white/5 bg-white/[0.01]">
    <div className="max-w-7xl mx-auto">
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
          {t.outcomes.title} <br />
          <span className="text-accent-cyan">{t.outcomes.subtitle}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.outcomes.list.map((item: any, i: number) => (
          <div key={i} className="glass p-10 hover:bg-white/[0.05] transition-all group">
            <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
            <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">{item.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ProcessV2 = ({ t }: { t: any }) => (
  <section id="process" className="py-24 px-6 relative overflow-hidden bg-white/[0.01] border-b border-white/5">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-center mb-12 md:mb-20">{t.process.title} <span className="text-accent-indigo">{t.process.highlight}</span> {t.process.subtitle}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
        <div className="hidden lg:block absolute top-12 left-0 right-0 h-[1px] bg-white/10 -z-10" />
        
        {t.process.list.map((item: any, i: number) => (
          <div key={i} className="space-y-6">
            <div className="w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center text-3xl font-black italic shadow-2xl mx-auto lg:mx-0 group">
              {item.step}
            </div>
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-bold uppercase tracking-tight italic mb-3">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default function Home() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[lang];

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-accent-cyan selection:text-black">
      {/* Education Modal */}
      {selectedService && (
        <ServiceEducationModal 
          serviceTitle={selectedService} 
          onClose={() => setSelectedService(null)}
          t={t}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Datalazo Logo" 
              width={80} 
              height={80}
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.2)] hover:scale-110 transition-transform z-50 bg-orange-500 p-2" 
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-slate-400">
            <a href="#outcomes" className="hover:text-accent-cyan transition-colors">Outcomes</a>
            <a href="#services" className="hover:text-accent-cyan transition-colors">{t.nav.services}</a>
            <a href="#process" className="hover:text-accent-cyan transition-colors">Process</a>
            <a href="#contact" className="hover:text-accent-cyan transition-colors">{t.nav.contact}</a>

            <div className="flex gap-2 ml-4">
              <button onClick={() => setLang('en')} className={`px-2 py-1 rounded border ${lang === 'en' ? 'border-accent-cyan text-accent-cyan' : 'border-white/10 text-slate-500'}`}>EN</button>
              <button onClick={() => setLang('es')} className={`px-2 py-1 rounded border ${lang === 'es' ? 'border-accent-cyan text-accent-cyan' : 'border-white/10 text-slate-500'}`}>ES</button>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:block px-6 py-2.5 bg-accent-cyan text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-cyan-500 transition-all shadow-xl">
              {t.nav.dashboard}
            </Link>
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0c] border-b border-white/10 p-6 animate-in slide-in-from-top duration-300 shadow-2xl">
            <nav className="flex flex-col gap-6 text-lg font-bold">
              <a href="#outcomes" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-accent-cyan uppercase italic">Outcomes</a>
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-accent-cyan uppercase italic">{t.nav.services}</a>
              <a href="#process" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-accent-cyan uppercase italic">Process</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-accent-cyan uppercase italic">{t.nav.contact}</a>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-accent-cyan uppercase italic">{t.nav.dashboard}</Link>
              
              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button 
                  onClick={() => { setLang('en'); setIsMenuOpen(false); }} 
                  className={`flex-1 py-2 rounded border ${lang === 'en' ? 'border-accent-cyan text-accent-cyan' : 'border-white/10 text-slate-500'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => { setLang('es'); setIsMenuOpen(false); }} 
                  className={`flex-1 py-2 rounded border ${lang === 'es' ? 'border-accent-cyan text-accent-cyan' : 'border-white/10 text-slate-500'}`}
                >
                  ES
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <Hero lang={lang} />

      {/* Outcomes Section */}
      <OutcomesV2 t={t} />

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 italic uppercase tracking-tighter">{t.services.title}</h2>
            <p className="text-slate-500 max-w-xl mx-auto uppercase text-[10px] font-black tracking-widest">
              {t.services.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {t.services.list.map((s, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedService(s.title)}
                className="glass p-8 hover:bg-white/[0.05] transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-accent-cyan transition-colors uppercase tracking-tight italic">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                <div className="mt-4 text-[10px] font-bold text-accent-cyan uppercase tracking-widest opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <span>{t.services.learn_more}</span>
                  <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <ProcessV2 t={t} />


      {/* Lead Generation Section */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-6">{t.contact.title}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              {t.contact.description}
            </p>
            <ul className="space-y-4">
              {t.contact.features.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan text-[10px] font-bold">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-10 relative">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-cyan/10 blur-[50px] -z-10" />
             <LeadForm />
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/5 text-center">
         <Image src="/logo.png" alt="Datalazo" width={40} height={40} className="mx-auto grayscale opacity-50 mb-6" />
         <p className="text-xs text-slate-600 uppercase font-black tracking-[0.3em]">
           {t.footer}
         </p>
      </footer>

      <VoiceAgent />
    </div>
  );
}
