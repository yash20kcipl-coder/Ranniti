import {
  View,
  TextInput,
  ScrollView,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
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

export interface SearchBarProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  onClear?: () => void;
  // Optional tag filter props (e.g. Gallery, AllNotices)
  tags?: string[];
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
  onFilterPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  containerStyle,
  inputStyle,
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  tags,
  selectedTag,
  onSelectTag,
  onFilterPress,
  ...rest
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const inputRef = useRef<TextInput>(null);

  // Focus animation shared values
  const focusProgress = useSharedValue(0);

  const handleFocus = (e: any) => {
    focusProgress.value = withTiming(1, { duration: 250 });
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    focusProgress.value = withTiming(0, { duration: 250 });
    if (onBlur) onBlur(e);
  };

  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    if (onClear) {
      onClear();
    }
    inputRef.current?.clear();
  };

  // Animated style for the search input container
  const containerAnimatedStyle = useAnimatedStyle(() => {
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
      {/* Search Input Container */}
      <View style={styles.searchSection}>
        <Animated.View style={[styles.searchContainer, containerAnimatedStyle]}>
          <AnimatedIcon
            name="magnify"
            size={20}
            style={iconAnimatedStyle}
          />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.colors.text }, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary + '60'}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={theme.colors.primary}
            {...rest}
          />
          {!!value && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButtonContainer}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <MaterialDesignIcons
                name="close-circle"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
        {!!onFilterPress && (
          <TouchableOpacity
            onPress={onFilterPress}
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <MaterialDesignIcons name="filter-variant" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Optional Filter Tags/Pills Scroll Section */}
      {!!tags && tags.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {tags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.8}
                  onPress={() => onSelectTag && onSelectTag(tag)}
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
                    {tag}
                  </Text>
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
      borderRadius: 24, // Premium pill design
      paddingHorizontal: 16, // More breathing room on sides
      height: 48, // Taller size to center tall Oswald font beautifully
      borderWidth: 1,
      ...getShadow(3, theme.colors.shadowColor, 0.03),
    },
    searchInput: {
      flex: 1,
      marginLeft: 10, // Distinct separation from magnifying glass
      marginRight: 24, // Prevents text colliding with close icon
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
      backgroundColor: theme.colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...getShadow(3, theme.colors.shadowColor, 0.03),
    },
    filterSection: {
      marginBottom: 15,
    },
    filterScroll: {
      paddingHorizontal: 18,
      gap: 8,
    },
    filterPill: {
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
  });

export default SearchBar;
