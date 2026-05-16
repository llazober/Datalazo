"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LeadForm from "@/components/LeadForm";
import VoiceAgent from "@/components/VoiceAgent";

// --- CUSTOM V2 COMPONENTS (Inlined for speed and simplicity) ---

const NavV2 = () => (
  <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-black/50 backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link href="/v2" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Datalazo" width={50} height={50} className="rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        <span className="text-xl font-black tracking-tighter uppercase italic">Datalazo <span className="text-accent-cyan">AI</span></span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-slate-400">
        <a href="#outcomes" className="hover:text-accent-cyan transition-colors">Outcomes</a>
        <a href="#suite" className="hover:text-accent-cyan transition-colors">Suite</a>
        <a href="#industries" className="hover:text-accent-cyan transition-colors">Industries</a>
        <a href="#process" className="hover:text-accent-cyan transition-colors">Process</a>
        <Link href="/" className="px-5 py-2 border border-white/10 rounded-full hover:bg-white/5 transition-all">Back to V1</Link>
      </nav>
      <a href="#contact" className="px-6 py-2.5 bg-gradient-to-r from-accent-cyan to-accent-indigo text-black text-xs font-black uppercase tracking-widest rounded-full hover:opacity-90 transition-all shadow-xl">
        Get Audit
      </a>
    </div>
  </header>
);

const HeroV2 = () => (
  <section className="relative pt-40 pb-24 px-6 overflow-hidden">
    {/* Animated AI Network Background Effect */}
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-accent-cyan/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-accent-indigo/10 rounded-full blur-[100px] animate-bounce duration-[10s]" />
    </div>

    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-cyan text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
          </span>
          Next-Gen AI Infrastructure
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] animate-in fade-in slide-in-from-left duration-700">
          Transform Your <br />
          Business with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-white to-accent-indigo">AI Automation</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl animate-in fade-in slide-in-from-left duration-1000">
          We deploy intelligent AI agents, automation systems, and digital infrastructure that help businesses generate leads, automate operations, improve customer support, and scale faster — 24/7.
        </p>

        <div className="flex flex-wrap gap-4 pt-4 animate-in fade-in slide-in-from-bottom duration-1000">
          <a href="#contact" className="px-8 py-4 bg-accent-cyan text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-500 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            Schedule Free Consultation
          </a>
          <button onClick={() => document.getElementById('voice-trigger')?.click()} className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
            Talk to AI Specialist
          </button>
        </div>
      </div>

      <div className="relative group animate-in fade-in zoom-in duration-1000">
        {/* Mockup Dashboard / Visual Area */}
        <div className="relative glass p-4 rounded-[2rem] border-white/10 shadow-2xl overflow-hidden bg-black/40">
           <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan/10 to-transparent" />
           <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-[#0a0a0c]">
             {/* Animated Node UI */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full p-8 grid grid-cols-3 gap-4">
                   {[...Array(9)].map((_, i) => (
                     <div key={i} className="bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-between animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                        <div className="w-8 h-1 bg-accent-cyan/40 rounded" />
                        <div className="space-y-2">
                           <div className="w-full h-1 bg-white/10 rounded" />
                           <div className="w-2/3 h-1 bg-white/10 rounded" />
                        </div>
                     </div>
                   ))}
                   {/* Connection Lines */}
                   <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent animate-scan" />
                </div>
             </div>
             {/* Center AI Brain Icon */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                <svg className="w-12 h-12 text-accent-cyan animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
             </div>
           </div>
        </div>
        {/* Floating Stat Badges */}
        <div className="absolute -top-6 -right-6 glass p-6 rounded-2xl border-emerald-500/20 shadow-xl animate-bounce duration-[4s]">
           <div className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-1">Efficiency</div>
           <div className="text-2xl font-black text-white">+80%</div>
        </div>
        <div className="absolute -bottom-10 -left-6 glass p-6 rounded-2xl border-accent-cyan/20 shadow-xl animate-bounce duration-[5s]">
           <div className="text-[10px] uppercase font-black text-accent-cyan tracking-widest mb-1">Status</div>
           <div className="text-sm font-bold text-white flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-accent-cyan animate-ping" />
             AI Agents Active
           </div>
        </div>
      </div>
    </div>
  </section>
);

const Outcomes = () => (
  <section id="outcomes" className="py-24 px-6 relative border-y border-white/5 bg-white/[0.01]">
    <div className="max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
          What AI Can Do <br />
          <span className="text-accent-cyan">for Your Business</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Reduce Repetitive Work", desc: "Automate manual tasks and repetitive workflows to save time and increase efficiency.", icon: "⚙️" },
          { title: "Capture Leads 24/7", desc: "AI agents qualify leads, answer questions, and book appointments automatically.", icon: "🎯" },
          { title: "Improve Customer Support", desc: "Deliver instant multilingual support with intelligent AI assistants.", icon: "💬" },
          { title: "Scale Without Hiring", desc: "Expand operations using AI systems instead of increasing overhead.", icon: "📈" },
          { title: "Increase Online Visibility", desc: "AI-driven SEO systems designed to grow traffic and rankings automatically.", icon: "🚀" },
          { title: "Connect Your Business Systems", desc: "Integrate CRM, scheduling, support, and operations into one intelligent workflow.", icon: "🔗" }
        ].map((item, i) => (
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

const IntelligenceSuiteV2 = () => (
  <section id="suite" className="py-24 px-6 bg-black">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Our Intelligence <span className="text-accent-indigo">Suite</span></h2>
        <p className="text-slate-500 max-w-2xl mx-auto uppercase text-xs font-bold tracking-widest">Enterprise-grade AI systems designed to automate growth, operations, and customer engagement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {[
          { title: "AI Customer Support", desc: "Automate customer conversations with intelligent AI agents trained on your business.", icon: "💬" },
          { title: "AI Business Automation", desc: "Connect your business tools and automate workflows across your organization.", icon: "⚙️" },
          { title: "AI SEO Matrix", desc: "AI-powered SEO systems that increase visibility, rankings, and organic growth.", icon: "🚀" },
          { title: "AI Voice Agents", desc: "Professional AI voice assistants for lead qualification, customer service, and appointment booking.", icon: "🎙️" },
          { title: "AI Company Brain", desc: "Give your team instant access to company knowledge, documents, and operational intelligence.", icon: "🧠" },
          { title: "AI Sales Automation", desc: "Automatically follow up with leads using intelligent AI-driven workflows.", icon: "💰" }
        ].map((item, i) => (
          <div key={i} className="bg-[#050505] p-12 hover:bg-[#0a0a0c] transition-colors group">
            <div className="text-3xl mb-8">{item.icon}</div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic mb-4 group-hover:text-accent-cyan transition-colors">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm mb-8">{item.desc}</p>
            <div className="w-10 h-1 bg-white/10 group-hover:w-20 group-hover:bg-accent-cyan transition-all" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Industries = () => (
  <section id="industries" className="py-24 px-6 bg-white/[0.01]">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">AI Solutions Built <br /><span className="text-accent-cyan">For Your Industry</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: "Law Firms", desc: "Automated document intake & 24/7 lead qualification.", icon: "⚖️" },
          { name: "Restaurants", desc: "AI booking agents & automated customer support.", icon: "🍽️" },
          { name: "Medical Offices", desc: "HIPAA-ready appointment scheduling systems.", icon: "🏥" },
          { name: "Real Estate", desc: "Instant lead engagement & automated follow-ups.", icon: "🏠" },
          { name: "Manufacturing", desc: "Process automation & operational intelligence.", icon: "🏭" },
          { name: "E-Commerce", desc: "AI sales agents & automated abandoned cart recovery.", icon: "🛒" }
        ].map((item, i) => (
          <div key={i} className="glass p-8 group cursor-pointer hover:border-accent-cyan/50 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-2xl">{item.icon}</div>
              <h3 className="text-xl font-bold uppercase tracking-tight italic">{item.name}</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">{item.desc}</p>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan flex items-center gap-2">
              Learn More
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Process = () => (
  <section id="process" className="py-24 px-6 relative overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-center mb-20">How We <span className="text-accent-indigo">Transform</span> Your Business</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
        {/* Connector Line (Desktop) */}
        <div className="hidden lg:block absolute top-12 left-0 right-0 h-[1px] bg-white/10 -z-10" />
        
        {[
          { step: "01", title: "Discovery & AI Strategy", desc: "We analyze your business operations and identify automation opportunities." },
          { step: "02", title: "AI System Design", desc: "We build custom AI workflows, agents, and intelligent automation systems." },
          { step: "03", title: "Deployment & Integration", desc: "Your AI systems are integrated into your existing business operations." },
          { step: "04", title: "Optimization & Growth", desc: "We continuously optimize and improve performance as your business scales." }
        ].map((item, i) => (
          <div key={i} className="space-y-6">
            <div className="w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center text-3xl font-black italic shadow-2xl mx-auto lg:mx-0 group-hover:border-accent-cyan transition-all">
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

const SocialProof = () => (
  <section className="py-24 px-6 bg-accent-cyan/5 border-y border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
      <div className="lg:w-1/2">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-8">Businesses Are <br /><span className="text-accent-cyan">Moving to AI</span></h2>
        <div className="grid grid-cols-2 gap-8">
           {[
             { label: "Reduction in Repetitive Work", value: "80%" },
             { label: "Lead Response Automation", value: "24/7" },
             { label: "Faster Support Resolution", value: "Instant" },
             { label: "Operational Efficiency", value: "5x" }
           ].map((stat, i) => (
             <div key={i}>
                <div className="text-4xl font-black text-white mb-1 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-tight">{stat.label}</div>
             </div>
           ))}
        </div>
      </div>
      <div className="lg:w-1/2 w-full">
         <div className="glass p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
               <svg className="w-16 h-16 text-accent-cyan" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21M14.017 21H21.017M14.017 21V18M7 21L7 18C7 16.8954 7.89543 16 9 16H12C13.1046 16 14 16.8954 14 18V21M7 21H14M7 21V18M21 21H3V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V21Z" />
               </svg>
            </div>
            <p className="text-xl italic text-slate-300 mb-8 leading-relaxed">
              "Integrating Datalazo's AI Matrix into our operations felt like adding 10 expert employees overnight. Our lead conversion doubled in the first month."
            </p>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-indigo" />
               <div>
                  <div className="font-bold uppercase tracking-tight">Enterprise Client</div>
                  <div className="text-xs text-slate-500 uppercase font-black tracking-widest">Real Estate Director</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  </section>
);

const PricingPreview = () => (
  <section id="pricing" className="py-24 px-6 bg-black">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Flexible AI Solutions</h2>
        <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase">Intelligence levels built for your growth stage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { tier: "Starter", desc: "For small businesses starting with automation.", features: ["Basic CRM Sync", "1 AI Chat Agent", "Email Automation"], price: "799" },
          { tier: "Growth", desc: "Advanced AI systems for scaling companies.", features: ["Custom n8n Workflows", "Voice Agents", "Full AI SEO Matrix"], price: "2,499", popular: true },
          { tier: "Enterprise", desc: "Custom AI infrastructure and business operations.", features: ["Dedicated GPU Infrastructure", "Unlimited AI Agents", "Full Knowledge Base"], price: "5,000+" }
        ].map((plan, i) => (
          <div key={i} className={`glass p-12 flex flex-col justify-between relative ${plan.popular ? 'border-accent-cyan/50 ring-1 ring-accent-cyan/20' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-accent-cyan text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-lg">
                Most Deployed
              </div>
            )}
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight italic mb-4">{plan.tier}</h3>
              <p className="text-sm text-slate-400 mb-8">{plan.desc}</p>
              <ul className="space-y-4 mb-12">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-accent-cyan/20 flex items-center justify-center text-[8px] text-accent-cyan">✓</div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
               <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Starting At</div>
               <div className="text-4xl font-black tracking-tighter mb-8">${plan.price}</div>
               <a href="#contact" className={`block w-full py-4 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all ${plan.popular ? 'bg-accent-cyan text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                 Deploy This Plan
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-32 px-6 relative overflow-hidden bg-black">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-indigo/10 rounded-full blur-[100px] -z-10" />
    <div className="max-w-4xl mx-auto text-center space-y-10">
       <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
         Ready to Build an <br />
         <span className="text-accent-cyan">AI-Powered</span> Business?
       </h2>
       <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
         Let's transform your operations with intelligent automation and AI systems designed to scale.
       </p>
       <div className="flex flex-wrap justify-center gap-6 pt-4">
          <a href="#contact" className="px-10 py-5 bg-accent-cyan text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-500 transition-all shadow-[0_0_40px_rgba(6,182,212,0.3)]">
             Schedule Free Consultation
          </a>
          <button onClick={() => document.getElementById('voice-trigger')?.click()} className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
             Talk to an AI Specialist
          </button>
       </div>
    </div>
  </section>
);

export default function LandingV2() {
  return (
    <div className="bg-[#050505] text-white selection:bg-accent-cyan selection:text-black">
      <NavV2 />
      <HeroV2 />
      <Outcomes />
      <IntelligenceSuiteV2 />
      <Industries />
      <Process />
      <SocialProof />
      <PricingPreview />
      
      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-6">Connect with <br /><span className="text-accent-cyan">Intelligence</span></h2>
             <p className="text-slate-400 leading-relaxed mb-8">
                Ready to deploy the Matrix? Fill out the secure briefing form and our consultants will architect your AI roadmap within 24 hours.
             </p>
             <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">📧</div>
                   <div className="text-sm font-bold">consult@datalazo.ai</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">🌍</div>
                   <div className="text-sm font-bold">Global AI Operations</div>
                </div>
             </div>
          </div>
          <div className="glass p-10 relative">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-cyan/10 blur-[50px] -z-10" />
             <LeadForm />
          </div>
        </div>
      </section>

      <FinalCTA />

      <footer className="py-12 px-6 border-t border-white/5 text-center">
         <Image src="/logo.png" alt="Datalazo" width={40} height={40} className="mx-auto grayscale opacity-50 mb-6" />
         <p className="text-xs text-slate-500 uppercase font-black tracking-[0.3em]">
           Datalazo Intelligence Agency. v4.0 — Production Edition
         </p>
      </footer>

      {/* Voice Agent Integrated */}
      <div className="hidden" id="voice-trigger">
        <VoiceAgent />
      </div>
      <VoiceAgent />

      {/* Styles for scan animation */}
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6,182,212,0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
