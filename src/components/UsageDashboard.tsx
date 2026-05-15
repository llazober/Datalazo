"use client";

import React, { useEffect, useState } from 'react';

interface UsageStats {
  totals: {
    tokens: number;
    cost: number;
  };
  byFeature: Array<{
    feature: string;
    _sum: {
      totalTokens: number;
      estimatedCost: number;
    };
  }>;
}

export default function UsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/admin/usage');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch usage stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) return <div className="animate-pulse text-xs text-slate-500 uppercase tracking-widest p-10">Syncing Intelligence Matrix...</div>;
  if (!stats) return null;

  return (
    <div className="glass p-10 md:p-14 border-white/5 shadow-2xl relative overflow-hidden bg-white/[0.01]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-2 flex items-center gap-3">
            Intelligence <span className="text-indigo-400">Consumption</span>
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-widest opacity-60">OpenAI Token & Budget Matrix</p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">${stats.totals.cost.toFixed(4)}</div>
          <p className="text-[10px] md:text-xs text-indigo-400 uppercase font-black tracking-widest mt-1">Est. Lifetime Cost</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Breakdown List */}
        <div className="space-y-4">
          {stats.byFeature.map((f) => (
            <div key={f.feature} className="flex justify-between items-center p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
              <div>
                <p className="text-sm font-black uppercase text-slate-300 tracking-tight">{f.feature.replace('_', ' ')}</p>
                <p className="text-[11px] text-slate-500 tracking-widest mt-1">{(f._sum.totalTokens / 1000).toFixed(1)}K Tokens</p>
              </div>
              <div className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight">${f._sum.estimatedCost.toFixed(4)}</div>
            </div>
          ))}
          {stats.byFeature.length === 0 && (
            <div className="text-slate-600 italic text-sm p-6 border border-dashed border-white/10 rounded-2xl">
              No consumption data recorded yet.
            </div>
          )}
        </div>

        {/* Big Progress Card */}
        <div className="relative p-12 md:p-16 bg-[#08080a] rounded-[40px] border border-white/5 flex flex-col justify-center items-center overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tighter">
                {(stats.totals.tokens / 1000).toFixed(1)}K
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-widest text-center max-w-[200px] leading-relaxed">
                Total Intelligence Tokens Processed
            </p>
            
            <div className="mt-10 w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                    style={{ width: '82%' }} 
                />
            </div>
        </div>
      </div>
    </div>
  );
}
