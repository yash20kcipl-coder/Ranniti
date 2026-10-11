import React from 'react';

export interface SectionContainerProps {
  id?: string;
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
  id,
  icon,
  iconBg = 'p-4 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  contentClassName = 'space-y-5',
}) => {
  return (
    <div
      id={id}
      className={`scroll-mt-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl !pt-4 p-5 md:p-6 shadow-xs space-y-5 ${className}`}
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 ${headerClassName}`}
      >
        <div className="flex items-center gap-3">
          {icon && <div className={iconBg}>{icon}</div>}
          <div>
            <h3 className="text-[13px] md:text-[16px] font-slab font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default SectionContainer;
