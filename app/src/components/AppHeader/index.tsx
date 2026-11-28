import React, { useState } from 'react';
import { appHeaderStyles } from './styles';
import { goBack } from '../../navigation';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Menu, ChevronLeft, ArrowLeft, Globe, ChevronDown, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleProp, ViewStyle, Modal as RNModal, TouchableWithoutFeedback, StyleSheet } from 'react-native';

const RANNITI_LOGO = require('../../assets/images/ranniti-logo.png');

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string | number;
  badgeVariant?: 'primary' | 'secondary';
  showLogo?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  showLanguageToggle?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  rightElement?: React.ReactNode;
  bottomContent?: React.ReactNode;
  variant?: 'default' | 'primary' | 'transparent';
  style?: StyleProp<ViewStyle>;
  noShadow?: boolean;
  statusBar?: 'default' | 'hidden' | 'light-content' | 'dark-content';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'primary',
  showLogo = !title,
  showBack = false,
  showMenu = false,
  showLanguageToggle = false,
  onBack,
  onMenu,
  rightElement,
  bottomContent,
  variant = 'primary',
  style,
  noShadow = false,
  statusBar = 'default',
}) => {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { styles, theme } = useAppTheme(appHeaderStyles);
  const { language, setLanguage } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const LANGUAGE_OPTIONS: Array<{ code: 'en' | 'hi' | 'gu'; short: string; label: string; native: string }> = [
    { code: 'en', short: 'EN', label: 'English', native: 'English' },
    { code: 'hi', short: 'हिं', label: 'Hindi', native: 'हिन्दी' },
    { code: 'gu', short: 'ગુ', label: 'Gujarati', native: 'ગુજરાતી' },
  ];

  const activeLang = LANGUAGE_OPTIONS.find((l) => l.code === language) || LANGUAGE_OPTIONS[0];

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
                  <View
                    style={[
                      styles.badgeContainer,
                      isPrimary
                        ? styles.badgeContainerPrimary
                        : badgeVariant === 'secondary'
                          ? styles.badgeContainerSecondary
                          : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isPrimary
                          ? styles.badgeTextPrimary
                          : badgeVariant === 'secondary'
                            ? styles.badgeTextSecondary
                            : null,
                      ]}
                    >
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
                onPress={() => setLangModalVisible(true)}
                style={[
                  localStyles.langBtn,
                  isPrimary
                    ? localStyles.langBtnPrimary
                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Globe size={13} color={isPrimary ? '#FFFFFF' : theme.colors.primary} />
                <Text
                  style={[
                    localStyles.langBtnText,
                    { color: isPrimary ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  {activeLang.short}
                </Text>
                <ChevronDown size={12} color={isPrimary ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            {rightElement}
          </View>
        )}
      </View>
      {bottomContent}

      {/* Language Selection Bottom Sheet Popup */}
      <RNModal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLangModalVisible(false)}>
          <View style={localStyles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  localStyles.modalCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <View style={localStyles.sheetHandle} />
                <View style={localStyles.langList}>
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const selected = opt.code === language;
                    return (
                      <TouchableOpacity
                        key={opt.code}
                        activeOpacity={0.75}
                        onPress={() => {
                          setLanguage(opt.code);
                          setLangModalVisible(false);
                        }}
                        style={[
                          localStyles.langRow,
                          {
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                            backgroundColor: selected
                              ? theme.colors.primary + '12'
                              : theme.colors.background,
                          },
                        ]}
                      >
                        <View style={localStyles.langRowLeft}>
                          <View
                            style={[
                              localStyles.shortBadge,
                              {
                                backgroundColor: selected
                                  ? theme.colors.primary
                                  : theme.colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                localStyles.shortBadgeText,
                                { color: selected ? '#FFFFFF' : theme.colors.text },
                              ]}
                            >
                              {opt.short}
                            </Text>
                          </View>
                          <Text style={[localStyles.langNative, { color: theme.colors.text }]}>
                            {opt.native}
                          </Text>
                        </View>
                        {selected && <Check size={16} color={theme.colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    </View >
  );
};

const localStyles = StyleSheet.create({
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: .5,
  },
  langBtnPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  langList: {
    gap: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderRadius: 18,
    borderWidth: .5,
  },
  langRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shortBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  langNative: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AppHeader;
