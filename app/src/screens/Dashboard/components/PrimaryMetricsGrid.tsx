import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, Users, ArrowUpRight } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useLanguage } from '../../../languages';

interface PrimaryMetricsGridProps {
  assignedBoothsCount: number;
  totalVotersCount: number;
  onPressBooths?: () => void;
  onPressVoters?: () => void;
}

export const PrimaryMetricsGrid: React.FC<PrimaryMetricsGridProps> = ({
  assignedBoothsCount,
  totalVotersCount,
  onPressBooths,
  onPressVoters,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  return (
    <View style={styles.container}>
      {/* Assigned Booths Metric Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressBooths}
        style={[
          styles.metricCard,
          {
            backgroundColor: theme.colors.surface || '#FFFFFF',
            borderColor: theme.colors.border || '#E2E8F0',
            borderLeftColor: '#3B82F6',
          },
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
            <Home {...({ size: 18, color: '#3B82F6' } as any)} />
          </View>
          <View style={styles.arrowPill}>
            <ArrowUpRight {...({ size: 14, color: '#3B82F6' } as any)} />
          </View>
        </View>

        <View style={styles.metricValGroup}>
          <Text style={[styles.metricValue, { color: theme.colors.text || '#0F172A' }]}>
            {assignedBoothsCount}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary || '#64748B' }]}>
            {t('assignedBooths')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Total Voters Metric Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressVoters}
        style={[
          styles.metricCard,
          {
            backgroundColor: theme.colors.surface || '#FFFFFF',
            borderColor: theme.colors.border || '#E2E8F0',
            borderLeftColor: '#10B981',
          },
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
            <Users {...({ size: 18, color: '#10B981' } as any)} />
          </View>
          <View style={[styles.arrowPill, { backgroundColor: '#ECFDF5' }]}>
            <ArrowUpRight {...({ size: 14, color: '#10B981' } as any)} />
          </View>
        </View>

        <View style={styles.metricValGroup}>
          <Text style={[styles.metricValue, { color: theme.colors.text || '#0F172A' }]}>
            {totalVotersCount ? totalVotersCount.toLocaleString() : 0}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary || '#64748B' }]}>
            {t('totalVoters')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 5,
    ...getShadow(3, '#0F172A', 0.04),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValGroup: {
    gap: 2,
  },
  metricValue: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(22),
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(14),
  },
});
