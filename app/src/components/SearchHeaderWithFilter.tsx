import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import MdSearchBar from './MdSearchBar';
import ScrollableFilterPills, { FilterOption } from './ScrollableFilterPills';
import { useAppTheme } from '../hooks/useAppTheme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goBack } from '../navigation';

export interface SearchHeaderWithFilterProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onBackPress?: () => void;
  showBackButton?: boolean;
  backIconColor?: string;
  backBtnStyle?: StyleProp<ViewStyle>;
  filterOptions?: FilterOption[];
  activeFilterId?: string;
  onSelectFilterOption?: (id: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  searchRowStyle?: StyleProp<ViewStyle>;
  searchContainerStyle?: StyleProp<ViewStyle>;
  filterBtnStyle?: StyleProp<ViewStyle>;
  filterIconColor?: string;
  filterIconSize?: number;
  totalCount?: number;
  currentCount?: number;
  loadingCount?: boolean;
  countLabel?: string;
  countIcon?: string;
  isFiltered?: boolean;
  showFilter?: boolean;
  children?: React.ReactNode;
}

export const SearchHeaderWithFilter: React.FC<SearchHeaderWithFilterProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilterPress,
  onBackPress,
  showBackButton,
  backIconColor = '#FFFFFF',
  backBtnStyle,
  filterOptions,
  activeFilterId,
  onSelectFilterOption,
  containerStyle,
  searchRowStyle,
  searchContainerStyle,
  totalCount,
  currentCount,
  loadingCount = false,
  countLabel,
  countIcon,
  isFiltered = false,
  showFilter,
  children,
}) => {
  const { top } = useSafeAreaInsets();
  const { styles } = useAppTheme(getStyles);

  const shouldShowBack = Boolean(onBackPress) || Boolean(showBackButton);

  return (
    <View style={[styles.headerCard, { paddingTop: top + 10 }, containerStyle]}>
      {/* Search Bar Row with optional Back Button */}
      <View style={[styles.topRow, searchRowStyle]}>
        {shouldShowBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBackPress || goBack}
            style={[styles.backBtn, backBtnStyle]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft {...({ size: 22, color: backIconColor } as any)} />
          </TouchableOpacity>
        )}

        <View style={[styles.searchContainer, searchContainerStyle]}>
          <MdSearchBar
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            onFilterPress={onFilterPress}
            containerStyle={{ marginHorizontal: 0, marginBottom: 0 }}
            showFilter={showFilter !== undefined ? showFilter : Boolean(onFilterPress)}
          />
        </View>
      </View>

      {/* Quick Filter Pills */}
      <View style={{ flexDirection: "row", flexShrink: 1, justifyContent: "space-between" }}>
        {Boolean(filterOptions && filterOptions.length > 0 && onSelectFilterOption) && (
          <ScrollableFilterPills
            options={filterOptions!}
            activeId={activeFilterId || ''}
            onSelect={onSelectFilterOption!}
            containerStyle={styles.pillsContainer}
          />
        )}
        {totalCount !== undefined && (
          <View style={styles.countRow}>
            <View style={styles.countInfoContainer}>
              <View style={styles.countIconDot}>
                <MaterialDesignIcons
                  size={13}
                  color="#FFFFFF"
                  name={(countIcon as any) || 'user'}
                />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.countPrimaryText}>
                  {loadingCount ? 'Updating...' : `${totalCount.toLocaleString()} ${countLabel || (totalCount === 1 ? 'Voter' : 'Voters')}`}
                </Text>
                {currentCount !== undefined && currentCount > 0 && totalCount > currentCount && (
                  <Text style={styles.pagedCountText}>
                    (Showing {currentCount})
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
      {children}
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    headerCard: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      backgroundColor: theme.colors.header,
      borderBottomColor: theme.colors.border || '#E2E8F0',
    },
    topRow: {
      gap: 8,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    backBtn: {
      width: 42,
      height: 42,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    searchContainer: {
      flex: 1,
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
      ...getShadow(1, '#000000', 0.04),
    },
    pillsContainer: {
      marginVertical: 0,
      flex: 1,
    },
    countRow: {
      paddingRight: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    countInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    countIconDot: {
      width: 28,
      height: 28,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
    },
    countPrimaryText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: '#FFFFFF',
    },
    filteredBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    filteredBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    pagedCountText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(10),
      color: 'rgba(255, 255, 255, 0.75)',
    },
  });

export default SearchHeaderWithFilter;


