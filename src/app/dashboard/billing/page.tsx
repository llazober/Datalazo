"use client";

import React, { useState, useEffect } from 'react';

interface ClientOption {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  schedule_id?: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';
  issue_date: string;
  due_date: string;
  paid_at?: string | null;
  payment_method?: string | null;
  transaction_ref?: string | null;
  notes?: string | null;
  description?: string | null;
  legal_name: string;
  client_name: string;
  email: string;
}

interface ScheduleRecord {
  id: string;
  customer_id: string;
  billing_amount: number;
  currency: string;
  billing_day: number;
  description: string;
  auto_send: boolean;
  payment_terms_days: number;
  status: string;
  last_billed_at?: string | null;
  legal_name: string;
  client_name: string;
  email: string;
}

interface OverviewStats {
  mrr: number;
  active_subscribers: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
  count_sent: number;
  count_paid: number;
  count_overdue: number;
}

export default function BillingDashboardPage() {
  const [overview, setOverview] = useState<OverviewStats>({
    mrr: 0,
    active_subscribers: 0,
    total_collected: 0,
    total_outstanding: 0,
    total_overdue: 0,
    count_sent: 0,
    count_paid: 0,
    count_overdue: 0
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);

  const [activeTab, setActiveTab] = useState<'invoices' | 'schedules'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    clientId: '',
    billingAmount: '',
    billingDay: '1',
    description: 'Monthly Advisory & Retainer',
    autoSend: true,
    paymentTermsDays: '15'
  });

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    amount: '',
    dueDays: '15',
    description: 'Professional Services Rendered',
    sendNow: true
  });

  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [paidForm, setPaidForm] = useState({
    invoiceId: '',
    invoiceNumber: '',
    paymentMethod: 'ACH / Bank Transfer',
    transactionRef: '',
    notes: ''
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverview(),
        fetchInvoices(),
        fetchSchedules(),
        fetchClients()
      ]);
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchOverview = async () => {
    const res = await fetch('/api/billing/overview');
    if (res.ok) {
      const data = await res.json();
      setOverview(data);
    }
  };

  const fetchInvoices = async () => {
    const res = await fetch(`/api/billing/invoices?status=${statusFilter}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices || []);
    }
  };

  const fetchSchedules = async () => {
    const res = await fetch('/api/billing/schedules');
    if (res.ok) {
      const data = await res.json();
      setSchedules(data.schedules || []);
    }
  };

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients || data || []);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleRunDailyBillingJob = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/run-scheduler', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Automated job completed! Generated ${data.generatedCount || 0} invoice(s).`);
        fetchOverview();
        fetchInvoices();
        fetchSchedules();
      } else {
        showToast(data.error || data.message || 'Failed to run billing job', 'error');
      }
    } catch (err) {
      showToast('Error executing billing job', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule modal submit
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.clientId || !scheduleForm.billingAmount) {
      showToast('Please select a client and enter a billing amount.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const isEdit = !!editingScheduleId;
      const url = isEdit ? `/api/billing/schedules/${editingScheduleId}` : '/api/billing/schedules';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: scheduleForm.clientId,
          billing_amount: scheduleForm.billingAmount,
          billing_day: scheduleForm.billingDay,
          description: scheduleForm.description,
          auto_send: scheduleForm.autoSend,
          payment_terms_days: scheduleForm.paymentTermsDays
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Billing schedule updated.' : 'New recurring billing schedule created!');
        setIsScheduleModalOpen(false);
        setEditingScheduleId(null);
        setScheduleForm({
          clientId: '',
          billingAmount: '',
          billingDay: '1',
          description: 'Monthly Advisory & Retainer',
          autoSend: true,
          paymentTermsDays: '15'
        });
        fetchOverview();
        fetchSchedules();
      } else {
        showToast(data.error || 'Failed to save schedule', 'error');
      }
    } catch (err) {
      showToast('Error saving schedule', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditSchedule = (s: ScheduleRecord) => {
    setEditingScheduleId(s.id);
    setScheduleForm({
      clientId: s.customer_id,
      billingAmount: String(s.billing_amount),
      billingDay: String(s.billing_day),
      description: s.description || '',
      autoSend: s.auto_send,
      paymentTermsDays: String(s.payment_terms_days || 15)
    });
    setIsScheduleModalOpen(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring billing schedule?')) return;
    try {
      const res = await fetch(`/api/billing/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Schedule deleted.');
        fetchOverview();
        fetchSchedules();
      } else {
        showToast('Failed to delete schedule', 'error');
      }
    } catch (err) {
      showToast('Error deleting schedule', 'error');
    }
  };

  // Manual Invoice submit
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientId || !invoiceForm.amount) {
      showToast('Please select a client and enter an invoice amount.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: invoiceForm.clientId,
          amount: invoiceForm.amount,
          due_days: invoiceForm.dueDays,
          description: invoiceForm.description,
          send_now: invoiceForm.sendNow
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Invoice #${data.invoice_number} created ${invoiceForm.sendNow ? 'and sent via email!' : 'as DRAFT.'}`);
        setIsInvoiceModalOpen(false);
        setInvoiceForm({
          clientId: '',
          amount: '',
          dueDays: '15',
          description: 'Professional Services Rendered',
          sendNow: true
        });
        fetchOverview();
        fetchInvoices();
      } else {
        showToast(data.error || 'Failed to create invoice', 'error');
      }
    } catch (err) {
      showToast('Error creating invoice', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoiceEmail = async (invId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${invId}/send`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Invoice emailed successfully!');
        fetchOverview();
        fetchInvoices();
      } else {
        showToast(data.error || 'Failed to email invoice', 'error');
      }
    } catch (err) {
      showToast('Error emailing invoice', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openMarkPaidModal = (inv: InvoiceRecord) => {
    setPaidForm({
      invoiceId: inv.id,
      invoiceNumber: inv.invoice_number,
      paymentMethod: 'ACH / Bank Transfer',
      transactionRef: '',
      notes: ''
    });
    setIsPaidModalOpen(true);
  };

  const handleMarkAsPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${paidForm.invoiceId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          payment_method: paidForm.paymentMethod,
          transaction_ref: paidForm.transactionRef,
          notes: paidForm.notes
        })
      });

      if (res.ok) {
        showToast(`Invoice #${paidForm.invoiceNumber} marked as PAID!`);
        setIsPaidModalOpen(false);
        fetchOverview();
        fetchInvoices();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update invoice status', 'error');
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidInvoice = async (inv: InvoiceRecord) => {
    if (!confirm(`Are you sure you want to VOID/CANCEL invoice #${inv.invoice_number}?`)) return;
    try {
      const res = await fetch(`/api/billing/invoices/${inv.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', notes: 'Voided by admin' })
      });
      if (res.ok) {
        showToast(`Invoice #${inv.invoice_number} voided.`);
        fetchOverview();
        fetchInvoices();
        fetchSchedules();
      } else {
        showToast('Failed to void invoice', 'error');
      }
    } catch (err) {
      showToast('Error voiding invoice', 'error');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to permanently DELETE this invoice record?')) return;
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Invoice record deleted.');
        fetchOverview();
        fetchInvoices();
        fetchSchedules();
      } else {
        showToast('Failed to delete invoice', 'error');
      }
    } catch (err) {
      showToast('Error deleting invoice', 'error');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.legal_name.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) ||
      (inv.description && inv.description.toLowerCase().includes(q));
    return matchSearch;
  });

  // Filtered schedules
  const filteredSchedules = schedules.filter(sch => {
    const q = searchTerm.toLowerCase();
    return (
      sch.legal_name.toLowerCase().includes(q) ||
      sch.email.toLowerCase().includes(q) ||
      (sch.description && sch.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-3 transition-all ${
          toastMessage.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'
        }`}>
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <span>💳</span>
            <span>Billing & <span className="text-emerald-400">Recurring Invoicing</span></span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Manage client subscriptions, dispatch automated Resend invoices, and monitor revenue performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunDailyBillingJob}
            disabled={actionLoading}
            className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
            title="Run daily automated recurring billing job"
          >
            <span>⚡</span>
            <span>{actionLoading ? 'Processing...' : 'Run Billing Job'}</span>
          </button>

          <button
            onClick={() => {
              setEditingScheduleId(null);
              setScheduleForm({
                clientId: clients[0]?.id || '',
                billingAmount: '',
                billingDay: '1',
                description: 'Monthly Advisory & Retainer',
                autoSend: true,
                paymentTermsDays: '15'
              });
              setIsScheduleModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <span>🔄</span>
            <span>+ New Schedule</span>
          </button>

          <button
            onClick={() => {
              setInvoiceForm({
                clientId: clients[0]?.id || '',
                amount: '',
                dueDays: '15',
                description: 'Professional Services Rendered',
                sendNow: true
              });
              setIsInvoiceModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <span>➕</span>
            <span>+ New Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Monthly Recurring (MRR)</div>
          <div className="text-2xl md:text-3xl font-black text-cyan-400 mt-2">
            ${overview.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-400 ml-1">/ mo</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">{overview.active_subscribers} active subscriber(s)</div>
          <div className="absolute top-4 right-4 text-cyan-500/20 text-3xl font-bold">📈</div>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Subscribers</div>
          <div className="text-2xl md:text-3xl font-black text-purple-400 mt-2">{overview.active_subscribers}</div>
          <div className="text-xs text-slate-500 mt-2">Recurring billing schedules</div>
          <div className="absolute top-4 right-4 text-purple-500/20 text-3xl font-bold">🔄</div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Collected</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-2">
            ${overview.total_collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">{overview.count_paid} invoice(s) paid</div>
          <div className="absolute top-4 right-4 text-emerald-500/20 text-3xl font-bold">💰</div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Outstanding / Overdue</div>
          <div className="text-2xl md:text-3xl font-black text-amber-400 mt-2">
            ${overview.total_outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-red-400 mt-2">${overview.total_overdue.toLocaleString('en-US', { minimumFractionDigits: 2 })} overdue</div>
          <div className="absolute top-4 right-4 text-amber-500/20 text-3xl font-bold">⏳</div>
        </div>
      </div>

      {/* Tabs & Controls Section */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'invoices'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧾 Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'schedules'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔄 Recurring Schedules ({schedules.length})
            </button>
          </div>

          {/* Controls: Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'invoices' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent / Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled / Void</option>
              </select>
            )}

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, invoice #, description..."
              className="bg-slate-950 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
        </div>

        {/* Tab 1: Invoices Table */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading invoice history...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No invoices found matching current filters.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/40">
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Service Description</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-white">{inv.invoice_number}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{inv.legal_name}</div>
                        <div className="text-[11px] text-slate-500">{inv.email}</div>
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate text-slate-400">{inv.description || 'N/A'}</td>
                      <td className="py-4 px-4 text-slate-400">{inv.issue_date}</td>
                      <td className="py-4 px-4 text-slate-400">{inv.due_date}</td>
                      <td className="py-4 px-4 text-right font-bold text-white text-sm">
                        ${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : inv.status === 'OVERDUE'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : inv.status === 'SENT'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : inv.status === 'DRAFT'
                              ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5">
                        {/* View HTML Printable */}
                        <button
                          onClick={() => {
                            setViewInvoiceId(inv.id);
                            setIsViewModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] transition-all"
                          title="View / Print Printable Invoice HTML"
                        >
                          📄 View
                        </button>

                        {/* Send / Resend Email */}
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleSendInvoiceEmail(inv.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-lg font-semibold text-[11px] transition-all"
                            title="Send invoice via Resend Email"
                          >
                            📧 Email
                          </button>
                        )}

                        {/* Mark as Paid */}
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openMarkPaidModal(inv)}
                            className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg font-semibold text-[11px] transition-all"
                            title="Mark Invoice as Paid"
                          >
                            💳 Paid
                          </button>
                        )}

                        {/* Void / Cancel */}
                        {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleVoidInvoice(inv)}
                            className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg font-semibold text-[11px] transition-all"
                            title="Void / Cancel Invoice"
                          >
                            ❌ Void
                          </button>
                        )}

                        {/* Delete Record */}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="px-2 py-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                          title="Delete Invoice Record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Recurring Schedules Table */}
        {activeTab === 'schedules' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading recurring schedules...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No recurring schedules set up yet.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/40">
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Billing Day</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Monthly Amount</th>
                    <th className="py-3.5 px-4 text-center">Payment Terms</th>
                    <th className="py-3.5 px-4 text-center">Auto-Send</th>
                    <th className="py-3.5 px-4 text-center">Last Billed</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSchedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        <div>{sch.legal_name}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{sch.email}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400">Day {sch.billing_day} / mo</td>
                      <td className="py-4 px-4 max-w-xs truncate text-slate-400">{sch.description || 'N/A'}</td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-400 text-sm">
                        ${sch.billing_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-400">{sch.payment_terms_days} days</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          sch.auto_send ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {sch.auto_send ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500">
                        {sch.last_billed_at ? sch.last_billed_at.split('T')[0] : 'Never'}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditSchedule(sch)}
                          className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg font-semibold text-[11px] transition-all hover:bg-indigo-600/30"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                          title="Delete Schedule"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL 1: NEW / EDIT SCHEDULE ────────────────────────────────────── */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🔄</span>
                <span>{editingScheduleId ? 'Edit Recurring Schedule' : 'New Recurring Billing Schedule'}</span>
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Select Client *</label>
                <select
                  value={scheduleForm.clientId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, clientId: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company ? `${c.company} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Monthly Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={scheduleForm.billingAmount}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, billingAmount: e.target.value })}
                    placeholder="e.g. 500.00"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Billing Day of Month (1 - 31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleForm.billingDay}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, billingDay: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Service Description</label>
                <input
                  type="text"
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Monthly Accounting & Tax Retainer"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={scheduleForm.paymentTermsDays}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, paymentTermsDays: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="autoSendCheck"
                    checked={scheduleForm.autoSend}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, autoSend: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="autoSendCheck" className="text-slate-300 font-semibold cursor-pointer">
                    Auto-Send Email on Billing Date
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg"
                >
                  {actionLoading ? 'Saving...' : editingScheduleId ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: NEW MANUAL INVOICE ────────────────────────────────────── */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🧾</span>
                <span>Create Manual Invoice</span>
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Select Client *</label>
                <select
                  value={invoiceForm.clientId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company ? `${c.company} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="e.g. 1250.00"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Due Days *</label>
                  <input
                    type="number"
                    value={invoiceForm.dueDays}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDays: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Description</label>
                <textarea
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sendNowCheck"
                  checked={invoiceForm.sendNow}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, sendNow: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-white/20 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sendNowCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Send Immediate Invoice Email via Resend
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg"
                >
                  {actionLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: MARK AS PAID ────────────────────────────────────────── */}
      {isPaidModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>💳</span>
                <span>Mark Invoice #{paidForm.invoiceNumber} as Paid</span>
              </h3>
              <button
                onClick={() => setIsPaidModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMarkAsPaidSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Payment Method</label>
                <select
                  value={paidForm.paymentMethod}
                  onChange={(e) => setPaidForm({ ...paidForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACH / Bank Transfer">ACH / Bank Transfer</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card / Stripe">Credit Card / Stripe</option>
                  <option value="Cash / Wire">Cash / Wire</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Transaction Reference / Check #</label>
                <input
                  type="text"
                  value={paidForm.transactionRef}
                  onChange={(e) => setPaidForm({ ...paidForm, transactionRef: e.target.value })}
                  placeholder="e.g. Check #1042 or Ref #98234"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">Notes</label>
                <input
                  type="text"
                  value={paidForm.notes}
                  onChange={(e) => setPaidForm({ ...paidForm, notes: e.target.value })}
                  placeholder="Additional payment details..."
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPaidModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: VIEW / PRINT HTML INVOICE ─────────────────────────────── */}
      {isViewModalOpen && viewInvoiceId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-4xl w-full h-[90vh] p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>📄</span>
                <span>Printable HTML Invoice Preview</span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const iframe = document.getElementById('invoicePreviewFrame') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.print();
                    }
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  🖨️ Print Invoice
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setViewInvoiceId(null);
                  }}
                  className="text-slate-400 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-inner">
              <iframe
                id="invoicePreviewFrame"
                src={`/api/billing/invoices/${viewInvoiceId}/view`}
                className="w-full h-full border-none"
                title="Invoice Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
