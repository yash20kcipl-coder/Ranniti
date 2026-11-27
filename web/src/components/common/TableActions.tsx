import React from 'react';
import { Edit2, Trash2, Eye, type LucideIcon } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActionVariant = 'edit' | 'delete' | 'view' | 'custom';

// Button styles matching VoterRowActions:
// At rest: slate-50/80 background, subtle slate-200/70 border, shadow-2xs, with vibrant variant text color.
// On hover: bold solid brand color with white icon.
const VARIANT_STYLES: Record<ActionVariant, string> = {
  edit: [
    'bg-slate-50/80 text-indigo-600 border border-slate-200/70 shadow-2xs',
    'hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xs',
    'dark:bg-slate-800/60 dark:text-indigo-400 dark:border-slate-700/60',
    'dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white',
  ].join(' '),
  delete: [
    'bg-slate-50/80 text-rose-600 border border-slate-200/70 shadow-2xs',
    'hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-xs',
    'dark:bg-slate-800/60 dark:text-rose-400 dark:border-slate-700/60',
    'dark:hover:bg-rose-600 dark:hover:border-rose-600 dark:hover:text-white',
  ].join(' '),
  view: [
    'bg-slate-50/80 text-emerald-600 border border-slate-200/70 shadow-2xs',
    'hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-xs',
    'dark:bg-slate-800/60 dark:text-emerald-400 dark:border-slate-700/60',
    'dark:hover:bg-emerald-600 dark:hover:border-emerald-600 dark:hover:text-white',
  ].join(' '),
  custom: [
    'bg-slate-50/80 text-slate-500 border border-slate-200/70 shadow-2xs',
    'hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300',
    'dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60',
    'dark:hover:bg-slate-700 dark:hover:text-slate-200',
  ].join(' '),
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
  compact?: boolean;
}

export const TableActionButton: React.FC<TableActionButtonProps> = ({
  variant,
  onClick,
  icon,
  title,
  className = '',
  disabled = false,
  iconSize,
  compact = true,
}) => {
  const Icon = icon ?? VARIANT_ICONS[variant];
  const resolvedTitle = title ?? VARIANT_TITLES[variant] ?? '';
  const variantClass = VARIANT_STYLES[variant];
  const resolvedIconSize = iconSize ?? (compact ? 13 : 14);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={resolvedTitle}
      className={[
        compact ? 'w-7 h-7' : 'w-8 h-8',
        'rounded-md flex items-center justify-center',
        'transition-all duration-150 cursor-pointer flex-shrink-0 active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass,
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={resolvedIconSize} />}
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
  compact?: boolean;
}

export const TableActions: React.FC<TableActionsProps> = ({
  onEdit,
  onDelete,
  onView,
  extra,
  className = '',
  compact = true,
}) => (
  <div className={`flex items-center justify-end gap-1 ${className}`}>
    {onView && <TableActionButton compact={compact} variant="view" onClick={onView} />}
    {onEdit && <TableActionButton compact={compact} variant="edit" onClick={onEdit} />}
    {onDelete && <TableActionButton compact={compact} variant="delete" onClick={onDelete} />}
    {extra}
  </div>
);

export default TableActions;
