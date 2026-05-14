"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get('id');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      setError('Invalid booking link. Please use the link provided in your email.');
      return;
    }
    if (!date || !time) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, date, timeSlot: time }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError('Failed to book. This slot might be taken.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Meeting Confirmed!</h1>
        <p className="text-slate-400 max-w-md mx-auto text-lg">
          We've locked in your discovery call for <span className="text-white font-bold">{date}</span> at <span className="text-white font-bold">{time}</span>. 
          A calendar invite has been sent to your email.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-medium border border-white/10"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
          Schedule Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">AI Audit</span>
        </h1>
        <p className="text-slate-400 text-lg">Choose a time for your 15-minute discovery session.</p>
      </div>

      <div className="glass p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        {!leadId && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-8 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-200">
              Demo Mode: You are viewing this page without a Lead ID. To save a real booking, please click the link sent to your email after submitting our lead form.
            </p>
          </div>
        )}

        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Step 1: Select Date */}
          <div className="space-y-6">
            <label className="text-xs uppercase font-black tracking-widest text-cyan-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[10px]">01</span>
              Select Date
            </label>
            <input 
              type="date" 
              required
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Step 2: Select Time */}
          <div className="space-y-6">
            <label className="text-xs uppercase font-black tracking-widest text-cyan-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[10px]">02</span>
              Choose Time (EST)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                    time === slot 
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="md:col-span-2 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center">
              {error}
            </div>
          )}

          <div className="md:col-span-2 pt-6">
            <button
              disabled={loading || !date || !time}
              className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 shadow-[0_20px_40px_rgba(6,182,212,0.2)]"
            >
              {loading ? 'Processing...' : 'Secure Your Session'}
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
              Limited slots available. High demand expected.
            </p>
          </div>
        </form>
      </div>
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
