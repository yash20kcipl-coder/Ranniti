import { SET_MASTER_TAB, SET_MASTER_DATA, SET_MASTER_LOADING, SET_MASTER_SEARCH, SET_MASTER_FETCHING } from '../actions/masterSuperAdmin';

export interface MasterState {
  activeTab: string;
  searchQuery: string;
  loading: boolean;
  loadedCategories: Record<string, boolean>;
  fetchingCategories: Record<string, boolean>;
  pagination: Record<string, { total: number; page: number; limit: number; totalPages: number }>;
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
  demoRecords: any[];
}

const initialState: MasterState = {
  activeTab: 'religions',
  searchQuery: '',
  loading: false,
  loadedCategories: {},
  fetchingCategories: {},
  pagination: {},
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
  demoRecords: [],
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
    case SET_MASTER_DATA: {
      const existingPag = state.pagination?.[action.category] || { page: 1, limit: 25, total: 0, totalPages: 1 };
      const fallbackTotal = Array.isArray(action.items) ? action.items.length : existingPag.total;
      const fallbackLimit = existingPag.limit || 25;
      const fallbackPages = Math.max(1, Math.ceil(fallbackTotal / fallbackLimit));

      const finalPagination = action.pagination || {
        ...existingPag,
        total: fallbackTotal,
        totalPages: fallbackPages,
      };

      return {
        ...state,
        [action.category]: action.items,
        pagination: {
          ...state.pagination,
          [action.category]: finalPagination,
        },
        loadedCategories: {
          ...state.loadedCategories,
          [action.category]: true,
        },
      };
    }
    default:
      return state;
  }
}
