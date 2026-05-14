"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingForm from '@/components/BookingForm';

function BookingContent() {
  const searchParams = useSearchParams();
  const [leadId, setLeadId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Priority: useSearchParams -> window.location fallback
    const id = searchParams.get('id') || 
               searchParams.get('leadId') || 
               new URLSearchParams(window.location.search).get('id') ||
               new URLSearchParams(window.location.search).get('leadId');
    
    console.log('Detected Lead ID:', id);
    setLeadId(id);
  }, [searchParams]);



  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase italic">
          Schedule Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">AI Audit</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto">
          The first step towards total business autonomy. Select a time below to meet with our intelligence team.
        </p>
      </div>

      <div className="max-w-3xl mx-auto glass p-6 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.4)] border-white/10">
        <BookingForm leadId={leadId} />
      </div>
      
      <p className="text-center text-[10px] text-slate-500 mt-12 uppercase tracking-widest opacity-50">
        Datalazo AI Intelligence Agency • Private Secure Portal
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
