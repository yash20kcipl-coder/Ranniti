import React from 'react';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import ScrollableFilterPills, { FilterOption } from './ScrollableFilterPills';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { View, StyleSheet, TouchableOpacity, TextInput, StyleProp, ViewStyle } from 'react-native';

export interface SearchAndFilterHeaderProps {
  containerStyle?: StyleProp<ViewStyle>;
  // Search state
  search: string;
  onChangeSearch: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  // Pills state
  options?: FilterOption[];
  activeId?: string;
  onSelectOption?: (id: string) => void;
  // Children to render inside the white card below the pills
  children?: React.ReactNode;
}

export const SearchAndFilterHeader: React.FC<SearchAndFilterHeaderProps> = ({
  containerStyle,
  search,
  onChangeSearch,
  placeholder = 'Search...',
  onFilterPress,
  options,
  activeId,
  onSelectOption,
  children,
}) => {
  const { styles } = useAppTheme(getStyles);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Green Header Search Row */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialDesignIcons name="magnify" size={20} color="rgba(255, 255, 255, 0.7)" />
          <TextInput
            placeholder={placeholder}
            style={styles.searchInput}
            value={search}
            onChangeText={onChangeSearch}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            selectionColor="#FFFFFF"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => onChangeSearch('')}
              style={styles.clearButton}
              hitSlop={8}
            >
              <MaterialDesignIcons name="close-circle" size={18} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
        </View>
        {!!onFilterPress && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onFilterPress}
            activeOpacity={0.8}
          >
            <MaterialDesignIcons name="filter-variant" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* White Overlapping Card Content Container */}
      <View style={styles.contentContainer}>
        {/* Scrollable Filter Pills inside the white card - only if options provided */}
        {options && options.length > 0 && (
          <ScrollableFilterPills
            options={options}
            activeId={activeId || ''}
            onSelect={onSelectOption || (() => {})}
            containerStyle={styles.pillsContainer}
          />
        )}

        {/* Any children (like MdFlatList) rendered inside the white card */}
        {children}
      </View>
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    searchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingBottom: 15,
      gap: 12,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      height: 42,
      color: '#FFFFFF',
      fontFamily: FontFamily.body,
      fontSize: rfValue(13.5),
      marginLeft: 8,
      padding: 0,
    },
    clearButton: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    filterButton: {
      width: 42,
      height: 42,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
      overflow: 'hidden',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: theme.colors.background,
    },
    pillsContainer: {
      marginVertical: 12,
    },
  });

export default SearchAndFilterHeader;
