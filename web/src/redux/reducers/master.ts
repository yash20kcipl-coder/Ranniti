import { SET_MASTER_TAB, SET_MASTER_DATA, SET_MASTER_LOADING, SET_MASTER_SEARCH } from '../actions/master';

export interface MasterState {
  activeTab: string;
  searchQuery: string;
  loading: boolean;
  religions: any[];
  castes: any[];
  states: any[];
  districts: any[];
  pcs: any[];
  acs: any[];
  parties: any[];
  booths: any[];
  organizations: any[];
}

const initialState: MasterState = {
  activeTab: 'religions',
  searchQuery: '',
  loading: false,
  religions: [],
  castes: [],
  states: [],
  districts: [],
  pcs: [],
  acs: [],
  parties: [],
  booths: [],
  organizations: [],
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
    case SET_MASTER_DATA:
      return {
        ...state,
        [action.category]: action.items,
      };
    default:
      return state;
  }
}
