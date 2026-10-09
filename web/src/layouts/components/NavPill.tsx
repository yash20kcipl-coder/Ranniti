import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface NavPillProps {
  /** Navigation destination URL. If omitted, behaves as a button. */
  to?: string;
  /** Click handler (e.g. for sub-menu toggles, mobile drawer close, logout). */
  onClick?: () => void;
  /** Display label for the item. */
  label: string;
  /** Lucide or React icon component. */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Active highlight status. */
  isActive?: boolean;
  /** Sidebar collapse state. When true, collapses to an icon pill with hover tooltip/flyout. */
  isCollapsed?: boolean;
  /** Optional badge count or pill text. */
  badge?: string | number | null;
  /** Optional badge style override class. */
  badgeClassName?: string;
  /** Whether the item controls an accordion or submenu. */
  hasSubmenu?: boolean;
  /** Whether the submenu is currently open/expanded. */
  isSubmenuOpen?: boolean;
  /** Callback fired when submenu toggle chevron is clicked. */
  onToggleSubmenu?: (e: React.MouseEvent) => void;
  /** Additional container classes. */
  className?: string;
  /** Visual variant: 'default' for primary nav pill, 'sub-pill' for nested child pills. */
  variant?: 'default' | 'sub-pill';
  /** Nested sub-items rendered when expanded or in collapsed flyout. */
  children?: React.ReactNode;
}

export const NavPill: React.FC<NavPillProps> = ({
  to,
  onClick,
  label,
  icon: Icon,
  isActive = false,
  isCollapsed = false,
  badge,
  badgeClassName,
  hasSubmenu = false,
  isSubmenuOpen = false,
  onToggleSubmenu,
  className = '',
  variant = 'default',
  children,
}) => {
  const isSubPill = variant === 'sub-pill';
  const [showFlyout, setShowFlyout] = useState(false);

  // ── COLLAPSED DESKTOP PILL ──────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <div
        className={`relative group flex justify-center w-full ${className}`}
        onMouseEnter={() => setShowFlyout(true)}
        onMouseLeave={() => setShowFlyout(false)}
      >
        {to ? (
          <Link
            to={to}
            onClick={onClick}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs ring-2 ring-indigo-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
            }`}
          >
            {Icon && <Icon size={19} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs ring-2 ring-indigo-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
            }`}
          >
            {Icon && <Icon size={19} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />}
          </button>
        )}

        {/* If the item has children, render an interactive flyout menu; otherwise render a simple tooltip */}
        {children ? (
          <div
            className={`hidden lg:block absolute left-full top-0 ml-3 w-64 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl p-3 z-50 transition-all duration-150 ${
              showFlyout ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-1 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {Icon && <Icon size={15} className="text-indigo-600 dark:text-indigo-400" />}
                <span className="text-xs font-bold text-slate-900 dark:text-white">{label}</span>
              </div>
              {badge !== undefined && badge !== null && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-1.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-500/30">
                  {badge}
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1 pr-1 overscroll-contain">
              {children}
            </div>
          </div>
        ) : (
          <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/60 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-2 animate-in fade-in zoom-in-95 duration-100">
            <span>{label}</span>
            {badge !== undefined && badge !== null && (
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/60 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── EXPANDED PILL STYLES ────────────────────────────────────────────────────
  const baseClasses = isSubPill
    ? `w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
        isActive
          ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-500/30 shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
      }`
    : `relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
        isActive
          ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/70 dark:border-indigo-500/30 shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent'
      }`;

  const iconClasses = isSubPill
    ? `shrink-0 ${
        isActive
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-slate-400 dark:text-slate-500'
      }`
    : `shrink-0 ${
        isActive
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
      }`;

  const badgeDefaultClasses = isActive
    ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-200 border border-indigo-300/60 dark:border-indigo-500/40'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60';

  const innerContent = (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        {!isSubPill && isActive && (
          <span className="w-1 h-4 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 shadow-xs shadow-indigo-600/40" />
        )}
        {Icon && (
          <Icon
            size={isSubPill ? 14 : 17}
            className={iconClasses}
          />
        )}
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {badge !== undefined && badge !== null && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              badgeClassName || badgeDefaultClasses
            }`}
          >
            {badge}
          </span>
        )}

        {hasSubmenu && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSubmenu?.(e);
            }}
            aria-label={`Toggle ${label} sub-items`}
            className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-md transition-colors"
          >
            {isSubmenuOpen ? (
              <ChevronDown size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            ) : (
              <ChevronRight size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className={`w-full group ${className}`}>
      {to ? (
        <Link
          to={to}
          onClick={onClick}
          aria-current={isActive ? 'page' : undefined}
          className={baseClasses}
        >
          {innerContent}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={baseClasses}
        >
          {innerContent}
        </button>
      )}

      {/* Accordion / Nested Sub-items */}
      {children && (!hasSubmenu || isSubmenuOpen) && (
        <div className="ml-3 pl-3 border-l border-slate-200/80 dark:border-slate-800/80 space-y-1 py-1 mt-1 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

export default NavPill;
