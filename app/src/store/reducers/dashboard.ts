export const SET_DASHBOARD_METRICS = "SET_DASHBOARD_METRICS";
export const SET_DASHBOARD_LOADING = "SET_DASHBOARD_LOADING";

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
  syncedContactsVotersCount: number;
  politicalViews: PoliticalViewCount;
  loading: boolean;
}

const initialDashboardState: DashboardState = {
  assignedBoothsCount: 0,
  totalVotersCount: 0,
  hierarchy: {
    acLeadersCount: 0,
    subLeadersCount: 0,
    supportersCount: 0,
  },
  genderData: {
    male: 152,
    female: 148,
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
  loading: false,
};

const dashboardReducer = (state = initialDashboardState, action: any): DashboardState => {
  switch (action.type) {
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
    default:
      return state;
  }
};

export default dashboardReducer;
