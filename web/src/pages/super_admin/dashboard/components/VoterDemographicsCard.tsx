import React from 'react';
import { Vote } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { CountUp } from '@/components/common/CountUp';
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
      <Card loading className="h-full min-h-[350px]">
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </Card>
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
    <Card
      title="Voter Repository Demographics"
      subtitle="Master Database Distribution & Electoral Scope"
      icon={<Vote className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      badge={
        <span className="font-mono text-[10px] font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
          <CountUp to={voters.totalVoters} duration={1.5} /> Voters
        </span>
      }
      footer={
        <div className="w-full">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Master Electoral Master Directory
          </p>
          <div className="grid grid-cols-4 gap-2">
            {scopeMetrics.map((item) => (
              <div
                key={item.label}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                  {item.count.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      }
      className="h-full flex flex-col justify-between"
    >
      <div>
        {/* Demographic Ratio Bars */}
        <div className="space-y-4">
          {/* Male Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                Male Voters
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                <CountUp to={voters.maleVoters} duration={1.2} /> ({malePercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, malePercent))}%` }}
              />
            </div>
          </div>

          {/* Female Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
                Female Voters
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                <CountUp to={voters.femaleVoters} duration={1.2} /> ({femalePercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, femalePercent))}%` }}
              />
            </div>
          </div>

          {/* Other/Unspecified Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Other / Unspecified
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                <CountUp to={voters.otherVoters} duration={1.2} /> ({otherPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, otherPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
