"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0c] border-b border-white/10 z-50 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-black italic tracking-tighter uppercase text-xs">Datalazo</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 w-64 h-full border-r border-white/10 bg-[#0a0a0c] flex flex-col p-6 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <Link href="/" className="hidden md:flex justify-center mb-12">
            <img src="/logo.png" alt="Datalazo Logo" className="w-32 h-32 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
          </Link>
        
        <nav className="flex-1 space-y-2 mt-20 md:mt-0">
          {[
            { name: 'Overview', path: '/dashboard' },
            { name: 'AI Usage', path: '/dashboard/usage' },
            { name: 'Knowledge Base', path: '/dashboard/knowledge' },
            { name: 'Automation', path: '/dashboard/automation' },
            { name: 'Analytics', path: '/dashboard/analytics' },
            { name: 'Settings', path: '/dashboard/settings' }
          ].map((item) => (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-colors ${
                item.name === 'AI Usage' ? 'bg-indigo-500/10 text-indigo-400' : 
                item.name === 'Knowledge Base' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-indigo" />
            <div className="text-sm">
              <div className="font-medium">Admin User</div>
              <div className="text-xs text-slate-500 text-ellipsis overflow-hidden">admin@datalazo.net</div>
            </div>
          </div>
          <button 
            onClick={() => {
              document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
              window.location.href = '/login';
            }}
            className="w-full px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold uppercase rounded-xl hover:bg-red-500/20 transition-all text-center"
          >
            Logout Security
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white/[0.02] pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
