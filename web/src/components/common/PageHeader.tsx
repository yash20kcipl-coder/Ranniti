import React from 'react';
import { RefreshCw, Upload, Download, Plus } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;

  // Standard Built-in Action Props
  onAddClick?: () => void;
  addLabel?: string;

  onImportClick?: () => void;
  importLabel?: string;

  onExportClick?: () => void;
  exportLabel?: string;

  onSyncClick?: () => void;
  isSyncing?: boolean;
  syncLabel?: string;

  // Extra/Custom Actions Slot
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  onAddClick,
  addLabel = 'Add Record',
  onImportClick,
  importLabel = 'Import',
  onExportClick,
  exportLabel = 'Export Excel',
  onSyncClick,
  isSyncing = false,
  syncLabel = 'Auto-Sync',
  actions,
  className = '',
}) => {
  const hasActionButtons = onSyncClick || onImportClick || onExportClick || onAddClick || actions;

  return (
    <div
      className={`relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5
        bg-white/95 dark:bg-slate-900/95
        p-4.5 sm:p-5 lg:p-6 rounded-2xl
        border border-slate-200/80 dark:border-slate-800/80
        shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] dark:shadow-none
        backdrop-blur-md transition-all ${className}`}
    >
      {/* Decorative top accent glow edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 dark:via-indigo-400/40 to-transparent" />

      {/* Subtle ambient corner flare */}
      <div className="pointer-events-none absolute -top-14 -left-14 w-44 h-44 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl" />

      {/* Left Column: Icon + Title & Subtitle Info */}
      <div className="relative flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
        {icon && (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl
            bg-gradient-to-br from-indigo-50/90 via-indigo-50/40 to-indigo-100/70
            dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-900/20
            text-indigo-600 dark:text-indigo-400
            border border-indigo-200/70 dark:border-indigo-500/30
            flex items-center justify-center shrink-0
            shadow-xs shadow-indigo-500/10
            ring-4 ring-indigo-50/50 dark:ring-indigo-950/30
            [&>svg]:w-5.5 [&>svg]:h-5.5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 transition-transform">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed mt-1 line-clamp-2 sm:line-clamp-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Built-in & Custom Action Buttons */}
      {hasActionButtons && (
        <div className="relative flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 self-start lg:self-center">
          {/* Built-in Auto-Sync Action */}
          {onSyncClick && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={isSyncing}
              className="group flex items-center gap-2 h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-xl
                bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/90
                text-slate-700 dark:text-slate-200
                font-semibold text-xs
                border border-slate-200 dark:border-slate-700
                shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600
                transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={`text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                  isSyncing ? 'animate-spin text-indigo-600' : ''
                }`}
              />
              <span>{isSyncing ? 'Syncing...' : syncLabel}</span>
            </button>
          )}

          {/* Built-in Import Action */}
          {onImportClick && (
            <button
              type="button"
              onClick={onImportClick}
              className="group flex items-center gap-2 h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-xl
                bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/90
                text-slate-700 dark:text-slate-200
                font-semibold text-xs
                border border-slate-200 dark:border-slate-700
                shadow-2xs hover:shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40
                transition-all cursor-pointer active:scale-[0.98]"
            >
              <Upload
                size={14}
                className="text-indigo-600 dark:text-indigo-400 group-hover:-translate-y-0.5 transition-transform"
              />
              <span>{importLabel}</span>
            </button>
          )}

          {/* Built-in Export Action */}
          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              className="group flex items-center gap-2 h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-xl
                bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20
                text-emerald-700 dark:text-emerald-300
                font-semibold text-xs
                border border-emerald-200/90 dark:border-emerald-500/30
                shadow-2xs hover:shadow-xs
                transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download
                size={14}
                className="text-emerald-600 dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform"
              />
              <span>{exportLabel}</span>
            </button>
          )}

          {/* Built-in Add Action */}
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="group flex items-center gap-2 h-9 sm:h-9.5 px-4 sm:px-4.5 rounded-xl
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white font-semibold text-xs
                shadow-xs shadow-indigo-600/30 hover:shadow-sm hover:shadow-indigo-600/40
                border border-indigo-500/50
                transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            >
              <Plus size={15} className="stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              <span>{addLabel}</span>
            </button>
          )}

          {/* Extra Custom Actions */}
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
