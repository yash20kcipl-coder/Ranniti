import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Database,
  Building,
} from 'lucide-react';
import type { TenantOverviewMetrics } from '@/redux/actions/superAdminDashboard';

interface TenantDistributionCardProps {
  tenants: TenantOverviewMetrics | null;
  loading: boolean;
}

export const TenantDistributionCard: React.FC<TenantDistributionCardProps> = ({
  tenants,
  loading,
}) => {
  const navigate = useNavigate();

  if (loading || !tenants) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse h-full">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const total = tenants.totalTenants || 1;
  const activePercent = Math.round((tenants.activeTenants / total) * 100);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tenant Organizations & Health
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-Tenant Campaign Instances & Allocations
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/tenants')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Status Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active</span>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {tenants.activeTenants}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {tenants.pendingTenants}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Suspended</span>
            </div>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300">
              {tenants.suspendedTenants}
            </p>
          </div>
        </div>

        {/* Total Voters Copied to Tenants */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Voters Copied Across Tenant DBs
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {tenants.totalVotersCopied.toLocaleString()} Voters
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, activePercent))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {activePercent}% of registered tenant campaigns are currently active and querying dedicated schemas.
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Total Campaigns: <strong>{tenants.totalTenants}</strong></span>
        <span>Isolated Postgres DB Architecture</span>
      </div>
    </div>
  );
};
