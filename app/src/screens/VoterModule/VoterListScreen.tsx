import {
  MdFlatList,
  SearchHeaderWithFilter,
  Fab,
  PartySelectModal,
} from '../../components';
import {
  fetchVotersAction,
  loadMoreVotersAction,
  updateVoterPartyAction,
  setVoterFiltersAction,
  fetchSocietiesAction,
  loadMoreSocietiesAction,
  setVoterViewModeAction,
} from '../../store/actions/voters';
import toast from '../../utils/toast';
import { voterListStyles } from './styles';
import { useLanguage } from '../../languages';
import { RootState } from '../../store/store';
import VoterCard from './components/VoterCard';
import SocietyCard from './components/SocietyCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import VoterSkeleton from './components/VoterSkeleton';
import { useSelector, useDispatch } from 'react-redux';
import { TabView, Route } from 'react-native-tab-view';
import { View, useWindowDimensions } from 'react-native';
import VoterFilterModal from './components/VoterFilterModal';
import AppliedFiltersBar from './components/AppliedFiltersBar';
import { hasVoterPermission } from '../../utils/permissionUtils';
import VoterListEmptyState from './components/VoterListEmptyState';
import SocietyCardSkeleton from './components/SocietyCardSkeleton';
import VoterViewModeToggle from './components/VoterViewModeToggle';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WhatsAppTemplatePickerModal } from './components/WhatsAppTemplatePickerModal';
import { fetchFilterMasterDataAction, fetchMasterPartiesAction } from '../../store/actions/master';

export const VoterListScreen: React.FC<any> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const layout = useWindowDimensions();
  const master = useSelector((state: RootState) => state.master);
  const access = useSelector((state: RootState) => (state.auth as any)?.access);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const canCreateVoter = hasVoterPermission(access, 'canCreateVoter');
  const canEditParty = hasVoterPermission(access, 'canEditInclination');
  const [templateModalVoter, setTemplateModalVoter] = useState<any>(null);
  const [partyModalVoterId, setPartyModalVoterId] = useState<string | null>(null);
  const { styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);
  const [templateModalChannel, setTemplateModalChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const {
    voters,
    societies,
    viewMode,
    filters,
    loading,
    loadingMore,
    pagination,
    societiesLoading,
    societiesLoadingMore,
    societiesPagination,
  } = useSelector((state: RootState) => state.voters);
  const currentModalVoter = useMemo(() => voters.find((v) => v.id === partyModalVoterId), [voters, partyModalVoterId]);

  const [tabIndex, setTabIndex] = useState(viewMode === 'societies' ? 1 : 0);

  const routes = useMemo(() => [
    { key: 'voters', title: t('allVoters') || 'All Voters' },
    { key: 'societies', title: t('bySociety') || 'By Society' },
  ], [t]);

  // Quick filter pills for societies tab based on assigned booths
  const societyFilterOptions = useMemo(() => {
    const options = [{ id: 'all', label: t('all') || 'All' }];
    if (master.booths && master.booths.length > 0) {
      master.booths.forEach((b: any) => {
        options.push({
          id: b.id || String(b.boothNo),
          label: `${t('booth') || 'Booth'} ${b.boothNo || b.boothNumber}`,
        });
      });
    }
    return options;
  }, [master.booths, t]);

  // Sync tabIndex when viewMode changes in Redux
  useEffect(() => {
    const targetIndex = viewMode === 'societies' ? 1 : 0;
    if (tabIndex !== targetIndex) {
      setTabIndex(targetIndex);
    }
  }, [viewMode]);

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setTabIndex(newIndex);
      const newMode = newIndex === 1 ? 'societies' : 'voters';
      dispatch(setVoterViewModeAction(newMode));
    },
    [dispatch]
  );

  useEffect(() => {
    if (route?.params?.boothId) {
      dispatch(setVoterFiltersAction({ boothNo: route.params.boothId }));
    }
  }, [dispatch, route?.params?.boothId]);

  useDebouncedEffect(() => {
    dispatch(fetchFilterMasterDataAction());
    if (!master.parties || master.parties.length === 0) {
      dispatch(fetchMasterPartiesAction());
    }
  }, [dispatch, master.parties?.length], 200);

  // Auto-fetch societies when switching to societies view if list is empty
  useEffect(() => {
    if (viewMode === 'societies' && (!societies || societies.length === 0)) {
      dispatch(fetchSocietiesAction(1, false));
    }
  }, [dispatch, viewMode, societies?.length]);

  const handleRefresh = useCallback(() => {
    if (viewMode === 'societies') {
      dispatch(fetchSocietiesAction(1, false));
    } else {
      dispatch(fetchVotersAction(1, false));
    }
    dispatch(fetchFilterMasterDataAction());
    dispatch(fetchMasterPartiesAction());
  }, [dispatch, viewMode]);

  const handleLoadMoreVoters = useCallback(() => {
    if (
      !loading &&
      !loadingMore &&
      pagination?.hasMore &&
      voters.length > 0 &&
      pagination.page < pagination.totalPages
    ) {
      dispatch(loadMoreVotersAction());
    }
  }, [dispatch, loading, loadingMore, pagination, voters.length]);

  const handleLoadMoreSocieties = useCallback(() => {
    if (
      !societiesLoading &&
      !societiesLoadingMore &&
      societiesPagination?.hasMore &&
      societies.length > 0 &&
      societiesPagination.page < societiesPagination.totalPages
    ) {
      dispatch(loadMoreSocietiesAction());
    }
  }, [dispatch, societiesLoading, societiesLoadingMore, societiesPagination, societies.length]);

  const handleSelectSociety = useCallback(
    (societyName: string) => {
      // Switch TabView to voters view and filter directly by selected society
      handleIndexChange(0);
      dispatch(setVoterFiltersAction({ society: societyName }));
    },
    [handleIndexChange, dispatch]
  );

  const handleOpenPartyModal = useCallback((voterId: string) => {
    if (!canEditParty) {
      toast.error(t('noPermissionEditParty') || 'You do not have permission to change political party support');
      return;
    }
    setPartyModalVoterId(voterId);
  }, [canEditParty, t]);

  const handleSelectParty = (partyId: string | null, partyName: string) => {
    if (partyModalVoterId) {
      dispatch(updateVoterPartyAction(partyModalVoterId, partyId, partyName));
      setPartyModalVoterId(null);
    }
  };

  const handleApplyExtraFilters = (newFilters: any) => {
    dispatch(setVoterFiltersAction(newFilters));
  };

  const handleResetFilters = useCallback(() => {
    dispatch(
      setVoterFiltersAction({
        search: '',
        boothNo: 'All',
        acId: '',
        supportingParty: 'All',
        politicalView: 'All',
        isVoted: 'all',
        gender: 'all',
        ageGroup: '',
        voterType: '',
        isDead: '',
        influencerRole: '',
        society: '',
      })
    );
  }, [dispatch]);

  const handleRemoveFilter = useCallback((filterKey: string) => {
    const patch: any = {};
    if (filterKey === 'search') patch.search = '';
    else if (filterKey === 'boothNo') patch.boothNo = 'All';
    else if (filterKey === 'acId') patch.acId = '';
    else if (filterKey === 'supportingParty') patch.supportingParty = 'All';
    else if (filterKey === 'isVoted') patch.isVoted = 'all';
    else if (filterKey === 'gender') patch.gender = 'all';
    else if (filterKey === 'ageGroup') patch.ageGroup = '';
    else if (filterKey === 'voterType') patch.voterType = '';
    else if (filterKey === 'isDead') patch.isDead = '';
    else if (filterKey === 'influencerRole') patch.influencerRole = '';
    else if (filterKey === 'society') patch.society = '';
    dispatch(setVoterFiltersAction(patch));
  }, [dispatch]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filters.search && filters.search.trim()) ||
      (filters.boothNo && filters.boothNo !== 'All') ||
      (filters.acId && filters.acId !== 'All') ||
      (filters.supportingParty && filters.supportingParty !== 'All') ||
      (filters.isVoted && filters.isVoted !== 'all') ||
      (filters.gender && filters.gender !== 'all') ||
      Boolean(filters.ageGroup) ||
      Boolean(filters.voterType) ||
      (filters.isDead !== undefined && filters.isDead !== '' && filters.isDead !== 'all') ||
      Boolean(filters.influencerRole) ||
      Boolean(filters.society)
    );
  }, [filters]);

  const handleOpenWhatsAppModal = useCallback((voter: any) => {
    setTemplateModalChannel('whatsapp');
    setTemplateModalVoter(voter);
  }, []);

  const handleOpenSmsModal = useCallback((voter: any) => {
    setTemplateModalChannel('sms');
    setTemplateModalVoter(voter);
  }, []);

  const renderVoterItem = useCallback(({ item }: { item: any }) => (
    <VoterCard
      t={t}
      voter={item}
      canEditParty={canEditParty}
      onSelectParty={handleOpenPartyModal}
      onWhatsAppPress={handleOpenWhatsAppModal}
      onSmsPress={handleOpenSmsModal}
    />
  ), [canEditParty, handleOpenPartyModal, handleOpenWhatsAppModal, handleOpenSmsModal, t]);

  const renderSocietyItem = useCallback(({ item }: { item: any }) => (
    <SocietyCard
      item={item}
      onViewVoters={handleSelectSociety}
      t={t}
    />
  ), [handleSelectSociety, t]);

  const renderVoterSkeleton = useCallback(() => <VoterSkeleton />, []);
  const renderSocietySkeleton = useCallback(() => <SocietyCardSkeleton />, []);

  const renderScene = useCallback(
    ({ route: tabRoute }: { route: Route }) => {
      switch (tabRoute.key) {
        case 'societies':
          return (
            <MdFlatList
              data={societies}
              isLoading={societiesLoading}
              refresh={handleRefresh}
              onEndReachedThreshold={0.4}
              renderItem={renderSocietyItem}
              onEndReached={handleLoadMoreSocieties}
              showsVerticalScrollIndicator={false}
              renderSkeleton={renderSocietySkeleton}
              keyExtractor={(item: any) => item.societyName}
              contentContainerStyle={styles.listPadding}
              ListEmptyComponent={
                !societiesLoading ? (
                  <VoterListEmptyState
                    onRefresh={handleRefresh}
                    searchQuery={filters.search}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={handleResetFilters}
                    onOpenFilterModal={() => setIsFilterModalOpen(true)}
                    title={t('noSocietiesFound') || 'No societies found'}
                    description={t('noSocietiesFoundDesc') || 'No societies match your search or filter criteria'}
                    icon="office-building"
                    t={t}
                  />
                ) : null
              }
              ListFooterComponent={societiesLoadingMore ? () => <SocietyCardSkeleton /> : undefined}
            />
          );
        case 'voters':
        default:
          return (
            <MdFlatList
              data={voters}
              isLoading={loading}
              refresh={handleRefresh}
              onEndReachedThreshold={0.4}
              renderItem={renderVoterItem}
              onEndReached={handleLoadMoreVoters}
              showsVerticalScrollIndicator={false}
              renderSkeleton={renderVoterSkeleton}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={styles.listPadding}
              ListEmptyComponent={
                !loading ? (
                  <VoterListEmptyState
                    onRefresh={handleRefresh}
                    searchQuery={filters.search}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={handleResetFilters}
                    onOpenFilterModal={() => setIsFilterModalOpen(true)}
                    t={t}
                  />
                ) : null
              }
              ListFooterComponent={loadingMore ? () => <VoterSkeleton /> : undefined}
            />
          );
      }
    },
    [
      societies,
      societiesLoading,
      societiesLoadingMore,
      handleRefresh,
      renderSocietyItem,
      handleLoadMoreSocieties,
      renderSocietySkeleton,
      styles.listPadding,
      filters.search,
      hasActiveFilters,
      handleResetFilters,
      t,
      voters,
      loading,
      loadingMore,
      renderVoterItem,
      handleLoadMoreVoters,
      renderVoterSkeleton,
    ]
  );

  const currentCount = tabIndex === 1 ? societies.length : voters.length;
  const totalCount = tabIndex === 1
    ? (societiesPagination?.total ?? societies.length)
    : (pagination?.total ?? voters.length);
  const isLoading = tabIndex === 1 ? societiesLoading : loading;

  return (
    <View style={styles.container}>
      {/* Search & Filter Header Container */}
      <SearchHeaderWithFilter
        showBackButton
        value={filters.search}
        totalCount={totalCount}
        loadingCount={isLoading}
        currentCount={currentCount}
        isFiltered={hasActiveFilters}
        activeFilterId={tabIndex === 1 ? (filters.boothNo || 'all') : (filters.gender || 'all')}
        filterOptions={
          tabIndex === 1
            ? societyFilterOptions
            : [
              { id: 'all', label: t('all') },
              { id: 'Male', label: t('male') },
              { id: 'Female', label: t('female') },
            ]
        }
        countIcon={tabIndex === 1 ? 'building' : 'user'}
        onSelectFilterOption={(id: string) => {
          if (tabIndex === 1) {
            dispatch(setVoterFiltersAction({ boothNo: id === 'all' ? '' : id }));
          } else {
            dispatch(setVoterFiltersAction({ gender: id }));
          }
        }}
        onFilterPress={tabIndex !== 1 ? () => setIsFilterModalOpen(true) : undefined}
        placeholder={tabIndex === 1 ? (t('searchSocieties') || t('search')) : t('search')}
        onChangeText={(text: string) => dispatch(setVoterFiltersAction({ search: text }))}
        countLabel={tabIndex === 1 ? (t('societies') || 'Societies') : (t('votersCount') || 'Voters')}
      />

      {/* Segmented View Mode Toggle: [ 👤 All Voters | 🏢 By Society ] */}
      <VoterViewModeToggle
        viewMode={tabIndex === 1 ? 'societies' : 'voters'}
        onChangeViewMode={(mode) => handleIndexChange(mode === 'societies' ? 1 : 0)}
        voterCount={pagination?.total ?? voters.length}
        societyCount={societiesPagination?.total ?? societies.length}
        t={t}
      />

      {/* Dynamic Summary Bar & Applied Filter Chips */}
      <AppliedFiltersBar
        t={t}
        master={master}
        filters={filters}
        onClearAll={handleResetFilters}
        onRemoveFilter={handleRemoveFilter}
      />

      {/* Two-Tab Swiping Container via react-native-tab-view */}
      <TabView
        lazy
        style={{ flex: 1 }}
        renderScene={renderScene}
        renderTabBar={() => null}
        onIndexChange={handleIndexChange}
        navigationState={{ index: tabIndex, routes }}
        initialLayout={{ width: layout.width }}
      />

      {/* Reusable Common Floating Action Button (Only in voters view) */}
      {canCreateVoter && tabIndex === 0 && (
        <Fab
          size={20}
          icon="plus"
          onPress={() => navigation?.navigate('addeditvoter')}
        />
      )}

      {/* Search Filter Modal (uses AppModal) */}
      <VoterFilterModal
        t={t}
        filters={filters}
        visible={isFilterModalOpen}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyExtraFilters}
        onDismiss={() => setIsFilterModalOpen(false)}
      />

      {/* Reusable Common Supporting Party Modal Selector */}
      <PartySelectModal
        canEdit={canEditParty}
        onSelectParty={handleSelectParty}
        visible={Boolean(partyModalVoterId)}
        onClose={() => setPartyModalVoterId(null)}
        currentPartyId={currentModalVoter?.partyId}
        currentPartyName={currentModalVoter?.supportingParty}
        voterName={currentModalVoter ? (currentModalVoter.name || currentModalVoter.englishName) : undefined}
      />

      {/* WhatsApp / SMS Template Picker Bottom Sheet Modal */}
      <WhatsAppTemplatePickerModal
        voter={templateModalVoter}
        visible={Boolean(templateModalVoter)}
        initialChannel={templateModalChannel}
        onClose={() => setTemplateModalVoter(null)}
      />
    </View>
  );
};

export default VoterListScreen;
