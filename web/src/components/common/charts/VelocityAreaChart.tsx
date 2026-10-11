import React from 'react';
import { TrendingUp, Calendar, Zap, Layers } from 'lucide-react';

export interface VelocityPoint {
  date: string;
  count: number;
}

interface VelocityAreaChartProps {
  data: VelocityPoint[];
  height?: number;
  className?: string;
}

export const VelocityAreaChart: React.FC<VelocityAreaChartProps> = ({
  data,
  className = '',
}) => {
  // Filter to active contact dates and sort in descending chronological order
  const activeDays = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .filter((d) => d.count > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const totalVolume = activeDays.reduce((sum, c) => sum + c.count, 0);
  const peakVolume = activeDays.length > 0 ? Math.max(...activeDays.map((d) => d.count)) : 0;
  const averageVolume = activeDays.length > 0 ? Math.round(totalVolume / activeDays.length) : 0;

  const formatDateDisplay = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[monthIdx] || parts[1]} ${parts[0]}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  if (activeDays.length === 0) {
    return (
      <div className={`p-8 text-center rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs space-y-1.5 ${className}`}>
        <Calendar size={22} className="mx-auto text-slate-400 mb-1" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">No Contact Momentum Recorded</p>
        <p className="text-[11px]">Field voter registrations and contacts will appear here once submitted.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Velocity Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Registration & Contact Momentum
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Field voter contact velocity by recorded date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Calendar size={13} className="text-slate-400" />
            <span className="hidden sm:inline">Total Volume:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {totalVolume.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Zap size={13} className="text-indigo-500" />
            <span className="hidden sm:inline">Avg:</span>
            <span className="font-mono font-bold">
              +{averageVolume.toLocaleString()}/day
            </span>
          </div>
        </div>
      </div>

      {/* Discrete Daily Volume Cards List */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
        {activeDays.map((item, index) => {
          const isLatest = index === 0;
          const isPeak = item.count === peakVolume;
          const percentage = totalVolume > 0 ? Math.round((item.count / totalVolume) * 100) : 0;
          // Scale bar so low volumes (583) stay visible with min 8% width
          const barWidthPercent = peakVolume > 0
            ? Math.max(8, Math.round((item.count / peakVolume) * 100))
            : 0;

          const isBulk = item.count >= 10000;

          return (
            <div
              key={item.date}
              className="p-3 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white font-mono">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>{formatDateDisplay(item.date)}</span>
                  </div>

                  {isLatest && (
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      Latest Batch
                    </span>
                  )}
                  {isPeak && !isLatest && (
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      Peak Volume
                    </span>
                  )}
                  {isBulk && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-400">
                      <Layers size={10} />
                      Constituency Roll Ingestion
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">
                    +{item.count.toLocaleString()}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Proportional Dual-Gradient Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBulk
                      ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  }`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const VelocityBarChart = VelocityAreaChart;
