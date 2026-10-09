import {
  MdFlatList,
  SearchHeaderWithFilter,
  Fab,
  PartySelectModal,
} from '../../components';
import {
  fetchVotersAction,
  loadMoreVotersAction,
  toggleVotedStatusAction,
  updateVoterPartyAction,
  setVoterFiltersAction,
} from '../../store/actions/voters';
import { View } from 'react-native';
import toast from '../../utils/toast';
import { voterListStyles } from './styles';
import { useLanguage } from '../../languages';
import { RootState } from '../../store/store';
import VoterCard from './components/VoterCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import VoterSkeleton from './components/VoterSkeleton';
import { useSelector, useDispatch } from 'react-redux';
import VoterFilterModal from './components/VoterFilterModal';
import AppliedFiltersBar from './components/AppliedFiltersBar';
import { hasVoterPermission } from '../../utils/permissionUtils';
import VoterListEmptyState from './components/VoterListEmptyState';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchFilterMasterDataAction, fetchMasterPartiesAction } from '../../store/actions/master';

export const VoterListScreen: React.FC<any> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const master = useSelector((state: RootState) => state.master);
  const access = useSelector((state: RootState) => (state.auth as any)?.access);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const canCreateVoter = hasVoterPermission(access, 'canCreateVoter');
  const canEditParty = hasVoterPermission(access, 'canEditInclination');
  const [partyModalVoterId, setPartyModalVoterId] = useState<string | null>(null);
  const { styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);
  const { voters, filters, loading, loadingMore, pagination } = useSelector((state: RootState) => state.voters);
  const currentModalVoter = useMemo(() => voters.find((v) => v.id === partyModalVoterId), [voters, partyModalVoterId]);

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

  const handleRefresh = useCallback(() => {
    dispatch(fetchVotersAction(1, false));
    dispatch(fetchFilterMasterDataAction());
    dispatch(fetchMasterPartiesAction());
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
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

  const handleToggleVoted = useCallback((voterId: string) => {
    const targetVoter = voters.find((v) => v.id === voterId);
    dispatch(toggleVotedStatusAction(voterId, targetVoter?.isVoted));
  }, [dispatch, voters]);

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
      Boolean(filters.influencerRole)
    );
  }, [filters]);

  const renderVoterItem = useCallback(({ item }: { item: any }) => (
    <VoterCard
      t={t}
      voter={item}
      canEditParty={canEditParty}
      onSelectParty={handleOpenPartyModal}
      onToggleVoted={handleToggleVoted}
    />
  ), [canEditParty, handleOpenPartyModal, handleToggleVoted, t]);

  const renderVoterSkeleton = useCallback(() => <VoterSkeleton />, []);

  return (
    <View style={styles.container}>
      {/* Search & Filter Header Container */}
      <SearchHeaderWithFilter
        showBackButton
        value={filters.search}
        loadingCount={loading}
        placeholder={t('search')}
        currentCount={voters.length}
        isFiltered={hasActiveFilters}
        filterOptions={[
          { id: 'all', label: t('all') },
          { id: 'voted', label: t('voted') },
          { id: 'not_voted', label: t('notVoted') },
        ]}
        activeFilterId={filters.isVoted || 'all'}
        totalCount={pagination?.total ?? voters.length}
        onFilterPress={() => setIsFilterModalOpen(true)}
        onChangeText={(text: string) => dispatch(setVoterFiltersAction({ search: text }))}
        onSelectFilterOption={(id: string) => dispatch(setVoterFiltersAction({ isVoted: id }))}
      />

      {/* Dynamic Summary Bar & Applied Filter Chips */}
      <AppliedFiltersBar
        t={t}
        master={master}
        filters={filters}
        onClearAll={handleResetFilters}
        onRemoveFilter={handleRemoveFilter}
      />

      {/* Voter List using MdFlatList with Pagination */}
      <MdFlatList
        data={voters}
        isLoading={loading}
        refresh={handleRefresh}
        onEndReachedThreshold={0.4}
        renderItem={renderVoterItem}
        onEndReached={handleLoadMore}
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

      {/* Reusable Common Floating Action Button */}
      {canCreateVoter && (
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
    </View>
  );
};

export default VoterListScreen;
