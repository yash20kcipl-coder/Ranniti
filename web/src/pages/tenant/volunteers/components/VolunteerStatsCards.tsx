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
  const pcCount = coverage?.pcLeadersCount || 0;
  const acCount = coverage?.acLeadersCount || 0;
  const subCount = coverage?.subLeadersCount || 0;
  const leadersCount = pcCount + acCount + subCount;

  const supportersCount = coverage?.supportersCount || 0;
  const totalCadre = coverage?.totalCadre ?? totalVolunteers;
  const coveredBooths = coverage?.coveredBooths || 0;
  const totalBooths = coverage?.totalBooths || totalBoothsCount;
  const coveragePercent = totalBooths > 0 ? Math.round((coveredBooths / totalBooths) * 100) : (coverage?.coveragePercentage ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Cadre */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Field Cadre
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCadre}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {leadersCount} leaders • {supportersCount} supporters
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60 shrink-0 ml-3">
          <Users size={20} />
        </div>
      </div>

      {/* 2. Leaders & Coordinators */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Leadership Hierarchy
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {leadersCount}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
              PC: {pcCount}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              AC: {acCount}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
              Ward: {subCount}
            </span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60 shrink-0 ml-3">
          <Shield size={20} />
        </div>
      </div>

      {/* 3. Booth Supporters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Booth Supporters
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {supportersCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Ground-level booth agents
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 shrink-0 ml-3">
          <Vote size={20} />
        </div>
      </div>

      {/* 4. Booth Coverage */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex-1 mr-3 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Booth Coverage
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{coveragePercent}%</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {coveredBooths} / {totalBooths} booths
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(coveragePercent, 100)}%` }}
            />
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/60 shrink-0">
          <Building2 size={20} />
        </div>
      </div>
    </div>
  );
};
