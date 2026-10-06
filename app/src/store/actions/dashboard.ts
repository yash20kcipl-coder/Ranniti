import { Dispatch } from "redux";
import apiClient from "../../api/apiClient";
import { SET_DASHBOARD_METRICS, SET_DASHBOARD_LOADING } from "../reducers/dashboard";

export const fetchDashboardMetricsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_DASHBOARD_LOADING, payload: true });
    try {
      const response = await apiClient.get("mobile/dashboard");
      if (response?.data?.data) {
        dispatch({
          type: SET_DASHBOARD_METRICS,
          payload: response.data.data,
        });
      }
    } catch (e) {
      console.error("Dashboard API fetch error:", e);
    } finally {
      dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
    }
  };
};
