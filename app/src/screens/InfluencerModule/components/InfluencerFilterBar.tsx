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
  onClearBoothFilter?: () => void;
  isVolunteer?: boolean;
  totalCount?: number;
}

export const InfluencerFilterBar: React.FC<InfluencerFilterBarProps> = ({
  selectedBoothName,
  onOpenBoothModal,
  onClearBoothFilter,
  isVolunteer = false,
  totalCount,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);
  const isFiltered = Boolean(selectedBoothName);

  return (
    <View style={styles.container}>
      {/* Title / Description with Count Chip */}
      <View style={styles.titleWrapper}>
        <View style={[styles.titleIconBox, { backgroundColor: `${theme.colors.primary}15` }]}>
          <MaterialDesignIcons name="account-star" size={15} color={theme.colors.primary} />
        </View>
        <Text style={[styles.titleText, { color: theme.colors.text }]}>
          {t('socialInfluencers') || 'Social Influencers'}
        </Text>
        {totalCount !== undefined && (
          <View style={[styles.countChip, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.countChipText, { color: theme.colors.textSecondary }]}>
              {totalCount}
            </Text>
          </View>
        )}
      </View>

      {/* Territory / Booth Filter Button */}
      <View style={styles.filterActionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenBoothModal}
          style={[styles.boothPill, isFiltered && styles.boothPillActive]}
        >
          <MaterialDesignIcons
            size={13}
            name="map-marker-multiple"
            color={isFiltered ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[styles.boothPillText, isFiltered && styles.boothPillTextActive]}
            numberOfLines={1}
          >
            {selectedBoothName ||
              (isVolunteer
                ? t('assignedBooths') || 'Assigned Booths'
                : t('filterBooth') || 'Filter Booth')}
          </Text>
          <MaterialDesignIcons
            size={13}
            name="chevron-down"
            color={isFiltered ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Clear Filter Icon Button */}
        {isFiltered && onClearBoothFilter && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: theme.colors.inputBackground }]}
            onPress={onClearBoothFilter}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialDesignIcons name="close" size={13} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
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
      gap: 7,
      flex: 1,
    },
    titleIconBox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13.5),
    },
    countChip: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
    },
    countChipText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
    },
    filterActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    boothPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      maxWidth: 160,
    },
    boothPillActive: {
      backgroundColor: `${theme.colors.primary}12`,
      borderColor: theme.colors.primary,
    },
    boothPillText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      flexShrink: 1,
    },
    boothPillTextActive: {
      fontFamily: FontFamily.bold,
      color: theme.colors.primary || '#1E40AF',
    },
    clearBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
