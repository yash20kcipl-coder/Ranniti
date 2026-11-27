import React from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchSuperAdminDashboardMetrics, } from '@/redux/actions/superAdminDashboard';

// Subcomponents per Rule 21
import { KpiStatsGrid } from './components/KpiStatsGrid';
import { RecentTenantsCard } from './components/RecentTenantsCard';
import { VoterDemographicsCard } from './components/VoterDemographicsCard';
import { TenantDistributionCard } from './components/TenantDistributionCard';

export const SuperAdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector((state) => state.dashboard);

  useDebouncedEffect(() => {
    dispatch(fetchSuperAdminDashboardMetrics());
  }, 200, []);

  return (
    <div className="space-y-4 pb-6">
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

      {/* Recent Tenants Provisioning Table */}
      <RecentTenantsCard
        tenants={data?.recentTenants || []}
        loading={loading}
      />
    </div>
  );
};

export default SuperAdminDashboardPage;
