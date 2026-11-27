import {
  SET_SURVEY_LEADERBOARD,
  SET_SURVEY_LEADERBOARD_LOADING,
  SET_SURVEY_AUDIT_FEED,
  SET_SURVEY_AUDIT_FEED_LOADING,
  SET_VOLUNTEER_SURVEY_STATS,
  SET_VOLUNTEER_SURVEY_STATS_LOADING,
} from '../actions/survey';
import type {
  VolunteerLeaderboardRow,
  SurveyAuditFeedRow,
  VolunteerSurveyDetailData,
} from '../actions/survey';

export interface SurveyState {
  leaderboard: VolunteerLeaderboardRow[];
  totalLeaderboardCount: number;
  leaderboardLoading: boolean;
  auditItems: SurveyAuditFeedRow[];
  totalAuditCount: number;
  auditPage: number;
  auditLimit: number;
  auditLoading: boolean;
  selectedVolunteerStats: VolunteerSurveyDetailData | null;
  volunteerStatsLoading: boolean;
}

const initialState: SurveyState = {
  leaderboard: [],
  totalLeaderboardCount: 0,
  leaderboardLoading: false,
  auditItems: [],
  totalAuditCount: 0,
  auditPage: 1,
  auditLimit: 20,
  auditLoading: false,
  selectedVolunteerStats: null,
  volunteerStatsLoading: false,
};

export default function surveyReducer(
  state: SurveyState = initialState,
  action: { type: string; payload?: any }
): SurveyState {
  switch (action.type) {
    case SET_SURVEY_LEADERBOARD:
      return {
        ...state,
        leaderboard: action.payload?.leaderboard || [],
        totalLeaderboardCount: action.payload?.totalCount || 0,
      };

    case SET_SURVEY_LEADERBOARD_LOADING:
      return { ...state, leaderboardLoading: action.payload };

    case SET_SURVEY_AUDIT_FEED:
      return {
        ...state,
        auditItems: action.payload?.items || [],
        totalAuditCount: action.payload?.totalCount || 0,
        auditPage: action.payload?.page || 1,
        auditLimit: action.payload?.limit || 20,
      };

    case SET_SURVEY_AUDIT_FEED_LOADING:
      return { ...state, auditLoading: action.payload };

    case SET_VOLUNTEER_SURVEY_STATS:
      return { ...state, selectedVolunteerStats: action.payload };

    case SET_VOLUNTEER_SURVEY_STATS_LOADING:
      return { ...state, volunteerStatsLoading: action.payload };

    default:
      return state;
  }
}
