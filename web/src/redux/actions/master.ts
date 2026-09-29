import api from '@/services/api';
import { Loading } from './loader';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import { toFormDataOrJson } from '@/utils/formData';

export const SET_MASTER_TAB = 'SET_MASTER_TAB';
export const SET_MASTER_DATA = 'SET_MASTER_DATA';
export const SET_MASTER_LOADING = 'SET_MASTER_LOADING';
export const SET_MASTER_SEARCH = 'SET_MASTER_SEARCH';

export const setMasterTab = (tab: string) => ({
  type: SET_MASTER_TAB,
  data: tab,
});

export const setMasterSearch = (query: string) => ({
  type: SET_MASTER_SEARCH,
  data: query,
});

export const setMasterData = (category: string, items: any[]) => ({
  type: SET_MASTER_DATA,
  category,
  items,
});

export const setMasterLoading = (loading: boolean) => ({
  type: SET_MASTER_LOADING,
  data: loading,
});

const getMasterData = async (endpoint: string) => {
  const res = await api.get(endpoint);
  return res.data?.data || res.data || [];
};

export const fetchMasterCategoryData = (category: string, endpoint: string, showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) {
      dispatch(setMasterLoading(true));
    }
    try {
      const data = await getMasterData(endpoint);
      dispatch(setMasterData(category, Array.isArray(data) ? data : []));
      return data;
    } catch (err) {
      if (showLoader) {
        dispatch(errorHandler(err));
      }
      dispatch(setMasterData(category, []));
      throw err;
    } finally {
      if (showLoader) {
        dispatch(setMasterLoading(false));
      }
    }
  };
};

export const createMasterCategoryItem = (category: string, endpoint: string, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const createRes = await api.post(endpoint, toFormDataOrJson(payload));
      const result = createRes.data?.data || createRes.data;
      const updatedData = await getMasterData(endpoint);
      dispatch(setMasterData(category, Array.isArray(updatedData) ? updatedData : []));
      return result;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const updateMasterCategoryItem = (category: string, endpoint: string, id: string | number, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const updateRes = await api.put(`${endpoint.replace(/\/$/, '')}/${id}`, toFormDataOrJson(payload));
      const result = updateRes.data?.data || updateRes.data;
      const updatedData = await getMasterData(endpoint);
      dispatch(setMasterData(category, Array.isArray(updatedData) ? updatedData : []));
      return result;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const deleteMasterCategoryItem = (category: string, endpoint: string, id: string | number) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const deleteRes = await api.delete(`${endpoint.replace(/\/$/, '')}/${id}`);
      const result = deleteRes.data;
      const updatedData = await getMasterData(endpoint);
      dispatch(setMasterData(category, Array.isArray(updatedData) ? updatedData : []));
      return result;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const syncAllMasters = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.post('/master/sync');
      return res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};
