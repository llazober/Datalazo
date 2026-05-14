import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    slug: string;
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.keyword.findUnique({
    where: { slug }
  });

  if (!post || !post.isPublic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-6 border-b border-white/5 bg-background/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/blog" className="flex items-center gap-2 text-slate-400 hover:text-cyan-500 transition-all text-xs font-bold uppercase tracking-widest">
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            Back to Insights
          </Link>
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg grayscale hover:grayscale-0 transition-all" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-24 relative">
        {/* Background Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-cyan-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-16">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-6">
               Published {new Date(post.updatedAt).toLocaleDateString()}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-8 leading-[0.95]">
              {post.term}
            </h1>
          </div>

          <article 
            className="prose prose-invert prose-cyan max-w-none 
                       prose-h1:text-4xl prose-h1:font-black prose-h1:uppercase prose-h1:italic
                       prose-h2:text-2xl prose-h2:font-bold prose-h2:uppercase prose-h2:italic prose-h2:text-cyan-500 prose-h2:mt-12
                       prose-p:text-lg prose-p:leading-relaxed prose-p:text-slate-400
                       prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/5 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl
                       prose-li:text-slate-300"
            dangerouslySetInnerHTML={{ __html: post.content || '' }} 
          />

          {/* CTA */}
          <div className="mt-24 p-12 glass border-cyan-500/20 text-center">
            <h3 className="text-2xl font-bold mb-4 uppercase italic">Ready to automate your growth?</h3>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
              Datalazo's AI Matrix is just one of our 4 modules designed to scale high-performance agencies. Connect with our consultants today.
            </p>
            <Link 
              href="/#contact"
              className="inline-block px-10 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Book Strategy Call
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-20 text-center border-t border-white/5 opacity-50">
         <p className="text-xs uppercase tracking-widest">© 2026 Datalazo Intelligence Agency</p>
      </footer>
    </div>
  );
}
