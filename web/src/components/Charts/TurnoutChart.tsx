import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TurnoutChartProps {
  currentTurnout?: number;
}

const HISTORICAL_TURNOUT = [
  { year: '2004', turnout: 58.1, national: 58.1 },
  { year: '2009', turnout: 58.2, national: 58.2 },
  { year: '2014', turnout: 66.4, national: 66.4 },
  { year: '2019', turnout: 67.4, national: 67.4 },
  { year: '2024', turnout: 65.8, national: 65.8 },
];

export const TurnoutChart: React.FC<TurnoutChartProps> = ({ currentTurnout }) => {
  const chartData = HISTORICAL_TURNOUT.map((d) => {
    if (d.year === '2024' && currentTurnout) {
      return { ...d, turnout: currentTurnout };
    }
    return d;
  });

  return (
    <div className="h-44 flex flex-col justify-center select-none">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        <span>Voter Turnout Trends (2004 - 2024)</span>
        <span className="text-emerald-500 font-mono font-bold">
          2024: {currentTurnout ? currentTurnout.toFixed(1) : '65.8'}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="turnoutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis domain={[50, 75]} tick={{ fontSize: 10 }} unit="%" />
          <Tooltip
            formatter={(val: any) => [`${val}%`, 'Turnout']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '11px',
            }}
          />
          <Area
            type="monotone"
            dataKey="turnout"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#turnoutGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TurnoutChart;
