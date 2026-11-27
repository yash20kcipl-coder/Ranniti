import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  RefreshCw,
  Landmark,
  ChevronDown,
  Search,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '@/services/api';

export interface DashboardHeaderProps {
  orgName: string;
  totalVoters?: number;
  totalBooths?: number;
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  selectedBoothId?: string;
  onBoothChange?: (boothId: string, boothName?: string) => void;
  onAddVoterClick?: () => void;
}

interface BoothOption {
  id: string;
  boothNumber: string | number;
  name: string;
  wardName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  orgName,
  onRefresh,
  isRefreshing,
  selectedBoothId = '',
  onBoothChange,
}) => {
  const navigate = useNavigate();
  const [isBoothDropdownOpen, setIsBoothDropdownOpen] = useState(false);
  const [booths, setBooths] = useState<BoothOption[]>([]);
  const [boothsLoading, setBoothsLoading] = useState(false);
  const [boothSearch, setBoothSearch] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsBoothDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch booth options for the quick-selector
  useEffect(() => {
    let isMounted = true;
    const fetchBooths = async () => {
      setBoothsLoading(true);
      try {
        const res = await api.get('/tenant/geography/booths/options', {
          params: { limit: 1000 },
        });
        const options = res.data?.data || res.data || [];
        if (isMounted) {
          setBooths(options);
        }
      } catch {
        if (isMounted) setBooths([]);
      } finally {
        if (isMounted) setBoothsLoading(false);
      }
    };
    fetchBooths();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshClick = async () => {
    await onRefresh();
    const now = new Date();
    setLastSyncedTime(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const handleSelectBooth = (booth: BoothOption | null) => {
    if (booth) {
      onBoothChange?.(booth.id, `Booth ${booth.boothNumber} - ${booth.name}`);
    } else {
      onBoothChange?.('', '');
    }
    setIsBoothDropdownOpen(false);
  };

  const handleNavigateToMap = () => {
    const mapUrl = selectedBoothId
      ? `/dashboard/map-view?boothId=${selectedBoothId}`
      : '/dashboard/map-view';
    navigate(mapUrl);
  };

  const selectedBoothObj = booths.find((b) => b.id === selectedBoothId);

  const filteredBooths = booths.filter((b) => {
    if (!boothSearch.trim()) return true;
    const term = boothSearch.toLowerCase();
    const no = String(b.boothNumber ?? '').toLowerCase();
    const name = String(b.name || '').toLowerCase();
    return no.includes(term) || name.includes(term);
  });

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-[#131b34] dark:to-slate-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-800/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] dark:shadow-none p-4 sm:p-5 lg:p-6 transition-all z-20">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 right-0 w-64 h-64 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Identity & Greeting */}
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          {/* Monogram Badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1.5px] shadow-sm shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full rounded-xl bg-indigo-50/90 dark:bg-slate-900 flex items-center justify-center text-indigo-700 dark:text-white font-bold text-base sm:text-lg font-slab">
              {orgName ? orgName.charAt(0).toUpperCase() : 'C'}
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Welcome back, {orgName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">
              See your area map, voter support, and booth team at a glance
            </p>
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800/80">
          {/* 1. Booth Quick-Selector */}
          <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsBoothDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-auto group flex items-center justify-between sm:justify-start gap-2 h-9 px-3.5 rounded-xl
                ${selectedBoothObj
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
                border text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98]`}
              title="Filter by Polling Booth"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Landmark size={13} className={selectedBoothObj ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} />
                <span className="truncate max-w-[140px] sm:max-w-[160px]">
                  {selectedBoothObj ? `Booth #${selectedBoothObj.boothNumber}` : 'All Booths'}
                </span>
              </div>
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 shrink-0 ${isBoothDropdownOpen ? 'rotate-180 text-slate-700 dark:text-white' : ''
                  }`}
              />
            </button>

            {/* Dropdown Floating Panel */}
            {isBoothDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2.5 z-50 animate-fadeIn">
                {/* Search Header */}
                <div className="relative mb-2 px-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search booth number or name..."
                    value={boothSearch}
                    onChange={(e) => setBoothSearch(e.target.value)}
                    className="w-full pl-9 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                  {boothSearch && (
                    <button
                      type="button"
                      onClick={() => setBoothSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* All Booths Option */}
                <button
                  type="button"
                  onClick={() => handleSelectBooth(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${!selectedBoothId
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Landmark size={13} className="text-indigo-600 dark:text-indigo-400" />
                    <span>All Constituency Booths</span>
                  </div>
                  {!selectedBoothId && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                </button>

                <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />

                {/* Booth Options List */}
                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                  {boothsLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>Loading booths...</span>
                    </div>
                  ) : filteredBooths.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No matching booths found.
                    </div>
                  ) : (
                    filteredBooths.map((booth) => {
                      const isSelected = booth.id === selectedBoothId;
                      return (
                        <button
                          key={booth.id}
                          type="button"
                          onClick={() => handleSelectBooth(booth)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${isSelected
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/30 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/40 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono border border-indigo-200/60 dark:border-transparent">
                                #{booth.boothNumber}
                              </span>
                              <span className="truncate">Booth #{booth.boothNumber}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {booth.name}
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Move to Map Page */}
          <button
            type="button"
            onClick={handleNavigateToMap}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100/90 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-200/90 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
            title="Open Interactive GIS Map"
          >
            <Map size={13} className="text-sky-600 dark:text-sky-400" />
            <span>Map</span>
            <ExternalLink size={11} className="text-sky-500 dark:text-sky-400 opacity-80" />
          </button>

          {/* 3. Sync / Refresh */}
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 shrink-0"
            title={`Refresh metrics (Last updated: ${lastSyncedTime})`}
          >
            <RefreshCw
              size={13}
              className={`${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
