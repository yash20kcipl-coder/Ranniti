import React from 'react';
import { goBack } from '../../navigation';
import { appHeaderStyles } from './styles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { teacherDrawerRoutes, studentDrawerRoutes } from '../../navigation/routes';
import { useNavigation, useRoute, DrawerActions } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  noShadow?: boolean;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = true,
  onBack,
  rightElement,
  noShadow,
  style,
  backgroundColor,
  textColor,
  iconColor,
}) => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { styles, theme } = useAppTheme(appHeaderStyles);
  const canGoBack = navigation && navigation.canGoBack();
  const isDrawerScreen = [...teacherDrawerRoutes, ...studentDrawerRoutes]
    .some((r) => String(r.name).toLowerCase() === route.name?.toLowerCase());

  const showLeftButton = isDrawerScreen || (showBack && canGoBack);
  const isDarkBg = !backgroundColor || (backgroundColor !== '#F8FAFC' && backgroundColor !== '#FFFFFF');

  const handlePressLeft = () => {
    if (isDrawerScreen) {
      navigation.dispatch(DrawerActions.openDrawer());
    } else if (canGoBack) {
      if (onBack) { onBack(); } else { goBack(); }
    }
  };

  return (
    <View style={[styles.header, noShadow && { elevation: 0, shadowOpacity: 0 }, backgroundColor ? { backgroundColor } : null, style]}>
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showLeftButton && (
            <TouchableOpacity
              onPress={handlePressLeft}
              style={[
                styles.backButton,
                !isDarkBg ? { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' } : null
              ]}
              activeOpacity={0.7}
            >
              <MaterialDesignIcons
                size={isDrawerScreen ? 22 : 26}
                name={isDrawerScreen ? 'menu' : 'chevron-left'}
                color={iconColor || (isDarkBg ? '#FFFFFF' : theme.colors.text)}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={[styles.title, textColor ? { color: textColor } : (!isDarkBg ? { color: theme.colors.text } : null)]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {rightElement}
        </View>
      </View>
    </View>
  );
};
export default AppHeader;
