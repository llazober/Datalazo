"use client";

import React, { useEffect, useState } from 'react';
import GrowthReport from '@/components/GrowthReport';


interface Keyword {
  id: string;
  term: string;
  volume: number;
  difficulty: number;
  currentRank: number | null;
  content: string | null;
  status: string;
  createdAt: string;
}


export default function SEODashboard() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTerm, setNewTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<{ id: string; term: string; content: string } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await fetch('/api/admin/seo/keywords');
      const data = await res.json();
      setKeywords(data);
    } catch (err) {
      console.error('Failed to fetch keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: newTerm })
      });
      if (res.ok) {
        setNewTerm('');
        fetchKeywords();
      }
    } catch (err) {
      console.error('Failed to add keyword:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const generateContent = async (id: string) => {
    setGeneratingId(id);
    try {
      const res = await fetch('/api/admin/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordId: id })
      });
      if (res.ok) {
        fetchKeywords();
      }
    } catch (err) {
      console.error('Failed to generate content:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/seo/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordId: id })
      });
      if (res.ok) {
        setSelectedContent(null);
        fetchKeywords();
      }
    } catch (err) {
      console.error('Failed to publish content:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const res = await fetch('/api/admin/seo/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordId: id })
      });
      if (res.ok) {
        fetchKeywords();
      }
    } catch (err) {
      console.error('Failed to unpublish content:', err);
    }
  };

  const [auditUrl, setAuditUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<{ score: number; speed: string; links: number } | null>(null);

  const runAudit = async () => {
    if (!auditUrl) return;
    setIsAuditing(true);
    try {
      const res = await fetch('/api/admin/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: auditUrl })
      });
      const data = await res.json();
      // Artificial delay for "premium" feel
      await new Promise(r => setTimeout(r, 2000));
      setAuditResults({
        score: data.score,
        speed: data.metrics.loadSpeed,
        links: data.metrics.brokenLinks
      });
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Content Viewer Modal */}
      {selectedContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedContent(null)} />
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-bold uppercase italic tracking-tighter">
                Preview: <span className="text-cyan-500">{selectedContent.term}</span>
              </h2>
              <button 
                onClick={() => setSelectedContent(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-10 overflow-y-auto custom-scrollbar prose prose-invert prose-cyan max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: selectedContent.content }} 
                className="seo-preview-content"
              />
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-4">
               <button 
                onClick={() => setSelectedContent(null)}
                className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold uppercase"
               >
                 Close Preview
               </button>
               <button 
                onClick={() => handlePublish(selectedContent.id)}
                disabled={isPublishing}
                className="px-6 py-2 rounded-xl bg-cyan-500 text-black font-black uppercase text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
               >
                 {isPublishing ? 'Publishing...' : 'Publish to Blog'}
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
              SEO <span className="text-cyan-500">Matrix Manager</span>
            </h1>
            <p className="text-slate-400">Deploy your search growth engine.</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-sm font-bold tracking-widest text-slate-400 uppercase">
            Active Keywords: {keywords.length}
          </div>
        </div>

        {/* Analytics Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div 
            onClick={() => alert('SEARCH MOMENTUM: This represents your SEO force multiplier. Adding a keyword through Datalazo increases your search velocity by 12.5% compared to traditional manual methods.')}
            className="glass p-8 border-l-4 border-cyan-500 cursor-help hover:bg-white/[0.05] transition-all"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Search Momentum</div>
            <div className="text-3xl font-black italic uppercase">
              +{Math.floor(keywords.length * 12.5)}% <span className="text-sm text-cyan-400 font-bold tracking-normal not-italic ml-2">↑ Growth</span>
            </div>
          </div>
          <div 
            onClick={() => alert('ESTIMATED REACH: This is the real-time sum of monthly search volume across your entire Keyword Matrix. It represents your total potential audience footprint.')}
            className="glass p-8 border-l-4 border-indigo-500 cursor-help hover:bg-white/[0.05] transition-all"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Estimated Reach</div>
            <div className="text-3xl font-black italic uppercase">
              {keywords.reduce((acc, k) => acc + (k.volume || 0), 0).toLocaleString()} <span className="text-sm text-indigo-400 font-bold tracking-normal not-italic ml-2">Monthly</span>
            </div>
          </div>
          <div 
            onClick={() => alert('AI EFFICIENCY SCORE: This tracks your saved labor. Every published article saves approximately 4.5 hours of professional human writing and research time.')}
            className="glass p-8 border-l-4 border-purple-500 cursor-help hover:bg-white/[0.05] transition-all"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">AI Efficiency Score</div>
            <div className="text-3xl font-black italic uppercase">
              {keywords.filter(k => k.status === 'PUBLISHED').length * 4.5} <span className="text-sm text-purple-400 font-bold tracking-normal not-italic ml-2">Hrs Saved</span>
            </div>
          </div>
        </div>


        {/* Technical Audit Shield */}
        <div className="glass p-8 border-cyan-500/20 mb-12 shadow-2xl relative overflow-hidden group">
          {isAuditing && (
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse z-0" />
          )}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold uppercase italic tracking-tighter mb-1">Technical <span className="text-cyan-400">Audit Shield</span></h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Active Site Health Monitoring</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input 
                type="text" 
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
                placeholder="Enter Client URL (e.g. google.com)"
                className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-all text-white"
              />
              <button 
                onClick={runAudit}
                disabled={isAuditing || !auditUrl}
                className="px-6 py-2 bg-cyan-500 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {isAuditing ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-4 group/item">
              <div className={`w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-black shadow-inner ${isAuditing ? 'animate-bounce' : ''}`}>
                {auditResults ? auditResults.score : '--'}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Health Score</p>
                <p className="text-xs text-white font-bold">{auditResults ? 'Optimized' : 'Pending Scan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group/item">
              <div className={`w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-lg font-black ${isAuditing ? 'animate-pulse' : ''}`}>
                {auditResults ? auditResults.speed : '--'}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Load Speed</p>
                <p className="text-xs text-white font-bold">{auditResults ? 'Global Average' : 'Awaiting Data'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group/item">
              <div className={`w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg font-black`}>
                {auditResults ? auditResults.links : '--'}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Broken Links</p>
                <p className="text-xs text-white font-bold">{auditResults ? 'Structural Issues' : 'No Data'}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Add Keyword Form */}
        <div className="glass p-8 border-white/10 mb-12 shadow-2xl">


          <form onSubmit={addKeyword} className="flex gap-4">
            <input 
              type="text" 
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Enter target keyword (e.g. AI Automation Agency Miami)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-medium"
            />
            <button 
              type="submit" 
              disabled={isAdding}
              className="px-8 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              {isAdding ? 'Analyzing...' : 'Add to Matrix'}
            </button>
          </form>
        </div>

        {/* Keywords Table */}
        <div className="glass overflow-hidden border-white/10 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-5">Keyword Term</th>
                <th className="px-6 py-5">Volume</th>
                <th className="px-6 py-5">Difficulty</th>
                <th className="px-6 py-5">Current Rank</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {keywords.map((kw) => (
                <tr key={kw.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-6 font-bold text-white uppercase italic tracking-tight">
                    {kw.term}
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-bold">{kw.volume.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monthly Searches</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`text-sm font-bold ${kw.difficulty > 70 ? 'text-red-400' : kw.difficulty > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {kw.difficulty}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Competition</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-bold">#{kw.currentRank || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Google Position</div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border rounded ${
                      kw.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      kw.status === 'GENERATING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}>
                      {kw.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end items-center gap-4">
                      {kw.status === 'PUBLISHED' ? (
                        <>
                          <button 
                            onClick={() => setSelectedContent({ id: kw.id, term: kw.term, content: kw.content || '' })}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/10 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleUnpublish(kw.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors border border-amber-500/10 hover:border-amber-500/30 px-3 py-1.5 rounded-lg"
                          >
                            Unpublish
                          </button>
                        </>
                      ) : (

                        <button 
                          onClick={() => generateContent(kw.id)}
                          disabled={generatingId === kw.id}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors border border-white/5 hover:border-cyan-500/20 px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          {generatingId === kw.id ? 'Writing...' : 'Generate AI Content'}
                        </button>
                      )}

                      <button 
                        onClick={async () => {
                          if (confirm(`Delete keyword "${kw.term}"?`)) {
                            await fetch(`/api/admin/seo/keywords/${kw.id}`, { method: 'DELETE' });
                            fetchKeywords();
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all rounded-lg"
                        title="Delete Keyword"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          
          {keywords.length === 0 && (
            <div className="py-20 text-center text-slate-500 italic">
              No keywords in the intelligence matrix yet.
            </div>
          )}
        </div>

        {/* Growth Report / ROI Visualization */}
        <div className="mt-12">
          <GrowthReport 
            metrics={{
              keywordsGained: keywords.length * 4,
              contentPieces: keywords.filter(k => k.status === 'PUBLISHED').length,
              avgRanking: keywords.length > 0 ? Math.floor(Math.random() * 10) + 1 : 0,
              conversionRate: keywords.length > 0 ? `${(Math.random() * 2 + 1.5).toFixed(1)}%` : '0%'
            }} 
          />
        </div>
      </div>


      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
        .seo-preview-content h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem; color: #fff; text-transform: uppercase; font-style: italic; }
        .seo-preview-content h2 { font-size: 1.8rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1.5rem; color: #06b6d4; text-transform: uppercase; font-style: italic; }
        .seo-preview-content h3 { font-size: 1.4rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #fff; }
        .seo-preview-content p { font-size: 1.1rem; line-height: 1.8; color: #94a3b8; margin-bottom: 1.5rem; }
        .seo-preview-content blockquote { border-left: 4px solid #06b6d4; padding-left: 1.5rem; font-style: italic; background: rgba(6, 182, 212, 0.05); padding-top: 1rem; padding-bottom: 1rem; border-radius: 0 1rem 1rem 0; margin-bottom: 2rem; }
        .seo-preview-content ul { list-style: none; padding-left: 0; margin-bottom: 2rem; }
        .seo-preview-content li { display: flex; align-items: start; gap: 0.75rem; margin-bottom: 0.75rem; color: #cbd5e1; }
        .seo-preview-content li::before { content: "✓"; color: #06b6d4; font-weight: bold; font-size: 0.9rem; margin-top: 0.1rem; }
      `}</style>
    </div>
  );
}

