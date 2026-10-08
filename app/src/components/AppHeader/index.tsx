import React from 'react';
import { appHeaderStyles } from './styles';
import { goBack } from '../../navigation';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Menu, ChevronLeft, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';

const RANNITI_LOGO = require('../../assets/images/ranniti-logo.png');

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string | number;
  showLogo?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  showLanguageToggle?: boolean;
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
  showLanguageToggle = false,
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
  const { language, setLanguage } = useLanguage();

  const handleToggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

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
              <ArrowLeft size={18} color={iconColor} />
            </TouchableOpacity>
          ) : (showMenu || !title) ? (
            <TouchableOpacity
              style={[styles.actionBtn, isPrimary && styles.actionBtnPrimary]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleMenuPress}
            >
              <Menu strokeWidth={2.2} size={18} color={iconColor} />
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

        {/* Right Section: Action badges / Language toggle / Custom elements */}
        {(showLanguageToggle || rightElement) && (
          <View style={styles.rightSection}>
            {showLanguageToggle && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleLanguage}
                style={[styles.langTogglePill, isPrimary && styles.langTogglePillPrimary]}
              >
                <View
                  style={[
                    styles.langSegment,
                    language === 'en' && (isPrimary ? styles.langSegmentActivePrimary : styles.langSegmentActive),
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      language === 'en'
                        ? (isPrimary ? styles.langTextActivePrimary : styles.langTextActive)
                        : (isPrimary ? styles.langTextInactivePrimary : styles.langTextInactive),
                    ]}
                  >
                    EN
                  </Text>
                </View>
                <View
                  style={[
                    styles.langSegment,
                    language === 'hi' && (isPrimary ? styles.langSegmentActivePrimary : styles.langSegmentActive),
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      language === 'hi'
                        ? (isPrimary ? styles.langTextActivePrimary : styles.langTextActive)
                        : (isPrimary ? styles.langTextInactivePrimary : styles.langTextInactive),
                    ]}
                  >
                    हिं
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {rightElement}
          </View>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
