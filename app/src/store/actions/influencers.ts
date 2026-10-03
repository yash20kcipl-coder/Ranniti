import { SET_INFLUENCERS_LIST, SET_INFLUENCERS_LOADING, DEMO_INFLUENCERS } from "../reducers/influencers";
import { Dispatch } from "redux";

export const fetchInfluencersAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_INFLUENCERS_LOADING, payload: true });
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
      dispatch({ type: SET_INFLUENCERS_LIST, payload: DEMO_INFLUENCERS });
    } finally {
      dispatch({ type: SET_INFLUENCERS_LOADING, payload: false });
    }
  };
};
