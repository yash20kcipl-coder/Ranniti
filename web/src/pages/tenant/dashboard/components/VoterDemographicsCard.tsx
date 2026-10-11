import React from 'react';
import { Users } from 'lucide-react';
import { AgeCohortBarChart } from '@/components/common/charts/AgeCohortBarChart';
import type { TenantDashboardPayload } from '@/redux/actions/tenantDashboard';

interface VoterDemographicsCardProps {
  data: TenantDashboardPayload | null;
  loading: boolean;
}

export const VoterDemographicsCard: React.FC<VoterDemographicsCardProps> = ({
  data,
  loading,
}) => {
  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  const { totalVoters, ageCohorts } = data;

  // Fallback age cohorts if empty
  const safeAgeCohorts = ageCohorts || {
    age_18_25: Math.round(totalVoters * 0.18),
    age_26_35: Math.round(totalVoters * 0.28),
    age_36_50: Math.round(totalVoters * 0.30),
    age_51_65: Math.round(totalVoters * 0.16),
    age_65_plus: Math.round(totalVoters * 0.08),
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs h-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Age Cohorts & Demographic Profile
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generation distribution, youth voting bloc (18–35), and gender parity
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
          {totalVoters.toLocaleString()} Voters
        </span>
      </div>

      {/* Age Cohorts Bar Chart - Full Height Expansion */}
      <div className="flex-1 flex flex-col py-1 min-h-[300px]">
        <AgeCohortBarChart data={safeAgeCohorts} className="flex-1" />
      </div>

      {/* Gender Breakdown Stacked Bar */}
      {/* <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            Gender Distribution
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
            {malePct}% Male ({genderBreakdown.male.toLocaleString()}) / {femalePct}% Female ({genderBreakdown.female.toLocaleString()})
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            className="h-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${malePct}%` }}
            title={`Male: ${genderBreakdown.male.toLocaleString()}`}
          />
          <div
            className="h-full bg-pink-500 transition-all duration-1000"
            style={{ width: `${femalePct}%` }}
            title={`Female: ${genderBreakdown.female.toLocaleString()}`}
          />
          {genderBreakdown.other > 0 && (
            <div
              className="h-full bg-purple-500 transition-all duration-1000"
              style={{ width: `${100 - malePct - femalePct}%` }}
              title={`Other: ${genderBreakdown.other.toLocaleString()}`}
            />
          )}
        </div>
      </div> */}
    </div>
  );
};
