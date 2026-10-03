export interface AllowedTabsJson {
  web_tabs: string[];
  master_sub_tabs: string[];
}

export interface AccessibleTabsJson {
  web_tabs: string[];
  master_sub_tabs: string[];
  mobile_screens: string[];
}

export interface VoterPermissionsJson {
  can_view_voter: boolean;
  can_edit_contact: boolean;
  can_edit_demographics: boolean;
  can_edit_inclination: boolean;
  can_edit_voter_status: boolean;
  can_manage_family: boolean;
  can_export_data: boolean;
}

export interface TenantRole {
  id: string;
  roleName: string;
  description?: string;
  allowedTabs: AllowedTabsJson;
  isActive: boolean;
  isDefault?: boolean;
  tenantCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUserRole {
  id: string;
  tenantDbName?: string;
  roleName: string;
  roleKey: string;
  description?: string;
  accessibleTabs: AccessibleTabsJson;
  voterPermissions: VoterPermissionsJson;
  isSystemDefault: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
