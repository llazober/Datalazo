"use client";

import React, { useEffect, useState } from 'react';

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  lead: {
    id: string;
    name: string;
    company: string | null;
    email: string;
    phone: string | null;
    status: string;
  };
}

const STATUS_OPTIONS = ['IN_REVIEW', 'CONTACTED', 'BOOKED', 'MAYBE', 'WON', 'LOST', 'PROCESSED', 'CLOSED'];

export default function BookingsDashboard() {
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/lead/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchBookings(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead and all associated bookings?')) return;
    try {
      const res = await fetch(`/api/lead/${leadId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
              Intelligence <span className="text-cyan-500">Dashboard</span>
            </h1>
            <p className="text-slate-400">Manage your active AI Audit pipeline.</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-sm font-bold tracking-widest text-slate-400 uppercase">
            Total Bookings: {bookings.length}
          </div>
        </div>

        <div className="glass overflow-hidden border-white/10 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-5">Date & Time</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-6">
                    <div className="font-bold text-cyan-400">
                      {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 uppercase font-bold">{booking.timeSlot}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-bold">{booking.lead.name}</div>
                    <div className="text-xs text-slate-400">{booking.lead.company || 'Private Individual'}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-medium">{booking.lead.email}</div>
                    <div className={`text-xs mt-1 font-bold ${booking.lead.phone ? 'text-cyan-400' : 'text-slate-500 italic'}`}>
                      {booking.lead.phone || 'No phone provided'}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <select 
                      value={booking.lead.status}
                      onChange={(e) => updateStatus(booking.lead.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500 transition-all ${
                        booking.lead.status === 'WON' ? 'text-green-400 border-green-500/50' : 
                        booking.lead.status === 'LOST' ? 'text-red-400 border-red-500/50' :
                        booking.lead.status === 'MAYBE' ? 'text-orange-400 border-orange-500/50' :
                        booking.lead.status === 'BOOKED' ? 'text-cyan-400 border-cyan-500/50' : 
                        booking.lead.status === 'CLOSED' ? 'text-slate-500' : 'text-yellow-400'
                      }`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt} className="bg-[#111]">{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-3 items-center">
                      <a 
                        href={`/book?id=${booking.lead.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors border border-white/5 hover:border-white/20 px-3 py-1.5 rounded-lg"
                      >
                        View
                      </a>
                      <button 
                        onClick={() => deleteLead(booking.lead.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors border border-red-500/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          
          {bookings.length === 0 && (
            <div className="py-20 text-center text-slate-500 italic">
              No bookings found in the intelligence matrix.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
