import {
  SET_VOTERS_DATA,
  SET_VOTERS_LOADING,
  SET_VOTERS_PAGINATION,
  SET_VOTER_STATS,
  SET_VOTER_FILTERS,
} from '../actions/voter';

export interface VoterState {
  loading: boolean;
  initialized: boolean;
  voters: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalVoters: number;
    maleVoters: number;
    femaleVoters: number;
    otherVoters: number;
    voterTypeCounts: Record<string, number>;
  };
  filters: {
    search: string;
    stateId: string;
    districtId: string;
    boothId: string;
    acId: string;
    gender: string;
    voterType: string;
    status: string;
    isDead: string;
    partyId: string;
    religionId: string;
    casteId: string;
    ageGroup: string;
    familyInfluencerId: string;
    socialInfluencerId: string;
    isFamilyInfluencer: string;
    isSocialInfluencer: string;
    influencerStatus: string;
    influencerRole: string;
    page: number;
    limit: number;
  };
}

export const initialVoterFilters = {
  search: '',
  stateId: '',
  districtId: '',
  boothId: '',
  acId: '',
  gender: '',
  voterType: '',
  status: '',
  isDead: '',
  partyId: '',
  religionId: '',
  casteId: '',
  ageGroup: '',
  familyInfluencerId: '',
  socialInfluencerId: '',
  isFamilyInfluencer: '',
  isSocialInfluencer: '',
  influencerStatus: '',
  influencerRole: '',
  page: 1,
  limit: 25,
};

const initialState: VoterState = {
  loading: false,
  initialized: false,
  voters: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  },
  stats: {
    totalVoters: 0,
    maleVoters: 0,
    femaleVoters: 0,
    otherVoters: 0,
    voterTypeCounts: {},
  },
  filters: initialVoterFilters,
};

export default function voterReducer(state = initialState, action: any): VoterState {
  switch (action.type) {
    case SET_VOTERS_LOADING:
      return {
        ...state,
        loading: action.loading,
      };
    case SET_VOTERS_DATA:
      return {
        ...state,
        voters: action.voters,
        initialized: true,
      };
    case SET_VOTERS_PAGINATION:
      return {
        ...state,
        pagination: action.pagination,
      };
    case SET_VOTER_STATS:
      return {
        ...state,
        stats: action.stats,
      };
    case SET_VOTER_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.filters,
        },
      };
    default:
      return state;
  }
}
