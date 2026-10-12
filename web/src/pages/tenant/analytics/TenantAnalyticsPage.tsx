import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchVolunteerAnalytics } from '@/redux/actions/volunteer';
import { fetchTenantDashboardMetrics } from '@/redux/actions/tenantDashboard';

// Subcomponents & Analytics Cards
import { BoothCoverageCard } from '../dashboard/components/BoothCoverageCard';
import { VoterSentimentCard } from '../dashboard/components/VoterSentimentCard';
import { VolunteerOutreachCard } from '../dashboard/components/VolunteerOutreachCard';
import { VoterDemographicsCard } from '../dashboard/components/VoterDemographicsCard';
import { RegistrationVelocityCard } from '../dashboard/components/RegistrationVelocityCard';

export const TenantAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { data: dashboardData, loading: dashboardLoading } = useAppSelector((state) => state.tenantDashboard);

  const volunteerAnalytics = (filters?: { timeRange?: '7d' | '30d' | 'all'; role?: string }) => {
    dispatch(fetchVolunteerAnalytics(filters));
  };

  // Initial load using debounced effect per Rule 13
  useDebouncedEffect(() => {
    dispatch(fetchTenantDashboardMetrics());
  }, 200, [dispatch]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchTenantDashboardMetrics(true)),
        volunteerAnalytics()
      ]);
      toast.success('Analytics & outreach metrics updated');
    } catch {
      toast.error('Failed to refresh analytics data');
    } finally {
      setRefreshing(false);
    }
  };
  const orgName = dashboardData?.profile?.organizationName || 'Campaign HQ';

  return (
    <div className="space-y-5 pb-8">
      {/* Reusable PageHeader per Rule 18 */}
      <PageHeader
        title={`${orgName} — Campaign & Outreach Analytics`}
        subtitle="Field Cadre Telemetry, Phone Contact Match Rates, Voter Sentiment & Electoral Trends"
        icon={<TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        syncLabel="Refresh Analytics"
        isSyncing={refreshing}
        onSyncClick={handleManualRefresh}
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs cursor-pointer"
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </button>
        }
      />

      {/* Primary Section: Volunteer Performance & Cadre Outreach Telemetry */}
      <VolunteerOutreachCard volunteerAnalytics={volunteerAnalytics} />

      {/* Secondary Section: Constituency Demographics & Electoral Trends */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Electoral Intelligence & Voter Sentiment
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Constituency leanings, demographic cohorts, and booth distribution
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Voter Sentiment & Party Leanings */}
          <VoterSentimentCard data={dashboardData} loading={dashboardLoading} />

          {/* Card 2: 14-Day Registration Momentum Sparkline */}
          <RegistrationVelocityCard data={dashboardData} loading={dashboardLoading} />

          {/* Card 3: Age Cohorts & Gender Profile */}
          <VoterDemographicsCard data={dashboardData} loading={dashboardLoading} />

          {/* Card 4: Electoral Infrastructure & Booths */}
          <BoothCoverageCard data={dashboardData} loading={dashboardLoading} />
        </div>
      </section>
    </div>
  );
};

export default TenantAnalyticsPage;
