import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col p-6">
          <div className="flex justify-center mb-12">
            <img src="/logo.png" alt="Datalazo Logo" className="w-32 h-32 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
          </div>
        
        <nav className="flex-1 space-y-2">
          {['Overview', 'Leads', 'Automation', 'Analytics', 'Settings'].map((item) => (
            <a
              key={item}
              href="#"
              className={`block px-4 py-3 rounded-xl transition-colors ${
                item === 'Overview' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-indigo" />
            <div className="text-sm">
              <div className="font-medium">Admin User</div>
              <div className="text-xs text-slate-500 text-ellipsis overflow-hidden">admin@datalazo.net</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white/[0.02]">
        {children}
      </main>
    </div>
  );
}
