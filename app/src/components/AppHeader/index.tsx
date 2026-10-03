import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Menu, ChevronLeft } from 'lucide-react-native';
import { appHeaderStyles } from './styles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { goBack } from '../../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RANNITI_LOGO = require('../../assets/images/ranniti-logo.png');

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string | number;
  showLogo?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'primary' | 'transparent';
  style?: StyleProp<ViewStyle>;
  noShadow?: boolean;
  statusBar?: 'default' | 'hidden' | 'light-content' | 'dark-content';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  badge,
  showLogo = !title,
  showBack = false,
  showMenu = false,
  onBack,
  onMenu,
  rightElement,
  variant = 'primary',
  style,
  noShadow = false,
  statusBar = 'default',
}) => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { styles, theme } = useAppTheme(appHeaderStyles);

  const canGoBack = navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack();
  const isPrimary = variant === 'primary';
  const isTransparent = variant === 'transparent';

  const handleMenuPress = () => {
    if (onMenu) {
      onMenu();
    } else if (navigation?.openDrawer) {
      navigation.openDrawer();
    } else if (navigation?.dispatch) {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else if (canGoBack) {
      goBack();
    }
  };

  // Determine container styles
  const containerStyle = [
    styles.headerContainer,
    isPrimary && styles.headerPrimary,
    isTransparent && styles.headerTransparent,
    statusBar === 'hidden' && { paddingTop: top },
    noShadow && { elevation: 0, shadowOpacity: 0 },
    style,
  ];

  const iconColor = isPrimary ? '#FFFFFF' : theme.colors.primary || '#1E40AF';

  return (
    <View style={containerStyle}>
      <View style={styles.contentRow}>
        {/* Left Section: Menu button / Back button + Logo/Title */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={[styles.actionBtn, isPrimary && styles.actionBtnPrimary]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleBackPress}
            >
              <ChevronLeft size={22} color={iconColor} />
            </TouchableOpacity>
          ) : (showMenu || !title) ? (
            <TouchableOpacity
              style={[styles.actionBtn, isPrimary && styles.actionBtnPrimary]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleMenuPress}
            >
              <Menu strokeWidth={2.2} size={22} color={iconColor} />
            </TouchableOpacity>
          ) : null}

          {showLogo ? (
            <View style={styles.logoContainer}>
              <Image
                source={RANNITI_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          ) : title ? (
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.titleText, isPrimary && styles.titleTextPrimary]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {badge !== undefined && (
                  <View style={[styles.badgeContainer, isPrimary && styles.badgeContainerPrimary]}>
                    <Text style={[styles.badgeText, isPrimary && styles.badgeTextPrimary]}>
                      {badge}
                    </Text>
                  </View>
                )}
              </View>
              {subtitle ? (
                <Text
                  style={[styles.subtitleText, isPrimary && styles.subtitleTextPrimary]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Right Section: Action badges / Custom elements */}
        {rightElement ? <View style={styles.rightSection}>{rightElement}</View> : null}
      </View>
    </View>
  );
};

export default AppHeader;
