import {
  UserPlus,
  Users,
  Vote,
  Database,
  Shield,
  Settings,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardQuickActionsProps {
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
      label: 'Provision Tenant',
      description: 'Setup new campaign DB & credentials',
      icon: UserPlus,
      onClick: () => navigate('/dashboard/tenants/new'),
      variant: 'primary',
    },
    {
      label: 'Tenant Directory',
      description: 'Review organizations & quotas',
      icon: Users,
      onClick: () => navigate('/dashboard/tenants'),
      variant: 'secondary',
    },
    {
      label: 'Voter Repository',
      description: 'Query nationwide voter master',
      icon: Vote,
      onClick: () => navigate('/dashboard/voters'),
      variant: 'secondary',
    },
    {
      label: 'Master Data Hub',
      description: 'Manage ACs, PCs, Booths, Castes',
      icon: Database,
      onClick: () => navigate('/dashboard/master'),
      variant: 'secondary',
    },
    {
      label: 'Role Packages',
      description: 'Assign role permissions & tiers',
      icon: Shield,
      onClick: () => navigate('/dashboard/roles'),
      variant: 'secondary',
    },
    {
      label: 'System Settings',
      description: 'Configurations & environment',
      icon: Settings,
      onClick: () => navigate('/dashboard/settings'),
      variant: 'secondary',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Platform Operations Hub
          </h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          {refreshing ? 'Syncing...' : 'Refresh Metrics'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          const isPrimary = act.variant === 'primary';
          return (
            <button
              key={act.label}
              onClick={act.onClick}
              className={`p-3.5 rounded-xl text-left transition-all border group flex flex-col justify-between ${isPrimary
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${isPrimary
                    ? 'bg-white/20 text-white'
                    : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold leading-tight ${isPrimary ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                >
                  {act.label}
                </p>
                <p
                  className={`text-[11px] mt-0.5 line-clamp-1 ${isPrimary ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                  {act.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
