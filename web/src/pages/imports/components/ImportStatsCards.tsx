import React from 'react';
import { CountUp } from '@/components/common/CountUp';
import { FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ImportStats {
  totalJobs: number;
  runningJobs: number;
  completedClean: number;
  warningsOrFailed: number;
  totalRecordsInserted: number;
}

export interface ImportStatsCardsProps {
  stats: ImportStats;
  activeStatus?: string;
  onToggleStatus?: (status: string) => void;
  onResetQuickFilters?: () => void;
}

export const ImportStatsCards: React.FC<ImportStatsCardsProps> = ({
  stats,
  activeStatus = 'all',
  onToggleStatus,
  onResetQuickFilters,
}) => {
  const total = stats?.totalJobs || 0;
  const running = stats?.runningJobs || 0;
  const clean = stats?.completedClean || 0;
  const warnings = stats?.warningsOrFailed || 0;

  const runningPercent = total > 0 ? ((running / total) * 100).toFixed(1) : '0';
  const cleanPercent = total > 0 ? ((clean / total) * 100).toFixed(1) : '0';
  const warningsPercent = total > 0 ? ((warnings / total) * 100).toFixed(1) : '0';

  const isTotalActive = activeStatus === 'all' || !activeStatus;
  const isRunningActive = activeStatus === 'processing';
  const isCleanActive = activeStatus === 'completed';
  const isWarningsActive = activeStatus === 'warnings';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      {/* CARD 1: TOTAL IMPORT JOBS (ROYAL INDIGO GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onResetQuickFilters}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isTotalActive
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
          : 'border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
            Total Import Jobs
          </span>
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <FileSpreadsheet size={14} />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="font-slab text-xl font-bold text-indigo-950 dark:text-white">
            <CountUp to={total} duration={1.2} />
          </div>
          {stats?.totalRecordsInserted > 0 && (
            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 font-mono">
              {stats.totalRecordsInserted.toLocaleString()} recs
            </span>
          )}
        </div>
      </div>

      {/* CARD 2: IN PROGRESS / ENGINE ACTIVE (COBALT AZURE GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleStatus?.('processing')}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50/80 via-white to-sky-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-sky-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isRunningActive
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
          : 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block flex items-center gap-1.5">
            {running > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
            In Progress
          </span>
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <Loader2 size={14} className={running > 0 ? 'animate-spin' : ''} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-slab text-xl font-bold text-blue-950 dark:text-white">
            <CountUp to={running} duration={1.2} />
          </span>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
            ({runningPercent}%)
          </span>
        </div>
      </div>

      {/* CARD 3: 100% SUCCEEDED (VIBRANT EMERALD GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleStatus?.('completed')}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isCleanActive
          ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20'
          : 'border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            100% Succeeded
          </span>
          <div className="w-7 h-7 rounded-md bg-emerald-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-slab text-xl font-bold text-emerald-950 dark:text-white">
            <CountUp to={clean} duration={1.2} />
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            ({cleanPercent}%)
          </span>
        </div>
      </div>

      {/* CARD 4: WARNINGS / FAILED (GOLDEN AMBER GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleStatus?.('warnings')}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-amber-50/80 via-white to-rose-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-rose-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isWarningsActive
          ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20'
          : 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Warnings / Errors
          </span>
          <div className="w-7 h-7 rounded-md bg-amber-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <AlertTriangle size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-slab text-xl font-bold text-amber-950 dark:text-white">
            <CountUp to={warnings} duration={1.2} />
          </span>
          {warnings > 0 && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
              ({warningsPercent}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportStatsCards;
