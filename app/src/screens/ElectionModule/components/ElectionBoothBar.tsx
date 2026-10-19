import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
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
  search?: string;
  onChangeBooth: () => void;
  onPressSurge?: () => void;
  onChangeSearch?: (val: string) => void;
}

export const ElectionBoothBar: React.FC<ElectionBoothBarProps> = ({
  booth,
  summary,
  search = '',
  onChangeBooth,
  onPressSurge,
  onChangeSearch,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === darkColors.background;
  const [keypadVisible, setKeypadVisible] = useState(false);

  const pct = Math.min(100, Math.max(0, summary.turnoutPercentage || 0));

  const handleKeypadPress = (digit: string) => {
    if (!onChangeSearch) return;
    if (digit === 'CLEAR') {
      onChangeSearch('');
    } else if (digit === 'BACK') {
      onChangeSearch(search.slice(0, -1));
    } else {
      if (search.length < 6) {
        onChangeSearch(search + digit);
      }
    }
  };

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

        <View style={styles.headerRight}>
          {onChangeSearch && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setKeypadVisible(true)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialDesignIcons
                name="dialpad"
                size={15}
                color={theme.colors.primary || '#2563EB'}
              />
            </TouchableOpacity>
          )}

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

      {/* Quick Numeric Keypad Bottom Sheet Modal */}
      <Modal
        visible={keypadVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setKeypadVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setKeypadVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MaterialDesignIcons
                  name="dialpad"
                  size={18}
                  color={theme.colors.primary || '#1E40AF'}
                />
                <Text style={styles.modalTitle}>
                  {t('searchBySerialOrName')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setKeypadVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialDesignIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Display Box */}
            <View style={styles.modalDisplay}>
              <Text style={styles.modalDisplayPrefix}>#</Text>
              <Text style={styles.modalDisplayText}>
                {search ? search : t('searchBySerialOrName')}
              </Text>
              {Boolean(search) && (
                <TouchableOpacity
                  onPress={() => onChangeSearch?.('')}
                  style={styles.modalClearBtn}
                >
                  <MaterialDesignIcons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* 3x4 Touch Grid */}
            <View style={styles.keypadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((val) => {
                const isClear = val === 'CLEAR';
                const isBack = val === 'BACK';
                return (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.6}
                    onPress={() => handleKeypadPress(val)}
                    style={[
                      styles.keypadKey,
                      (isClear || isBack) && styles.keypadKeyAction,
                    ]}
                  >
                    {isBack ? (
                      <MaterialDesignIcons name="backspace-outline" size={20} color="#EF4444" />
                    ) : isClear ? (
                      <Text style={styles.keypadClearText}>{t('clear') || 'C'}</Text>
                    ) : (
                      <Text style={styles.keypadNumberText}>{val}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Done Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setKeypadVisible(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>{t('done') || 'Apply Search'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Numeric Keypad Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
    color: '#0F172A',
  },
  modalDisplay: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  modalDisplayPrefix: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(18),
    color: '#1E40AF',
    marginRight: 4,
  },
  modalDisplayText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(18),
    color: '#1E40AF',
  },
  modalClearBtn: {
    position: 'absolute',
    right: 12,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  keypadKey: {
    width: '31%',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyAction: {
    backgroundColor: '#F1F5F9',
  },
  keypadNumberText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(18),
    color: '#0F172A',
  },
  keypadClearText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(14),
    color: '#EF4444',
  },
  modalDoneBtn: {
    height: 44,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
    color: '#FFFFFF',
  },
});
