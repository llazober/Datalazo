"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
    notes: string | null;
    status: string;
  };
}

const STATUS_OPTIONS = ['IN_REVIEW', 'CONTACTED', 'BOOKED', 'MAYBE', 'WON', 'LOST', 'PROCESSED', 'CLOSED'];

export default function BookingsDashboard() {
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<{ id: string, name: string, notes: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const saveNotes = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lead/${selectedLead.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: selectedLead.notes }),
      });
      if (res.ok) {
        setSelectedLead(null);
        fetchBookings();
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSaving(false);
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
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 relative">
      {/* Modal Backdrop */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-2xl p-8 border-cyan-500/20 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">
                Meeting Notes: <span className="text-cyan-400">{selectedLead.name}</span>
              </h2>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <textarea 
              value={selectedLead.notes || ''}
              onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
              placeholder="Type your meeting insights here..."
              className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-300 focus:outline-none focus:border-cyan-500 transition-all resize-none mb-6"
            />

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveNotes}
                disabled={isSaving}
                className="px-8 py-2 bg-cyan-500 text-black font-black uppercase rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/dashboard" className="text-xs font-bold text-cyan-500 hover:text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Overview
            </Link>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
              Intelligence <span className="text-cyan-500">Dashboard</span>
            </h1>
            <p className="text-slate-400">Manage your active AI Audit pipeline.</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-sm font-bold tracking-widest text-slate-400 uppercase">
            Total Bookings: {bookings.length}
          </div>
        </div>

        <div className="glass overflow-hidden border-white/10 shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-5">Date & Time</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Contact & Notes</th>
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
                  <td className="px-6 py-6 max-w-xs">
                    <div className="text-sm font-medium">{booking.lead.email}</div>
                    <div className={`text-xs mt-1 font-bold ${booking.lead.phone ? 'text-cyan-400' : 'text-slate-500 italic'}`}>
                      {booking.lead.phone || 'No phone provided'}
                    </div>
                    {booking.lead.notes && (
                      <div className="mt-2 text-[10px] text-slate-500 line-clamp-1 italic bg-white/5 px-2 py-1 rounded">
                        "{booking.lead.notes}"
                      </div>
                    )}
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
                      <button 
                        onClick={() => setSelectedLead({ id: booking.lead.id, name: booking.lead.name, notes: booking.lead.notes || '' })}
                        className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors border border-cyan-500/20 hover:border-cyan-500 px-3 py-1.5 rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes
                      </button>
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
