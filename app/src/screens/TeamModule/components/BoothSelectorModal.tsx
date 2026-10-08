import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { Modal } from '../../../components/Modal';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { BoothMasterItem, WardMasterItem } from '../../../store/reducers/master';

export interface BoothSelectorModalProps {
  visible: boolean;
  onDismiss: () => void;
  selectedBoothIds: string[];
  onSelectBooths: (boothIds: string[]) => void;
  booths: BoothMasterItem[];
  wards?: WardMasterItem[];
  singleSelect?: boolean;
  title?: string;
}

export const BoothSelectorModal: React.FC<BoothSelectorModalProps> = ({
  visible,
  onDismiss,
  selectedBoothIds,
  onSelectBooths,
  booths = [],
  wards = [],
  singleSelect = false,
  title,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);
  const [search, setSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedBoothIds);

  const wardMap = useMemo(() => new Map((wards || []).map((w) => [w.id, w.name])), [wards]);

  // Sync temp selections when modal opens or selectedBoothIds change
  React.useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedBoothIds);
      setSearch('');
      setSelectedWardId('');
    }
  }, [visible, selectedBoothIds]);

  const filteredBooths = useMemo(() => {
    let list = booths;
    if (selectedWardId) {
      list = list.filter((b) => b.wardId === selectedWardId);
    }
    if (!search.trim()) return list;
    const term = search.trim().toLowerCase();
    return list.filter(
      (b) =>
        (b.name && b.name.toLowerCase().includes(term)) ||
        (b.boothNumber !== undefined && String(b.boothNumber).includes(term))
    );
  }, [booths, search, selectedWardId]);

  const handleToggleBooth = (id: string) => {
    if (singleSelect) {
      setTempSelectedIds([id]);
    } else {
      if (tempSelectedIds.includes(id)) {
        setTempSelectedIds(tempSelectedIds.filter((bId) => bId !== id));
      } else {
        setTempSelectedIds([...tempSelectedIds, id]);
      }
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredBooths.map((b) => b.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => tempSelectedIds.includes(id));
    if (areAllSelected) {
      setTempSelectedIds(tempSelectedIds.filter((id) => !allFilteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...tempSelectedIds, ...allFilteredIds]));
      setTempSelectedIds(merged);
    }
  };

  const handleApply = () => {
    onSelectBooths(tempSelectedIds);
    onDismiss();
  };

  const areAllFilteredSelected =
    filteredBooths.length > 0 && filteredBooths.every((b) => tempSelectedIds.includes(b.id));

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      position="center"
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialDesignIcons name="map-marker-multiple" size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>
            {title || (singleSelect ? t('selectBooths') || 'Select Polling Booth' : t('assignPollingBooths') || 'Assign Polling Booths')}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {singleSelect
          ? (t('selectOnePrimaryBooth') || 'Select 1 primary polling booth for this cadre')
          : `${t('selected') || 'Selected'} ${tempSelectedIds.length} ${t('of') || 'of'} ${booths.length} ${t('availableBooths') || 'available booths'}`}
      </Text>

      {/* Ward Filter Pills (if wards are present) */}
      {wards && wards.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.wardScroll}
          contentContainerStyle={styles.wardScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.wardChip,
              !selectedWardId && styles.wardChipActive,
            ]}
            onPress={() => setSelectedWardId('')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.wardChipText,
                !selectedWardId && styles.wardChipTextActive,
              ]}
            >
              {t('allWards') || 'All Wards'} ({booths.length})
            </Text>
          </TouchableOpacity>
          {wards.map((ward) => {
            const isWardActive = selectedWardId === ward.id;
            const count = booths.filter((b) => b.wardId === ward.id).length;
            return (
              <TouchableOpacity
                key={ward.id}
                style={[
                  styles.wardChip,
                  isWardActive && styles.wardChipActive,
                ]}
                onPress={() => setSelectedWardId(ward.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.wardChipText,
                    isWardActive && styles.wardChipTextActive,
                  ]}
                >
                  {ward.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialDesignIcons name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchBoothPlaceholder') || "Search booth number or station name..."}
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {Boolean(search) && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialDesignIcons name="close-circle" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Select All Toggle for Multi-Select */}
      {!singleSelect && filteredBooths.length > 0 && (
        <View style={styles.bulkRow}>
          <Text style={styles.bulkCountText}>
            {t('showing') || 'Showing'} {filteredBooths.length} {t('booths') || 'booths'}
          </Text>
          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={styles.selectAllText}>
              {areAllFilteredSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booths List */}
      <FlatList
        data={filteredBooths}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={true}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }: { item: BoothMasterItem }) => {
          const isSelected = tempSelectedIds.includes(item.id);
          const wardName = item.wardId ? wardMap.get(item.wardId) : null;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleToggleBooth(item.id)}
              style={[
                styles.boothItem,
                isSelected && styles.boothItemSelected,
              ]}
            >
              <View style={styles.boothTextCol}>
                <View style={styles.boothBadgeRow}>
                  <View style={styles.boothNumberBadge}>
                    <Text style={styles.boothNumberText}>
                      Booth #{item.boothNumber ?? '—'}
                    </Text>
                  </View>
                  {wardName && (
                    <View style={styles.wardBadge}>
                      <Text style={styles.wardBadgeText} numberOfLines={1}>
                        📍 {wardName}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.boothNameText} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>

              <View
                style={[
                  singleSelect ? styles.radioOuter : styles.checkOuter,
                  isSelected && styles.checkOuterSelected,
                ]}
              >
                {isSelected && (
                  singleSelect ? (
                    <View style={styles.radioInner} />
                  ) : (
                    <MaterialDesignIcons name="check" size={14} color="#FFFFFF" />
                  )
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialDesignIcons name="map-marker-off" size={32} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{t('noBoothsFound') || 'No polling booths found'}</Text>
          </View>
        }
      />

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>
            {singleSelect
              ? (t('confirmBooth') || 'Confirm Booth')
              : `${t('done') || 'Done'} (${tempSelectedIds.length})`}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default BoothSelectorModal;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalContent: {
      width: '92%',
      maxHeight: '85%',
      backgroundColor: theme.colors.surface,
      borderRadius: 22,
      padding: 18,
      alignSelf: 'center',
      ...getShadow(8, '#0F172A', 0.2),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text,
    },
    subtitle: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11.5),
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    wardScroll: {
      marginBottom: 10,
    },
    wardScrollContent: {
      gap: 6,
      paddingVertical: 2,
    },
    wardChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    wardChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    wardChipText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary,
    },
    wardChipTextActive: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bold,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.subtleSurface,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.body,
      fontSize: rfValue(12.5),
      color: theme.colors.text,
      padding: 0,
    },
    bulkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    bulkCountText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary,
    },
    selectAllText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(11),
      color: theme.colors.primary,
    },
    list: {
      maxHeight: 340,
    },
    boothItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    boothItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}15`,
    },
    boothTextCol: {
      flex: 1,
      gap: 3,
      paddingRight: 10,
    },
    boothBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    boothNumberBadge: {
      alignSelf: 'flex-start',
      backgroundColor: `${theme.colors.primary}18`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    boothNumberText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10.5),
      color: theme.colors.primary,
    },
    wardBadge: {
      backgroundColor: theme.colors.subtleSurface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    wardBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
      color: theme.colors.textSecondary,
    },
    boothNameText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(12),
      color: theme.colors.text,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    checkOuter: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOuterSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    cancelBtn: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: theme.colors.textSecondary,
    },
    applyBtn: {
      flex: 2,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...getShadow(3, theme.colors.primary, 0.2),
    },
    applyBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: '#FFFFFF',
    },
  });
