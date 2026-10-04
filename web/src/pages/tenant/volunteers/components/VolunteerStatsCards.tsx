import React from 'react';
import { Users, Shield, Vote, Building2 } from 'lucide-react';
import type { VolunteerBoothCoverage } from '@/redux/reducers/volunteer';

interface VolunteerStatsCardsProps {
  coverage: VolunteerBoothCoverage | null;
  totalVolunteers: number;
  totalBoothsCount: number;
}

export const VolunteerStatsCards: React.FC<VolunteerStatsCardsProps> = ({
  coverage,
  totalVolunteers,
  totalBoothsCount,
}) => {
  const leadersCount =
    (coverage?.pcLeadersCount || 0) +
    (coverage?.acLeadersCount || 0) +
    (coverage?.subLeadersCount || 0);

  const coveragePercent = coverage?.coveragePercentage ?? 0;
  const totalBooths = coverage?.totalBooths || totalBoothsCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Cadre */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Field Cadre</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {coverage?.totalCadre ?? totalVolunteers}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mobile app field workers</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
          <Users size={22} />
        </div>
      </div>

      {/* Leadership Strength */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Leaders & Coordinators
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{leadersCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            PC: {coverage?.pcLeadersCount || 0} • AC: {coverage?.acLeadersCount || 0} • Ward: {coverage?.subLeadersCount || 0}
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60">
          <Shield size={22} />
        </div>
      </div>

      {/* Ground Supporters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Booth Supporters
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {coverage?.supportersCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Assigned to polling stations</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
          <Vote size={22} />
        </div>
      </div>

      {/* Booth Coverage % */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex-1 mr-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Booth Coverage
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5">
            <span>{coveragePercent}%</span>
            <span className="text-xs font-normal text-slate-400">
              ({coverage?.coveredBooths || 0}/{totalBooths})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(coveragePercent, 100)}%` }}
            />
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/60 shrink-0">
          <Building2 size={22} />
        </div>
      </div>
    </div>
  );
};
