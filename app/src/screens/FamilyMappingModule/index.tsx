import NoData from '../../components/NoData';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { familyMappingStyles } from './styles';
import { FamilyCard } from './components/FamilyCard';
import { Skeleton } from '../../components/Skeleton';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { FamilyKpiCards } from './components/FamilyKpiCards';
import { BoothMasterItem } from '../../store/reducers/master';
import { FamilyGroup } from '../../store/reducers/familyMapping';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchFilterMasterDataAction } from '../../store/actions/master';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { fetchFamilyHeadsAction } from '../../store/actions/familyMapping';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';
import { BoothSelectorModal } from '../TeamModule/components/BoothSelectorModal';

export const FamilyMappingScreen: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const { theme, styles } = useAppTheme<ReturnType<typeof familyMappingStyles>>(familyMappingStyles);

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

  return (
    <View style={styles.container}>
      {/* Header with Search & Booth Filter Button */}
      <SearchHeaderWithFilter
        showBackButton
        value={search}
        loadingCount={loading}
        onChangeText={setSearch}
        currentCount={totalFamilies || families.length}
        isFiltered={selectedBoothIds.length > 0}
        countLabel={t('familyMapping') || 'Family Mapping'}
        placeholder={t('searchFamilyHead') || 'Search family head name or EPIC...'}
      />

      <FlatList<FamilyGroup>
        data={families}
        keyExtractor={(item) => String(item.familyId)}
        contentContainerStyle={styles.listPadding}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* KPI Summary Cards */}
            <FamilyKpiCards
              totalFamilies={totalFamilies || families.length}
              totalMembers={totalMembers}
              votedMembers={votedMembers}
            />

            {/* Subheader & Booth Selector Pill */}
            <View style={styles.filterBarRow}>
              <View style={styles.titleWrapper}>
                <MaterialDesignIcons name="home-account" size={16} color={theme.colors.primary} />
                <Text style={styles.titleText}>{t('familyMapping') || 'Family Mapping'}</Text>
              </View>

              <TouchableOpacity
                style={[styles.boothPill, Boolean(selectedBoothName) && styles.boothPillActive]}
                onPress={() => setIsBoothModalOpen(true)}
                activeOpacity={0.8}
              >
                <MaterialDesignIcons
                  name="map-marker-multiple"
                  size={14}
                  color={selectedBoothName ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[styles.boothPillText, Boolean(selectedBoothName) && styles.boothPillTextActive]}
                  numberOfLines={1}
                >
                  {selectedBoothName ||
                    (isVolunteer ? (t('assignedBooths') || 'Assigned Booths') : (t('filterBooth') || 'Filter Booth'))}
                </Text>
                <MaterialDesignIcons
                  name="chevron-down"
                  size={14}
                  color={selectedBoothName ? theme.colors.primary : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
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
              <Skeleton height={120} borderRadius={16} style={styles.shimmerMargin} />
              <Skeleton height={120} borderRadius={16} style={styles.shimmerMargin} />
              <Skeleton height={120} borderRadius={16} style={styles.shimmerMargin} />
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
