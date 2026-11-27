import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export const SET_SURVEY_LEADERBOARD = 'SET_SURVEY_LEADERBOARD';
export const SET_SURVEY_LEADERBOARD_LOADING = 'SET_SURVEY_LEADERBOARD_LOADING';
export const SET_SURVEY_AUDIT_FEED = 'SET_SURVEY_AUDIT_FEED';
export const SET_SURVEY_AUDIT_FEED_LOADING = 'SET_SURVEY_AUDIT_FEED_LOADING';
export const SET_VOLUNTEER_SURVEY_STATS = 'SET_VOLUNTEER_SURVEY_STATS';
export const SET_VOLUNTEER_SURVEY_STATS_LOADING = 'SET_VOLUNTEER_SURVEY_STATS_LOADING';

export interface VolunteerLeaderboardRow {
  rank: number;
  volunteerId: string;
  name: string;
  mobile: string;
  avatar: string | null;
  role: string;
  totalScore: number;
  votersSurveyed: number;
  fieldsUpdated: number;
  contactPoints: number;
  politicalPoints: number;
  demographicPoints: number;
  statusPoints: number;
  lastActiveAt: string | null;
}

export interface SurveyAuditFeedRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerMobile: string;
  volunteerAvatar: string | null;
  voterId: string;
  voterEpicNo: string;
  voterName: string;
  boothId: string | null;
  boothName?: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  pointsAwarded: number;
  createdAt: string;
}

export interface VolunteerSurveyDetailData {
  volunteer: any;
  summary: {
    totalScore: number;
    votersSurveyed: number;
    fieldsUpdated: number;
    contactPoints: number;
    politicalPoints: number;
    demographicPoints: number;
    statusPoints: number;
  };
  fieldCounts: Record<string, number>;
}

export const setSurveyLeaderboard = (data: { leaderboard: VolunteerLeaderboardRow[]; totalCount: number }) => ({
  type: SET_SURVEY_LEADERBOARD,
  payload: data,
});

export const setSurveyLeaderboardLoading = (loading: boolean) => ({
  type: SET_SURVEY_LEADERBOARD_LOADING,
  payload: loading,
});

export const setSurveyAuditFeed = (data: { items: SurveyAuditFeedRow[]; totalCount: number; page: number; limit: number }) => ({
  type: SET_SURVEY_AUDIT_FEED,
  payload: data,
});

export const setSurveyAuditFeedLoading = (loading: boolean) => ({
  type: SET_SURVEY_AUDIT_FEED_LOADING,
  payload: loading,
});

export const setVolunteerSurveyStats = (data: VolunteerSurveyDetailData | null) => ({
  type: SET_VOLUNTEER_SURVEY_STATS,
  payload: data,
});

export const setVolunteerSurveyStatsLoading = (loading: boolean) => ({
  type: SET_VOLUNTEER_SURVEY_STATS_LOADING,
  payload: loading,
});

export const fetchSurveyLeaderboard = (filters: {
  timeRange?: 'today' | '7d' | '30d' | 'all';
  boothId?: string;
  role?: string;
  search?: string;
} = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSurveyLeaderboardLoading(true));
    try {
      const res = await api.get('/tenant/surveys/leaderboard', { params: filters });
      const data = res.data?.data || res.data || { leaderboard: [], totalCount: 0 };
      dispatch(setSurveyLeaderboard(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSurveyLeaderboardLoading(false));
    }
  };
};

export const fetchSurveyAuditFeed = (params: {
  boothId?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSurveyAuditFeedLoading(true));
    try {
      const res = await api.get('/tenant/surveys/audit-feed', { params });
      const data = res.data?.data || res.data || { items: [], totalCount: 0, page: 1, limit: 20 };
      dispatch(setSurveyAuditFeed(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setSurveyAuditFeedLoading(false));
    }
  };
};

export const fetchVolunteerSurveyStats = (volunteerId: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setVolunteerSurveyStatsLoading(true));
    try {
      const res = await api.get(`/tenant/surveys/volunteers/${volunteerId}`);
      const data = res.data?.data || res.data || null;
      dispatch(setVolunteerSurveyStats(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setVolunteerSurveyStatsLoading(false));
    }
  };
};

export const exportSurveyLeaderboard = (filters: {
  timeRange?: string;
  boothId?: string;
  role?: string;
  search?: string;
} = {}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant/surveys/export', {
        params: filters,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `volunteer_survey_leaderboard_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
