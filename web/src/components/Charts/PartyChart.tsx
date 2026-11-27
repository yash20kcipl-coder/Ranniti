import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

interface PartyData {
  party: string;
  votes: number;
  share: number;
  color: string;
  seats: number;
}

interface PartyChartProps {
  data?: PartyData[];
}

const DEFAULT_PARTY_DATA: PartyData[] = [
  { party: 'BJP', votes: 240000000, share: 36.6, color: '#ea580c', seats: 240 },
  { party: 'INC', votes: 136000000, share: 21.2, color: '#0284c7', seats: 99 },
  { party: 'SP', votes: 34000000, share: 4.6, color: '#ef4444', seats: 37 },
  { party: 'AITC', votes: 28000000, share: 4.4, color: '#16a34a', seats: 29 },
  { party: 'DMK', votes: 22000000, share: 3.2, color: '#dc2626', seats: 22 },
  { party: 'TDP', votes: 16000000, share: 2.1, color: '#f59e0b', seats: 16 },
  { party: 'AAP', votes: 12000000, share: 1.8, color: '#06b6d4', seats: 3 },
  { party: 'Others', votes: 160000000, share: 26.1, color: '#8b5cf6', seats: 97 },
];

export const PartyChart: React.FC<PartyChartProps> = ({ data = DEFAULT_PARTY_DATA }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center">
      {/* 1. Pie Chart for Seat Share */}
      <div className="h-44 flex flex-col items-center justify-center">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Lok Sabha Seat Distribution (543 Seats)
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="seats"
              nameKey="party"
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={58}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`${value} Seats`, name]}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Bar Chart for Vote Share % */}
      <div className="h-44 flex flex-col justify-center">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          National Vote Share (%)
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data.slice(0, 6)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="party" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip
              formatter={(val: any) => [`${val}%`, 'Vote Share']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
              }}
            />
            <Bar dataKey="share" radius={[4, 4, 0, 0]}>
              {data.slice(0, 6).map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PartyChart;
