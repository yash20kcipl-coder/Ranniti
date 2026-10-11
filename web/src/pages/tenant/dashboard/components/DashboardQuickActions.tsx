import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote, UserPlus, UserCheck, Building2, RefreshCw, Sparkles } from 'lucide-react';

export interface DashboardQuickActionsProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  onRefresh,
  refreshing,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Voter Directory',
      subtext: 'Search & filter voters',
      icon: Vote,
      color: 'from-indigo-600 to-violet-600',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/60',
      onClick: () => navigate('/dashboard/voters'),
    },
    {
      label: 'Add Voter',
      subtext: 'Register new constituent',
      icon: UserPlus,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60',
      onClick: () => navigate('/dashboard/voters/new'),
    },
    {
      label: 'Field Cadre',
      subtext: 'Manage volunteers & leads',
      icon: UserCheck,
      color: 'from-blue-600 to-cyan-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60',
      onClick: () => navigate('/dashboard/volunteers'),
    },
    {
      label: 'Master Setup',
      subtext: 'ACs, Wards & Booths',
      icon: Building2,
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60',
      onClick: () => navigate('/dashboard/tenant-master'),
    },
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Campaign Command Launchpad
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Quick Shortcuts
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant access to core campaign management modules
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
          {refreshing ? 'Refreshing...' : 'Live Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className={`flex items-center gap-3 p-3 rounded-lg border ${act.bgColor} hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left group`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${act.color} text-white flex items-center justify-center shadow-xs shrink-0 group-hover:rotate-3 transition-transform`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {act.label}
                </p>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {act.subtext}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
