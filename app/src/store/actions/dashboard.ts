import { SET_DASHBOARD_METRICS, SET_DASHBOARD_LOADING } from "../reducers/dashboard";
import { Dispatch } from "redux";

export const fetchDashboardMetricsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_DASHBOARD_LOADING, payload: true });
    try {
      // Simulate quick fetch delay for skeleton loading demo
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
      dispatch({
        type: SET_DASHBOARD_METRICS,
        payload: {
          assignedBoothsCount: 42,
          totalVotersCount: 48500,
          hierarchy: {
            acLeadersCount: 8,
            subLeadersCount: 36,
            supportersCount: 142,
          },
          influencers: {
            familyInfluencersCount: 380,
            socialInfluencersCount: 124,
            totalInfluencersCount: 504,
          },
          syncedContactsVotersCount: 412,
          politicalViews: {
            favorable: 21400,
            neutral: 9800,
            unfavorable: 4100,
            opposite: 1200,
            markedTotal: 36500,
            pendingTotal: 12000,
            grandTotal: 48500,
          },
        },
      });
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
    }
  };
};
