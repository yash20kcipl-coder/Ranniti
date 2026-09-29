import { FormInput } from './FormInput';
import { createPortal } from 'react-dom';
import type { Option } from './FormInput';
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, RotateCcw, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export interface FilterPreset {
  label: string;
  icon?: React.ReactNode;
  apply: () => void;
  active?: boolean;
}

export interface FilterField {
  key: string;
  label: string;
  type?: 'select' | 'text' | 'date' | 'pills' | 'notice';
  category?: string;
  categoryIcon?: React.ReactNode;
  gridSpan?: 1 | 2; // 1 = half width (1 col in 2-col grid), 2 = full width (2 cols)
  value: any;
  onChange: (value: any) => void;
  options?: Option[];
  placeholder?: string;
  isPrimary?: boolean; // If true, displayed inline on wider screens
  disabled?: boolean;
  helperText?: string;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: FilterField[];
  presets?: FilterPreset[];
  onReset?: () => void;
  extraActions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  filters = [],
  presets = [],
  onReset,
  extraActions,
  className = '',
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Calculate active filter count (excluding empty values)
  const activeFilters = filters.filter(
    (f) => f.value !== '' && f.value !== null && f.value !== undefined
  );
  const activeFiltersCount = activeFilters.length;

  // Primary filters shown inline
  const primaryFilters = filters.filter((f) => f.isPrimary);
  const totalFiltersCount = filters.length;

  // Group filters by category
  const categoriesMap = new Map<string, { icon?: React.ReactNode; fields: FilterField[] }>();

  filters.forEach((field) => {
    const catName = field.category || 'General Filters';
    if (!categoriesMap.has(catName)) {
      categoriesMap.set(catName, { icon: field.categoryIcon, fields: [] });
    }
    categoriesMap.get(catName)!.fields.push(field);
  });

  const categories = Array.from(categoriesMap.entries()).map(([name, data]) => ({
    name,
    icon: data.icon,
    fields: data.fields,
    activeCount: data.fields.filter(
      (f) => f.value !== '' && f.value !== null && f.value !== undefined
    ).length,
  }));

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isDrawerOpen]);

  // Helper to format filter value label for tag cloud
  const getFilterDisplayValue = (field: FilterField) => {
    if (field.options && field.options.length > 0) {
      const match = field.options.find((opt) => String(opt.value) === String(field.value));
      if (match) return match.label;
    }
    return String(field.value);
  };

  // Render Pill Segmented Option Group
  const renderPillControl = (field: FilterField) => {
    const options = field.options || [];
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
          {field.label}
        </label>
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {options.map((opt) => {
            const isSelected = String(field.value ?? '') === String(opt.value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => field.onChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Side Filter Drawer Portal
  const renderDrawer = () => {
    if (!isDrawerOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex justify-end">
        {/* Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fadeIn"
          onClick={() => setIsDrawerOpen(false)}
        />

        {/* Drawer Panel */}
        <div className="relative w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-slideLeft">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-xs">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Filter &amp; Refine</h3>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold">
                      {activeFiltersCount} active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Categorized parameters to pinpoint voter records</p>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-slate-900">
            {/* Quick Presets Section */}
            {presets.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Quick Filter Shortcuts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => preset.apply()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        preset.active
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-indigo-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-white'
                      }`}
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Filter Accordions */}
            {categories.map((category) => {
              const isCollapsed = !!collapsedCategories[category.name];

              return (
                <div
                  key={category.name}
                  className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-all shadow-sm ${
                    isCollapsed ? 'overflow-hidden' : 'overflow-visible'
                  }`}
                >
                  {/* Category Header Bar */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 transition-colors text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {category.icon && <span className="text-indigo-600 dark:text-indigo-400">{category.icon}</span>}
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{category.name}</span>
                      {category.activeCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-bold">
                          {category.activeCount}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Category Content Grid */}
                  {!isCollapsed && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60">
                      {category.fields.map((field) => {
                        const isFullWidth = field.gridSpan === 2 || field.type === 'pills' || field.type === 'notice';

                        return (
                          <div
                            key={field.key}
                            className={isFullWidth ? 'sm:col-span-2' : 'sm:col-span-1'}
                          >
                            {field.type === 'notice' ? (
                              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs flex items-center gap-2.5">
                                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                <span className="leading-relaxed">{field.label}</span>
                              </div>
                            ) : field.type === 'pills' ? (
                              renderPillControl(field)
                            ) : (
                              <FormInput
                                name={field.key}
                                label={field.label}
                                type={(field.type as any) || 'select'}
                                value={field.value}
                                onChange={(e) => field.onChange((e.target as any)?.value ?? e)}
                                options={field.options || []}
                                placeholder={field.placeholder || `Select ${field.label}`}
                                disabled={field.disabled}
                                helperText={field.helperText}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                Apply Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-3 ${className}`}>
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Field */}
        {onSearchChange && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <FormInput
              name="filter_search"
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange((e.target as any)?.value ?? e)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        )}

        {/* Inline Primary Filters + Drawer Trigger */}
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 flex-1">
          {primaryFilters.slice(0, 2).map((field) => (
            <div key={field.key} className="w-full sm:w-44 flex-shrink-0">
              <FormInput
                name={field.key}
                type={field.type === 'pills' || field.type === 'notice' ? 'select' : (field.type || 'select')}
                value={field.value}
                onChange={(e) => field.onChange((e.target as any)?.value ?? e)}
                options={field.options || []}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {/* Side Drawer Toggle Button */}
          {totalFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>All Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/30 text-white text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {/* Reset Filters */}
          {onReset && activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Active Filter Chips / Tags Cloud */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mr-1">
            Active Filters ({activeFiltersCount}):
          </span>
          {activeFilters.map((field) => (
            <div
              key={field.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
            >
              <span>{field.label}:</span>
              <span className="font-bold text-indigo-900 dark:text-white">{getFilterDisplayValue(field)}</span>
              <button
                type="button"
                onClick={() => field.onChange('')}
                className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white transition-colors cursor-pointer"
                title={`Clear ${field.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {renderDrawer()}
    </div>
  );
};

export default FilterBar;
