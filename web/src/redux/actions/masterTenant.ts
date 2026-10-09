import api from '@/services/api';
import { Loading } from './loader';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import { toFormDataOrJson } from '@/utils/formData';
export const SET_MASTER_TAB = 'SET_MASTER_TAB';
export const SET_MASTER_DATA = 'SET_MASTER_DATA';
export const SET_MASTER_SEARCH = 'SET_MASTER_SEARCH';
export const SET_MASTER_LOADING = 'SET_MASTER_LOADING';
export const SET_MASTER_FETCHING = 'SET_MASTER_FETCHING';

export const setMasterTab = (tab: string) => ({
  type: SET_MASTER_TAB,
  data: tab,
});

export const setMasterSearch = (query: string) => ({
  type: SET_MASTER_SEARCH,
  data: query,
});

export const setMasterData = (category: string, items: any[], pagination?: any) => ({
  type: SET_MASTER_DATA,
  category,
  items,
  pagination,
});

export const setMasterLoading = (loading: boolean) => ({
  type: SET_MASTER_LOADING,
  data: loading,
});

export const setMasterFetching = (category: string, isFetching: boolean) => ({
  type: SET_MASTER_FETCHING,
  category,
  isFetching,
});

const parseTenantMasterData = (raw: any): any[] => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw.villages || raw.booths || raw.acs || raw.pcs || raw.wards || raw.talukas || raw.districts || raw.states || raw.castes || raw.religions || raw.parties || raw.data || [];
  }
  return Array.isArray(raw) ? raw : [];
};

const getTenantEndpointData = async (endpoint: string, params?: Record<string, any>) => {
  const res = await api.get(endpoint, { params });
  const pagination = res.data?.pagination || (res.data?.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data) ? res.data.data.pagination : undefined);
  const raw = res.data?.data || res.data;
  const items = parseTenantMasterData(raw);
  return { items, pagination };
};

// Generic Tenant Master Category Data Thunk
export const fetchTenantMasterCategoryData = (category: string, endpoint: string, showLoader = true, params?: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setMasterFetching(category, true));
    if (showLoader) {
      dispatch(setMasterLoading(true));
    }
    try {
      const { items, pagination } = await getTenantEndpointData(endpoint, params);
      dispatch(setMasterData(category, items, pagination));
      return { items, pagination };
    } catch (err) {
      if (showLoader) {
        dispatch(errorHandler(err));
      }
      dispatch(setMasterData(category, [], undefined));
      throw err;
    } finally {
      dispatch(setMasterFetching(category, false));
      if (showLoader) {
        dispatch(setMasterLoading(false));
      }
    }
  };
};

export const createTenantMasterCategoryItem = (category: string, endpoint: string, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const createRes = await api.post(endpoint, toFormDataOrJson(payload));
      const result = createRes.data?.data || createRes.data;
      const { items, pagination } = await getTenantEndpointData(endpoint);
      dispatch(setMasterData(category, items, pagination));
      return result;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const updateTenantMasterCategoryItem = (category: string, endpoint: string, id: string | number, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const updateRes = await api.put(`${endpoint.replace(/\/$/, '')}/${id}`, toFormDataOrJson(payload));
      const result = updateRes.data?.data || updateRes.data;
      const { items, pagination } = await getTenantEndpointData(endpoint);
      dispatch(setMasterData(category, items, pagination));
      return result;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

export const deleteTenantMasterCategoryItem = (category: string, endpoint: string, id: string | number) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const deleteRes = await api.delete(`${endpoint.replace(/\/$/, '')}/${id}`);
      const result = deleteRes.data;
      const { items, pagination } = await getTenantEndpointData(endpoint);
      dispatch(setMasterData(category, items, pagination));
      return result;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

// ─── RELIGIONS ─────────────────────────────────────────────────────────────
export const fetchTenantReligions = (showLoader = true) =>
  fetchTenantMasterCategoryData('religions', '/tenant/geography/religions', showLoader);

// ─── CASTES ────────────────────────────────────────────────────────────────
export const fetchTenantCastes = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('castes', '/tenant/geography/castes', showLoader, params);

export const createTenantCaste = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('castes', '/tenant/geography/castes', payload);

// ─── STATES ────────────────────────────────────────────────────────────────
export const fetchTenantStates = (showLoader = true) =>
  fetchTenantMasterCategoryData('states', '/tenant/geography/states', showLoader);

// ─── DISTRICTS ─────────────────────────────────────────────────────────────
export const fetchTenantDistricts = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('districts', '/tenant/geography/districts', showLoader, params);

// ─── TALUKAS ───────────────────────────────────────────────────────────────
export const fetchTenantTalukas = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('talukas', '/tenant/geography/talukas', showLoader, params);

export const createTenantTaluka = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('talukas', '/tenant/geography/talukas', payload);

// ─── VILLAGES ──────────────────────────────────────────────────────────────
export const fetchTenantVillages = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('villages', '/tenant/geography/villages', showLoader, params);

export const createTenantVillage = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('villages', '/tenant/geography/villages', payload);

// ─── PARLIAMENTARY CONSTITUENCIES (PC) ────────────────────────────────────
export const fetchTenantPcs = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('pcs', '/tenant/geography/pcs', showLoader, params);

// ─── ASSEMBLY CONSTITUENCIES (AC) ─────────────────────────────────────────
export const fetchTenantAcs = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('acs', '/tenant/geography/acs', showLoader, params);

export const createTenantAc = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('acs', '/tenant/geography/acs', payload);

export const updateTenantAc = (id: string, payload: Record<string, any>) =>
  updateTenantMasterCategoryItem('acs', '/tenant/geography/acs', id, payload);

export const deleteTenantAc = (id: string) =>
  deleteTenantMasterCategoryItem('acs', '/tenant/geography/acs', id);

// ─── WARDS ─────────────────────────────────────────────────────────────────
export const fetchTenantWards = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('wards', '/tenant/geography/wards', showLoader, params);

export const createTenantWard = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('wards', '/tenant/geography/wards', payload);

export const updateTenantWard = (id: string, payload: Record<string, any>) =>
  updateTenantMasterCategoryItem('wards', '/tenant/geography/wards', id, payload);

export const deleteTenantWard = (id: string) =>
  deleteTenantMasterCategoryItem('wards', '/tenant/geography/wards', id);

// ─── PARTIES ───────────────────────────────────────────────────────────────
export const fetchTenantParties = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('parties', '/tenant/geography/parties', showLoader, params);

export const createTenantParty = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('parties', '/tenant/geography/parties', payload);

// ─── BOOTHS ────────────────────────────────────────────────────────────────
export const fetchTenantBooths = (params?: Record<string, any>, showLoader = true) =>
  fetchTenantMasterCategoryData('booths', '/tenant/geography/booths', showLoader, params);

export const createTenantBooth = (payload: Record<string, any>) =>
  createTenantMasterCategoryItem('booths', '/tenant/geography/booths', payload);

export const updateTenantBooth = (id: string, payload: Record<string, any>) =>
  updateTenantMasterCategoryItem('booths', '/tenant/geography/booths', id, payload);

export const deleteTenantBooth = (id: string) =>
  deleteTenantMasterCategoryItem('booths', '/tenant/geography/booths', id);
