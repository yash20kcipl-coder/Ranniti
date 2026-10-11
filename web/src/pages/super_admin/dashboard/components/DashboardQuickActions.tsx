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
      onClick: () => navigate('/dashboard/settings?tab=tenant-roles'),
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
    <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Platform Operations Hub
          </h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Metrics'}</span>
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
              className={`p-3.5 rounded-lg text-left transition-all border group flex flex-col justify-between cursor-pointer ${
                isPrimary
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                  isPrimary
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold leading-tight ${
                    isPrimary ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {act.label}
                </p>
                <p
                  className={`text-[11px] mt-0.5 line-clamp-1 ${
                    isPrimary ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
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
