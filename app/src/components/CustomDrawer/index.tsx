import { Modal } from '../Modal';
import { SafeImage } from '../SafeImage';
import { customDrawerStyles } from './styles';
import { useLanguage } from '../../languages';
import { getAppVersion } from '../../utils/version';
import React, { useState, useContext } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAction } from '../../store/actions/auth';
import { ThemeContext } from '../../context/ThemeContext';
import { MaterialDesignIcons } from '../MaterialDesignIcons';
import { hasScreenAccess } from '../../utils/permissionUtils';
import { navigationRef } from '../../navigation/navigationUtils';
import { DRAWER_MENU, SCREENS } from '../../navigation/constants';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';

// Map stack child routes to their parent drawer menu item so the active nav pill is never hidden
const SUB_ROUTE_TO_DRAWER_MAP: Record<string, string> = {
  [SCREENS.VOTER_DETAIL]: SCREENS.VOTER_LIST,
  [SCREENS.ADD_EDIT_VOTER]: SCREENS.VOTER_LIST,
  [SCREENS.VOLUNTEER_DETAIL]: SCREENS.TEAM_MANAGEMENT,
  [SCREENS.ONBOARD_TEAM_MEMBER]: SCREENS.TEAM_MANAGEMENT,
};

const CustomDrawer = (props: DrawerContentComponentProps) => {
  const { state } = props;
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const { mode, setMode } = useContext(ThemeContext);
  const isDarkMode = mode === 'dark';
  const { user, access } = useSelector((state: any) => state.auth);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { theme, styles } = useAppTheme<ReturnType<typeof customDrawerStyles>>(customDrawerStyles);

  // Compute active route robustly across drawer and root stack screens
  const drawerCurrentRoute = (state?.routes?.[state?.index ?? 0]?.name || '').toLowerCase();
  const globalCurrentRoute = (
    navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name || '' : ''
  ).toLowerCase();

  const isItemActive = (itemName: string) => {
    const target = itemName.toLowerCase();
    if (drawerCurrentRoute === target) return true;
    if (SUB_ROUTE_TO_DRAWER_MAP[drawerCurrentRoute] === target) return true;
    if (globalCurrentRoute === target) return true;
    if (SUB_ROUTE_TO_DRAWER_MAP[globalCurrentRoute] === target) return true;
    return false;
  };

  const handleNavigation = (routeName: string) => {
    props.navigation.navigate(routeName);
    props.navigation.closeDrawer();
  };

  const handleToggleTheme = () => {
    setMode(isDarkMode ? 'light' : 'dark');
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    props.navigation.closeDrawer();
    dispatch(logoutAction() as any);
  };

  // Group drawer menu items by category, filtered by user's role and tab access permissions
  const menuCategories = React.useMemo(() => {
    const categories: { [key: string]: any[] } = {};
    DRAWER_MENU.forEach((item: any) => {
      if (!hasScreenAccess(access, item.name)) {
        return;
      }
      const cat = item.category || 'MENU';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(item);
    });
    return categories;
  }, [access]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.topBrandRow}>
          <Image
            source={require('../../assets/images/ranniti-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <SafeImage
              name={user?.name}
              src={user?.avatar}
              style={styles.avatar}
              placeholderType="avatar"
              alt={user?.name || 'User'}
            />
            <View style={styles.statusDot} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || ''}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.userRole} numberOfLines={1}>
                {user?.roleName || t('pcLeader') || 'LEADER'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(menuCategories).map(([category, items]) => (
          <View key={category}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderText}>{category}</Text>
            </View>

            {items.map((item: any) => {
              const isActive = isItemActive(item.name);
              return (
                <TouchableOpacity
                  key={item.name}
                  activeOpacity={0.75}
                  onPress={() => {
                    if (item?.onPress) { item?.onPress() }
                    handleNavigation(item.name)
                  }}
                  style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                >
                  {/* Left Pill Highlight Indicator Bar */}
                  {isActive && <View style={styles.activePillIndicator} />}

                  <View style={[styles.drawerItemIcon, isActive && styles.drawerItemIconActive]}>
                    <MaterialDesignIcons
                      size={16}
                      name={item.icon}
                      color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                    {item.label}
                  </Text>

                  {item.badge && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.quickActionRow}>
          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <MaterialDesignIcons name="logout" size={18} color={theme.colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>{t('appName')} Campaign OS • v{getAppVersion()}</Text>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        onDismiss={() => setLogoutModalVisible(false)}
        contentContainerStyle={styles.modalCard}
      >
        <View style={styles.modalIconContainer}>
          <MaterialDesignIcons name="alert" size={28} color={theme.colors.error} />
        </View>
        <Text style={styles.modalTitle}>Confirm Logout</Text>
        <Text style={styles.modalDescription}>
          Are you sure you want to end your campaign session and log out of Ranniti?
        </Text>
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setLogoutModalVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default CustomDrawer;
