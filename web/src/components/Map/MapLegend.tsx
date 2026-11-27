import React from 'react';
import { Flame, TrendingUp, Award, Users, BarChart3, PieChart, Sparkles } from 'lucide-react';
import type { HeatmapMetric } from '../../types/electionGis.types';
import { MAJOR_PARTIES } from '../../services/electionService';

interface MapLegendProps {
  metric: HeatmapMetric;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ metric, className = '' }) => {
  return (
    <div
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xl max-w-sm select-none ${className}`}
    >
      {metric === 'turnout' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Flame size={14} className="text-emerald-500" />
              <span>Voter Turnout (%) Heatmap</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">40% → 90%+</span>
          </div>
          <div className="h-3 w-64 rounded-full bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-lime-400 to-emerald-600 shadow-inner" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span className="text-red-500">&lt; 45% (Low)</span>
            <span>60%</span>
            <span>75%</span>
            <span className="text-emerald-500">&gt; 85% (High)</span>
          </div>
        </div>
      )}

      {metric === 'margin' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-rose-500" />
              <span>Winning Margin Closeness</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">0% → 35%+</span>
          </div>
          <div className="h-3 w-64 rounded-full bg-gradient-to-r from-rose-500 via-orange-400 via-sky-400 to-indigo-700 shadow-inner" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span className="text-rose-500 font-black">&lt; 5% (Battleground)</span>
            <span>10%</span>
            <span>20%</span>
            <span className="text-indigo-600 font-black">&gt; 25% (Safe)</span>
          </div>
        </div>
      )}

      {(metric === 'winning_party' || metric === 'leading_party') && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award size={14} className="text-amber-500" />
              <span>{metric === 'winning_party' ? 'Winning Political Party' : 'Leading Party Trend'}</span>
            </span>
            <span className="text-[10px] text-slate-400">ECI Official</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold">
            {Object.entries(MAJOR_PARTIES)
              .filter(([k]) => !['TMC', 'SHS', 'CPM'].includes(k))
              .slice(0, 8)
              .map(([key, info]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: info.color }} />
                  <span className="truncate">{info.abbreviation}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {metric === 'vote_share' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <PieChart size={14} className="text-amber-600" />
              <span>Party-wise Vote Share (%)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">25% → 70%+</span>
          </div>
          <div className="h-3 w-64 rounded-full bg-gradient-to-r from-amber-200 via-orange-400 to-amber-900 shadow-inner" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>&lt; 30%</span>
            <span>45%</span>
            <span>55%</span>
            <span>&gt; 65%</span>
          </div>
        </div>
      )}

      {metric === 'total_votes' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600" />
              <span>Total Votes Polled</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">400k → 2.2M+</span>
          </div>
          <div className="h-3 w-64 rounded-full bg-gradient-to-r from-indigo-200 via-indigo-500 to-indigo-950 shadow-inner" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>400k (Sparse)</span>
            <span>1.2M</span>
            <span>&gt; 2M (Dense)</span>
          </div>
        </div>
      )}

      {metric === 'nota_votes' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <BarChart3 size={14} className="text-red-500" />
              <span>NOTA Vote Percentage</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">0.5% → 4.0%+</span>
          </div>
          <div className="h-3 w-64 rounded-full bg-gradient-to-r from-yellow-200 via-orange-500 to-red-900 shadow-inner" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>0.5%</span>
            <span>1.5%</span>
            <span>2.5%</span>
            <span className="text-red-600">&gt; 4.0%</span>
          </div>
        </div>
      )}

      {metric === 'custom_metric' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-rose-500" />
              <span>Custom Uploaded Metric Index</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">0 → 100</span>
          </div>
          <div className="h-3 w-64 rounded-full bg-gradient-to-r from-rose-100 via-rose-400 to-rose-900 shadow-inner" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>0 (Low)</span>
            <span>50</span>
            <span>100 (Max)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
