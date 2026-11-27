import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  Landmark,
  Building2,
  Users,
  Search,
  Flame,
  TrendingUp,
  Award,
  PieChart,
  BarChart3,
  Sparkles,
  Upload,
  Layers,
  X,
} from 'lucide-react';
import type { GeoLevel, HeatmapMetric } from '../../types/electionGis.types';
import type { StateMetadata } from '../../services/geoDataService';

interface SidebarProps {
  level: GeoLevel;
  metric: HeatmapMetric;
  states: StateMetadata[];
  selectedState: string | null;
  onSelectLevel: (lvl: GeoLevel) => void;
  onSelectMetric: (m: HeatmapMetric) => void;
  onSelectState: (stateName: string) => void;
  onSearchSelect: (type: 'pc' | 'ac', name: string, stateName: string) => void;
  onOpenUpload: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  level,
  metric,
  states,
  selectedState,
  onSelectLevel,
  onSelectMetric,
  onSelectState,
  onOpenUpload,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const METRIC_OPTIONS: Array<{
    key: HeatmapMetric;
    label: string;
    icon: any;
    desc: string;
  }> = [
    { key: 'winning_party', label: '1. Winning Party', icon: Award, desc: 'Color by winning political party' },
    { key: 'vote_share', label: '2. Party Vote Share (%)', icon: PieChart, desc: 'Party percentage share' },
    { key: 'turnout', label: '3. Voter Turnout (%)', icon: Flame, desc: 'Thermal spectrum: Red to Green' },
    { key: 'margin', label: '4. Winning Margin (%)', icon: TrendingUp, desc: 'Battleground <5% vs Safe >25%' },
    { key: 'total_votes', label: '5. Total Votes Cast', icon: Users, desc: 'Vote count density scale' },
    { key: 'nota_votes', label: '6. NOTA Vote %', icon: BarChart3, desc: 'None of the Above vote share' },
    { key: 'leading_party', label: '7. Leading Party', icon: Award, desc: 'Active lead projections' },
    { key: 'custom_metric', label: '8. Custom Metric', icon: Sparkles, desc: 'Uploaded dataset index' },
  ];

  return (
    <aside
      className={`w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg select-none ${className}`}
    >
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* 1. Constituency Search Input */}
        <div>
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
            Quick Constituency Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search PC (e.g. Betul, Varanasi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Hierarchical Geographical Level Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-600" />
              <span>Hierarchical Boundary Level</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => onSelectLevel('india')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                level === 'india'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe size={14} />
                <span>1. All India Overview</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">National</span>
            </button>

            <button
              onClick={() => onSelectLevel('state')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                level === 'state'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>2. State Level</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">36 States</span>
            </button>

            <button
              onClick={() => onSelectLevel('pc')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                level === 'pc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Landmark size={14} />
                <span>3. Parliamentary (PC)</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">543 Seats</span>
            </button>

            <button
              onClick={() => onSelectLevel('ac')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                level === 'ac'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 size={14} />
                <span>4. Assembly (AC)</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">4,182 ACs</span>
            </button>

            <button
              onClick={() => onSelectLevel('booth')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                level === 'booth'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>5. Polling Booth Level</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">Points</span>
            </button>
          </div>
        </div>

        {/* 3. State Filter Dropdown */}
        <div>
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
            Filter by State / UT
          </label>
          <div className="relative">
            <select
              value={selectedState || ''}
              onChange={(e) => onSelectState(e.target.value)}
              aria-label="Filter by Indian State"
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- All India (All 36 States &amp; UTs) --</option>
              {states.map((st) => (
                <option key={st.name} value={st.name}>
                  {st.name} ({st.pcCount} PCs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Election Heatmap Visualization Selector */}
        <div>
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
            Election Heatmap Visualization
          </label>
          <div className="space-y-1">
            {METRIC_OPTIONS.map((m) => {
              const Icon = m.icon;
              const isSelected = metric === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => onSelectMetric(m.key)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold leading-tight ${
                        isSelected
                          ? 'text-indigo-900 dark:text-indigo-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {m.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Custom Data Banner */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={onOpenUpload}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Upload size={14} />
          <span>Upload Election CSV / Excel</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
