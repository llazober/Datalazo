"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function BookingContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('id');

  useEffect(() => {
    // 1. Load Calendly Widget Script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // 2. Listen for Calendly Events to update CRM
    const handleCalendlyEvent = async (e: any) => {
      if (e.data.event === 'calendly.event_scheduled' && leadId) {
        console.log('Meeting Scheduled! Updating CRM...');
        try {
          await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              leadId, 
              date: new Date().toISOString(), 
              timeSlot: 'Calendly Booking' 
            }),
          });
        } catch (err) {
          console.error('Failed to sync booking to CRM:', err);
        }
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, [leadId]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase italic">
          Schedule Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">AI Audit</span>
        </h1>
        <p className="text-slate-400 text-lg">Pick a time on the calendar below to secure your session.</p>
      </div>

      <div className="glass p-2 md:p-4 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden min-h-[800px]">
        {/* Calendly Inline Widget */}
        <div 
          className="calendly-inline-widget" 
          data-url="https://calendly.com/datalazo/15-minute-ai-audit?hide_event_type_details=1&hide_gdpr_banner=1&background_color=000000&text_color=ffffff&primary_color=06b6d4" 
          style={{ minWidth: '320px', height: '750px' }}
        ></div>
      </div>
      
      <p className="text-center text-[10px] text-slate-500 mt-8 uppercase tracking-widest">
        Datalazo AI Intelligence Agency • Secure Booking Portal
      </p>
    </div>
  );
}

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-cyan-500/30">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      }>
        <BookingContent />
      </Suspense>
    </div>
  );
}
