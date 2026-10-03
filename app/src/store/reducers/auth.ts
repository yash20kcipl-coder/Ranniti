export const LOG_IN = "LOG_IN";
export const LOG_OUT = "LOG_OUT";
export const SET_AUTH_LOADING = "SET_AUTH_LOADING";
export const SET_USER_PROFILE = "SET_USER_PROFILE";
export const SET_ACADEMIC_YEAR = "SET_ACADEMIC_YEAR";
export const SET_PARENT_PROFILE = "SET_PARENT_PROFILE";
export const SET_SELECTED_STUDENT_ID = "SET_SELECTED_STUDENT_ID";

export interface DemoUser {
  id: string;
  name: string;
  phone: string;
  role: 'pc_leader' | 'ac_leader' | 'sub_leader' | 'supporter';
  roleName: string;
  avatar: string;
  assignedPc: string;
  assignedAc: string;
  assignedBooth: string;
  assignedArea: string;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  pc_leader: {
    id: 'user-001',
    name: 'Vikramaditya Singh',
    phone: '9876543210',
    role: 'pc_leader',
    roleName: 'PC Leader',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    assignedPc: 'Jaipur Parliamentary Constituency',
    assignedAc: 'All 8 ACs',
    assignedBooth: '145 Booths',
    assignedArea: 'Jaipur Central Zone',
  },
  ac_leader: {
    id: 'user-002',
    name: 'Rajesh Sharma',
    phone: '9876543211',
    role: 'ac_leader',
    roleName: 'AC Leader',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    assignedPc: 'Jaipur Parliamentary Constituency',
    assignedAc: 'Hawa Mahal Assembly Constituency',
    assignedBooth: '42 Booths',
    assignedArea: 'Hawa Mahal West',
  },
  sub_leader: {
    id: 'user-003',
    name: 'Amit Verma',
    phone: '9876543212',
    role: 'sub_leader',
    roleName: 'Sub Leader',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    assignedPc: 'Jaipur Parliamentary Constituency',
    assignedAc: 'Hawa Mahal Assembly Constituency',
    assignedBooth: 'Booth #12 - #20 (8 Booths)',
    assignedArea: 'Ward 14 - Bapu Bazar',
  },
  supporter: {
    id: 'user-004',
    name: 'Rahul Gujjar',
    phone: '9876543213',
    role: 'supporter',
    roleName: 'Supporter',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    assignedPc: 'Jaipur Parliamentary Constituency',
    assignedAc: 'Hawa Mahal Assembly Constituency',
    assignedBooth: 'Booth #14 - Govt Sec School',
    assignedArea: 'Bapu Bazar Lane 3',
  },
};

const initialState = {
  token: 'demo-token-12345',
  role: 'pc_leader',
  user: DEMO_USERS.pc_leader,
  parentData: null,
  academicYear: null,
  isLoggedIn: false,
  loading: false,
  selectedStudentId: null,
};

const authReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_AUTH_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case LOG_IN:
      return {
        ...state,
        token: action.payload.token || 'demo-jwt-token',
        role: action.payload.role || 'pc_leader',
        user: action.payload.user || DEMO_USERS.pc_leader,
        isLoggedIn: true,
      };
    case SET_USER_PROFILE:
      return {
        ...state,
        user: action.payload,
      };
    case LOG_OUT:
      return {
        ...initialState,
        isLoggedIn: false,
        token: null,
        user: null,
      };
    default:
      return state;
  }
};

export default authReducer;
