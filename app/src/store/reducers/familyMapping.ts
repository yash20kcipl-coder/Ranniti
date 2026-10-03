export const SET_FAMILY_HEADS = "SET_FAMILY_HEADS";
export const SET_FAMILY_MEMBERS = "SET_FAMILY_MEMBERS";
export const SET_FAMILY_LOADING = "SET_FAMILY_LOADING";

export interface FamilyGroup {
  familyId: string;
  headName: string;
  headMobile: string;
  headEpic: string;
  headPhoto: string;
  address: string;
  totalMembers: number;
  members: Array<{
    id: string;
    name: string;
    relation: string;
    age: number;
    gender: string;
    epicNo: string;
    mobile: string;
    isVoted: boolean;
    supportingParty: string;
  }>;
}

export const DEMO_FAMILIES: FamilyGroup[] = [
  {
    familyId: 'fam-01',
    headName: 'Ramesh Kumar Sharma',
    headMobile: '+919829012345',
    headEpic: 'RJ14829102',
    headPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    address: '142 Bapu Bazar, Johari Market, Jaipur',
    totalMembers: 3,
    members: [
      {
        id: 'voter-101',
        name: 'Ramesh Kumar Sharma (Head)',
        relation: 'Self',
        age: 52,
        gender: 'Male',
        epicNo: 'RJ14829102',
        mobile: '+919829012345',
        isVoted: true,
        supportingParty: 'Party A',
      },
      {
        id: 'voter-102',
        name: 'Sunita Sharma',
        relation: 'Wife',
        age: 48,
        gender: 'Female',
        epicNo: 'RJ14829103',
        mobile: '+919829012346',
        isVoted: true,
        supportingParty: 'Party A',
      },
      {
        id: 'voter-103',
        name: 'Pankaj Sharma',
        relation: 'Son',
        age: 24,
        gender: 'Male',
        epicNo: 'RJ14829104',
        mobile: '+919829012347',
        isVoted: false,
        supportingParty: 'Party A',
      },
    ],
  },
  {
    familyId: 'fam-02',
    headName: 'Mohammad Imran Khan',
    headMobile: '+919829055443',
    headEpic: 'RJ14930219',
    headPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    address: 'Shop 88, Ramganj Circle, Jaipur',
    totalMembers: 2,
    members: [
      {
        id: 'voter-104',
        name: 'Mohammad Imran Khan (Head)',
        relation: 'Self',
        age: 39,
        gender: 'Male',
        epicNo: 'RJ14930219',
        mobile: '+919829055443',
        isVoted: false,
        supportingParty: 'Party B',
      },
      {
        id: 'voter-104b',
        name: 'Fatima Imran Khan',
        relation: 'Wife',
        age: 35,
        gender: 'Female',
        epicNo: 'RJ14930220',
        mobile: '+919829055444',
        isVoted: false,
        supportingParty: 'Party B',
      },
    ],
  },
];

interface FamilyState {
  families: FamilyGroup[];
  searchQuery: string;
  loading: boolean;
}

const initialState: FamilyState = {
  families: DEMO_FAMILIES,
  searchQuery: '',
  loading: false,
};

const familyMappingReducer = (state = initialState, action: any): FamilyState => {
  switch (action.type) {
    case SET_FAMILY_LOADING:
      return { ...state, loading: action.payload };
    case SET_FAMILY_HEADS:
      return { ...state, families: action.payload, loading: false };
    default:
      return state;
  }
};

export default familyMappingReducer;
