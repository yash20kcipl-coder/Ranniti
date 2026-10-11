import {
  Users,
  Vote,
  MapPin,
  CheckCircle2,
  Clock,
  Server,
  Activity,
} from 'lucide-react';
import React from 'react';
import { CountUp } from '@/components/common/CountUp';
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
            className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
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
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/60 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            Total Tenants
          </p>
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={tenants.totalTenants} duration={1.2} />
          </h3>
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tenants.activeTenants} Active
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {tenants.pendingTenants} Provisioning
            </span>
          </div>
        </div>
      </div>

      {/* 2. Master Voters Pool */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            Master Voters Pool
          </p>
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Vote size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={voters.totalVoters} duration={1.5} />
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
              <CountUp to={tenants.totalVotersCopied} duration={1.2} />
            </span>
            <span className="text-slate-500 dark:text-slate-400">assigned to campaigns</span>
          </div>
        </div>
      </div>

      {/* 3. Electoral Scope */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-purple-50/90 via-white to-pink-50/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-pink-950/20 border border-purple-200/80 dark:border-purple-900/60 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Electoral Scope
          </p>
          <div className="w-10 h-10 rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MapPin size={19} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            <CountUp to={infrastructure.acsCount} duration={1.2} />{' '}
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-sans uppercase">Assembly Seats</span>
          </h3>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>{Number(infrastructure.pcsCount || 0).toLocaleString()} PCs</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{Number(infrastructure.boothsCount || 0).toLocaleString()} Booths</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{Number(infrastructure.statesCount || 0).toLocaleString()} States</span>
          </div>
        </div>
      </div>

      {/* 4. Cluster & Connection Health */}
      <div className="relative overflow-hidden p-5 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cluster Health</span>
          </p>
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Server size={19} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Operational</h3>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>{platformHealth.activeTenantPools} DB Pools</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{platformHealth.masterPoolTotal} Pool Clients</span>
          </div>
        </div>
      </div>
    </div>
  );
};
