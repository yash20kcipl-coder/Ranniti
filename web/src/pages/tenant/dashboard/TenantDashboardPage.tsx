import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchTenantDashboardOverview } from '@/redux/actions/tenantDashboardOverview';

// Subcomponents per Rule 21
import { DashboardHeader } from './components/DashboardHeader';
import { OverviewKpiGrid } from './components/OverviewKpiGrid';
import { AssignedAreaMapCard } from './components/AssignedAreaMapCard';
import { PartyLeaningCard } from './components/PartyLeaningCard';
import { AgePartyCrossTabCard } from './components/AgePartyCrossTabCard';
import { GenderBreakdownCard } from './components/GenderBreakdownCard';
import { FieldCompletenessCard } from './components/FieldCompletenessCard';
import { CadreDeploymentCard } from './components/CadreDeploymentCard';

export const TenantDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBoothId, setSelectedBoothId] = useState<string>('');
  const { data, loading } = useAppSelector((state) => state.tenantDashboardOverview);

  // Reload overview metrics whenever selectedBoothId changes (Rule 13)
  useDebouncedEffect(() => {
    dispatch(fetchTenantDashboardOverview(false, true, selectedBoothId));
  }, 200, [selectedBoothId]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTenantDashboardOverview(true, true, selectedBoothId));
      toast.success('Dashboard updated with latest numbers');
    } catch {
      toast.error('Could not update dashboard. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBoothChange = (boothId: string, boothName?: string) => {
    setSelectedBoothId(boothId);
    if (boothId) {
      toast.success(`Showing data for ${boothName || `Booth #${boothId}`}`);
    } else {
      toast('Showing data for all booths in your area');
    }
  };

  const orgName = data?.profile?.organizationName || 'Campaign HQ';

  return (
    <div className="space-y-4 pb-6">
      {/* Executive Dashboard Header with Booth Filter */}
      <DashboardHeader
        orgName={orgName}
        totalVoters={data?.totalVoters}
        totalBooths={data?.totalBooths}
        onRefresh={handleManualRefresh}
        isRefreshing={refreshing}
        selectedBoothId={selectedBoothId}
        onBoothChange={handleBoothChange}
      />

      {/* Top 4 KPI Summary Cards */}
      <OverviewKpiGrid data={data} loading={loading} />

      {/* Row 1: Assigned Area Map & Party Leaning / Swing Voters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssignedAreaMapCard data={data} loading={loading} />
        <PartyLeaningCard data={data} loading={loading} />
      </div>

      {/* Row 2: Age Groups × Party Support & Gender Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AgePartyCrossTabCard data={data} loading={loading} />
        <GenderBreakdownCard data={data} loading={loading} />
      </div>

      {/* Row 3: Important Voter Details Filled & Booth Sub-Leaders / Supporters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FieldCompletenessCard data={data} loading={loading} />
        <CadreDeploymentCard data={data} loading={loading} />
      </div>
    </div>
  );
};

export default TenantDashboardPage;
