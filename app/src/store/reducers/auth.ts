export const LOG_IN = "LOG_IN";
export const LOG_OUT = "LOG_OUT";
export const SET_AUTH_LOADING = "SET_AUTH_LOADING";
export const SET_USER_PROFILE = "SET_USER_PROFILE";
export const SET_ACADEMIC_YEAR = "SET_ACADEMIC_YEAR";
export const SET_PARENT_PROFILE = "SET_PARENT_PROFILE";
export const SET_SELECTED_STUDENT_ID = "SET_SELECTED_STUDENT_ID";

const initialState = {
  token: null,
  role: null,
  user: null,
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
        token: action.payload.token,
        role: action.payload.role,
        isLoggedIn: true,
      };
    case SET_USER_PROFILE:
      return {
        ...state,
        user: action.payload,
      };
    case SET_PARENT_PROFILE:
      return {
        ...state,
        parentData: action.payload,
      };
    case SET_ACADEMIC_YEAR:
      return {
        ...state,
        academicYear: action.payload,
      };
    case SET_SELECTED_STUDENT_ID:
      return {
        ...state,
        selectedStudentId: action.payload,
      };
    case LOG_OUT:
      return initialState;
    default:
      return state;
  }
};

export default authReducer;
