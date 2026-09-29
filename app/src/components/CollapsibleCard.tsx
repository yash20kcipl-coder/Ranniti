import React, { useState } from 'react';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface CollapsibleCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const measuredHeight = useSharedValue(0);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Reanimated shared value: 0 is collapsed, 1 is expanded
  const animation = useSharedValue(defaultExpanded ? 1 : 0);

  const toggleExpand = () => {
    const nextState = !expanded;
    setExpanded(nextState);
    animation.value = withTiming(nextState ? 1 : 0, { duration: 250 });
  };

  // Chevron icon rotation style
  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animation.value * 180}deg` }],
    };
  });

  // Hardware-accelerated height and opacity style
  const animatedBodyStyle = useAnimatedStyle(() => {
    if (measuredHeight.value === 0) {
      return {
        height: expanded ? undefined : 0,
        opacity: expanded ? 1 : 0,
      };
    }

    return {
      height: animation.value * measuredHeight.value,
      opacity: animation.value,
    };
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpand}
        style={[styles.header, expanded && styles.headerExpanded]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <MaterialDesignIcons name={icon as any} size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Animated.View style={arrowStyle}>
          <MaterialDesignIcons
            name="chevron-down"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[styles.bodyWrapper, animatedBodyStyle]}>
        <View
          style={styles.body}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height !== measuredHeight.value) {
              measuredHeight.value = height;
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...getShadow(4, theme.colors.shadowColor, 0.02),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: rfValue(12.5),
    fontFamily: FontFamily.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bodyWrapper: {
    overflow: 'hidden',
  },
  body: {
    padding: 18,
    gap: 15,
  },
});
