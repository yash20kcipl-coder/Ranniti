import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchTenantDashboardMetrics } from '@/redux/actions/tenantDashboard';

// Subcomponents per Rule 21
import { RecentVotersCard } from './components/RecentVotersCard';
import { BoothCoverageCard } from './components/BoothCoverageCard';
import { TenantKpiStatsGrid } from './components/TenantKpiStatsGrid';
import { VoterSentimentCard } from './components/VoterSentimentCard';
import { VolunteerOutreachCard } from './components/VolunteerOutreachCard';
import { DashboardQuickActions } from './components/DashboardQuickActions';
import { VoterDemographicsCard } from './components/VoterDemographicsCard';
import { RegistrationVelocityCard } from './components/RegistrationVelocityCard';

export const TenantDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { data, loading } = useAppSelector((state) => state.tenantDashboard);

  // Initial load using debounced effect per Rule 13
  useDebouncedEffect(() => {
    dispatch(fetchTenantDashboardMetrics());
  }, 200, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTenantDashboardMetrics(true));
      toast.success('Campaign metrics updated');
    } catch {
      toast.error('Failed to refresh campaign metrics');
    } finally {
      setRefreshing(false);
    }
  };

  const orgName = data?.profile?.organizationName || 'Campaign HQ';

  return (
    <div className="space-y-4 pb-6">
      {/* Reusable PageHeader per Rule 18 */}
      <PageHeader
        addLabel="Add Voter"
        isSyncing={refreshing}
        syncLabel="Sync Metrics"
        onSyncClick={handleManualRefresh}
        title={`${orgName} — Campaign Dashboard`}
        onAddClick={() => navigate('/dashboard/voters/new')}
        icon={<LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        subtitle="Constituency Electoral Operations, Voter Sentiment Analytics & Cadre Monitoring"
      />

      {/* Quick Launchpad & Status Bar */}
      <DashboardQuickActions onRefresh={handleManualRefresh} refreshing={refreshing} />

      {/* Top 4 KPI Metrics Grid */}
      <TenantKpiStatsGrid data={data} loading={loading} />

      {/* 2x2 Analytics & Field Operations Grid (Equal Heights per Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Voter Sentiment & Party Leanings */}
        <VoterSentimentCard data={data} loading={loading} />

        {/* Card 2: 14-Day Registration Momentum Sparkline */}
        <RegistrationVelocityCard data={data} loading={loading} />

        {/* Card 3: Age Cohorts & Gender Profile */}
        <VoterDemographicsCard data={data} loading={loading} />

        {/* Card 4: Electoral Infrastructure & Booths */}
        <BoothCoverageCard data={data} loading={loading} />
      </div>

      {/* Volunteer Performance, Phone Contact Sync & Cadre Outreach Analytics */}
      <VolunteerOutreachCard />

      {/* Recent Voter Registrations Table */}
      <RecentVotersCard recentVoters={data?.recentVoters || []} loading={loading} />
    </div>
  );
};

export default TenantDashboardPage;
