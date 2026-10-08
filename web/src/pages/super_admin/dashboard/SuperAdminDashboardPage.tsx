import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import {
  fetchSuperAdminDashboardMetrics,
  fetchDashboardImportJobs,
  fetchDashboardAuditFeed,
} from '@/redux/actions/superAdminDashboard';

// Subcomponents per Rule 21
import { KpiStatsGrid } from './components/KpiStatsGrid';
import { DashboardQuickActions } from './components/DashboardQuickActions';
import { VoterDemographicsCard } from './components/VoterDemographicsCard';
import { TenantDistributionCard } from './components/TenantDistributionCard';
import { LiveImportTrackerCard } from './components/LiveImportTrackerCard';
import { AuditActivityFeedCard } from './components/AuditActivityFeedCard';
import { RecentTenantsCard } from './components/RecentTenantsCard';

export const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, importJobs, auditFeed, loading } = useAppSelector((state) => state.dashboard);

  const [refreshing, setRefreshing] = useState(false);

  // Initial load using debounced effect per Rule 13
  useDebouncedEffect(
    () => {
      dispatch(fetchSuperAdminDashboardMetrics());
      dispatch(fetchDashboardImportJobs());
    },
    200,
    []
  );

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchSuperAdminDashboardMetrics(false)),
        dispatch(fetchDashboardImportJobs()),
        dispatch(fetchDashboardAuditFeed(20)),
      ]);
      toast.success('Platform metrics refreshed');
    } catch {
      toast.error('Failed to refresh metrics');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Reusable PageHeader per Rule 18 */}
      <PageHeader
        title="Super Admin Platform Dashboard"
        subtitle="Multi-Tenant Electoral Infrastructure, PostgreSQL Cluster Health & Background Job Radar"
        icon={<LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Central Orchestrator
          </span>
        }
        onSyncClick={handleManualRefresh}
        isSyncing={refreshing}
        syncLabel="Sync Platform"
        onAddClick={() => navigate('/dashboard/tenants/new')}
        addLabel="Provision Tenant"
      />

      {/* Quick Launchpad & Status Bar */}
      <DashboardQuickActions onRefresh={handleManualRefresh} refreshing={refreshing} />

      {/* Top 4 KPI Metrics Grid */}
      <KpiStatsGrid data={data} loading={loading} />

      {/* Secondary Analytics Row: Demographics & Tenant Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VoterDemographicsCard
          voters={data?.voters || null}
          infrastructure={data?.infrastructure || null}
          loading={loading}
        />
        <TenantDistributionCard
          tenants={data?.tenants || null}
          loading={loading}
        />
      </div>

      {/* Operations & Real-Time Radar Row: Bulk Imports & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveImportTrackerCard
          jobs={importJobs}
          loading={refreshing}
          onRefresh={() => dispatch(fetchDashboardImportJobs())}
        />
        <AuditActivityFeedCard
          logs={auditFeed.length > 0 ? auditFeed : data?.recentAuditFeed || []}
        />
      </div>

      {/* Recent Tenants Provisioning Table */}
      <RecentTenantsCard
        tenants={data?.recentTenants || []}
        loading={loading}
      />
    </div>
  );
};

export default SuperAdminDashboardPage;
