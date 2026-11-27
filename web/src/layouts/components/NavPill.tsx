import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  /** Whether the submenu is currently open/expanded on mobile. */
  isSubmenuOpen?: boolean;
  /** Callback fired when submenu toggle chevron is clicked. */
  onToggleSubmenu?: (e: React.MouseEvent) => void;
  /** Additional container classes. */
  className?: string;
  /** Visual variant: 'default' for primary nav pill, 'sub-pill' for nested child pills. */
  variant?: 'default' | 'sub-pill';
  /** Nested sub-items rendered when opened as a tooltip flyout or mobile drawer. */
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
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const flyoutRef = useRef<HTMLDivElement | null>(null);

  // ── TOOLTIP / FLYOUT STATE & POSITIONING ──────────────────────────────────
  const [isFlyoutMounted, setIsFlyoutMounted] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [flyoutCoords, setFlyoutCoords] = useState<{ top: number; left: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Single-item label tooltip (for collapsed sidebar items without children)
  const [isSingleMounted, setIsSingleMounted] = useState(false);
  const [isSingleVisible, setIsSingleVisible] = useState(false);
  const [singleTooltipCoords, setSingleTooltipCoords] = useState<{ top: number; left: number } | null>(null);
  const singleUnmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute fixed viewport coordinates next to the trigger button
  const computeCoords = useCallback(() => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = rect.right + 10;
    // Estimated tooltip height: clamp so it never overflows bottom of viewport
    const maxTop = window.innerHeight - 380;
    const top = Math.max(12, Math.min(rect.top - 4, maxTop));
    return { top, left };
  }, []);

  const openFlyout = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
    const coords = computeCoords();
    if (coords) {
      setFlyoutCoords(coords);
      setIsFlyoutMounted(true);
      // Double RAF ensures portal node is rendered with initial closed styles before transitioning in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsFlyoutVisible(true);
        });
      });
    }
  }, [computeCoords]);

  const closeFlyout = useCallback((delay = 180) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setIsFlyoutVisible(false);
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
      }
      unmountTimerRef.current = setTimeout(() => {
        setIsFlyoutMounted(false);
      }, 200);
    }, delay);
  }, []);

  const closeFlyoutImmediately = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsFlyoutVisible(false);
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
    }
    unmountTimerRef.current = setTimeout(() => {
      setIsFlyoutMounted(false);
    }, 200);
  }, []);

  const handleTriggerMouseEnter = () => {
    if (children) {
      openFlyout();
    } else if (isCollapsed) {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setSingleTooltipCoords({
        left: rect.right + 10,
        top: rect.top + (rect.height / 2) - 14,
      });
      setIsSingleMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsSingleVisible(true);
        });
      });
    }
  };

  const handleTriggerMouseLeave = () => {
    if (children) {
      closeFlyout(180);
    } else if (isCollapsed) {
      setIsSingleVisible(false);
      if (singleUnmountTimerRef.current) {
        clearTimeout(singleUnmountTimerRef.current);
      }
      singleUnmountTimerRef.current = setTimeout(() => {
        setIsSingleMounted(false);
      }, 150);
    }
  };

  const handleFlyoutMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    closeFlyout(180);
  };

  // Close flyout on outside click, window resize, or scroll
  useEffect(() => {
    if (!isFlyoutMounted) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        flyoutRef.current &&
        !flyoutRef.current.contains(target)
      ) {
        closeFlyoutImmediately();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFlyoutImmediately();
      }
    };

    const handleWindowChange = () => {
      closeFlyoutImmediately();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isFlyoutMounted, closeFlyoutImmediately]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
      if (singleUnmountTimerRef.current) clearTimeout(singleUnmountTimerRef.current);
    };
  }, []);

  // ── COLLAPSED DESKTOP PILL ──────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <div
        ref={triggerRef}
        className={`relative group flex justify-center w-full ${className}`}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
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
            onClick={() => {
              if (children) {
                openFlyout();
              }
              onClick?.();
            }}
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

        {/* Portal-based Floating Sub-Tabs Tooltip for items with children */}
        {children && isFlyoutMounted && flyoutCoords && createPortal(
          <div
            ref={flyoutRef}
            style={{
              zIndex: 99999,
              position: 'fixed',
              top: `${flyoutCoords.top}px`,
              left: `${flyoutCoords.left}px`,
            }}
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
            className={`hidden lg:block w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl shadow-indigo-950/15 dark:shadow-black/70 ring-1 ring-slate-900/5 dark:ring-white/10 p-2.5 origin-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-[''] ${isFlyoutVisible
              ? 'opacity-100 scale-100 translate-x-0'
              : 'opacity-0 scale-[0.96] -translate-x-2 pointer-events-none'
              }`}
          >
            <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                {Icon && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Icon size={14} />
                  </div>
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {label}
                </span>
              </div>
              {badge !== undefined && badge !== null && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-1.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-500/30 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            <div
              className="max-h-80 overflow-y-auto space-y-0.5 pr-1 overscroll-contain no-scrollbar"
              onClick={closeFlyoutImmediately}
            >
              {children}
            </div>
          </div>,
          document.body
        )}

        {/* Portal-based Single Item Tooltip for collapsed items without children */}
        {!children && isSingleMounted && singleTooltipCoords && createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${singleTooltipCoords.left}px`,
              top: `${singleTooltipCoords.top}px`,
              zIndex: 99999,
            }}
            className={`hidden lg:flex px-2.5 py-1.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/60 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none items-center gap-2 origin-left transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSingleVisible
              ? 'opacity-100 scale-100 translate-x-0'
              : 'opacity-0 scale-95 -translate-x-2'
              }`}
          >
            <span>{label}</span>
            {badge !== undefined && badge !== null && (
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/60 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                {badge}
              </span>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ── EXPANDED PILL STYLES ────────────────────────────────────────────────────
  const baseClasses = isSubPill
    ? `relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer active:scale-[0.985] ${isActive
      ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:translate-x-1'
    }`
    : `relative w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer active:scale-[0.985] ${isActive
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
          <span
            role="button"
            tabIndex={0}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleSubmenu) {
                  onToggleSubmenu(e as any);
                } else {
                  onClick?.();
                }
              }
            }}
            className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0 cursor-pointer"
          >
            <ChevronRight
              size={14}
              className={`transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSubmenuOpen
                ? 'lg:rotate-0 rotate-90 text-indigo-600 dark:text-indigo-400'
                : isFlyoutVisible
                  ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5 scale-110'
                  : isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5'
                }`}
            />
          </span>
        )}
      </div>
    </>
  );

  const handleClick = () => {
    if (children) {
      openFlyout();
    }
    onClick?.();
  };

  return (
    <div
      ref={triggerRef}
      className={`w-full group ${className}`}
      onMouseEnter={handleTriggerMouseEnter}
      onMouseLeave={handleTriggerMouseLeave}
    >
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

      {children && isFlyoutMounted && flyoutCoords && createPortal(
        <div
          ref={flyoutRef}
          style={{
            position: 'fixed',
            left: `${flyoutCoords.left}px`,
            top: `${flyoutCoords.top}px`,
            zIndex: 99999,
          }}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
          className={`hidden lg:block w-64 bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-2xl shadow-indigo-950/15 dark:shadow-black/70 ring-1 ring-slate-900/5 dark:ring-white/10 p-2.5 origin-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-[''] ${isFlyoutVisible
            ? 'opacity-100 scale-100 translate-x-0'
            : 'opacity-0 scale-[0.96] -translate-x-2 pointer-events-none'
            }`}
        >
          <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              {Icon && (
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Icon size={14} />
                </div>
              )}
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {label}
              </span>
            </div>
            {badge !== undefined && badge !== null && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-1.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-500/30 shrink-0">
                {badge}
              </span>
            )}
          </div>

          <div
            className="max-h-80 overflow-y-auto space-y-0.5 pr-1 overscroll-contain no-scrollbar"
            onClick={closeFlyoutImmediately}
          >
            {children}
          </div>
        </div>,
        document.body
      )}

      {children && (
        <div
          className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${!hasSubmenu || isSubmenuOpen
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
