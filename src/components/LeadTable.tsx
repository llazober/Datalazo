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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/lead/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setLeads(leads.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete lead.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-white' },
          { label: 'Active Automations', value: '1', color: 'text-accent-cyan' },
          { label: 'AI Health', value: '98%', color: 'text-emerald-400' },
          { label: 'SEO Growth', value: '+12%', color: 'text-cyan-400' }
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
          <h3 className="font-bold">Recent Leads</h3>
          <button className="text-xs text-accent-cyan hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
        <thead className="text-xs text-slate-500 uppercase bg-white/5">
          <tr>
            <th className="py-4 px-4 font-semibold text-slate-300">Name</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Email</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Company</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Service</th>
            <th className="py-4 px-4 font-semibold text-slate-300">Message</th>
            <th className="py-4 px-4 font-semibold text-slate-300 text-center">Status</th>
            <th className="py-4 px-4 font-semibold text-slate-300 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td className="py-4 px-4 font-medium">{lead.name}</td>
              <td className="py-4 px-4 text-slate-400">{lead.email}</td>
              <td className="py-4 px-4 text-slate-400">{lead.company}</td>
              <td className="py-4 px-4">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                  {lead.service}
                </span>
              </td>
              <td className="py-4 px-4 text-slate-400 max-w-xs truncate">{lead.message}</td>
              <td className="py-4 px-4 text-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  lead.status === 'PROCESSED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {lead.status}
                </span>
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
