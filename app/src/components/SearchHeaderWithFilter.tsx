import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Filter, ArrowLeft } from 'lucide-react-native';
import MdSearchBar from './MdSearchBar';
import ScrollableFilterPills, { FilterOption } from './ScrollableFilterPills';
import { useAppTheme } from '../hooks/useAppTheme';
import { getShadow } from '../utils/shadow';
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
          />
        </View>
      </View>

      {/* Quick Filter Pills */}
      {Boolean(filterOptions && filterOptions.length > 0 && onSelectFilterOption) && (
        <ScrollableFilterPills
          options={filterOptions!}
          activeId={activeFilterId || ''}
          onSelect={onSelectFilterOption!}
          containerStyle={styles.pillsContainer}
        />
      )}

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
    },
  });

export default SearchHeaderWithFilter;


