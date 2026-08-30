"use client";

import React, { useState, useEffect } from 'react';

interface EngineStatus {
  online: boolean;
  serverUrl?: string;
  error?: string;
  postgres?: {
    datalazo?: boolean;
    VRT?: boolean;
    host?: string;
    port?: number;
  };
  storage?: {
    connected?: boolean;
    bucket?: string;
  };
  localBackup?: boolean;
  timestamp?: string;
}

interface BackupFile {
  name: string;
  size: number;
  created: string;
  path: string;
}

export default function SystemBackupsPage() {
  const [activeTab, setActiveTab] = useState<'hub' | 'iframe'>('hub');
  const backupAppUrl = process.env.NEXT_PUBLIC_BACKUP_APP_URL || 'http://localhost:5050';
  const [iframeKey, setIframeKey] = useState(0);
  
  // Status states
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Check if browser is running under HTTPS while backup URL is HTTP
  const [isHttpsMismatch, setIsHttpsMismatch] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const isHttpTarget = backupAppUrl.startsWith('http://');
      setIsHttpsMismatch(isHttps && isHttpTarget);
    }
    fetchStatus();
    fetchFiles();
  }, [backupAppUrl]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/backup/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setStatus({ online: false, error: 'Failed to contact Next.js proxy server' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/backup/files');
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        setBackupFiles(data.files);
      }
    } catch (err) {
      console.error('Error fetching backup files:', err);
    }
  };

  const handleTriggerBackup = async (action: 'backup-db' | 'backup-storage', dbName?: string) => {
    const actionId = dbName ? `${action}-${dbName}` : action;
    setTriggering(actionId);
    setToastMessage({ type: 'info', text: `Initiating ${dbName ? `${dbName} database` : 'storage'} backup process...` });

    try {
      const res = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, dbName, destination: 'local' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToastMessage({ type: 'success', text: data.message || 'Backup initiated successfully! Check local backup directory D:\\DBBackup.' });
        setTimeout(() => fetchFiles(), 3000);
      } else {
        setToastMessage({ type: 'error', text: data.error || data.message || 'Failed to trigger backup.' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error communicating with backup engine.' });
    } finally {
      setTriggering(null);
    }
  };

  const handleRefreshIframe = () => {
    setIframeKey((prev) => prev + 1);
    fetchStatus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage({ type: 'success', text: 'URL copied to clipboard!' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 space-y-6 h-full flex flex-col min-h-screen bg-[#030712] text-slate-100">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg text-sm font-medium transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
          toastMessage.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' :
          'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-base">
              {toastMessage.type === 'success' ? '✅' : toastMessage.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-1 bg-white/10 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Datalazo Infrastructure Protection
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System & Database Backup Suite</h1>
          <p className="text-xs text-slate-400 mt-1">
            Integrated control center for DigitalOcean PostgreSQL (`datalazo`, `VRT`), Storage OS (`datalazocrm`), and Local Disk (`D:\DBBackup`).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loadingStatus ? 'Checking Status...' : 'Check Status'}
          </button>
          
          <a
            href={backupAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
          >
            Open Standalone Suite
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* HTTPS / Mixed Content Warning Card (Explains the screenshot error) */}
      {isHttpsMismatch && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-amber-200">
                Browser Security Notice: Mixed Content Restriction Active
              </h3>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                You are accessing Datalazo over secure <strong>HTTPS</strong> (<code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200">https://datalazo.net</code>). 
                Modern browsers block embedding local <strong>HTTP</strong> apps (<code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200">{backupAppUrl}</code>) directly inside an iframe.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={backupAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
                >
                  🚀 Launch Standalone Suite in New Tab
                </a>
                <button
                  onClick={() => copyToClipboard(backupAppUrl)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  📋 Copy App URL ({backupAppUrl})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('hub')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'hub'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Native Management Hub
        </button>

        <button
          onClick={() => setActiveTab('iframe')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'iframe'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
          Embedded Web Suite (Iframe)
        </button>
      </div>

      {/* TAB 1: Native Management Hub */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          
          {/* Infrastructure Health Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Backup Engine Health */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine Process</span>
                <span className={`w-2.5 h-2.5 rounded-full ${status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <div>
                <div className="text-lg font-black text-white">
                  {status?.online ? 'Server Running' : 'Offline / Unreachable'}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">Target: {backupAppUrl}</p>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Port: 5050 | Process: Express Node
              </div>
            </div>

            {/* PostgreSQL datalazo */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DB: datalazo</span>
                <span className={`w-2.5 h-2.5 rounded-full ${status?.postgres?.datalazo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div>
                <div className="text-lg font-black text-white">DigitalOcean PG</div>
                <p className="text-xs text-slate-400 mt-0.5">Host: 161.35.119.223:5432</p>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Primary CRM Database
              </div>
            </div>

            {/* PostgreSQL VRT */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DB: VRT</span>
                <span className={`w-2.5 h-2.5 rounded-full ${status?.postgres?.VRT ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div>
                <div className="text-lg font-black text-white">VRT System PG</div>
                <p className="text-xs text-slate-400 mt-0.5">Host: 161.35.119.223:5432</p>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Secondary System Database
              </div>
            </div>

            {/* Storage OS */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage OS</span>
                <span className={`w-2.5 h-2.5 rounded-full ${status?.storage?.connected !== false ? 'bg-cyan-500' : 'bg-amber-500'}`} />
              </div>
              <div>
                <div className="text-lg font-black text-white">DO Spaces</div>
                <p className="text-xs text-slate-400 mt-0.5">Bucket: datalazocrm (nyc3)</p>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Cloud Object Storage
              </div>
            </div>
          </div>

          {/* Quick Manual Actions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Manual Backup Controls
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Trigger datalazo DB */}
              <button
                onClick={() => handleTriggerBackup('backup-db', 'datalazo')}
                disabled={triggering !== null}
                className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:from-amber-500/20 hover:to-amber-600/10 border border-amber-500/30 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300">Database Backup</span>
                  <span className="text-xs font-mono bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">datalazo</span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-200">
                  {triggering === 'backup-db-datalazo' ? 'Initiating...' : 'Backup `datalazo` DB'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Dumps PostgreSQL database to local storage (D:\DBBackup).</p>
              </button>

              {/* Trigger VRT DB */}
              <button
                onClick={() => handleTriggerBackup('backup-db', 'VRT')}
                disabled={triggering !== null}
                className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 hover:from-indigo-500/20 hover:to-indigo-600/10 border border-indigo-500/30 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300">Database Backup</span>
                  <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">VRT</span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-indigo-200">
                  {triggering === 'backup-db-VRT' ? 'Initiating...' : 'Backup `VRT` DB'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Dumps VRT database to local storage (D:\DBBackup).</p>
              </button>

              {/* Trigger Storage OS */}
              <button
                onClick={() => handleTriggerBackup('backup-storage')}
                disabled={triggering !== null}
                className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 hover:from-cyan-500/20 hover:to-cyan-600/10 border border-cyan-500/30 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">Storage OS Backup</span>
                  <span className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">DO Spaces</span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-cyan-200">
                  {triggering === 'backup-storage' ? 'Initiating...' : 'Backup DigitalOcean Spaces'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Downloads bucket files & packages into ZIP archive.</p>
              </button>

            </div>
          </div>

          {/* Local Backups Directory Explorer */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Local Backup Storage</h2>
                <p className="text-xs text-slate-400 mt-0.5">Directory target: <code className="text-amber-300 font-mono">D:\DBBackup</code></p>
              </div>
              <button
                onClick={fetchFiles}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-all"
              >
                Refresh List
              </button>
            </div>

            {backupFiles.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl space-y-2">
                <p className="text-xs text-slate-400">No local backup files retrieved or engine is offline.</p>
                <p className="text-[11px] text-slate-500">Make sure <code className="text-slate-300">D:\Backup\server</code> is running (<code className="text-amber-400">npm start</code>).</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-3">File Name</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {backupFiles.map((file, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-mono font-medium text-amber-300">{file.name}</td>
                        <td className="py-3 text-slate-400">{formatBytes(file.size)}</td>
                        <td className="py-3 text-slate-400">{new Date(file.created).toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <a
                            href={`${backupAppUrl}/api/backups/download/${encodeURIComponent(file.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold transition-colors inline-block"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Setup Instructions for Local Server */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              ⚙️ How to run the D:\Backup Server on Local Machine
            </h3>
            <div className="bg-black/60 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-2 border border-white/5">
              <p className="text-slate-400"># 1. Open Terminal / PowerShell and navigate to the Backup folder:</p>
              <p className="text-amber-300">cd D:\Backup\server</p>
              <p className="text-slate-400"># 2. Install dependencies (if not done already):</p>
              <p className="text-amber-300">npm install</p>
              <p className="text-slate-400"># 3. Start the Backup engine server (runs on http://localhost:5050):</p>
              <p className="text-emerald-400">npm start</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Embedded Standalone App Iframe */}
      {activeTab === 'iframe' && (
        <div className="flex-1 w-full min-h-[700px] bg-[#030712] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
          
          {/* Iframe Toolbar */}
          <div className="p-3 bg-black/80 border-b border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono truncate">Frame Target: {backupAppUrl}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshIframe}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
              >
                Refresh Frame
              </button>
              <a
                href={backupAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-amber-500 text-black font-bold rounded text-xs hover:bg-amber-400 transition-colors"
              >
                Open in Full Window ↗
              </a>
            </div>
          </div>

          <div className="flex-1 relative w-full h-full">
            <iframe
              key={iframeKey}
              src={backupAppUrl}
              title="DigitalOcean & Google Drive Backup Suite"
              className="w-full h-full min-h-[650px] border-0"
            />
          </div>
        </div>
      )}

    </div>
  );
}
