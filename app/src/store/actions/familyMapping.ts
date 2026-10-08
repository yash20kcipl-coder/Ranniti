import { Dispatch } from "redux";
import apiClient from '../../api/apiClient';
import { SET_FAMILY_HEADS, SET_FAMILY_LOADING } from "../reducers/familyMapping";

export const fetchFamilyHeadsAction = (search?: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_FAMILY_LOADING, payload: true });
    try {
      const response = await apiClient.get('/mobile/family-mapping/families', {
        params: { search, limit: 50 },
      });
      dispatch({ type: SET_FAMILY_HEADS, payload: response.data?.data?.families || [] });
    } catch (error) {
      console.error("Failed to fetch family mapping", error);
    } finally {
      dispatch({ type: SET_FAMILY_LOADING, payload: false });
    }
  };
};
