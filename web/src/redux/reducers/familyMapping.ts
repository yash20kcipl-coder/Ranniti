import {
  SET_FAMILIES_DATA,
  SET_FAMILIES_LOADING,
  SET_FAMILIES_PAGINATION,
  SET_SELECTED_FAMILY,
  SET_FAMILY_MAPPING_LOADING,
} from '../actions/familyMapping';

export interface FamilyMappingState {
  loading: boolean;
  mappingLoading: boolean;
  families: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  selectedFamily: {
    head: any | null;
    members: any[];
    summary: {
      familyId: string;
      totalMembers: number;
      supporters: number;
      neutral: number;
      opposition: number;
      influenceScore: number;
    } | null;
  } | null;
}

const initialState: FamilyMappingState = {
  loading: false,
  mappingLoading: false,
  families: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  selectedFamily: null,
};

export default function familyMappingReducer(
  state = initialState,
  action: any
): FamilyMappingState {
  switch (action.type) {
    case SET_FAMILIES_LOADING:
      return {
        ...state,
        loading: action.loading,
      };
    case SET_FAMILY_MAPPING_LOADING:
      return {
        ...state,
        mappingLoading: action.loading,
      };
    case SET_FAMILIES_DATA:
      return {
        ...state,
        families: action.families,
      };
    case SET_FAMILIES_PAGINATION:
      return {
        ...state,
        pagination: action.pagination,
      };
    case SET_SELECTED_FAMILY:
      return {
        ...state,
        selectedFamily: action.familyDetails,
      };
    default:
      return state;
  }
}
