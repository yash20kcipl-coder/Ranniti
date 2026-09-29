import {
  View,
  TextInput,
  ScrollView,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import React, { useRef } from 'react';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const AnimatedIcon = Animated.createAnimatedComponent(MaterialDesignIcons);

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface SearchWithFiltersProps {
  containerStyle?: StyleProp<ViewStyle>;
  searchContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  // Search state
  search: string;
  onChangeSearch: (text: string) => void;
  placeholder?: string;
  // Variant: 'standard' (light card search bar) or 'header' (semi-transparent on primary green background)
  variant?: 'standard' | 'header';
  // Filter callback
  onFilterPress?: () => void;
  // Pills/badges state
  options: FilterOption[];
  activeId: string;
  onSelectOption: (id: string) => void;
}

export const SearchWithFilters: React.FC<SearchWithFiltersProps> = ({
  containerStyle,
  searchContainerStyle,
  inputStyle,
  search,
  onChangeSearch,
  placeholder = 'Search...',
  variant = 'standard',
  onFilterPress,
  options,
  activeId,
  onSelectOption,
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const inputRef = useRef<TextInput>(null);

  // Focus animation shared values
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    focusProgress.value = withTiming(1, { duration: 250 });
  };

  const handleBlur = () => {
    focusProgress.value = withTiming(0, { duration: 250 });
  };

  const handleClear = () => {
    onChangeSearch('');
    inputRef.current?.clear();
  };

  const isHeader = variant === 'header';

  // Animated style for the search input container
  const containerAnimatedStyle = useAnimatedStyle(() => {
    if (isHeader) {
      const scale = withSpring(focusProgress.value ? 1.015 : 1.0, { damping: 15 });
      return {
        transform: [{ scale }],
      };
    }

    const backgroundColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.colors.inputBackground, theme.colors.surface]
    );
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    );
    const scale = withSpring(focusProgress.value ? 1.015 : 1.0, { damping: 15 });
    const borderWidth = withTiming(focusProgress.value ? 1.5 : 1.0, { duration: 250 });

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      transform: [{ scale }],
    };
  });

  // Animated style for the magnifying glass icon
  const iconAnimatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(focusProgress.value ? 1.1 : 1.0, { damping: 12 });
    if (isHeader) {
      return {
        transform: [{ scale }],
        color: 'rgba(255, 255, 255, 0.85)',
      };
    }

    const color = interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.colors.textSecondary, theme.colors.primary]
    );

    return {
      transform: [{ scale }],
      color,
    };
  });

  return (
    <View style={[styles.mainContainer, containerStyle]}>
      {/* Search Input Row with Optional Filter Button */}
      <View style={[styles.searchSection, searchContainerStyle]}>
        <Animated.View
          style={[
            styles.searchContainer,
            isHeader && styles.searchContainerHeader,
            containerAnimatedStyle,
          ]}
        >
          <AnimatedIcon
            name="magnify"
            size={20}
            style={iconAnimatedStyle}
          />
          <TextInput
            ref={inputRef}
            style={[
              styles.searchInput,
              isHeader ? { color: '#FFFFFF' } : { color: theme.colors.text },
              inputStyle,
            ]}
            placeholder={placeholder}
            placeholderTextColor={isHeader ? 'rgba(255, 255, 255, 0.55)' : theme.colors.textSecondary + '60'}
            value={search}
            onChangeText={onChangeSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={isHeader ? '#FFFFFF' : theme.colors.primary}
          />
          {!!search && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButtonContainer}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <MaterialDesignIcons
                name="close-circle"
                size={18}
                color={isHeader ? 'rgba(255, 255, 255, 0.8)' : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {!!onFilterPress && (
          <TouchableOpacity
            style={[styles.filterButton, isHeader && styles.filterButtonHeader]}
            activeOpacity={0.8}
            onPress={onFilterPress}
          >
            <MaterialDesignIcons
              name="filter-variant"
              size={20}
              color={isHeader ? '#FFFFFF' : theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Filter Options Scrollbar with Number Badges */}
      {!!options && options.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {options.map((option) => {
              const isActive = activeId === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.8}
                  onPress={() => onSelectOption(option.id)}
                  style={[
                    styles.filterPill,
                    isActive && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.count !== undefined && (
                    <View
                      style={[
                        styles.badge,
                        isActive ? styles.badgeActive : styles.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                        ]}
                      >
                        {option.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    mainContainer: {
      width: '100%',
    },
    searchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      marginTop: 12,
      marginBottom: 10,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 24,
      paddingHorizontal: 16,
      height: 48,
      borderWidth: 1,
      ...getShadow(3, theme.colors.shadowColor, 0.03),
    },
    searchContainerHeader: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'transparent',
      borderWidth: 0,
      ...getShadow(0, '#000000', 0),
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      marginRight: 24,
      fontSize: rfValue(13.5),
      fontFamily: FontFamily.medium,
      paddingVertical: 0,
      height: '100%',
      textAlignVertical: 'center',
    },
    clearButtonContainer: {
      position: 'absolute',
      right: 16,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...getShadow(3, theme.colors.shadowColor, 0.03),
    },
    filterButtonHeader: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'transparent',
      borderWidth: 0,
      ...getShadow(0, '#000000', 0),
    },
    filterSection: {
      marginBottom: 15,
    },
    filterScroll: {
      paddingHorizontal: 18,
      gap: 8,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterPillActive: {
      backgroundColor: theme.colors.primary,
    },
    filterPillText: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.medium,
      color: theme.colors.textSecondary,
    },
    filterPillTextActive: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bodyBold,
    },
    badge: {
      marginLeft: 6,
      paddingHorizontal: 7,
      paddingVertical: 1.5,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeInactive: {
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    badgeActive: {
      backgroundColor: 'rgba(255,255,255,0.24)',
    },
    badgeText: {
      fontSize: rfValue(10),
    },
    badgeTextInactive: {
      color: theme.colors.textSecondary,
      fontFamily: FontFamily.bodyBold,
    },
    badgeTextActive: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bodyBold,
    },
  });

export default SearchWithFilters;
