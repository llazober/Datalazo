"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage('');
    
    try {
      // We load the existing settings first to preserve other keys (stripe, models, etc)
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

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Utilities</h1>
          <p className="text-slate-400">Configurar credenciales del proveedor de correo y realizar pruebas de conexión.</p>
        </div>
        <Link 
          href="/dashboard"
          className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Configurations */}
          <div className="lg:col-span-7 glass p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
            
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-4 text-slate-200">Configuración del Proveedor</h2>
                <p className="text-xs text-slate-400 mb-6">
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
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-slate-200 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Ingrese su clave de API privada de Resend.com.
                </p>
              </div>

              {/* Sender Name (From Name) */}
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

              {/* Sender Email (From Email) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Remitente de Correo (From)
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. lacteoserp@nelsonmar.com"
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
          <div className="lg:col-span-5 glass p-8 relative overflow-hidden flex flex-col justify-between border-l border-white/5">
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
              * Nota: El método SMTP no está completamente implementado en el backend y actualmente utiliza la API de Resend para realizar el envío.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
