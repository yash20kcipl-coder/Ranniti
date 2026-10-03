import React from 'react';
import { SCREENS } from './constants';
import { routes } from './routes';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, onNavigationReady } from './navigationUtils';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerNavigator } from './DrawerNavigator';

const Stack = createNativeStackNavigator<Record<string, undefined>>();

export const RootNavigator = () => {
  return (
    <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
      <Stack.Navigator
        initialRouteName={SCREENS.SPLASH}
        screenOptions={{ headerShown: false }}
      >
        {routes.map((route) => (
          <Stack.Screen
            component={route.component}
            key={String(route.name).toLowerCase()}
            name={String(route.name).toLowerCase()}
          />
        ))}
        <Stack.Screen name={SCREENS.MAIN} component={DrawerNavigator} />
        <Stack.Screen name="teachermain" component={DrawerNavigator} />
        <Stack.Screen name="studentmain" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
