import React from 'react';
import { Vote, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
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
      <Card loading className="h-full min-h-[300px]">
        <div className="h-48" />
      </Card>
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
    <Card
      title="Voter Sentiment & Party Leanings"
      subtitle="Constituency political preferences, swing base & campaign alignment"
      icon={<Vote size={18} className="text-indigo-600 dark:text-indigo-400" />}
      badge={
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
          {totalVoters.toLocaleString()} Voters
        </span>
      }
      footer={
        <div className="flex items-center justify-between text-xs w-full">
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
      }
      className="flex flex-col justify-between"
    >
      {/* Donut Chart & Legend */}
      <div className="py-1">
        <DonutChart data={partySegments} totalLabel="Mapped Base" size={190} />
      </div>
    </Card>
  );
};
