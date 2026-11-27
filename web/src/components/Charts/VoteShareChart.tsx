import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { HistoricalYearTrend } from '../../types/electionGis.types';

interface VoteShareChartProps {
  trends?: HistoricalYearTrend[];
}

const DEFAULT_TRENDS: HistoricalYearTrend[] = [
  {
    year: 2014,
    turnout: 66.4,
    winningParty: 'BJP',
    winningCandidate: 'S. K. Verma',
    marginPercentage: 14.2,
    bjpVoteShare: 48.5,
    incVoteShare: 34.2,
    regionalVoteShare: 17.3,
    totalVotes: 1120000,
  },
  {
    year: 2019,
    turnout: 67.4,
    winningParty: 'BJP',
    winningCandidate: 'S. K. Verma',
    marginPercentage: 18.5,
    bjpVoteShare: 55.2,
    incVoteShare: 31.8,
    regionalVoteShare: 13.0,
    totalVotes: 1245000,
  },
  {
    year: 2024,
    turnout: 65.8,
    winningParty: 'BJP',
    winningCandidate: 'Jyoti Dhurve',
    marginPercentage: 12.1,
    bjpVoteShare: 51.4,
    incVoteShare: 38.6,
    regionalVoteShare: 10.0,
    totalVotes: 1380000,
  },
];

export const VoteShareChart: React.FC<VoteShareChartProps> = ({ trends = DEFAULT_TRENDS }) => {
  return (
    <div className="h-44 flex flex-col justify-center select-none">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        <span>Historical Coalition Vote Share (2014 vs 2019 vs 2024)</span>
        <span className="text-indigo-500 font-mono text-[10px]">3 Elections</span>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="%" />
          <Tooltip
            formatter={(val: any, name: any) => [`${val}%`, name]}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '11px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            formatter={(val) => <span className="text-slate-600 dark:text-slate-300 font-bold">{val}</span>}
          />
          <Bar dataKey="bjpVoteShare" name="BJP / NDA" fill="#ea580c" radius={[3, 3, 0, 0]} />
          <Bar dataKey="incVoteShare" name="INC / INDIA" fill="#0284c7" radius={[3, 3, 0, 0]} />
          <Bar dataKey="regionalVoteShare" name="Others" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VoteShareChart;
