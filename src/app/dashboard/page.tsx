import React from 'react';
import { prisma } from '@/lib/prisma';
import LeadTable from '@/components/LeadTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Convert Date objects to strings for Client Component serialization
    const serializedLeads = leads.map(lead => ({
      ...lead,
      createdAt: lead.createdAt.toISOString()
    }));

    return (
      <div className="space-y-8 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads Overview</h1>
            <p className="text-slate-400">Manage and track your incoming business requests.</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/dashboard/bookings"
              className="px-4 py-2 bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Manage Bookings
            </a>
            <a 
              href="/dashboard/seo"
              className="px-4 py-2 bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              SEO Manager
            </a>
            <a 
              href="/dashboard/settings"
              className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </div>
        </div>

        <LeadTable initialLeads={serializedLeads} />
      </div>
    );
  } catch (error) {
    console.error('Dashboard Data Fetch Error:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Database Connection Error</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          We were unable to connect to your database. Please check your DATABASE_URL in Easypanel and ensure your database is running.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }
}
