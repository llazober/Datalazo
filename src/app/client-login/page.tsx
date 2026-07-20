"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function ClientLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/client-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || `Error: ${res.status}`);
        return;
      }

      const data = await res.json();

      if (data.success) {
        // Redirect to client dashboard
        window.location.href = '/client/dashboard';
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('Connection failed. Please verify your connection or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8">
            <img 
              src="/logo.png?v=4" 
              alt="Datalazo Logo" 
              className="w-20 h-20 rounded-2xl mx-auto shadow-[0_0_30px_rgba(99,102,241,0.25)] bg-white p-1 object-contain" 
            />
          </Link>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">
            Client <span className="text-indigo-400">Portal</span>
          </h1>
          <p className="text-slate-400 mt-2">Access your automation & metrics dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-8 border-white/10 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="company_user"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
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
              className="w-full py-4 bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-400 transition-all shadow-[0_0_25px_rgba(99,102,241,0.3)] disabled:opacity-50"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-xs text-slate-500">
          Need assistance? <Link href="/" className="text-indigo-400 hover:underline">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
