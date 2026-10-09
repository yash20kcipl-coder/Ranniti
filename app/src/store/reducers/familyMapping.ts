export const SET_FAMILY_HEADS = "SET_FAMILY_HEADS";
export const SET_FAMILY_MEMBERS = "SET_FAMILY_MEMBERS";
export const SET_FAMILY_LOADING = "SET_FAMILY_LOADING";

export interface FamilyGroup {
  familyId: string;
  headName: string;
  headMobile: string;
  headEpic: string;
  headPhoto?: string;
  address?: string;
  totalMembers: number;
  members: Array<{
    id: string;
    name: string;
    relation: string;
    age: number;
    gender: string;
    epicNo: string;
    mobile?: string;
    isVoted: boolean;
    supportingParty?: string;
  }>;
}

interface FamilyState {
  families: FamilyGroup[];
  totalFamilies: number;
  totalMembers: number;
  votedMembers: number;
  searchQuery: string;
  loading: boolean;
}

const initialState: FamilyState = {
  families: [],
  totalFamilies: 0,
  totalMembers: 0,
  votedMembers: 0,
  searchQuery: '',
  loading: false,
};

const familyMappingReducer = (state = initialState, action: any): FamilyState => {
  switch (action.type) {
    case SET_FAMILY_LOADING:
      return { ...state, loading: action.payload };
    case SET_FAMILY_HEADS: {
      let families: FamilyGroup[] = [];
      let totalFamilies = 0;

      if (Array.isArray(action.payload)) {
        families = action.payload;
        totalFamilies = families.length;
      } else if (action.payload && typeof action.payload === 'object') {
        families = action.payload.families || [];
        totalFamilies = action.payload.totalFamilies !== undefined ? action.payload.totalFamilies : families.length;
      }

      let totalMembers = 0;
      let votedMembers = 0;

      if (action.payload && typeof action.payload === 'object' && action.payload.totalMembers !== undefined) {
        totalMembers = Number(action.payload.totalMembers);
        votedMembers = Number(action.payload.votedMembers || 0);
      } else {
        families.forEach((fam) => {
          totalMembers += Number(fam.totalMembers || fam.members?.length || 0);
          (fam.members || []).forEach((mem) => {
            if (mem.isVoted) votedMembers++;
          });
        });
      }

      return {
        ...state,
        families,
        totalFamilies,
        totalMembers,
        votedMembers,
        loading: false,
      };
    }
    default:
      return state;
  }
};

export default familyMappingReducer;
