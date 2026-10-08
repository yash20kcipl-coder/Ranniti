import {
  Users,
  Vote,
  MapPin,
  CheckCircle2,
  Clock,
  Server,
} from 'lucide-react';
import React from 'react';
import type { SuperAdminDashboardPayload } from '@/redux/actions/superAdminDashboard';

interface KpiStatsGridProps {
  data: SuperAdminDashboardPayload | null;
  loading: boolean;
}

export const KpiStatsGrid: React.FC<KpiStatsGridProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { tenants, voters, infrastructure, platformHealth } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Tenants */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Tenants
          </p>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tenants.totalTenants.toLocaleString()}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tenants.activeTenants} Active
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {tenants.pendingTenants} Provisioning
            </span>
          </div>
        </div>
      </div>

      {/* 2. Master Voters */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Master Voters Pool
          </p>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
            <Vote className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {voters.totalVoters.toLocaleString()}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {tenants.totalVotersCopied.toLocaleString()}
            </span>
            <span className="text-slate-500 dark:text-slate-400">assigned to campaigns</span>
          </div>
        </div>
      </div>

      {/* 3. Electoral Scope */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Electoral Scope
          </p>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {infrastructure.acsCount.toLocaleString()}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ACs</span>
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{infrastructure.pcsCount} PCs</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{infrastructure.boothsCount.toLocaleString()} Booths</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{infrastructure.statesCount} States</span>
          </div>
        </div>
      </div>

      {/* 4. Cluster & Connection Health */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Cluster Health
          </p>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Operational</h3>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{platformHealth.activeTenantPools} Tenant DB Pools</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{platformHealth.masterPoolTotal} Pool Clients</span>
          </div>
        </div>
      </div>
    </div>
  );
};
