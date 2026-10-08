import React from 'react';
import { Vote } from 'lucide-react';
import type {
  VoterDemographicMetrics,
  ElectoralInfrastructureCounts,
} from '@/redux/actions/superAdminDashboard';

interface VoterDemographicsCardProps {
  voters: VoterDemographicMetrics | null;
  infrastructure: ElectoralInfrastructureCounts | null;
  loading: boolean;
}

export const VoterDemographicsCard: React.FC<VoterDemographicsCardProps> = ({
  voters,
  infrastructure,
  loading,
}) => {
  if (loading || !voters || !infrastructure) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse h-full">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const total = voters.totalVoters || 1;
  const malePercent = Math.round((voters.maleVoters / total) * 100);
  const femalePercent = Math.round((voters.femaleVoters / total) * 100);
  const otherPercent = Math.max(0, 100 - malePercent - femalePercent);

  const scopeMetrics = [
    { label: 'States', count: infrastructure.statesCount },
    { label: 'PCs', count: infrastructure.pcsCount },
    { label: 'ACs', count: infrastructure.acsCount },
    { label: 'Wards', count: infrastructure.wardsCount },
    { label: 'Booths', count: infrastructure.boothsCount },
    { label: 'Parties', count: infrastructure.partiesCount },
    { label: 'Castes', count: infrastructure.castesCount },
    { label: 'Religions', count: infrastructure.religionsCount },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Voter Repository Demographics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Master Database Distribution & Electoral Scope
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {voters.totalVoters.toLocaleString()} Total Records
          </span>
        </div>

        {/* Demographic Ratio Bars */}
        <div className="space-y-3.5">
          {/* Male Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                Male Voters
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {voters.maleVoters.toLocaleString()} ({malePercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, malePercent))}%` }}
              />
            </div>
          </div>

          {/* Female Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
                Female Voters
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {voters.femaleVoters.toLocaleString()} ({femalePercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, femalePercent))}%` }}
              />
            </div>
          </div>

          {/* Other/Unspecified Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Other / Unspecified
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {voters.otherVoters.toLocaleString()} ({otherPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, otherPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Electoral Scope Breakdown Pills */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Master Electoral Master Directory
        </p>
        <div className="grid grid-cols-4 gap-2">
          {scopeMetrics.map((item) => (
            <div
              key={item.label}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center"
            >
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {item.label}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {item.count.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
