import React from 'react';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
  color?: string;
  activeBg?: string;
  activeText?: string;
  inactiveBg?: string;
  inactiveText?: string;
  icon?: string;
  badgeBg?: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  activeId: string;
  onSelect: (id: string) => void;
  containerStyle?: any;
}

const FilterPills: React.FC<FilterPillsProps> = ({ options, activeId, onSelect, containerStyle }) => {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.segmentTrack, { backgroundColor: theme.colors.inputBackground }]}>
        {options.map((option) => {
          const isActive = activeId === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              onPress={() => onSelect(option.id)}
              style={[
                styles.segmentItem,
                isActive && [styles.activeSegment, { backgroundColor: theme.colors.primary }],
              ]}
            >
              <Text
                adjustsFontSizeToFit
                style={[
                  styles.label,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                    fontFamily: isActive ? FontFamily.bodyBold : FontFamily.body,
                  },
                ]}
              >
                {option.label}
              </Text>
              {option.count !== undefined && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Text
                    adjustsFontSizeToFit
                    style={[
                      styles.badgeText,
                      {
                        color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                        fontFamily: FontFamily.bodyBold,
                      },
                    ]}
                  >
                    {option.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 18,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeSegment: {
    ...getShadow(4, '#000000', 0.12),
  },
  label: {
    fontSize: rfValue(11),
    letterSpacing: 0.1,
  },
  badge: {
    marginLeft: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: rfValue(9),
  },
});

export default FilterPills;
