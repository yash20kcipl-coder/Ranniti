export const SET_DASHBOARD_METRICS = "SET_DASHBOARD_METRICS";
export const SET_DASHBOARD_LOADING = "SET_DASHBOARD_LOADING";
export const INCREMENT_DASHBOARD_VOTE = "INCREMENT_DASHBOARD_VOTE";
export const DECREMENT_DASHBOARD_VOTE = "DECREMENT_DASHBOARD_VOTE";
export const SET_SURVEY_SCORE_DATA = "SET_SURVEY_SCORE_DATA";
export const SET_SURVEY_SCORE_LOADING = "SET_SURVEY_SCORE_LOADING";
export const SET_MEMBER_SURVEY_SCORE = "SET_MEMBER_SURVEY_SCORE";
export const SET_MEMBER_SURVEY_SCORE_LOADING = "SET_MEMBER_SURVEY_SCORE_LOADING";

export interface SurveyFieldRule {
  label: string;
  points: number;
  category: 'contact' | 'political' | 'demographic' | 'status' | 'address' | 'profile' | 'identification';
  enabled: boolean;
  requirePreviouslyEmpty?: boolean;
}

export interface SurveyRecentUpdate {
  id: string;
  voterId: string;
  voterName: string;
  voterEpicNo: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  pointsAwarded: number;
  createdAt: string;
}

export interface VolunteerSurveyStatsPayload {
  volunteer: {
    id: string;
    name: string;
    mobile: string;
    avatar: string | null;
    role: string;
    status: string;
  } | null;
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
  recentUpdates: SurveyRecentUpdate[];
}

export interface TeamSurveyScoreRow {
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

export interface SurveyScoreState {
  rank: number;
  totalVolunteers: number;
  timeRange: 'today' | '7d' | '30d' | 'all';
  myStats: VolunteerSurveyStatsPayload | null;
  rules: Record<string, SurveyFieldRule>;
  teamScores: TeamSurveyScoreRow[];
  loading: boolean;
  selectedMemberStats: VolunteerSurveyStatsPayload | null;
  memberLoading: boolean;
}

export interface PoliticalViewCount {
  favorable: number;
  neutral: number;
  unfavorable: number;
  opposite: number;
  markedTotal: number;
  pendingTotal: number;
  grandTotal: number;
}

export interface DashboardState {
  assignedBoothsCount: number;
  totalVotersCount: number;
  hierarchy: {
    acLeadersCount: number;
    subLeadersCount: number;
    supportersCount: number;
  };
  influencers: {
    familyInfluencersCount: number;
    socialInfluencersCount: number;
    totalInfluencersCount: number;
  };
  genderData: {
    male: number;
    female: number;
    other: number;
  };
  ageData: {
    youth: number;
    adult: number;
    senior: number;
  };
  turnoutData: {
    votedCount: number;
    totalVoters: number;
  };
  activeElection?: {
    id: string;
    name: string;
    electionDate?: string;
    status?: string;
  } | null;
  syncedContactsVotersCount: number;
  politicalViews: PoliticalViewCount;
  surveyScore: SurveyScoreState;
  loading: boolean;
}

const initialDashboardState: DashboardState = {
  assignedBoothsCount: 0,
  totalVotersCount: 0,
  activeElection: null,
  hierarchy: {
    acLeadersCount: 0,
    subLeadersCount: 0,
    supportersCount: 0,
  },
  genderData: {
    male: 0,
    female: 0,
    other: 0
  },
  ageData: {
    youth: 0,
    adult: 0,
    senior: 0
  },
  turnoutData: {
    votedCount: 0,
    totalVoters: 0
  },
  influencers: {
    familyInfluencersCount: 0,
    socialInfluencersCount: 0,
    totalInfluencersCount: 0,
  },
  syncedContactsVotersCount: 0,
  politicalViews: {
    favorable: 0,
    neutral: 0,
    unfavorable: 0,
    opposite: 0,
    markedTotal: 0,
    pendingTotal: 0,
    grandTotal: 0,
  },
  surveyScore: {
    rank: 0,
    totalVolunteers: 0,
    timeRange: '30d',
    myStats: null,
    rules: {},
    teamScores: [],
    loading: false,
    selectedMemberStats: null,
    memberLoading: false,
  },
  loading: true,
};

const dashboardReducer = (state = initialDashboardState, action: any): DashboardState => {
  switch (action.type) {
    case INCREMENT_DASHBOARD_VOTE:
      return {
        ...state,
        turnoutData: {
          ...state.turnoutData,
          votedCount: (state.turnoutData?.votedCount || 0) + 1,
        },
      };
    case DECREMENT_DASHBOARD_VOTE:
      return {
        ...state,
        turnoutData: {
          ...state.turnoutData,
          votedCount: Math.max((state.turnoutData?.votedCount || 1) - 1, 0),
        },
      };
    case SET_DASHBOARD_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_DASHBOARD_METRICS:
      return {
        ...state,
        ...action.payload,
        loading: false,
      };
    case SET_SURVEY_SCORE_LOADING:
      return {
        ...state,
        surveyScore: {
          ...state.surveyScore,
          loading: action.payload,
        },
      };
    case SET_SURVEY_SCORE_DATA:
      return {
        ...state,
        surveyScore: {
          ...state.surveyScore,
          ...action.payload,
          loading: false,
        },
      };
    case SET_MEMBER_SURVEY_SCORE_LOADING:
      return {
        ...state,
        surveyScore: {
          ...state.surveyScore,
          memberLoading: action.payload,
        },
      };
    case SET_MEMBER_SURVEY_SCORE:
      return {
        ...state,
        surveyScore: {
          ...state.surveyScore,
          selectedMemberStats: action.payload,
          memberLoading: false,
        },
      };
    default:
      return state;
  }
};

export default dashboardReducer;
