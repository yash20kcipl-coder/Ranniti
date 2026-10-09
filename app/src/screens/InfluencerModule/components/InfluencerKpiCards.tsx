import React from 'react';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface InfluencerKpiCardsProps {
  totalCount: number;
  totalInfluencedVoters: number;
}

export const InfluencerKpiCards: React.FC<InfluencerKpiCardsProps> = ({
  totalCount,
  totalInfluencedVoters,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);
  const avgVoters = totalCount > 0 ? (totalInfluencedVoters / totalCount).toFixed(1) : '0';

  return (
    <View style={styles.gridContainer}>
      {/* Card 1: Social Influencers */}
      <View style={[styles.card, { borderColor: `${theme.colors.primary}30` }]}>
        <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}15` }]}>
          <MaterialDesignIcons name="account-star" size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.cardValue}>{totalCount}</Text>
        <Text style={styles.cardLabel}>{t('socialLeaders') || 'Social Leaders'}</Text>
      </View>

      {/* Card 2: Total Influenced Voters */}
      <View style={[styles.card, { borderColor: `${theme.colors.info || '#0D9488'}30` }]}>
        <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.info || '#0D9488'}15` }]}>
          <MaterialDesignIcons name="account-group" size={20} color={theme.colors.info || '#0D9488'} />
        </View>
        <Text style={styles.cardValue}>{totalInfluencedVoters}</Text>
        <Text style={styles.cardLabel}>{t('votersInfluenced') || 'Voters Influenced'}</Text>
      </View>

      {/* Card 3: Average Reach */}
      <View style={[styles.card, { borderColor: `${theme.colors.warning || '#D97706'}30` }]}>
        <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.warning || '#D97706'}15` }]}>
          <MaterialDesignIcons name="chart-bell-curve-cumulative" size={20} color={theme.colors.warning || '#D97706'} />
        </View>
        <Text style={styles.cardValue}>{avgVoters}</Text>
        <Text style={styles.cardLabel}>{t('avgReachPerLeader') || 'Avg Reach / Leader'}</Text>
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
