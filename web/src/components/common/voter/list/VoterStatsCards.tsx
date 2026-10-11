import React from 'react';
import { CountUp } from '@/components/common/CountUp';
import { Users, Vote, Mars, Venus } from 'lucide-react';

export interface VoterStatsCardsProps {
  stats: {
    totalVoters: number;
    maleVoters: number;
    femaleVoters: number;
    voterTypeCounts: Record<string, number>;
  };
  activeGender?: string;
  activeVoterType?: string;
  onToggleGender?: (gender: string) => void;
  onToggleVoterType?: (voterType: string) => void;
  onResetQuickFilters?: () => void;
}

export const VoterStatsCards: React.FC<VoterStatsCardsProps> = ({
  stats,
  activeGender = '',
  activeVoterType = '',
  onToggleGender,
  onToggleVoterType,
  onResetQuickFilters,
}) => {
  const total = stats?.totalVoters || 0;
  const male = stats?.maleVoters || 0;
  const female = stats?.femaleVoters || 0;
  const neutral = (stats?.voterTypeCounts && stats.voterTypeCounts['Neutral Voter']) || 0;

  const malePercent = total > 0 ? ((male / total) * 100).toFixed(1) : '0';
  const femalePercent = total > 0 ? ((female / total) * 100).toFixed(1) : '0';

  const isTotalActive = !activeGender && !activeVoterType;
  const isMaleActive = activeGender.toLowerCase() === 'male' || activeGender.toLowerCase() === 'm';
  const isFemaleActive = activeGender.toLowerCase() === 'female' || activeGender.toLowerCase() === 'f';
  const isNeutralActive = activeVoterType === 'Neutral Voter';

  return (
    <div className="space-y-3">
      {/* 4 BOXY BENTO STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL VOTERS (ROYAL INDIGO GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={onResetQuickFilters}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${isTotalActive
            ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
            : 'border-indigo-200/90 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Total Electorate
              </span>
              <div className="font-slab text-2xl font-bold text-indigo-950 dark:text-white mt-1">
                <CountUp to={total} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
              <Users size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Verified Registry</span>
            {isTotalActive ? (
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-300/80 dark:border-indigo-500/40 font-mono">
                All Voters
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium">
                Click to reset
              </span>
            )}
          </div>
        </div>

        {/* CARD 2: MALE VOTERS (COBALT AZURE GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleGender?.('Male')}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-sky-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${isMaleActive
            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
            : 'border-blue-200/90 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-600'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                Male Voters
              </span>
              <div className="font-slab text-2xl font-bold text-blue-950 dark:text-white mt-1">
                <CountUp to={male} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-blue-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Mars size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span className="tabular-nums font-bold text-blue-700 dark:text-blue-400 font-mono">{malePercent}% of total</span>
            {isMaleActive ? (
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-300/80 dark:border-blue-500/40 font-mono">
                Filtered
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 hover:text-blue-600 font-medium">Click to filter</span>
            )}
          </div>
        </div>

        {/* CARD 3: FEMALE VOTERS (VIBRANT ROSE GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleGender?.('Female')}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-rose-50/90 via-white to-pink-50/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-pink-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${isFemaleActive
            ? 'border-pink-500 dark:border-pink-400 ring-2 ring-pink-500/20'
            : 'border-rose-200/90 dark:border-rose-900/60 hover:border-pink-400 dark:hover:border-pink-600'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider block">
                Female Voters
              </span>
              <div className="font-slab text-2xl font-bold text-rose-950 dark:text-white mt-1">
                <CountUp to={female} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-pink-600 text-white shadow-md shadow-pink-500/25 flex items-center justify-center shrink-0">
              <Venus size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span className="tabular-nums font-bold text-pink-700 dark:text-pink-400 font-mono">{femalePercent}% of total</span>
            {isFemaleActive ? (
              <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-500/20 px-2 py-0.5 rounded-md border border-pink-300/80 dark:border-pink-500/40 font-mono">
                Filtered
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 hover:text-pink-600 font-medium">Click to filter</span>
            )}
          </div>
        </div>

        {/* CARD 4: NEUTRAL / SWING (GOLDEN AMBER GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleVoterType?.('Neutral Voter')}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${isNeutralActive
            ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20'
            : 'border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                Neutral / Swing
              </span>
              <div className="font-slab text-2xl font-bold text-amber-950 dark:text-white mt-1">
                <CountUp to={neutral} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Vote size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Critical Target</span>
            {isNeutralActive ? (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-300/80 dark:border-amber-500/40 font-mono">
                Filtered
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 hover:text-amber-600 font-medium">Click to filter</span>
            )}
          </div>
        </div>
      </div>

      {/* DUAL-TONE GENDER DISTRIBUTION PROGRESS BAR */}
      {total > 0 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50/60 via-white to-pink-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-blue-500 inline-block" />
              Male: {male.toLocaleString()} ({malePercent}%)
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Electoral Gender Ratio</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-pink-500 inline-block" />
              Female: {female.toLocaleString()} ({femalePercent}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-xs overflow-hidden flex">
            <div
              style={{ width: `${malePercent}%` }}
              className="h-full bg-blue-500 transition-all duration-500"
            />
            <div
              style={{ width: `${femalePercent}%` }}
              className="h-full bg-pink-500 transition-all duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterStatsCards;
