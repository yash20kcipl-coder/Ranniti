import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabContainerProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  views?: Partial<Record<T, React.ReactNode>>;
  children?: React.ReactNode;
  className?: string;
  tabsHeaderClassName?: string;
  contentClassName?: string;
}

export function TabContainer<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  views,
  children,
  className = 'space-y-6',
  tabsHeaderClassName = '',
  contentClassName = '',
}: TabContainerProps<T>) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const updatePill = useCallback(() => {
    const el = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = el.getBoundingClientRect();
    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [activeTab]);

  // Synchronously measure before browser paint to prevent any visual jump
  useIsomorphicLayoutEffect(() => {
    updatePill();
  }, [updatePill]);

  // Window resize observer
  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  const handleTabChange = (id: T) => {
    if (id === activeTab) return;
    onTabChange(id);
  };

  return (
    <div className={className}>
      {/* Navigation Tabs Header Bar — Compact Island with Animated Pill */}
      <div className="flex items-center justify-start w-full">
        <div
          ref={containerRef}
          className={`relative inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs max-w-full overflow-x-auto scrollbar-none ${tabsHeaderClassName}`}
        >
          {/* Animated sliding pill background with GPU accelerated transform */}
          {pillStyle && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 left-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-md shadow-indigo-500/5 dark:shadow-black/25 pointer-events-none z-0 will-change-transform"
              style={{
                transform: `translateX(${pillStyle.left}px)`,
                width: `${pillStyle.width}px`,
                transition: 'transform 240ms cubic-bezier(0.2, 0, 0, 1), width 240ms cubic-bezier(0.2, 0, 0, 1)',
              }}
            />
          )}

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                onClick={() => !tab.disabled && handleTabChange(tab.id)}
                disabled={tab.disabled}
                className={`group relative z-10 inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap select-none ${
                  isActive
                    ? 'text-slate-900 dark:text-white cursor-default'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer'
                } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {/* Visual Icon Badge Box */}
                {Icon && (
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs shadow-indigo-500/30 scale-105'
                        : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                )}

                {/* Tab Label */}
                <span
                  className={`transition-colors duration-200 ${
                    isActive
                      ? 'text-slate-900 dark:text-white font-extrabold tracking-tight'
                      : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white font-semibold'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Live Count badge */}
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/90 dark:border-indigo-800/80 shadow-2xs'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300/70 dark:group-hover:bg-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {/* Custom badge */}
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/80'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content View — Smooth, Instantaneous transition without flicker */}
      <div className={`transition-opacity duration-150 ease-out ${contentClassName}`}>
        {views ? views[activeTab] : children}
      </div>
    </div>
  );
}
