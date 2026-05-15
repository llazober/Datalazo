"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || `Server Error: ${res.status}`);
        return;
      }

      const data = await res.json();

      if (data.success) {
        // Force a full page reload to the dashboard
        window.location.href = '/dashboard';
      }

    } catch {
      console.error('Login Fetch Error');
      setError('Connection failed. Please check your internet or server logs.');
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8">
            <Image 
              src="/logo.png" 
              alt="Datalazo Logo" 
              width={80} 
              height={80} 
              className="w-20 h-20 rounded-2xl mx-auto shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
            />
          </Link>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">
            Admin <span className="text-cyan-500">Access</span>
          </h1>
          <p className="text-slate-400 mt-2">Datalazo Intelligence Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-8 border-white/10 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Master Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-xs text-slate-500">
          Not an admin? <Link href="/" className="text-cyan-500 hover:underline">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
