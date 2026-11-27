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
  const neutralPercent = total > 0 ? ((neutral / total) * 100).toFixed(1) : '0';

  const isTotalActive = !activeGender && !activeVoterType;
  const isMaleActive = activeGender.toLowerCase() === 'male' || activeGender.toLowerCase() === 'm';
  const isFemaleActive = activeGender.toLowerCase() === 'female' || activeGender.toLowerCase() === 'f';
  const isNeutralActive = activeVoterType === 'Neutral Voter';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      {/* CARD 1: TOTAL VOTERS (ROYAL INDIGO GRADIENT) */}
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
            Total Electorate
          </span>
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <Users size={14} />
          </div>
        </div>
        <div className="font-slab text-xl font-bold text-indigo-950 dark:text-white mt-1">
          <CountUp to={total} duration={1.2} />
        </div>
      </div>

      {/* CARD 2: MALE VOTERS (COBALT AZURE GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleGender?.('Male')}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50/80 via-white to-sky-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-sky-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isMaleActive
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
          : 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            Male Voters
          </span>
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <Mars size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-slab text-xl font-bold text-blue-950 dark:text-white">
            <CountUp to={male} duration={1.2} />
          </span>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
            ({malePercent}%)
          </span>
        </div>
      </div>

      {/* CARD 3: FEMALE VOTERS (VIBRANT ROSE GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleGender?.('Female')}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-rose-50/80 via-white to-pink-50/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-pink-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isFemaleActive
          ? 'border-pink-500 dark:border-pink-400 ring-2 ring-pink-500/20'
          : 'border-rose-200/80 dark:border-rose-900/60 hover:border-pink-400 dark:hover:border-pink-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider block">
            Female Voters
          </span>
          <div className="w-7 h-7 rounded-md bg-pink-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <Venus size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-slab text-xl font-bold text-rose-950 dark:text-white">
            <CountUp to={female} duration={1.2} />
          </span>
          <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 font-mono">
            ({femalePercent}%)
          </span>
        </div>
      </div>

      {/* CARD 4: NEUTRAL / SWING (GOLDEN AMBER GRADIENT) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleVoterType?.('Neutral Voter')}
        className={`relative p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-2xs ${isNeutralActive
          ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20'
          : 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Neutral / Swing
          </span>
          <div className="w-7 h-7 rounded-md bg-amber-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <Vote size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-slab text-xl font-bold text-amber-950 dark:text-white">
            <CountUp to={neutral} duration={1.2} />
          </span>
          {neutral > 0 && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
              ({neutralPercent}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoterStatsCards;
