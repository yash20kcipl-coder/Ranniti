import api from '@/services/api';
import { Loading } from './loader';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import { startBulkImportJob } from './importJobs';
import { toFormDataOrJson } from '@/utils/formData';

export const SET_VOTERS_DATA = 'SET_VOTERS_DATA';
export const SET_VOTER_STATS = 'SET_VOTER_STATS';
export const SET_VOTER_FILTERS = 'SET_VOTER_FILTERS';
export const SET_VOTERS_LOADING = 'SET_VOTERS_LOADING';
export const SET_VOTERS_PAGINATION = 'SET_VOTERS_PAGINATION';

export const setVotersData = (voters: any[]) => ({
  type: SET_VOTERS_DATA,
  voters,
});

export const setVotersLoading = (loading: boolean) => ({
  type: SET_VOTERS_LOADING,
  loading,
});

export const setVotersPagination = (pagination: {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) => ({
  type: SET_VOTERS_PAGINATION,
  pagination,
});

export const setVoterStats = (stats: any) => ({
  type: SET_VOTER_STATS,
  stats,
});

export const setVoterFilters = (filters: Record<string, any>) => ({
  type: SET_VOTER_FILTERS,
  filters,
});

export const fetchVotersData = (params: Record<string, any> = {}, showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) {
      dispatch(setVotersLoading(true));
    }
    try {
      const res = await api.get('/voters', { params });
      const payload = res.data?.data || res.data || {};
      const voters = payload.voters || [];
      const pagination = payload.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 };

      dispatch(setVotersData(voters));
      dispatch(setVotersPagination(pagination));
      return payload;
    } catch (err) {
      if (showLoader) {
        dispatch(errorHandler(err));
      }
      dispatch(setVotersData([]));
      throw err;
    } finally {
      if (showLoader) {
        dispatch(setVotersLoading(false));
      }
    }
  };
};

export const fetchVoterStats = (params: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/voters/stats', { params });
      const stats = res.data?.data || res.data || {};
      dispatch(setVoterStats(stats));
      return stats;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const fetchVoterById = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.get(`/voters/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const createVoterItem = (payload: Record<string, any>, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      const res = await api.post('/voters', toFormDataOrJson(payload));
      const newVoter = res.data?.data || res.data;
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchVotersData(params, false));
      await dispatch(fetchVoterStats(params));
      return newVoter;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const updateVoterItem = (id: string, payload: Record<string, any>, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      const res = await api.put(`/voters/${id}`, toFormDataOrJson(payload));
      const updated = res.data?.data || res.data;
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchVotersData(params, false));
      await dispatch(fetchVoterStats(params));
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const deleteVoterItem = (id: string, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      await api.delete(`/voters/${id}`);
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchVotersData(params, false));
      await dispatch(fetchVoterStats(params));
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const importVotersData = (records: Record<string, any>[], _currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const job = await dispatch(startBulkImportJob('voters', records));
      return job;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const exportVotersData = (params: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.get('/voters/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `voters_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const fetchInfluencerOptions = (params: { search?: string; boothId?: string; excludeId?: string; type?: string }) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/voters/influencer-options', { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      dispatch(errorHandler(err));
      return [];
    }
  };
};

export const bulkAssignInfluencerAction = (payload: {
  influencerId: string | null;
  influencerType: 'family' | 'social';
  voterIds: string[];
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/voters/bulk-assign-influencer', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export interface FetchFamilyCandidatesParams {
  influencerId: string;
  boothId?: string;
  search?: string;
  houseNo?: string;
  sameHouseOnly?: boolean | string;
  sameSurnameOnly?: boolean | string;
  unassignedOnly?: boolean | string;
  sectionNo?: number | string;
  gender?: string;
  page?: number;
  limit?: number;
}

export const fetchFamilyCandidatesAction = (params: FetchFamilyCandidatesParams) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/voters/family-candidates', { params });
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export interface FetchSocialCandidatesParams {
  influencerId: string;
  boothId?: string;
  search?: string;
  sectionNo?: number | string;
  gender?: string;
  voterType?: string;
  casteId?: string;
  unassignedOnly?: boolean | string;
  page?: number;
  limit?: number;
}

export const fetchSocialCandidatesAction = (params: FetchSocialCandidatesParams) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/voters/social-candidates', { params });
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
