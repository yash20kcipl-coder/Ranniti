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
        bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50
        dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950
        p-6 rounded-2xl
        border border-indigo-100/80 dark:border-white/10
        shadow-lg shadow-indigo-100/60 dark:shadow-2xl dark:shadow-indigo-950/40
        backdrop-blur-xl transition-all overflow-hidden ${className}`}
    >
      {/* Light mode: soft indigo shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-200/20 via-transparent to-violet-200/25 dark:from-indigo-500/5 dark:to-purple-500/8" />
      {/* Top accent line */}
      <div className="pointer-events-none absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-indigo-300/60 dark:via-indigo-400/40 to-transparent" />

      <div className="relative flex items-center gap-3.5">
        {icon && (
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/25 flex-shrink-0 shadow-sm dark:shadow-inner dark:shadow-indigo-900/30">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {hasActionButtons && (
        <div className="relative flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Built-in Auto-Sync Action */}
          {onSyncClick && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25
                text-indigo-700 dark:text-indigo-300
                font-semibold text-xs
                border border-indigo-200 dark:border-indigo-500/30
                shadow-sm dark:shadow-none
                transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={`text-indigo-500 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : syncLabel}</span>
            </button>
          )}

          {/* Built-in Import Action */}
          {onImportClick && (
            <button
              type="button"
              onClick={onImportClick}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                bg-violet-100 hover:bg-violet-200 dark:bg-violet-500/15 dark:hover:bg-violet-500/25
                text-violet-700 dark:text-violet-300
                font-semibold text-xs
                border border-violet-200 dark:border-violet-500/30
                shadow-sm dark:shadow-none
                transition-all cursor-pointer"
            >
              <Upload size={14} className="text-violet-500 dark:text-violet-400" />
              <span>{importLabel}</span>
            </button>
          )}

          {/* Built-in Export Action */}
          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25
                text-emerald-700 dark:text-emerald-300
                font-semibold text-xs
                border border-emerald-200 dark:border-emerald-500/30
                shadow-sm dark:shadow-none
                transition-all cursor-pointer"
            >
              <Download size={14} className="text-emerald-500 dark:text-emerald-400" />
              <span>{exportLabel}</span>
            </button>
          )}

          {/* Built-in Add Action */}
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-indigo-500 to-purple-600
                hover:from-indigo-400 hover:to-purple-500
                text-white font-semibold text-xs
                shadow-md shadow-indigo-400/30 dark:shadow-indigo-500/30
                hover:shadow-lg hover:shadow-indigo-400/40 dark:hover:shadow-indigo-500/50
                transition-all cursor-pointer whitespace-nowrap
                border border-indigo-400/30"
            >
              <Plus size={16} />
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
