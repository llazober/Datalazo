"use client";

import React from 'react';

interface ServiceDetail {
  title: string;
  icon: string;
  explanation: string;
  examples: string[];
  benefits: string[];
}

const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  "AI Customer Service": {
    title: "AI Customer Service",
    icon: "💬",
    explanation: "Our context-aware AI agents act as the digital brain of your company. They learn your business from your website, documents, and past tickets to provide instant, human-like support 24/7.",
    examples: [
      "Automatically answering 90% of repeat tickets within seconds.",
      "Multi-language support allowing you to expand globally without hiring.",
      "Seamless hand-off to human agents for complex issues."
    ],
    benefits: [
      "90% reduction in response time",
      "24/7 Availability",
      "Drastic reduction in support costs"
    ]
  },
  "Atención al Cliente IA": {
    title: "Atención al Cliente IA",
    icon: "💬",
    explanation: "Nuestros agentes de IA conscientes del contexto actúan como el cerebro digital de su empresa. Aprenden de su sitio web y documentos para brindar soporte instantáneo las 24 horas, los 7 días de la semana.",
    examples: [
      "Respuesta automática al 90% de los tickets repetidos en segundos.",
      "Soporte multilingüe para expandirse globalmente sin contrataciones adicionales.",
      "Traspaso fluido a agentes humanos para problemas complejos."
    ],
    benefits: [
      "Reducción del 90% en el tiempo de respuesta",
      "Disponibilidad 24/7",
      "Reducción drástica en costos de soporte"
    ]
  },
  "Process Automation": {
    title: "Process Automation",
    icon: "⚙️",
    explanation: "We build custom n8n workflows that connect your favorite tools (CRM, Email, Slack, etc.) to eliminate manual data entry and repetitive busywork.",
    examples: [
      "Auto-syncing leads from social media directly into your CRM and Slack.",
      "Automated follow-up sequences based on user behavior.",
      "Invoice generation and payment tracking without manual intervention."
    ],
    benefits: [
      "Save 20+ hours per week",
      "Zero human error in data entry",
      "Scale operations without adding headcount"
    ]
  },
  "Automatización de Procesos": {
    title: "Automatización de Procesos",
    icon: "⚙️",
    explanation: "Creamos flujos de trabajo personalizados de n8n que conectan sus herramientas favoritas para eliminar el ingreso manual de datos y el trabajo repetitivo.",
    examples: [
      "Sincronización automática de leads desde redes sociales a su CRM.",
      "Secuencias de seguimiento automatizadas según el comportamiento del usuario.",
      "Generación de facturas y seguimiento de pagos sin intervención manual."
    ],
    benefits: [
      "Ahorre más de 20 horas por semana",
      "Cero errores humanos",
      "Escale sin aumentar el personal"
    ]
  },
  "AI SEO Matrix": {
    title: "AI SEO Matrix",
    icon: "🚀",
    explanation: "An automated SEO engine that creates high-ranking content and monitors your competition to ensure you stay at the top of Google results.",
    examples: [
      "Automatic blog generation based on trending industry keywords.",
      "AI-driven internal linking and technical SEO audits.",
      "Automated competitor analysis and content gap reports."
    ],
    benefits: [
      "Consistent organic traffic growth",
      "Automated content production",
      "Data-driven ranking strategy"
    ]
  },
  "Matriz SEO IA": {
    title: "Matriz SEO IA",
    icon: "🚀",
    explanation: "Un motor de SEO automatizado que crea contenido de alto rango y monitorea a su competencia para asegurar que se mantenga en la cima de los resultados.",
    examples: [
      "Generación automática de blogs basada en palabras clave de tendencia.",
      "Auditorías técnicas de SEO y enlaces internos impulsados por IA.",
      "Informes de brechas de contenido y análisis de competidores automatizados."
    ],
    benefits: [
      "Crecimiento constante del tráfico orgánico",
      "Producción de contenido automatizada",
      "Estrategia de ranking basada en datos"
    ]
  },
  "AI Voice Agents": {
    title: "AI Voice Agents",
    icon: "🎙️",
    explanation: "Professional-grade AI voice systems that can place outbound calls for lead qualification or handle inbound support with near-human latency.",
    examples: [
      "Calling new leads within 60 seconds to qualify them and book meetings.",
      "Handling thousands of inbound support calls simultaneously.",
      "Multi-lingual agents for global customer outreach."
    ],
    benefits: [
      "Instant lead engagement",
      "100% call recording and analysis",
      "24/7 Phone support without call centers"
    ]
  },
  "Agentes de Voz IA": {
    title: "Agentes de Voz IA",
    icon: "🎙️",
    explanation: "Sistemas de voz de IA de grado profesional que pueden realizar llamadas salientes para calificar leads o manejar soporte entrante con latencia casi humana.",
    examples: [
      "Llamar a nuevos leads en menos de 60 segundos para calificarlos.",
      "Manejar miles de llamadas de soporte simultáneamente.",
      "Agentes multilingües para alcance global."
    ],
    benefits: [
      "Compromiso instantáneo con el lead",
      "Grabación y análisis del 100% de las llamadas",
      "Soporte telefónico 24/7 sin centros de llamadas"
    ]
  }
};

interface ModalProps {
  serviceTitle: string;
  onClose: () => void;
}

export default function ServiceEducationModal({ serviceTitle, onClose }: ModalProps) {
  const detail = SERVICE_DETAILS[serviceTitle];

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 md:p-12">
          <div className="flex items-center gap-6 mb-10">
            <div className="text-6xl bg-white/5 w-24 h-24 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              {detail.icon}
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic">
                {detail.title}
              </h2>
              <div className="h-1 w-20 bg-accent-cyan mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-accent-cyan mb-4">The Solution</h4>
                <p className="text-slate-300 leading-relaxed text-lg">
                  {detail.explanation}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-accent-cyan mb-4">Core Benefits</h4>
                <ul className="space-y-3">
                  {detail.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Real-World Use Cases
                </h4>
                <ul className="space-y-6">
                  {detail.examples.map((ex, i) => (
                    <li key={i} className="space-y-1">
                      <p className="text-sm text-slate-200 leading-relaxed italic">
                        "{ex}"
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => {
                  onClose();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-4 bg-gradient-to-r from-accent-cyan to-accent-indigo text-black font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-xl"
              >
                Get Started with this Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
