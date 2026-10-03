import {
  DashboardSkeleton,
  DashboardProfileCard,
  PrimaryMetricsGrid,
  RoleHierarchySection,
  InfluencerOverviewSection,
  PoliticalViewsSection,
} from './components';
import React, { useEffect } from 'react';
import { dashboardStyles } from './styles';
import { RootState } from '../../store/store';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { AppHeader, SafeView } from '../../components';
import { SafeImage } from '../../components/SafeImage';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, TouchableOpacity } from 'react-native';
import { fetchDashboardMetricsAction } from '../../store/actions/dashboard';

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const auth = useSelector((state: RootState) => state.auth);
  const dashboard = useSelector((state: RootState) => state.dashboard);
  const { theme, styles } = useAppTheme<ReturnType<typeof dashboardStyles>>(dashboardStyles);

  useEffect(() => {
    dispatch(fetchDashboardMetricsAction());
  }, [dispatch]);

  const user = auth.user;
  const role = auth.role || user?.role || 'pc_leader';

  const handleNavigateProfile = () => {
    if (navigation.navigate) {
      navigation.navigate('Profile');
    }
  };

  const handleNavigateBooths = () => {
    if (navigation.navigate) {
      navigation.navigate('VoterModule', { screen: 'VoterList' });
    }
  };

  const handleNavigateVoters = () => {
    if (navigation.navigate) {
      navigation.navigate('VoterModule', { screen: 'VoterList' });
    }
  };

  return (
    <SafeView>
      {/* Reusable Common AppHeader Component */}
      <AppHeader showMenu showLogo statusBar={"hidden"} />

      {/* Main Content / Skeleton Loading */}
      {dashboard.loading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header Profile Card Section */}
          <DashboardProfileCard
            user={user}
            onPressProfile={handleNavigateProfile}
          />

          {/* Primary Metrics Grid Section (Booths & Voters) */}
          <PrimaryMetricsGrid
            assignedBoothsCount={dashboard.assignedBoothsCount}
            totalVotersCount={dashboard.totalVotersCount}
            onPressBooths={handleNavigateBooths}
            onPressVoters={handleNavigateVoters}
          />

          {/* Role Hierarchy Counts Section */}
          <RoleHierarchySection
            role={role}
            hierarchy={dashboard.hierarchy}
          />

          {/* Influencers & Contacts Overview Section */}
          <InfluencerOverviewSection
            influencers={dashboard.influencers}
            syncedContactsVotersCount={dashboard.syncedContactsVotersCount}
          />

          {/* Political Views Analytics Breakdown Section */}
          <PoliticalViewsSection
            politicalViews={dashboard.politicalViews}
          />
        </ScrollView>
      )}
    </SafeView>
  );
};

export default Dashboard;
