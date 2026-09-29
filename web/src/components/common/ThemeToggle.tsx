import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 rounded-xl transition-all duration-300 cursor-pointer select-none
        border border-slate-200 dark:border-slate-800
        bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80
        text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white
        shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        ${sizeClasses[size]} ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun
            size={iconSizes[size]}
            className="text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45"
          />
        ) : (
          <Moon
            size={iconSizes[size]}
            className="text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0"
          />
        )}
      </div>

      {showLabel && (
        <span className="font-semibold text-xs tracking-wide">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
