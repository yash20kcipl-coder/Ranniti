import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { influencerStyles } from './styles';
import { InfluencerCard } from './components/InfluencerCard';
import { InfluencerKpiCards } from './components/InfluencerKpiCards';
import { InfluencerFilterBar } from './components/InfluencerFilterBar';
import { InfluencerCardSkeleton } from './components/InfluencerCardSkeleton';
import { BoothMasterItem } from '../../store/reducers/master';
import { SocialInfluencer } from '../../store/reducers/influencers';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { fetchInfluencersAction } from '../../store/actions/influencers';
import { fetchFilterMasterDataAction } from '../../store/actions/master';
import { BoothSelectorModal } from '../TeamModule/components/BoothSelectorModal';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';
import NoData from '../../components/NoData';

export const InfluencerMappingScreen: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { theme, styles } = useAppTheme<ReturnType<typeof influencerStyles>>(influencerStyles);

  // Redux state selectors
  const user = useSelector((state: RootState) => state.auth?.user);
  const masterWards = useSelector((state: RootState) => state.master?.wards || []);
  const masterBooths = useSelector((state: RootState) => state.master?.booths || []);
  const { influencers, totalCount, loading } = useSelector((state: RootState) => state.influencers);

  const assignedBoothIds: string[] = user?.assignedBoothIds || [];
  const isVolunteer = user?.role === 'supporter' || user?.role === 'sub_leader' || user?.role === 'volunteer';

  // Local state
  const [search, setSearch] = useState('');
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);
  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>([]);

  // Fetch filter master data on mount for booth picker modal
  useEffect(() => {
    dispatch(fetchFilterMasterDataAction());
  }, [dispatch]);

  // Debounced API fetch whenever search or booth filter changes (strictly type: 'social')
  useDebouncedEffect(
    () => {
      dispatch(
        fetchInfluencersAction({
          search,
          type: 'social',
          boothIds: selectedBoothIds.length > 0 ? selectedBoothIds : undefined,
        })
      );
    },
    [dispatch, search, selectedBoothIds],
    250
  );

  // Calculate total influenced voters across all fetched social influencers
  const totalInfluencedVoters = useMemo(() => {
    return influencers.reduce(
      (sum, inf) => sum + (inf.influencedVotersCount || inf.influencedVoters?.length || 0),
      0
    );
  }, [influencers]);

  // Filter booths available to user: volunteers see only their assigned booths
  const selectableBooths = useMemo(() => {
    if (isVolunteer && assignedBoothIds.length > 0) {
      return masterBooths.filter((b: any) =>
        assignedBoothIds.map(String).includes(String(b.id))
      );
    }
    return masterBooths;
  }, [masterBooths, isVolunteer, assignedBoothIds]);

  // Selected booth button display text
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
      {/* Header with Search and Booth Filter Button */}
      <SearchHeaderWithFilter
        showBackButton
        onBackPress={handleBackPress}
        value={search}
        onChangeText={setSearch}
        showFilter
        onFilterPress={() => setIsBoothModalOpen(true)}
        isFiltered={selectedBoothIds.length > 0}
        currentCount={totalCount || influencers.length}
        countLabel={t('socialInfluencers') || 'Social Influencers'}
        loadingCount={loading}
        placeholder={t('searchInfluencer') || 'Search by name, mobile, or profession...'}
      />

      <FlatList
        data={influencers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* KPI Cards Header for Social Influencers */}
            <InfluencerKpiCards
              totalCount={totalCount || influencers.length}
              totalInfluencedVoters={totalInfluencedVoters}
            />

            {/* Title & Booth Filter Pill */}
            <InfluencerFilterBar
              selectedBoothName={selectedBoothName}
              onOpenBoothModal={() => setIsBoothModalOpen(true)}
              onClearBoothFilter={() => setSelectedBoothIds([])}
              isVolunteer={isVolunteer}
              totalCount={totalCount || influencers.length}
            />
          </View>
        }
        renderItem={({ item }: { item: SocialInfluencer }) => <InfluencerCard item={item} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingShimmerBox}>
              <InfluencerCardSkeleton />
              <InfluencerCardSkeleton />
              <InfluencerCardSkeleton />
            </View>
          ) : (
            <NoData
              text={t('noInfluencersFound') || 'No Influencers Found'}
              description={t('tryAdjustingFilters') || 'Try adjusting your search query or booth filters.'}
              icon="account-search-outline"
            />
          )
        }
      />

      {/* Territory / Booth Filter Modal */}
      <BoothSelectorModal
        wards={masterWards}
        singleSelect={false}
        booths={selectableBooths}
        visible={isBoothModalOpen}
        onSelectBooths={(boothIds) => {
          setSelectedBoothIds(boothIds);
          setIsBoothModalOpen(false);
        }}
        selectedBoothIds={selectedBoothIds}
        onDismiss={() => setIsBoothModalOpen(false)}
        title={t('selectBooths') || 'Filter Booths'}
      />
    </View>
  );
};

export default InfluencerMappingScreen;
