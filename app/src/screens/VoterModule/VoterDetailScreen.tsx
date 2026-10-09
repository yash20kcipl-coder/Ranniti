import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootState } from '../../store/store';
import { toggleVotedStatusAction, fetchVoterByIdAction, updateVoterPartyAction } from '../../store/actions/voters';
import { SCREENS } from '../../navigation/constants';
import { hasVoterPermission } from '../../utils/permissionUtils';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { AppHeader } from '../../components/AppHeader';
import { PartySelectModal } from '../../components';
import { FontFamily } from '../../utils/typography';
import { rfValue } from '../../utils/responsive';
import { getShadow } from '../../utils/shadow';
import { Voter } from '../../store/reducers/voters';

import { VoterDetailHeader } from './components/VoterDetailHeader';
import { VoterDemographicsSection } from './components/VoterDemographicsSection';
import { VoterElectoralSection } from './components/VoterElectoralSection';
import { VoterAffinitySection } from './components/VoterAffinitySection';
import { VoterSectionTabBar } from './components/VoterSectionTabBar';

type DetailTab = 'all' | 'demographics' | 'electoral' | 'political';

export const VoterDetailScreen: React.FC<any> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const { theme } = useAppTheme();

  const initialVoter: Voter = route?.params?.voter;
  const storeVoter = useSelector((state: RootState) =>
    state.voters.voters.find((v) => v.id === initialVoter?.id)
  );

  const [voter, setVoter] = useState<Voter>(storeVoter || initialVoter);
  const [activeTab, setActiveTab] = useState<DetailTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [partyModalVisible, setPartyModalVisible] = useState(false);

  const access = useSelector((state: RootState) => (state.auth as any)?.access);
  const canEditInclination = hasVoterPermission(access, 'canEditInclination');

  // Sync with store updates (e.g. toggle voted, update party)
  useEffect(() => {
    if (storeVoter) {
      setVoter((prev) => ({ ...prev, ...storeVoter }));
    }
  }, [storeVoter]);

  // Fetch complete voter record from backend API on mount
  const loadFreshVoterDetails = useCallback(async () => {
    if (initialVoter?.id) {
      const freshVoter = await dispatch(fetchVoterByIdAction(initialVoter.id));
      if (freshVoter) {
        setVoter(freshVoter);
      }
    }
  }, [dispatch, initialVoter?.id]);

  useEffect(() => {
    loadFreshVoterDetails();
  }, [loadFreshVoterDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFreshVoterDetails();
    setRefreshing(false);
  };

  if (!voter) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader
          title={t('voterDetails')}
          showBack={true}
          onBack={() => navigation.goBack()}
          variant="primary"
        />
        <View style={styles.emptyContainer}>
          <MaterialDesignIcons name="account-search-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('noVoterInfoAvailable') || 'No voter information available.'}
          </Text>
        </View>
      </View>
    );
  }

  const hindiName = voter.hindiName || voter.name;
  const canEdit =
    hasVoterPermission(access, 'canEditContact') ||
    hasVoterPermission(access, 'canEditDemographics') ||
    hasVoterPermission(access, 'canEditInclination');

  const handleEditPress = () => {
    navigation.navigate(SCREENS.ADD_EDIT_VOTER, { voter });
  };

  const handleToggleVoted = () => {
    dispatch(toggleVotedStatusAction(voter.id, voter.isVoted));
  };

  const handleSelectParty = (partyId: string | null, partyName: string) => {
    dispatch(updateVoterPartyAction(voter.id, partyId, partyName));
    setVoter((prev) => ({
      ...prev,
      partyId: partyId || undefined,
      partyName,
      supportingParty: partyName,
    }));
  };

  const handleViewFamilyTree = voter.familyId
    ? () => {
        navigation.navigate(SCREENS.FAMILY_MAPPING, { familyId: voter.familyId });
      }
    : undefined;

  const tabs: { key: DetailTab; label: string; icon: string }[] = [
    { key: 'all', label: t('allDetails'), icon: 'format-list-bulleted' },
    { key: 'demographics', label: t('demographicsTitle'), icon: 'account-details' },
    { key: 'electoral', label: t('electoral'), icon: 'office-building' },
    { key: 'political', label: t('political'), icon: 'handshake' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* AppHeader Component */}
      <AppHeader
        statusBar="hidden"
        title={hindiName || t('voterDetails')}
        subtitle={voter.epicNo ? `${t('epicNumber')}: ${voter.epicNo}` : undefined}
        showBack={true}
        onBack={() => navigation.goBack()}
        variant="primary"
        rightElement={
          canEdit ? (
            <TouchableOpacity
              style={styles.headerEditBtn}
              onPress={handleEditPress}
              activeOpacity={0.8}
            >
              <MaterialDesignIcons name="pencil" size={15} color="#FFFFFF" />
              <Text style={styles.headerEditText}>{t('edit')}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Segmented Category Filter Tabs */}
      <VoterSectionTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={(tabKey) => setActiveTab(tabKey)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Card Header is always visible for high-level context */}
        <VoterDetailHeader voter={voter} t={t} theme={theme} />

        {/* Dynamic Sections Based on Active Segment Tab */}
        {(activeTab === 'all' || activeTab === 'demographics') && (
          <VoterDemographicsSection voter={voter} t={t} theme={theme} />
        )}

        {(activeTab === 'all' || activeTab === 'electoral') && (
          <VoterElectoralSection voter={voter} t={t} theme={theme} />
        )}

        {(activeTab === 'all' || activeTab === 'political') && (
          <VoterAffinitySection
            voter={voter}
            t={t}
            theme={theme}
            canEditInclination={canEditInclination}
            onEditParty={() => setPartyModalVisible(true)}
            onViewFamilyTree={handleViewFamilyTree}
          />
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar for Voting Status */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleVoted}
          style={[
            styles.voteToggleBtn,
            {
              backgroundColor: voter.isVoted ? '#DCFCE7' : theme.colors.primary,
              borderColor: voter.isVoted ? '#86EFAC' : theme.colors.primary,
            },
          ]}
        >
          <MaterialDesignIcons
            name={voter.isVoted ? 'check-circle' : 'vote-outline'}
            size={20}
            color={voter.isVoted ? '#15803D' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.voteToggleText,
              { color: voter.isVoted ? '#15803D' : '#FFFFFF' },
            ]}
          >
            {voter.isVoted ? t('markAsNotVoted') : t('markAsVoted')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reusable Common Supporting Party Modal Selector */}
      <PartySelectModal
        visible={partyModalVisible}
        onClose={() => setPartyModalVisible(false)}
        currentPartyId={voter.partyId}
        currentPartyName={voter.partyName || voter.supportingParty}
        voterName={hindiName || voter.englishName}
        canEdit={canEditInclination}
        onSelectParty={handleSelectParty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerEditText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(12.5),
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 95,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    ...getShadow(4, '#000000', 0.1),
  },
  voteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  voteToggleText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(14),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(14),
  },
});

export default VoterDetailScreen;
