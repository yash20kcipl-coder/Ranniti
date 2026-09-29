import React from 'react';
import { SCREENS } from './constants';
import { teacherDrawerRoutes, studentDrawerRoutes } from './routes';
import { useAppTheme } from '../hooks/useAppTheme';
import CustomDrawer from '../components/CustomDrawer';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TeacherDashboard from '../screens/DashboardModule/TeacherDashboard';
import StudentDashboard from '../screens/DashboardModule/StudentDashboard';

const Drawer = createDrawerNavigator();

export const TeacherDrawerNavigator = () => {
  const { theme } = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: theme.colors.overlay,
        drawerStyle: {
          width: '75%',
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      {teacherDrawerRoutes.map((route) => {
        return (
          <Drawer.Screen
            key={String(route.name).toLowerCase()}
            name={String(route.name).toLowerCase()}
            component={route.component}
          />
        );
      })}
    </Drawer.Navigator>
  );
};

export const StudentDrawerNavigator = () => {
  const { theme } = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: theme.colors.overlay,
        drawerStyle: {
          width: '75%',
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      {studentDrawerRoutes.map((route) => {
        return (
          <Drawer.Screen
            key={String(route.name).toLowerCase()}
            name={String(route.name).toLowerCase()}
            component={route.component}
          />
        );
      })}
    </Drawer.Navigator>
  );
};
