import React from 'react';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface FamilyKpiCardsProps {
  totalFamilies: number;
  totalMembers: number;
  votedMembers: number;
}

export const FamilyKpiCards: React.FC<FamilyKpiCardsProps> = ({
  totalFamilies,
  totalMembers,
  votedMembers,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);
  const turnoutPercent = totalMembers > 0 ? Math.round((votedMembers / totalMembers) * 100) : 0;

  return (
    <View style={styles.gridContainer}>
      {/* Card 1: Total Families */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface || '#FFFFFF',
            borderColor: `${theme.colors.primary}25`,
          },
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}12` }]}>
          <MaterialDesignIcons name="home-account" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.cardValue, { color: theme.colors.text }]} numberOfLines={1}>
          {totalFamilies.toLocaleString()}
        </Text>
        <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {t('families') || 'Families'}
        </Text>
      </View>

      {/* Card 2: Total Family Members */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface || '#FFFFFF',
            borderColor: 'rgba(59, 130, 246, 0.25)',
          },
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
          <MaterialDesignIcons name="account-group" size={18} color="#2563EB" />
        </View>
        <Text style={[styles.cardValue, { color: theme.colors.text }]} numberOfLines={1}>
          {totalMembers.toLocaleString()}
        </Text>
        <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {t('familyMembers') || 'Members'}
        </Text>
      </View>

      {/* Card 3: Voted Members & Turnout */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface || '#FFFFFF',
            borderColor: 'rgba(16, 185, 129, 0.25)',
          },
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
          <MaterialDesignIcons name="check-decagram" size={18} color="#059669" />
        </View>
        <Text style={[styles.cardValue, { color: theme.colors.text }]} numberOfLines={1}>
          {votedMembers.toLocaleString()}
        </Text>
        <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {t('voted') || 'Voted'} ({turnoutPercent}%)
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    card: {
      flex: 1,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      ...getShadow(2, '#000000', 0.04),
    },
    iconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    cardValue: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      letterSpacing: -0.3,
    },
    cardLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      marginTop: 2,
    },
  });
