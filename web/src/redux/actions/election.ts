import type {
  Election,
  ElectionFilters,
  CreateElectionPayload,
  UpdateElectionPayload,
  BoothTurnoutItem,
  HourlyTurnoutItem,
} from '@/types/election.types';
import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export const SET_ELECTIONS_LOADING = 'SET_ELECTIONS_LOADING';
export const SET_ELECTIONS_DATA = 'SET_ELECTIONS_DATA';
export const SET_SELECTED_ELECTION = 'SET_SELECTED_ELECTION';
export const SET_DEFAULT_ELECTION = 'SET_DEFAULT_ELECTION';
export const SET_BOOTH_TURNOUT = 'SET_BOOTH_TURNOUT';
export const SET_HOURLY_TURNOUT = 'SET_HOURLY_TURNOUT';
export const SET_TURNOUT_LOADING = 'SET_TURNOUT_LOADING';
export const SET_ELECTIONS_ERROR = 'SET_ELECTIONS_ERROR';

export const setElectionsLoading = (loading: boolean) => ({
  type: SET_ELECTIONS_LOADING,
  payload: loading,
});

export const setElectionsData = (payload: {
  data: Election[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) => ({
  type: SET_ELECTIONS_DATA,
  payload,
});

export const setSelectedElection = (election: Election | null) => ({
  type: SET_SELECTED_ELECTION,
  payload: election,
});

export const setDefaultElection = (election: Election | null) => ({
  type: SET_DEFAULT_ELECTION,
  payload: election,
});

export const setBoothTurnout = (turnout: BoothTurnoutItem[]) => ({
  type: SET_BOOTH_TURNOUT,
  payload: turnout,
});

export const setHourlyTurnout = (hourly: HourlyTurnoutItem[]) => ({
  type: SET_HOURLY_TURNOUT,
  payload: hourly,
});

export const setTurnoutLoading = (loading: boolean) => ({
  type: SET_TURNOUT_LOADING,
  payload: loading,
});

export const setElectionsError = (error: string | null) => ({
  type: SET_ELECTIONS_ERROR,
  payload: error,
});

/**
 * Fetch paginated elections list
 */
export const fetchTenantElections = (filters: ElectionFilters = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setElectionsLoading(true));
    dispatch(setElectionsError(null));
    try {
      const res = await api.get('/tenant/elections', { params: filters });
      const payload = res.data?.data || res.data;
      dispatch(setElectionsData(payload));

      // Resolve and set default active election
      if (Array.isArray(payload.data)) {
        const def = payload.data.find((e: Election) => e.isDefault);
        if (def) {
          dispatch(setDefaultElection(def));
        } else if (payload.data.length > 0) {
          dispatch(setDefaultElection(payload.data[0]));
        }
      }

      return payload;
    } catch (err: any) {
      dispatch(errorHandler(err));
      dispatch(setElectionsError(err.message || 'Failed to fetch elections'));
      throw err;
    } finally {
      dispatch(setElectionsLoading(false));
    }
  };
};

/**
 * Fetch single election by ID
 */
export const fetchTenantElectionById = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get(`/tenant/elections/${id}`);
      const data = res.data?.data || res.data;
      dispatch(setSelectedElection(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Create a new election
 */
export const createTenantElection = (payload: CreateElectionPayload) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/tenant/elections', payload);
      const created = res.data?.data || res.data;
      dispatch(fetchTenantElections());
      return created;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Update existing election
 */
export const updateTenantElection = (id: string, payload: UpdateElectionPayload) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.put(`/tenant/elections/${id}`, payload);
      const updated = res.data?.data || res.data;
      dispatch(fetchTenantElections());
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Set target election as the single active/default campaign election
 */
export const setDefaultTenantElection = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.patch(`/tenant/elections/${id}/set-default`);
      const updated = res.data?.data || res.data;
      dispatch(setDefaultElection(updated));
      dispatch(fetchTenantElections());
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Automatically synchronize default election based on today's date hierarchy
 */
export const syncDefaultElectionByDate = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/tenant/elections/sync-default');
      const synced = res.data?.data || res.data;
      if (synced) {
        dispatch(setDefaultElection(synced));
      }
      dispatch(fetchTenantElections());
      return synced;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch current date-based default election
 */
export const fetchDefaultElection = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant/elections/default');
      const data = res.data?.data || res.data;
      if (data) {
        dispatch(setDefaultElection(data));
      }
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Delete election
 */
export const deleteTenantElection = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await api.delete(`/tenant/elections/${id}`);
      dispatch(fetchTenantElections());
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Record voter election status (Mark as Voted)
 */
export const recordVoterElectionStatus = (payload: {
  electionId: string;
  voterId: string;
  boothId?: string;
  hasVoted: boolean;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post(`/tenant/elections/${payload.electionId}/voter-status`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * High-throughput Batch Sync of voter statuses
 */
export const batchSyncVoterElectionStatus = (
  electionId: string,
  items: Array<{
    voterId: string;
    boothId?: string;
    hasVoted: boolean;
    votedAt?: string;
  }>
) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post(`/tenant/elections/${electionId}/voter-status/batch`, { items });
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch booth turnout stats
 */
export const fetchBoothTurnout = (electionId: string, boothId?: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setTurnoutLoading(true));
    try {
      const res = await api.get(`/tenant/elections/${electionId}/turnout`, {
        params: boothId ? { boothId } : undefined,
      });
      const data = res.data?.data || res.data;
      dispatch(setBoothTurnout(Array.isArray(data) ? data : []));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setTurnoutLoading(false));
    }
  };
};

/**
 * Fetch hourly turnout surge analytics
 */
export const fetchHourlyTurnout = (electionId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get(`/tenant/elections/${electionId}/analytics/hourly`);
      const data = res.data?.data || res.data;
      dispatch(setHourlyTurnout(Array.isArray(data) ? data : []));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
