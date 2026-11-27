import React from 'react';
import {
  ChevronRight,
  Upload,
  Calendar,
  MapPin,
  Landmark,
  Home,
  RefreshCw,
} from 'lucide-react';
import type { GeoLevel, ElectionType } from '../../types/electionGis.types';

interface HeaderProps {
  level: GeoLevel;
  selectedState: string | null;
  selectedPc: string | null;
  selectedAc: string | null;
  selectedBooth: string | null;
  electionYear: number;
  electionType: ElectionType;
  onYearChange: (year: number) => void;
  onTypeChange: (type: ElectionType) => void;
  onNavigateLevel: (targetLevel: GeoLevel) => void;
  onOpenUpload: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  level,
  selectedState,
  selectedPc,
  selectedAc,
  selectedBooth,
  electionYear,
  electionType,
  onYearChange,
  onTypeChange,
  onNavigateLevel,
  onOpenUpload,
  onReset,
}) => {
  return (
    <header className="bg-[#0f172a] text-white border-b border-slate-800 shadow-xl px-5 py-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Landmark className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white leading-tight">
                Indian Election GIS &amp; Analytics
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                ECI Delimitation
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive Subcontinental Vector Heatmap &bull; 543 PCs &bull; 4,182 ACs
            </p>
          </div>
        </div>

        {/* Center: Interactive Breadcrumbs */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <button
            onClick={() => onNavigateLevel('india')}
            className={`flex items-center gap-1 font-bold hover:text-white transition-colors cursor-pointer ${
              level === 'india' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Home size={13} />
            <span>India</span>
          </button>

          {selectedState && (
            <>
              <ChevronRight size={13} className="text-slate-600" />
              <button
                onClick={() => onNavigateLevel('state')}
                className={`font-bold hover:text-white transition-colors cursor-pointer ${
                  level === 'state' ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                {selectedState}
              </button>
            </>
          )}

          {selectedPc && (
            <>
              <ChevronRight size={13} className="text-slate-600" />
              <button
                onClick={() => onNavigateLevel('pc')}
                className={`font-bold hover:text-white transition-colors cursor-pointer ${
                  level === 'pc' ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                PC: {selectedPc}
              </button>
            </>
          )}

          {selectedAc && (
            <>
              <ChevronRight size={13} className="text-slate-600" />
              <button
                onClick={() => onNavigateLevel('ac')}
                className={`font-bold hover:text-white transition-colors cursor-pointer ${
                  level === 'ac' ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                AC: {selectedAc}
              </button>
            </>
          )}

          {selectedBooth && (
            <>
              <ChevronRight size={13} className="text-slate-600" />
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <MapPin size={11} />
                <span>{selectedBooth}</span>
              </span>
            </>
          )}
        </div>

        {/* Right: Year Selector, Type Selector, Upload, Reset */}
        <div className="flex items-center gap-2.5">
          {/* Election Type Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => onTypeChange('LS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                electionType === 'LS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lok Sabha
            </button>
            <button
              onClick={() => onTypeChange('VS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                electionType === 'VS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vidhan Sabha
            </button>
          </div>

          {/* Election Year Dropdown */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs font-bold">
            <Calendar size={13} className="text-slate-400 mr-1.5" />
            <select
              value={electionYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              aria-label="Select election year"
              className="bg-transparent text-white font-bold cursor-pointer focus:outline-hidden"
            >
              <option value={2024} className="bg-slate-900 text-white">2024 (General)</option>
              <option value={2019} className="bg-slate-900 text-white">2019</option>
              <option value={2014} className="bg-slate-900 text-white">2014</option>
            </select>
          </div>

          {/* Upload Data Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Upload size={14} />
            <span>Upload Data</span>
          </button>

          {/* Reset View Button */}
          <button
            onClick={onReset}
            title="Reset All Filters and Zoom"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
