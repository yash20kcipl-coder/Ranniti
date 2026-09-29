import { Log_Out, MY_PROFILE, SET_TOKEN, type UserProfile } from '../actions/auth';

export interface UserState {
  user: UserProfile | null;
  myprofile: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  logout: boolean;
}

const savedToken = localStorage.getItem('token');
const savedUserRaw = localStorage.getItem('user');
let initialUser: UserProfile | null = null;
if (savedUserRaw) {
  try {
    initialUser = JSON.parse(savedUserRaw);
  } catch {
    initialUser = null;
  }
}

const initialState: UserState = {
  user: initialUser,
  myprofile: initialUser,
  token: savedToken || null,
  isAuthenticated: Boolean(savedToken && initialUser),
  logout: false,
};

export default function userreducers(state = initialState, action: any): UserState {
  switch (action.type) {
    case MY_PROFILE:
      return {
        ...state,
        user: action.data,
        myprofile: action.data,
        isAuthenticated: !!action.data,
      };
    case SET_TOKEN:
      return {
        ...state,
        token: action.data,
        isAuthenticated: !!action.data,
      };
    case Log_Out:
      return {
        ...state,
        logout: action.data,
        user: null,
        myprofile: null,
        token: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}
