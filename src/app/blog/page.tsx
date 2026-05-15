import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BlogIndex() {
  const posts = await prisma.keyword.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-8 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
             <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg" />
             <span className="text-xl font-black tracking-tighter uppercase italic">Datalazo <span className="text-cyan-500 text-xs">Intelligence</span></span>
          </Link>
          <Link href="/" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-500 transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-6">
            Module 04: Content Factory
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-6">
            Insights & <span className="text-cyan-500">Intelligence</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Expert analysis on AI Voice Agents, Process Automation, and search growth strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="group glass p-8 border-white/5 hover:border-cyan-500/30 transition-all flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 group-hover:text-cyan-500 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
                {new Date(post.updatedAt).toLocaleDateString()}
              </div>
              <h2 className="text-2xl font-bold uppercase italic tracking-tight mb-4 group-hover:text-cyan-400 transition-colors">
                {post.term}
              </h2>
              <div className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-8 flex-1">
                {post.content?.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-cyan-500">
                Read Full Article
              </div>
              
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-all" />
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="py-40 text-center">
            <p className="text-slate-500 italic">No intelligence reports published yet. Come back soon.</p>
          </div>
        )}
      </main>

      <footer className="py-20 text-center border-t border-white/5">
        <p className="text-slate-500 text-xs uppercase tracking-widest">Datalazo Intelligence Agency | v3.6</p>
      </footer>
    </div>
  );
}
