import React, { useMemo } from 'react';
import { useLanguage } from '../../../languages';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { darkColors } from '../../../constants/theme';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { BoothItem } from '../../../store/reducers/booths';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface BoothCardProps {
  booth: BoothItem;
  onPress?: (booth: BoothItem) => void;
  onPressVoters?: (booth: BoothItem) => void;
}

export const BoothCard: React.FC<BoothCardProps> = ({
  booth,
  onPress,
  onPressVoters,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === darkColors.background;

  const votedCount = booth.votedCount || 0;
  const totalVoters = booth.totalVoters || 0;
  const pendingCount = Math.max(0, totalVoters - votedCount);

  const maleCount = booth.maleCount || 0;
  const femaleCount = booth.femaleCount || 0;
  const otherCount = booth.otherCount || 0;

  const turnoutPercentage = useMemo(() => {
    if (totalVoters <= 0) return 0;
    return Math.min(100, Math.round((votedCount / totalVoters) * 100));
  }, [totalVoters, votedCount]);

  // Calculate gender percentages for proportional breakdown
  const { malePct, femalePct, otherPct } = useMemo(() => {
    const sumGender = maleCount + femaleCount + otherCount;
    const denom = sumGender > 0 ? sumGender : (totalVoters > 0 ? totalVoters : 1);
    const m = Math.round((maleCount / denom) * 100);
    const f = Math.round((femaleCount / denom) * 100);
    const o = Math.max(0, 100 - m - f);
    return { malePct: m, femalePct: f, otherPct: o };
  }, [maleCount, femaleCount, otherCount, totalVoters]);

  const handleCardPress = () => {
    if (onPressVoters) {
      onPressVoters(booth);
    } else if (onPress) {
      onPress(booth);
    }
  };

  const cardBg = theme.colors.surface || '#FFFFFF';
  const cardBorder = theme.colors.border || (isDark ? '#334155' : '#E2E8F0');
  const subtleBg = theme.colors.subtleSurface || (isDark ? '#1E293B' : '#F8FAFC');
  const textColor = theme.colors.text || (isDark ? '#F8FAFC' : '#0F172A');
  const textMuted = theme.colors.textSecondary || (isDark ? '#94A3B8' : '#64748B');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleCardPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* 1. Header: Booth Number Badge + Info + Turnout Pill & Chevron */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.avatarBox,
            {
              backgroundColor: isDark ? '#1E3A8A25' : '#EFF6FF',
              borderColor: isDark ? '#1E40AF40' : '#BFDBFE',
            },
          ]}
        >
          <Text style={styles.avatarNumber}>#{booth.boothNumber}</Text>
        </View>

        <View style={styles.headerInfoCol}>
          <Text style={[styles.boothName, { color: textColor }]} numberOfLines={1}>
            {booth.name}
          </Text>

          <View style={styles.subInfoRow}>
            {Boolean(booth.wardNumber || booth.wardName) && (
              <Text style={[styles.subInfoText, { color: textMuted }]} numberOfLines={1}>
                {booth.wardNumber ? `${t('ward')} ${booth.wardNumber}` : booth.wardName}
              </Text>
            )}
            {Boolean((booth.wardNumber || booth.wardName) && booth.acName) && (
              <Text style={[styles.dotSep, { color: textMuted }]}>•</Text>
            )}
            {Boolean(booth.acName) && (
              <Text style={[styles.subInfoText, { color: '#2563EB' }]} numberOfLines={1}>
                {booth.acName}
              </Text>
            )}
          </View>
          {Boolean(booth.locationBuilding) && (
            <Text style={[styles.subInfoText, { color: textMuted }]} numberOfLines={1}>
              {booth.locationBuilding}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.turnoutPill,
              {
                backgroundColor:
                  turnoutPercentage >= 50
                    ? isDark
                      ? '#064E3B40'
                      : '#ECFDF5'
                    : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                borderColor:
                  turnoutPercentage >= 50
                    ? isDark
                      ? '#047857'
                      : '#A7F3D0'
                    : isDark
                      ? '#334155'
                      : '#E2E8F0',
              },
            ]}
          >
            <View
              style={[
                styles.turnoutDot,
                { backgroundColor: turnoutPercentage >= 50 ? '#059669' : '#64748B' },
              ]}
            />
            <Text
              style={[
                styles.turnoutPillText,
                { color: turnoutPercentage >= 50 ? '#059669' : textMuted },
              ]}
            >
              {turnoutPercentage}%
            </Text>
          </View>
          <MaterialDesignIcons name="chevron-right" size={18} color={textMuted} />
        </View>
      </View>

      {/* 2. Compact Statistics Container */}
      <View
        style={[
          styles.statsContainer,
          {
            backgroundColor: subtleBg,
            borderColor: isDark ? '#33415550' : '#E2E8F080',
          },
        ]}
      >
        {/* Row A: Key Voter Counts (Total, Voted, Pending) */}
        <View style={styles.countsRow}>
          <View style={styles.countItem}>
            <Text style={[styles.countLabel, { color: textMuted }]} numberOfLines={1}>
              {t('totalVoters')}
            </Text>
            <Text style={[styles.countValue, { color: textColor }]}>
              {totalVoters.toLocaleString()}
            </Text>
          </View>

          <View
            style={[
              styles.dividerVertical,
              { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
            ]}
          />

          <View style={styles.countItem}>
            <Text style={[styles.countLabel, { color: '#059669' }]} numberOfLines={1}>
              {t('voted')}
            </Text>
            <Text style={[styles.countValue, { color: '#059669' }]}>
              {votedCount.toLocaleString()}
            </Text>
          </View>

          <View
            style={[
              styles.dividerVertical,
              { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
            ]}
          />

          <View style={styles.countItem}>
            <Text style={[styles.countLabel, { color: '#D97706' }]} numberOfLines={1}>
              {t('pendingVoters')}
            </Text>
            <Text style={[styles.countValue, { color: '#D97706' }]}>
              {pendingCount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Proportional Segmented Color Bar for Gender Balance */}
        <View
          style={[
            styles.genderBarTrack,
            { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
          ]}
        >
          {malePct > 0 && (
            <View
              style={[
                styles.genderBarSegment,
                { width: `${malePct}%`, backgroundColor: '#2563EB' },
              ]}
            />
          )}
          {femalePct > 0 && (
            <View
              style={[
                styles.genderBarSegment,
                { width: `${femalePct}%`, backgroundColor: '#EC4899' },
              ]}
            />
          )}
          {otherPct > 0 && otherCount > 0 && (
            <View
              style={[
                styles.genderBarSegment,
                { width: `${otherPct}%`, backgroundColor: '#8B5CF6' },
              ]}
            />
          )}
        </View>

        {/* Row B: Gender Badges (Male, Female, Other) */}
        <View style={styles.genderRow}>
          {/* Male Pill */}
          <View
            style={[
              styles.genderPill,
              // { backgroundColor: isDark ? '#1E3A8A20' : '#EFF6FF' },
            ]}
          >
            <MaterialDesignIcons name="gender-male" size={12} color="#2563EB" />
            <Text
              style={[
                styles.genderPillText,
                { color: isDark ? '#93C5FD' : '#1E40AF' },
              ]}
              numberOfLines={1}
            >
              {t('male')}: <Text style={styles.genderBold}>{maleCount.toLocaleString()}</Text>{' '}
              ({malePct}%)
            </Text>
          </View>

          {/* Female Pill */}
          <View
            style={[
              styles.genderPill,
              // { backgroundColor: isDark ? '#83184320' : '#FDF2F8' },
            ]}
          >
            <MaterialDesignIcons name="gender-female" size={12} color="#EC4899" />
            <Text
              style={[
                styles.genderPillText,
                { color: isDark ? '#F9A8D4' : '#9D174D' },
              ]}
              numberOfLines={1}
            >
              {t('female')}:{' '}
              <Text style={styles.genderBold}>{femaleCount.toLocaleString()}</Text> ({femalePct}%)
            </Text>
          </View>

          {/* Other Pill */}
          <View
            style={[
              styles.genderPill,
              // { backgroundColor: isDark ? '#4C1D9520' : '#F5F3FF' },
            ]}
          >
            <MaterialDesignIcons name="gender-trans" size={12} color="#8B5CF6" />
            <Text
              style={[
                styles.genderPillText,
                { color: isDark ? '#C4B5FD' : '#5B21B6' },
              ]}
              numberOfLines={1}
            >
              {t('otherGender')}:{' '}
              <Text style={styles.genderBold}>{otherCount.toLocaleString()}</Text> ({otherPct}%)
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 11,
    marginBottom: 10,
    ...getShadow(2, '#000000', 0.04),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatarBox: {
    width: 45,
    height: 45,
    borderWidth: 0.5,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNumber: {
    color: '#2563EB',
    fontSize: rfValue(15),
    fontFamily: FontFamily.bold,
  },
  headerInfoCol: {
    flex: 1,
    gap: 1.5,
  },
  boothName: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
    lineHeight: 18,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 1,
  },
  subInfoText: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.bodyBold,
  },
  dotSep: {
    fontSize: rfValue(9),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  turnoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 4,
  },
  turnoutDot: {
    width: 4,
    height: 4,
    borderRadius: 2.5,
  },
  turnoutPillText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10),
  },
  statsContainer: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 6,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  countLabel: {
    fontSize: rfValue(9.5),
    fontFamily: FontFamily.bodyBold,
  },
  countValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
  dividerVertical: {
    width: 0.5,
    height: 20,
  },
  genderBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  genderBarSegment: {
    height: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 2,
    gap: 2.5,
  },
  genderPillText: {
    fontSize: rfValue(10),
    fontFamily: FontFamily.bodyBold,
  },
  genderBold: {
    fontFamily: FontFamily.bold,
  },
});
