import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  ElectionBoothBar,
  OfflineSyncBanner,
  ElectionSkeleton,
  ElectionFilterType,
  HourlyTurnoutModal,
  BoothPickerModal,
} from './components';
import {
  SearchHeaderWithFilter,
  MdFlatList,
  NoData,
  ScrollView,
  ConfirmModal,
} from '../../components';
import { electionStyles } from './styles';
import {
  fetchMobilePollingVotersAction,
  markMobileVoterVotedAction,
  MobilePollingVoter,
  fetchMobileBoothTurnoutAction,
} from '../../store/actions/mobileElection';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { VoterCard } from '../VoterModule/components/VoterCard';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { fetchAssignedBoothsAction } from '../../store/actions/booths';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { WhatsAppTemplatePickerModal } from '../VoterModule/components/WhatsAppTemplatePickerModal';

export const ElectionPollingScreen: React.FC = () => {
  const { t } = useLanguage();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme, styles } = useAppTheme(electionStyles);

  // Redux store data
  const boothsState = useSelector((state: RootState) => state.booths);
  const electionState = useSelector((state: RootState) => state.election);
  const { voters, turnoutSummary, booth, election, loading, loadingMore, pagination, hourlyTurnout } = electionState;

  // Selected booth handling: selectedBoothId > route param > state.election.booth > first assigned booth
  const routeBoothId = route.params?.boothId;
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(routeBoothId || null);
  const activeBoothId = selectedBoothId || routeBoothId || booth?.id || boothsState.booths?.[0]?.id;

  // Modal states
  const [isUndoing, setIsUndoing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isHourlyLoading, setIsHourlyLoading] = useState(false);
  const [undoModalVisible, setUndoModalVisible] = useState(false);
  const [boothPickerVisible, setBoothPickerVisible] = useState(false);
  const [hourlyModalVisible, setHourlyModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ElectionFilterType>('all');
  const [templateModalVoter, setTemplateModalVoter] = useState<any>(null);
  const [voterToUndo, setVoterToUndo] = useState<MobilePollingVoter | null>(null);
  const [templateModalChannel, setTemplateModalChannel] = useState<'whatsapp' | 'sms'>('whatsapp');

  const handleOpenWhatsAppModal = useCallback((voter: any) => {
    setTemplateModalChannel('whatsapp');
    setTemplateModalVoter(voter);
  }, []);

  const handleSelectBooth = useCallback(
    (b: any) => {
      setSelectedBoothId(b.id);
      if (navigation.setParams) {
        navigation.setParams({ boothId: b.id } as any);
      }
      dispatch(
        fetchMobilePollingVotersAction({
          boothId: b.id,
          page: 1,
          limit: 50,
        })
      );
    },
    [dispatch, navigation]
  );

  // 1. Initial Booths fetch if empty
  useEffect(() => {
    if (!boothsState.booths?.length) {
      dispatch(fetchAssignedBoothsAction(1, false, ''));
    }
  }, [dispatch, boothsState.booths?.length]);

  // 2. Fetch voters with Debounced Effect (Rule 13)
  useDebouncedEffect(
    () => {
      let hasVotedParam: 'all' | 'voted' | 'not_voted' = 'all';
      if (activeTab === 'voted') hasVotedParam = 'voted';
      else if (activeTab === 'not_voted') hasVotedParam = 'not_voted';

      const trimmed = searchInput.trim();
      const isDigitsOnly = /^\d+$/.test(trimmed);

      dispatch(
        fetchMobilePollingVotersAction({
          boothId: activeBoothId,
          search: isDigitsOnly ? '' : trimmed,
          serialNo: isDigitsOnly ? parseInt(trimmed, 10) : null,
          hasVoted: hasVotedParam,
          page: 1,
          limit: 50,
        })
      );
    },
    [dispatch, activeBoothId, searchInput, activeTab],
    250
  );

  // 3. Refresh handler
  const handleRefresh = useCallback(() => {
    let hasVotedParam: 'all' | 'voted' | 'not_voted' = 'all';
    if (activeTab === 'voted') hasVotedParam = 'voted';
    else if (activeTab === 'not_voted') hasVotedParam = 'not_voted';

    const trimmed = searchInput.trim();
    const isDigitsOnly = /^\d+$/.test(trimmed);

    dispatch(
      fetchMobilePollingVotersAction({
        boothId: activeBoothId,
        search: isDigitsOnly ? '' : trimmed,
        serialNo: isDigitsOnly ? parseInt(trimmed, 10) : null,
        hasVoted: hasVotedParam,
        page: 1,
        limit: 50,
      })
    );
  }, [dispatch, activeBoothId, searchInput, activeTab]);

  // 4. Load More Infinite Scroll
  const handleLoadMore = useCallback(() => {
    if (
      !loading &&
      !loadingMore &&
      pagination &&
      pagination.page < pagination.totalPages
    ) {
      let hasVotedParam: 'all' | 'voted' | 'not_voted' = 'all';
      if (activeTab === 'voted') hasVotedParam = 'voted';
      else if (activeTab === 'not_voted') hasVotedParam = 'not_voted';

      const trimmed = searchInput.trim();
      const isDigitsOnly = /^\d+$/.test(trimmed);

      dispatch(
        fetchMobilePollingVotersAction(
          {
            boothId: activeBoothId,
            search: isDigitsOnly ? '' : trimmed,
            serialNo: isDigitsOnly ? parseInt(trimmed, 10) : null,
            hasVoted: hasVotedParam,
            page: pagination.page + 1,
            limit: 50,
          },
          true
        )
      );
    }
  }, [
    loading,
    loadingMore,
    pagination,
    dispatch,
    activeBoothId,
    searchInput,
    activeTab,
  ]);

  // 5. Single-Tap Voted Toggle handler
  const handleToggleVote = useCallback(
    (voterItem: MobilePollingVoter) => {
      if (voterItem.hasVoted) {
        // Trigger undo vote confirmation (Rule 24)
        setVoterToUndo(voterItem);
        setUndoModalVisible(true);
      } else {
        // Mark as voted immediately with optimistic update
        dispatch(
          markMobileVoterVotedAction({
            voterId: voterItem.id,
            hasVoted: true,
            boothId: activeBoothId,
            electionId: election?.id,
          })
        );
      }
    },
    [dispatch, activeBoothId, election?.id]
  );

  // 6. Confirm Undo Vote Action
  const handleConfirmUndoVote = useCallback(async () => {
    if (!voterToUndo) return;
    try {
      setIsUndoing(true);
      await dispatch(
        markMobileVoterVotedAction({
          voterId: voterToUndo.id,
          hasVoted: false,
          boothId: activeBoothId,
          electionId: election?.id,
        })
      );
      setUndoModalVisible(false);
      setVoterToUndo(null);
    } finally {
      setIsUndoing(false);
    }
  }, [dispatch, voterToUndo, activeBoothId, election?.id]);

  const currentBoothItem = useMemo(
    () => boothsState.booths?.find((b) => b.id === activeBoothId),
    [boothsState.booths, activeBoothId]
  );

  // Render individual voter card using standard VoterCard
  const renderVoterItem = useCallback(
    ({ item }: { item: MobilePollingVoter }) => {
      const bNum = booth?.boothNumber ?? currentBoothItem?.boothNumber;
      const bName = booth?.name || currentBoothItem?.name;
      const boothNo = bName || (bNum ? `Booth #${bNum}` : '');

      const wardNum = booth?.wardNumber ?? currentBoothItem?.wardNumber ?? item.sectionNo;
      const wardName = booth?.wardName || currentBoothItem?.wardName;
      const wardNo = wardName || (wardNum ? `Ward ${wardNum}` : '');

      const acName = booth?.acName || currentBoothItem?.acName || '';

      const adaptedVoter = {
        ...item,
        hindiName: item.name || '',
        englishName: item.engName || '',
        mobile: item.mobileNo || '',
        boothNo,
        wardNo,
        acName,
      };

      return (
        <VoterCard
          voter={adaptedVoter as any}
          t={t}
          canEditParty={false}
          onToggleVote={handleToggleVote}
          onWhatsAppPress={handleOpenWhatsAppModal}
        />
      );
    },
    [handleToggleVote, handleOpenWhatsAppModal, booth, currentBoothItem, t]
  );

  // Render Empty State using standard NoData component
  const renderEmptyState = useCallback(() => {
    if (loading) return null;
    return (
      <NoData
        icon="account-search-outline"
        text={t('noPollingVotersFound')}
      />
    );
  }, [loading, t]);

  // Render Footer loading spinner for infinite scroll
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [loadingMore, theme.colors.primary]);

  return (
    <View style={styles.container}>
      {/* Search Header Container (Standard Ranniti pattern matching VoterListScreen & BoothModule) */}
      <SearchHeaderWithFilter
        showBackButton
        onBackPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('dashboard');
        }}
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder={t('searchBySerialOrName') || 'Search by Serial #, Name, EPIC...'}
        filterOptions={[
          { id: 'all', label: t('filterAll') || 'All', count: turnoutSummary.totalVoters },
          { id: 'not_voted', label: t('filterYetToVote') || 'Yet to Vote', count: turnoutSummary.pendingCount },
          { id: 'voted', label: t('filterVoted') || 'Voted', count: turnoutSummary.votedCount },
        ]}
        activeFilterId={activeTab}
        onSelectFilterOption={(id) => setActiveTab(id as ElectionFilterType)}
        loadingCount={loading}
      />

      {/* Offline Sync Banner */}
      <OfflineSyncBanner electionId={election?.id} />

      {!activeBoothId && !loading && (!boothsState.booths || boothsState.booths.length === 0) ? (
        <ScrollView
          refreshApi={handleRefresh}
          contentContainerStyle={screenStyles.emptyContainer}
        >
          <NoData
            icon="office-building-marker-outline"
            text={t('noBoothAssignedForElection')}
            description={t('noBoothsFoundDesc')}
          />
        </ScrollView>
      ) : (
        <>
          {/* Booth Selector & Live Turnout Bar */}
          <ElectionBoothBar
            booth={booth}
            summary={turnoutSummary}
            canChangeBooth={(boothsState.booths?.length || 0) > 1}
            onChangeBooth={() => setBoothPickerVisible(true)}
            onPressSurge={async () => {
              setHourlyModalVisible(true);
              if (election?.id && activeBoothId) {
                setIsHourlyLoading(true);
                try {
                  await dispatch(fetchMobileBoothTurnoutAction(election.id, activeBoothId));
                } finally {
                  setIsHourlyLoading(false);
                }
              }
            }}
          />

          {/* Main Polling Voter List using MdFlatList */}
          <MdFlatList<MobilePollingVoter>
            data={voters}
            refresh={handleRefresh}
            onEndReachedThreshold={0.4}
            renderItem={renderVoterItem}
            onEndReached={handleLoadMore}
            keyExtractor={(item) => item.id}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            isLoading={loading && voters.length === 0}
            contentContainerStyle={styles.listContent}
            renderSkeleton={() => <ElectionSkeleton />}
          />
        </>
      )}

      {/* Booth Selector Modal */}
      <BoothPickerModal
        visible={boothPickerVisible}
        onClose={() => setBoothPickerVisible(false)}
        booths={boothsState.booths || []}
        activeBoothId={activeBoothId}
        onSelectBooth={handleSelectBooth}
      />

      {/* Undo Vote Confirmation Modal (Rule 24) */}
      <ConfirmModal
        variant="warning"
        isLoading={isUndoing}
        cancelText={t('cancel')}
        visible={undoModalVisible}
        confirmText={t('undoVote')}
        title={t('confirmUndoVoteTitle')}
        onConfirm={handleConfirmUndoVote}
        message={t('confirmUndoVoteMessage')}
        onDismiss={() => {
          setUndoModalVisible(false);
          setVoterToUndo(null);
        }}
      />

      {/* WhatsApp / SMS Template Picker Bottom Sheet Modal */}
      <WhatsAppTemplatePickerModal
        voter={templateModalVoter}
        visible={Boolean(templateModalVoter)}
        initialChannel={templateModalChannel}
        onClose={() => setTemplateModalVoter(null)}
      />

      {/* Hourly Turnout Surge Modal */}
      <HourlyTurnoutModal
        summary={turnoutSummary}
        hourlyData={hourlyTurnout}
        isLoading={isHourlyLoading}
        visible={hourlyModalVisible}
        booth={booth || currentBoothItem || null}
        onClose={() => setHourlyModalVisible(false)}
      />
    </View>
  );
};

const screenStyles = StyleSheet.create({
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});

export default ElectionPollingScreen;
