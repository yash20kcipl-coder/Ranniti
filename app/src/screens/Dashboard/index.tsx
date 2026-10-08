import {
  DashboardSkeleton,
  DashboardProfileCard,
  PrimaryMetricsGrid,
  RoleHierarchySection,
  InfluencerOverviewSection,
  PoliticalViewsSection,
  GenderDemographicsSection
} from './components';
import { dashboardStyles } from './styles';
import { RootState } from '../../store/store';
import { navigatToVoters } from '../../navigation';
import { SCREENS } from '../../navigation/constants';
import React, { useEffect, useCallback } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, SafeView, ScrollView } from '../../components';
import { fetchProfileAndRoleAccessAction } from '../../store/actions/auth';
import { fetchDashboardMetricsAction } from '../../store/actions/dashboard';

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const auth = useSelector((state: RootState) => state.auth);
  const dashboard = useSelector((state: RootState) => state.dashboard);
  const { styles } = useAppTheme<ReturnType<typeof dashboardStyles>>(dashboardStyles);

  useEffect(() => {
    dispatch(fetchDashboardMetricsAction());
  }, [dispatch]);

  const user = auth.user;
  const role = auth.role || user?.role || 'pc_leader';

  const handleNavigateProfile = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.PROFILE);
    }
  }, [navigation]);

  const handleNavigateBooths = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.ASSIGNED_BOOTHS);
    }
  }, [navigation]);

  const handleNavigateVoters = useCallback(() => {
    navigatToVoters();
  }, []);

  const handleNavigateTeam = useCallback((initialRoleFilter?: string) => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.TEAM_MANAGEMENT, initialRoleFilter ? { initialRoleFilter } : undefined);
    }
  }, [navigation]);

  const handleNavigateFamily = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.FAMILY_MAPPING);
    }
  }, [navigation]);

  const handleNavigateSocial = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.INFLUENCER_MAPPING);
    }
  }, [navigation]);

  const handleNavigateContactSync = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.CONTACT_SYNC);
    }
  }, [navigation]);

  return (
    <SafeView>
      {/* Reusable Common AppHeader Component with Language Toggle Switch */}
      <AppHeader showMenu showLogo showLanguageToggle statusBar={"hidden"} />

      {/* Main Content / Skeleton Loading */}
      {dashboard.loading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshApi={() => {
            dispatch(fetchDashboardMetricsAction());
            dispatch(fetchProfileAndRoleAccessAction());
          }}
        >
          {/* Header Profile Card Section */}
          <DashboardProfileCard
            user={user}
            onPressProfile={handleNavigateProfile}
          />

          {/* Primary Metrics Grid Section (Booths & Voters) */}
          <PrimaryMetricsGrid
            onPressBooths={handleNavigateBooths}
            onPressVoters={handleNavigateVoters}
            totalVotersCount={dashboard.totalVotersCount}
            assignedBoothsCount={dashboard.assignedBoothsCount}
          />

          {/* Role Hierarchy Counts Section */}
          <RoleHierarchySection
            role={role}
            hierarchy={dashboard.hierarchy}
            onPressHeader={() => handleNavigateTeam()}
            onPressAcLeaders={() => handleNavigateTeam('ac_leader')}
            onPressSupporters={() => handleNavigateTeam('supporter')}
            onPressSubLeaders={() => handleNavigateTeam('sub_leader')}
          />

          {/* Influencers & Contacts Overview Section */}
          <InfluencerOverviewSection
            influencers={dashboard.influencers}
            onPressFamily={handleNavigateFamily}
            onPressSocial={handleNavigateSocial}
            onPressHeader={handleNavigateFamily}
            onPressContactSync={handleNavigateContactSync}
            syncedContactsVotersCount={dashboard.syncedContactsVotersCount}
          />

          {/* Political Views Analytics Breakdown Section */}
          {/* <PoliticalViewsSection
            politicalViews={dashboard.politicalViews}
            onPress={handleNavigateVoters}
          /> */}

          {/* Gender Demographics & Age Analytics Section */}
          <GenderDemographicsSection
            ageData={dashboard.ageData}
            genderData={dashboard.genderData}
            onPressAge={handleNavigateVoters}
            turnoutData={dashboard?.turnoutData}
            onPressGender={handleNavigateVoters}
            onPressTurnout={handleNavigateVoters}
          />
        </ScrollView>
      )}
    </SafeView>
  );
};

export default Dashboard;
