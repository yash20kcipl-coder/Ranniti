import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { TabView, Route } from 'react-native-tab-view';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchSyncedContactsAction,
  syncDeviceContactsAction,
  removeSyncedContactAction,
  setDeviceContactsAction,
} from '../../store/actions/contactSync';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { SyncedContactVoter, DeviceContactItem } from '../../store/reducers/contactSync';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { Skeleton } from '../../components/Skeleton';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SearchHeaderWithFilter } from '../../components/SearchHeaderWithFilter';
import { PermissionsPopUp } from '../../components/Permissions';
import { MyContactCard } from './components/MyContactCard';
import { SyncedContactCard } from './components/SyncedContactCard';
import { fetchDeviceContacts } from '../../utils/contactReader';
import toast from '../../utils/toast';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { Users, Contact, RefreshCw, BookUser } from 'lucide-react-native';

export const ContactSyncScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const layout = useWindowDimensions();
  const { theme } = useAppTheme(() => ({}));

  const { deviceContacts, syncedVoters, loading, syncing, totalSyncedCount, pagination } = useSelector((state: RootState) => state.contactSync);

  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [isUnlinkingLoading, setIsUnlinkingLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [unlinkingTarget, setUnlinkingTarget] = useState<SyncedContactVoter | null>(null);

  const routes = useMemo<Route[]>(
    () => [
      { key: 'my_contacts', title: t('myContacts') || 'My Contacts' },
      { key: 'synced_contacts', title: t('syncedContacts') || 'Synced Contacts' },
    ],
    [t]
  );

  // Debounced fetch for synced contacts search
  useDebouncedEffect(
    () => {
      dispatch(fetchSyncedContactsAction(1, false, search));
    },
    [search],
    250
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchSyncedContactsAction(1, false, search));
  }, [dispatch, search]);

  const handleLoadMore = useCallback(() => {
    if (!loading && pagination.page < pagination.totalPages) {
      dispatch(fetchSyncedContactsAction(pagination.page + 1, true, search));
    }
  }, [dispatch, loading, pagination.page, pagination.totalPages, search]);

  const handleSyncPress = useCallback(() => {
    setShowPermissionModal(true);
  }, []);

  const handlePermissionChecked = useCallback(
    async (granted: boolean) => {
      setShowPermissionModal(false);
      if (!granted) {
        toast.error(t('permissionDenied') || 'Contacts permission denied');
        return;
      }

      try {
        const contacts = await fetchDeviceContacts();
        if (contacts.length > 0) {
          dispatch(setDeviceContactsAction(contacts));
          dispatch(
            syncDeviceContactsAction(
              contacts.map((c) => ({ name: c.name, phone: c.phone }))
            )
          );
        } else {
          dispatch(syncDeviceContactsAction());
        }
      } catch (err) {
        toast.error('Failed to read device contacts');
      }
    },
    [dispatch, t]
  );

  const handleToggleVoted = useCallback(
    (voterId: string) => {
      dispatch(toggleVotedStatusAction(voterId));
    },
    [dispatch]
  );

  const handleConfirmUnlink = async () => {
    if (!unlinkingTarget) return;
    setIsUnlinkingLoading(true);
    try {
      await dispatch(removeSyncedContactAction(unlinkingTarget.voterId));
    } finally {
      setIsUnlinkingLoading(false);
      setUnlinkingTarget(null);
    }
  };

  // Filter device contacts locally by search term
  const filteredDeviceContacts = useMemo(() => {
    if (!search || !search.trim()) return deviceContacts;
    const term = search.trim().toLowerCase();
    return deviceContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''))
    );
  }, [deviceContacts, search]);

  const renderSkeletonList = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={styles.skeletonCol}>
              <Skeleton width="60%" height={16} borderRadius={4} />
              <Skeleton width="80%" height={14} borderRadius={4} />
              <Skeleton width="40%" height={12} borderRadius={4} />
            </View>
          </View>
          <View style={styles.skeletonActions}>
            <Skeleton width={70} height={28} borderRadius={6} />
            <Skeleton width={90} height={28} borderRadius={6} />
            <Skeleton width="40%" height={28} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );

  // Tab 1: My Contacts Scene
  const renderMyContactsScene = () => {
    return (
      <FlatList
        data={filteredDeviceContacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: DeviceContactItem }) => (
          <MyContactCard item={item} theme={theme} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <BookUser {...({ size: 36, color: '#94A3B8' } as any)} />
            </View>
            <Text style={styles.emptyTitle}>{t('noDeviceContacts')}</Text>
            <Text style={styles.emptySubtitle}>{t('noDeviceContactsDesc')}</Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={handleSyncPress}
              disabled={syncing}
              activeOpacity={0.8}
            >
              <RefreshCw {...({ size: 14, color: '#FFFFFF' } as any)} />
              <Text style={styles.emptyActionBtnText}>{t('syncContactsBtn')}</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={handleSyncPress}
            tintColor={theme.colors.primary || '#1E40AF'}
          />
        }
      />
    );
  };

  // Tab 2: Synced / Matched Voters Scene
  const renderSyncedContactsScene = () => {
    if (loading && syncedVoters.length === 0) {
      return renderSkeletonList();
    }

    return (
      <FlatList
        data={syncedVoters}
        keyExtractor={(item) => item.voterId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: SyncedContactVoter }) => (
          <SyncedContactCard
            item={item}
            theme={theme}
            onToggleVoted={handleToggleVoted}
            onRequestUnlink={setUnlinkingTarget}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Users {...({ size: 36, color: '#94A3B8' } as any)} />
            </View>
            <Text style={styles.emptyTitle}>{t('noSyncedContacts')}</Text>
            <Text style={styles.emptySubtitle}>{t('noSyncedContactsDesc')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading && syncedVoters.length > 0}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary || '#1E40AF'}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
      />
    );
  };

  const renderScene = ({ route }: { route: Route }) => {
    switch (route.key) {
      case 'my_contacts':
        return renderMyContactsScene();
      case 'synced_contacts':
        return renderSyncedContactsScene();
      default:
        return null;
    }
  };

  const currentCount =
    index === 0
      ? filteredDeviceContacts.length
      : pagination?.totalRecords ?? totalSyncedCount;

  const countLabel =
    index === 0
      ? (t('contacts') || 'Contacts')
      : (t('matchedInPhone') || 'Matched');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background || '#F8FAFC' }]}>
      {/* Reusable Search & Filter Header with Tabs as Pills */}
      <SearchHeaderWithFilter
        showBackButton
        value={search}
        loadingCount={loading}
        onChangeText={setSearch}
        placeholder={t('search')}
        activeFilterId={routes[index]?.key}
        filterOptions={routes.map((r) => ({ id: r.key, label: r.title || '' }))}
        onSelectFilterOption={(id) => {
          const newIdx = routes.findIndex((r) => r.key === id);
          if (newIdx !== -1) {
            setIndex(newIdx);
          }
        }}
      />

      {/* Sync Phone Contacts Action Banner */}
      <View style={styles.syncBanner}>
        <View style={styles.syncBannerInfo}>
          <View style={styles.syncIconBox}>
            <Contact {...({ size: 18, color: '#1E40AF' } as any)} />
          </View>
          <View style={styles.syncTexts}>
            <Text style={styles.syncTitle}>{t('contactSyncTitle')}</Text>
            <Text style={styles.syncSubtitle}>
              {totalSyncedCount} {t('matchedInPhone')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
          onPress={handleSyncPress}
          disabled={syncing}
          activeOpacity={0.8}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <RefreshCw {...({ size: 14, color: '#FFFFFF' } as any)} />
          )}
          <Text style={styles.syncBtnText}>
            {syncing ? t('loading') : t('syncContactsBtn')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Two-Tab Swiping Container via react-native-tab-view */}
      <TabView
        lazy
        style={{ flex: 1 }}
        renderScene={renderScene}
        renderTabBar={() => null}
        onIndexChange={setIndex}
        navigationState={{ index, routes }}
        initialLayout={{ width: layout.width }}
      />

      {/* Confirmation Modal for Unlinking Contact */}
      <ConfirmModal
        variant="danger"
        cancelText={t('cancel')}
        title={t('unlinkContact')}
        isLoading={isUnlinkingLoading}
        onConfirm={handleConfirmUnlink}
        confirmText={t('unlinkContact')}
        visible={Boolean(unlinkingTarget)}
        message={t('unlinkContactConfirm')}
        onDismiss={() => setUnlinkingTarget(null)}
      />
      {showPermissionModal && (
        <PermissionsPopUp
          type="contacts"
          onCheck={handlePermissionChecked}
          onClose={() => setShowPermissionModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  syncBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  syncIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTexts: {
    gap: 2,
    flex: 1,
  },
  syncTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
    color: '#0F172A',
  },
  syncSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    color: '#64748B',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncBtnDisabled: {
    opacity: 0.65,
  },
  syncBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(11),
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    gap: 10,
    flexGrow: 1,
  },
  skeletonContainer: {
    padding: 14,
    gap: 10,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonCol: {
    flex: 1,
    gap: 6,
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(16),
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(12),
    color: '#FFFFFF',
  },
});

export default ContactSyncScreen;
