import Hero from "@/components/Hero";
import LeadForm from "@/components/LeadForm";
import Link from 'next/link';
import VoiceAgent from "@/components/VoiceAgent";

export default function Home() {
  const services = [
    { title: "AI Customer Service", desc: "Automate 90% of your customer queries with intelligent, context-aware AI agents.", icon: "💬" },
    { title: "Process Automation", desc: "Connect your tools and automate repetitive tasks using custom n8n workflows.", icon: "⚙️" },
    { title: "AI SEO Matrix", desc: "Rank higher with AI-optimized content and technical SEO that scales automatically.", icon: "🚀" },
    { title: "AI Voice Agents", desc: "Professional AI-driven voice systems for lead qualification and support.", icon: "🎙️" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo.png" alt="Datalazo Logo" className="w-32 h-32 rounded-[2rem] shadow-[0_0_40px_rgba(6,182,212,0.6)]" />
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#services" className="hover:text-accent-cyan transition-colors">Services</a>
            <a href="#automation" className="hover:text-accent-cyan transition-colors">Automation</a>
            <a href="#contact" className="hover:text-accent-cyan transition-colors">Contact</a>
          </nav>
          <Link href="/dashboard" className="px-5 py-2 glass text-sm font-semibold rounded-full hover:bg-white/10 transition-all">
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Intelligence Suite</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We deploy the latest in AI and automation to give your business a 
              competitive edge that never sleeps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="glass p-8 hover:bg-white/[0.05] transition-all">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Generation Section */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Ready to Automate?</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Join the new era of business. Tell us about your goals and our AI 
              will architect a custom automation roadmap for your company.
            </p>
            <ul className="space-y-4">
              {['Free AI Audit', 'Custom n8n Workflows', '24/7 Priority Support'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <LeadForm />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between gap-10 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Automated</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">AI Agents</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">5x</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Efficiency</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold">SEO+</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Growth Rank</div>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-slate-500 text-sm border-t border-white/5">
        &copy; 2026 Datalazo Intelligence Agency. All rights reserved.
      </footer>
      <VoiceAgent />
    </div>
  );
}
