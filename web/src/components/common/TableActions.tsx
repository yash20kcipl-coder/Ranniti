import React from 'react';
import { Edit2, Trash2, Eye, type LucideIcon } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActionVariant = 'edit' | 'delete' | 'view' | 'custom';

// Soft tinted style at rest → bold solid on hover. Clean, readable, and premium in both light and dark themes.
const VARIANT_STYLES: Record<ActionVariant, string> = {
  edit: [
    'bg-indigo-50/90 text-indigo-600 border border-indigo-200/90 shadow-xs',
    'hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-sm',
    'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'dark:hover:bg-indigo-500/80 dark:hover:border-indigo-500 dark:hover:text-white',
  ].join(' '),
  delete: [
    'bg-red-50/90 text-red-600 border border-red-200/90 shadow-xs',
    'hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-sm',
    'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'dark:hover:bg-red-500/80 dark:hover:border-red-500 dark:hover:text-white',
  ].join(' '),
  view: [
    'bg-emerald-50/90 text-emerald-600 border border-emerald-200/90 shadow-xs',
    'hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-sm',
    'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'dark:hover:bg-emerald-500/80 dark:hover:border-emerald-500 dark:hover:text-white',
  ].join(' '),
  custom: '',
};

const VARIANT_ICONS: Partial<Record<ActionVariant, LucideIcon>> = {
  edit: Edit2,
  delete: Trash2,
  view: Eye,
};

const VARIANT_TITLES: Partial<Record<ActionVariant, string>> = {
  edit: 'Edit Record',
  delete: 'Delete Record',
  view: 'View Record',
};

// ─── Single Action Button ────────────────────────────────────────────────────

export interface TableActionButtonProps {
  variant: ActionVariant;
  onClick: () => void;
  icon?: LucideIcon;
  title?: string;
  className?: string;
  disabled?: boolean;
  iconSize?: number;
}

export const TableActionButton: React.FC<TableActionButtonProps> = ({
  variant,
  onClick,
  icon,
  title,
  className = '',
  disabled = false,
  iconSize = 14,
}) => {
  const Icon = icon ?? VARIANT_ICONS[variant];
  const resolvedTitle = title ?? VARIANT_TITLES[variant] ?? '';
  const variantClass = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={resolvedTitle}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-lg',
        'transition-all duration-150 cursor-pointer flex-shrink-0',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass,
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={iconSize} strokeWidth={2} />}
    </button>
  );
};

// ─── Action Group ────────────────────────────────────────────────────────────

export interface TableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  /** Inject extra buttons after the standard ones */
  extra?: React.ReactNode;
  className?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({
  onEdit,
  onDelete,
  onView,
  extra,
  className = '',
}) => (
  <div className={`flex items-center justify-end gap-1.5 ${className}`}>
    {onView && <TableActionButton variant="view" onClick={onView} />}
    {onEdit && <TableActionButton variant="edit" onClick={onEdit} />}
    {onDelete && <TableActionButton variant="delete" onClick={onDelete} />}
    {extra}
  </div>
);

export default TableActions;
