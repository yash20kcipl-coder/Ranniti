import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';

interface MdSearchBarProps extends TextInputProps {
  onFilterPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  showFilter?: boolean;
}

const MdSearchBar: React.FC<MdSearchBarProps> = ({
  onFilterPress,
  containerStyle,
  showFilter = true,
  onFocus,
  onBlur,
  value,
  onChangeText,
  ...rest
}) => {
  const inputRef = useRef<TextInput>(null);

  // Focus animation shared values
  const focusProgress = useSharedValue(0);

  // Micro-interactions shared values for buttons
  const clearPressed = useSharedValue(1);
  const filterPressed = useSharedValue(1);

  // Handle focus
  const handleFocus = (e: any) => {
    focusProgress.value = withTiming(1, { duration: 250 });
    if (onFocus) onFocus(e);
  };

  // Handle blur
  const handleBlur = (e: any) => {
    focusProgress.value = withTiming(0, { duration: 250 });
    if (onBlur) onBlur(e);
  };

  // Clear handler
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    inputRef.current?.clear();
  };

  // Search input container animated style (glassmorphism & subtle scale-up on focus)
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.22)']
    );
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.2)']
    );
    const scale = withSpring(focusProgress.value ? 1.015 : 1.0, { damping: 15 });

    return {
      backgroundColor,
      borderColor,
      transform: [{ scale }],
    };
  });

  // Magnifying glass icon animated style
  const iconAnimatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(focusProgress.value ? 1.1 : 1.0, { damping: 12 });
    const opacity = withTiming(focusProgress.value ? 1.0 : 0.75, { duration: 200 });

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Clear button entry/exit transition
  const hasText = !!value;
  const clearProgress = useSharedValue(0);

  React.useEffect(() => {
    clearProgress.value = withSpring(hasText ? 1 : 0, { damping: 15 });
  }, [hasText, clearProgress]);

  const clearAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: clearProgress.value,
      transform: [
        { scale: clearProgress.value },
        { translateX: (1 - clearProgress.value) * 10 },
      ],
    };
  });

  // Clear button press animated style
  const clearPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: clearPressed.value }],
    };
  });

  // Filter button press animated style
  const filterAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: filterPressed.value }],
    };
  });

  return (
    <View style={[styles.searchSection, containerStyle]}>
      <Animated.View style={[styles.searchContainer, containerAnimatedStyle]}>
        <Animated.View style={iconAnimatedStyle}>
          <MaterialDesignIcons name="magnify" size={15} color="#FFFFFF" />
        </Animated.View>
        <TextInput
          ref={inputRef}
          value={value}
          onBlur={handleBlur}
          onFocus={handleFocus}
          cursorColor="#FFFFFF"
          style={styles.searchInput}
          onChangeText={onChangeText}
          placeholderTextColor="rgba(255, 255, 255, 1)"
          {...rest}
        />
        <Animated.View style={[clearAnimatedStyle, { marginLeft: 6 }]} pointerEvents={hasText ? 'auto' : 'none'}>
          <Pressable
            onPress={handleClear}
            onPressIn={() => {
              clearPressed.value = withSpring(0.85, { damping: 10 });
            }}
            onPressOut={() => {
              clearPressed.value = withSpring(1, { damping: 10 });
            }}
            hitSlop={8}
          >
            <Animated.View style={clearPressStyle}>
              <MaterialDesignIcons
                name="close-circle"
                size={15}
                color="rgba(255, 255, 255, 0.8)"
              />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {showFilter && (
        <Pressable
          onPress={onFilterPress}
          onPressIn={() => {
            filterPressed.value = withSpring(0.92, { damping: 10 });
          }}
          onPressOut={() => {
            filterPressed.value = withSpring(1, { damping: 10 });
          }}
        >
          <Animated.View style={[styles.filterButton, filterAnimatedStyle]}>
            <MaterialDesignIcons name="filter-variant" size={15} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    gap: 8,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 42,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: rfValue(15),
    fontFamily: FontFamily.medium,
    color: '#FFFFFF',
    padding: 0,
  },
  filterButton: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
});

export default MdSearchBar;
