"use client";

import React, { useEffect, useState } from 'react';

interface Keyword {
  id: string;
  term: string;
  volume: number;
  difficulty: number;
  currentRank: number | null;
  status: string;
  createdAt: string;
}

export default function SEODashboard() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTerm, setNewTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
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
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                      {kw.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors border border-white/5 hover:border-cyan-500/20 px-3 py-1.5 rounded-lg">
                      Generate AI Content
                    </button>
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
      </div>
    </div>
  );
}
