import React from 'react';
import { Theme } from '../../../constants/theme';
import { useLanguage } from '../../../languages';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface InfluencerFilterBarProps {
  selectedBoothName?: string;
  onOpenBoothModal: () => void;
  isVolunteer?: boolean;
}

export const InfluencerFilterBar: React.FC<InfluencerFilterBarProps> = ({
  selectedBoothName,
  onOpenBoothModal,
  isVolunteer = false,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);

  return (
    <View style={styles.container}>
      {/* Title / Description */}
      <View style={styles.titleWrapper}>
        <MaterialDesignIcons name="account-star-outline" size={16} color={theme.colors.primary} />
        <Text style={styles.titleText}>{t('socialInfluencers') || 'Social Influencers'}</Text>
      </View>

      {/* Territory / Booth Filter Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenBoothModal}
        style={[styles.boothPill, Boolean(selectedBoothName) && styles.boothPillActive]}
      >
        <MaterialDesignIcons
          size={14}
          name="map-marker-multiple"
          color={selectedBoothName ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text style={[styles.boothPillText, Boolean(selectedBoothName) && styles.boothPillTextActive]} numberOfLines={1}>
          {selectedBoothName || (isVolunteer ? (t('assignedBooths') || 'Assigned Booths') : (t('filterBooth') || 'Filter Booth'))}
        </Text>
        <MaterialDesignIcons
          size={14}
          name="chevron-down"
          color={selectedBoothName ? theme.colors.primary : theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 12,
    },
    titleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    titleText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text || '#0F172A',
    },
    boothPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      maxWidth: 170,
    },
    boothPillActive: {
      backgroundColor: `${theme.colors.primary}12`,
      borderColor: theme.colors.primary,
    },
    boothPillText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      flex: 1,
    },
    boothPillTextActive: {
      fontFamily: FontFamily.bold,
      color: theme.colors.primary || '#1E40AF',
    },
  });
