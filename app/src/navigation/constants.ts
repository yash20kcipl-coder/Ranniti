import { store } from "../store/store";
import { navigatToVoters } from "./navigationUtils";

const st = store as any
export const SCREENS = {
  SPLASH: 'splash',
  LOGIN: 'login',
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
  VOLUNTEER_DETAIL: 'volunteerdetail',
  PROFILE: 'profile',
  SWITCH_PROFILE: 'switchprofile',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  ELECTION_POLLING: 'electionpolling',
  SURVEY_POINTS: 'surveypoints',
} as const;

export const DRAWER_MENU = [
  { name: SCREENS.DASHBOARD, icon: 'home', label: 'Dashboard', labelKey: 'dashboardTitle', category: 'MAIN MENU', categoryKey: 'drawerMainMenu' },
  { name: SCREENS.ASSIGNED_BOOTHS, icon: 'office-building-marker', label: 'Assigned Booths', labelKey: 'assignedBoothsTitle', category: 'MAIN MENU', categoryKey: 'drawerMainMenu' },
  {
    name: SCREENS.VOTER_LIST, icon: 'users', label: 'Voters Directory', labelKey: 'voterListTitle', category: 'MAIN MENU', categoryKey: 'drawerMainMenu',
    onPress: () => navigatToVoters()
  },
  { name: SCREENS.ELECTION_POLLING, icon: 'vote', label: 'Election Polling', labelKey: 'electionPolling', category: 'CAMPAIGN MODULES', categoryKey: 'drawerCampaignModules', badge: 'LIVE' },
  { name: SCREENS.FAMILY_MAPPING, icon: 'family', label: 'Family Mapping', labelKey: 'familyMappingTitle', category: 'CAMPAIGN MODULES', categoryKey: 'drawerCampaignModules' },
  { name: SCREENS.INFLUENCER_MAPPING, icon: 'sparkle', label: 'Social Influencers', labelKey: 'influencerTitle', category: 'CAMPAIGN MODULES', categoryKey: 'drawerCampaignModules', badge: 'VIP' },
  { name: SCREENS.CONTACT_SYNC, icon: 'phone', label: 'Contact Sync Voters', labelKey: 'contactSyncTitle', category: 'CAMPAIGN MODULES', categoryKey: 'drawerCampaignModules' },
  { name: SCREENS.TEAM_MANAGEMENT, icon: 'shield', label: 'Team Management', labelKey: 'teamManagementTitle', category: 'ADMINISTRATION', categoryKey: 'drawerAdministration' },
  { name: SCREENS.PROFILE, icon: 'user', label: 'My Profile', labelKey: 'profileTitle', category: 'ADMINISTRATION', categoryKey: 'drawerAdministration' },
  { name: SCREENS.SWITCH_PROFILE, icon: 'account-switch-outline', label: 'Switch Profile', labelKey: 'switchProfile', category: 'ADMINISTRATION', categoryKey: 'drawerAdministration' },
] as const;

export type ScreenName = typeof SCREENS[keyof typeof SCREENS];
