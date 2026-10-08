import {
  fetchTeamMembersAction,
  deleteTeamMemberAction,
} from '../../store/actions/team';
import { teamStyles } from './styles';
import { useLanguage } from '../../languages';
import { RootState } from '../../store/store';
import { SCREENS } from '../../navigation/constants';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { TabView, Route } from 'react-native-tab-view';
import { useNavigation } from '@react-navigation/native';
import { canCreateTeamMember } from '../../utils/permissionUtils';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';
import { View, FlatList, RefreshControl, useWindowDimensions } from 'react-native';


import { Fab, ConfirmModal } from '../../components';
import { TeamSkeleton } from './components/TeamSkeleton';
import { TeamMemberCard } from './components/TeamMemberCard';
import { TeamEmptyState } from './components/TeamEmptyState';

export const AddTeamMemberScreen: React.FC<{ route?: any }> = ({ route }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const layout = useWindowDimensions();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const auth = useSelector((state: RootState) => state.auth);
  const userAccess = (auth as any).access;
  const isAuthorizedToCreate = canCreateTeamMember(userAccess);
  const { styles, theme } = useAppTheme<ReturnType<typeof teamStyles>>(teamStyles);
  const { members, loading, creatableRoles, isSubmitting, pagination } = useSelector((state: RootState) => state.team);
  const routes = useMemo<Route[]>(() => {
    const list: Route[] = [];
    if (userAccess?.canCreateRoles?.includes('ac_leader') || (auth as any).role === 'pc_leader') {
      list.push({ key: 'ac_leader', title: t('acLeader') || 'AC Leader' });
    }
    list.push({ key: 'sub_leader', title: t('subLeader') || 'Sub Leader' });
    list.push({ key: 'supporter', title: t('supporter') || 'Supporter' });
    return list;
  }, [auth, userAccess, t]);

  const [index, setIndex] = useState(() => {
    if (route?.params?.initialRoleFilter && routes?.length) {
      const idx = routes.findIndex((r) => r.key === route.params.initialRoleFilter);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  const [selectedRoleFilter, setSelectedRoleFilter] = useState(
    route?.params?.initialRoleFilter || routes[0]?.key || 'sub_leader'
  );

  useEffect(() => {
    if (route?.params?.initialRoleFilter) {
      const targetRole = route.params.initialRoleFilter;
      const targetIdx = routes.findIndex((r) => r.key === targetRole);
      if (targetIdx !== -1) {
        setIndex(targetIdx);
        setSelectedRoleFilter(targetRole);
      }
    }
  }, [route?.params?.initialRoleFilter, routes]);

  // Fetch team members with debounce (Rule 13)
  useDebouncedEffect(() => {
    dispatch(fetchTeamMembersAction({
      search: search.trim() || undefined,
      role: selectedRoleFilter === 'all' ? undefined : selectedRoleFilter,
    }));
  }, [dispatch, search, selectedRoleFilter], 250);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await dispatch(
      fetchTeamMembersAction({
        search: search.trim() || undefined,
        role: selectedRoleFilter === 'all' ? undefined : selectedRoleFilter,
      })
    );
    setIsRefreshing(false);
  }, [dispatch, search, selectedRoleFilter]);

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setIndex(newIndex);
      const newRole = routes[newIndex]?.key || 'all';
      setSelectedRoleFilter(newRole);
      dispatch(
        fetchTeamMembersAction({
          search: search.trim() || undefined,
          role: newRole === 'all' ? undefined : newRole,
        })
      );
    },
    [dispatch, routes, search]
  );

  const handleEditMember = useCallback(
    (member: any) => {
      navigation.navigate(SCREENS.ONBOARD_TEAM_MEMBER, { member });
    },
    [navigation]
  );

  const handleDeleteMember = useCallback((member: any) => {
    setMemberToDelete(member);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (memberToDelete) {
      dispatch(
        deleteTeamMemberAction(memberToDelete.id, () => {
          setMemberToDelete(null);
        })
      );
    }
  }, [dispatch, memberToDelete]);

  const renderScene = useCallback(() => {
    if (loading && !isRefreshing) {
      return <TeamSkeleton />;
    }

    return (
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }: { item: any }) => (
          <TeamMemberCard
            member={item}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
            canManage={isAuthorizedToCreate}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <TeamEmptyState
            onClearFilters={() => {
              setSearch('');
              setIndex(0);
              setSelectedRoleFilter('all');
            }}
            canCreate={isAuthorizedToCreate}
            hasFilters={Boolean(search) || selectedRoleFilter !== 'all'}
            onAddPress={() => navigation.navigate(SCREENS.ONBOARD_TEAM_MEMBER)}
          />
        }
      />
    );
  }, [
    loading,
    isRefreshing,
    members,
    handleRefresh,
    theme,
    styles.listPadding,
    search,
    selectedRoleFilter,
    isAuthorizedToCreate,
    handleEditMember,
    handleDeleteMember,
    navigation,
  ]);


  return (
    <View style={styles.container}>
      {/* Reusable Search & Filter Header with Tabs as Pills */}
      <SearchHeaderWithFilter
        showBackButton
        value={search}
        loadingCount={loading}
        onChangeText={setSearch}
        placeholder={t('search')}
        activeFilterId={routes[index]?.key}
        countLabel={t('teamMembers') || 'Members'}
        totalCount={pagination?.total ?? members.length}
        filterOptions={routes.map((r) => ({ id: r.key, label: r.title || '' }))}
        onSelectFilterOption={(id) => {
          const newIdx = routes.findIndex((r) => r.key === id);
          if (newIdx !== -1) { handleIndexChange(newIdx) }
        }}
      />

      {/* Role Page Swiping with react-native-tab-view */}
      <TabView
        lazy
        style={{ flex: 1 }}
        renderScene={renderScene}
        renderTabBar={() => null}
        onIndexChange={handleIndexChange}
        navigationState={{ index, routes }}
        initialLayout={{ width: layout.width }}
      />

      {/* Floating Add Member FAB (Visible ONLY if authorized to onboard) */}
      {isAuthorizedToCreate && (
        <Fab
          size={20}
          icon="plus"
          onPress={() => navigation.navigate(SCREENS.ONBOARD_TEAM_MEMBER)}
        />
      )}

      {/* Confirmation Modal for Member Removal */}
      <ConfirmModal
        visible={Boolean(memberToDelete)}
        title={t('deleteConfirmTitle') || 'Remove Team Member'}
        message={
          memberToDelete
            ? `${t('deleteConfirmMessage') || 'Are you sure you want to remove this team member? This action cannot be undone.'} (${memberToDelete.name})`
            : ''
        }
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
        onDismiss={() => {
          if (!isSubmitting) {
            setMemberToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
};

export default AddTeamMemberScreen;
