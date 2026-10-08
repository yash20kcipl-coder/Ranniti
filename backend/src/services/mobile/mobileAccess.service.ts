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
    customAccessibleTabs?: any;
  }): Promise<MobileAccessConfig> {
    const { role, tenantDbName, customAccessibleTabs } = params;

    // Try finding custom role configuration in tenant DB
    try {
      if (tenantDbName) {
        const roles = await RoleQueries.getAllTenantUserRoles(tenantDbName);
        const matchedRole = roles.find((r) => r.roleKey === role);
        if (matchedRole) {
          const screens =
            customAccessibleTabs?.mobileScreens ||
            customAccessibleTabs?.mobile_screens ||
            matchedRole.accessibleTabs?.mobileScreens ||
            matchedRole.accessibleTabs?.mobile_screens || [
              'voter_search',
              'family_tree',
              'survey',
              'booth_analytics',
            ];

          return {
            roleKey: matchedRole.roleKey,
            roleName: matchedRole.roleName,
            mobileScreens: screens,
            voterPermissions: {
              canViewVoter: matchedRole.voterPermissions?.canViewVoter ?? matchedRole.voterPermissions?.can_view_voter ?? true,
              canEditContact: matchedRole.voterPermissions?.canEditContact ?? matchedRole.voterPermissions?.can_edit_contact ?? true,
              canEditDemographics: matchedRole.voterPermissions?.canEditDemographics ?? matchedRole.voterPermissions?.can_edit_demographics ?? false,
              canEditInclination: matchedRole.voterPermissions?.canEditInclination ?? matchedRole.voterPermissions?.can_edit_inclination ?? true,
              canEditVoterStatus: matchedRole.voterPermissions?.canEditVoterStatus ?? matchedRole.voterPermissions?.can_edit_voter_status ?? false,
              canManageFamily: matchedRole.voterPermissions?.canManageFamily ?? matchedRole.voterPermissions?.can_manage_family ?? false,
              canExportData: matchedRole.voterPermissions?.canExportData ?? matchedRole.voterPermissions?.can_export_data ?? false,
            },
            canCreateRoles: matchedRole.canCreateRoles || [],
          };
        }
      }
    } catch (err) {
      logger.warn(`[MobileAccessService] Could not fetch custom role from tenant DB:`, err);
    }

    // Default Fallback Role Access Matrix
    if (role === 'pc_leader') {
      return {
        roleKey: 'pc_leader',
        roleName: 'Parliamentary Constituency Leader',
        mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics', 'gate_meetings'],
        voterPermissions: {
          canViewVoter: true,
          canEditContact: true,
          canEditDemographics: true,
          canEditInclination: true,
          canEditVoterStatus: true,
          canManageFamily: true,
          canExportData: true,
        },
        canCreateRoles: ['ac_leader', 'sub_leader', 'supporter'],
      };
    }

    if (role === 'ac_leader') {
      return {
        roleKey: 'ac_leader',
        roleName: 'Assembly Constituency Leader',
        mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics', 'gate_meetings'],
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
        mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics'],
        voterPermissions: {
          canViewVoter: true,
          canEditContact: true,
          canEditDemographics: false,
          canEditInclination: true,
          canEditVoterStatus: false,
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
      mobileScreens: ['voter_search', 'family_tree', 'survey'],
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

    if (tenantDbName) {
      try {
        const allRoles = await RoleQueries.getAllTenantUserRoles(tenantDbName);
        const filteredRoles = (creatableOnly && allowedKeys.length > 0)
          ? allRoles.filter((r) => allowedKeys.includes(r.roleKey))
          : (creatableOnly ? [] : allRoles);

        if (filteredRoles.length > 0) {
          return filteredRoles.map((r) => ({
            roleKey: r.roleKey,
            roleName: r.roleName,
            mobileScreens: r.accessibleTabs?.mobileScreens || r.accessibleTabs?.mobile_screens || [],
            voterPermissions: {
              canViewVoter: r.voterPermissions?.canViewVoter ?? r.voterPermissions?.can_view_voter ?? true,
              canEditContact: r.voterPermissions?.canEditContact ?? r.voterPermissions?.can_edit_contact ?? true,
              canEditDemographics: r.voterPermissions?.canEditDemographics ?? r.voterPermissions?.can_edit_demographics ?? false,
              canEditInclination: r.voterPermissions?.canEditInclination ?? r.voterPermissions?.can_edit_inclination ?? true,
              canEditVoterStatus: r.voterPermissions?.canEditVoterStatus ?? r.voterPermissions?.can_edit_voter_status ?? false,
              canManageFamily: r.voterPermissions?.canManageFamily ?? r.voterPermissions?.can_manage_family ?? false,
              canExportData: r.voterPermissions?.canExportData ?? r.voterPermissions?.can_export_data ?? false,
            },
            canCreateRoles: r.canCreateRoles || [],
          }));
        }
      } catch (err) {
        logger.warn(`[MobileAccessService] Could not fetch roles list from tenant DB:`, err);
      }
    }

    // Fallback list
    const allRoleKeys = ['pc_leader', 'ac_leader', 'sub_leader', 'supporter'];
    const targetKeys = creatableOnly ? allowedKeys : allRoleKeys;

    const results: MobileAccessConfig[] = [];
    for (const key of targetKeys) {
      const config = await this.getRoleAccessConfig({ role: key, tenantDbName });
      results.push(config);
    }

    return results;
  }
}

export const mobileAccessService = new MobileAccessService();
