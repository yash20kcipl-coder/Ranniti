import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { SafeImage } from '../SafeImage';
import { Modal } from '../Modal';
import { customDrawerStyles } from './styles';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemeContext } from '../../context/ThemeContext';
import { DRAWER_MENU } from '../../navigation/constants';
import { MaterialDesignIcons } from '../MaterialDesignIcons';
import { logoutAction } from '../../store/actions/auth';

const CustomDrawer = (props: DrawerContentComponentProps) => {
  const { state } = props;
  const activeRouteName = state.routes[state.index].name;
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  const { theme, styles } = useAppTheme<ReturnType<typeof customDrawerStyles>>(customDrawerStyles);
  const { mode, setMode } = useContext(ThemeContext);
  const { t } = useLanguage();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const isDarkMode = mode === 'dark';

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

  // Group drawer menu items by category
  const menuCategories = React.useMemo(() => {
    const categories: { [key: string]: typeof DRAWER_MENU } = {};
    DRAWER_MENU.forEach((item: any) => {
      const cat = item.category || 'MENU';
      if (!categories[cat]) {
        categories[cat] = [] as any;
      }
      (categories[cat] as any).push(item);
    });
    return categories;
  }, []);

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
          <View style={styles.constituencyBadge}>
            <Text style={styles.constituencyText}>JAIPUR PC</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <SafeImage
              src={user?.avatar}
              alt={user?.name || 'User'}
              style={styles.avatar}
            />
            <View style={styles.statusDot} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Vikramaditya Singh'}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.userRole}>
                {user?.roleName || t('pcLeader') || 'PC Leader'}
              </Text>
            </View>
            <Text style={styles.assignedArea} numberOfLines={1}>
              {user?.assignedArea || 'Jaipur Central Zone'}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
        {Object.entries(menuCategories).map(([category, items]) => (
          <View key={category}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderText}>{category}</Text>
            </View>

            {items.map((item: any) => {
              const isActive = activeRouteName === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleNavigation(item.name)}
                  style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                  activeOpacity={0.75}
                >
                  {isActive && <View style={styles.activeIndicator} />}
                  <View style={[styles.drawerItemIcon, isActive && styles.drawerItemIconActive]}>
                    <MaterialDesignIcons
                      size={20}
                      name={item.icon}
                      color={isActive ? theme.colors.primary : theme.colors.textSecondary}
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
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={styles.themeToggleBtn}
            onPress={handleToggleTheme}
            activeOpacity={0.7}
          >
            <MaterialDesignIcons
              name={isDarkMode ? 'sun' : 'moon'}
              size={18}
              color={theme.colors.text}
            />
            <Text style={styles.themeToggleText}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>

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

        <Text style={styles.version}>Ranniti Campaign OS • v2.4.0</Text>
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
