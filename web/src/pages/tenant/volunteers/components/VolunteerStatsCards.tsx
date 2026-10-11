import React from 'react';
import { CountUp } from '@/components/common/CountUp';
import { Users, Shield, Vote, Building2 } from 'lucide-react';
import type { VolunteerBoothCoverage } from '@/redux/reducers/volunteer';

interface VolunteerStatsCardsProps {
  coverage: VolunteerBoothCoverage | null;
  totalVolunteers: number;
  totalBoothsCount: number;
  selectedRole?: string;
  onSelectRole?: (role: string) => void;
}

export const VolunteerStatsCards: React.FC<VolunteerStatsCardsProps> = ({
  coverage,
  totalVolunteers,
  totalBoothsCount,
  selectedRole = '',
  onSelectRole,
}) => {
  const pcCount = coverage?.pcLeadersCount || 0;
  const acCount = coverage?.acLeadersCount || 0;
  const subCount = coverage?.subLeadersCount || 0;
  const leadersCount = pcCount + acCount + subCount;

  const supportersCount = coverage?.supportersCount || 0;
  const totalCadre = coverage?.totalCadre ?? totalVolunteers;
  const coveredBooths = coverage?.coveredBooths || 0;
  const totalBooths = coverage?.totalBooths || totalBoothsCount;

  const supporterCoveredBooths = coverage?.supporterCoveredBooths ?? 0;
  const wardCoveredBooths = coverage?.wardCoveredBooths ?? (coverage?.subLeadersCount ? coveredBooths : 0);

  const supporterPercent = totalBooths > 0
    ? (coverage?.supporterCoveragePercentage ?? Math.round((supporterCoveredBooths / totalBooths) * 100))
    : 0;
  const wardPercent = totalBooths > 0
    ? (coverage?.wardCoveragePercentage ?? Math.round((wardCoveredBooths / totalBooths) * 100))
    : 0;

  const isTotalActive = !selectedRole;
  const isSupporterActive = selectedRole === 'supporter';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Cadre (Indigo Gradient) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectRole?.('')}
        className={`relative p-4 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${isTotalActive
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
          : 'border-indigo-200/90 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
              Total Field Cadre
            </span>
            <div className="text-2xl font-bold text-indigo-950 dark:text-white mt-1">
              <CountUp to={totalCadre} duration={1.2} />
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
            <Users size={17} />
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          <span>{leadersCount} leaders • {supportersCount} supporters</span>
          {isTotalActive ? (
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-300/80 dark:border-indigo-500/40 font-mono">
              All Cadres
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium">
              Click to reset
            </span>
          )}
        </div>
      </div>

      {/* 2. Leaders & Coordinators (Purple Gradient) */}
      <div className="relative p-4 rounded-lg bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-fuchsia-950/20 border border-purple-200/90 dark:border-purple-900/60 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
              Leadership Hierarchy
            </span>
            <div className="text-2xl font-bold text-purple-950 dark:text-white mt-1">
              <CountUp to={leadersCount} duration={1.2} />
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-purple-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
            <Shield size={17} />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono">
            PC: {pcCount}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono">
            AC: {acCount}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
            Ward: {subCount}
          </span>
        </div>
      </div>

      {/* 3. Booth Supporters (Emerald Gradient) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectRole?.(isSupporterActive ? '' : 'supporter')}
        className={`relative p-4 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${isSupporterActive
          ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20'
          : 'border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-600'
          }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
              Booth Supporters
            </span>
            <div className="text-2xl font-bold text-emerald-950 dark:text-white mt-1">
              <CountUp to={supportersCount} duration={1.2} />
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
            <Vote size={17} />
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          <span>Ground-level booth agents</span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-300/80 dark:border-emerald-500/40 font-mono">
            Ground Force
          </span>
        </div>
      </div>

      {/* 4. Booth Coverage (Amber Gradient - Two-Tier Metric) */}
      <div className="relative p-4 rounded-lg bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/20 border border-amber-200/90 dark:border-amber-900/60 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Booth Coverage
          </span>
          <div className="w-9 h-9 rounded-md bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
            <Building2 size={17} />
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          {/* Tier 1: Booth Supporters */}
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Supporters:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {supporterPercent}% ({supporterCoveredBooths}/{totalBooths})
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-0.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(supporterPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Tier 2: Ward Lead Coverage */}
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Ward Leads:
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {wardPercent}% ({wardCoveredBooths}/{totalBooths})
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-0.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(wardPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

