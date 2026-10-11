import {
  ArrowRight,
  Database,
  Building,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CountUp } from '@/components/common/CountUp';
import { DonutChart } from '@/components/common/charts/DonutChart';
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
      <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse h-full">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    );
  }

  const total = tenants.totalTenants || 1;
  const activePercent = Math.round((tenants.activeTenants / total) * 100);

  return (
    <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-slate-900 dark:text-white">
                Tenant Organizations & Health
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Multi-Tenant Campaign Instances & Allocations
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/tenants')}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span className="!text-[9px]">Manage Tenants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tenant Lifecycle Donut Chart */}
        <div className="mb-5">
          <DonutChart
            data={[
              { id: 'active', label: 'Active', value: tenants.activeTenants || 0, color: '#10B981' },
              { id: 'pending', label: 'Provisioning', value: tenants.pendingTenants || 0, color: '#F59E0B' },
              { id: 'suspended', label: 'Suspended', value: tenants.suspendedTenants || 0, color: '#F43F5E' },
            ]}
            totalLabel="Total Tenants"
            size={160}
          />
        </div>

        {/* Total Voters Copied to Tenants */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Voters Assigned to Tenant DB Schemas
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              <CountUp to={tenants.totalVotersCopied} duration={1.5} /> Voters
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${Math.min(100, Math.max(15, activePercent))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{activePercent}%</span> of registered campaign accounts are fully operational with isolated PostgreSQL schemas.
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Total Campaigns: <strong className="font-mono text-slate-800 dark:text-slate-200">{tenants.totalTenants}</strong></span>
        <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Isolated Postgres Cluster</span>
      </div>
    </div>
  );
};
