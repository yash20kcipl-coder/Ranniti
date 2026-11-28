import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../../../languages';
import { Theme, darkColors } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { BoothItem } from '../../../store/reducers/booths';
import { AppModal } from '../../../components/AppModal';
import { ScrollView } from '../../../components/ScrollView';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface DashboardBoothFilterProps {
  booths: BoothItem[];
  selectedBoothId: string;
  onSelectBooth: (boothId: string) => void;
  loading?: boolean;
  embedded?: boolean;
  variant?: 'card' | 'embedded' | 'header' | 'hero-text' | 'light-pill';
}

export const DashboardBoothFilter: React.FC<DashboardBoothFilterProps> = ({
  booths,
  selectedBoothId,
  onSelectBooth,
  loading = false,
  embedded = false,
  variant = embedded ? 'embedded' : 'card',
}) => {
  const isHeader = variant === 'header';
  const isHeroText = variant === 'hero-text';
  const isLightPill = variant === 'light-pill';
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);
  const isDark = theme.colors.background === darkColors.background;
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');

  const selectedBooth = useMemo(
    () => booths.find((b) => b.id === selectedBoothId) || null,
    [booths, selectedBoothId]
  );

  const filteredBooths = useMemo(() => {
    if (!query.trim()) return booths;
    const q = query.trim().toLowerCase();
    return booths.filter((b) => {
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

  const handleOpen = () => {
    setQuery('');
    setModalVisible(true);
  };

  const handleSelect = (boothId: string) => {
    onSelectBooth(boothId);
    setModalVisible(false);
  };

  const primaryCol = theme.colors.primary;
  const borderCol = theme.colors.cardBorder || theme.colors.border;
  const subtleBg = isDark ? '#0F172A' : '#F8FAFC';

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpen}
        style={
          isHeroText
            ? styles.heroTextBtn
            : isLightPill
              ? styles.lightPillBtn
              : isHeader
                ? styles.headerBar
                : variant === 'embedded'
                  ? styles.embeddedRow
                  : styles.card
        }
      >
        {isHeroText ? (
          <View style={styles.heroTextRow}>
            <Text style={styles.heroTextTitle} numberOfLines={1}>
              {selectedBooth ? `#${selectedBooth.boothNumber} ${selectedBooth.name}` : t('allAssignedBooths')}
            </Text>
            <Text style={styles.heroTextCount}>({booths.length})</Text>
            <MaterialDesignIcons name="chevron-down" size={18} color="#FFFFFF" />
          </View>
        ) : isLightPill ? (
          <View style={styles.lightPillRow}>
            <View style={styles.lightPillTextWrap}>
              <Text style={styles.lightPillSub} numberOfLines={1}>
                {booths.length} {t('booths')}
              </Text>
              <Text style={styles.lightPillTitle} numberOfLines={1}>
                {selectedBooth ? `#${selectedBooth.boothNumber} ${selectedBooth.name}` : t('allAssignedBooths')}
              </Text>
            </View>
            <MaterialDesignIcons name="chevron-down" size={18} color="#1E3A8A" />
          </View>
        ) : isHeader ? (
          <View style={styles.compactRow}>
            <MaterialDesignIcons
              name="office-building-marker"
              size={15}
              color="#FFFFFF"
            />
            <Text style={styles.compactLabel} numberOfLines={1}>
              {selectedBooth
                ? `#${selectedBooth.boothNumber} • ${selectedBooth.name}`
                : `${t('allAssignedBooths')} (${booths.length})`}
            </Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.badgeBox,
                {
                  backgroundColor: selectedBooth
                    ? primaryCol + '18'
                    : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                  borderColor: selectedBooth ? primaryCol + '35' : borderCol,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={primaryCol} />
              ) : selectedBooth ? (
                <Text style={[styles.badgeNumber, { color: primaryCol }]} numberOfLines={1}>
                  #{selectedBooth.boothNumber}
                </Text>
              ) : (
                <MaterialDesignIcons
                  name="office-building-marker"
                  size={20}
                  color={primaryCol}
                />
              )}
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.microLabel} numberOfLines={1}>
                {t('filterByBooth')}
              </Text>
              <Text style={styles.titleText} numberOfLines={1}>
                {selectedBooth ? selectedBooth.name : t('allAssignedBooths')}
              </Text>
              <Text style={styles.subText} numberOfLines={1}>
                {selectedBooth
                  ? [
                    selectedBooth.wardNumber
                      ? `${t('ward')} ${selectedBooth.wardNumber}`
                      : selectedBooth.wardName,
                    selectedBooth.locationBuilding,
                  ]
                    .filter(Boolean)
                    .join(' • ') || `${t('booth')} #${selectedBooth.boothNumber}`
                  : `${booths.length} ${t('assignedBooths')}`}
              </Text>
            </View>
          </>
        )}

        {(isHeroText || isLightPill) ? null : isHeader ? (
          <View style={styles.rightRow}>
            {Boolean(selectedBoothId) && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onSelectBooth('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerClearBtn}
              >
                <MaterialDesignIcons name="close" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <MaterialDesignIcons name="chevron-down" size={16} color="rgba(255,255,255,0.85)" />
          </View>
        ) : (
          <View style={styles.rightRow}>
            {Boolean(selectedBoothId) && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onSelectBooth('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.clearBtn,
                  { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                ]}
              >
                <MaterialDesignIcons
                  name="close"
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            <View
              style={[
                styles.chevronPill,
                {
                  backgroundColor: primaryCol + '14',
                  borderColor: primaryCol + '30',
                },
              ]}
            >
              <MaterialDesignIcons
                name="chevron-down"
                size={16}
                color={primaryCol}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Polished Booth Picker Modal (matching BoothPickerModal) */}
      <AppModal
        visible={modalVisible}
        icon="office-building-marker"
        title={t('selectBoothFilter')}
        message={t('selectBoothSubtitle')}
        onDismiss={() => setModalVisible(false)}
      >
        <View style={[styles.modalBody, { width: "100%" }]}>
          {/* Search Input */}
          {booths.length > 3 && (
            <View
              style={[
                styles.searchBar,
                { backgroundColor: subtleBg, borderColor: borderCol },
              ]}
            >
              <MaterialDesignIcons
                name="magnify"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('searchBoothsPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.searchInput, { color: theme.colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {Boolean(query) && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialDesignIcons
                    name="close-circle"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* List */}
          <ScrollView
            useFlex={false}
            useThemeBackground={false}
            style={[styles.listScroll]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* All Assigned Booths Option */}
            {!query.trim() && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleSelect('')}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: !selectedBoothId
                      ? primaryCol + '12'
                      : subtleBg,
                    borderColor: !selectedBoothId ? primaryCol : borderCol,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionBadge,
                    {
                      backgroundColor: !selectedBoothId
                        ? primaryCol
                        : primaryCol + '18',
                    },
                  ]}
                >
                  <MaterialDesignIcons
                    name="view-grid-outline"
                    size={18}
                    color={!selectedBoothId ? '#FFFFFF' : primaryCol}
                  />
                </View>

                <View style={styles.optionInfo}>
                  <Text
                    style={[styles.optionTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {t('allAssignedBooths')}
                  </Text>
                  <Text
                    style={[
                      styles.optionSub,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {booths.length} {t('assignedBooths')}
                  </Text>
                </View>

                {!selectedBoothId && (
                  <MaterialDesignIcons
                    name="check-circle"
                    size={20}
                    color={primaryCol}
                  />
                )}
              </TouchableOpacity>
            )}

            {filteredBooths.length > 0 ? (
              filteredBooths.map((b) => {
                const isSelected = b.id === selectedBoothId;
                const metaParts = [
                  b.wardNumber ? `${t('ward')} ${b.wardNumber}` : b.wardName,
                  b.locationBuilding,
                ].filter(Boolean);

                return (
                  <TouchableOpacity
                    key={b.id}
                    activeOpacity={0.75}
                    onPress={() => handleSelect(b.id)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? primaryCol + '12'
                          : subtleBg,
                        borderColor: isSelected ? primaryCol : borderCol,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.optionBadge,
                        {
                          backgroundColor: isSelected
                            ? primaryCol
                            : primaryCol + '15',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionBadgeText,
                          { color: isSelected ? '#FFFFFF' : primaryCol },
                        ]}
                        numberOfLines={1}
                      >
                        #{b.boothNumber}
                      </Text>
                    </View>

                    <View style={styles.optionInfo}>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {b.name}
                      </Text>
                      {metaParts.length > 0 && (
                        <Text
                          style={[
                            styles.optionSub,
                            { color: theme.colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {metaParts.join(' • ')}
                        </Text>
                      )}
                    </View>

                    {isSelected && (
                      <MaterialDesignIcons
                        name="check-circle"
                        size={20}
                        color={primaryCol}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <MaterialDesignIcons
                  name="office-building-remove-outline"
                  size={28}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('noBoothsFound')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </AppModal>
    </>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder || theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...getShadow(3, theme.colors.shadowColor, 0.06),
    },
    embeddedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 12,
    },
    headerBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerClearBtn: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    compactRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minWidth: 0,
    },
    compactLabel: {
      flex: 1,
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: '#FFFFFF',
    },
    badgeBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeNumber: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    microLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    titleText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13.5),
      color: theme.colors.text,
    },
    subText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary,
    },
    rightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    clearBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronPill: {
      width: 32,
      height: 32,
      borderRadius: 11,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTextBtn: {
      flex: 1,
      justifyContent: 'center',
    },
    heroTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroTextTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: '#FFFFFF',
      flexShrink: 1,
    },
    heroTextCount: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: 'rgba(255, 255, 255, 0.75)',
    },
    lightPillBtn: {
      flex: 1,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    lightPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    lightPillTextWrap: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    lightPillSub: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: '#64748B',
    },
    lightPillTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: '#0F172A',
    },
    modalBody: {
      gap: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.body,
      fontSize: rfValue(13),
      paddingVertical: 0,
    },
    listScroll: {
      maxHeight: 340,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
    },
    optionBadge: {
      width: 40,
      height: 40,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
    },
    optionInfo: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    optionTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
    },
    optionSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      gap: 8,
    },
    emptyText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12.5),
    },
  });
