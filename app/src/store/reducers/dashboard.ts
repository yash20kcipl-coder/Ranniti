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
  syncedContactsVotersCount: number;
  politicalViews: PoliticalViewCount;
  loading: boolean;
}

const initialDashboardState: DashboardState = {
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
