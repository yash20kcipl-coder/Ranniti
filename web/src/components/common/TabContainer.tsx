import React from 'react';

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
  views?: Record<T, React.ReactNode>;
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
  contentClassName = 'animate-fadeIn',
}: TabContainerProps<T>) {
  return (
    <div className={className}>
      {/* Navigation Tabs Header Bar */}
      <div
        className={`flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800 overflow-x-auto scrollbar-none ${tabsHeaderClassName}`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
              } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                />
              )}
              <span>{tab.label}</span>

              {/* Count badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-300/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {/* Custom badge */}
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content View */}
      <div className={contentClassName}>
        {views ? views[activeTab] : children}
      </div>
    </div>
  );
}
