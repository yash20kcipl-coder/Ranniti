import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  BarChart2,
} from 'lucide-react';
import { PartyChart } from '../Charts/PartyChart';
import { TurnoutChart } from '../Charts/TurnoutChart';
import { VoteShareChart } from '../Charts/VoteShareChart';
import type { HistoricalYearTrend } from '../../types/electionGis.types';

interface BottomAnalyticsPanelProps {
  currentTurnout?: number;
  historicalTrends?: HistoricalYearTrend[];
  constituencyName?: string;
  className?: string;
}

export const BottomAnalyticsPanel: React.FC<BottomAnalyticsPanelProps> = ({
  currentTurnout = 66.4,
  historicalTrends,
  constituencyName = 'India',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'party' | 'turnout' | 'historical'>('party');

  return (
    <div
      className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 select-none ${className}`}
    >
      {/* Drawer Toggle Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <BarChart2 size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Election Analytics &amp; Trends: {constituencyName}</span>
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* Sub-tabs */}
          {isOpen && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              <button
                onClick={() => setActiveTab('party')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'party'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Party &amp; Seat Distribution
              </button>
              <button
                onClick={() => setActiveTab('turnout')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'turnout'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Voter Turnout Trends
              </button>
              <button
                onClick={() => setActiveTab('historical')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'historical'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Multi-Election Comparison (2014 - 2024)
              </button>
            </div>
          )}
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          Live Delimitation Analytics
        </span>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="p-4 h-52">
          {activeTab === 'party' && <PartyChart />}
          {activeTab === 'turnout' && <TurnoutChart currentTurnout={currentTurnout} />}
          {activeTab === 'historical' && <VoteShareChart trends={historicalTrends} />}
        </div>
      )}
    </div>
  );
};

export default BottomAnalyticsPanel;
