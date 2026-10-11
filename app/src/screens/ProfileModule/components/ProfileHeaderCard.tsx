import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { getShadow } from '../../../utils/shadow';
import { SafeImage } from '../../../components/SafeImage';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import toast from '../../../utils/toast';

interface ProfileHeaderCardProps {
  user: any;
  t: (key: any) => string;
  theme: Theme;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  user,
  t,
  theme,
  onRefresh,
  refreshing = false,
}) => {
  const roleName = user?.roleName || (user?.role ? t(user.role === 'pc_leader' ? 'pcLeader' : user.role === 'ac_leader' ? 'acLeader' : user.role === 'sub_leader' ? 'subLeader' : 'supporter') : t('supporter'));

  const getRoleColor = () => {
    switch (user?.role) {
      case 'pc_leader':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'ac_leader':
        return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' };
      case 'sub_leader':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      default:
        return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' };
    }
  };

  const roleColors = getRoleColor();

  const handleCopyId = () => {
    if (user?.id) {
      toast.success(`Copied ID: ${user.id}`);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Top Banner Accent */}
      <View style={[styles.topBanner, { backgroundColor: theme.colors.primary }]} />

      <View style={styles.contentWrap}>
        {/* Avatar Container with Online Indicator */}
        <View style={styles.avatarWrapper}>
          <SafeImage
            src={user?.avatar}
            name={user?.name || 'Volunteer'}
            containerStyles={styles.avatar}
            placeholderType="avatar"
            alt={user?.name || 'User'}
          />
          <View style={styles.activeDotBadge}>
            <View style={styles.activeDotInner} />
          </View>
        </View>

        {/* User Identity Details */}
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'Campaign Volunteer'}
        </Text>

        {/* Role Badge */}
        <View style={[styles.roleBadge, { backgroundColor: roleColors.bg, borderColor: roleColors.border }]}>
          <MaterialDesignIcons name="shield-check" size={13} color={roleColors.text} />
          <Text style={[styles.roleText, { color: roleColors.text }]}>
            {roleName}
          </Text>
        </View>

        {/* Assigned Jurisdiction Snapshot */}
        {(Boolean(user?.assignedPc) || Boolean(user?.assignedAc)) && (
          <View style={[styles.jurisdictionBox, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <MaterialDesignIcons name="map-marker-radius-outline" size={15} color={theme.colors.primary} />
            <Text style={[styles.jurisdictionText, { color: theme.colors.text }]} numberOfLines={1}>
              {[user?.assignedPc, user?.assignedAc].filter(Boolean).join(' • ')}
            </Text>
          </View>
        )}

        {/* Quick Metrics Ribbon */}
        <View style={[styles.statsRow, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: roleColors.text }]} numberOfLines={1}>
              {roleName}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('role') || 'Role'}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: '#E2E8F0' }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.text }]} numberOfLines={1}>
              {user?.assignedBooth ? user.assignedBooth.replace(' Booths', '') : (user?.assignedBoothIds?.length ? String(user.assignedBoothIds.length) : 'All')}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('assignedBooths')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: '#E2E8F0' }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: '#16A34A' }]} numberOfLines={1}>
              ACTIVE
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('accountStatus')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    ...getShadow(3, '#000000', 0.05),
  },
  topBanner: {
    height: 60,
    width: '100%',
    opacity: 0.9,
  },
  contentWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -38,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F5F9',
  },
  activeDotBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...getShadow(1, '#000000', 0.1),
  },
  activeDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  userName: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(18),
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  roleText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(12),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.medium,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  jurisdictionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  jurisdictionText: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10.5),
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});
