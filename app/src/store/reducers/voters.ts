export const ADD_NEW_VOTER = "ADD_NEW_VOTER";
export const SET_VOTERS_LIST = "SET_VOTERS_LIST";
export const SET_VOTER_FILTERS = "SET_VOTER_FILTERS";
export const APPEND_VOTERS_LIST = "APPEND_VOTERS_LIST";
export const UPDATE_VOTER_PARTY = "UPDATE_VOTER_PARTY";
export const SET_VOTERS_LOADING = "SET_VOTERS_LOADING";
export const TOGGLE_VOTED_STATUS = "TOGGLE_VOTED_STATUS";
export const UPDATE_VOTER_DETAILS = "UPDATE_VOTER_DETAILS";
export const SET_VOTERS_PAGINATION = "SET_VOTERS_PAGINATION";
export const SET_VOTERS_LOADING_MORE = "SET_VOTERS_LOADING_MORE";

export interface Voter {
  id: string;
  name: string;
  hindiName?: string;
  englishName?: string;
  relativeName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  epicNo: string;
  mobile: string;
  image: string;
  pcName: string;
  acName: string;
  wardNo: string;
  boothNo: string;
  serialNo: number;
  address: string;
  supportingParty: string;
  politicalView: 'Favorable' | 'Neutral' | 'Unfavorable' | 'Opposite' | 'Pending';
  isVoted: boolean;
  isFamilyHead?: boolean;
  familyId?: string;
}

export interface VoterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface VoterState {
  voters: Voter[];
  filters: {
    search: string;
    boothNo: string;
    supportingParty: string;
    politicalView: string;
    isVoted: string; // 'all' | 'voted' | 'not_voted'
    gender?: string;
  };
  pagination: VoterPagination;
  loading: boolean;
  loadingMore: boolean;
}

const initialPagination: VoterPagination = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1,
  hasMore: false,
};

const initialVoterState: VoterState = {
  voters: [],
  filters: {
    search: '',
    boothNo: 'All',
    supportingParty: 'All',
    politicalView: 'All',
    isVoted: 'all',
    gender: 'all',
  },
  pagination: initialPagination,
  loading: false,
  loadingMore: false,
};

const voterReducer = (state = initialVoterState, action: any): VoterState => {
  switch (action.type) {
    case SET_VOTERS_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_VOTERS_LOADING_MORE:
      return {
        ...state,
        loadingMore: action.payload,
      };
    case SET_VOTERS_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload,
        },
      };
    case SET_VOTERS_LIST:
      return {
        ...state,
        voters: action.payload,
        loading: false,
      };
    case APPEND_VOTERS_LIST: {
      const existingIds = new Set(state.voters.map((v) => v.id));
      const incomingList: Voter[] = action.payload || [];
      const newVoters = incomingList.filter((v) => !existingIds.has(v.id));
      return {
        ...state,
        voters: [...state.voters, ...newVoters],
        loadingMore: false,
      };
    }
    case SET_VOTER_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        pagination: {
          ...state.pagination,
          page: 1,
        },
      };
    case TOGGLE_VOTED_STATUS:
      return {
        ...state,
        voters: state.voters.map((v) =>
          v.id === action.payload ? { ...v, isVoted: !v.isVoted } : v
        ),
      };
    case UPDATE_VOTER_PARTY:
      return {
        ...state,
        voters: state.voters.map((v) =>
          v.id === action.payload.voterId
            ? { ...v, supportingParty: action.payload.party }
            : v
        ),
      };
    case ADD_NEW_VOTER:
      return {
        ...state,
        voters: [action.payload, ...state.voters],
      };
    case UPDATE_VOTER_DETAILS:
      return {
        ...state,
        voters: state.voters.map((v) =>
          v.id === action.payload.id ? { ...v, ...action.payload } : v
        ),
      };
    default:
      return state;
  }
};

export default voterReducer;
