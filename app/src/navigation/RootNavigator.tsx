import React from 'react';
import { SCREENS } from './constants';
import { navigationRoutes } from './routes';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, onNavigationReady } from './navigationUtils';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeacherDrawerNavigator, StudentDrawerNavigator } from './DrawerNavigator';

const Stack = createNativeStackNavigator<Record<string, undefined>>();

export const RootNavigator = () => {

  return (
    <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
      <Stack.Navigator
        initialRouteName={SCREENS.SPLASH}
        screenOptions={{ headerShown: false }}
      >
        {navigationRoutes.map((route) => (
          <Stack.Screen
            component={route.component}
            key={String(route.name).toLowerCase()}
            name={String(route.name).toLowerCase()}
          />
        ))}
        <Stack.Screen name={SCREENS.TEACHER_MAIN} component={TeacherDrawerNavigator} />
        <Stack.Screen name={SCREENS.STUDENT_MAIN} component={StudentDrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
