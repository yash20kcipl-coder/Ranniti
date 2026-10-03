import React from 'react';
import { SCREENS } from './constants';
import { useAppTheme } from '../hooks/useAppTheme';
import CustomDrawer from '../components/CustomDrawer';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Dashboard from '../screens/Dashboard';
import VoterListScreen from '../screens/VoterModule/VoterListScreen';
import FamilyMappingScreen from '../screens/FamilyMappingModule';
import InfluencerMappingScreen from '../screens/InfluencerModule';
import ContactSyncScreen from '../screens/ContactSyncModule';
import AddTeamMemberScreen from '../screens/TeamModule';
import ProfileScreen from '../screens/ProfileModule';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  const { theme } = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#0F172A',
        drawerType: 'slide',
        drawerStyle: {
          width: '78%',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Drawer.Screen name={SCREENS.DASHBOARD} component={Dashboard} options={{ title: 'Dashboard' }} />
      <Drawer.Screen name={SCREENS.VOTER_LIST} component={VoterListScreen} options={{ title: 'Voters Directory' }} />
      <Drawer.Screen name={SCREENS.FAMILY_MAPPING} component={FamilyMappingScreen} options={{ title: 'Family Mapping' }} />
      <Drawer.Screen name={SCREENS.INFLUENCER_MAPPING} component={InfluencerMappingScreen} options={{ title: 'Social Influencers' }} />
      <Drawer.Screen name={SCREENS.CONTACT_SYNC} component={ContactSyncScreen} options={{ title: 'Contact Sync Voters' }} />
      <Drawer.Screen name={SCREENS.TEAM_MANAGEMENT} component={AddTeamMemberScreen} options={{ title: 'Team Management' }} />
      <Drawer.Screen name={SCREENS.PROFILE} component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Drawer.Navigator>
  );
};

export const TeacherDrawerNavigator = DrawerNavigator;
export const StudentDrawerNavigator = DrawerNavigator;
