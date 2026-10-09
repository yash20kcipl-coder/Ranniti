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

  return (
    <View style={styles.gridContainer}>
      {/* Card 1: Total Families */}
      <View style={[styles.card, { borderColor: `${theme.colors.primary}30` }]}>
        <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}15` }]}>
          <MaterialDesignIcons name="home-account" size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.cardValue}>{totalFamilies}</Text>
        <Text style={styles.cardLabel}>{t('families') || 'Families'}</Text>
      </View>

      {/* Card 2: Total Family Members */}
      <View style={[styles.card, { borderColor: `${theme.colors.info || '#0D9488'}30` }]}>
        <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.info || '#0D9488'}15` }]}>
          <MaterialDesignIcons name="account-group" size={20} color={theme.colors.info || '#0D9488'} />
        </View>
        <Text style={styles.cardValue}>{totalMembers}</Text>
        <Text style={styles.cardLabel}>{t('familyMembers') || 'Family Members'}</Text>
      </View>

      {/* Card 3: Voted Members */}
      <View style={[styles.card, { borderColor: '#16A34A30' }]}>
        <View style={[styles.iconWrapper, { backgroundColor: '#16A34A15' }]}>
          <MaterialDesignIcons name="check-decagram" size={20} color="#16A34A" />
        </View>
        <Text style={styles.cardValue}>{votedMembers}</Text>
        <Text style={styles.cardLabel}>{t('votedMembers') || 'Voted Members'}</Text>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    card: {
      flex: 1,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      gap: 4,
      ...getShadow(2, '#0F172A', 0.04),
    },
    iconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    cardValue: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text || '#0F172A',
    },
    cardLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
  });
