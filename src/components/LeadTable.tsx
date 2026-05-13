"use client";

import React, { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string;
  message: string | null;
  status: string;
  createdAt: string | Date;
}

export default function LeadTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/lead/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'LOST': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'MAYBE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CONTACTED': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-white' },
          { label: 'Won Deals', value: leads.filter(l => l.status === 'WON').length, color: 'text-emerald-400' },
          { label: 'Pending', value: leads.filter(l => l.status === 'IN_REVIEW').length, color: 'text-amber-400' },
          { label: 'Conversion', value: leads.length ? `${Math.round((leads.filter(l => l.status === 'WON').length / leads.length) * 100)}%` : '0%', color: 'text-cyan-400' }
        ].map((stat, i) => (
          <div key={i} className="glass p-6">
            <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h3 className="font-bold text-lg">Lead Pipeline</h3>
          <div className="flex gap-2">
             <div className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> New
             </div>
             <div className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500" /> Contacted
             </div>
             <div className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Won
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
        <thead className="text-xs text-slate-500 uppercase bg-white/5">
          <tr>
            <th className="py-4 px-4 font-semibold text-slate-300">Contact</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Company / Service</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Message</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Status</th>
            <th className="py-4 px-4 font-semibold text-slate-300 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td className="py-4 px-4">
                <div className="font-bold text-white">{lead.name}</div>
                <div className="text-xs text-slate-500">{lead.email}</div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-slate-300">{lead.company || 'Personal'}</div>
                <div className="text-[10px] uppercase font-bold text-cyan-400">{lead.service}</div>
              </td>
              <td className="py-4 px-4 text-slate-400 text-xs max-w-xs truncate">{lead.message}</td>
              <td className="py-4 px-4">
                <select 
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border bg-background outline-none cursor-pointer transition-all ${getStatusColor(lead.status)}`}
                >
                  <option value="IN_REVIEW">In Review</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="MAYBE">Maybe</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(lead.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors" 
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} className="py-10 text-center text-slate-500">
                No leads found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}
