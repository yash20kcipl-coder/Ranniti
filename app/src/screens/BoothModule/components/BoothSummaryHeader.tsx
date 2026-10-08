import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../../languages';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { BoothItem } from '../../../store/reducers/booths';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { darkColors } from '../../../constants/theme';

interface BoothSummaryHeaderProps {
  booths: BoothItem[];
  totalBoothsCount?: number;
}

export const BoothSummaryHeader: React.FC<BoothSummaryHeaderProps> = ({
  booths,
  totalBoothsCount,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === darkColors.background;

  const totals = useMemo(() => {
    let totalVoters = 0;
    let votedCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;

    booths.forEach((b) => {
      totalVoters += b.totalVoters || 0;
      votedCount += b.votedCount || 0;
      maleCount += b.maleCount || 0;
      femaleCount += b.femaleCount || 0;
      otherCount += b.otherCount || 0;
    });

    return {
      totalVoters,
      votedCount,
      maleCount,
      femaleCount,
      otherCount,
      boothCount: totalBoothsCount || booths.length,
    };
  }, [booths, totalBoothsCount]);

  const cardBg = theme.colors.surface || '#FFFFFF';
  const cardBorder = theme.colors.border || (isDark ? '#334155' : '#E2E8F0');
  const textColor = theme.colors.text || (isDark ? '#F8FAFC' : '#0F172A');
  const textMuted = theme.colors.textSecondary || (isDark ? '#94A3B8' : '#64748B');

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Banner Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? '#1E3A8A25' : '#EFF6FF' }]}>
            <MaterialDesignIcons name="office-building-marker-outline" size={17} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {t('assignedBooths')}
            </Text>
            <Text style={[styles.headerSub, { color: textMuted }]} numberOfLines={1}>
              {totals.boothCount} {totals.boothCount === 1 ? t('booth' as any) || 'Booth' : t('booths' as any) || 'Booths'} • {totals.totalVoters.toLocaleString()} {t('totalVoters')}
            </Text>
          </View>
        </View>
      </View>

      {/* Grid of Gender Statistics */}
      <View style={styles.statsGrid}>
        {/* Male Voters */}
        <View style={[styles.statBox, { backgroundColor: isDark ? '#1E3A8A20' : '#EFF6FF', borderColor: isDark ? '#1E40AF40' : '#BFDBFE' }]}>
          <View style={styles.statIconRow}>
            <MaterialDesignIcons name="gender-male" size={14} color="#2563EB" />
            <Text style={[styles.statLabel, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
              {t('male')}
            </Text>
          </View>
          <Text style={[styles.statVal, { color: isDark ? '#FFFFFF' : '#1E3A8A' }]}>
            {totals.maleCount.toLocaleString()}
          </Text>
        </View>

        {/* Female Voters */}
        <View style={[styles.statBox, { backgroundColor: isDark ? '#83184320' : '#FDF2F8', borderColor: isDark ? '#9D174D40' : '#FBCFE8' }]}>
          <View style={styles.statIconRow}>
            <MaterialDesignIcons name="gender-female" size={14} color="#EC4899" />
            <Text style={[styles.statLabel, { color: isDark ? '#F9A8D4' : '#9D174D' }]}>
              {t('female')}
            </Text>
          </View>
          <Text style={[styles.statVal, { color: isDark ? '#FFFFFF' : '#831843' }]}>
            {totals.femaleCount.toLocaleString()}
          </Text>
        </View>

        {/* Other Voters */}
        <View style={[styles.statBox, { backgroundColor: isDark ? '#4C1D9520' : '#F5F3FF', borderColor: isDark ? '#6D28D940' : '#DDD6FE' }]}>
          <View style={styles.statIconRow}>
            <MaterialDesignIcons name="gender-trans" size={14} color="#8B5CF6" />
            <Text style={[styles.statLabel, { color: isDark ? '#C4B5FD' : '#5B21B6' }]}>
              {t('otherGender')}
            </Text>
          </View>
          <Text style={[styles.statVal, { color: isDark ? '#FFFFFF' : '#4C1D95' }]}>
            {totals.otherCount.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 11,
    marginBottom: 10,
    ...getShadow(2, '#000000', 0.04),
  },
  topHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
  },
  headerSub: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 0.5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10),
  },
  statVal: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
});
