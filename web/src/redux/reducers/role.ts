export interface TenantRolePackage {
  id: string;
  roleName: string;
  description: string;
  allowedTabs: {
    webTabs: string[];
    masterSubTabs: string[];
  };
  isActive: boolean;
  isDefault?: boolean;
  tenantCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoterPermissions {
  canViewVoter: boolean;
  canEditContact: boolean;
  canEditDemographics: boolean;
  canEditInclination: boolean;
  canEditVoterStatus: boolean;
  canManageFamily: boolean;
  canExportData: boolean;
}

export interface TenantUserRole {
  id: string;
  tenantDbName?: string;
  roleName: string;
  roleKey: string;
  description: string;
  accessibleTabs: {
    webTabs: string[];
    masterSubTabs: string[];
    mobileScreens: string[];
  };
  voterPermissions: VoterPermissions;
  isSystemDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleState {
  tenantRoles: TenantRolePackage[];
  tenantUserRoles: TenantUserRole[];
  loading: boolean;
  error: string | null;
}

// NOTE: Tenant Role Packages define access for the whole tenant org.
//       masterSubTabs MUST only contain tenant-managed tabs: 'acs', 'wards', 'booths'.
//       Super-admin-only tabs (districts, pcs, talukas, states, religions, castes, parties)
//       are never assigned to tenant packages.
const DEFAULT_TENANT_ROLES: TenantRolePackage[] = [
  {
    id: 'tr-full-suite',
    roleName: 'Full Political Campaign Suite',
    description: 'Complete access to all web tabs (incl. settings), tenant master sub-tabs (AC, Ward, Booth), voter directory, and mobile field capabilities.',
    allowedTabs: {
      webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
      masterSubTabs: ['acs', 'wards', 'booths'],
    },
    isActive: true,
    isDefault: true,
    tenantCount: 0,
  },
  {
    id: 'tr-standard',
    roleName: 'Standard Campaign Package',
    description: 'Access to Dashboard, Voter Directory, Ward & Booth master data, and settings.',
    allowedTabs: {
      webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
      masterSubTabs: ['wards', 'booths'],
    },
    isActive: true,
    isDefault: false,
    tenantCount: 0,
  },
  {
    id: 'tr-voter-only',
    roleName: 'Voter Directory & Field Survey Package',
    description: 'Focused package for field operations with Voter Directory and Booth reference access. No settings access.',
    allowedTabs: {
      webTabs: ['dashboard', 'voter_directory', 'master_data'],
      masterSubTabs: ['booths'],
    },
    isActive: true,
    isDefault: false,
    tenantCount: 0,
  },
];

const DEFAULT_TENANT_USER_ROLES: TenantUserRole[] = [
  {
    id: 'tur-pc-leader',
    roleName: 'PC Leader',
    roleKey: 'pc_leader',
    description: 'Parliamentary Constituency Leader with full constituency overview and voter edit capabilities.',
    accessibleTabs: {
      webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
      masterSubTabs: ['acs', 'wards', 'booths'],
      mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics', 'gate_meetings'],
    },
    voterPermissions: {
      canViewVoter: true,
      canEditContact: true,
      canEditDemographics: true,
      canEditInclination: true,
      canEditVoterStatus: true,
      canManageFamily: true,
      canExportData: true,
    },
    isSystemDefault: true,
  },
  {
    id: 'tur-ac-leader',
    roleName: 'AC Leader',
    roleKey: 'ac_leader',
    description: 'Assembly Constituency Leader managing AC campaign activities and voter records.',
    accessibleTabs: {
      webTabs: ['dashboard', 'voter_directory', 'master_data'],
      masterSubTabs: ['acs', 'wards', 'booths'],
      mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics'],
    },
    voterPermissions: {
      canViewVoter: true,
      canEditContact: true,
      canEditDemographics: true,
      canEditInclination: true,
      canEditVoterStatus: true,
      canManageFamily: true,
      canExportData: false,
    },
    isSystemDefault: true,
  },
  {
    id: 'tur-sub-leader',
    roleName: 'Sub-Leader / Ward Coordinator',
    roleKey: 'sub_leader',
    description: 'Ward level coordinator responsible for local booth management and field survey entries.',
    accessibleTabs: {
      webTabs: ['dashboard', 'voter_directory'],
      masterSubTabs: ['booths'],
      mobileScreens: ['voter_search', 'family_tree', 'survey'],
    },
    voterPermissions: {
      canViewVoter: true,
      canEditContact: true,
      canEditDemographics: false,
      canEditInclination: true,
      canEditVoterStatus: false,
      canManageFamily: true,
      canExportData: false,
    },
    isSystemDefault: true,
  },
  {
    id: 'tur-supporter',
    roleName: 'Campaign Supporter / Volunteer',
    roleKey: 'supporter',
    description: 'Field volunteer with mobile voter lookup and survey submission capabilities.',
    accessibleTabs: {
      webTabs: ['dashboard', 'voter_directory'],
      masterSubTabs: [],
      mobileScreens: ['voter_search', 'survey'],
    },
    voterPermissions: {
      canViewVoter: true,
      canEditContact: false,
      canEditDemographics: false,
      canEditInclination: true,
      canEditVoterStatus: false,
      canManageFamily: false,
      canExportData: false,
    },
    isSystemDefault: true,
  },
];

const initialState: RoleState = {
  tenantRoles: DEFAULT_TENANT_ROLES,
  tenantUserRoles: DEFAULT_TENANT_USER_ROLES,
  loading: false,
  error: null,
};

export const SET_TENANT_ROLES = 'SET_TENANT_ROLES';
export const ADD_TENANT_ROLE = 'ADD_TENANT_ROLE';
export const UPDATE_TENANT_ROLE = 'UPDATE_TENANT_ROLE';
export const DELETE_TENANT_ROLE = 'DELETE_TENANT_ROLE';
export const SET_DEFAULT_TENANT_ROLE = 'SET_DEFAULT_TENANT_ROLE';

export const SET_TENANT_USER_ROLES = 'SET_TENANT_USER_ROLES';
export const ADD_TENANT_USER_ROLE = 'ADD_TENANT_USER_ROLE';
export const UPDATE_TENANT_USER_ROLE = 'UPDATE_TENANT_USER_ROLE';
export const DELETE_TENANT_USER_ROLE = 'DELETE_TENANT_USER_ROLE';

export const SET_ROLE_LOADING = 'SET_ROLE_LOADING';

export default function roleReducer(state = initialState, action: any): RoleState {
  switch (action.type) {
    case SET_TENANT_ROLES:
      return {
        ...state,
        tenantRoles: Array.isArray(action.payload)
          ? action.payload
          : Array.isArray(action.payload?.data)
          ? action.payload.data
          : (state.tenantRoles || []),
      };

    case ADD_TENANT_ROLE:
      return { ...state, tenantRoles: [action.payload, ...state.tenantRoles] };

    case UPDATE_TENANT_ROLE:
      return {
        ...state,
        tenantRoles: state.tenantRoles.map((r) =>
          r.id === action.payload.id ? action.payload : action.payload.isDefault ? { ...r, isDefault: false } : r
        ),
      };

    case SET_DEFAULT_TENANT_ROLE:
      return {
        ...state,
        tenantRoles: state.tenantRoles.map((r) => ({
          ...r,
          isDefault: r.id === action.payload,
        })),
      };

    case DELETE_TENANT_ROLE:
      return {
        ...state,
        tenantRoles: state.tenantRoles.filter((r) => r.id !== action.payload),
      };

    case SET_TENANT_USER_ROLES:
      return {
        ...state,
        tenantUserRoles: Array.isArray(action.payload)
          ? action.payload
          : Array.isArray(action.payload?.data)
          ? action.payload.data
          : (state.tenantUserRoles || []),
      };

    case ADD_TENANT_USER_ROLE:
      return { ...state, tenantUserRoles: [action.payload, ...state.tenantUserRoles] };

    case UPDATE_TENANT_USER_ROLE:
      return {
        ...state,
        tenantUserRoles: state.tenantUserRoles.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };

    case DELETE_TENANT_USER_ROLE:
      return {
        ...state,
        tenantUserRoles: state.tenantUserRoles.filter((r) => r.id !== action.payload),
      };

    case SET_ROLE_LOADING:
      return { ...state, loading: action.payload };

    default:
      return state;
  }
}
