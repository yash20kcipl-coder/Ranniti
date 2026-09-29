import React from 'react';

export interface SectionContainerProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  icon,
  iconBg = 'p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  contentClassName = 'space-y-6',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-6 ${className}`}
    >
      <div
        className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 ${headerClassName}`}
      >
        <div className="flex items-center gap-3">
          {icon && <div className={iconBg}>{icon}</div>}
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default SectionContainer;
