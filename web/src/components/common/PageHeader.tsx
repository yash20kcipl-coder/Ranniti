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
      className={`relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4
        bg-white/95 dark:bg-slate-900/95
        p-5 rounded-lg
        border border-slate-200/90 dark:border-slate-800/90
        shadow-xs dark:shadow-none
        backdrop-blur-md transition-all ${className}`}
    >
      {/* Subtle top tactical accent line */}
      <div className="pointer-events-none absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/30 to-transparent" />

      <div className="relative flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="w-11 h-11 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 flex items-center justify-center shrink-0 shadow-2xs">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-slab text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-normal line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {hasActionButtons && (
        <div className="relative flex flex-wrap items-center gap-2 shrink-0">
          {/* Built-in Auto-Sync Action */}
          {onSyncClick && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md
                bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80
                text-slate-700 dark:text-slate-200
                font-semibold text-xs
                border border-slate-200 dark:border-slate-700
                shadow-2xs
                transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw size={13} className={`text-slate-500 dark:text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : syncLabel}</span>
            </button>
          )}

          {/* Built-in Import Action */}
          {onImportClick && (
            <button
              type="button"
              onClick={onImportClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md
                bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80
                text-slate-700 dark:text-slate-200
                font-semibold text-xs
                border border-slate-300 dark:border-slate-700
                shadow-2xs
                transition-all cursor-pointer active:scale-[0.98]"
            >
              <Upload size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{importLabel}</span>
            </button>
          )}

          {/* Built-in Export Action */}
          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md
                bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20
                text-emerald-700 dark:text-emerald-300
                font-semibold text-xs
                border border-emerald-200/90 dark:border-emerald-500/30
                shadow-2xs
                transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{exportLabel}</span>
            </button>
          )}

          {/* Built-in Add Action */}
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md
                bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500
                text-white font-semibold text-xs
                shadow-xs shadow-indigo-600/30
                border border-indigo-500/40
                transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            >
              <Plus size={14} className="stroke-[2.5]" />
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
