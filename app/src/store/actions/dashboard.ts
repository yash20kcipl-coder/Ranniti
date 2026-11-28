import { Dispatch } from "redux";
import apiClient from "../../api/apiClient";
import {
  SET_DASHBOARD_METRICS,
  SET_DASHBOARD_LOADING,
  SET_SURVEY_SCORE_DATA,
  SET_SURVEY_SCORE_LOADING,
  SET_MEMBER_SURVEY_SCORE,
  SET_MEMBER_SURVEY_SCORE_LOADING,
} from "../reducers/dashboard";

export const fetchDashboardMetricsAction = (boothId?: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_DASHBOARD_LOADING, payload: true });
    try {
      const params = boothId ? { boothId } : undefined;
      const response = await apiClient.get("mobile/dashboard", { params });
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

export const fetchMySurveyScoreAction = (timeRange: 'today' | '7d' | '30d' | 'all' = '30d') => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_SURVEY_SCORE_LOADING, payload: true });
    try {
      const response = await apiClient.get("mobile/dashboard/survey-score", {
        params: { timeRange },
      });
      if (response?.data?.data) {
        dispatch({
          type: SET_SURVEY_SCORE_DATA,
          payload: response.data.data,
        });
      }
    } catch (e) {
      console.error("Survey score API fetch error:", e);
    } finally {
      dispatch({ type: SET_SURVEY_SCORE_LOADING, payload: false });
    }
  };
};

export const fetchTeamMemberSurveyScoreAction = (memberId: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_MEMBER_SURVEY_SCORE_LOADING, payload: true });
    try {
      const response = await apiClient.get(`mobile/team/${memberId}/survey-score`);
      if (response?.data?.data) {
        dispatch({
          type: SET_MEMBER_SURVEY_SCORE,
          payload: response.data.data,
        });
      }
    } catch (e) {
      console.error("Team member survey score fetch error:", e);
    } finally {
      dispatch({ type: SET_MEMBER_SURVEY_SCORE_LOADING, payload: false });
    }
  };
};
