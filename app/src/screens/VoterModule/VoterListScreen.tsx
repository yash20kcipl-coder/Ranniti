import {
  MdFlatList,
  ScrollableFilterPills,
  SearchHeaderWithFilter,
  Fab,
} from '../../components';
import {
  fetchVotersAction,
  toggleVotedStatusAction,
  updateVoterPartyAction,
  setVoterFiltersAction,
} from '../../store/actions/voters';
import { voterListStyles } from './styles';
import { useLanguage } from '../../languages';
import { RootState } from '../../store/store';
import VoterCard from './components/VoterCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import VoterSkeleton from './components/VoterSkeleton';
import { useSelector, useDispatch } from 'react-redux';
import VoterFilterModal from './components/VoterFilterModal';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

const PARTIES = ['Party A', 'Party B', 'Independent', 'Undecided'];

export const VoterListScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const [partyModalVoterId, setPartyModalVoterId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const { voters, filters, loading } = useSelector((state: RootState) => state.voters);
  const { styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);

  useEffect(() => {
    dispatch(fetchVotersAction());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchVotersAction());
  }, [dispatch]);

  const filteredVoters = voters.filter((voter) => {
    const searchLower = (filters.search || '').toLowerCase();
    const matchesSearch =
      !filters.search ||
      (voter.name && voter.name.toLowerCase().includes(searchLower)) ||
      (voter.englishName && voter.englishName.toLowerCase().includes(searchLower)) ||
      (voter.epicNo && voter.epicNo.toLowerCase().includes(searchLower)) ||
      (voter.mobile && voter.mobile.includes(searchLower));

    const matchesParty =
      !filters.supportingParty ||
      filters.supportingParty === 'All' ||
      voter.supportingParty === filters.supportingParty;

    const matchesVoted =
      !filters.isVoted ||
      filters.isVoted === 'all' ||
      (filters.isVoted === 'voted' && voter.isVoted) ||
      (filters.isVoted === 'not_voted' && !voter.isVoted);

    const matchesGender =
      !filters.gender ||
      filters.gender === 'all' ||
      voter.gender === filters.gender;

    return matchesSearch && matchesParty && matchesVoted && matchesGender;
  });

  const handleToggleVoted = useCallback((voterId: string) => {
    const targetVoter = voters.find((v) => v.id === voterId);
    dispatch(toggleVotedStatusAction(voterId, targetVoter?.isVoted));
  }, [dispatch, voters]);

  const handleOpenPartyModal = useCallback((voterId: string) => {
    setPartyModalVoterId(voterId);
  }, []);

  const handleSelectParty = (party: string) => {
    if (partyModalVoterId) {
      dispatch(updateVoterPartyAction(partyModalVoterId, party));
      setPartyModalVoterId(null);
    }
  };

  const handleApplyExtraFilters = (newFilters: { isVoted?: string; supportingParty?: string; gender?: string }) => {
    dispatch(setVoterFiltersAction(newFilters));
  };

  const handleResetFilters = () => {
    dispatch(setVoterFiltersAction({ search: '', isVoted: 'all', supportingParty: 'All', gender: 'all' }));
  };

  const renderVoterItem = useCallback(({ item }: { item: any }) => (
    <VoterCard
      voter={item}
      onSelectParty={handleOpenPartyModal}
      onToggleVoted={handleToggleVoted}
      t={t}
    />
  ), [handleOpenPartyModal, handleToggleVoted, t]);

  const renderVoterSkeleton = useCallback(() => <VoterSkeleton />, []);

  return (
    <View style={styles.container}>
      {/* Search & Filter Header Container */}
      <SearchHeaderWithFilter
        showBackButton
        value={filters.search}
        placeholder={t('search')}
        filterOptions={[
          { id: 'all', label: t('all') },
          { id: 'voted', label: t('voted') },
          { id: 'not_voted', label: t('notVoted') },
        ]}
        activeFilterId={filters.isVoted || 'all'}
        onFilterPress={() => setIsFilterModalOpen(true)}
        onChangeText={(text: string) => dispatch(setVoterFiltersAction({ search: text }))}
        onSelectFilterOption={(id: string) => dispatch(setVoterFiltersAction({ isVoted: id }))}
      />

      {/* Voter List using MdFlatList with Pagination */}
      <MdFlatList
        isLoading={loading}
        data={filteredVoters}
        refresh={handleRefresh}
        renderItem={renderVoterItem}
        paginationProps={{ count: 30 }}
        showsVerticalScrollIndicator={false}
        renderSkeleton={renderVoterSkeleton}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listPadding}
      />

      {/* Reusable Common Floating Action Button */}
      <Fab
        size={20}
        icon="plus"
        onPress={() => navigation?.navigate('addeditvoter')}
      />

      {/* Search Filter Modal (uses AppModal) */}
      <VoterFilterModal
        t={t}
        filters={filters}
        visible={isFilterModalOpen}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyExtraFilters}
        onDismiss={() => setIsFilterModalOpen(false)}
      />

      {/* Supporting Party Modal Selector */}
      <Modal
        visible={Boolean(partyModalVoterId)}
        transparent
        animationType="fade"
        onRequestClose={() => setPartyModalVoterId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPartyModalVoterId(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('supportingParty')}</Text>
            {PARTIES.map((party) => (
              <TouchableOpacity
                key={party}
                style={styles.partyOption}
                onPress={() => handleSelectParty(party)}
              >
                <Text style={styles.partyOptionText}>{party}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default VoterListScreen;
