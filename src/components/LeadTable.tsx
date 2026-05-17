"use client";

import React, { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string;
  message: string | null;
  notes: string | null;
  aiProposal: string | null;
  status: string;
  createdAt: string | Date;
}

export default function LeadTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<{ id: string, name: string, notes: string, aiProposal: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/lead/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setLeads(leads.filter(l => l.id !== id));
        showToast('Lead deleted successfully');
      } else {
        showToast('Failed to delete lead', 'error');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete lead', 'error');
    }
  };

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

  const saveNotes = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lead/${selectedLead.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: selectedLead.notes }),
      });
      const res2 = await fetch(`/api/lead/${selectedLead.id}/proposal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProposal: selectedLead.aiProposal }),
      });
      if (res.ok && res2.ok) {
        setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, notes: selectedLead.notes, aiProposal: selectedLead.aiProposal } : l));
        setSelectedLead(null);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const generateProposal = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lead/${selectedLead.id}/generate-proposal`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSelectedLead({ ...selectedLead, aiProposal: data.aiProposal });
        setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, aiProposal: data.aiProposal } : l));
        showToast('AI Pitch generated successfully!');
      } else {
        showToast(data.error || "Generation failed.", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate AI proposal.', 'error');
    }
    setIsSaving(false);
  };

  const sendProposal = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lead/${selectedLead.id}/proposal`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProposal: selectedLead.aiProposal })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, aiProposal: selectedLead.aiProposal, status: 'PROCESSED' } : l));
        setSelectedLead(null);
        showToast('Proposal sent successfully!');
      } else {
        showToast(data.error || 'Failed to send proposal.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to send proposal.', 'error');
    }
    setIsSaving(false);
  };

  const sendDiscoveryLink = async (id: string, status: string) => {
    if (status?.toUpperCase() === 'IN_REVIEW') {
      if (!confirm('This discovery email was sent already. Do you want to send it again?')) return;
    } else if (status?.toUpperCase() !== 'BOOKED') {
      showToast('Discovery link can only be sent to Booked or In Review leads.', 'error');
      return;
    }

    setIsSendingLink(id);
    try {
      const res = await fetch(`/api/lead/${id}/send-discovery-link`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Discovery link emailed successfully!');
      } else {
        showToast(data.error || 'Failed to send link.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to send link.', 'error');
    }
    setIsSendingLink(null);
  };

  const getStatusColor = (status: string) => {
    const normalized = status?.toUpperCase();
    switch (normalized) {
      case 'WON': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PROCESSED': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'LOST': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'MAYBE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CONTACTED': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'BOOKED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-5 duration-300 flex items-center gap-3 backdrop-blur-md border ${
          toast.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
            : 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Notes Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="glass w-full max-w-2xl p-8 border-cyan-500/20 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">
                Lead Notes: <span className="text-cyan-400">{selectedLead.name}</span>
              </h2>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 mt-4">Internal Notes</h3>
            <textarea 
              value={selectedLead.notes || ''}
              onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
              placeholder="Enter internal notes, follow-up history, or meeting highlights..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-300 focus:outline-none focus:border-cyan-500 transition-all resize-none mb-4"
            />

            <div className="flex justify-between items-center mb-2 mt-4">
              <h3 className="text-xs font-bold uppercase text-slate-400">AI Proposal Draft</h3>
              <button 
                onClick={generateProposal}
                disabled={isSaving}
                className="text-xs font-bold uppercase bg-fuchsia-500/20 text-fuchsia-400 px-3 py-1 rounded-lg hover:bg-fuchsia-500/40 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                ✨ Generate AI Pitch
              </button>
            </div>
            <textarea 
              value={selectedLead.aiProposal || ''}
              onChange={(e) => setSelectedLead({ ...selectedLead, aiProposal: e.target.value })}
              placeholder="Generate an AI proposal or type one manually..."
              className="w-full h-48 bg-white/5 border border-fuchsia-500/20 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-fuchsia-500 transition-all resize-none mb-6"
            />

            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <button 
                onClick={sendProposal}
                disabled={isSaving || !selectedLead.aiProposal}
                className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black uppercase rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                ✉️ Approve & Send Email
              </button>
              
              <div className="flex gap-4">
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
                  {isSaving ? 'Saving...' : 'Save Drafts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-white' },
          { label: 'Won Deals', value: leads.filter(l => l.status?.toUpperCase() === 'WON').length, color: 'text-emerald-400' },
          { label: 'Pending', value: leads.filter(l => l.status?.toUpperCase() === 'IN_REVIEW').length, color: 'text-amber-400' },
          { label: 'Conversion', value: leads.length ? `${Math.round((leads.filter(l => l.status?.toUpperCase() === 'WON').length / leads.length) * 100)}%` : '0%', color: 'text-cyan-400' }
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
            <th className="py-4 px-4 font-semibold text-slate-300">Message / Internal Notes</th>
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
              <td className="py-4 px-4 max-w-xs">
                <div className="text-slate-400 text-xs truncate mb-1">{lead.message}</div>
                {lead.notes && (
                  <div className="text-[10px] text-cyan-500 italic truncate flex items-center gap-1">
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    {lead.notes}
                  </div>
                )}
              </td>
              <td className="py-4 px-4">
                <select 
                  value={lead.status?.toUpperCase()}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border bg-background outline-none cursor-pointer transition-all ${getStatusColor(lead.status)}`}
                >
                  <option value="IN_REVIEW">In Review</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="BOOKED">Booked 📅</option>
                  <option value="MAYBE">Maybe</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                  <option value="PROCESSED">Processed</option>
                </select>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => sendDiscoveryLink(lead.id, lead.status)}
                    disabled={isSendingLink === lead.id}
                    className="p-2 hover:bg-emerald-500/20 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                    title="Email Discovery Link"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setSelectedLead({ id: lead.id, name: lead.name, notes: lead.notes || '', aiProposal: lead.aiProposal || '' })}
                    className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Edit Notes & Proposal"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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

