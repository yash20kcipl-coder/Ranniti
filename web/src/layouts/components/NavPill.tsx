import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200 ease-out cursor-pointer active:scale-95 ${isActive
              ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs ring-2 ring-indigo-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
          >
            {Icon && (
              <Icon
                size={19}
                className={`transition-all duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'group-hover:scale-105'
                  }`}
              />
            )}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200 ease-out cursor-pointer active:scale-95 ${isActive
              ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs ring-2 ring-indigo-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
          >
            {Icon && (
              <Icon
                size={19}
                className={`transition-all duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'group-hover:scale-105'
                  }`}
              />
            )}
          </button>
        )}

        {/* Floating Flyout Menu for items with children */}
        {children ? (
          <div
            className={`hidden lg:block absolute left-full top-0 ml-3 w-64 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl p-3 z-50 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${showFlyout
              ? 'opacity-100 visible translate-x-0 scale-100'
              : 'opacity-0 invisible -translate-x-2 scale-95 pointer-events-none'
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
          <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/60 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
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
    ? `relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ease-out cursor-pointer active:scale-[0.985] ${isActive
      ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:translate-x-0.5'
    }`
    : `relative w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ease-out cursor-pointer active:scale-[0.985] ${isActive
      ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/70 dark:border-indigo-500/30 shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent hover:translate-x-0.5'
    }`;

  const badgeDefaultClasses = isActive
    ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

  const innerContent = (
    <>
      {/* Fluid Active Vertical Indicator Bar */}
      {!isSubPill && (
        <span
          aria-hidden="true"
          className={`absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive
            ? 'opacity-100 scale-y-100 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            : 'opacity-0 scale-y-0 pointer-events-none'
            }`}
        />
      )}
      {isSubPill && (
        <span
          aria-hidden="true"
          className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive
            ? 'opacity-100 scale-y-100 shadow-[0_0_6px_rgba(99,102,241,0.4)]'
            : 'opacity-0 scale-y-0 pointer-events-none'
            }`}
        />
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <Icon
            size={isSubPill ? 14 : 17}
            className={`shrink-0 transition-all duration-200 ease-out ${isActive
              ? 'text-indigo-600 dark:text-indigo-400 scale-105'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-hover:scale-105'
              }`}
          />
        )}
        <span className="text-[11px] truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {badge !== undefined && badge !== null && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all duration-200 ease-out ${badgeClassName || badgeDefaultClasses
              } ${isActive ? 'scale-105' : ''}`}
          >
            {badge}
          </span>
        )}

        {hasSubmenu && (
          <button
            type="button"
            aria-label="Toggle submenu"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onToggleSubmenu) {
                onToggleSubmenu(e);
              } else {
                onClick?.();
              }
            }}
            className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0 cursor-pointer"
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSubmenuOpen
                  ? 'rotate-90 text-indigo-600 dark:text-indigo-400'
                  : isActive
                    ? 'rotate-0 text-indigo-600 dark:text-indigo-400'
                    : 'rotate-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}
            />
          </button>
        )}
      </div>
    </>
  );

  const handleClick = () => {
    onClick?.();
  };

  return (
    <div className={`w-full group ${className}`}>
      {to ? (
        <Link
          to={to}
          onClick={handleClick}
          aria-current={isActive ? 'page' : undefined}
          className={baseClasses}
        >
          {innerContent}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={baseClasses}
        >
          {innerContent}
        </button>
      )}

      {/* Accordion / Nested Sub-items with ultra-smooth CSS grid height animation */}
      {children && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${!hasSubmenu || isSubmenuOpen
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
        >
          <div className="overflow-hidden">
            <div className="ml-3.5 pl-2.5 border-l-2 border-slate-200/90 dark:border-slate-800/90 space-y-0.5 my-1 pt-0.5 transition-colors duration-200">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavPill;
