export const SET_VOTERS_LIST = "SET_VOTERS_LIST";
export const SET_VOTER_FILTERS = "SET_VOTER_FILTERS";
export const TOGGLE_VOTED_STATUS = "TOGGLE_VOTED_STATUS";
export const UPDATE_VOTER_PARTY = "UPDATE_VOTER_PARTY";
export const ADD_NEW_VOTER = "ADD_NEW_VOTER";
export const UPDATE_VOTER_DETAILS = "UPDATE_VOTER_DETAILS";
export const SET_VOTERS_LOADING = "SET_VOTERS_LOADING";

export interface Voter {
  id: string;
  name: string;
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

export const DEMO_VOTERS: Voter[] = [
  {
    id: 'voter-101',
    name: 'Ramesh Kumar Sharma',
    relativeName: 'Late Mohan Lal Sharma',
    age: 52,
    gender: 'Male',
    epicNo: 'RJ14829102',
    mobile: '+919829012345',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    pcName: 'Jaipur PC',
    acName: 'Hawa Mahal AC',
    wardNo: 'Ward 14',
    boothNo: 'Booth #12',
    serialNo: 104,
    address: '142 Bapu Bazar, Johari Market, Jaipur',
    supportingParty: 'Party A',
    politicalView: 'Favorable',
    isVoted: true,
    isFamilyHead: true,
    familyId: 'fam-01',
  },
  {
    id: 'voter-102',
    name: 'Sunita Sharma',
    relativeName: 'W/o Ramesh Kumar Sharma',
    age: 48,
    gender: 'Female',
    epicNo: 'RJ14829103',
    mobile: '+919829012346',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    pcName: 'Jaipur PC',
    acName: 'Hawa Mahal AC',
    wardNo: 'Ward 14',
    boothNo: 'Booth #12',
    serialNo: 105,
    address: '142 Bapu Bazar, Johari Market, Jaipur',
    supportingParty: 'Party A',
    politicalView: 'Favorable',
    isVoted: true,
    isFamilyHead: false,
    familyId: 'fam-01',
  },
  {
    id: 'voter-103',
    name: 'Pankaj Sharma',
    relativeName: 'S/o Ramesh Kumar Sharma',
    age: 24,
    gender: 'Male',
    epicNo: 'RJ14829104',
    mobile: '+919829012347',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    pcName: 'Jaipur PC',
    acName: 'Hawa Mahal AC',
    wardNo: 'Ward 14',
    boothNo: 'Booth #12',
    serialNo: 106,
    address: '142 Bapu Bazar, Johari Market, Jaipur',
    supportingParty: 'Party A',
    politicalView: 'Favorable',
    isVoted: false,
    isFamilyHead: false,
    familyId: 'fam-01',
  },
  {
    id: 'voter-104',
    name: 'Mohammad Imran Khan',
    relativeName: 'Abdul Sattar Khan',
    age: 39,
    gender: 'Male',
    epicNo: 'RJ14930219',
    mobile: '+919829055443',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    pcName: 'Jaipur PC',
    acName: 'Hawa Mahal AC',
    wardNo: 'Ward 15',
    boothNo: 'Booth #14',
    serialNo: 88,
    address: 'Shop 88, Ramganj Circle, Jaipur',
    supportingParty: 'Party B',
    politicalView: 'Neutral',
    isVoted: false,
    isFamilyHead: true,
    familyId: 'fam-02',
  },
  {
    id: 'voter-105',
    name: 'Savitri Devi',
    relativeName: 'W/o Ramgopal Agarwal',
    age: 67,
    gender: 'Female',
    epicNo: 'RJ14002931',
    mobile: '+919414011223',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    pcName: 'Jaipur PC',
    acName: 'Hawa Mahal AC',
    wardNo: 'Ward 14',
    boothNo: 'Booth #12',
    serialNo: 210,
    address: '55 Tripolia Bazar, Jaipur',
    supportingParty: 'Party A',
    politicalView: 'Favorable',
    isVoted: true,
    isFamilyHead: true,
    familyId: 'fam-03',
  },
  {
    id: 'voter-106',
    name: 'Vikram Gurjar',
    relativeName: 'Kalu Ram Gurjar',
    age: 31,
    gender: 'Male',
    epicNo: 'RJ14778821',
    mobile: '+919782012999',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    pcName: 'Jaipur PC',
    acName: 'Hawa Mahal AC',
    wardNo: 'Ward 16',
    boothNo: 'Booth #18',
    serialNo: 45,
    address: '12 Gurjar Ghati, Jaipur',
    supportingParty: 'Undecided',
    politicalView: 'Pending',
    isVoted: false,
  },
];

interface VoterState {
  voters: Voter[];
  filters: {
    search: string;
    boothNo: string;
    supportingParty: string;
    politicalView: string;
    isVoted: string; // 'all' | 'voted' | 'not_voted'
  };
  loading: boolean;
}

const initialVoterState: VoterState = {
  voters: DEMO_VOTERS,
  filters: {
    search: '',
    boothNo: 'All',
    supportingParty: 'All',
    politicalView: 'All',
    isVoted: 'all',
  },
  loading: false,
};

const voterReducer = (state = initialVoterState, action: any): VoterState => {
  switch (action.type) {
    case SET_VOTERS_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_VOTERS_LIST:
      return {
        ...state,
        voters: action.payload,
        loading: false,
      };
    case SET_VOTER_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
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
