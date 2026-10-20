import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../../../languages';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { darkColors } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { MobileTurnoutSummary } from '../../../store/actions/mobileElection';
import { getShadow } from '../../../utils/shadow';

export interface ElectionBoothBarProps {
  booth: {
    id: string;
    boothNumber: number | null;
    name: string;
    wardName?: string | null;
    wardNumber?: number | null;
    locationBuilding?: string | null;
    acName?: string | null;
  } | null;
  summary: MobileTurnoutSummary;
  onChangeBooth: () => void;
  onPressSurge?: () => void;
  canChangeBooth?: boolean;
}

export const ElectionBoothBar: React.FC<ElectionBoothBarProps> = ({
  booth,
  summary,
  onChangeBooth,
  onPressSurge,
  canChangeBooth = true,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === darkColors.background;

  const pct = Math.min(100, Math.max(0, summary.turnoutPercentage || 0));

  const cardBg = theme.colors.surface || '#FFFFFF';
  const cardBorder = theme.colors.border || (isDark ? '#334155' : '#E2E8F0');
  const subtleBg = theme.colors.subtleSurface || (isDark ? '#1E293B' : '#F8FAFC');
  const textColor = theme.colors.text || (isDark ? '#F8FAFC' : '#0F172A');
  const textMuted = theme.colors.textSecondary || (isDark ? '#94A3B8' : '#64748B');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* 1. Header: Booth Number Badge + Info + Change Booth Button */}
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
          <Text style={styles.avatarNumber}>
            #{booth?.boothNumber || '-'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onChangeBooth}
          style={styles.headerInfoCol}
        >
          <Text style={[styles.boothName, { color: textColor }]} numberOfLines={1}>
            {booth ? booth.name : t('noBoothAssignedForElection')}
          </Text>

          <View style={styles.subInfoRow}>
            {Boolean(booth?.wardNumber || booth?.wardName) && (
              <Text style={[styles.subInfoText, { color: textMuted }]} numberOfLines={1}>
                {booth?.wardNumber ? `${t('ward')} ${booth.wardNumber}` : booth?.wardName}
              </Text>
            )}
            {Boolean((booth?.wardNumber || booth?.wardName) && booth?.locationBuilding) && (
              <Text style={[styles.dotSep, { color: textMuted }]}>•</Text>
            )}
            {Boolean(booth?.locationBuilding) && (
              <Text style={[styles.subInfoText, { color: textMuted }]} numberOfLines={1}>
                {booth?.locationBuilding}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {canChangeBooth && (
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onChangeBooth}
              style={[
                styles.changeBtn,
                {
                  backgroundColor: isDark ? '#1E3A8A25' : '#EFF6FF',
                  borderColor: isDark ? '#1E40AF40' : '#BFDBFE',
                },
              ]}
            >
              <Text style={styles.changeBtnText}>
                {t('changeBooth')}
              </Text>
              <MaterialDesignIcons name="chevron-down" size={13} color="#2563EB" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. Detailed Statistics Container (Matching BoothCard) */}
      <View
        style={[
          styles.statsContainer,
          {
            backgroundColor: subtleBg,
            borderColor: isDark ? '#33415550' : '#E2E8F080',
          },
        ]}
      >
        {/* KPI Counts Row */}
        <View style={styles.countsRow}>
          {/* Voted Count */}
          <View style={styles.countItem}>
            <Text style={[styles.countLabel, { color: '#059669' }]} numberOfLines={1}>
              {t('voted')}
            </Text>
            <View style={styles.valueRow}>
              <Text style={[styles.countValue, { color: '#059669' }]}>
                {summary.votedCount.toLocaleString()}
              </Text>
              <Text style={[styles.countSubtext, { color: '#059669' }]}>
                ({pct}%)
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.dividerVertical,
              { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
            ]}
          />

          {/* Pending Count */}
          <View style={styles.countItem}>
            <Text style={[styles.countLabel, { color: '#D97706' }]} numberOfLines={1}>
              {t('pendingVoters')}
            </Text>
            <Text style={[styles.countValue, { color: '#D97706' }]}>
              {summary.pendingCount.toLocaleString()}
            </Text>
          </View>

          <View
            style={[
              styles.dividerVertical,
              { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
            ]}
          />

          {/* Total Voters */}
          <View style={styles.countItem}>
            <Text style={[styles.countLabel, { color: textMuted }]} numberOfLines={1}>
              {t('totalVoters')}
            </Text>
            <Text style={[styles.countValue, { color: textColor }]}>
              {summary.totalVoters.toLocaleString()}
            </Text>
          </View>

          {/* Live Surge/Refresh Trigger */}
          {onPressSurge && (
            <>
              <View
                style={[
                  styles.dividerVertical,
                  { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
                ]}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPressSurge}
                style={styles.refreshItem}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.pulseDot} />
                <MaterialDesignIcons name="refresh" size={14} color="#059669" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Turnout Progress Bar */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${pct}%`,
                backgroundColor: '#10B981',
              },
            ]}
          />
        </View>
      </View>


    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 11,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    marginHorizontal: 14,
    ...getShadow(1, '#000000', 0.03),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderWidth: 0.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNumber: {
    color: '#2563EB',
    fontSize: rfValue(13.5),
    fontFamily: FontFamily.bold,
  },
  headerInfoCol: {
    flex: 1,
    gap: 1.5,
  },
  boothName: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
    lineHeight: 17,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  subInfoText: {
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.bodyBold,
  },
  dotSep: {
    fontSize: rfValue(8),
    marginHorizontal: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    gap: 3,
  },
  changeBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
    color: '#2563EB',
  },
  statsContainer: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 7,
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  countLabel: {
    fontSize: rfValue(9.5),
    fontFamily: FontFamily.bodyBold,
  },
  countValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
  countSubtext: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(9.5),
  },
  dividerVertical: {
    width: 1,
    height: 22,
  },
  refreshItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
});
