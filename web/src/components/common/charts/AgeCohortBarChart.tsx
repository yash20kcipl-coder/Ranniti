import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface AgeCohortData {
  age_18_25: number;
  age_26_35: number;
  age_36_50: number;
  age_51_65: number;
  age_65_plus: number;
  age_unknown?: number;
}

interface AgeCohortBarChartProps {
  data: AgeCohortData;
  className?: string;
}

export const AgeCohortBarChart: React.FC<AgeCohortBarChartProps> = ({ data, className = '' }) => {
  const [hoveredCohort, setHoveredCohort] = useState<string | null>(null);

  const cohorts = [
    { key: 'age_18_25', label: '18–25 yrs', sub: 'First-time/Youth', count: data.age_18_25 || 0, color: 'from-indigo-500 to-blue-500', barColor: '#6366F1' },
    { key: 'age_26_35', label: '26–35 yrs', sub: 'Young Cadre', count: data.age_26_35 || 0, color: 'from-blue-500 to-cyan-500', barColor: '#3B82F6' },
    { key: 'age_36_50', label: '36–50 yrs', sub: 'Working Core', count: data.age_36_50 || 0, color: 'from-emerald-500 to-teal-500', barColor: '#10B981' },
    { key: 'age_51_65', label: '51–65 yrs', sub: 'Mature Base', count: data.age_51_65 || 0, color: 'from-amber-500 to-orange-500', barColor: '#F59E0B' },
    { key: 'age_65_plus', label: '65+ yrs', sub: 'Senior Citizens', count: data.age_65_plus || 0, color: 'from-purple-500 to-pink-500', barColor: '#A855F7' },
  ];

  const totalCohortVoters = cohorts.reduce((sum, c) => sum + c.count, 0);
  const maxCount = Math.max(...cohorts.map((c) => c.count), 1);

  // Youth ratio (18-35 combined)
  const youthCount = (data.age_18_25 || 0) + (data.age_26_35 || 0);
  const youthPercentage = totalCohortVoters > 0 ? Math.round((youthCount / totalCohortVoters) * 100) : 0;

  return (
    <div className={`flex flex-col justify-between flex-1 h-full space-y-3 ${className}`}>
      {/* Header Stat & Youth Highlight Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Age Cohort Demographics
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Electoral population distribution across generation brackets
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
          <Sparkles size={13} className="text-indigo-500 animate-pulse" />
          <span>Youth Share (18–35):</span>
          <span className="font-mono font-extrabold">{youthPercentage}%</span>
        </div>
      </div>

      {/* Vertical Column Chart - Full Height */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end flex-1 min-h-[250px] pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        {cohorts.map((cohort) => {
          const pct = totalCohortVoters > 0 ? Math.round((cohort.count / totalCohortVoters) * 100) : 0;
          const heightPct = Math.max(8, Math.round((cohort.count / maxCount) * 100));
          const isHovered = hoveredCohort === cohort.key;

          return (
            <div
              key={cohort.key}
              className="flex flex-col items-center justify-end h-full group cursor-pointer relative"
              onMouseEnter={() => setHoveredCohort(cohort.key)}
              onMouseLeave={() => setHoveredCohort(null)}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div className="absolute -top-12 z-20 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10.5px] font-mono shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <span className="font-bold">{cohort.count.toLocaleString()}</span> voters ({pct}%)
                </div>
              )}

              {/* Percentage Above Bar */}
              <span
                className={`text-[10px] font-mono font-bold mb-1 transition-all ${isHovered
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                {pct}%
              </span>

              {/* Bar Fill */}
              <div className="w-full max-w-[48px] h-full flex items-end">
                <div
                  className={`w-full rounded-t-md bg-gradient-to-t ${cohort.color} transition-all duration-500 ${isHovered ? 'brightness-110 shadow-md scale-y-[1.02]' : 'opacity-90'
                    }`}
                  style={{
                    height: `${heightPct}%`,
                    boxShadow: isHovered ? `0 4px 12px ${cohort.barColor}50` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cohort Labels */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
        {cohorts.map((cohort) => (
          <div key={cohort.key} className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
              {cohort.label}
            </p>
            <p className="text-[9.5px] font-medium text-slate-400 truncate hidden sm:block">
              {cohort.sub}
            </p>
            <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
              {cohort.count.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
