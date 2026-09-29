"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BackupItem {
  key: string;
  filename: string;
  database: string;
  size_bytes: number;
  size_formatted: string;
  last_modified: string;
  last_modified_formatted: string;
  storage_provider: string;
  bucket: string;
  region: string;
  storage_type: string;
}

export default function UtilitiesPage() {
  const [provider, setProvider] = useState('resend');
  const [resendApiKey, setResendApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('Luis Lazo');
  
  // Test email state
  const [testRecipient, setTestRecipient] = useState('luislazo@datalazo.net');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  // General state
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // DigitalOcean Backups State
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [backupCount, setBackupCount] = useState(0);
  const [backupTotalSize, setBackupTotalSize] = useState('0 MB');
  const [backupBucket, setBackupBucket] = useState('datalazocrm');
  const [backupRegion, setBackupRegion] = useState('nyc3');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSearch, setBackupSearch] = useState('');
  const [selectedDb, setSelectedDb] = useState('ALL');

  // Pagination State (10 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when search or db filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [backupSearch, selectedDb]);

  // Restore Modal Dialog State
  const [restoreModalData, setRestoreModalData] = useState<{ dbName: string; filename: string; key: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setResendApiKey(data.resendApiKey || '');
          setSenderEmail(data.senderEmail || '');
          setSenderName(data.senderName || 'Luis Lazo');
          if (data.emailProvider) {
            setProvider(data.emailProvider);
          }
        }
        setStatus('idle');
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Failed to load active system credentials.');
      });

    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setBackupLoading(true);
    setBackupError(null);
    try {
      const res = await fetch('/api/utilities/backups');
      const data = await res.json();
      if (data.status === 'error' && data.error_message) {
        setBackupError(data.error_message);
      } else {
        setBackups(data.backups || []);
        setBackupCount(data.count || 0);
        setBackupTotalSize(data.total_size_formatted || '0 MB');
        setBackupBucket(data.bucket || 'datalazocrm');
        setBackupRegion(data.region || 'nyc3');
        if (data.error_message) {
          setBackupError(data.error_message);
        }
      }
    } catch (err: any) {
      setBackupError('Error al conectar con la API de DigitalOcean Spaces.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage('');
    
    try {
      const currentRes = await fetch('/api/settings');
      const currentSettings = await currentRes.json();
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentSettings,
          resendApiKey,
          senderEmail,
          senderName,
          emailProvider: provider
        })
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const errData = await res.json();
        setStatus('error');
        setErrorMessage(errData.error || 'Failed to save settings.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network or server error occurred while saving.');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      setTestStatus('error');
      setTestError('Por favor ingrese un destinatario de prueba.');
      return;
    }

    setTestStatus('sending');
    setTestError('');

    try {
      const res = await fetch('/api/utilities/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resendApiKey,
          senderEmail,
          senderName,
          testRecipient
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 4000);
      } else {
        setTestStatus('error');
        setTestError(data.error || 'Error al enviar el correo de prueba.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestError(err.message || 'Error de conexión.');
    }
  };

  const handleDownloadBackup = async (key: string) => {
    try {
      const res = await fetch(`/api/utilities/backups/presigned-url?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.status === 'success' && data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(`Error al generar enlace de descarga: ${data.detail || 'Error desconocido'}`);
      }
    } catch (err: any) {
      alert(`Error de red al solicitar descarga: ${err.message}`);
    }
  };

  // Filtered backups list
  const filteredBackups = backups.filter(item => {
    const matchesSearch = !backupSearch || 
      item.filename.toLowerCase().includes(backupSearch.toLowerCase()) || 
      item.database.toLowerCase().includes(backupSearch.toLowerCase()) ||
      item.key.toLowerCase().includes(backupSearch.toLowerCase());
    const matchesDb = selectedDb === 'ALL' || item.database === selectedDb;
    return matchesSearch && matchesDb;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredBackups.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBackups = filteredBackups.slice(startIndex, startIndex + itemsPerPage);

  const uniqueDatabases = Array.from(new Set(backups.map(b => b.database))).sort();

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-6xl">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>⚙️</span> System Utilities
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configuración de correo transaccional y visualización de respaldos offsite en DigitalOcean Cloud Storage.
          </p>
        </div>
        <Link 
          href="/dashboard"
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {status === 'loading' ? (
        <div className="glass p-8 animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-10 bg-white/10 rounded w-full"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
            <div className="h-40 bg-white/10 rounded w-full"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TOP SECTION: Email & SMTP Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Email Credentials */}
            <div className="lg:col-span-7 glass p-8 relative overflow-hidden flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
              
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold mb-1 text-slate-200">Configuración del Proveedor de Correo</h2>
                  <p className="text-xs text-slate-400">
                    Defina las credenciales que se utilizarán para enviar correos transaccionales y facturación.
                  </p>
                </div>

                {/* Provider Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Método de Envío (Proveedor)
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200"
                  >
                    <option value="resend">Resend API (Recomendado para la Nube - Sin bloqueo de puertos)</option>
                    <option value="smtp">SMTP Server (Servidor de correo de salida)</option>
                  </select>
                </div>

                {/* Resend API Key */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    API Key de Resend
                  </label>
                  <input
                    type="password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200 font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ingrese su clave de API privada de Resend.com.
                  </p>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Nombre del Remitente (From Name)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Datalazo LLC"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200"
                  />
                </div>

                {/* Sender Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Remitente de Correo (From Email)
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g. notification@datalazo.net"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Debe ser un dominio verificado dentro de su panel de Resend.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    {status === 'success' && (
                      <span className="text-xs font-bold text-emerald-400">✓ Credenciales guardadas</span>
                    )}
                    {status === 'error' && (
                      <span className="text-xs font-bold text-red-400">{errorMessage || 'Error al guardar'}</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase text-xs rounded-xl tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
                  >
                    {status === 'saving' ? 'Guardando...' : '💾 Guardar Configuración'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Connection Test */}
            <div className="lg:col-span-5 glass p-8 relative overflow-hidden flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  🧪 Probar Envío de Correo (SMTP)
                </h2>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingrese un correo de destino para enviar un mensaje de prueba utilizando las credenciales ingresadas a la izquierda.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Destinatario de Prueba
                  </label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="luislazo@datalazo.net"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testStatus === 'sending'}
                  className="w-full py-3 bg-transparent border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {testStatus === 'sending' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Correo de Prueba'
                  )}
                </button>

                {testStatus === 'success' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs space-y-1 animate-in fade-in">
                    <p className="font-bold">✓ ¡Correo de prueba enviado con éxito!</p>
                    <p className="text-[10px] text-slate-400">Verifique la bandeja de entrada de {testRecipient}.</p>
                  </div>
                )}

                {testStatus === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs space-y-1 animate-in fade-in">
                    <p className="font-bold">✗ Error al enviar correo</p>
                    <p className="text-[10px] text-slate-300">{testError}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5 text-[11px] text-slate-500 leading-relaxed">
                * Nota: El servicio utiliza la API de Resend para realizar el envío de prueba en tiempo real.
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: DigitalOcean Cloud Storage Backups Explorer */}
          <div className="glass p-8 rounded-2xl border border-sky-500/20 bg-slate-900/70 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center text-2xl">
                  ☁️
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-white">DigitalOcean Spaces Cloud Storage Backups</h2>
                    <span className="px-3 py-1 bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-bold rounded-full uppercase tracking-wider">
                      {backupBucket}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Respaldos automáticos de PostgreSQL guardados offsite en DigitalOcean Cloud Storage. Fechas en hora estándar de Nueva York (US Eastern Time).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchBackups}
                disabled={backupLoading}
                className="px-4 py-2.5 bg-sky-500/15 border border-sky-400/40 hover:bg-sky-500/30 text-sky-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span className={backupLoading ? "animate-spin" : ""}>🔄</span> Actualizar Lista
              </button>
            </div>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/70 border border-white/10 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Respaldos Encontrados</span>
                <p className="text-xl font-extrabold text-sky-400">{backupCount}</p>
              </div>
              <div className="p-4 bg-slate-950/70 border border-white/10 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tamaño Total</span>
                <p className="text-xl font-extrabold text-emerald-400">{backupTotalSize}</p>
              </div>
              <div className="p-4 bg-slate-950/70 border border-white/10 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Región & Endpoint</span>
                <p className="text-sm font-bold text-purple-300 truncate">{backupRegion} ({backupBucket})</p>
              </div>
              <div className="p-4 bg-slate-950/70 border border-white/10 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado de Conexión</span>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  <span>✅</span> Conectado & Sincronizado
                </p>
              </div>
            </div>

            {/* Error banner if any */}
            {backupError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                ⚠️ <strong>Aviso de almacenamiento:</strong> {backupError}
              </div>
            )}

            {/* Controls & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="w-full sm:w-auto flex-1">
                <input
                  type="text"
                  value={backupSearch}
                  onChange={(e) => setBackupSearch(e.target.value)}
                  placeholder="🔍 Filtrar por nombre de base de datos o archivo de respaldo..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedDb}
                  onChange={(e) => setSelectedDb(e.target.value)}
                  className="w-full sm:w-auto bg-slate-950 border border-sky-500/30 text-sky-300 font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                >
                  <option value="ALL">🌐 Todas las Bases de Datos ({backups.length})</option>
                  {uniqueDatabases.map(db => (
                    <option key={db} value={db}>📦 {db}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Backups Table */}
            {backupLoading ? (
              <div className="text-center py-12 text-slate-400 text-sm animate-pulse space-y-2">
                <div className="text-3xl">🔄</div>
                <p>Cargando lista de respaldos desde DigitalOcean Spaces...</p>
              </div>
            ) : filteredBackups.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-white/5">
                No se encontraron respaldos de base de datos que coincidan con los criterios.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Base de Datos</th>
                      <th className="py-3 px-4">Archivo de Respaldo & Key</th>
                      <th className="py-3 px-4">Tamaño</th>
                      <th className="py-3 px-4">Fecha Creación (US Eastern NY)</th>
                      <th className="py-3 px-4">Ubicación</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedBackups.map((item) => (
                      <tr key={item.key} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="px-3 py-1 bg-white/5 border border-sky-400/40 text-sky-300 font-bold text-xs rounded-lg inline-block">
                            📦 {item.database}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200 text-sm">{item.filename}</div>
                          <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{item.key}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 text-xs">
                          {item.size_formatted}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          <div className="font-bold">{item.last_modified_formatted}</div>
                          <div className="text-[10px] text-slate-500">America/New_York</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-400/20 text-sky-400 text-[11px] font-bold rounded-md">
                            {item.storage_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadBackup(item.key)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-md shadow-sky-600/20"
                            >
                              📥 Descargar
                            </button>
                            <button
                              type="button"
                              onClick={() => setRestoreModalData({ dbName: item.database, filename: item.filename, key: item.key })}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-bold text-xs rounded-lg transition-all"
                            >
                              ℹ️ Restauración
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Bar */}
            {filteredBackups.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="text-slate-400 font-medium">
                  Mostrando <span className="font-bold text-sky-300">{Math.min(startIndex + 1, filteredBackups.length)}</span> a{' '}
                  <span className="font-bold text-sky-300">{Math.min(startIndex + itemsPerPage, filteredBackups.length)}</span> de{' '}
                  <span className="font-bold text-sky-300">{filteredBackups.length}</span> respaldos
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>

                  <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                          currentPage === page
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                            : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* RESTORATION INSTRUCTIONS MODAL DIALOG */}
      {restoreModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-sky-500/30 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Guía de Restauración de Base de Datos</h3>
                  <p className="text-xs text-slate-400">Objetivo: <strong className="text-sky-400">{restoreModalData.dbName}</strong> ({restoreModalData.filename})</p>
                </div>
              </div>
              <button 
                onClick={() => setRestoreModalData(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block">Paso 1: Descargar archivo en el servidor host</span>
                <pre className="p-3 bg-slate-950 border border-white/10 rounded-xl text-sky-300 font-mono overflow-x-auto whitespace-pre-wrap select-all">
                  {`cd /etc/easypanel/projects/datalazo/vrtservices/code && python3 -c "
import boto3, os
from dotenv import load_dotenv
load_dotenv('/etc/easypanel/projects/datalazo/vrtservices/code/.env')
key, secret = os.environ.get('DO_SPACES_KEY'), os.environ.get('DO_SPACES_SECRET')
endpoint, bucket, region = os.environ.get('DO_SPACES_ENDPOINT','https://nyc3.digitaloceanspaces.com'), os.environ.get('DO_SPACES_BUCKET','datalazocrm'), os.environ.get('DO_SPACES_REGION','nyc3')
s3 = boto3.client('s3', region_name=region, endpoint_url=endpoint, aws_access_key_id=key, aws_secret_access_key=secret)
s3.download_file(bucket, '${restoreModalData.key}', '${restoreModalData.filename}')
print('🎉 Descargado exitosamente!')
"`}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block">Paso 2: Ejecutar restauración en PostgreSQL ({restoreModalData.dbName})</span>
                <pre className="p-3 bg-slate-950 border border-white/10 rounded-xl text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap select-all">
                  {`cd /etc/easypanel/projects/datalazo/vrtservices/code && python3 -c "
import os, urllib.parse, subprocess
from dotenv import load_dotenv
load_dotenv('/etc/easypanel/projects/datalazo/vrtservices/code/.env')
db_url = os.environ.get('DATABASE_URL')
parsed = urllib.parse.urlparse(db_url)
target_url = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, '/${restoreModalData.dbName}', parsed.params, parsed.query, parsed.fragment))
print('🚀 Restaurando respaldo en base de datos [${restoreModalData.dbName}]...')
cmd = f'gunzip -c ${restoreModalData.filename} | psql \"{target_url}\"'
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(res.stdout or res.stderr)
print('🎉 Restauración completada!')
"`}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span>⚠️</span> Nota: La ejecución real se realiza manualmente por el administrador en la consola del servidor.
              </span>
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
