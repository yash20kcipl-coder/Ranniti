import {
  setVotersData,
  setVotersLoading,
  setVotersPagination,
  setVoterStats,
  setVoterBoothOptions,
  setVoterBoothOptionsLoading,
} from './voter';
import api from '@/services/api';
import { Loading } from './loader';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import { startBulkImportJob } from './importJobs';
import { toFormDataOrJson } from '@/utils/formData';

export const fetchSuperAdminVotersData = (params: Record<string, any> = {}, showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) {
      dispatch(setVotersLoading(true));
    }
    try {
      const res = await api.get('/super-admin/voters', { params });
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

export const fetchSuperAdminVoterStats = (params: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/super-admin/voters/stats', { params });
      const stats = res.data?.data || res.data || {};
      dispatch(setVoterStats(stats));
      return stats;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const fetchSuperAdminVoterById = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.get(`/super-admin/voters/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const createSuperAdminVoterItem = (payload: Record<string, any>, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      const res = await api.post('/super-admin/voters', toFormDataOrJson(payload));
      const newVoter = res.data?.data || res.data;
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchSuperAdminVotersData(params, false));
      await dispatch(fetchSuperAdminVoterStats(params));
      return newVoter;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const updateSuperAdminVoterItem = (id: string, payload: Record<string, any>, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      const res = await api.put(`/super-admin/voters/${id}`, toFormDataOrJson(payload));
      const updated = res.data?.data || res.data;
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchSuperAdminVotersData(params, false));
      await dispatch(fetchSuperAdminVoterStats(params));
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const deleteSuperAdminVoterItem = (id: string, currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch, getState: () => any) => {
    dispatch(Loading(true));
    try {
      await api.delete(`/super-admin/voters/${id}`);
      const params = Object.keys(currentParams).length > 0 ? currentParams : getState()?.voter?.filters || {};
      await dispatch(fetchSuperAdminVotersData(params, false));
      await dispatch(fetchSuperAdminVoterStats(params));
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const importSuperAdminVotersData = (records: Record<string, any>[], currentParams: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const job = await dispatch(
        startBulkImportJob('voters', records, () => {
          dispatch(fetchSuperAdminVotersData(currentParams, false)).catch(() => { });
          dispatch(fetchSuperAdminVoterStats(currentParams)).catch(() => { });
        })
      );
      return job;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const exportSuperAdminVotersData = (params: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.get('/super-admin/voters/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `super_admin_voters_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

export const fetchSuperAdminInfluencerOptions = (params: { search?: string; boothId?: string; excludeId?: string; type?: string }) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/super-admin/voters/influencer-options', { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      dispatch(errorHandler(err));
      return [];
    }
  };
};

export const bulkAssignSuperAdminInfluencerAction = (payload: {
  influencerId: string | null;
  influencerType: 'family' | 'social';
  voterIds: string[];
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/super-admin/voters/bulk-assign-influencer', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const fetchSuperAdminBoothOptions = (params: {
  acId?: string;
  wardId?: string;
  search?: string;
  limit?: number;
  saveToStore?: boolean;
}) => {
  return async (dispatch: AppDispatch) => {
    const shouldSave = params.saveToStore !== false;
    if (shouldSave) dispatch(setVoterBoothOptionsLoading(true));
    try {
      const res = await api.get('/super-admin/masters/booths/options', { params });
      const options = res.data?.data || res.data || [];
      if (shouldSave) dispatch(setVoterBoothOptions(options));
      return options;
    } catch (err) {
      dispatch(errorHandler(err));
      if (shouldSave) dispatch(setVoterBoothOptions([]));
      return [];
    } finally {
      if (shouldSave) dispatch(setVoterBoothOptionsLoading(false));
    }
  };
};
