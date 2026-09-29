import React from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '../../navigation';
import { customDrawerStyles } from './styles';
import { APP_CONFIG } from '../../core/config';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ScrollView, CustomImage } from '..';
import { View, Text, TouchableOpacity } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { SCREENS, TEACHER_MENU, STUDENT_MENU, PARENT_MENU } from '../../navigation/constants';


const CustomDrawer = (props: DrawerContentComponentProps) => {
  const { state } = props;
  const { role } = useAuth();
  const activeRouteName = state.routes[state.index].name;
  const { user } = useSelector((state: any) => state.auth);
  const { theme, styles } = useAppTheme(customDrawerStyles);
  const handleNavigation = (routeName: string) => { navigate(routeName) };
  const menuItems = role === 'teacher' ? TEACHER_MENU : role === 'parent' ? PARENT_MENU : STUDENT_MENU;


  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <CustomImage
              uri={user?.avatar}
              style={styles.avatar}
              placeholderType="avatar"
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
            <Text style={styles.userRole}>
              {role === "teacher" ? `${user?.role}` : `${user?.enrollment?.className} • ${user?.enrollment?.sectionName}`}
            </Text>
          </View>
        </View>
        <Text style={styles.schoolName}>{APP_CONFIG.schoolName}</Text>
      </View>

      {/* Menu Section */}
      <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = activeRouteName === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => handleNavigation(item.name)}
              style={[styles.drawerItem, isActive && styles.drawerItemActive]}
              activeOpacity={0.7}
            >
              <View style={styles.drawerItemIcon}>
                <MaterialDesignIcons
                  size={24}
                  name={item.icon}
                  color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
              <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <TouchableOpacity
          onPress={() => handleNavigation(SCREENS.SETTINGS)}
          style={styles.drawerItem}
          activeOpacity={0.7}
        >
          <View style={styles.drawerItemIcon}>
            <MaterialDesignIcons name="cog-outline" size={24} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.drawerItemText}>Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CustomDrawer;
