import type {
  SuperAdminElection,
  SuperAdminElectionOption,
  CreateSuperAdminElectionPayload,
  UpdateSuperAdminElectionPayload,
  ElectionFilters,
} from '@/types/election.types';
import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export const SET_SA_ELECTIONS_LOADING = 'SET_SA_ELECTIONS_LOADING';
export const SET_SA_ELECTIONS_DATA = 'SET_SA_ELECTIONS_DATA';
export const SET_SA_SELECTED_ELECTION = 'SET_SA_SELECTED_ELECTION';
export const SET_SA_ELECTION_OPTIONS = 'SET_SA_ELECTION_OPTIONS';
export const SET_SA_ELECTIONS_ERROR = 'SET_SA_ELECTIONS_ERROR';

export const setSaElectionsLoading = (loading: boolean) => ({
  type: SET_SA_ELECTIONS_LOADING,
  payload: loading,
});

export const setSaElectionsData = (payload: {
  data: SuperAdminElection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) => ({
  type: SET_SA_ELECTIONS_DATA,
  payload,
});

export const setSaSelectedElection = (election: SuperAdminElection | null) => ({
  type: SET_SA_SELECTED_ELECTION,
  payload: election,
});

export const setSaElectionOptions = (options: SuperAdminElectionOption[]) => ({
  type: SET_SA_ELECTION_OPTIONS,
  payload: options,
});

export const setSaElectionsError = (error: string | null) => ({
  type: SET_SA_ELECTIONS_ERROR,
  payload: error,
});

/**
 * Fetch paginated list of master elections with search & filters
 */
export const fetchSuperAdminElections = (filters: ElectionFilters = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSaElectionsLoading(true));
    dispatch(setSaElectionsError(null));
    try {
      const res = await api.get('/super-admin/elections', { params: filters });
      const payload = res.data?.data || {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      dispatch(setSaElectionsData(payload));
      return payload;
    } catch (err: any) {
      dispatch(setSaElectionsError(err.message || 'Failed to fetch master elections'));
      errorHandler(err, dispatch);
      throw err;
    } finally {
      dispatch(setSaElectionsLoading(false));
    }
  };
};

/**
 * Fetch lightweight options for dropdowns
 */
export const fetchSuperAdminElectionOptions = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/super-admin/elections/options');
      const options = res.data?.data || [];
      dispatch(setSaElectionOptions(options));
      return options;
    } catch (err: any) {
      errorHandler(err, dispatch);
      return [];
    }
  };
};

/**
 * Fetch single master election by ID
 */
export const fetchSuperAdminElectionById = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSaElectionsLoading(true));
    try {
      const res = await api.get(`/super-admin/elections/${id}`);
      const election = res.data?.data || null;
      dispatch(setSaSelectedElection(election));
      return election;
    } catch (err: any) {
      errorHandler(err, dispatch);
      throw err;
    } finally {
      dispatch(setSaElectionsLoading(false));
    }
  };
};

/**
 * Create a new master election
 */
export const createSuperAdminElection = (payload: CreateSuperAdminElectionPayload) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSaElectionsLoading(true));
    try {
      const res = await api.post('/super-admin/elections', payload);
      const created = res.data?.data;
      dispatch(fetchSuperAdminElections({ page: 1, limit: 25 }));
      return created;
    } catch (err: any) {
      errorHandler(err, dispatch);
      throw err;
    } finally {
      dispatch(setSaElectionsLoading(false));
    }
  };
};

/**
 * Update existing master election
 */
export const updateSuperAdminElection = (id: string, payload: UpdateSuperAdminElectionPayload) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSaElectionsLoading(true));
    try {
      const res = await api.put(`/super-admin/elections/${id}`, payload);
      const updated = res.data?.data;
      dispatch(fetchSuperAdminElections({ page: 1, limit: 25 }));
      return updated;
    } catch (err: any) {
      errorHandler(err, dispatch);
      throw err;
    } finally {
      dispatch(setSaElectionsLoading(false));
    }
  };
};

/**
 * Delete master election
 */
export const deleteSuperAdminElection = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setSaElectionsLoading(true));
    try {
      await api.delete(`/super-admin/elections/${id}`);
      dispatch(fetchSuperAdminElections({ page: 1, limit: 25 }));
    } catch (err: any) {
      errorHandler(err, dispatch);
      throw err;
    } finally {
      dispatch(setSaElectionsLoading(false));
    }
  };
};

/**
 * Assign election to one or more tenants
 */
export const assignElectionToTenants = (electionId: string, tenantIds: string[]) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post(`/super-admin/elections/${electionId}/assign`, { tenantIds });
      dispatch(fetchSuperAdminElections({ page: 1, limit: 25 }));
      return res.data?.data;
    } catch (err: any) {
      errorHandler(err, dispatch);
      throw err;
    }
  };
};

/**
 * Unassign election from tenant
 */
export const unassignElectionFromTenant = (electionId: string, tenantId: string, tenantDbName?: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post(`/super-admin/elections/${electionId}/unassign`, { tenantId, tenantDbName });
      dispatch(fetchSuperAdminElections({ page: 1, limit: 25 }));
      return res.data?.data;
    } catch (err: any) {
      errorHandler(err, dispatch);
      throw err;
    }
  };
};
