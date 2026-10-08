import { SCREENS } from '../navigation/constants';

/**
 * Maps database/web role mobileScreens keys to mobile application navigation routes
 */
export const MOBILE_SCREEN_TO_ROUTES_MAP: Record<string, string[]> = {
  booth_analytics: [SCREENS.DASHBOARD, SCREENS.ASSIGNED_BOOTHS],
  voter_search: [SCREENS.VOTER_LIST, SCREENS.VOTER_DETAIL, SCREENS.ADD_EDIT_VOTER],
  family_tree: [SCREENS.FAMILY_MAPPING],
  gate_meetings: [SCREENS.INFLUENCER_MAPPING, SCREENS.CONTACT_SYNC],
  team_management: [SCREENS.TEAM_MANAGEMENT],
};

/**
 * Checks whether the logged-in user has permission to navigate to a specific screen
 */
export const hasScreenAccess = (accessConfig: any, screenName: string): boolean => {
  // Authentication, Splash, and Profile screens are always accessible
  if (
    screenName === SCREENS.SPLASH ||
    screenName === SCREENS.LOGIN ||
    screenName === SCREENS.FORGOT_PASSWORD ||
    screenName === SCREENS.CONTACT_SUPPORT ||
    screenName === SCREENS.PROFILE ||
    screenName === SCREENS.SETTINGS
  ) {
    return true;
  }

  // If no access config is loaded yet, allow base screens
  if (!accessConfig) {
    return screenName === SCREENS.DASHBOARD || screenName === SCREENS.VOTER_LIST;
  }

  // Team Management: Accessible if user has team_management screen OR has cadre creation rights OR is a leader
  if (screenName === SCREENS.TEAM_MANAGEMENT) {
    if (accessConfig.canCreateRoles && accessConfig.canCreateRoles.length > 0) {
      return true;
    }
    const roleKey = accessConfig.roleKey || '';
    if (roleKey === 'pc_leader' || roleKey === 'ac_leader' || roleKey === 'sub_leader') {
      return true;
    }
  }

  const allowedScreens: string[] = accessConfig.mobileScreens || [];

  // Check direct key match (e.g. 'dashboard', 'voterlist')
  if (allowedScreens.includes(screenName)) {
    return true;
  }

  // Check mapped module keys (e.g. 'booth_analytics' -> 'dashboard', 'voter_search' -> 'voterlist')
  for (const [screenKey, routes] of Object.entries(MOBILE_SCREEN_TO_ROUTES_MAP)) {
    if (allowedScreens.includes(screenKey) && routes.includes(screenName)) {
      return true;
    }
  }

  return false;
};

/**
 * Checks whether the current user has a specific voter data editing permission
 */
export const hasVoterPermission = (
  accessConfig: any,
  permKey: 'canViewVoter' | 'canEditContact' | 'canEditDemographics' | 'canEditInclination' | 'canEditVoterStatus' | 'canManageFamily' | 'canExportData'
): boolean => {
  if (!accessConfig || !accessConfig.voterPermissions) {
    return false;
  }
  return Boolean(accessConfig.voterPermissions[permKey]);
};

/**
 * Checks whether the current user is authorized to onboard subordinate members
 */
export const canCreateTeamMember = (accessConfig: any): boolean => {
  if (!accessConfig) return false;
  const canCreate = accessConfig.canCreateRoles;
  return Array.isArray(canCreate) && canCreate.length > 0;
};
