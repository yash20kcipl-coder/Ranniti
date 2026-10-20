import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import React from 'react';
import { useLanguage } from '../../../languages';
import { rfValue } from '../../../utils/responsive';
import { darkColors } from '../../../constants/theme';
import { FontFamily } from '../../../utils/typography';
import { Skeleton } from '../../../components/Skeleton';
import { AppModal } from '../../../components/AppModal';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { ScrollView } from '../../../components/ScrollView';
import { MobileTurnoutSummary } from '../../../store/actions/mobileElection';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

export interface HourlyTurnoutModalProps {
  visible: boolean;
  onClose: () => void;
  booth: {
    id: string;
    boothNumber: number | null;
    name: string;
    wardName?: string | null;
    wardNumber?: number | null;
    acName?: string | null;
    locationBuilding?: string | null;
  } | null;
  summary: MobileTurnoutSummary;
  hourlyData: {
    hourlySurge?: Array<{
      timeSlot?: string;
      hour?: string;
      votesCast?: number;
      count?: number;
      percentage?: number;
    }>;
    boothTurnout?: any;
    summary?: Record<string, any>;
  } | null;
  isLoading?: boolean;
}

export const HourlyTurnoutModal: React.FC<HourlyTurnoutModalProps> = ({
  visible,
  onClose,
  booth,
  summary,
  hourlyData,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === darkColors.background;

  const surgeList = (hourlyData?.hourlySurge || []).map((s) => ({
    timeSlot: s.timeSlot || s.hour || '',
    votesCast: s.votesCast !== undefined ? s.votesCast : (s.count !== undefined ? s.count : 0),
  }));
  const maxSlotVotes = Math.max(1, ...surgeList.map((s) => s.votesCast));

  // Determine peak slot
  const peakSlot = surgeList.length > 0
    ? [...surgeList].sort((a, b) => b.votesCast - a.votesCast)[0]
    : null;

  // Format time slot label (e.g. "09:00" -> "09:00 - 10:00 AM")
  const formatSlotLabel = (slot: string) => {
    if (!slot) return '';
    const hour = parseInt(slot.split(':')[0], 10);
    if (isNaN(hour)) return slot;
    const startPeriod = hour >= 12 ? 'PM' : 'AM';
    const startH = hour % 12 === 0 ? 12 : hour % 12;
    const nextH = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
    const nextPeriod = (hour + 1) >= 12 && (hour + 1) < 24 ? 'PM' : 'AM';
    return `${startH}:00 ${startPeriod} - ${nextH}:00 ${nextPeriod}`;
  };

  const cardBg = isDark ? '#1E293B' : '#F8FAFC';
  const borderCol = isDark ? '#334155' : '#E2E8F0';
  const textCol = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const successCol = isDark ? '#34D399' : '#059669';
  const warningCol = isDark ? '#FBBF24' : '#D97706';

  return (
    <AppModal
      visible={visible}
      onDismiss={onClose}
      title={t('hourlyTurnoutTitle')}
      icon="chart-timeline-variant"
    >
      <ScrollView
        style={styles.modalScroll}
        showsVerticalScrollIndicator={false}
        useFlex={false}
        useThemeBackground={false}
      >
        {/* Booth Context Banner */}
        <View style={[styles.boothBanner, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View
            style={[
              styles.badgeBox,
              {
                backgroundColor: isDark ? '#1E3A8A25' : '#EFF6FF',
                borderColor: isDark ? '#1E40AF40' : '#BFDBFE',
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: isDark ? '#60A5FA' : '#1E40AF' }]}>
              #{booth?.boothNumber || '-'}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[styles.boothName, { color: textCol }]} numberOfLines={1}>
              {booth?.name || t('noBoothAssignedForElection')}
            </Text>
            {booth?.wardName || booth?.locationBuilding ? (
              <Text style={[styles.boothSub, { color: textMuted }]} numberOfLines={1}>
                {booth.locationBuilding || booth.wardName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Turnout Summary Numbers */}
        <View style={[styles.summaryGrid, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: textMuted }]}>{t('totalVoters')}</Text>
            <Text style={[styles.summaryValue, { color: textCol }]}>
              {summary.totalVoters.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.gridDivider, { backgroundColor: borderCol }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: textMuted }]}>{t('voted')}</Text>
            <Text style={[styles.summaryValue, { color: successCol }]}>
              {summary.votedCount.toLocaleString()} ({summary.turnoutPercentage}%)
            </Text>
          </View>
          <View style={[styles.gridDivider, { backgroundColor: borderCol }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: textMuted }]}>{t('pending') || 'Pending'}</Text>
            <Text style={[styles.summaryValue, { color: warningCol }]}>
              {summary.pendingCount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Demographics Split */}
        <View style={styles.demographicRow}>
          <View style={[styles.demoPill, { backgroundColor: isDark ? '#1E3A8A25' : '#EFF6FF' }]}>
            <MaterialDesignIcons name="gender-male" size={14} color={isDark ? '#60A5FA' : '#2563EB'} />
            <Text style={[styles.demoText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
              {t('male') || 'Male'}: {summary.votedMale || 0}
            </Text>
          </View>
          <View style={[styles.demoPill, { backgroundColor: isDark ? '#83184325' : '#FDF2F8' }]}>
            <MaterialDesignIcons name="gender-female" size={14} color={isDark ? '#F472B6' : '#DB2777'} />
            <Text style={[styles.demoText, { color: isDark ? '#F472B6' : '#DB2777' }]}>
              {t('female') || 'Female'}: {summary.votedFemale || 0}
            </Text>
          </View>
          {summary.votedOther > 0 && (
            <View style={[styles.demoPill, { backgroundColor: isDark ? '#37415125' : '#F3F4F6' }]}>
              <MaterialDesignIcons name="gender-male-female" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.demoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {t('other') || 'Other'}: {summary.votedOther}
              </Text>
            </View>
          )}
        </View>

        {/* Peak Velocity Callout if available */}
        {peakSlot && peakSlot.votesCast > 0 && (
          <View
            style={[
              styles.peakBox,
              {
                backgroundColor: isDark ? '#064E3B30' : '#ECFDF5',
                borderColor: isDark ? '#05966950' : '#10B98130',
              },
            ]}
          >
            <MaterialDesignIcons name="lightning-bolt" size={18} color={successCol} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.peakTitle, { color: successCol }]}>{t('peakHour')}</Text>
              <Text style={[styles.peakSub, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                {formatSlotLabel(peakSlot.timeSlot)} • <Text style={{ fontFamily: FontFamily.bold }}>{peakSlot.votesCast} {t('votes') || 'votes'}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Hourly Breakdown List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textCol }]}>
            {t('turnoutByHour')}
          </Text>
        </View>

        {isLoading ? (
          /* Reusable Skeleton Loading Standard (Rule 20) */
          <View style={styles.slotsList}>
            {[1, 2, 3, 4].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.slotCard,
                  { backgroundColor: cardBg, borderColor: borderCol },
                ]}
              >
                <View style={styles.slotHeaderRow}>
                  <Skeleton width={110} height={14} borderRadius={4} />
                  <Skeleton width={45} height={14} borderRadius={4} />
                </View>
                <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 2 }} />
              </View>
            ))}
          </View>
        ) : surgeList.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <MaterialDesignIcons name="clock-outline" size={30} color={textMuted} />
            <Text style={[styles.emptyText, { color: textMuted }]}>
              {t('noHourlyDataYet')}
            </Text>
          </View>
        ) : (
          <View style={styles.slotsList}>
            {surgeList.map((slot, idx) => {
              const fillPct = Math.min(100, Math.round((slot.votesCast / maxSlotVotes) * 100));
              const isPeak = peakSlot && peakSlot.timeSlot === slot.timeSlot;

              return (
                <View
                  key={slot.timeSlot || idx}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: isPeak ? (isDark ? '#059669' : '#10B981') : borderCol,
                    },
                  ]}
                >
                  <View style={styles.slotHeaderRow}>
                    <View style={styles.slotTimeRow}>
                      <MaterialDesignIcons
                        name={isPeak ? 'fire' : 'clock-time-four-outline'}
                        size={15}
                        color={isPeak ? '#F59E0B' : textMuted}
                      />
                      <Text
                        style={[
                          styles.slotTimeText,
                          { color: textCol },
                          isPeak && { fontFamily: FontFamily.bold, color: successCol },
                        ]}
                      >
                        {formatSlotLabel(slot.timeSlot)}
                      </Text>
                    </View>
                    <View style={styles.slotCountBox}>
                      <Text style={[styles.slotCountNumber, { color: isPeak ? successCol : textCol }]}>
                        {slot.votesCast}
                      </Text>
                      <Text style={[styles.slotCountUnit, { color: textMuted }]}>
                        {t('votes') || 'votes'}
                      </Text>
                    </View>
                  </View>

                  {/* Hourly Progress Track */}
                  <View style={[styles.barTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${fillPct}%`,
                          backgroundColor: isPeak ? '#10B981' : (isDark ? '#3B82F6' : '#2563EB'),
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalScroll: {
    maxHeight: 460,
    width: '100%',
  },
  boothBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    marginBottom: 10,
  },
  badgeBox: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12),
  },
  boothName: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  boothSub: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 10,
    marginBottom: 10,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  gridDivider: {
    width: 1,
    height: 26,
  },
  summaryLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(9.5),
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  demographicRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(10.5),
  },
  peakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 9,
    borderRadius: 10,
    borderWidth: 0.5,
    marginBottom: 10,
  },
  peakTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
    textTransform: 'uppercase',
  },
  peakSub: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11.5),
    marginTop: 1,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 6,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11.5),
  },
  slotsList: {
    gap: 8,
    paddingBottom: 8,
  },
  slotCard: {
    padding: 9,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 5,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTimeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(11.5),
  },
  slotCountBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  slotCountNumber: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
  slotCountUnit: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(9.5),
  },
  barTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 2.5,
  },
});

export default HourlyTurnoutModal;
