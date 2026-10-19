import {
  SET_ELECTIONS_LOADING,
  SET_ELECTIONS_DATA,
  SET_SELECTED_ELECTION,
  SET_DEFAULT_ELECTION,
  SET_BOOTH_TURNOUT,
  SET_HOURLY_TURNOUT,
  SET_TURNOUT_LOADING,
  SET_ELECTIONS_ERROR,
} from '../actions/election';
import type { ElectionState } from '@/types/election.types';

const initialState: ElectionState = {
  elections: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  selectedElection: null,
  defaultElection: null,
  boothTurnout: [],
  hourlyTurnout: [],
  loading: false,
  turnoutLoading: false,
  error: null,
};

export default function electionReducer(
  state: ElectionState = initialState,
  action: { type: string; payload?: any }
): ElectionState {
  switch (action.type) {
    case SET_ELECTIONS_LOADING:
      return { ...state, loading: action.payload };

    case SET_ELECTIONS_DATA:
      return {
        ...state,
        elections: action.payload.data || [],
        total: action.payload.total || 0,
        page: action.payload.page || 1,
        limit: action.payload.limit || 20,
        totalPages: action.payload.totalPages || 1,
        loading: false,
        error: null,
      };

    case SET_SELECTED_ELECTION:
      return { ...state, selectedElection: action.payload };

    case SET_DEFAULT_ELECTION:
      return { ...state, defaultElection: action.payload };

    case SET_BOOTH_TURNOUT:
      return { ...state, boothTurnout: action.payload || [] };

    case SET_HOURLY_TURNOUT:
      return { ...state, hourlyTurnout: action.payload || [] };

    case SET_TURNOUT_LOADING:
      return { ...state, turnoutLoading: action.payload };

    case SET_ELECTIONS_ERROR:
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}
