import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../languages';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { darkColors } from '../../../constants/theme';
import { FontFamily } from '../../../utils/typography';
import { AppModal } from '../../../components/AppModal';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { BoothItem } from '../../../store/reducers/booths';
import { ScrollView } from '../../../components/ScrollView';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

export interface BoothPickerModalProps {
  visible: boolean;
  onClose: () => void;
  booths: BoothItem[];
  activeBoothId?: string;
  onSelectBooth: (booth: BoothItem) => void;
}

export const BoothPickerModal: React.FC<BoothPickerModalProps> = ({
  visible,
  onClose,
  booths,
  activeBoothId,
  onSelectBooth,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === darkColors.background;

  const [query, setQuery] = useState('');

  // Filter booths in real-time
  const filteredBooths = useMemo(() => {
    if (!query.trim()) return booths || [];
    const q = query.trim().toLowerCase();
    return (booths || []).filter((b) => {
      const bNum = String(b.boothNumber || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const bWard = (b.wardName || `ward ${b.wardNumber || ''}`).toLowerCase();
      const bLoc = (b.locationBuilding || '').toLowerCase();
      return (
        bNum.includes(q) ||
        bName.includes(q) ||
        bWard.includes(q) ||
        bLoc.includes(q)
      );
    });
  }, [booths, query]);

  const cardBg = isDark ? '#1E293B' : '#F8FAFC';
  const borderCol = isDark ? '#334155' : '#E2E8F0';
  const textCol = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const primaryCol = theme.colors.primary || '#2563EB';

  const handleSelect = (b: BoothItem) => {
    onSelectBooth(b);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onDismiss={onClose}
      title={t('changeBooth')}
      icon="office-building-marker"
      message={t('selectBoothSubtitle')}
    >
      <View style={styles.container}>
        {/* Search Bar */}
        {(booths && booths.length > 3) && (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                borderColor: borderCol,
              },
            ]}
          >
            <MaterialDesignIcons name="magnify" size={18} color={textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('searchBoothsPlaceholder')}
              placeholderTextColor={textMuted}
              style={[styles.searchInput, { color: textCol }]}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {Boolean(query) && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialDesignIcons name="close-circle" size={16} color={textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Counter Header */}
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: textMuted }]}>
            {filteredBooths.length}{' '}
            {t('assignedBooths')}
          </Text>
        </View>

        {/* Booth List */}
        <ScrollView
          useFlex={false}
          style={styles.listScroll}
          useThemeBackground={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredBooths.length > 0 ? (
            filteredBooths.map((b) => {
              const isSelected = b.id === activeBoothId;
              return (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(b)}
                  style={[
                    styles.boothCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1E3A8A25'
                          : '#EFF6FF'
                        : cardBg,
                      borderColor: isSelected
                        ? primaryCol
                        : borderCol,
                    },
                  ]}
                >
                  {/* Left: Booth Number Badge */}
                  <View
                    style={[
                      styles.boothBadge,
                      {
                        backgroundColor: isSelected
                          ? primaryCol
                          : isDark
                            ? '#334155'
                            : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.boothBadgeText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : isDark
                              ? '#94A3B8'
                              : '#475569',
                        },
                      ]}
                    >
                      #{b.boothNumber || '-'}
                    </Text>
                  </View>

                  {/* Middle: Details */}
                  <View style={styles.boothInfoCol}>
                    <View style={styles.boothTitleRow}>
                      <Text
                        style={[
                          styles.boothName,
                          {
                            color: isSelected ? primaryCol : textCol,
                            fontFamily: isSelected
                              ? FontFamily.bold
                              : FontFamily.medium,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {b.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.currentTag}>
                          <Text style={styles.currentTagText}>
                            {t('currentBooth')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Ward & Building Location */}
                    {(Boolean(b.wardNumber || b.wardName) || Boolean(b.locationBuilding)) && (
                      <View style={styles.metaRow}>
                        {Boolean(b.wardNumber || b.wardName) && (
                          <Text style={[styles.metaText, { color: textMuted }]} numberOfLines={1}>
                            {b.wardNumber ? `${t('ward')} ${b.wardNumber}` : b.wardName}
                          </Text>
                        )}
                        {Boolean((b.wardNumber || b.wardName) && b.locationBuilding) && (
                          <Text style={[styles.metaDot, { color: textMuted }]}>•</Text>
                        )}
                        {Boolean(b.locationBuilding) && (
                          <Text style={[styles.metaText, { color: textMuted }]} numberOfLines={1}>
                            {b.locationBuilding}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Total Voters count indicator */}
                    {Boolean(b.totalVoters) && (
                      <View style={styles.voterCountRow}>
                        <MaterialDesignIcons
                          name="account-multiple-outline"
                          size={12}
                          color={textMuted}
                        />
                        <Text style={[styles.voterCountText, { color: textMuted }]}>
                          {b.totalVoters.toLocaleString()} {t('totalVoters')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Right: Radio/Selection Icon */}
                  <View style={styles.actionCol}>
                    {isSelected ? (
                      <MaterialDesignIcons
                        name="check-circle"
                        size={22}
                        color={primaryCol}
                      />
                    ) : (
                      <MaterialDesignIcons
                        name="chevron-right"
                        size={20}
                        color={textMuted}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <MaterialDesignIcons
                name="office-building-marker-outline"
                size={40}
                color={textMuted}
              />
              <Text style={[styles.emptyTitle, { color: textCol }]}>
                {t('noBoothsFound')}
              </Text>
              <Text style={[styles.emptyDesc, { color: textMuted }]}>
                {query ? t('noPollingVotersFound') : t('noBoothsFoundDesc')}
              </Text>
              {Boolean(query) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setQuery('')}
                  style={[styles.clearBtn, { borderColor: primaryCol }]}
                >
                  <Text style={[styles.clearBtnText, { color: primaryCol }]}>
                    {t('clearSearch')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
    maxHeight: 460,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12.5),
    paddingVertical: 0,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  countText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(10.5),
  },
  listScroll: {
    maxHeight: 360,
    width: '100%',
  },
  boothCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
    ...getShadow(1, '#000000', 0.02),
  },
  boothBadge: {
    minWidth: 42,
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boothBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12),
  },
  boothInfoCol: {
    flex: 1,
    gap: 2,
  },
  boothTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boothName: {
    fontSize: rfValue(12.5),
    lineHeight: 17,
    flex: 1,
  },
  currentTag: {
    backgroundColor: '#2563EB15',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  currentTagText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(9),
    color: '#2563EB',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10),
  },
  metaDot: {
    fontSize: rfValue(8),
    marginHorizontal: 4,
  },
  voterCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  voterCountText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(9.5),
  },
  actionCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(14),
    marginTop: 4,
  },
  emptyDesc: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  clearBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  clearBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11.5),
  },
});
