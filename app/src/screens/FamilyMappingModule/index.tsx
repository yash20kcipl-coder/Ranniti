import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { View, StyleSheet } from 'react-native';
import React, { useCallback, useState } from 'react';
import MdFlatList from '../../components/MdFlatList';
import { FamilyCard } from './components/FamilyCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import useDebouncedEffect from '../../hooks/useDebouncedEffect';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { FamilyCardSkeleton } from './components/FamilyCardSkeleton';
import type { FamilyGroup } from '../../store/reducers/familyMapping';
import { fetchFamilyHeadsAction } from '../../store/actions/familyMapping';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';

export const FamilyMappingScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { theme } = useAppTheme();

  const { families, loading } = useSelector((state: RootState) => state.familyMapping);
  const [search, setSearch] = useState('');
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<Record<string, boolean>>({});

  const handleRefresh = useCallback(() => {
    dispatch(fetchFamilyHeadsAction(search));
  }, [dispatch, search]);

  useDebouncedEffect(() => {
    dispatch(fetchFamilyHeadsAction(search));
  }, [search], 300);

  const handleToggle = useCallback((familyId: string) => {
    setExpandedFamilyIds(prev => ({ ...prev, [familyId]: !prev[familyId] }));
  }, []);

  const handleToggleVoted = useCallback((voterId: string) => {
    dispatch(toggleVotedStatusAction(voterId));
  }, [dispatch]);

  const filteredFamilies = families; // API already filters

  const renderItem = useCallback(({ item }: { item: FamilyGroup }) => (
    <FamilyCard
      item={item}
      onToggle={handleToggle}
      onToggleVoted={handleToggleVoted}
      isExpanded={!!expandedFamilyIds[item.familyId]}
    />
  ), [expandedFamilyIds, handleToggle, handleToggleVoted]);

  const renderSkeleton = useCallback(() => <FamilyCardSkeleton />, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background || '#F8FAFC' }]}>
      <SearchHeaderWithFilter
        value={search}
        showBackButton
        onChangeText={setSearch}
        placeholder={t('searchFamilyHead')}
      />

      <MdFlatList<FamilyGroup>
        isLoading={loading}
        data={filteredFamilies}
        renderItem={renderItem}
        refresh={handleRefresh}
        renderSkeleton={renderSkeleton}
        paginationProps={{ count: 20 }}
        empty={{ text: t('noFamiliesFound'), }}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item: FamilyGroup) => item.familyId}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default FamilyMappingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    paddingBottom: 30,
  },
  separator: {
    height: 5,
  },
});
