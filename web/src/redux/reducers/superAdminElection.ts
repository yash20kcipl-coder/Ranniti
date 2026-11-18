import {
  SET_SA_ELECTIONS_LOADING,
  SET_SA_ELECTIONS_DATA,
  SET_SA_SELECTED_ELECTION,
  SET_SA_ELECTION_OPTIONS,
  SET_SA_ELECTIONS_ERROR,
} from '../actions/superAdminElection';
import type { SuperAdminElectionState } from '@/types/election.types';

const initialState: SuperAdminElectionState = {
  elections: [],
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 1,
  selectedElection: null,
  electionOptions: [],
  loading: false,
  error: null,
};

export default function superAdminElectionReducer(
  state = initialState,
  action: { type: string; payload?: any }
): SuperAdminElectionState {
  switch (action.type) {
    case SET_SA_ELECTIONS_LOADING:
      return { ...state, loading: action.payload };

    case SET_SA_ELECTIONS_DATA:
      return {
        ...state,
        elections: action.payload.data || [],
        total: action.payload.total || 0,
        page: action.payload.page || 1,
        limit: action.payload.limit || 25,
        totalPages: action.payload.totalPages || 1,
        loading: false,
        error: null,
      };

    case SET_SA_SELECTED_ELECTION:
      return { ...state, selectedElection: action.payload };

    case SET_SA_ELECTION_OPTIONS:
      return { ...state, electionOptions: action.payload || [] };

    case SET_SA_ELECTIONS_ERROR:
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}
