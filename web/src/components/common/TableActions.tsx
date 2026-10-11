import React from 'react';
import { Edit2, Trash2, Eye, type LucideIcon } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActionVariant = 'edit' | 'delete' | 'view' | 'custom';

// Soft tinted style at rest → bold solid on hover. Clean, readable, and premium in both light and dark themes.
const VARIANT_STYLES: Record<ActionVariant, string> = {
  edit: [
    'bg-slate-50 text-indigo-600 border border-slate-200 shadow-2xs',
    'hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xs',
    'dark:bg-slate-800/90 dark:text-indigo-400 dark:border-slate-700',
    'dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white',
  ].join(' '),
  delete: [
    'bg-slate-50 text-rose-600 border border-slate-200 shadow-2xs',
    'hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-xs',
    'dark:bg-slate-800/90 dark:text-rose-400 dark:border-slate-700',
    'dark:hover:bg-rose-600 dark:hover:border-rose-600 dark:hover:text-white',
  ].join(' '),
  view: [
    'bg-slate-50 text-emerald-600 border border-slate-200 shadow-2xs',
    'hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-xs',
    'dark:bg-slate-800/90 dark:text-emerald-400 dark:border-slate-700',
    'dark:hover:bg-emerald-600 dark:hover:border-emerald-600 dark:hover:text-white',
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
        'w-8 h-8 flex items-center justify-center rounded-md',
        'transition-all duration-150 cursor-pointer flex-shrink-0 active:scale-95',
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
