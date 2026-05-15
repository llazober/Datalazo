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

  if (loading) return <div className="animate-pulse text-xs text-slate-500 uppercase tracking-widest">Calculating Intelligence Usage...</div>;
  if (!stats) return null;

  return (
    <div className="glass p-8 border-indigo-500/20 shadow-2xl relative overflow-hidden group">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">
            Intelligence <span className="text-indigo-400">Consumption</span>
          </h2>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">OpenAI Token & Budget Matrix</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white italic">${stats.totals.cost.toFixed(4)}</div>
          <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Est. Lifetime Cost</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {stats.byFeature.map((f) => (
            <div key={f.feature} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 group-hover:border-indigo-500/20 transition-all">
              <div>
                <p className="text-xs font-black uppercase text-slate-400">{f.feature.replace('_', ' ')}</p>
                <p className="text-[10px] text-slate-500 tracking-widest">{(f._sum.totalTokens / 1000).toFixed(1)}K Tokens</p>
              </div>
              <div className="text-lg font-bold text-indigo-400">${f._sum.estimatedCost.toFixed(4)}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
            <div className="text-4xl font-black text-white mb-2">{(stats.totals.tokens / 1000).toFixed(1)}K</div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center">Total Intelligence Tokens Processed</p>
            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '65%' }} />
            </div>
        </div>
      </div>
    </div>
  );
}
