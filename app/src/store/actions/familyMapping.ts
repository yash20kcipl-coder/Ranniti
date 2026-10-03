import { SET_FAMILY_HEADS, SET_FAMILY_LOADING, DEMO_FAMILIES } from "../reducers/familyMapping";
import { Dispatch } from "redux";

export const fetchFamilyHeadsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_FAMILY_LOADING, payload: true });
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
      dispatch({ type: SET_FAMILY_HEADS, payload: DEMO_FAMILIES });
    } finally {
      dispatch({ type: SET_FAMILY_LOADING, payload: false });
    }
  };
};
