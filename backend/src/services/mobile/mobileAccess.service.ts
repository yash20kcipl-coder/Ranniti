import { RoleQueries } from '../../queries/role.queries';
import { logger } from '../../utils/logger';

export interface MobileAccessConfig {
  roleKey: string;
  roleName: string;
  mobileScreens: string[];
  voterPermissions: {
    canViewVoter: boolean;
    canEditContact: boolean;
    canEditDemographics: boolean;
    canEditInclination: boolean;
    canEditVoterStatus: boolean;
    canManageFamily: boolean;
    canExportData: boolean;
  };
  canCreateRoles: string[];
}

export class MobileAccessService {
  /**
   * Retrieves role metadata, accessible mobile screens, and voter edit permissions for a user
   */
  async getRoleAccessConfig(params: {
    role: string;
    tenantDbName?: string | null;
  }): Promise<MobileAccessConfig> {
    const { role, tenantDbName } = params;

    // Try finding custom role configuration in tenant DB
    try {
      if (tenantDbName) {
        const roles = await RoleQueries.getAllTenantUserRoles(tenantDbName);
        const matchedRole = roles.find(r => r.roleKey === role);
        if (matchedRole) {
          const screens = matchedRole.accessibleTabs?.mobile_screens || [
            'Dashboard',
            'Voters',
            'Team',
            'Surveys',
            'Profile',
          ];
          return {
            roleKey: matchedRole.roleKey,
            roleName: matchedRole.roleName,
            mobileScreens: screens,
            voterPermissions: {
              canViewVoter: matchedRole.voterPermissions?.can_view_voter ?? true,
              canEditContact: matchedRole.voterPermissions?.can_edit_contact ?? true,
              canEditDemographics: matchedRole.voterPermissions?.can_edit_demographics ?? true,
              canEditInclination: matchedRole.voterPermissions?.can_edit_inclination ?? true,
              canEditVoterStatus: matchedRole.voterPermissions?.can_edit_voter_status ?? true,
              canManageFamily: matchedRole.voterPermissions?.can_manage_family ?? false,
              canExportData: matchedRole.voterPermissions?.can_export_data ?? false,
            },
            canCreateRoles: matchedRole.canCreateRoles || [],
          };
        }
      }
    } catch (err) {
      logger.warn(`[MobileAccessService] Could not fetch custom role from tenant DB:`, err);
    }

    // Default Fallback Role Access Matrix
    if (role === 'ac_leader' || role === 'pc_leader') {
      return {
        roleKey: role,
        roleName: role === 'ac_leader' ? 'Assembly Constituency Leader' : 'Parliamentary Constituency Leader',
        mobileScreens: ['Dashboard', 'Voters', 'Team', 'Surveys', 'Profile'],
        voterPermissions: {
          canViewVoter: true,
          canEditContact: true,
          canEditDemographics: true,
          canEditInclination: true,
          canEditVoterStatus: true,
          canManageFamily: true,
          canExportData: true,
        },
        canCreateRoles: ['sub_leader', 'supporter'],
      };
    }

    if (role === 'sub_leader') {
      return {
        roleKey: 'sub_leader',
        roleName: 'Sub Leader',
        mobileScreens: ['Dashboard', 'Voters', 'Team', 'Surveys', 'Profile'],
        voterPermissions: {
          canViewVoter: true,
          canEditContact: true,
          canEditDemographics: true,
          canEditInclination: true,
          canEditVoterStatus: true,
          canManageFamily: true,
          canExportData: false,
        },
        canCreateRoles: ['supporter'],
      };
    }

    // Supporter / Default Volunteer Role
    return {
      roleKey: 'supporter',
      roleName: 'Booth Supporter',
      mobileScreens: ['Dashboard', 'Voters', 'Surveys', 'Profile'],
      voterPermissions: {
        canViewVoter: true,
        canEditContact: true,
        canEditDemographics: false,
        canEditInclination: true,
        canEditVoterStatus: false,
        canManageFamily: false,
        canExportData: false,
      },
      canCreateRoles: [],
    };
  }

  /**
   * Retrieves list of available roles for the tenant, optionally filtered by creatable subset for user's role
   */
  async getAvailableRoles(params: {
    userRole: string;
    tenantDbName?: string | null;
    creatableOnly?: boolean;
  }): Promise<MobileAccessConfig[]> {
    const { userRole, tenantDbName, creatableOnly } = params;

    // 1. Get current user's role access config to inspect canCreateRoles
    const userAccess = await this.getRoleAccessConfig({ role: userRole, tenantDbName });
    const allowedKeys = userAccess.canCreateRoles;

    // 2. Standard role keys list
    const allRoleKeys = ['pc_leader', 'ac_leader', 'sub_leader', 'supporter'];
    const targetKeys = (creatableOnly && allowedKeys.length > 0) ? allowedKeys : allRoleKeys;

    const results: MobileAccessConfig[] = [];
    for (const key of targetKeys) {
      const config = await this.getRoleAccessConfig({ role: key, tenantDbName });
      results.push(config);
    }

    return results;
  }
}

export const mobileAccessService = new MobileAccessService();
