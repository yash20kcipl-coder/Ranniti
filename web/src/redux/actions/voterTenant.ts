import api from '@/services/api';
import { Loading } from './loader';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import { startBulkImportJob } from './importJobs';
import { toFormDataOrJson } from '@/utils/formData';
import {
  setVotersData,
  setVotersLoading,
  setVotersPagination,
  setVoterStats,
} from './voter';

export const fetchTenantVotersData = (params: Record<string, any> = {}, showLoader = true) => {
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

export const fetchTenantVoterStats = (params: Record<string, any> = {}) => {
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

export const fetchTenantVoterById = (id: string) => {
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

export const createTenantVoterItem = (payload: Record<string, any>, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      const res = await api.post('/voters', toFormDataOrJson(payload));
      const newVoter = res.data?.data || res.data;
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchTenantVotersData(params, false));
      await dispatch(fetchTenantVoterStats(params));
      return newVoter;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const updateTenantVoterItem = (id: string, payload: Record<string, any>, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      const res = await api.put(`/voters/${id}`, toFormDataOrJson(payload));
      const updated = res.data?.data || res.data;
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchTenantVotersData(params, false));
      await dispatch(fetchTenantVoterStats(params));
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const deleteTenantVoterItem = (id: string, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      await api.delete(`/voters/${id}`);
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchTenantVotersData(params, false));
      await dispatch(fetchTenantVoterStats(params));
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const importTenantVotersData = (records: Record<string, any>[], _currentParams: Record<string, any> = {}) => {
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

export const exportTenantVotersData = (params: Record<string, any> = {}) => {
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

export const fetchTenantInfluencerOptions = (params: { search?: string; boothId?: string; excludeId?: string; type?: string }) => {
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

export const bulkAssignTenantInfluencerAction = (payload: {
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

export const fetchFamilyCandidatesAction = (params: Record<string, any>) => {
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

export const fetchSocialCandidatesAction = (params: Record<string, any>) => {
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
