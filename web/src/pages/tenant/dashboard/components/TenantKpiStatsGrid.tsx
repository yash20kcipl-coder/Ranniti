import React from 'react';
import { Vote, Users, Target, MapPin, CheckCircle2, UserCheck } from 'lucide-react';
import { CountUp } from '@/components/common/CountUp';
import type { TenantDashboardPayload } from '@/redux/actions/tenantDashboard';

interface TenantKpiStatsGridProps {
  data: TenantDashboardPayload | null;
  loading: boolean;
}

export const TenantKpiStatsGrid: React.FC<TenantKpiStatsGridProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalVoters,
    totalBooths,
    totalVolunteers,
    assignedBoothsCount,
    genderBreakdown,
    partyBreakdown = [],
  } = data;

  const partyAffiliatedCount = partyBreakdown.reduce((sum, item) => sum + (item.partyId ? item.count : 0), 0);
  const partyPct = totalVoters > 0 ? Math.round((partyAffiliatedCount / totalVoters) * 100) : 0;
  const boothCoveragePct = totalBooths > 0 ? Math.round((assignedBoothsCount / totalBooths) * 100) : 0;
  const volunteerRatio = totalBooths > 0 ? (totalVolunteers / totalBooths).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Total Registered Voters */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/20 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            Total Constituency Voters
          </p>
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Vote size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={totalVoters} duration={1.5} />
          </h3>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
              <Users size={13} />
              {genderBreakdown.male} Male / {genderBreakdown.female} Female
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: Party Affiliated Base */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/60 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Party Affiliated Base
          </p>
          <div className="w-10 h-10 rounded-lg bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Target size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={partyAffiliatedCount} duration={1.5} />
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <span className="px-1.5 py-0.5 rounded font-extrabold text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {partyPct}% of Base
            </span>
            <span className="text-slate-500 dark:text-slate-400">party preference mapped</span>
          </div>
        </div>
      </div>

      {/* CARD 3: Active Cadre / Volunteers */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Active Field Cadre
          </p>
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserCheck size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={totalVolunteers} duration={1.5} />
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {volunteerRatio} cadre / booth
            </span>
            <span>deployed</span>
          </div>
        </div>
      </div>

      {/* CARD 4: Polling Booths Infrastructure */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-purple-50/90 via-white to-pink-50/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-pink-950/20 border border-purple-200/80 dark:border-purple-900/60 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Polling Booth Network
          </p>
          <div className="w-10 h-10 rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MapPin size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={totalBooths} duration={1.5} />
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              {assignedBoothsCount} Active ({boothCoveragePct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
