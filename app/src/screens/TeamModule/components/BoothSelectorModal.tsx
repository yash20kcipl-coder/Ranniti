import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { Modal } from '../../../components/Modal';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
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

const getBoothWardId = (b: any): string | null => {
  const wId = b?.wardId ?? b?.ward_id ?? b?.ward?.id;
  return wId !== undefined && wId !== null ? String(wId) : null;
};

const isBoothInWard = (b: any, ward: any): boolean => {
  if (!b || !ward) return false;
  const bWard = b?.wardId ?? b?.ward_id ?? b?.ward?.id ?? b?.wardNumber ?? b?.ward_number;
  if (bWard === undefined || bWard === null) return false;
  const bWardStr = String(bWard).trim().toLowerCase();
  const wardIdStr = String(ward.id).trim().toLowerCase();
  const wardNumStr = ward.wardNumber !== undefined && ward.wardNumber !== null ? String(ward.wardNumber).trim().toLowerCase() : null;
  const wardNameStr = ward.name ? String(ward.name).trim().toLowerCase() : null;

  return (
    bWardStr === wardIdStr ||
    (wardNumStr !== null && (bWardStr === wardNumStr || bWardStr === `ward #${wardNumStr}` || bWardStr === `ward ${wardNumStr}`)) ||
    (wardNameStr !== null && bWardStr === wardNameStr)
  );
};

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
  const [search, setSearch] = useState('');
  const { theme, styles } = useAppTheme(createStyles);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedBoothIds);

  const wardMap = useMemo(() => {
    const map = new Map<string, string>();
    (wards || []).forEach((w: any) => {
      if (w && w.id !== undefined && w.id !== null) {
        map.set(String(w.id), w.name);
        if (w.wardNumber !== undefined) {
          map.set(String(w.wardNumber), w.name);
        }
      }
    });
    return map;
  }, [wards]);

  // Sync temp selections when modal opens or selectedBoothIds change
  React.useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedBoothIds);
      setSearch('');
      setSelectedWardId('');
    }
  }, [visible, selectedBoothIds]);

  const selectedWardObj = useMemo(() => {
    if (!selectedWardId) return null;
    return (wards || []).find((w: any) => String(w.id) === String(selectedWardId)) || null;
  }, [wards, selectedWardId]);

  const filteredBooths = useMemo(() => {
    let list = booths;
    if (selectedWardObj) {
      list = list.filter((b) => isBoothInWard(b, selectedWardObj));
    }
    if (!search.trim()) return list;
    const term = search.trim().toLowerCase();
    return list.filter((b: any) => {
      const bNum = String(b.boothNumber ?? b.booth_number ?? '').toLowerCase();
      const bName = String(b.name || '').toLowerCase();
      const bBuilding = String(b.locationBuilding || b.location_building || '').toLowerCase();
      return bNum.includes(term) || bName.includes(term) || bBuilding.includes(term);
    });
  }, [booths, search, selectedWardObj]);

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
    const allFilteredIds = filteredBooths.map((b) => String(b.id));
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
    filteredBooths.length > 0 && filteredBooths.every((b) => tempSelectedIds.includes(String(b.id)));

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
          {wards.map((ward: any) => {
            const wardIdStr = String(ward.id);
            const isWardActive = selectedWardId === wardIdStr;
            const count = booths.filter((b) => isBoothInWard(b, ward)).length;
            return (
              <TouchableOpacity
                key={wardIdStr}
                style={[
                  styles.wardChip,
                  isWardActive && styles.wardChipActive,
                ]}
                onPress={() => setSelectedWardId(isWardActive ? '' : wardIdStr)}
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
      {!singleSelect && (
        <View style={styles.bulkRow}>
          <Text style={styles.bulkCountText}>
            {t('showing') || 'Showing'} {filteredBooths.length} {t('booths') || 'booths'}
          </Text>
          {filteredBooths.length > 0 && (
            <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7} style={styles.selectAllBtn}>
              <MaterialDesignIcons
                name={areAllFilteredSelected ? "check-circle" : "check-square"}
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.selectAllText}>
                {areAllFilteredSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Booths List */}
      <FlatList
        data={filteredBooths}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={true}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }: { item: BoothMasterItem }) => {
          const itemIdStr = String(item.id);
          const isSelected = tempSelectedIds.includes(itemIdStr);
          const boothWardId = getBoothWardId(item);
          const wardName = boothWardId ? wardMap.get(boothWardId) : null;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleToggleBooth(itemIdStr)}
              style={[
                styles.boothItem,
                isSelected && styles.boothItemSelected,
              ]}
            >
              <View style={styles.boothTextCol}>
                <View style={styles.boothBadgeRow}>
                  <View style={styles.boothNumberBadge}>
                    <Text style={styles.boothNumberText}>
                      Booth #{item.boothNumber ?? (item as any).booth_number ?? '—'}
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
      paddingHorizontal: 12,
      paddingVertical: 6,
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
      fontSize: rfValue(11),
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
      fontSize: rfValue(11),
      color: theme.colors.textSecondary,
    },
    selectAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}12`,
    },
    selectAllText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(11.5),
      color: theme.colors.primary,
    },
    list: {
      maxHeight: 340,
    },
    boothItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    boothItemSelected: {
      borderColor: `${theme.colors.primary}15`,
      backgroundColor: `${theme.colors.primary}09`,
    },
    boothTextCol: {
      flex: 1,
      gap: 4,
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
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    boothNumberText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(11),
      color: theme.colors.primary,
    },
    wardBadge: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    wardBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary,
    },
    boothNameText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(12.5),
      color: theme.colors.text,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    checkOuter: {
      width: 22,
      height: 22,
      borderRadius: 7,
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
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.textSecondary,
    },
    applyBtn: {
      flex: 2,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...getShadow(3, theme.colors.primary, 0.2),
    },
    applyBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: '#FFFFFF',
    },
  });

