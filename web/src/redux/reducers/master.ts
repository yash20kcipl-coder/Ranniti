import { SET_MASTER_TAB, SET_MASTER_DATA, SET_MASTER_LOADING, SET_MASTER_SEARCH, SET_MASTER_FETCHING } from '../actions/master';

export interface MasterState {
  activeTab: string;
  searchQuery: string;
  loading: boolean;
  loadedCategories: Record<string, boolean>;
  fetchingCategories: Record<string, boolean>;
  religions: any[];
  castes: any[];
  states: any[];
  districts: any[];
  talukas: any[];
  villages: any[];
  pcs: any[];
  acs: any[];
  wards: any[];
  parties: any[];
  booths: any[];
}

const initialState: MasterState = {
  activeTab: 'religions',
  searchQuery: '',
  loading: false,
  loadedCategories: {},
  fetchingCategories: {},
  religions: [],
  castes: [],
  states: [],
  districts: [],
  talukas: [],
  villages: [],
  pcs: [],
  acs: [],
  wards: [],
  parties: [],
  booths: [],
};

export default function masterreducers(state = initialState, action: any): MasterState {
  switch (action.type) {
    case SET_MASTER_TAB:
      return {
        ...state,
        activeTab: action.data,
      };
    case SET_MASTER_SEARCH:
      return {
        ...state,
        searchQuery: action.data,
      };
    case SET_MASTER_LOADING:
      return {
        ...state,
        loading: action.data,
      };
    case SET_MASTER_FETCHING:
      return {
        ...state,
        fetchingCategories: {
          ...state.fetchingCategories,
          [action.category]: action.isFetching,
        },
      };
    case SET_MASTER_DATA:
      return {
        ...state,
        [action.category]: action.items,
        loadedCategories: {
          ...state.loadedCategories,
          [action.category]: true,
        },
      };
    default:
      return state;
  }
}
