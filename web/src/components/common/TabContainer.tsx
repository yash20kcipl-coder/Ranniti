import React, { useRef, useEffect, useState, useCallback } from 'react';

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
  const [contentKey, setContentKey] = useState(activeTab);
  const [isAnimating, setIsAnimating] = useState(false);

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

  useEffect(() => {
    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  const handleTabChange = (id: T) => {
    if (id === activeTab || isAnimating) return;
    setIsAnimating(true);
    onTabChange(id);
    // slight delay so content exits before new content enters
    setTimeout(() => {
      setContentKey(id);
      setIsAnimating(false);
    }, 120);
  };

  return (
    <div className={className}>
      {/* Navigation Tabs Header Bar */}
      <div
        ref={containerRef}
        className={`relative flex items-center gap-0.5 p-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-x-auto scrollbar-none ${tabsHeaderClassName}`}
      >
        {/* Animated sliding pill background */}
        {pillStyle && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none z-0"
            style={{ left: pillStyle.left, width: pillStyle.width }}
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
              className={`group relative z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-colors duration-200 whitespace-nowrap select-none ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 cursor-default'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:scale-110'
                  }`}
                />
              )}
              <span>{tab.label}</span>

              {/* Count badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300/70 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {/* Custom badge */}
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300/70 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content View — fade + slide-up on switch */}
      <div
        key={contentKey}
        className={`transition-all duration-200 ease-out animate-tabFadeIn ${contentClassName}`}
      >
        {views ? views[activeTab] : children}
      </div>

      {/* Keyframe injected once via style tag */}
      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-tabFadeIn {
          animation: tabFadeIn 0.22s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
}
