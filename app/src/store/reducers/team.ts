export const ADD_TEAM_MEMBER = "ADD_TEAM_MEMBER";
export const SET_TEAM_LOADING = "SET_TEAM_LOADING";
export const SET_TEAM_MEMBERS = "SET_TEAM_MEMBERS";
export const UPDATE_TEAM_MEMBER = "UPDATE_TEAM_MEMBER";
export const DELETE_TEAM_MEMBER = "DELETE_TEAM_MEMBER";
export const SET_CREATABLE_ROLES = "SET_CREATABLE_ROLES";
export const SET_TEAM_SUBMITTING = "SET_TEAM_SUBMITTING";
export const SET_CREATABLE_ROLES_LOADING = "SET_CREATABLE_ROLES_LOADING";


export interface AssignedBooth {
  id: string;
  boothNumber: number;
  name: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleName: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  status: string;
  parentLeaderId?: string;
  parentLeaderName?: string;
  assignedAcId?: string;
  assignedAcName?: string;
  assignedBoothsCount?: number;
  assignedBooths?: AssignedBooth[];
  accessibleTabs?: {
    mobileScreens?: string[];
    webTabs?: string[];
  };
  createdAt?: string;
  generatedDefaultPassword?: string;
}

export interface CreatableRole {
  roleKey: string;
  roleName: string;
  mobileScreens: string[];
  voterPermissions: {
    canViewVoter?: boolean;
    canEditContact?: boolean;
    canEditDemographics?: boolean;
    canEditInclination?: boolean;
    canEditVoterStatus?: boolean;
    canManageFamily?: boolean;
    canExportData?: boolean;
  };
  canCreateRoles: string[];
}

export interface TeamState {
  members: TeamMember[];
  creatableRoles: CreatableRole[];
  loading: boolean;
  loadingCreatableRoles: boolean;
  isSubmitting: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: TeamState = {
  members: [],
  loading: true,
  creatableRoles: [],
  isSubmitting: false,
  loadingCreatableRoles: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  },
};

const teamReducer = (state = initialState, action: any): TeamState => {
  switch (action.type) {
    case SET_TEAM_LOADING:
      return { ...state, loading: action.payload };
    case SET_CREATABLE_ROLES_LOADING:
      return { ...state, loadingCreatableRoles: action.payload };
    case SET_TEAM_SUBMITTING:
      return { ...state, isSubmitting: action.payload };
    case SET_TEAM_MEMBERS:
      return {
        ...state,
        members: action.payload.members || [],
        pagination: action.payload.pagination || state.pagination,
        loading: false,
      };
    case SET_CREATABLE_ROLES:
      return {
        ...state,
        creatableRoles: action.payload,
        loadingCreatableRoles: false,
      };
    case ADD_TEAM_MEMBER:
      return {
        ...state,
        members: [action.payload, ...state.members],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };
    case UPDATE_TEAM_MEMBER:
      return {
        ...state,
        members: state.members.map((m) => (m.id === action.payload.id ? { ...m, ...action.payload } : m)),
      };
    case DELETE_TEAM_MEMBER:
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload),
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
      };
    default:
      return state;

  }
};

export default teamReducer;
