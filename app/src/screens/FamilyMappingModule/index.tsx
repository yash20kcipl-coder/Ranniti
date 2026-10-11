import NoData from '../../components/NoData';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { familyMappingStyles } from './styles';
import { FamilyCard } from './components/FamilyCard';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { FamilyKpiCards } from './components/FamilyKpiCards';
import { BoothMasterItem } from '../../store/reducers/master';
import { FamilyGroup } from '../../store/reducers/familyMapping';
import { FamilyFilterBar } from './components/FamilyFilterBar';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { FamilyCardSkeleton } from './components/FamilyCardSkeleton';
import { View, FlatList } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchFilterMasterDataAction } from '../../store/actions/master';
import { fetchFamilyHeadsAction } from '../../store/actions/familyMapping';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';
import { BoothSelectorModal } from '../TeamModule/components/BoothSelectorModal';

export const FamilyMappingScreen: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { styles } = useAppTheme<ReturnType<typeof familyMappingStyles>>(familyMappingStyles);

  // Redux state
  const user = useSelector((state: RootState) => state.auth?.user);
  const masterWards = useSelector((state: RootState) => state.master?.wards || []);
  const masterBooths = useSelector((state: RootState) => state.master?.booths || []);
  const { families, totalFamilies, totalMembers, votedMembers, loading } = useSelector((state: RootState) => state.familyMapping);

  const assignedBoothIds: string[] = user?.assignedBoothIds || [];
  const isVolunteer = user?.role === 'supporter' || user?.role === 'sub_leader' || user?.role === 'volunteer';

  // Local state
  const [search, setSearch] = useState('');
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);
  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>([]);
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<Record<string, boolean>>({});

  // Fetch master booth/ward data on mount
  useEffect(() => {
    dispatch(fetchFilterMasterDataAction());
  }, [dispatch]);

  // Debounced fetch for family mapping data
  useDebouncedEffect(
    () => {
      dispatch(
        fetchFamilyHeadsAction({
          search,
          boothIds: selectedBoothIds.length > 0 ? selectedBoothIds : undefined,
        })
      );
    },
    [dispatch, search, selectedBoothIds],
    250
  );

  const handleToggle = useCallback((familyId: string) => {
    setExpandedFamilyIds((prev) => ({ ...prev, [familyId]: !prev[familyId] }));
  }, []);

  const handleToggleVoted = useCallback(
    (voterId: string) => {
      dispatch(toggleVotedStatusAction(voterId));
    },
    [dispatch]
  );

  // Filter booths available for volunteer scoping
  const selectableBooths = useMemo(() => {
    if (isVolunteer && assignedBoothIds.length > 0) {
      return masterBooths.filter((b: any) =>
        assignedBoothIds.map(String).includes(String(b.id))
      );
    }
    return masterBooths;
  }, [masterBooths, isVolunteer, assignedBoothIds]);

  // Display label for selected booth button
  const selectedBoothName = useMemo(() => {
    if (selectedBoothIds.length === 0) return undefined;
    if (selectedBoothIds.length === 1) {
      const found = masterBooths.find((b: BoothMasterItem) => String(b.id) === String(selectedBoothIds[0]));
      return found ? (found.name || `Booth #${found.boothNumber}`) : `1 Booth`;
    }
    return `${selectedBoothIds.length} Booths`;
  }, [selectedBoothIds, masterBooths]);

  const canGoBack = Boolean(navigation?.canGoBack && navigation.canGoBack());
  const handleBackPress = () => {
    if (canGoBack) {
      navigation.goBack();
    } else if (navigation?.openDrawer) {
      navigation.openDrawer();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Search & Booth Filter Button */}
      <SearchHeaderWithFilter
        showBackButton
        onBackPress={handleBackPress}
        value={search}
        loadingCount={loading}
        onChangeText={setSearch}
        showFilter
        onFilterPress={() => setIsBoothModalOpen(true)}
        currentCount={totalFamilies || families.length}
        isFiltered={selectedBoothIds.length > 0}
        countLabel={t('familyMapping') || 'Family Mapping'}
        placeholder={t('searchFamilyHead') || 'Search family head name or EPIC...'}
      />

      <FlatList<FamilyGroup>
        data={families}
        keyExtractor={(item) => String(item.familyId)}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* KPI Summary Cards */}
            <FamilyKpiCards
              totalFamilies={totalFamilies || families.length}
              totalMembers={totalMembers}
              votedMembers={votedMembers}
            />

            {/* Subheader & Booth Selector Bar */}
            <FamilyFilterBar
              selectedBoothName={selectedBoothName}
              onOpenBoothModal={() => setIsBoothModalOpen(true)}
              onClearBoothFilter={() => setSelectedBoothIds([])}
              isVolunteer={isVolunteer}
              totalFamilies={totalFamilies || families.length}
            />
          </View>
        }
        renderItem={({ item }: { item: FamilyGroup }) => (
          <FamilyCard
            item={item}
            isExpanded={Boolean(expandedFamilyIds[item.familyId])}
            onToggle={handleToggle}
            onToggleVoted={handleToggleVoted}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingShimmerBox}>
              <FamilyCardSkeleton />
              <FamilyCardSkeleton />
              <FamilyCardSkeleton />
            </View>
          ) : (
            <NoData
              text={t('noFamiliesFound') || 'No Families Found'}
              description={t('tryAdjustingFilters') || 'Try adjusting your search query or booth filters.'}
              icon="home-search-outline"
            />
          )
        }
      />

      {/* Territory / Booth Filter Modal */}
      <BoothSelectorModal
        visible={isBoothModalOpen}
        onDismiss={() => setIsBoothModalOpen(false)}
        selectedBoothIds={selectedBoothIds}
        onSelectBooths={(boothIds) => {
          setSelectedBoothIds(boothIds);
          setIsBoothModalOpen(false);
        }}
        booths={selectableBooths}
        wards={masterWards}
        singleSelect={false}
        title={t('selectBooths') || 'Filter Booths'}
      />
    </View>
  );
};

export default FamilyMappingScreen;
