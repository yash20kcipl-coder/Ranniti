import React from 'react';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface ScrollableFilterPillsProps {
  options: FilterOption[];
  activeId: string;
  onSelect: (id: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ScrollableFilterPills: React.FC<ScrollableFilterPillsProps> = ({
  options,
  activeId,
  onSelect,
  containerStyle,
  contentContainerStyle,
}) => {
  const { styles } = useAppTheme(getStyles);

  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {options.map((option) => {
          const isActive = activeId === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              onPress={() => onSelect(option.id)}
              style={[
                styles.pill,
                isActive && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
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
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexShrink: 1,
      width: '100%',
      marginVertical: 10,
    },
    scrollContent: {
      paddingHorizontal: 15,
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    pillActive: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
      ...getShadow(3, '#000000', 0.12),
    },
    label: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.medium,
    },
    labelActive: {
      color: theme.colors.primary || '#1E40AF',
      fontFamily: FontFamily.bold,
    },
    labelInactive: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    badge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    badgeActive: {
      backgroundColor: 'rgba(30, 64, 175, 0.12)',
    },
    badgeText: {
      fontSize: rfValue(10),
      fontFamily: FontFamily.bold,
    },
    badgeTextInactive: {
      color: '#FFFFFF',
    },
    badgeTextActive: {
      color: theme.colors.primary || '#1E40AF',
    },
  });

export default ScrollableFilterPills;
