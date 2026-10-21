import {
  fetchAssignedBoothsAction,
  loadMoreAssignedBoothsAction,
  setBoothSearchAction,
} from '../../store/actions/booths';
import { View } from 'react-native';
import { boothStyles } from './styles';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { MdFlatList } from '../../components';
import { BoothCard } from './components/BoothCard';
import { navigatToVoters } from '../../navigation';
import React, { useState, useCallback } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { BoothItem } from '../../store/reducers/booths';
import { BoothSkeleton } from './components/BoothSkeleton';
import { BoothEmptyState } from './components/BoothEmptyState';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';

export const AssignedBoothsScreen: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const { styles } = useAppTheme<ReturnType<typeof boothStyles>>(boothStyles);

  const { booths, loading, loadingMore, pagination, search } = useSelector(
    (state: RootState) => state.booths
  );
  const [searchInput, setSearchInput] = useState(search);

  // Debounced fetch on search or screen load (Rule 13)
  useDebouncedEffect(() => {
    dispatch(setBoothSearchAction(searchInput));
    dispatch(fetchAssignedBoothsAction(1, false, searchInput));
  }, [dispatch, searchInput], 250);

  const handleRefresh = useCallback(() => {
    dispatch(fetchAssignedBoothsAction(1, false, searchInput));
  }, [dispatch, searchInput]);

  const handleLoadMore = useCallback(() => {
    if (
      !loading &&
      !loadingMore &&
      pagination?.hasMore &&
      booths.length > 0 &&
      pagination.page < pagination.totalPages
    ) {
      dispatch(loadMoreAssignedBoothsAction());
    }
  }, [dispatch, loading, loadingMore, pagination, booths.length]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    dispatch(setBoothSearchAction(''));
    dispatch(fetchAssignedBoothsAction(1, false, ''));
  }, [dispatch]);

  const handleNavigateToVoters = useCallback((booth: BoothItem) => {
    navigatToVoters({
      boothId: booth.id,
      boothName: booth.name,
      boothNo: String(booth.boothNumber),
    });
  }, []);

  const renderBoothItem = useCallback(
    ({ item }: { item: BoothItem }) => (
      <BoothCard
        booth={item}
        onPress={handleNavigateToVoters}
        onPressVoters={handleNavigateToVoters}
      />
    ),
    [handleNavigateToVoters]
  );

  const renderSkeleton = useCallback(() => <BoothSkeleton />, []);
  return (
    <View style={styles.container}>
      {/* Search Header Container with Count badge */}
      <SearchHeaderWithFilter
        showBackButton
        value={searchInput}
        loadingCount={loading}
        currentCount={booths.length}
        onChangeText={setSearchInput}
        countLabel={t('assignedBooths')}
        placeholder={t('searchBoothsPlaceholder')}
      />

      {/* Booth List using MdFlatList with Pagination */}
      <MdFlatList
        data={booths}
        isLoading={loading}
        refresh={handleRefresh}
        onEndReachedThreshold={0.4}
        renderItem={renderBoothItem}
        onEndReached={handleLoadMore}
        renderSkeleton={renderSkeleton}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listPadding}
        keyExtractor={(item: BoothItem) => item.id}
        ListEmptyComponent={
          !loading ? (
            <BoothEmptyState
              searchQuery={searchInput}
              onClearSearch={handleClearSearch}
              onRefresh={handleRefresh}
            />
          ) : null
        }
        ListFooterComponent={loadingMore ? () => <BoothSkeleton /> : undefined}
      />
    </View>
  );
};

export default AssignedBoothsScreen;
