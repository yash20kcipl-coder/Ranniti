import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';

export interface SectionContainerProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accentColor?: string;
  onPressHeader?: () => void;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  subtitle,
  icon,
  rightElement,
  children,
  style,
  headerStyle,
  contentStyle,
  accentColor,
  onPressHeader,
}) => {
  const { theme } = useAppTheme(() => ({}));

  const HeaderWrapper = onPressHeader ? TouchableOpacity : View;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface || '#FFFFFF',
          borderColor: theme.colors.border || '#E2E8F0',
          borderTopWidth: 4,
          borderTopColor: accentColor
        },
        style,
      ]}
    >
      {(title || icon || rightElement) && (
        <HeaderWrapper
          {...(onPressHeader ? { activeOpacity: 0.7, onPress: onPressHeader } : {})}
          style={[styles.headerRow, headerStyle]}
        >
          <View style={styles.headerLeft}>
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: accentColor
                      ? `${accentColor}15`
                      : theme.colors.vegBackground || '#EFF6FF',
                  },
                ]}
              >
                {icon}
              </View>
            )}
            <View style={styles.titleTextColumn}>
              {title && (
                <Text
                  style={[
                    styles.title,
                    { color: theme.colors.text || '#0F172A' },
                  ]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textSecondary || '#64748B' },
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {rightElement && <View style={styles.headerRight}>{rightElement}</View>}
        </HeaderWrapper>
      )}

      <View style={[styles.contentBody, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...getShadow(3, '#0F172A', 0.05),
  },
  topAccentBar: {
    height: 3,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(18),
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
});
