import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SafeImage } from '../../../components/SafeImage';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useLanguage } from '../../../languages';

export interface DashboardProfileUser {
  name?: string;
  avatar?: string;
  profilePic?: string;
  roleName?: string;
  role?: string;
  assignedPc?: string;
  assignedAc?: string;
  assignedPcName?: string;
  assignedAcName?: string;
  [key: string]: any;
}

interface DashboardProfileCardProps {
  user?: DashboardProfileUser | null;
  onPressProfile?: () => void;
  mode?: 'dark' | 'light';
}

export const DashboardProfileCard: React.FC<DashboardProfileCardProps> = ({
  user,
  onPressProfile,
  mode = 'dark',
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isLight = mode === 'light';

  const userName = user?.name || 'NA';
  const userAvatar = user?.avatar || user?.profilePic;
  const roleName = user?.roleName || user?.role || t('pcLeader');
  const locationName =
    user?.assignedPcName ||
    user?.assignedPc ||
    user?.assignedAcName ||
    user?.assignedAc ||
    'NA';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressProfile}
      style={styles.heroRow}
    >
      <View style={styles.avatarWrapper}>
        <SafeImage
          name={userName}
          uri={userAvatar}
          style={styles.avatar}
          placeholderType="avatar"
          bgColor={"rgba(255,255,255,0.14)"}
          containerStyles={[
            styles.heroAvatarContainer,
            isLight
              ? { borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.14)' }
              : { borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.14)' },
          ]}
        />
        <View
          style={[
            styles.onlineBadge,
            { borderColor: isLight ? '#FFFFFF' : theme.colors.primary },
          ]}
        />
      </View>

      <View style={styles.heroInfo}>
        <Text
          style={[
            styles.heroName,
            { color: isLight ? '#0F172A' : '#FFFFFF' },
          ]}
          numberOfLines={1}
        >
          {userName}
        </Text>
        <View style={styles.subRow}>
          <Text
            style={[
              styles.heroRole,
              { color: isLight ? '#D97706' : '#FBBF24' },
            ]}
            numberOfLines={1}
          >
            {roleName}
          </Text>
          <Text
            style={[
              styles.dotSep,
              { color: isLight ? '#94A3B8' : 'rgba(255,255,255,0.6)' },
            ]}
          >
            •
          </Text>
          <Text
            style={[
              styles.heroLocation,
              { color: isLight ? '#475569' : 'rgba(255,255,255,0.85)' },
            ]}
            numberOfLines={1}
          >
            {locationName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 15,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    borderRadius: 1000,
  },
  heroAvatarContainer: {
    width: 46,
    height: 46,
    borderWidth: .5,
    borderRadius: 23,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  heroInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  heroName: {
    fontSize: rfValue(16),
    fontFamily: FontFamily.bold,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroRole: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.bold,
  },
  dotSep: {
    fontSize: rfValue(12),
  },
  heroLocation: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
  },
});
