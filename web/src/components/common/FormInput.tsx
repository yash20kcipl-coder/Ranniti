import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileUploadInput } from './FileUploadInput';
import { Eye, EyeOff, Check, AlertCircle, ChevronDown, Search, X } from 'lucide-react';

export interface Option {
  label: string;
  value: string | number;
}

export interface FormInputProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select' | 'multiselect' | 'textarea' | 'file' | 'checkbox' | 'switch' | 'date' | 'autocomplete';
  searchable?: boolean;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Option[];
  /** Suggestion strings for type="autocomplete" free-text inputs */
  suggestions?: string[];
  error?: string;
  helperText?: string;
  rows?: number;
  accept?: string;
  icon?: React.ReactNode;
  labelRightAction?: React.ReactNode;
  className?: string;
  /** @deprecated use type="autocomplete" + suggestions instead */
  list?: string;
}

interface SearchableSelectProps {
  name: string;
  value?: any;
  onChange?: (e: { target: { name: string; value: any } }) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  baseInputStyles: string;
}

interface AutocompleteInputProps {
  name: string;
  value?: string;
  onChange?: (e: { target: { name: string; value: any } }) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  baseInputStyles: string;
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number; openUpwards: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 20);
    const term = value.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(term)).slice(0, 20);
  }, [suggestions, value]);

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
    onChange?.({ target: { name, value: e.target.value } });
    setIsOpen(true);
  };

  const handleSelect = (suggestion: string) => {
    onChange?.({ target: { name, value: suggestion } });
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && filtered.length > 0;

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
        className={`${baseInputStyles} ${icon ? 'pl-10' : ''}`}
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
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => handleSelect(s)}
                className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer flex items-center gap-2 ${s.toLowerCase() === value.toLowerCase()
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
              >
                <span className="truncate">{s}</span>
                {s.toLowerCase() === value.toLowerCase() && <Check size={12} className="shrink-0 text-white ml-auto" />}
              </button>
            ))}
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
  baseInputStyles,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

    setDropdownCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
      openUpwards,
    });
  }, []);

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

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      String(opt.value).toLowerCase().includes(term)
    );
  });

  const handleSelect = (optValue: string | number) => {
    onChange?.({ target: { name, value: optValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const isSearchActive = searchable && options.length > 5;

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
        className={`${baseInputStyles} ${icon ? 'pl-10' : ''} pr-10 text-left text-sm transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''
          }`}
      >
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}

        <span className={`block truncate ${selectedOption && selectedOption.value !== '' ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${isOpen
            ? 'rotate-180 text-indigo-500'
            : selectedOption && selectedOption.value !== ''
              ? 'text-indigo-500/80 dark:text-indigo-400'
              : 'text-slate-400'
            }`}
        />
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
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value ?? '');
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <span className="truncate">{opt.label}</span>
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
  name,
  type = 'text',
  searchable = true,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  suggestions = [],
  error,
  helperText,
  rows = 3,
  accept,
  icon,
  labelRightAction,
  className = '',
  list,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const hasValue =
    value !== undefined &&
    value !== null &&
    value !== '' &&
    value !== 'null' &&
    value !== 'undefined' &&
    !(Array.isArray(value) && value.length === 0);

  const baseInputStyles = `w-full px-4 py-2.5 rounded-xl border ${error
    ? 'border-red-500/80 focus:border-red-500 bg-red-50/30 dark:bg-red-950/20'
    : hasValue
      ? 'bg-white dark:bg-slate-900 border-indigo-400/80 dark:border-indigo-600/80 text-slate-900 dark:text-slate-100 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
    } text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`;

  const renderInput = () => {
    switch (type) {
      case 'password':
        return (
          <div className="relative">
            {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
            <input
              type={showPassword ? 'text' : 'password'}
              name={name}
              value={value || ''}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={`${baseInputStyles} ${icon ? 'pl-10' : ''} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            baseInputStyles={baseInputStyles}
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
          />
        );
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputStyles}
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

      default:
        return (
          <div className="relative">
            {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
            <input
              type={type}
              name={name}
              value={value || ''}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              list={list}
              className={`${baseInputStyles} ${icon ? 'pl-10' : ''}`}
            />
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
