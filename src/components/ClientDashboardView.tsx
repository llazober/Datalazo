"use client";

import React, { useState } from 'react';
import TermsModal from '@/components/TermsModal';

interface ClientUserSummary {
  username: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsAcceptedIp: string | null;
}

interface ClientData {
  id: string;
  name: string;
  company: string | null;
  email: string;
  users: ClientUserSummary[];
}

interface UserSession {
  id: string;
  username: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsAcceptedIp: string | null;
  monthlyUsageActual: number;
  monthlyUsagePrevious: number;
  clientId: string;
  client: ClientData;
}

interface InvoiceItem {
  description: string;
  amount: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: number;
  amount: number;
  status: string;
  createdAt: string;
  items: InvoiceItem[];
}

interface ClientUserLoginSummary {
  id: string;
  username: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface ClientDashboardViewProps {
  initialUser: UserSession;
  invoices: InvoiceData[];
  logins: ClientUserLoginSummary[];
}

export default function ClientDashboardView({ initialUser, invoices, logins }: ClientDashboardViewProps) {
  const [termsAccepted, setTermsAccepted] = useState(initialUser.termsAccepted);
  const [user, setUser] = useState(initialUser);
  const [isLoginMonitorOpen, setIsLoginMonitorOpen] = useState(false);
  const [loginSearchQuery, setLoginSearchQuery] = useState('');

  const filteredLogins = logins.filter(login => 
    login.username.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
    login.ip.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
    login.userAgent.toLowerCase().includes(loginSearchQuery.toLowerCase())
  );

  const handleTermsAccepted = () => {
    setTermsAccepted(true);
    setUser(prev => ({
      ...prev,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      termsAcceptedIp: 'Recorded (Refresh to view)'
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/client-auth/logout', { method: 'POST' });
      window.location.href = '/client-login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Usage quota representation
  const maxQuota = Math.max(user.monthlyUsageActual * 1.5, 10000);
  const usagePercentage = Math.min((user.monthlyUsageActual / maxQuota) * 100, 100);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden font-sans">
      {/* Clickwrap Overlay */}
      {!termsAccepted && (
        <TermsModal onAccepted={handleTermsAccepted} />
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0a0a0c] flex flex-col p-6 h-full justify-between">
        <div className="space-y-12">
          <div className="flex justify-center pt-4">
            <img 
              src="/logo.png?v=4" 
              alt="Datalazo Logo" 
              className="w-24 h-24 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-white p-1" 
            />
          </div>

          <nav className="space-y-2">
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Workspace
            </div>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold transition-all">
              Overview
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
            <div className="text-sm overflow-hidden">
              <div className="font-bold text-white text-ellipsis overflow-hidden">{user.username}</div>
              <div className="text-xs text-slate-400 text-ellipsis overflow-hidden">{user.client.name}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold uppercase rounded-xl hover:bg-red-500/20 transition-all text-center"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Space */}
      <main className="flex-1 overflow-y-auto bg-white/[0.01] p-6 md:p-10 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex justify-between items-start border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">
              Client <span className="text-indigo-400">Dashboard</span>
            </h1>
            <p className="text-slate-400 mt-1">
              Welcome back, <span className="text-white font-semibold">{user.username}</span>. Scoped client workspace for <span className="text-indigo-400 font-semibold">{user.client.company || user.client.name}</span>.
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Actual Usage */}
          <div className="glass p-6 border-white/5 bg-white/[0.01] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly AI Processing</span>
            <div className="text-4xl font-black italic text-white mt-2">
              {user.monthlyUsageActual.toLocaleString()} <span className="text-xs font-normal text-slate-400 not-italic">queries</span>
            </div>
            <div className="mt-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                <span>0% Usage</span>
                <span>Max Quota Limit</span>
              </div>
            </div>
          </div>

          {/* Card 2: Previous Month Usage */}
          <div className="glass p-6 border-white/5 bg-white/[0.01] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Previous Period Usage</span>
            <div className="text-4xl font-black italic text-white mt-2">
              {user.monthlyUsagePrevious.toLocaleString()} <span className="text-xs font-normal text-slate-400 not-italic">queries</span>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Monthly analytics cycle runs on standard 30-day billing period increments.
            </p>
          </div>

          {/* Card 3: Terms acceptance status */}
          <div className="glass p-6 border-white/5 bg-white/[0.01] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Legal Agreement Compliance</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-white">Terms Accepted</span>
              </div>
            </div>
            {user.termsAcceptedAt && (
              <div className="text-[10px] text-slate-400 space-y-1 mt-4">
                <div><span className="font-bold uppercase tracking-wider text-slate-500">Signed At:</span> {new Date(user.termsAcceptedAt).toLocaleString()}</div>
                <div><span className="font-bold uppercase tracking-wider text-slate-500">Client IP:</span> {user.termsAcceptedIp}</div>
              </div>
            )}
          </div>
        </div>

        {/* Invoices and Workspace Users section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoices List */}
          <div className="lg:col-span-2 glass p-6 md:p-8 border-white/5 bg-white/[0.01] space-y-6">
            <h3 className="text-lg font-black uppercase italic text-white">Billing & Invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-slate-400 text-sm">No invoice records found for your company account.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="pb-3">Invoice Number</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="text-slate-300 hover:text-white transition-colors">
                        <td className="py-4 font-mono">#INV-{inv.invoiceNumber}</td>
                        <td className="py-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 font-bold text-indigo-400">${inv.amount.toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                            inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registered Team Users */}
          <div className="glass p-6 md:p-8 border-white/5 bg-white/[0.01] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase italic text-white">Authorized Users</h3>
              <button 
                onClick={() => setIsLoginMonitorOpen(true)}
                className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
              >
                🔐 Login Monitor
              </button>
            </div>
            <div className="space-y-4">
              {user.client.users.map((teamUser, index) => (
                <div key={index} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="overflow-hidden pr-2">
                    <div className="font-bold text-sm text-slate-200 text-ellipsis overflow-hidden">{teamUser.username}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {teamUser.termsAccepted 
                        ? `Accepted from ${teamUser.termsAcceptedIp || 'IP'}`
                        : 'Pending acceptance'}
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    teamUser.termsAccepted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {teamUser.termsAccepted ? 'AGREED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Login Monitor Modal */}
      {isLoginMonitorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-4xl p-8 border-indigo-500/20 animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight italic text-white">
                  Login <span className="text-indigo-400">Monitor Log</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">Audit security history and verify device authentication trails for workspace accounts.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsLoginMonitorOpen(false)} 
                className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Controls */}
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search by username, IP address, device..."
                value={loginSearchQuery}
                onChange={(e) => setLoginSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors w-full"
              />
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-white/10 rounded-xl bg-white/[0.01]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-white/[0.02]">
                    <th className="py-3 px-6">Username</th>
                    <th className="py-3 px-6">IP Address</th>
                    <th className="py-3 px-6">Device / User Agent</th>
                    <th className="py-3 px-6 text-right">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {filteredLogins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">No login events found matching the filter criteria.</td>
                    </tr>
                  ) : (
                    filteredLogins.map((login) => (
                      <tr key={login.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-200">{login.username}</td>
                        <td className="py-4 px-6 font-mono text-indigo-400">{login.ip}</td>
                        <td className="py-4 px-6 max-w-xs truncate" title={login.userAgent}>
                          {login.userAgent}
                        </td>
                        <td className="py-4 px-6 text-right text-slate-400">
                          {new Date(login.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setIsLoginMonitorOpen(false)}
                className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
