import React from 'react';
import { Vote, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DonutChart } from '@/components/common/charts/DonutChart';
import type { TenantDashboardPayload } from '@/redux/actions/tenantDashboard';

interface VoterSentimentCardProps {
  data: TenantDashboardPayload | null;
  loading: boolean;
}

export const VoterSentimentCard: React.FC<VoterSentimentCardProps> = ({
  data,
  loading,
}) => {
  const navigate = useNavigate();

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  const { totalVoters, partyBreakdown = [] } = data;

  // Filter to constituents with confirmed party affiliation
  const mappedParties = partyBreakdown.filter((p) => p.partyId && p.count > 0);

  // Format party breakdown for DonutChart
  const partySegments = mappedParties.map((item, idx) => ({
    id: item.partyId || idx,
    label: item.partyName,
    value: item.count,
    color: item.color || ['#6366F1', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'][idx % 6],
  }));

  const mappedCount = mappedParties.reduce((sum, item) => sum + item.count, 0);
  const mappedPct = totalVoters > 0 ? Math.round((mappedCount / totalVoters) * 100) : 0;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Vote size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Voter Sentiment & Party Leanings
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Constituency political preferences, swing base & campaign alignment
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
          {totalVoters.toLocaleString()} Voters
        </span>
      </div>

      {/* Donut Chart & Legend */}
      <div className="py-1">
        <DonutChart data={partySegments} totalLabel="Mapped Base" size={190} />
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Survey Coverage:
          </span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {mappedPct}% ({mappedCount.toLocaleString()} mapped)
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/volunteers')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          Cadre Surveys <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
