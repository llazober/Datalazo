"use client";

import React, { useState } from 'react';

export default function SystemBackupsPage() {
  const backupAppUrl = process.env.NEXT_PUBLIC_BACKUP_APP_URL || 'http://localhost:5050';
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 h-full flex flex-col">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Datalazo Infrastructure Protection
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System & Database Backup Suite</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage automated & manual backups for DigitalOcean PostgreSQL (`datalazo`, `VRT`), DigitalOcean Storage OS, and Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Dashboard
          </button>
          <a
            href={backupAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            Open Standalone Suite
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Embedded Backup App Iframe */}
      <div className="flex-1 w-full min-h-[700px] bg-[#030712] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        <iframe
          key={iframeKey}
          src={backupAppUrl}
          title="DigitalOcean & Google Drive Backup Suite"
          className="w-full h-full border-0 min-h-[700px]"
        />
      </div>
    </div>
  );
}
