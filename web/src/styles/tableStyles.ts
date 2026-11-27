/**
 * Ranniti Design System — Table Typography & Styles Single Source of Truth
 *
 * Centralized design tokens and utility class mappings for all data tables across Ranniti.
 * Modifying values here immediately cascades to all tables in the application.
 */

export const TABLE_STYLES = {
  // Table Header (<th>)
  header: 'text-[10px] font-bold tracking-wider text-slate-200 uppercase',
  headerCell: 'px-4 py-3.5 text-[10px] font-bold tracking-wider text-slate-200 uppercase',

  // Table Data Cell (<td>)
  cell: 'px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium text-[10.5px] leading-tight',
  cellPadding: 'px-4 py-2.5',

  // Table Row (<tr>)
  row: 'transition-colors group',
  rowBordered: 'border-b border-slate-200/90 dark:border-slate-800/80 transition-colors group',

  // Primary Text (Names, Main Titles, Primary Labels)
  primary: 'text-[10.5px] font-semibold text-slate-900 dark:text-slate-100 leading-tight',

  // Secondary Text (Subtitles, District/State subtext, Descriptions)
  secondary: 'text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight',

  // Monospace Numbers, Codes, and IDs
  mono: 'text-[9.5px] font-mono font-medium text-slate-700 dark:text-slate-300',
  monoPrimary: 'text-[9.5px] font-mono font-bold text-slate-900 dark:text-slate-100',
  monoMuted: 'text-[9.5px] font-mono text-slate-500 dark:text-slate-400',
  monoAccent: 'text-[9.5px] font-mono font-medium text-indigo-600 dark:text-indigo-400',

  // Badge Chips / Status Pills Base
  badgeBase: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-semibold border',

  // Badge Color Variants
  badge: {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    danger: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60',
  },
} as const;

export type TableBadgeVariant = keyof typeof TABLE_STYLES.badge;

/**
 * Returns the composite class string for a standardized table badge chip.
 */
export function getTableBadgeClass(variant: TableBadgeVariant = 'neutral', extraClasses = ''): string {
  const variantClass = TABLE_STYLES.badge[variant] || TABLE_STYLES.badge.neutral;
  return `${TABLE_STYLES.badgeBase} ${variantClass} ${extraClasses}`.trim();
}
