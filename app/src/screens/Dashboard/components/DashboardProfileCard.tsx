import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, ChevronRight, MapPin } from 'lucide-react-native';
import { SafeImage } from '../../../components/SafeImage';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';

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
}

export const DashboardProfileCard: React.FC<DashboardProfileCardProps> = ({
  user,
  onPressProfile,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);

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
      activeOpacity={0.88}
      onPress={onPressProfile}
      style={[styles.card, { borderTopColor: theme.colors.primary, borderTopWidth: 4 }]}
    >
      <View style={styles.contentRow}>
        <View style={styles.avatarWrapper}>
          <SafeImage
            name={userName}
            uri={userAvatar}
            style={styles.avatar}
            placeholderType="avatar"
            containerStyles={styles.avatarContainer}
          />
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.metaRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>

            <View style={styles.roleBadge}>
              <Shield size={10} color={theme.colors.primary} />
              <Text style={styles.roleText} numberOfLines={1}>
                {roleName}
              </Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <MapPin size={12} strokeWidth={2.5} color={theme.colors.textSecondary} />
            <Text style={styles.areaText} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
        </View>

        <View style={styles.actionBtn}>
          <ChevronRight size={18} color={theme.colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder || theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      overflow: 'hidden',
      position: 'relative',
      ...getShadow(4, theme.colors.shadowColor, 0.08),
    },
    topAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: theme.colors.primary,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatar: {
      borderRadius: 1000,
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderWidth: 2,
      borderRadius: 30,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.inputBackground,
    },
    onlineBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: '#10B981',
      borderWidth: 2.5,
      borderColor: theme.colors.surface,
    },
    infoCol: {
      flex: 1,
      gap: 2,
      justifyContent: 'center',
    },
    userName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.vegBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    roleText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: theme.colors.primary,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    areaText: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.bold,
      color: theme.colors.textSecondary,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

