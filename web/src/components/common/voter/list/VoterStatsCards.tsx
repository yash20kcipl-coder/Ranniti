import React from 'react';
import { Users, UserCheck, Vote } from 'lucide-react';

interface VoterStatsCardsProps {
  stats: {
    totalVoters: number;
    maleVoters: number;
    femaleVoters: number;
    voterTypeCounts: Record<string, number>;
  };
}

export const VoterStatsCards: React.FC<VoterStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Voters</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{(stats?.totalVoters || 0).toLocaleString()}</h3>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Male Voters</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{(stats?.maleVoters || 0).toLocaleString()}</h3>
        </div>
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Female Voters</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{(stats?.femaleVoters || 0).toLocaleString()}</h3>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Neutral Voters</p>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {((stats?.voterTypeCounts && stats.voterTypeCounts['Neutral Voter']) || 0).toLocaleString()}
          </h3>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          <Vote className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
