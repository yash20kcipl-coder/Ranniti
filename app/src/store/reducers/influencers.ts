export const SET_INFLUENCERS_LIST = "SET_INFLUENCERS_LIST";
export const SET_INFLUENCERS_LOADING = "SET_INFLUENCERS_LOADING";

export interface SocialInfluencer {
  id: string;
  name: string;
  profession: string;
  mobile: string;
  photo?: string;
  avatar?: string;
  supportingParty?: string;
  influenceArea?: string;
  isSocialInfluencer?: boolean;
  isFamilyInfluencer?: boolean;
  influencedVotersCount: number;
  influencedVoters: Array<{
    id: string;
    name: string;
    epicNo: string;
    mobile?: string;
    boothNo?: string;
    isVoted?: boolean;
  }>;
}

interface InfluencerState {
  influencers: SocialInfluencer[];
  totalCount: number;
  socialCount: number;
  familyCount: number;
  loading: boolean;
}

const initialState: InfluencerState = {
  influencers: [],
  totalCount: 0,
  socialCount: 0,
  familyCount: 0,
  loading: false,
};

const influencersReducer = (state = initialState, action: any): InfluencerState => {
  switch (action.type) {
    case SET_INFLUENCERS_LOADING:
      return { ...state, loading: action.payload };
    case SET_INFLUENCERS_LIST:
      return {
        ...state,
        influencers: action.payload.influencers || [],
        totalCount: action.payload.totalCount || (action.payload.influencers || []).length,
        socialCount: action.payload.socialCount || 0,
        familyCount: action.payload.familyCount || 0,
        loading: false,
      };
    default:
      return state;
  }
};

export default influencersReducer;
