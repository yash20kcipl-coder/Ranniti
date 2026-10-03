export const SET_APP_VERSION = "SET_APP_VERSION";

export interface AppVersionState {
  versionMap: Record<string, any> | null;
}

const initialState: AppVersionState = {
  versionMap: null,
};

const appVersionReducer = (state = initialState, action: any): AppVersionState => {
  switch (action.type) {
    case SET_APP_VERSION:
      return {
        ...state,
        versionMap: action.payload,
      };
    default:
      return state;
  }
};

export default appVersionReducer;
