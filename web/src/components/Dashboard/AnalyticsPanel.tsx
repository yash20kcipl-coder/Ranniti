import React from 'react';
import {
  Users,
  TrendingUp,
  Flame,
  ChevronRight,
  Building2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type {
  GeoLevel,
  CandidatePerformance,
  PollingBoothRecord,
} from '../../types/electionGis.types';
import { getPartyColor } from '../../services/electionService';

interface AnalyticsPanelProps {
  level: GeoLevel;
  selectedState: string | null;
  selectedPc: string | null;
  selectedAc: string | null;
  selectedBooth: PollingBoothRecord | null;
  turnout: number;
  margin: number;
  totalVotes: number;
  winningParty: string;
  winningCandidate: string;
  candidates: CandidatePerformance[];
  totalAcs?: number;
  totalBooths?: number;
  onDrillDown: () => void;
  onViewBooths: () => void;
  className?: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  level,
  selectedState,
  selectedPc,
  selectedAc,
  selectedBooth,
  turnout,
  margin,
  totalVotes,
  winningParty,
  winningCandidate,
  candidates,
  totalAcs = 7,
  totalBooths = 1850,
  onDrillDown,
  onViewBooths,
  className = '',
}) => {
  const partyColor = getPartyColor(winningParty);
  const isBattleground = margin < 5;

  return (
    <aside
      className={`w-84 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg select-none overflow-y-auto ${className}`}
    >
      <div className="p-4 space-y-4">
        {/* 1. Header & Level Tag */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                level === 'booth'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                  : level === 'ac'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : level === 'pc'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {level === 'booth'
                ? 'Polling Booth'
                : level === 'ac'
                ? 'Assembly Constituency'
                : level === 'pc'
                ? 'Parliamentary Constituency'
                : level === 'state'
                ? 'State Summary'
                : 'All India Overview'}
            </span>

            {isBattleground && (
              <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-md">
                <ShieldAlert size={10} />
                <span>Battleground Seat</span>
              </span>
            )}
          </div>

          <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            {selectedBooth
              ? selectedBooth.boothName
              : selectedAc
              ? selectedAc
              : selectedPc
              ? selectedPc
              : selectedState
              ? selectedState
              : 'Republic of India'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedState ? selectedState : '543 Lok Sabha Constituencies • 2024'}
            {selectedPc && !selectedBooth ? ` • PC: ${selectedPc}` : ''}
          </p>
        </div>

        {/* 2. Key Victory Metrics Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md shrink-0"
              style={{ backgroundColor: partyColor }}
            >
              {winningParty.slice(0, 4)}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Elected Representative
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                {winningCandidate || 'Elected Candidate'}
              </div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Party: <span className="font-black" style={{ color: partyColor }}>{winningParty}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>Voter Turnout</span>
                <Flame size={12} className="text-emerald-500" />
              </div>
              <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {turnout.toFixed(1)}%
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, turnout)}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>Winning Margin</span>
                <TrendingUp size={12} className="text-indigo-500" />
              </div>
              <div
                className={`text-base font-black font-mono ${
                  isBattleground
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {margin.toFixed(1)}%
              </div>
              <div className="text-[9px] font-bold text-slate-500 mt-1">
                {isBattleground ? 'Close Contest' : 'Decisive Victory'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Users size={13} className="text-slate-400" />
              <span>Total Votes Polled:</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {totalVotes.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Building2 size={13} className="text-slate-400" />
              <span>{level === 'pc' ? 'Assembly Segments:' : 'Polling Booths:'}</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {level === 'pc' ? `${totalAcs} ACs` : `${totalBooths} Booths`}
            </span>
          </div>
        </div>

        {/* 3. Candidate Vote Share Breakdown */}
        <div>
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
            Party-wise Vote Share Breakdown
          </label>
          <div className="space-y-2">
            {candidates.map((cand, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cand.partyColor }}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {cand.candidateName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono" style={{ color: cand.partyColor }}>
                      {cand.voteShare}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cand.voteShare}%`, backgroundColor: cand.partyColor }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{cand.party}</span>
                  <span>{cand.votes.toLocaleString('en-IN')} votes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          {level === 'pc' && (
            <button
              onClick={onDrillDown}
              className="w-full flex items-center justify-between py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Building2 size={14} />
                <span>Drill into Assembly Constituencies</span>
              </div>
              <ArrowRight size={14} />
            </button>
          )}

          {(level === 'pc' || level === 'ac') && (
            <button
              onClick={onViewBooths}
              className="w-full flex items-center justify-between py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Inspect Polling Booth Markers</span>
              </div>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AnalyticsPanel;
