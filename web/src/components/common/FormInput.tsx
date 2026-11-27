import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileUploadInput } from './FileUploadInput';
import { Eye, EyeOff, Check, AlertCircle, ChevronDown, Search, X, Loader2 } from 'lucide-react';

export interface Option {
  label: string;
  value: string | number;
  subtitle?: string;
}

export interface FormInputProps {
  label?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select' | 'multiselect' | 'textarea' | 'file' | 'checkbox' | 'switch' | 'date' | 'autocomplete';
  searchable?: boolean;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Option[];
  /** Suggestion strings for type="autocomplete" free-text inputs */
  suggestions?: string[];
  /** Async search fallback when local suggestions don't match */
  onRemoteSearch?: (query: string) => Promise<any[]>;
  /** Async search handler for select dropdown options */
  onOptionSearch?: (query: string) => Promise<Option[]>;
  /** Callback with full object when selected from suggestions or remote results */
  onSelectDetailed?: (item: any) => void;
  /** Custom renderer for detailed suggestion item */
  renderSuggestionDetail?: (item: any) => React.ReactNode;
  error?: string;
  helperText?: string;
  rows?: number;
  accept?: string;
  icon?: React.ReactNode;
  labelRightAction?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** @deprecated use type="autocomplete" + suggestions instead */
  list?: string;
  inlineLabel?: string;
  clearable?: boolean;
  onClear?: () => void;
  inputClassName?: string;
}

interface SearchableSelectProps {
  name?: string;
  value?: any;
  onChange?: (e: { target: { name: string; value: any } }) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  baseInputStyles: string;
  inlineLabel?: string;
  clearable?: boolean;
  onOptionSearch?: (query: string) => Promise<Option[]>;
}

interface AutocompleteInputProps {
  name?: string;
  value?: string;
  onChange?: (e: { target: { name: string; value: any } }) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  baseInputStyles: string;
  onRemoteSearch?: (query: string) => Promise<any[]>;
  onSelectDetailed?: (item: any) => void;
  renderSuggestionDetail?: (item: any) => React.ReactNode;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  name,
  value = '',
  onChange,
  suggestions,
  placeholder,
  required,
  disabled,
  icon,
  baseInputStyles,
  onRemoteSearch,
  onSelectDetailed,
  renderSuggestionDetail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number; openUpwards: boolean } | null>(null);
  const [remoteResults, setRemoteResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const prevQueryRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uniqueSuggestions = React.useMemo(() => {
    return Array.from(new Set((suggestions || []).filter((s): s is string => Boolean(s && typeof s === 'string' && s.trim()))));
  }, [suggestions]);

  const filtered = React.useMemo(() => {
    if (!value.trim()) return uniqueSuggestions.slice(0, 20);
    const term = value.toLowerCase().trim();
    return uniqueSuggestions.filter((s) => s.toLowerCase().includes(term)).slice(0, 20);
  }, [uniqueSuggestions, value]);

  // Trigger remote search automatically when no local matches exist and input is at least 2 chars
  useEffect(() => {
    const trimmed = value.trim();
    if (!onRemoteSearch || trimmed.length < 2) {
      setRemoteResults([]);
      setIsSearching(false);
      prevQueryRef.current = '';
      return;
    }

    if (filtered.length > 0) {
      setRemoteResults([]);
      setIsSearching(false);
      prevQueryRef.current = '';
      return;
    }

    if (trimmed === prevQueryRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        prevQueryRef.current = trimmed;
        const res = await onRemoteSearch(trimmed);
        setRemoteResults(Array.isArray(res) ? res : []);
      } catch {
        setRemoteResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [value, filtered.length, onRemoteSearch]);

  const hasExactMatch = React.useMemo(() => {
    if (!value.trim()) return true;
    const term = value.toLowerCase().trim();
    if (uniqueSuggestions.some((s) => s.toLowerCase() === term)) return true;
    if (remoteResults.some((r) => {
      const name = typeof r === 'string' ? r : (r?.name || '');
      return name.toLowerCase() === term;
    })) return true;
    return false;
  }, [uniqueSuggestions, remoteResults, value]);

  const updateCoords = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 220 && rect.top > spaceBelow;
    setDropdownCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
      openUpwards,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) { setDropdownCoords(null); return; }
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, updateCoords]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(t) &&
        dropdownRef.current && !dropdownRef.current.contains(t)
      ) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({ target: { name: name || '', value: e.target.value } });
    setIsOpen(true);
  };

  const handleSelect = (suggestion: string, itemDetail?: any) => {
    onChange?.({ target: { name: name || '', value: suggestion } });
    if (itemDetail && onSelectDetailed) {
      onSelectDetailed(itemDetail);
    }
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (
    filtered.length > 0 ||
    remoteResults.length > 0 ||
    isSearching ||
    (!hasExactMatch && value.trim().length > 0)
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">{icon}</div>}
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={`${baseInputStyles} ${icon ? 'pl-10' : ''} font-slab text-xs`}
      />
      {showDropdown && dropdownCoords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
            ...(dropdownCoords.openUpwards
              ? { bottom: `${window.innerHeight - dropdownCoords.top}px` }
              : { top: `${dropdownCoords.top}px` }),
            zIndex: 999999,
          }}
          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 shadow-2xl shadow-slate-900/10 dark:shadow-black/90 backdrop-blur-xl overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {!hasExactMatch && value.trim().length > 0 && (
              <button
                type="button"
                onMouseDown={() => handleSelect(value.trim())}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-slab text-left transition-colors cursor-pointer flex items-center gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-dashed border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 mb-1"
              >
                <span className="truncate">Add new <strong>"{value.trim()}"</strong></span>
              </button>
            )}

            {filtered.map((s, index) => (
              <button
                key={`${s}-${index}`}
                type="button"
                onMouseDown={() => handleSelect(s)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-slab text-left transition-colors cursor-pointer flex items-center gap-2 ${s.toLowerCase() === value.toLowerCase().trim()
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
              >
                <span className="truncate">{s}</span>
                {s.toLowerCase() === value.toLowerCase().trim() && <Check size={12} className="shrink-0 text-white ml-auto" />}
              </button>
            ))}

            {isSearching && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-slab text-slate-500 dark:text-slate-400">
                <Loader2 size={13} className="animate-spin text-indigo-500" />
                <span>Searching database for "{value.trim()}"...</span>
              </div>
            )}

            {!isSearching && remoteResults.length > 0 && (
              <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Database Search Results
                </div>
                {remoteResults.map((item, index) => {
                  const itemName = typeof item === 'string' ? item : (item?.name || '');
                  const locationSubtitle = renderSuggestionDetail
                    ? renderSuggestionDetail(item)
                    : (typeof item === 'object' && item !== null
                      ? [item.talukaName, item.districtName, item.stateName].filter(Boolean).join(', ')
                      : '');
                  const isSelected = itemName.toLowerCase() === value.toLowerCase().trim();

                  return (
                    <button
                      key={`remote-${item.id || itemName}-${index}`}
                      type="button"
                      onMouseDown={() => handleSelect(itemName, item)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-slab text-left transition-colors cursor-pointer flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate font-medium">{itemName}</span>
                        {isSelected && <Check size={12} className="shrink-0 text-white ml-2" />}
                      </div>
                      {locationSubtitle ? (
                        <span className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {locationSubtitle}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && !isSearching && remoteResults.length === 0 && value.trim().length >= 2 && onRemoteSearch && (
              <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
                No database records found matching "{value.trim()}"
              </div>
            )}

            {onRemoteSearch && filtered.length > 0 && value.trim().length >= 2 && !isSearching && remoteResults.length === 0 && (
              <button
                type="button"
                onMouseDown={async (e) => {
                  e.preventDefault();
                  setIsSearching(true);
                  try {
                    const res = await onRemoteSearch(value.trim());
                    setRemoteResults(Array.isArray(res) ? res : []);
                  } catch {
                    setRemoteResults([]);
                  } finally {
                    setIsSearching(false);
                  }
                }}
                className="w-full px-3 py-1.5 text-[11px] font-slab text-indigo-600 dark:text-indigo-400 hover:underline text-left flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800"
              >
                <Search size={12} />
                <span>Search database for more "{value.trim()}"...</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};


const SearchableSelect: React.FC<SearchableSelectProps> = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  searchable = true,
  icon,
  size = 'md',
  baseInputStyles,
  inlineLabel,
  clearable = true,
  onOptionSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [remoteOptions, setRemoteOptions] = useState<Option[]>([]);
  const [isRemoteSearching, setIsRemoteSearching] = useState(false);
  const [cachedSelectedOption, setCachedSelectedOption] = useState<Option | null>(null);
  const remoteSearchTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  } | null>(null);

  // Calculate coordinates to render dropdown in body portal
  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;
    const targetWidth = Math.min(Math.max(rect.width, onOptionSearch ? 320 : rect.width), window.innerWidth - 16);

    setDropdownCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - targetWidth - 8)),
      width: targetWidth,
      openUpwards,
    });
  }, [onOptionSearch]);

  // Update coords and attach listeners when open
  useEffect(() => {
    if (!isOpen) {
      setDropdownCoords(null);
      return;
    }

    updateDropdownPosition();

    const handleScrollOrResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Remote search when onOptionSearch is provided and user types in search box
  useEffect(() => {
    if (!isOpen || !onOptionSearch) return;
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setRemoteOptions([]);
      setIsRemoteSearching(false);
      return;
    }

    if (remoteSearchTimeoutRef.current) {
      clearTimeout(remoteSearchTimeoutRef.current);
    }

    let cancelled = false;
    setIsRemoteSearching(true);
    remoteSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await onOptionSearch(trimmed);
        if (!cancelled) {
          setRemoteOptions(Array.isArray(results) ? results : []);
        }
      } catch {
        if (!cancelled) {
          setRemoteOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsRemoteSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      if (remoteSearchTimeoutRef.current) {
        clearTimeout(remoteSearchTimeoutRef.current);
      }
    };
  }, [isOpen, searchTerm, onOptionSearch]);

  const selectedOption =
    options.find((opt) => String(opt.value) === String(value)) ||
    (cachedSelectedOption && String(cachedSelectedOption.value) === String(value) ? cachedSelectedOption : undefined);
  const isSelectedOptionActive = Boolean(selectedOption && String(selectedOption.value).trim() !== '');

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.subtitle ? opt.subtitle.toLowerCase().includes(term) : false) ||
      String(opt.value).toLowerCase().includes(term)
    );
  });

  const displayedOptions = onOptionSearch && searchTerm.trim() ? remoteOptions : filteredOptions;

  const handleSelect = (opt: Option) => {
    setCachedSelectedOption(String(opt.value).trim() !== '' ? opt : null);
    onChange?.({ target: { name: name || '', value: opt.value } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCachedSelectedOption(null);
    onChange?.({ target: { name: name || '', value: '' } });
    setSearchTerm('');
  };

  const isSearchActive = searchable && (Boolean(onOptionSearch) || options.length > 5);

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[100]' : ''}`}>
      {/* Hidden input for HTML form compliance */}
      <input
        type="hidden"
        name={name}
        value={value ?? ''}
        required={required}
        disabled={disabled}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${baseInputStyles} ${size === 'sm' ? 'px-2.5 text-[11px]' : 'px-3 text-xs'} font-slab text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${isOpen ? 'ring-1 ring-indigo-400/30 border-indigo-400/80' : ''
          }`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {icon && (
            <span className="shrink-0 text-slate-400 dark:text-slate-500">
              {icon}
            </span>
          )}

          <div className="flex items-center min-w-0 truncate">
            {inlineLabel && isSelectedOptionActive && (
              <span className="text-slate-400 dark:text-slate-500 font-normal shrink-0 mr-1 text-[11px]">
                {inlineLabel}:
              </span>
            )}
            <span className={`truncate font-slab ${size === 'sm' ? 'text-[11px]' : 'text-xs'} ${isSelectedOptionActive ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-500 font-normal'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500 ml-1">
          {clearable && isSelectedOptionActive && !disabled && !required && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleClear(e as any);
                }
              }}
              className="p-0.5 rounded-full hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
              title={`Clear ${inlineLabel || 'selection'}`}
            >
              <X size={size === 'sm' ? 12 : 13} />
            </span>
          )}

          <ChevronDown
            size={size === 'sm' ? 13 : 15}
            className={`pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}
          />
        </div>
      </button>

      {/* Custom Dropdown Panel (Portal-rendered to document.body to prevent any underlapping or clipping) */}
      {isOpen && dropdownCoords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
            ...(dropdownCoords.openUpwards
              ? { bottom: `${window.innerHeight - dropdownCoords.top}px` }
              : { top: `${dropdownCoords.top}px` }),
            zIndex: 999999,
          }}
          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 shadow-2xl shadow-slate-900/10 dark:shadow-black/90 backdrop-blur-xl overflow-hidden animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          {isSearchActive && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in options..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-slab text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {isRemoteSearching ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-slab text-slate-500 dark:text-slate-400">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span>Searching...</span>
              </div>
            ) : displayedOptions.length > 0 ? (
              displayedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value ?? '');
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-slab flex items-center justify-between text-left transition-colors cursor-pointer ${isSelected
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{opt.label}</span>
                      {opt.subtitle && (
                        <span className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 ml-2 text-white" />}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 italic">
                No matching options found
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name = '',
  type = 'text',
  searchable = true,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  suggestions = [],
  onRemoteSearch,
  onOptionSearch,
  onSelectDetailed,
  renderSuggestionDetail,
  error,
  helperText,
  rows = 3,
  accept,
  icon,
  labelRightAction,
  className = '',
  size = 'md',
  list,
  inlineLabel,
  clearable,
  onClear,
  inputClassName = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isSm = size === 'sm';
  const normalizedInputClassName = (inputClassName || '').replace(/\brounded-xxl\b/g, 'rounded-2xl');
  const hasCustomRadius = Boolean(normalizedInputClassName && /\brounded(-[\w[\]-]+)?\b/.test(normalizedInputClassName));
  const radiusClass = hasCustomRadius ? '' : 'rounded-md';

  const sizeStyles = isSm
    ? `h-8 px-2.5 text-[11px] leading-tight font-slab placeholder:text-slate-400 dark:placeholder:text-slate-500 ${radiusClass}`
    : type === 'textarea'
      ? `px-3 py-2 text-xs leading-relaxed font-slab placeholder:text-slate-400 dark:placeholder:text-slate-500 ${radiusClass}`
      : `h-9 px-3 text-xs leading-tight font-slab placeholder:text-slate-400 dark:placeholder:text-slate-500 ${radiusClass}`;

  const isFilled = value !== undefined && value !== null && String(value).trim() !== '' && value !== false;

  const stateStyles = error
    ? 'border-red-400 focus:border-red-400 bg-red-50/30 dark:bg-red-950/20 text-slate-900 dark:text-slate-100'
    : isFilled
      ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300/80 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 font-normal focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-400/20'
      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300/80 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-400/20';

  const baseInputStyles = `w-full ${sizeStyles} border ${stateStyles} font-slab focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${normalizedInputClassName}`.trim();

  const renderInput = () => {
    switch (type) {
      case 'password':
        return (
          <div className="relative">
            {icon && <div className={`absolute ${isSm ? 'left-2.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400`}>{icon}</div>}
            <input
              type={showPassword ? 'text' : 'password'}
              name={name}
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={`${baseInputStyles} ${icon ? (isSm ? 'pl-8' : 'pl-10') : ''} ${isSm ? 'pr-8' : 'pr-10'} font-slab text-xs`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute ${isSm ? 'right-2.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer`}
            >
              {showPassword ? <EyeOff size={isSm ? 15 : 18} /> : <Eye size={isSm ? 15 : 18} />}
            </button>
          </div>
        );

      case 'select':
        return (
          <SearchableSelect
            name={name}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            searchable={searchable}
            icon={icon}
            size={size}
            baseInputStyles={baseInputStyles}
            inlineLabel={inlineLabel}
            clearable={clearable}
            onOptionSearch={onOptionSearch}
          />
        );

      case 'autocomplete':
        return (
          <AutocompleteInput
            name={name}
            value={value || ''}
            onChange={onChange}
            suggestions={suggestions}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            icon={icon}
            baseInputStyles={baseInputStyles}
            onRemoteSearch={onRemoteSearch}
            onSelectDetailed={onSelectDetailed}
            renderSuggestionDetail={renderSuggestionDetail}
          />
        );
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`${baseInputStyles} font-slab text-xs`}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                name={name}
                checked={!!value}
                onChange={onChange}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                {value && <Check size={14} className="text-white stroke-[3]" />}
              </div>
            </div>
            {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          </label>
        );

      case 'switch':
        return (
          <label className="flex items-center justify-between cursor-pointer select-none">
            {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
            <div className="relative">
              <input
                type="checkbox"
                name={name}
                checked={!!value}
                onChange={onChange}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors" />
            </div>
          </label>
        );

      case 'file':
        return (
          <FileUploadInput
            label={label}
            name={name}
            value={value}
            onChange={(filePath) => {
              if (onChange) {
                onChange({ target: { name, value: filePath } });
              }
            }}
            accept={accept}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <div className="relative">
            {icon && <div className={`absolute ${isSm ? 'left-2.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}>{icon}</div>}
            <input
              type="date"
              name={name}
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={`${baseInputStyles} ${icon ? (isSm ? 'pl-8' : 'pl-10') : ''} pr-8 font-slab text-xs [color-scheme:light] dark:[color-scheme:dark] cursor-pointer`}
            />
          </div>
        );

      default:
        return (
          <div className="relative">
            {icon && <div className={`absolute ${isSm ? 'left-2.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}>{icon}</div>}
            <input
              type={type}
              name={name}
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              list={list}
              className={`${baseInputStyles} ${icon ? (isSm ? 'pl-8' : 'pl-10') : ''} ${clearable && isFilled && !disabled ? (isSm ? 'pr-8' : 'pr-9') : ''} font-slab text-xs`}
            />
            {clearable && isFilled && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClear) {
                    onClear();
                  } else if (onChange) {
                    onChange({ target: { name: name || '', value: '' } });
                  }
                }}
                className={`absolute ${isSm ? 'right-2' : 'right-2.5'} top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
                title="Clear"
              >
                <X size={isSm ? 12 : 14} />
              </button>
            )}
          </div>
        );
    }
  };

  if (type === 'checkbox') {
    return <div className={`space-y-1 ${className}`}>{renderInput()}</div>;
  }

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {label && type !== 'switch' && type !== 'file' && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {labelRightAction}
        </div>
      )}
      {renderInput()}
      {error ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-red-400 mt-1">
          <AlertCircle size={12} />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormInput;
