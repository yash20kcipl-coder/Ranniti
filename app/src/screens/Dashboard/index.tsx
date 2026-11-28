import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy, ChevronRight } from 'lucide-react-native';
import { useLanguage } from '../../languages';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import {
  DashboardSkeleton,
  DashboardProfileCard,
  DashboardBoothFilter,
  PrimaryMetricsGrid,
  RoleHierarchySection,
  InfluencerOverviewSection,
  PoliticalViewsSection,
  GenderDemographicsSection,
  TurnoutAnalyticsSection,
} from './components';
import { dashboardStyles } from './styles';
import { RootState } from '../../store/store';
import { navigatToVoters } from '../../navigation';
import { SCREENS } from '../../navigation/constants';
import React, { useEffect, useCallback, useState } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { AppHeader, SafeView, ScrollView } from '../../components';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchProfileAndRoleAccessAction } from '../../store/actions/auth';
import {
  fetchDashboardMetricsAction,
  fetchMySurveyScoreAction,
} from '../../store/actions/dashboard';
import { fetchAssignedBoothsAction } from '../../store/actions/booths';
import { checkAndSyncDatasetsAction } from '../../store/actions/syncActions';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const auth = useSelector((state: RootState) => state.auth);
  const election = useSelector((state: RootState) => state.election);
  const [selectedBoothId, setSelectedBoothId] = useState<string>('');
  const boothsState = useSelector((state: RootState) => state.booths);
  const dashboard = useSelector((state: RootState) => state.dashboard);
  const [headerVersion, setHeaderVersion] = useState<'v1' | 'v2'>('v1');
  const { styles } = useAppTheme<ReturnType<typeof dashboardStyles>>(dashboardStyles);

  useEffect(() => {
    dispatch(checkAndSyncDatasetsAction());
    dispatch(fetchAssignedBoothsAction(1, false, '', 500));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchDashboardMetricsAction(selectedBoothId || undefined));
      dispatch(fetchMySurveyScoreAction('30d'));
    }, [dispatch, selectedBoothId])
  );

  const user = auth.user;
  const role = auth.role || user?.role || 'pc_leader';
  const activeElectionName = dashboard?.activeElection?.name || election?.election?.name;

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

  const handleNavigateElectionPolling = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate(SCREENS.ELECTION_POLLING);
    }
  }, [navigation]);

  const totalScore = dashboard.surveyScore?.myStats?.summary?.totalScore || 0;
  const rank = dashboard.surveyScore?.rank || 0;

  return (
    <SafeView>
      {/* Reusable Common AppHeader Component with V1 (Dark Hero) & V2 (Light Card) */}
      <AppHeader
        showMenu
        showLogo
        showLanguageToggle
        statusBar={"hidden"}
        style={
          headerVersion === 'v1'
            ? {
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              paddingBottom: 12,
            }
            : {
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              paddingBottom: 6,
            }
        }
        bottomContent={
          headerVersion === 'v1' ? (
            <>
              <DashboardProfileCard
                mode="dark"
                user={user}
                onPressProfile={handleNavigateProfile}
              />
              <View
                style={{
                  marginHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <DashboardBoothFilter
                  variant="hero-text"
                  booths={boothsState.booths}
                  selectedBoothId={selectedBoothId}
                  onSelectBooth={setSelectedBoothId}
                  loading={boothsState.loading && boothsState.booths.length === 0}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(SCREENS.SURVEY_POINTS)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#FACC15',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 22,
                  }}
                >
                  <Trophy size={10} color="#1E293B" />
                  <Text
                    style={{
                      fontSize: rfValue(11),
                      fontFamily: FontFamily.bold,
                      color: '#0F172A',
                    }}
                  >
                    {totalScore} {t('ptsSuffix')}
                  </Text>
                  {rank > 0 && (
                    <View
                      style={{
                        backgroundColor: '#0F172A',
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: rfValue(10),
                          fontFamily: FontFamily.bold,
                          color: '#FACC15',
                        }}
                      >
                        #{rank}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <DashboardProfileCard
                mode="light"
                user={user}
                onPressProfile={handleNavigateProfile}
              />
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <DashboardBoothFilter
                  variant="light-pill"
                  booths={boothsState.booths}
                  selectedBoothId={selectedBoothId}
                  onSelectBooth={setSelectedBoothId}
                  loading={boothsState.loading && boothsState.booths.length === 0}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(SCREENS.SURVEY_POINTS)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FACC15',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                  }}
                >
                  <Trophy size={16} color="#78350F" />
                  <View>
                    <Text
                      style={{
                        fontSize: rfValue(12.5),
                        fontFamily: FontFamily.bold,
                        color: '#0F172A',
                      }}
                    >
                      {totalScore} {t('ptsSuffix')}
                    </Text>
                    <Text
                      style={{
                        fontSize: rfValue(10),
                        fontFamily: FontFamily.medium,
                        color: '#78350F',
                      }}
                    >
                      {rank > 0 ? `Rank #${rank}` : t('viewPointsAndRules')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )
        }
      />

      {/* Main Content / Skeleton Loading */}
      {dashboard.loading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          style={{ ...styles.container }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshApi={() => {
            dispatch(fetchDashboardMetricsAction(selectedBoothId || undefined));
            dispatch(fetchMySurveyScoreAction('30d'));
            dispatch(fetchProfileAndRoleAccessAction());
            dispatch(fetchAssignedBoothsAction(1, false, '', 500));
          }}
        >
          {/* Primary Metrics Grid Section (Booths & Voters) */}
          <PrimaryMetricsGrid
            onPressBooths={handleNavigateBooths}
            onPressVoters={handleNavigateVoters}
            totalVotersCount={dashboard.totalVotersCount}
            assignedBoothsCount={dashboard.assignedBoothsCount}
          />

          {/* Real-time Voting Turnout Analytics Section (Only shown when active election exists) */}
          {activeElectionName ? (
            <TurnoutAnalyticsSection
              electionName={activeElectionName}
              turnoutData={dashboard?.turnoutData}
              onPressTurnout={handleNavigateElectionPolling}
            />
          ) : null}

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
            onPressGender={handleNavigateVoters}
          />
        </ScrollView>
      )}
    </SafeView>
  );
};

export default Dashboard;
