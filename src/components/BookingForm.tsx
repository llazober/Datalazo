"use client";

import React, { useState, useEffect } from 'react';

import CalendarPicker from './CalendarPicker';

interface BookingFormProps {
  leadId: string | null;
}

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
];

export default function BookingForm({ leadId }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDate) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        const res = await fetch(`/api/appointments?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.bookedSlots || []);
        }
      } catch (err) {
        console.error('Failed to fetch booked slots:', err);
      }
    };

    fetchBookedSlots();
    setSelectedSlot('');
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!leadId || !selectedDate || !selectedSlot || !phone) return;

    setStatus('submitting');
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          date: selectedDate,
          timeSlot: selectedSlot,
          phone,
        }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Booking failed:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="glass p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-accent-cyan/20 text-accent-cyan rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Audit Scheduled!</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Your AI Audit has been confirmed for <span className="text-white font-semibold">{selectedDate}</span> at <span className="text-white font-semibold">{selectedSlot}</span>. Check your email for details.
        </p>
        <div className="flex justify-center">
          <button 
            onClick={() => {
              try {
                window.close();
              } catch (e) {}
              window.location.href = '/';
            }}
            className="px-12 py-4 bg-accent-cyan text-black hover:opacity-90 rounded-2xl transition-all font-black uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            Close Window
          </button>
        </div>

      </div>
    );
  }

  if (!leadId) {
    return (
      <div className="glass p-10 text-center">
        <p className="text-red-400 font-medium">Session ID Missing</p>
        <p className="text-slate-500 text-sm mt-2">Please return to the main page and submit the contact form first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Date Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">1. Select a Date</label>
          <CalendarPicker 
            selectedDate={selectedDate} 
            onDateSelect={(date) => setSelectedDate(date)} 
          />
        </div>


        {/* Time Slot Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">2. Select a Time</label>
          <div className="grid grid-cols-2 gap-3">
            {TIME_SLOTS.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              return (
                <button
                  key={slot}
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                    isBooked
                      ? 'bg-red-500/10 border-red-500/10 text-red-500/30 cursor-not-allowed line-through'
                      : selectedSlot === slot 
                        ? 'bg-accent-cyan text-black border-accent-cyan shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phone Number Input */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">3. Contact Information</label>
        <div className="relative">
          <input 
            type="tel" 
            placeholder="Your Phone Number (Mandatory)"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-accent-cyan transition-all hover:bg-white/[0.07]"
          />
          {phone && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-white/5">
        <button
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedSlot || !phone || status === 'submitting'}
          className="w-full py-5 bg-gradient-to-r from-accent-cyan to-accent-indigo text-black font-black text-lg rounded-2xl hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale transform active:scale-[0.98] shadow-xl"
        >
          {status === 'submitting' ? 'Securing Slot...' : 'Confirm My AI Audit'}
        </button>
        {status === 'error' && (
          <p className="text-red-400 text-center mt-4 text-sm">Something went wrong. Please try refreshing or contact support.</p>
        )}
      </div>

      <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
        Automated scheduling system powered by Datalazo Intelligence
      </p>
    </div>
  );
}
