import { store } from "../store/store";
import { navigatToVoters } from "./navigationUtils";

const st = store as any
export const SCREENS = {
  SPLASH: 'splash',
  LOGIN: 'login',
  FORGOT_PASSWORD: 'forgotpassword',
  CONTACT_SUPPORT: 'contactsupport',
  MAIN: 'main',
  DASHBOARD: 'dashboard',
  ASSIGNED_BOOTHS: 'assignedbooths',
  VOTER_LIST: 'voterlist',
  VOTER_DETAIL: 'voterdetail',
  ADD_EDIT_VOTER: 'addeditvoter',
  FAMILY_MAPPING: 'familymapping',
  INFLUENCER_MAPPING: 'influencermapping',
  CONTACT_SYNC: 'contactsync',
  TEAM_MANAGEMENT: 'teammanagement',
  ONBOARD_TEAM_MEMBER: 'onboardteammember',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
} as const;

export const DRAWER_MENU = [
  { name: SCREENS.DASHBOARD, icon: 'home', label: 'Dashboard', category: 'MAIN MENU' },
  { name: SCREENS.ASSIGNED_BOOTHS, icon: 'office-building-marker', label: 'Assigned Booths', category: 'MAIN MENU' },
  {
    name: SCREENS.VOTER_LIST, icon: 'users', label: 'Voters Directory', category: 'MAIN MENU',
    onPress: () => navigatToVoters()
  },
  { name: SCREENS.FAMILY_MAPPING, icon: 'family', label: 'Family Mapping', category: 'CAMPAIGN MODULES' },
  { name: SCREENS.INFLUENCER_MAPPING, icon: 'sparkle', label: 'Social Influencers', category: 'CAMPAIGN MODULES', badge: 'VIP' },
  { name: SCREENS.CONTACT_SYNC, icon: 'phone', label: 'Contact Sync Voters', category: 'CAMPAIGN MODULES' },
  { name: SCREENS.TEAM_MANAGEMENT, icon: 'shield', label: 'Team Management', category: 'ADMINISTRATION' },
  { name: SCREENS.PROFILE, icon: 'user', label: 'My Profile', category: 'ADMINISTRATION' },
] as const;

export type ScreenName = typeof SCREENS[keyof typeof SCREENS];
