import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

export interface DatePickerProps {
  name?: string;
  mode?: 'single' | 'range';
  value?: string | DateRangeValue | null;
  onChange?: (e: { target: { name: string; value: any } }) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  baseInputStyles?: string;
  clearable?: boolean;
}

type CalendarView = 'days' | 'months' | 'years';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Format local Date to YYYY-MM-DD without UTC timezone shift */
const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse YYYY-MM-DD safely into a local Date */
const parseIsoDate = (iso?: string): Date | null => {
  if (!iso || typeof iso !== 'string') return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

/** Format YYYY-MM-DD for display, e.g. "28 Nov 2026" */
const formatDisplayDate = (iso?: string): string => {
  const d = parseIsoDate(iso);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
};

/**
 * Custom calendar popover supporting both single-date (`mode="single"`)
 * and single-input date-range (`mode="range"`) selection.
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  name = '',
  mode = 'single',
  value,
  onChange,
  placeholder,
  disabled = false,
  icon,
  size = 'md',
  baseInputStyles = '',
  clearable = true,
}) => {
  const isSm = size === 'sm';
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<CalendarView>('days');

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const selectedSingle = mode === 'single' && typeof value === 'string' ? value : '';
  const selectedRange: DateRangeValue = useMemo(() => {
    if (mode !== 'range') return { startDate: '', endDate: '' };
    if (value && typeof value === 'object') {
      return {
        startDate: value.startDate || '',
        endDate: value.endDate || '',
      };
    }
    return { startDate: '', endDate: '' };
  }, [mode, value]);

  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const initialViewDate = useMemo(() => {
    const refIso = mode === 'single' ? selectedSingle : selectedRange.startDate;
    return parseIsoDate(refIso) || new Date();
  }, [mode, selectedSingle, selectedRange.startDate]);

  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());
  const [decadeStart, setDecadeStart] = useState(Math.floor(initialViewDate.getFullYear() / 12) * 12);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);

  const popoverWidth = mode === 'range' ? 392 : 280;

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const estimatedHeight = 336;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const effectiveWidth = Math.min(popoverWidth, window.innerWidth - 16);
    const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - effectiveWidth - 8));

    setPopoverCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: clampedLeft,
      openUpwards,
    });
  }, [popoverWidth]);

  useEffect(() => {
    if (!isOpen) {
      setPopoverCoords(null);
      setDraftStart(null);
      setHoverDate(null);
      setView('days');
      return;
    }

    const refIso = mode === 'single' ? selectedSingle : selectedRange.startDate;
    const refDate = parseIsoDate(refIso) || new Date();
    setViewYear(refDate.getFullYear());
    setViewMonth(refDate.getMonth());
    setDecadeStart(Math.floor(refDate.getFullYear() / 12) * 12);

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, mode, selectedSingle, selectedRange.startDate, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const gridStart = addDays(firstOfMonth, -startWeekday);
    return Array.from({ length: 42 }, (_, idx) => {
      const date = addDays(gridStart, idx);
      return {
        date,
        iso: toIsoDate(date),
        day: date.getDate(),
        inCurrentMonth: date.getMonth() === viewMonth && date.getFullYear() === viewYear,
      };
    });
  }, [viewYear, viewMonth]);

  const yearsGrid = useMemo(
    () => Array.from({ length: 12 }, (_, idx) => decadeStart + idx),
    [decadeStart]
  );

  const emitChange = (nextValue: any) => {
    if (onChange) {
      onChange({ target: { name, value: nextValue } });
    }
  };

  const handleHeaderPrev = () => {
    if (view === 'years') {
      setDecadeStart((y) => y - 12);
    } else if (view === 'months') {
      setViewYear((y) => y - 1);
    } else {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    }
  };

  const handleHeaderNext = () => {
    if (view === 'years') {
      setDecadeStart((y) => y + 12);
    } else if (view === 'months') {
      setViewYear((y) => y + 1);
    } else {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    }
  };

  const handleDayClick = (iso: string) => {
    if (mode === 'single') {
      emitChange(iso);
      setIsOpen(false);
      return;
    }

    if (!draftStart) {
      setDraftStart(iso);
      setHoverDate(iso);
    } else {
      const start = draftStart <= iso ? draftStart : iso;
      const end = draftStart <= iso ? iso : draftStart;
      emitChange({ startDate: start, endDate: end });
      setDraftStart(null);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mode === 'single') {
      emitChange('');
    } else {
      emitChange({ startDate: '', endDate: '' });
    }
    setDraftStart(null);
    setHoverDate(null);
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    if (mode === 'single') {
      emitChange(todayIso);
    } else {
      emitChange({ startDate: todayIso, endDate: todayIso });
    }
    setIsOpen(false);
  };

  const applyPreset = (start: Date, end: Date) => {
    emitChange({ startDate: toIsoDate(start), endDate: toIsoDate(end) });
    setDraftStart(null);
    setHoverDate(null);
    setIsOpen(false);
  };

  const rangePresets = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = addDays(today, -1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    return [
      { label: 'Today', start: today, end: today },
      { label: 'Yesterday', start: yesterday, end: yesterday },
      { label: 'Last 7 Days', start: addDays(today, -6), end: today },
      { label: 'Last 30 Days', start: addDays(today, -29), end: today },
      { label: 'This Month', start: monthStart, end: today },
      { label: 'Last Month', start: lastMonthStart, end: lastMonthEnd },
    ];
  }, []);

  const activeStart = mode === 'range'
    ? (draftStart ? (hoverDate && hoverDate < draftStart ? hoverDate : draftStart) : selectedRange.startDate)
    : selectedSingle;
  const activeEnd = mode === 'range'
    ? (draftStart ? (hoverDate && hoverDate >= draftStart ? hoverDate : draftStart) : selectedRange.endDate)
    : selectedSingle;

  const hasValue = mode === 'single'
    ? Boolean(selectedSingle)
    : Boolean(selectedRange.startDate || selectedRange.endDate);

  const displayLabel = useMemo(() => {
    if (mode === 'single') {
      return selectedSingle ? formatDisplayDate(selectedSingle) : '';
    }
    const { startDate, endDate } = selectedRange;
    if (!startDate && !endDate) return '';
    if (startDate && endDate) {
      return startDate === endDate
        ? formatDisplayDate(startDate)
        : `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
    }
    return formatDisplayDate(startDate || endDate);
  }, [mode, selectedSingle, selectedRange]);

  const defaultPlaceholder = mode === 'range' ? 'Select date range' : 'Select date';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`${baseInputStyles} flex items-center justify-between gap-2 text-left cursor-pointer ${
          icon ? (isSm ? 'pl-8' : 'pl-9') : ''
        } ${clearable && hasValue && !disabled ? (isSm ? 'pr-12' : 'pr-14') : (isSm ? 'pr-8' : 'pr-9')}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span
            className={`truncate font-slab text-xs ${
              displayLabel
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {displayLabel || placeholder || defaultPlaceholder}
          </span>
        </div>
      </button>

      {clearable && hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute ${isSm ? 'right-7' : 'right-8'} top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
          title="Clear date"
        >
          <X size={isSm ? 12 : 14} />
        </button>
      )}

      <Calendar
        className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none absolute ${
          isSm ? 'right-2.5' : 'right-3'
        } top-1/2 -translate-y-1/2`}
      />

      {isOpen && popoverCoords && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: popoverCoords.openUpwards ? undefined : popoverCoords.top,
            bottom: popoverCoords.openUpwards ? window.innerHeight - popoverCoords.top : undefined,
            left: popoverCoords.left,
            width: Math.min(popoverWidth, window.innerWidth - 16),
            zIndex: 99999,
          }}
          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 shadow-2xl shadow-slate-900/15 dark:shadow-black/90 overflow-hidden animate-fadeIn select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Left Sidebar Quick Presets (Range mode) */}
            {mode === 'range' && (
              <div className="sm:w-[118px] shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-2 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
                <span className="hidden sm:block px-2 pt-1 pb-1 text-[10px] font-slab font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quick Range
                </span>
                {rangePresets.map((preset) => {
                  const pStart = toIsoDate(preset.start);
                  const pEnd = toIsoDate(preset.end);
                  const isActive =
                    !draftStart &&
                    selectedRange.startDate === pStart &&
                    selectedRange.endDate === pEnd;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.start, preset.end)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-slab font-medium text-left whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Calendar Panel */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleHeaderPrev}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="flex items-center gap-1">
                  {view === 'years' ? (
                    <span className="px-2 py-1 text-xs font-slab font-bold text-slate-800 dark:text-slate-100">
                      {decadeStart} – {decadeStart + 11}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setView((v) => (v === 'months' ? 'days' : 'months'))}
                        className={`px-2 py-1 rounded-md text-xs font-slab font-bold transition-colors cursor-pointer ${
                          view === 'months'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {MONTH_NAMES[viewMonth]}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDecadeStart(Math.floor(viewYear / 12) * 12);
                          setView((v) => (v === 'years' ? 'days' : 'years'));
                        }}
                        className="px-2 py-1 rounded-md text-xs font-slab font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {viewYear}
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleHeaderNext}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Body */}
              {view === 'months' ? (
                <div className="p-3 grid grid-cols-3 gap-1.5">
                  {SHORT_MONTH_NAMES.map((mName, idx) => {
                    const isSelectedMonth = idx === viewMonth;
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx);
                          setView('days');
                        }}
                        className={`py-2.5 rounded-lg text-xs font-slab font-medium transition-colors cursor-pointer ${
                          isSelectedMonth
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>
              ) : view === 'years' ? (
                <div className="p-3 grid grid-cols-3 gap-1.5">
                  {yearsGrid.map((yr) => {
                    const isSelectedYear = yr === viewYear;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setViewYear(yr);
                          setView('months');
                        }}
                        className={`py-2.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                          isSelectedYear
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="text-center text-[10px] font-slab font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Grid */}
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {calendarDays.map(({ iso, day, inCurrentMonth }) => {
                      const isStart = Boolean(activeStart && iso === activeStart);
                      const isEnd = Boolean(activeEnd && iso === activeEnd);
                      const isSingleEndpoint = isStart && isEnd;
                      const isSelected = isStart || isEnd;
                      const isInRange = Boolean(
                        mode === 'range' &&
                        activeStart &&
                        activeEnd &&
                        iso > activeStart &&
                        iso < activeEnd
                      );
                      const isToday = iso === todayIso;

                      let shapeClass = 'rounded-lg';
                      if (mode === 'range' && activeStart && activeEnd && activeStart !== activeEnd) {
                        if (isStart) shapeClass = 'rounded-l-lg rounded-r-none';
                        else if (isEnd) shapeClass = 'rounded-r-lg rounded-l-none';
                        else if (isInRange) shapeClass = 'rounded-none';
                      } else if (isSingleEndpoint) {
                        shapeClass = 'rounded-lg';
                      }

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => handleDayClick(iso)}
                          onMouseEnter={() => {
                            if (mode === 'range' && draftStart) {
                              setHoverDate(iso);
                            }
                          }}
                          className={`relative h-8 w-full flex items-center justify-center text-xs font-slab transition-colors cursor-pointer ${shapeClass} ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold z-10'
                              : isInRange
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium'
                                : inCurrentMonth
                                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          } ${
                            isToday && !isSelected
                              ? 'ring-1 ring-inset ring-indigo-400/70 dark:ring-indigo-500/60 font-semibold'
                              : ''
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => handleClear()}
                  className="text-[11px] font-slab font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                {mode === 'range' && draftStart ? (
                  <span className="text-[10.5px] font-slab font-medium text-indigo-600 dark:text-indigo-400">
                    Pick end date
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleToday}
                    className="text-[11px] font-slab font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;
