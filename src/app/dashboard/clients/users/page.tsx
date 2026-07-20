"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string;
}

interface ClientUser {
  id: string;
  username: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsAcceptedIp: string | null;
  termsAcceptedUserAgent: string | null;
  monthlyUsageActual: number;
  monthlyUsagePrevious: number;
  client: Client;
}

export default function ClientUsersPage() {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'pending'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/clients/users');
      if (!res.ok) throw new Error('Failed to fetch client users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching client users:', err);
      showToast('Failed to load client users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const acceptedUsersCount = users.filter(u => u.termsAccepted).length;
  const complianceRate = totalUsers > 0 ? Math.round((acceptedUsersCount / totalUsers) * 100) : 100;
  const totalActualUsage = users.reduce((sum, u) => sum + u.monthlyUsageActual, 0);
  const totalPreviousUsage = users.reduce((sum, u) => sum + u.monthlyUsagePrevious, 0);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.client.company && u.client.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'accepted') return matchesSearch && u.termsAccepted;
    if (statusFilter === 'pending') return matchesSearch && !u.termsAccepted;
    return matchesSearch;
  });

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
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

      {/* Back button */}
      <Link href="/dashboard/clients" className="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 mb-6 flex items-center gap-2 uppercase tracking-widest transition-colors w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Clients
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight italic">
          Client Users <span className="text-indigo-400">Compliance & Usage</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Audit active client accounts, verify legal agreement acceptances, and monitor OpenAI token utilization.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 border-indigo-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Total Client Users</div>
          <div className="text-3xl font-black text-indigo-400">{totalUsers}</div>
        </div>
        <div className="glass p-6 border-emerald-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Compliance Rate</div>
          <div className="text-3xl font-black text-emerald-400">{complianceRate}%</div>
        </div>
        <div className="glass p-6 border-fuchsia-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Total Current Usage</div>
          <div className="text-3xl font-black text-fuchsia-400">{totalActualUsage.toLocaleString()}</div>
        </div>
        <div className="glass p-6 border-cyan-500/10">
          <div className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Total Previous Usage</div>
          <div className="text-3xl font-black text-cyan-400">{totalPreviousUsage.toLocaleString()}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'accepted', 'pending'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                statusFilter === filter
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'All Users' : filter === 'accepted' ? 'Accepted' : 'Pending'}
            </button>
          ))}
        </div>

        <input 
          type="text" 
          placeholder="Search by username, company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors w-full md:w-80"
        />
      </div>

      {/* Main Table Card */}
      <div className="glass border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-white/[0.01]">
                <th className="py-4 px-6 w-[25%]">Client / Company</th>
                <th className="py-4 px-6 w-[20%]">Username</th>
                <th className="py-4 px-6 w-[15%]">Actual Usage (Current)</th>
                <th className="py-4 px-6 w-[15%]">Previous Usage</th>
                <th className="py-4 px-6 w-[15%]">Terms Status</th>
                <th className="py-4 px-6 w-[10%] text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No client users found matching filter criteria.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  
                  return (
                    <React.Fragment key={user.id}>
                      <tr 
                        className="group hover:bg-white/[0.02] transition-all cursor-pointer" 
                        onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-100">{user.client.name}</div>
                          <div className="text-xs text-slate-500">{user.client.email}</div>
                          {user.client.company && (
                            <div className="inline-block bg-white/5 border border-white/10 text-[9px] px-2 py-0.5 rounded-md mt-1 font-bold uppercase tracking-wider text-slate-400">
                              🏢 {user.client.company}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-300">
                          {user.username}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black text-fuchsia-400">{user.monthlyUsageActual.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-400">{user.monthlyUsagePrevious.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            user.termsAccepted 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {user.termsAccepted ? 'Accepted' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedUserId(isExpanded ? null : user.id);
                            }}
                          >
                            <svg 
                              className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable audit log details */}
                      {isExpanded && (
                        <tr className="bg-white/[0.01]">
                          <td colSpan={6} className="py-4 px-8 border-t border-white/5">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                                <div className="space-y-2 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Legal Acceptance Trail</div>
                                  <div><span className="font-bold text-slate-300">Compliance Status:</span> {user.termsAccepted ? 'Agreed to Terms of Service' : 'Pending Agreement'}</div>
                                  <div><span className="font-bold text-slate-300">Signed Timestamp:</span> {formatDateTime(user.termsAcceptedAt)}</div>
                                </div>
                                <div className="space-y-2 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Access Location</div>
                                  <div><span className="font-bold text-slate-300">Signing IP Address:</span> {user.termsAcceptedIp || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs text-slate-400">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Browser User Agent</div>
                                <div className="font-mono text-[11px] text-slate-500 break-all select-all leading-relaxed bg-black/30 p-3 rounded-lg border border-white/[0.02]">
                                  {user.termsAcceptedUserAgent || 'No user agent metadata available.'}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
