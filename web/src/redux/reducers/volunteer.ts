export interface VolunteerRecord {
  id: string;
  name: string;
  email: string;
  role: 'pc_leader' | 'ac_leader' | 'sub_leader' | 'supporter';
  roleName?: string;
  mobile?: string;
  avatar?: File | string | null;
  status: 'active' | 'inactive' | 'suspended';
  tenantDbName?: string;
  parentLeaderId?: string | null;
  parentLeaderName?: string | null;
  assignedAcId?: string | null;
  assignedBoothIds?: string[];
  assignedBoothCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VolunteerBoothCoverage {
  totalCadre: number;
  pcLeadersCount: number;
  acLeadersCount: number;
  subLeadersCount: number;
  supportersCount: number;
  totalBooths: number;
  coveredBooths: number;
  coveragePercentage: number;
}

export interface VolunteerState {
  volunteers: VolunteerRecord[];
  coverage: VolunteerBoothCoverage | null;
  loading: boolean;
  error: string | null;
  lastCreatedCredentials: {
    name: string;
    mobile: string;
    defaultPassword?: string;
  } | null;
}

const initialState: VolunteerState = {
  volunteers: [],
  coverage: null,
  loading: false,
  error: null,
  lastCreatedCredentials: null,
};

export const SET_VOLUNTEERS = 'SET_VOLUNTEERS';
export const SET_VOLUNTEER_COVERAGE = 'SET_VOLUNTEER_COVERAGE';
export const ADD_VOLUNTEER = 'ADD_VOLUNTEER';
export const UPDATE_VOLUNTEER = 'UPDATE_VOLUNTEER';
export const DELETE_VOLUNTEER = 'DELETE_VOLUNTEER';
export const SET_VOLUNTEER_LOADING = 'SET_VOLUNTEER_LOADING';
export const SET_LAST_CREATED_CREDENTIALS = 'SET_LAST_CREATED_CREDENTIALS';
export const CLEAR_LAST_CREATED_CREDENTIALS = 'CLEAR_LAST_CREATED_CREDENTIALS';

export default function volunteerReducer(state = initialState, action: any): VolunteerState {
  switch (action.type) {
    case SET_VOLUNTEERS:
      return {
        ...state,
        volunteers: action.payload,
        loading: false,
        error: null,
      };

    case SET_VOLUNTEER_COVERAGE:
      return {
        ...state,
        coverage: action.payload,
      };

    case ADD_VOLUNTEER:
      return {
        ...state,
        volunteers: [action.payload, ...state.volunteers],
        loading: false,
      };

    case UPDATE_VOLUNTEER:
      return {
        ...state,
        volunteers: state.volunteers.map((v) => (v.id === action.payload.id ? action.payload : v)),
        loading: false,
      };

    case DELETE_VOLUNTEER:
      return {
        ...state,
        volunteers: state.volunteers.filter((v) => v.id !== action.payload),
        loading: false,
      };

    case SET_VOLUNTEER_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case SET_LAST_CREATED_CREDENTIALS:
      return {
        ...state,
        lastCreatedCredentials: action.payload,
      };

    case CLEAR_LAST_CREATED_CREDENTIALS:
      return {
        ...state,
        lastCreatedCredentials: null,
      };

    default:
      return state;
  }
}
