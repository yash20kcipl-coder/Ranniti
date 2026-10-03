export const SET_INFLUENCERS_LIST = "SET_INFLUENCERS_LIST";
export const SET_INFLUENCERS_LOADING = "SET_INFLUENCERS_LOADING";

export interface SocialInfluencer {
  id: string;
  name: string;
  profession: string;
  mobile: string;
  photo: string;
  supportingParty: string;
  influenceArea: string;
  influencedVotersCount: number;
  influencedVoters: Array<{
    id: string;
    name: string;
    epicNo: string;
    mobile: string;
    boothNo: string;
    isVoted: boolean;
  }>;
}

export const DEMO_INFLUENCERS: SocialInfluencer[] = [
  {
    id: 'inf-01',
    name: 'Dr. Ashok Agarwal',
    profession: 'Senior Physician & Medical Association President',
    mobile: '+919829011122',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    supportingParty: 'Party A',
    influenceArea: 'Johari Bazar & Bapu Bazar Doctors Network',
    influencedVotersCount: 45,
    influencedVoters: [
      {
        id: 'voter-101',
        name: 'Ramesh Kumar Sharma',
        epicNo: 'RJ14829102',
        mobile: '+919829012345',
        boothNo: 'Booth #12',
        isVoted: true,
      },
      {
        id: 'voter-105',
        name: 'Savitri Devi',
        epicNo: 'RJ14002931',
        mobile: '+919414011223',
        boothNo: 'Booth #12',
        isVoted: true,
      },
    ],
  },
  {
    id: 'inf-02',
    name: 'Sardar Manpreet Singh',
    profession: 'Merchant Union General Secretary',
    mobile: '+919828033445',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    supportingParty: 'Party A',
    influenceArea: 'Tripolia Market Traders',
    influencedVotersCount: 38,
    influencedVoters: [
      {
        id: 'voter-106',
        name: 'Vikram Gurjar',
        epicNo: 'RJ14778821',
        mobile: '+919782012999',
        boothNo: 'Booth #18',
        isVoted: false,
      },
    ],
  },
];

interface InfluencerState {
  influencers: SocialInfluencer[];
  loading: boolean;
}

const initialState: InfluencerState = {
  influencers: DEMO_INFLUENCERS,
  loading: false,
};

const influencersReducer = (state = initialState, action: any): InfluencerState => {
  switch (action.type) {
    case SET_INFLUENCERS_LOADING:
      return { ...state, loading: action.payload };
    case SET_INFLUENCERS_LIST:
      return { ...state, influencers: action.payload, loading: false };
    default:
      return state;
  }
};

export default influencersReducer;
