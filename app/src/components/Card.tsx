import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { Theme } from '../constants/theme';
import { Skeleton } from './Skeleton';
import {
  CARD_BORDER_RADIUS,
  CARD_SHADOW_ELEVATIONS,
  type MobileCardRadiusPreset,
  type MobileCardShadowPreset,
} from '../constants/cardTheme';

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  footer?: React.ReactNode;

  /**
   * Corner radius preset (defaults to 'default', controlled in `app/src/constants/cardTheme.ts`)
   */
  radius?: MobileCardRadiusPreset;

  /**
   * Elevation / shadow preset
   */
  shadow?: MobileCardShadowPreset;

  /**
   * Colored top border accent bar (e.g. primary, secondary, or custom hex)
   */
  accentColor?: string;

  /**
   * Click handler for interactive/tappable card
   */
  onPress?: () => void;
  activeOpacity?: number;

  /**
   * Skeleton loader state
   */
  loading?: boolean;

  /**
   * Custom style overrides
   */
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  rightElement,
  footer,
  radius = 'default',
  shadow = 'md',
  accentColor,
  onPress,
  activeOpacity = 0.85,
  loading = false,
  style,
  headerStyle,
  contentStyle,
  footerStyle,
  titleStyle,
  subtitleStyle,
}) => {
  const { theme, styles } = useAppTheme(createStyles);
  const resolvedRadius = CARD_BORDER_RADIUS[radius] ?? CARD_BORDER_RADIUS.default;
  const elevation = CARD_SHADOW_ELEVATIONS[shadow] ?? CARD_SHADOW_ELEVATIONS.md;

  const shadowStyles = elevation > 0 ? getShadow(elevation, theme.colors.shadowColor, 0.06) : {};

  const cardContainerStyle: ViewStyle = {
    borderRadius: resolvedRadius,
    borderTopWidth: accentColor ? 4 : 1,
    borderTopColor: accentColor || theme.colors.cardBorder || theme.colors.border,
    ...shadowStyles,
  };

  const WrapperComponent = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity, onPress } : {};

  if (loading) {
    return (
      <View style={[styles.card, cardContainerStyle, style]}>
        {(title || icon || rightElement) && (
          <View style={[styles.header, headerStyle]}>
            <View style={styles.headerLeft}>
              <Skeleton width={36} height={36} borderRadius={10} />
              <View style={styles.headerTextCol}>
                <Skeleton width={130} height={16} borderRadius={4} />
                <Skeleton width={180} height={11} borderRadius={4} />
              </View>
            </View>
          </View>
        )}
        <View style={[styles.body, contentStyle]}>
          <Skeleton width="100%" height={80} borderRadius={12} />
        </View>
      </View>
    );
  }

  const hasHeader = Boolean(title || subtitle || icon || rightElement);

  return (
    <WrapperComponent {...wrapperProps} style={[styles.card, cardContainerStyle, style]}>
      {hasHeader && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            {icon && (
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: accentColor
                      ? `${accentColor}15`
                      : theme.colors.vegBackground || `${theme.colors.primary}12`,
                  },
                ]}
              >
                {icon}
              </View>
            )}
            <View style={styles.headerTextCol}>
              {title && (
                <Text
                  numberOfLines={1}
                  style={[styles.title, { color: theme.colors.text }, titleStyle]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  numberOfLines={2}
                  style={[styles.subtitle, { color: theme.colors.textSecondary }, subtitleStyle]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {rightElement && <View style={styles.headerRight}>{rightElement}</View>}
        </View>
      )}

      {children && <View style={[styles.body, contentStyle]}>{children}</View>}

      {footer && (
        <View style={[styles.footer, footerStyle]}>
          {footer}
        </View>
      )}
    </WrapperComponent>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder || theme.colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: rfValue(15),
      fontFamily: FontFamily.bold,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: rfValue(11),
      fontFamily: FontFamily.medium,
    },
    headerRight: {
      marginLeft: 8,
    },
    body: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '40',
    },
  });

export default Card;
