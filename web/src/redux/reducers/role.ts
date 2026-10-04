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
  canCreateRoles?: string[];
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

const initialState: RoleState = {
  tenantRoles: [],
  tenantUserRoles: [],
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
