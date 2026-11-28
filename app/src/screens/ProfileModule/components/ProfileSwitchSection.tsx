import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { Skeleton } from '../../../components/Skeleton';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

export interface LinkedProfileItem {
  userId: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  roleName?: string | null;
  tenantDbName: string;
  organizationName: string;
  isCurrent?: boolean;
}

interface ProfileSwitchSectionProps {
  profiles: LinkedProfileItem[];
  loading?: boolean;
  onSelectProfile: (profile: LinkedProfileItem) => void;
  t: (key: any) => string;
  theme: Theme;
}

export const ProfileSwitchSection: React.FC<ProfileSwitchSectionProps> = ({
  profiles,
  loading = false,
  onSelectProfile,
  t,
  theme,
}) => {
  if (!loading && profiles.length <= 1) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="account-switch-outline" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('switchProfile')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            {t('switchProfileSubtitle')}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={58} borderRadius={12} />
          <Skeleton height={58} borderRadius={12} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {profiles.map((item) => {
            const isActive = Boolean(item.isCurrent);
            return (
              <TouchableOpacity
                key={item.tenantDbName}
                activeOpacity={isActive ? 1 : 0.75}
                disabled={isActive}
                onPress={() => onSelectProfile(item)}
                style={[
                  styles.profileItem,
                  {
                    backgroundColor: isActive ? theme.colors.primary + '10' : '#F8FAFC',
                    borderColor: isActive ? theme.colors.primary : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.profileInfo}>
                  <Text style={[styles.orgName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.organizationName}
                  </Text>
                  <Text style={[styles.roleText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.name} • {item.roleName || item.role}
                  </Text>
                </View>

                {isActive ? (
                  <View style={[styles.activeBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.activeBadgeText}>{t('currentProfile')}</Text>
                  </View>
                ) : (
                  <View style={styles.switchChip}>
                    <Text style={[styles.switchChipText, { color: theme.colors.primary }]}>
                      {t('switchAction')}
                    </Text>
                    <MaterialDesignIcons name="chevron-right" size={18} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...getShadow(2),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: rfValue(14),
    fontFamily: FontFamily.bold,
  },
  sectionSubtitle: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
    marginTop: 2,
  },
  skeletonGroup: {
    gap: 10,
  },
  listContainer: {
    gap: 10,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileInfo: {
    flex: 1,
    marginRight: 10,
  },
  orgName: {
    fontSize: rfValue(13.5),
    fontFamily: FontFamily.medium,
  },
  roleText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.body,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.medium,
  },
  switchChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchChipText: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
    marginRight: 2,
  },
});
