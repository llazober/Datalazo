import React from 'react';
import { prisma } from '@/lib/prisma';
import LeadTable from '@/components/LeadTable';

export default async function DashboardPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Convert Date objects to strings for Client Component serialization
  const serializedLeads = leads.map(lead => ({
    ...lead,
    createdAt: lead.createdAt.toISOString()
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Overview</h1>
          <p className="text-slate-400">Manage and track your incoming business requests.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass text-sm font-semibold rounded-lg hover:bg-white/5 transition-all">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-accent-cyan text-black text-sm font-bold rounded-lg hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            Refresh Data
          </button>
        </div>
      </div>

      <LeadTable initialLeads={serializedLeads} />
    </div>
  );
}
