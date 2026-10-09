import React from 'react';
import { useLanguage } from '../../../languages';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { MasterState } from '../../../store/reducers/master';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export interface AppliedFilterItem {
  key: string;
  label: string;
  valueText: string;
  icon?: string;
}

interface AppliedFiltersBarProps {
  filters: any;
  master: MasterState;
  totalCount?: number;
  currentCount?: number;
  loading?: boolean;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  onOpenFilterModal?: () => void;
  t?: (key: any) => string;
}

export const AppliedFiltersBar: React.FC<AppliedFiltersBarProps> = ({
  filters,
  master,
  onRemoveFilter,
  onClearAll,
  t: customT,
}) => {
  const { t: langT } = useLanguage();
  const t = customT || langT;
  const { theme } = useAppTheme();

  // Resolve human-readable labels from IDs using master data
  const filterChips = React.useMemo(() => {
    const list: AppliedFilterItem[] = [];

    // 1. Search Query
    if (filters.search && filters.search.trim()) {
      list.push({
        key: 'search',
        label: t?.('search') || 'Search',
        valueText: `"${filters.search.trim()}"`,
        icon: 'magnify',
      });
    }

    // 2. Assembly Constituency (AC)
    if (filters.acId && filters.acId !== 'All') {
      const foundAc = master.acs?.find((a) => a.id === filters.acId);
      list.push({
        key: 'acId',
        label: t?.('ac') || 'AC',
        valueText: foundAc ? `${foundAc.name}${foundAc.acNumber ? ` (#${foundAc.acNumber})` : ''}` : 'Selected AC',
        icon: 'map-marker-outline',
      });
    }

    // 3. Polling Booth
    if (filters.boothNo && filters.boothNo !== 'All') {
      const foundBooth = master.booths?.find((b) => b.id === filters.boothNo);
      list.push({
        key: 'boothNo',
        label: t?.('booth') || 'Booth',
        valueText: foundBooth
          ? `${foundBooth.boothNumber ? `#${foundBooth.boothNumber} - ` : ''}${foundBooth.name}`
          : 'Selected Booth',
        icon: 'vote-outline',
      });
    }

    // 4. Supporting Party
    if (filters.supportingParty && filters.supportingParty !== 'All') {
      const foundParty = master.parties?.find(
        (p) => p.id === filters.supportingParty || p.name === filters.supportingParty
      );
      list.push({
        key: 'supportingParty',
        label: t?.('party') || 'Party',
        valueText: foundParty ? foundParty.abbreviation || foundParty.name : filters.supportingParty,
        icon: 'flag-variant-outline',
      });
    }

    // 5. Voted Status
    if (filters.isVoted && filters.isVoted !== 'all') {
      list.push({
        key: 'isVoted',
        label: t?.('status') || 'Status',
        valueText: filters.isVoted === 'voted' ? t?.('voted') || 'Voted' : t?.('notVoted') || 'Not Voted',
        icon: filters.isVoted === 'voted' ? 'check-circle-outline' : 'close-circle-outline',
      });
    }

    // 6. Gender
    if (filters.gender && filters.gender !== 'all') {
      list.push({
        key: 'gender',
        label: t?.('gender') || 'Gender',
        valueText: filters.gender,
        icon: filters.gender === 'Female' ? 'gender-female' : 'gender-male',
      });
    }

    // 7. Age Group
    if (filters.ageGroup) {
      list.push({
        key: 'ageGroup',
        label: t?.('age') || 'Age',
        valueText: filters.ageGroup === '65-200' ? '65+ yrs' : `${filters.ageGroup} yrs`,
        icon: 'calendar-account-outline',
      });
    }

    // 8. Voter Type / Inclination
    if (filters.voterType && filters.voterType !== 'All') {
      list.push({
        key: 'voterType',
        label: t?.('type') || 'Type',
        valueText: filters.voterType,
        icon: 'account-star-outline',
      });
    }

    // 9. Deceased (isDead)
    if (filters.isDead !== undefined && filters.isDead !== '' && filters.isDead !== 'all') {
      list.push({
        key: 'isDead',
        label: t?.('status') || 'Status',
        valueText: filters.isDead === 'true' ? 'Deceased' : 'Alive',
        icon: 'heart-pulse',
      });
    }

    // 10. Influencer Role
    if (filters.influencerRole && filters.influencerRole !== 'all') {
      const roleMap: Record<string, string> = {
        family: '👑 Family Head',
        social: '✨ Social Leader',
        any: '🌟 Influencer',
      };
      list.push({
        key: 'influencerRole',
        label: t?.('role') || 'Role',
        valueText: roleMap[filters.influencerRole] || filters.influencerRole,
        icon: 'account-tie-outline',
      });
    }

    return list;
  }, [filters, master, t]);

  if (filterChips.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface || '#FFFFFF',
          borderBottomColor: theme.colors.border || '#F1F5F9',
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScrollContainer}
      >
        {filterChips.map((chip) => (
          <View
            key={chip.key}
            style={[
              styles.filterChip,
              {
                borderColor: `${theme.colors.primary}30`,
                backgroundColor: `${theme.colors.primary}0D`,
              },
            ]}
          >
            {chip.icon && (
              <MaterialDesignIcons
                name={chip.icon as any}
                size={12}
                color={theme.colors.primary}
                style={{ marginRight: 3 }}
              />
            )}
            <Text style={[styles.chipLabelText, { color: theme.colors.textSecondary || '#64748B' }]}>
              {chip.label}:
            </Text>
            <Text
              style={[styles.chipValueText, { color: theme.colors.primary }]}
              numberOfLines={1}
            >
              {chip.valueText}
            </Text>
            <TouchableOpacity
              onPress={() => onRemoveFilter(chip.key)}
              style={styles.chipRemoveButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <MaterialDesignIcons name="close" size={13} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Clear All Button */}
        <TouchableOpacity
          style={styles.clearAllChip}
          onPress={onClearAll}
          activeOpacity={0.7}
        >
          <MaterialDesignIcons name="close-circle-outline" size={13} color="#EF4444" />
          <Text style={styles.clearAllChipText}>{t('clearAll') || 'Clear All'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AppliedFiltersBar;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 7,
  },
  chipsScrollContainer: {
    paddingHorizontal: 14,
    gap: 6,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  chipLabelText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10.5),
  },
  chipValueText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11),
    maxWidth: 160,
  },
  chipRemoveButton: {
    marginLeft: 3,
    padding: 1,
    borderRadius: 8,
  },
  clearAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllChipText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
    color: '#EF4444',
  },
});
