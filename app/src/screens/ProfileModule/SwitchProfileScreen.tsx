import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fetchLinkedProfilesAction, switchProfileAction } from '../../store/actions/auth';
import { navigateToDashboard } from '../../navigation/navigationUtils';
import { SafeImage } from '../../components/SafeImage';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Skeleton } from '../../components/Skeleton';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { LinkedProfileItem } from './components/ProfileSwitchSection';

const formatDisplayPhone = (raw?: string) => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    return `${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return raw;
};

const getInitials = (name?: string) => {
  const parts = (name || 'C').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0] || 'C').slice(0, 2).toUpperCase();
};

const getAvatarTileColor = (role?: string, isActive?: boolean) => {
  if (isActive) return '#9E0E9A';
  switch (role) {
    case 'pc_leader':
      return '#6D28D9';
    case 'ac_leader':
      return '#2563EB';
    case 'sub_leader':
      return '#059669';
    default:
      return '#7C3AED';
  }
};

const getRoleBadgeColors = (role?: string) => {
  switch (role) {
    case 'pc_leader':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    case 'ac_leader':
      return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' };
    case 'sub_leader':
      return { bg: '#ECFDF5', text: '#15803D', border: '#BBF7D0' };
    default:
      return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' };
  }
};

export const SwitchProfileScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { t, language, setLanguage } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const canGoBack = Boolean(navigation?.canGoBack && navigation.canGoBack());
  const [pendingProfile, setPendingProfile] = useState<LinkedProfileItem | null>(null);
  const linkedProfiles: LinkedProfileItem[] = useSelector((state: RootState) => state.auth.linkedProfiles || []);
  const [loading, setLoading] = useState(linkedProfiles.length === 0);

  useEffect(() => {
    let mounted = true;
    dispatch(fetchLinkedProfilesAction()).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchLinkedProfilesAction()).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch]);

  const handleConfirmSwitch = async () => {
    if (!pendingProfile) return;
    setIsSwitching(true);
    try {
      await dispatch(switchProfileAction(pendingProfile.tenantDbName));
    } finally {
      setIsSwitching(false);
      setPendingProfile(null);
    }
  };

  const handleLeftHeaderPress = () => {
    if (canGoBack) {
      navigation.goBack();
    } else if (navigation?.openDrawer) {
      navigation.openDrawer();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const { activeProfile, otherProfiles } = useMemo(() => {
    const active = linkedProfiles.find((p) => p.isCurrent) || null;
    const others = linkedProfiles.filter((p) => !p.isCurrent);
    return { activeProfile: active, otherProfiles: others };
  }, [linkedProfiles]);

  const displayPhone = formatDisplayPhone(user?.mobile || activeProfile?.mobile || user?.email || '');

  const renderAvatarTile = (item: LinkedProfileItem, isActive: boolean) => {
    const avatarUrl = (item as any).avatar;
    if (avatarUrl) {
      return (
        <SafeImage
          name={item.name || item.organizationName}
          src={avatarUrl}
          containerStyles={styles.avatarTile}
          placeholderType="avatar"
          alt={item.name}
        />
      );
    }
    return (
      <View style={[styles.avatarTile, { backgroundColor: getAvatarTileColor(item.role, isActive) }]}>
        <Text style={styles.avatarInitials}>{getInitials(item.name || item.organizationName)}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Ranniti Primary Header */}
        <View
          style={[
            styles.headerContainer,
            { backgroundColor: theme.colors.header, paddingTop: Math.max(insets.top, 16) + 10 },
          ]}
        >
          <View style={styles.decorCircleLarge} />
          <View style={styles.decorCircleSmall} />

          {/* Top Navigation Row */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleLeftHeaderPress}
                style={styles.headerBackBtn}
              >
                <MaterialDesignIcons
                  name={canGoBack ? 'arrow-left' : 'menu'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {t('switchCampaignTitle')}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {t('switchCampaignSubtitle')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleLanguage}
              style={styles.langPill}
            >
              <MaterialDesignIcons name="web" size={14} color="#FFFFFF" />
              <Text style={styles.langPillText}>{language.toUpperCase()}</Text>
              <MaterialDesignIcons name="chevron-down" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Signed-in Phone & Campaign Count Row */}
          <View style={styles.headerBottomRow}>
            <View style={styles.signedInLeft}>
              <View style={styles.phoneIconCircle}>
                <MaterialDesignIcons name="phone-outline" size={16} color="#E0E7FF" />
              </View>
              <View>
                <Text style={styles.signedInLabel}>{t('signedInWith')}</Text>
                <Text style={styles.signedInPhone}>{displayPhone}</Text>
              </View>
            </View>

            <View style={styles.linkedCountPill}>
              <Text style={styles.linkedCountText}>
                {linkedProfiles.length} {t('campaignsLinked')}
              </Text>
            </View>
          </View>
        </View>

        {/* Overlapping Content Area */}
        <View style={styles.bodyContainer}>
          {loading && linkedProfiles.length === 0 ? (
            <View style={styles.skeletonWrap}>
              <Skeleton height={172} borderRadius={22} />
              <Skeleton height={94} borderRadius={18} />
              <Skeleton height={94} borderRadius={18} />
            </View>
          ) : (
            <>
              {/* Currently Active Floating Card */}
              {activeProfile && (
                <View
                  style={[
                    styles.activeCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.activeHeaderRow}>
                    <View style={styles.activeLabelRow}>
                      <View style={styles.greenDot} />
                      <Text style={styles.currentlyActiveText}>{t('currentlyActive')}</Text>
                    </View>
                    <MaterialDesignIcons name="check-circle" size={18} color="#16A34A" />
                  </View>

                  <View style={styles.profileRow}>
                    {renderAvatarTile(activeProfile, true)}
                    <View style={styles.profileTextCol}>
                      <Text style={[styles.profileName, { color: theme.colors.text }]} numberOfLines={1}>
                        {activeProfile.name}
                      </Text>
                      <View style={styles.orgRow}>
                        <MaterialDesignIcons name="home-outline" size={13} color={theme.colors.textSecondary} />
                        <Text style={[styles.orgSubText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                          {activeProfile.organizationName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: getRoleBadgeColors(activeProfile.role).bg,
                            borderColor: getRoleBadgeColors(activeProfile.role).border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            { color: getRoleBadgeColors(activeProfile.role).text },
                          ]}
                        >
                          {activeProfile.roleName || activeProfile.role}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => navigateToDashboard(activeProfile.role)}
                    style={[styles.continueCta, { backgroundColor: theme.colors.primary }]}
                  >
                    <Text style={styles.continueCtaText}>{t('continueToDashboard')}</Text>
                    <View style={styles.continueArrowBox}>
                      <MaterialDesignIcons name="chevron-right" size={18} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Other Campaigns Section */}
              {otherProfiles.length > 0 && (
                <View style={styles.otherSection}>
                  <View style={styles.otherHeaderRow}>
                    <Text style={[styles.otherSectionTitle, { color: theme.colors.textSecondary }]}>
                      {t('yourOtherCampaigns')}
                    </Text>
                    <View style={[styles.otherCountBadge, { backgroundColor: theme.colors.primary + '18' }]}>
                      <Text style={[styles.otherCountText, { color: theme.colors.primary }]}>
                        {otherProfiles.length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.otherList}>
                    {otherProfiles.map((item) => {
                      const roleColors = getRoleBadgeColors(item.role);
                      return (
                        <TouchableOpacity
                          key={item.tenantDbName}
                          activeOpacity={0.8}
                          onPress={() => setPendingProfile(item)}
                          style={[
                            styles.otherCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={styles.otherCardLeft}>
                            {renderAvatarTile(item, false)}
                            <View style={styles.profileTextCol}>
                              <Text style={[styles.profileName, { color: theme.colors.text }]} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <View style={styles.orgRow}>
                                <MaterialDesignIcons name="home-outline" size={13} color={theme.colors.textSecondary} />
                                <Text style={[styles.orgSubText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                  {item.organizationName}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.roleBadge,
                                  { backgroundColor: roleColors.bg, borderColor: roleColors.border },
                                ]}
                              >
                                <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                                  {item.roleName || item.role}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.switchBtnPill,
                              {
                                backgroundColor: theme.colors.primary + '12',
                                borderColor: theme.colors.primary + '35',
                              },
                            ]}
                          >
                            <Text style={[styles.switchBtnText, { color: theme.colors.primary }]}>
                              {t('switchAction')}
                            </Text>
                            <MaterialDesignIcons name="chevron-right" size={16} color={theme.colors.primary} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Info Banner */}
              <View
                style={[
                  styles.infoNoteCard,
                  { backgroundColor: theme.colors.subtleSurface, borderColor: theme.colors.border },
                ]}
              >
                <MaterialDesignIcons name="information-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.infoNoteText, { color: theme.colors.textSecondary }]}>
                  {t('switchCampaignInfoNote')}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={Boolean(pendingProfile)}
        variant="info"
        title={t('confirmSwitchProfile')}
        message={
          pendingProfile
            ? `${pendingProfile.organizationName} (${pendingProfile.roleName || pendingProfile.role})\n\n${t('switchProfileConfirmMsg')}`
            : t('switchProfileConfirmMsg')
        }
        confirmText={t('switchAction')}
        cancelText={t('cancel')}
        icon="account-switch-outline"
        loading={isSwitching}
        onConfirm={handleConfirmSwitch}
        onClose={() => !isSwitching && setPendingProfile(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  headerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 58,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  decorCircleLarge: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 195,
    height: 195,
    borderRadius: 98,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  decorCircleSmall: {
    position: 'absolute',
    right: 65,
    bottom: -25,
    width: 115,
    height: 115,
    borderRadius: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: rfValue(18),
    fontFamily: FontFamily.bold,
  },
  headerSubtitle: {
    color: '#C7D2FE',
    fontSize: rfValue(12),
    fontFamily: FontFamily.body,
    marginTop: 2,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: rfValue(12),
    fontFamily: FontFamily.bold,
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signedInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signedInLabel: {
    color: '#C7D2FE',
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
  },
  signedInPhone: {
    color: '#FFFFFF',
    fontSize: rfValue(14),
    fontFamily: FontFamily.bold,
    marginTop: 1,
  },
  linkedCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  linkedCountText: {
    color: '#E0E7FF',
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.medium,
  },
  bodyContainer: {
    paddingHorizontal: 16,
    marginTop: -34,
  },
  skeletonWrap: {
    gap: 16,
  },
  activeCard: {
    padding: 18,
    borderWidth: .5,
    borderRadius: 24,
    marginBottom: 22,
    ...getShadow(2, "#1E40AF"),
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  currentlyActiveText: {
    color: '#166534',
    fontSize: rfValue(11),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.7,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTile: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: rfValue(18.5),
    fontFamily: FontFamily.bold,
  },
  profileTextCol: {
    flex: 1,
  },
  profileName: {
    fontSize: rfValue(15.5),
    fontFamily: FontFamily.bold,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  orgSubText: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.body,
    flexShrink: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 7,
  },
  roleBadgeText: {
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.bold,
  },
  continueCta: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueCtaText: {
    color: '#FFFFFF',
    fontSize: rfValue(14),
    fontFamily: FontFamily.bold,
  },
  continueArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherSection: {
    marginBottom: 18,
  },
  otherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  otherSectionTitle: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.7,
  },
  otherCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  otherCountText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bold,
  },
  otherList: {
    gap: 12,
  },
  otherCard: {
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...getShadow(2, "#1E40AF"),
  },
  otherCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  switchBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 3,
  },
  switchBtnText: {
    fontSize: rfValue(12.5),
    fontFamily: FontFamily.bold,
  },
  infoNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: rfValue(12),
    fontFamily: FontFamily.body,
    lineHeight: 18,
  },
});

export default SwitchProfileScreen;
