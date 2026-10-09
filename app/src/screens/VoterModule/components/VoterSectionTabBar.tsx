import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

export interface VoterTabItem<T = string> {
  key: T;
  label: string;
  icon?: string;
  hasError?: boolean;
}

export interface VoterSectionTabBarProps<T = string> {
  tabs: VoterTabItem<T>[];
  activeTab: T;
  onTabPress: (tabKey: T) => void;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const VoterSectionTabBar = <T extends string = string>({
  tabs,
  activeTab,
  onTabPress,
  containerStyle,
  contentContainerStyle,
}: VoterSectionTabBarProps<T>) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.tabBarContainer,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
        containerStyle,
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabScrollContent, contentContainerStyle]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onTabPress(tab.key)}
              style={[
                styles.tabPill,
                {
                  backgroundColor: isActive ? theme.colors.primary : '#F1F5F9',
                  borderColor: tab.hasError
                    ? theme.colors.error || '#EF4444'
                    : isActive
                      ? theme.colors.primary
                      : theme.colors.border || '#E2E8F0',
                },
              ]}
            >
              {Boolean(tab.icon) && (
                <MaterialDesignIcons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                />
              )}
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.text,
                    fontFamily: isActive ? FontFamily.bodyBold : FontFamily.medium,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tab.hasError && <View style={styles.errorDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: rfValue(12),
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 2,
  },
});

export default VoterSectionTabBar;
