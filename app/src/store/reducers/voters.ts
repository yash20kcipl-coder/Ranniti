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
  firstName?: string;
  middleName?: string;
  surname?: string;
  engFirstName?: string;
  engMiddleName?: string;
  engSurname?: string;
  relativeName: string;
  relation?: string;
  guardianName?: string;
  age: number;
  dob?: string;
  gender: 'Male' | 'Female' | 'Other';
  epicNo: string;
  mobile: string;
  mobileNo?: string;
  email?: string;
  image: string;
  avatar?: string;
  aadhaarNo?: string;
  panNo?: string;

  // Electoral Details
  pcName: string;
  acName: string;
  wardNo: string;
  boothNo: string;
  boothName?: string;
  boothNumber?: string | number;
  boothId?: string;
  acId?: string;
  pcId?: string;
  serialNo: number;
  sectionNo?: string | number;
  houseNo?: string;

  // Location / Address
  address: string;
  fullAddress?: string;
  voterAddress?: string;
  taluka?: string;
  village?: string;
  districtName?: string;
  stateName?: string;

  // Socio-demographics
  casteName?: string;
  subcasteName?: string;
  religionName?: string;
  bloodGroup?: string;
  professionType?: string;
  profession?: string;

  // Political Inclination & Status
  voterType?: string;
  partyId?: string | null;
  supportingParty: string;
  partyName?: string;
  partyAbbreviation?: string;
  partySymbol?: string;
  politicalView: 'Favorable' | 'Neutral' | 'Unfavorable' | 'Opposite' | 'Pending';
  status?: string;
  isVoted: boolean;
  isDead?: boolean;
  isShifted?: boolean;

  // Family & Community Influence
  familyId?: string;
  isFamilyHead?: boolean;
  isFamilyInfluencer?: boolean;
  familyInfluencerId?: string;
  familyInfluencerName?: string;
  familyInfluencedCount?: number;
  isSocialInfluencer?: boolean;
  socialInfluencerId?: string;
  socialInfluencerName?: string;
  socialInfluencerEpic?: string;
  socialInfluencedCount?: number;
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
    acId?: string;
    supportingParty: string;
    politicalView: string;
    isVoted: string; // 'all' | 'voted' | 'not_voted'
    gender?: string;
    ageGroup?: string;
    voterType?: string;
    isDead?: string;
    influencerRole?: string;
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
  loading: true,
  loadingMore: false,
  filters: {
    search: '',
    boothNo: 'All',
    acId: '',
    supportingParty: 'All',
    politicalView: 'All',
    isVoted: 'all',
    gender: 'all',
    ageGroup: '',
    voterType: '',
    isDead: '',
    influencerRole: '',
  },
  pagination: initialPagination,
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
            ? {
                ...v,
                supportingParty: action.payload.party,
                partyName: action.payload.party,
                partyId: action.payload.partyId !== undefined ? action.payload.partyId : v.partyId,
              }
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

