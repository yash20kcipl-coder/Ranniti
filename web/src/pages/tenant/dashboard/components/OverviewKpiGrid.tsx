import React from 'react';
import { Vote, Users, Sparkles, ClipboardCheck, UserCheck } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { CountUp } from '@/components/common/CountUp';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface OverviewKpiGridProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

export const OverviewKpiGrid: React.FC<OverviewKpiGridProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <Card key={idx} loading skeletonVariant="simple" className="min-h-[140px]" />
        ))}
      </div>
    );
  }

  const {
    totalVoters,
    totalBooths,
    genderBreakdown,
    partyBreakdown = [],
    cadreSummary,
    fieldCompleteness,
    boothId,
  } = data;

  const partyAffiliatedCount = partyBreakdown.reduce(
    (sum, item) => sum + (item.partyId ? item.count : 0),
    0
  );
  const swingCount = Math.max(0, totalVoters - partyAffiliatedCount);
  const swingPct = totalVoters > 0 ? Math.round((swingCount / totalVoters) * 100) : 0;

  const subLeaders = cadreSummary?.subLeaderCount || 0;
  const supporters = cadreSummary?.supporterCount || 0;
  const dataScore = fieldCompleteness?.overallScore || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Total Voters */}
      <Card
        hoverable
        padding="md"
        className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/20 border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            {boothId ? 'Voters in This Booth' : 'Total Voters'}
          </p>
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Vote size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={totalVoters} duration={1.2} />
          </h3>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
              <Users size={13} />
              {genderBreakdown.male.toLocaleString()} Male · {genderBreakdown.female.toLocaleString()} Female
            </span>
          </div>
        </div>
      </Card>

      {/* CARD 2: Undecided / Swing Voters */}
      <Card
        hoverable
        padding="md"
        className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/20 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700 group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Undecided / Swing Voters
          </p>
          <div className="w-10 h-10 rounded-lg bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={swingCount} duration={1.2} />
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <span className="px-1.5 py-0.5 rounded font-extrabold text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {swingPct}% Undecided
            </span>
            <span className="text-slate-500 dark:text-slate-400">need outreach</span>
          </div>
        </div>
      </Card>

      {/* CARD 3: Booth Sub-Leaders & Supporters */}
      <Card
        hoverable
        padding="md"
        className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700 group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Sub-Leaders & Supporters
          </p>
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserCheck size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={subLeaders + supporters} duration={1.2} />
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {subLeaders} Sub-Leaders · {supporters} Supporters
            </span>
          </div>
        </div>
      </Card>

      {/* CARD 4: Voter Details Filled */}
      <Card
        hoverable
        padding="md"
        className="relative overflow-hidden bg-gradient-to-br from-purple-50/90 via-white to-pink-50/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-pink-950/20 border-purple-200/80 dark:border-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700 group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Voter Details Filled
          </p>
          <div className="w-10 h-10 rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ClipboardCheck size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {dataScore}%
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              Across {totalBooths.toLocaleString()} {totalBooths === 1 ? 'Booth' : 'Booths'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
