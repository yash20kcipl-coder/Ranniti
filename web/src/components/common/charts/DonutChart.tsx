import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface DonutSegment {
  id: string | number;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  totalLabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalLabel = 'Total Mapped',
  size = 200,
  strokeWidth = 24,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = data.map((item) => {
    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
    return {
      ...item,
      percentage,
    };
  });

  const hasData = data && data.length > 0 && total > 0;

  // Placeholder unmapped ring when no party sentiment is mapped yet
  const displayData = hasData
    ? chartData
    : [
        {
          id: 'unmapped',
          label: 'Swing / Unmapped Base',
          value: 100,
          color: '#94A3B8',
          percentage: 100,
        },
      ];

  const activeItem = activeIndex !== null ? displayData[activeIndex] : null;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      {/* Recharts Pie / Donut Container */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {hasData && (
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const seg = payload[0].payload as typeof chartData[0];
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-800 font-mono">
                        <div className="flex items-center gap-1.5 font-bold mb-0.5" style={{ color: seg.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                          {seg.label}
                        </div>
                        <div>
                          <span className="font-extrabold">{seg.value.toLocaleString()}</span> voters ({seg.percentage}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            )}
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={size / 2 - strokeWidth}
              outerRadius={size / 2}
              paddingAngle={hasData ? 2 : 0}
              dataKey="value"
              onMouseEnter={(_, index) => hasData && setActiveIndex(index)}
              onMouseLeave={() => hasData && setActiveIndex(null)}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.id || index}`}
                  fill={entry.color}
                  stroke={hasData && activeIndex === index ? '#FFFFFF' : hasData ? 'transparent' : 'rgba(148, 163, 184, 0.2)'}
                  strokeWidth={2}
                  style={{
                    filter: hasData && activeIndex === index ? `drop-shadow(0 0 8px ${entry.color}90)` : 'none',
                    opacity: hasData && activeIndex !== null && activeIndex !== index ? 0.45 : hasData ? 1 : 0.35,
                    transition: 'all 0.25s ease-in-out',
                    cursor: hasData ? 'pointer' : 'default',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Readout Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
          {hasData && activeItem ? (
            <>
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider truncate max-w-[120px]"
                style={{ color: activeItem.color }}
              >
                {activeItem.label}
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
                {activeItem.percentage}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeItem.value.toLocaleString()} voters
              </span>
            </>
          ) : hasData ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {totalLabel}
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">100% of mapped</span>
            </>
          ) : (
            <>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                Voter Sentiment
              </span>
              <span className="text-base font-extrabold text-slate-600 dark:text-slate-300 font-mono leading-tight mt-0.5">
                Pending
              </span>
              <span className="text-[9.5px] text-slate-400 mt-0.5">Awaiting Survey</span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend / Unmapped State Callout */}
      <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
        {!hasData ? (
          <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Constituency Preference Untagged
              </h5>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Field volunteers have not tagged party preferences for this constituency yet. All constituents currently fall under the <strong>Floating / Swing base</strong>.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              <span>Ready for survey launch</span>
              <span className="font-mono font-bold text-slate-500">100% Swing Base</span>
            </div>
          </div>
        ) : (
          chartData.map((seg, idx) => (
            <div
              key={seg.id || idx}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                activeIndex === idx
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-xs scale-[1.01]'
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {seg.value.toLocaleString()}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10.5px] font-extrabold"
                  style={{
                    backgroundColor: `${seg.color}20`,
                    color: seg.color,
                  }}
                >
                  {seg.percentage}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

