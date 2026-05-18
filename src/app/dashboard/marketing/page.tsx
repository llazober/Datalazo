"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  address: string | null;
  category: string | null;
  status: string;
  aiSubject: string | null;
  aiBody: string | null;
  createdAt: string;
}

export default function MarketingDashboard() {
  // State variables
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Scraper Form State
  const [queriesInput, setQueriesInput] = useState('');
  const [limit, setLimit] = useState(25);
  const [apifyToken, setApifyToken] = useState('');
  const [triggeringScraper, setTriggeringScraper] = useState(false);
  
  // Manual Import State
  const [datasetId, setDatasetId] = useState('');
  const [importingDataset, setImportingDataset] = useState(false);
  
  // Drawer / Selection State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [templateId, setTemplateId] = useState('audit');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  
  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Auto-clear notification after 4s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Set webhook URL dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/marketing/apify/webhook`);
    }
  }, []);

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/marketing/leads?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Failed to fetch leads', err);
      showNotification('Failed to retrieve marketing database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, search]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  // Trigger Apify Scraper
  const handleTriggerScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queriesInput.trim()) {
      showNotification('Please enter at least one query (e.g. plumbers in Miami).', 'error');
      return;
    }

    const queries = queriesInput.split('\n').map(q => q.trim()).filter(q => q.length > 0);
    
    try {
      setTriggeringScraper(true);
      showNotification('Contacting Apify to launch Google Maps Scraper...', 'info');

      const res = await fetch('/api/marketing/apify/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries,
          limit,
          apiToken: apifyToken || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Scraper running successfully! Run ID: ${data.runId.substring(0, 8)}. Dataset ID: ${data.datasetId}`, 'success');
        setDatasetId(data.datasetId); // Populate import box automatically
      } else {
        showNotification(data.error || 'Failed to trigger scraper run.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Network error while launching scraper.', 'error');
    } finally {
      setTriggeringScraper(false);
    }
  };

  // Import dataset
  const handleImportDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId.trim()) {
      showNotification('Dataset ID is required to import leads.', 'error');
      return;
    }

    try {
      setImportingDataset(true);
      showNotification('Fetching items and parsing email contacts...', 'info');

      const res = await fetch('/api/marketing/apify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: datasetId.trim(),
          apiToken: apifyToken || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Sync finished! Ingested ${data.importedCount} qualified leads (skipped ${data.skippedCount} with no email).`, 'success');
        fetchLeads();
      } else {
        showNotification(data.error || 'Dataset import failed.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Import process failed.', 'error');
    } finally {
      setImportingDataset(false);
    }
  };

  // Generate AI email draft
  const handleGenerateDraft = async () => {
    if (!selectedLead) return;

    try {
      setGeneratingDraft(true);
      showNotification('Drafting personalized cold email using OpenAI...', 'info');

      const res = await fetch('/api/marketing/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          templateId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('AI pitch drafted and saved as ready draft!', 'success');
        setDraftSubject(data.lead.aiSubject || '');
        setDraftBody(data.lead.aiBody || '');
        // Update current selected state
        setSelectedLead(data.lead);
        // Refresh grid
        fetchLeads();
      } else {
        showNotification(data.error || 'Failed to draft email.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Drafting engine encountered an error.', 'error');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Save changes to lead
  const handleSaveLeadEdits = async () => {
    if (!selectedLead) return;

    try {
      setSavingLead(true);
      const isDraftEmpty = !draftSubject.trim() && !draftBody.trim();
      const targetStatus = isDraftEmpty ? 'NEW' : 'DRAFT_READY';

      const res = await fetch(`/api/marketing/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiSubject: draftSubject,
          aiBody: draftBody,
          name: selectedLead.name,
          company: selectedLead.company,
          email: selectedLead.email,
          status: targetStatus
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          isDraftEmpty 
            ? 'Draft cleared and lead status reset to NEW.' 
            : 'Lead details and draft saved successfully.', 
          'success'
        );
        setSelectedLead(data.lead);
        fetchLeads();
      } else {
        showNotification(data.error || 'Failed to save changes.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error saving modifications.', 'error');
    } finally {
      setSavingLead(false);
    }
  };

  // Send Email via Resend
  const handleSendEmail = async () => {
    if (!selectedLead) return;

    try {
      setSendingEmail(true);
      showNotification('Dispatching outreach email via Resend...', 'info');

      const res = await fetch('/api/marketing/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          subject: draftSubject,
          body: draftBody
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Outreach email sent successfully!', 'success');
        setSelectedLead(data.lead);
        fetchLeads();
      } else {
        showNotification(data.error || 'Failed to send outreach email.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to communicate with Resend client.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening drawer
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const res = await fetch(`/api/marketing/leads/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Lead removed from campaign lists.', 'success');
        if (selectedLead?.id === id) {
          setSelectedLead(null);
        }
        fetchLeads();
      } else {
        showNotification(data.error || 'Deletion failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to delete contact.', 'error');
    }
  };

  // Metric summaries
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'NEW').length;
  const readyDrafts = leads.filter(l => l.status === 'DRAFT_READY').length;
  const sentOutreach = leads.filter(l => l.status === 'SENT').length;
  const generatedPitches = leads.filter(l => l.status === 'DRAFT_READY' || l.status === 'SENT').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-bold flex items-center gap-3 animate-slide-in
          ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
            notification.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
            'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}
        >
          <span className="w-2 h-2 rounded-full animate-ping bg-current" />
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/dashboard" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 mb-4 flex items-center gap-2 uppercase tracking-widest transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Overview
          </Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
            B2B Scraper & <span className="text-emerald-400">Marketing Hub</span>
          </h1>
          <p className="text-slate-400 mt-1">Connect directly with Apify scrapers, review lead information, and automate personalized AI cold email pitches.</p>
        </div>
      </div>

      {/* HUD metrics dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Scraped Leads', value: totalLeads, color: 'text-white border-white/5' },
          { label: 'Unprocessed', value: newLeads, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
          { label: 'AI Pitches Generated', value: generatedPitches, color: 'text-violet-400 border-violet-500/20 bg-violet-500/5' },
          { label: 'AI Drafts Ready', value: readyDrafts, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' },
          { label: 'Outreach Sent', value: sentOutreach, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' }
        ].map((hud, idx) => (
          <div key={idx} className={`p-6 border rounded-2xl flex flex-col justify-between bg-white/[0.01] backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-all ${hud.color}`}>
            <div className="text-xs font-black uppercase text-slate-500 tracking-widest">{hud.label}</div>
            <div className="text-4xl md:text-5xl font-black italic tracking-tighter mt-4">{hud.value}</div>
          </div>
        ))}
      </div>

      {/* Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trigger form */}
        <div className="glass p-6 md:p-8 bg-white/[0.01] border-white/5 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white uppercase italic tracking-tight mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Apify Google Maps Scraper
            </h3>
            <p className="text-xs text-slate-500 mb-6">Launch Google Maps scraper actor directly. Scrapes companies, phone numbers, websites, and emails from websites.</p>
            
            <form onSubmit={handleTriggerScraper} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Search Queries (One per line)</label>
                <textarea 
                  value={queriesInput}
                  onChange={(e) => setQueriesInput(e.target.value)}
                  placeholder="plumbers in Miami FL&#10;dental clinics in Austin TX" 
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Limit Per Query</label>
                  <input 
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                    min={1}
                    max={100}
                    className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Apify API Key (Optional)</label>
                  <input 
                    type="password"
                    value={apifyToken}
                    onChange={(e) => setApifyToken(e.target.value)}
                    placeholder="Uses env if empty"
                    className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={triggeringScraper}
                className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {triggeringScraper ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Launching Actor Scraper...
                  </>
                ) : 'Trigger Scraper Run'}
              </button>
            </form>
          </div>
        </div>

        {/* Manual Import */}
        <div className="glass p-6 md:p-8 bg-white/[0.01] border-white/5 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white uppercase italic tracking-tight mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Manual Dataset Import
            </h3>
            <p className="text-xs text-slate-500 mb-6">Already completed a scraper run on Apify? Import the scraped items instantly by pasting the Apify Dataset ID below.</p>
            
            <form onSubmit={handleImportDataset} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Apify Dataset ID</label>
                <input 
                  type="text"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  placeholder="e.g. z9kX2LpQxW1yT5zN7" 
                  className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button 
                type="submit"
                disabled={importingDataset}
                className="w-full mt-4 py-3 bg-white/10 text-white border border-white/10 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importingDataset ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ingesting Scraped Data...
                  </>
                ) : 'Import Scraped Leads'}
              </button>
            </form>
          </div>
        </div>

        {/* Webhooks instructions */}
        <div className="glass p-6 md:p-8 bg-white/[0.01] border-white/5 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white uppercase italic tracking-tight mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Set-and-Forget Webhook
            </h3>
            <p className="text-xs text-slate-500 mb-4">Want completely automated leads? Set up an Apify Webhook integration using the link below on event <strong>RUN.SUCCEEDED</strong>.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Webhook URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    readOnly
                    value={webhookUrl || 'Loading Webhook URL...'} 
                    className="flex-1 px-3 py-2 bg-[#0c0c0e] border border-white/10 rounded-xl text-xs text-slate-400 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      showNotification('Webhook URL copied to clipboard!', 'success');
                    }}
                    type="button"
                    className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/20 text-xs font-bold"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="p-3 bg-[#08080a] border border-white/5 rounded-xl">
                <p className="text-[10px] text-slate-500 leading-normal">
                  <span className="text-emerald-400 font-bold">▶</span> Webhook fetches dataset items on scraper completion, filters out missing emails, and syncs automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main workspace section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Table list */}
        <div className={`glass p-6 md:p-8 bg-white/[0.01] border-white/5 rounded-3xl transition-all duration-300 ${selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase italic text-white tracking-tight">Lead Campaign Desk</h2>
              <p className="text-xs text-slate-500">Click a row to edit company data, draft cold emails with AI, and launch campaign outreach.</p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category, company, email..."
                className="px-4 py-2.5 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 w-full sm:w-64"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">All Statuses</option>
                <option value="NEW">Unprocessed (NEW)</option>
                <option value="GENERATING">Generating Draft</option>
                <option value="DRAFT_READY">Draft Ready</option>
                <option value="SENT">Outreach Sent</option>
                <option value="FAILED">Delivery Failed</option>
              </select>
            </div>
          </div>

          {/* List grid/table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-500 tracking-widest pl-4">Company & Info</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Email & Phone</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Status</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-500 tracking-widest pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <tr 
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setDraftSubject(lead.aiSubject || '');
                      setDraftBody(lead.aiBody || '');
                    }}
                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors group ${selectedLead?.id === lead.id ? 'bg-emerald-500/5 hover:bg-emerald-500/5 border-l-2 border-emerald-500' : ''}`}
                  >
                    <td className="py-4 pl-4">
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{lead.company || 'Unknown Business'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lead.name || 'Owner/Manager'}</div>
                      {lead.website && (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} // Stop drawer click
                          className="text-[10px] text-emerald-500 hover:underline mt-1 inline-block"
                        >
                          {lead.website.replace('https://', '').replace('http://', '').split('/')[0]}
                        </a>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="text-sm font-medium text-slate-300">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-slate-500 mt-0.5">{lead.phone}</div>}
                    </td>
                    <td className="py-4 text-xs font-semibold text-slate-400">
                      {lead.category || 'N/A'}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase
                        ${lead.status === 'NEW' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 
                          lead.status === 'GENERATING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 
                          lead.status === 'DRAFT_READY' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 
                          lead.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                      >
                        {lead.status === 'DRAFT_READY' ? 'DRAFT READY' : lead.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button 
                        onClick={(e) => handleDeleteLead(lead.id, e)}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all"
                        title="Delete Lead"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-600 italic">
                      No matching leads found. Run a scraper query or paste a dataset ID to import leads.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead sliding drawer edit/AI composer */}
        {selectedLead && (
          <div className="lg:col-span-5 glass p-6 md:p-8 bg-white/[0.01] border-emerald-500/20 border rounded-3xl space-y-6 relative animate-fade-in">
            
            {/* Close */}
            <button 
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title / Details */}
            <div>
              <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Outreach Composer</div>
              <h3 className="text-2xl font-black text-white leading-tight uppercase italic">{selectedLead.company || 'Unknown Business'}</h3>
              
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-[#08080a] border border-white/5 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-black text-[9px] tracking-wider mb-1">Contact Person</span>
                  <input 
                    type="text" 
                    value={selectedLead.name || ''} 
                    onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                    className="bg-[#0c0c0e] border border-white/10 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500 transition-colors w-full"
                    placeholder="Owner/Manager"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-black text-[9px] tracking-wider mb-1">Email Address (Test Email)</span>
                  <input 
                    type="email" 
                    value={selectedLead.email || ''} 
                    onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                    className="bg-[#0c0c0e] border border-white/10 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500 transition-colors w-full font-mono text-emerald-400"
                  />
                </div>
                <div className="col-span-2 pt-3 mt-1 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 leading-tight">Change this email to send tests to your own inbox.</span>
                  <button
                    onClick={handleSaveLeadEdits}
                    disabled={savingLead}
                    className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    {savingLead ? 'Saving...' : '💾 Save Info'}
                  </button>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/5">
                  <span className="text-slate-500 block uppercase font-black text-[9px] tracking-wider">Scraped Location/Address</span>
                  <span className="text-slate-300 font-semibold mt-1 block">{selectedLead.address || 'Not Available'}</span>
                </div>
              </div>
            </div>

            {/* Campaign Options */}
            <div className="border-t border-white/10 pt-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Campaign Outreach Template</label>
                <select 
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="audit">Free AI Workflow Audit Offer (High Conversion)</option>
                  <option value="pitch">Direct Agency Services (AI Voice Receptionists & SEO)</option>
                  <option value="collab">Partnership Inquiry / Local Client Stream</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateDraft}
                  disabled={generatingDraft}
                  className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingDraft ? (
                    <>
                      <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Composing Pitch...
                    </>
                  ) : selectedLead.aiSubject ? 'Re-generate AI Pitch' : 'Generate AI Pitch'}
                </button>
              </div>
            </div>

            {/* Pitch Editor */}
            <div className="border-t border-white/10 pt-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Outreach Subject Line</label>
                <input 
                  type="text" 
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  placeholder="Generate AI Pitch or enter subject..."
                  className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Body (Markdown/HTML formatting)</label>
                <textarea 
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Generated draft body will appear here, or you can write a fully customized email manually..."
                  rows={8}
                  className="w-full px-4 py-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 leading-relaxed font-mono"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveLeadEdits}
                  disabled={savingLead}
                  className="px-4 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 text-xs font-black uppercase transition-all"
                  title="Save Draft Changes"
                >
                  {savingLead ? 'Saving...' : 'Save Draft'}
                </button>
                
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !draftSubject || !draftBody}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Sending Outreach...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Outreach via Resend
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
