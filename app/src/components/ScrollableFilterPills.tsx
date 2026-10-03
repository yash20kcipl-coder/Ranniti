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
      width: '100%',
      marginVertical: 10,
    },
    scrollContent: {
      paddingHorizontal: 18,
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: 'transparent',
      ...getShadow(2, theme.colors.shadowColor, 0.1),
    },
    pillActive: {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      ...getShadow(4, theme.colors.primary, 0.15),
    },
    label: {
      fontSize: rfValue(12.5),
      fontFamily: FontFamily.medium,
    },
    labelActive: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bodyBold,
    },
    labelInactive: {
      color: theme.colors.textSecondary,
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
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    badgeActive: {
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    badgeText: {
      fontSize: rfValue(10.5),
      fontFamily: FontFamily.bodyBold,
    },
    badgeTextInactive: {
      color: theme.colors.textSecondary,
    },
    badgeTextActive: {
      color: '#FFFFFF',
    },
  });

export default ScrollableFilterPills;
