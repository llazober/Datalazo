"use client";

import React, { useState, useEffect } from 'react';

interface Client {
  id: string;
  leadId: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  services: string;
  paymentDate: string | null;
  totalPayment: number;
  notes: string | null;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  stripeStatus: string | null;
  recurringAmount: number | null;
  createdAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export default function ClientsDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [agencySettings, setAgencySettings] = useState<{ senderEmail?: string; senderName?: string; agencyName?: string } | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<{
    senderName: string;
    senderAddress: string;
    billTo: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    terms: string;
  } | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  
  // Forms state
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    services: '',
    notes: '',
    totalPayment: 0,
    paymentDate: '',
    stripeStatus: '',
    recurringAmount: 0
  });

  const [checkoutForm, setCheckoutForm] = useState({
    clientId: '',
    amount: '1500',
    serviceName: 'Premium Monthly Retainer',
    billingInterval: 'month'
  });

  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    services: '',
    notes: '',
    totalPayment: '0',
    paymentDate: ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      showToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (!data.error) {
        setAgencySettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchInvoiceHistory = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoiceHistory(data);
      }
    } catch (err) {
      console.error('Error fetching invoice history:', err);
    }
  };

  const handleSaveInvoiceRecord = async (sendEmail: boolean) => {
    if (!invoiceForm || !selectedClient) return false;
    setIsSendingInvoice(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoiceForm.invoiceNumber,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          clientEmail: selectedClient.email,
          clientCompany: selectedClient.company,
          clientPhone: selectedClient.phone,
          items: invoiceForm.items,
          amount: invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0),
          terms: invoiceForm.terms,
          sendEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(sendEmail ? 'Invoice sent to client successfully' : 'Invoice saved to history');
        setIsInvoiceModalOpen(false);
        return true;
      } else {
        showToast(data.error || 'Failed to process invoice', 'error');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error processing invoice', 'error');
      return false;
    } finally {
      setIsSendingInvoice(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isHistoryModalOpen) {
      fetchInvoiceHistory();
    }
  }, [isHistoryModalOpen]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Client updated successfully');
        setIsEditModalOpen(false);
        fetchClients();
      } else {
        showToast(data.error || 'Failed to update client', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating client', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Client created successfully');
        setIsManualModalOpen(false);
        setManualForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          services: '',
          notes: '',
          totalPayment: '0',
          paymentDate: ''
        });
        fetchClients();
      } else {
        showToast(data.error || 'Failed to create client', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating client', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutForm)
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Failed to generate checkout link', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Stripe integration error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This will remove payment history metrics.')) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Client profile deleted');
        fetchClients();
      } else {
        showToast('Failed to delete client', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting client', 'error');
    }
  };

  // Helper date formatter
  const formatClientDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  };

  // Statistics calculation
  const totalRevenue = clients.reduce((acc, c) => acc + (c.totalPayment || 0), 0);
  const activeMRR = clients
    .filter(c => c.stripeStatus === 'active' && c.recurringAmount)
    .reduce((acc, c) => acc + (c.recurringAmount || 0), 0);
  const activeSubs = clients.filter(c => c.stripeStatus === 'active').length;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.services.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 relative">
      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-5 duration-300 flex items-center gap-3 backdrop-blur-md border ${
          toast.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
            : 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}>
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 border-fuchsia-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Total Client Base</div>
          <div className="text-3xl font-black text-fuchsia-400">{clients.length}</div>
        </div>
        <div className="glass p-6 border-emerald-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Active Subscriptions</div>
          <div className="text-3xl font-black text-emerald-400">{activeSubs}</div>
        </div>
        <div className="glass p-6 border-indigo-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Recurring MRR</div>
          <div className="text-3xl font-black text-indigo-400">${activeMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="glass p-6 border-cyan-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Total Revenue Sync</div>
          <div className="text-3xl font-black text-cyan-400">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">
            Client Matrix <span className="text-fuchsia-400">Database</span>
          </h1>
          <p className="text-slate-400 text-xs">Manage active services, recurring subscriptions, and manual invoice tracking.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search clients, plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors w-full md:w-64"
          />
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase rounded-xl hover:scale-105 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            📄 Invoice History
          </button>
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs font-black uppercase rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] whitespace-nowrap"
          >
            👤 Add Client
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-white/[0.01]">
                <th className="py-4 px-6">Client / Company</th>
                <th className="py-4 px-6">Type of Services</th>
                <th className="py-4 px-6">Stripe Status</th>
                <th className="py-4 px-6">Recurring Fee</th>
                <th className="py-4 px-6">Total Payments</th>
                <th className="py-4 px-6">Billing Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No active clients found matching filter criteria.</td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-100">{client.name}</div>
                      <div className="text-xs text-slate-500">{client.email}</div>
                      {client.phone && <div className="text-[10px] text-slate-500">{client.phone}</div>}
                      {client.company && (
                        <div className="inline-block bg-white/5 border border-white/10 text-[9px] px-2 py-0.5 rounded-md mt-1 font-bold uppercase tracking-wider text-slate-400">
                          🏢 {client.company}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-medium text-slate-200 truncate">{client.services}</div>
                      {client.notes && (
                        <div className="text-[10px] text-cyan-400 italic truncate mt-0.5">
                          📝 {client.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {client.stripeStatus ? (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          client.stripeStatus === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : client.stripeStatus === 'past_due' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {client.stripeStatus}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Manual / None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-300">
                      {client.recurringAmount ? `$${client.recurringAmount}/${client.stripeSubId ? 'mo' : 'recurring'}` : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-cyan-400 font-black">${(client.totalPayment || 0).toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {formatClientDate(client.paymentDate)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setCheckoutForm({
                              clientId: client.id,
                              amount: client.recurringAmount?.toString() || '1500',
                              serviceName: client.services || 'Premium Monthly Retainer',
                              billingInterval: 'month'
                            });
                            setIsCheckoutModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1"
                          title="Generate Stripe Link"
                        >
                          💳 Stripe Billing
                        </button>
                        <button
                          onClick={async () => {
                            setSelectedClient(client);
                            const today = new Date();
                            const month = String(today.getMonth() + 1).padStart(2, '0');
                            const day = String(today.getDate()).padStart(2, '0');
                            const year = today.getFullYear();
                            const formattedDate = `${month}/${day}/${year}`;
                            
                            let nextNumberStr = '2309';
                            try {
                              const res = await fetch('/api/invoices/next-number');
                              const data = await res.json();
                              if (data.nextNumber) {
                                nextNumberStr = data.nextNumber.toString();
                              }
                            } catch (err) {
                              console.error('Error fetching sequential invoice number:', err);
                            }
                            
                            let billToText = '';
                            if (client.company) {
                              billToText += `${client.company}\n`;
                              billToText += `c/o ${client.name}\n`;
                            } else {
                              billToText += `${client.name}\n`;
                            }
                            if (client.email) {
                              billToText += `${client.email}\n`;
                            }
                            if (client.phone) {
                              billToText += `${client.phone}`;
                            }
                            billToText = billToText.trim();

                            setInvoiceForm({
                              senderName: agencySettings?.agencyName || 'Datalazo LLC',
                              senderAddress: '7682 Tahitti Lane Apt 203\nLake Worth FL 33467',
                              billTo: billToText,
                              invoiceNumber: nextNumberStr,
                              invoiceDate: formattedDate,
                              items: [
                                {
                                  id: Math.random().toString(36).substr(2, 9),
                                  description: client.services || '2025 Business & personal Income Tax processing fee',
                                  amount: client.recurringAmount || 450
                                }
                              ],
                              terms: `Make check payable to ${agencySettings?.agencyName || agencySettings?.senderName || 'Datalazo LLC'}\nVia Zelle at ${agencySettings?.senderEmail || '305.903.7963'}`
                            });
                            setIsInvoiceModalOpen(true);
                          }}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Create Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setEditForm({
                              id: client.id,
                              name: client.name,
                              email: client.email,
                              phone: client.phone || '',
                              company: client.company || '',
                              services: client.services,
                              notes: client.notes || '',
                              totalPayment: client.totalPayment || 0,
                              paymentDate: client.paymentDate ? new Date(client.paymentDate).toISOString().split('T')[0] : '',
                              stripeStatus: client.stripeStatus || '',
                              recurringAmount: client.recurringAmount || 0
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Edit Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete Client"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Client Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleManualSubmit} className="glass w-full max-w-3xl p-8 border-fuchsia-500/20 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">
                Register Manual Client
              </h2>
              <button type="button" onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Full Name *</label>
                <input 
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm"
                  placeholder="e.g. Acme CEO"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Email Address *</label>
                <input 
                  type="email"
                  required
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm"
                  placeholder="e.g. contact@acme.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Phone Number</label>
                <input 
                  type="text"
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm"
                  placeholder="e.g. +1 555-0199"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Company</label>
                <input 
                  type="text"
                  value={manualForm.company}
                  onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm"
                  placeholder="e.g. Acme Inc."
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Services Offered *</label>
                <input 
                  type="text"
                  required
                  value={manualForm.services}
                  onChange={(e) => setManualForm({ ...manualForm, services: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm"
                  placeholder="e.g. Premium SEO Retainer"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Payments Collected ($)</label>
                <input 
                  type="number"
                  value={manualForm.totalPayment}
                  onChange={(e) => setManualForm({ ...manualForm, totalPayment: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Internal Notes</label>
              <textarea 
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-sm resize-none"
                placeholder="Include custom terms or details..."
              />
            </div>

            <div className="flex justify-end gap-4 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-400">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-8 py-2 bg-fuchsia-500 text-white font-black uppercase rounded-xl hover:bg-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                {isSaving ? 'Creating...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="glass w-full max-w-3xl p-8 border-cyan-500/20 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">
                Edit Client: <span className="text-fuchsia-400">{editForm.name}</span>
              </h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Phone</label>
                <input 
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Company</label>
                <input 
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Services Offered</label>
                <input 
                  type="text"
                  required
                  value={editForm.services}
                  onChange={(e) => setEditForm({ ...editForm, services: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Recurring Amount ($)</label>
                <input 
                  type="number"
                  value={editForm.recurringAmount}
                  onChange={(e) => setEditForm({ ...editForm, recurringAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Total Payment Recieved ($)</label>
                <input 
                  type="number"
                  value={editForm.totalPayment}
                  onChange={(e) => setEditForm({ ...editForm, totalPayment: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Last Payment / Billing Date</label>
                <input 
                  type="date"
                  value={editForm.paymentDate}
                  onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Notes</label>
              <textarea 
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-400">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-8 py-2 bg-cyan-500 text-black font-black uppercase rounded-xl hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stripe checkout config modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCheckoutSubmit} className="glass w-full max-w-md p-8 border-indigo-500/20 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight italic text-indigo-400">
                Setup Stripe Subscription
              </h2>
              <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Subscription Price ($ / recurring)</label>
                <input 
                  type="number"
                  required
                  value={checkoutForm.amount}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="e.g. 1500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Service description (Stripe invoice header)</label>
                <input 
                  type="text"
                  required
                  value={checkoutForm.serviceName}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, serviceName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Billing Interval</label>
                <select 
                  value={checkoutForm.billingInterval}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, billingInterval: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="month">Monthly Subscription</option>
                  <option value="year">Yearly Subscription</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-indigo-400/70 hover:text-indigo-400">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-8 py-2 bg-indigo-600 text-white font-black uppercase rounded-xl hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                {isSaving ? 'Connecting...' : 'Go to Stripe'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && invoiceForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto invoice-modal-backdrop">
          <style>{`
            @media print {
              html, body, #__next, [data-nextjs-scroll-focus-boundary] {
                background: #ffffff !important;
                color: #000000 !important;
              }
              body * {
                visibility: hidden !important;
              }
              #invoice-print-sheet, #invoice-print-sheet * {
                visibility: visible !important;
              }
              #invoice-print-sheet {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 1.5in !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
              }
              .invoice-modal-backdrop, .invoice-modal-card, .invoice-modal-scroll {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
              }
              .no-print {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>
          
          <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] invoice-modal-card">
            {/* Control panel / Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 no-print">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight italic text-emerald-400">
                  Invoice Creator
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Customize line items, amounts, and click to print/save as a vector PDF.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSendingInvoice}
                  onClick={() => handleSaveInvoiceRecord(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase rounded-xl text-xs hover:scale-[1.02] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                >
                  {isSendingInvoice ? 'Sending...' : '📧 Email Invoice'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const saved = await handleSaveInvoiceRecord(false);
                    if (saved) {
                      window.print();
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl text-xs hover:scale-[1.02] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Scrollable invoice container */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50 rounded-xl border border-white/5 flex justify-center invoice-modal-scroll">
              <div 
                id="invoice-print-sheet" 
                className="w-[8.5in] min-h-[11in] bg-white text-zinc-900 p-12 shadow-xl flex flex-col justify-between font-sans border border-slate-200"
              >
                <div>
                  {/* Top row: Sender info vs Invoice header & logo */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-1 w-[60%]">
                      {/* Sender Name */}
                      <input 
                        type="text"
                        value={invoiceForm.senderName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderName: e.target.value })}
                        className="w-full text-xl font-bold text-zinc-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-0.5 focus:outline-none transition-all"
                        placeholder="Sender Company Name"
                      />
                      {/* Sender Address */}
                      <textarea 
                        value={invoiceForm.senderAddress}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderAddress: e.target.value })}
                        rows={2}
                        className="w-full text-sm text-zinc-600 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-0.5 focus:outline-none resize-none leading-relaxed transition-all"
                        placeholder="Sender Address"
                      />
                    </div>
                    
                    <div className="flex flex-col items-end w-[40%]">
                      <div className="text-2xl font-bold tracking-wider text-zinc-900 mb-2">INVOICE</div>
                      <img src="/logo.png" alt="Datalazo Logo" className="w-16 h-16 rounded-xl object-contain shadow-sm bg-orange-500 p-1.5" />
                    </div>
                  </div>
                  
                  {/* Bill To & Invoice details row */}
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                      <div className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Bill To</div>
                      <textarea 
                        value={invoiceForm.billTo}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, billTo: e.target.value })}
                        rows={4}
                        className="w-full text-sm font-semibold text-zinc-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-1 focus:outline-none resize-none leading-relaxed transition-all"
                        placeholder="Client Address / Billing Details"
                      />
                    </div>
                    
                    <div className="flex flex-col items-end justify-start space-y-2 mt-6">
                      <div className="flex items-center w-full max-w-[240px] justify-between">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Invoice #</span>
                        <input 
                          type="text"
                          value={invoiceForm.invoiceNumber}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                          className="w-32 text-sm font-bold text-zinc-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-0.5 focus:outline-none text-right transition-all"
                        />
                      </div>
                      <div className="flex items-center w-full max-w-[240px] justify-between">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Invoice Date</span>
                        <input 
                          type="text"
                          value={invoiceForm.invoiceDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                          className="w-32 text-sm font-bold text-zinc-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-0.5 focus:outline-none text-right transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Line items table */}
                  <div className="mb-12">
                    <table className="w-full text-left border-collapse border border-slate-300">
                      <thead>
                        <tr className="border-b-2 border-slate-300 text-xs font-bold text-slate-700 uppercase bg-slate-50">
                          <th className="py-2.5 px-4 w-[75%] border-r border-slate-300">DESCRIPTION</th>
                          <th className="py-2.5 px-4 text-right w-[25%]">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {invoiceForm.items.map((item, idx) => (
                          <tr key={item.id} className="group/row">
                            <td className="py-2 px-3 border-r border-slate-300 relative group/td">
                              <input 
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const newItems = [...invoiceForm.items];
                                  newItems[idx].description = e.target.value;
                                  setInvoiceForm({ ...invoiceForm, items: newItems });
                                }}
                                className="w-full text-sm text-zinc-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-1 focus:outline-none transition-all"
                                placeholder="Enter description..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (invoiceForm.items.length > 1) {
                                    const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                                    setInvoiceForm({ ...invoiceForm, items: newItems });
                                  } else {
                                    showToast('Invoice must have at least one item', 'error');
                                  }
                                }}
                                className="no-print absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/td:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all"
                                title="Delete item"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-sm text-zinc-800">$</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={item.amount || ''}
                                  onChange={(e) => {
                                    const newItems = [...invoiceForm.items];
                                    newItems[idx].amount = parseFloat(e.target.value) || 0;
                                    setInvoiceForm({ ...invoiceForm, items: newItems });
                                  }}
                                  className="w-24 text-sm text-zinc-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-1 focus:outline-none text-right transition-all"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Add Row Button Row */}
                        <tr className="no-print border-t border-slate-200 bg-slate-50/30">
                          <td colSpan={2} className="py-2 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                const newItem: InvoiceItem = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  description: '',
                                  amount: 0
                                };
                                setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, newItem] });
                              }}
                              className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-500 uppercase flex items-center gap-1 hover:underline"
                            >
                              ➕ Add Line Item
                            </button>
                          </td>
                        </tr>
                        
                        {/* Total Row */}
                        <tr className="border-t border-slate-300">
                          <td className="py-3 px-4 text-right font-bold text-sm text-zinc-900 border-r border-slate-300 uppercase">
                            TOTAL
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-base text-zinc-900 bg-slate-50 border-l border-slate-300">
                            ${invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Footer / Terms & Conditions */}
                <div className="border-t border-slate-200 pt-6 mt-auto">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Terms & Conditions</div>
                  <textarea 
                    value={invoiceForm.terms}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                    rows={4}
                    className="w-full text-xs text-zinc-500 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50/50 rounded px-2 py-1 focus:outline-none resize-none leading-relaxed transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight italic text-fuchsia-400">
                  Invoice Registry History
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">List of all created and emailed client invoices.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {invoiceHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No invoices found in history registry.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-white/[0.01]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Client / Company</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoiceHistory.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors text-sm text-slate-200">
                        <td className="py-3.5 px-4 font-mono font-bold text-fuchsia-400">
                          <button
                            type="button"
                            onClick={() => {
                              let billToText = '';
                              if (invoice.clientCompany) {
                                billToText += `${invoice.clientCompany}\n`;
                                billToText += `c/o ${invoice.clientName}\n`;
                              } else {
                                billToText += `${invoice.clientName}\n`;
                              }
                              if (invoice.clientEmail) {
                                billToText += `${invoice.clientEmail}\n`;
                              }
                              if (invoice.clientPhone) {
                                billToText += `${invoice.clientPhone}`;
                              }
                              billToText = billToText.trim();

                              const mappedItems = Array.isArray(invoice.items) 
                                ? (invoice.items as any[]).map((item: any) => ({
                                    id: item.id || Math.random().toString(36).substr(2, 9),
                                    description: item.description || '',
                                    amount: item.amount || 0
                                  }))
                                : [];

                              setInvoiceForm({
                                senderName: agencySettings?.agencyName || 'Datalazo LLC',
                                senderAddress: '7682 Tahitti Lane Apt 203\nLake Worth FL 33467',
                                billTo: billToText,
                                invoiceNumber: invoice.invoiceNumber.toString(),
                                invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-US'),
                                items: mappedItems,
                                terms: invoice.terms || ''
                              });
                              setIsHistoryModalOpen(false);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="hover:underline text-left"
                          >
                            #{invoice.invoiceNumber}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{invoice.clientName}</div>
                          {invoice.clientCompany && (
                            <div className="text-xs text-slate-500">{invoice.clientCompany}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            invoice.status === 'EMAILED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
