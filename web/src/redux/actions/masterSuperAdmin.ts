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

const parseMasterData = (raw: any): any[] => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw.villages || raw.booths || raw.acs || raw.pcs || raw.wards || raw.talukas || raw.districts || raw.states || raw.castes || raw.religions || raw.parties || raw.records || raw.data || [];
  }
  return Array.isArray(raw) ? raw : [];
};

const getMasterEndpointData = async (endpoint: string, params?: Record<string, any>) => {
  const res = await api.get(endpoint, { params });
  const pagination = res.data?.pagination || (res.data?.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data) ? res.data.data.pagination : undefined);
  const raw = res.data?.data || res.data;
  const items = parseMasterData(raw);
  return { items, pagination };
};

// Generic Super Admin Master Category Data Thunk
export const fetchSuperAdminMasterCategoryData = (category: string, endpoint: string, showLoader = true, params?: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setMasterFetching(category, true));
    if (showLoader) {
      dispatch(setMasterLoading(true));
    }
    try {
      const { items, pagination } = await getMasterEndpointData(endpoint, params);
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

export const createSuperAdminMasterCategoryItem = (category: string, endpoint: string, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const createRes = await api.post(endpoint, toFormDataOrJson(payload));
      const result = createRes.data?.data || createRes.data;
      const { items, pagination } = await getMasterEndpointData(endpoint);
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

export const updateSuperAdminMasterCategoryItem = (category: string, endpoint: string, id: string | number, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const updateRes = await api.put(`${endpoint.replace(/\/$/, '')}/${id}`, toFormDataOrJson(payload));
      const result = updateRes.data?.data || updateRes.data;
      const { items, pagination } = await getMasterEndpointData(endpoint);
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

export const deleteSuperAdminMasterCategoryItem = (category: string, endpoint: string, id: string | number) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const deleteRes = await api.delete(`${endpoint.replace(/\/$/, '')}/${id}`);
      const result = deleteRes.data;
      const { items, pagination } = await getMasterEndpointData(endpoint);
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

export const syncAllSuperAdminMasters = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.post('/super-admin/masters/sync');
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

// ─── RELIGIONS ─────────────────────────────────────────────────────────────
export const fetchSuperAdminReligions = (showLoader = true) =>
  fetchSuperAdminMasterCategoryData('religions', '/super-admin/masters/religions', showLoader);

export const fetchSuperAdminReligionById = (id: string) => async (dispatch: AppDispatch) => {
  dispatch(Loading(true));
  try {
    const res = await api.get(`/super-admin/masters/religions/${id}`);
    return res.data?.data || res.data;
  } catch (err) {
    dispatch(errorHandler(err));
    throw err;
  } finally {
    dispatch(Loading(false));
  }
};

export const createSuperAdminReligion = (payload: { name: string }) =>
  createSuperAdminMasterCategoryItem('religions', '/super-admin/masters/religions', payload);

export const updateSuperAdminReligion = (id: string, payload: { name: string }) =>
  updateSuperAdminMasterCategoryItem('religions', '/super-admin/masters/religions', id, payload);

export const deleteSuperAdminReligion = (id: string) =>
  deleteSuperAdminMasterCategoryItem('religions', '/super-admin/masters/religions', id);

// ─── CASTES ────────────────────────────────────────────────────────────────
export const fetchSuperAdminCastes = (showLoader = true) =>
  fetchSuperAdminMasterCategoryData('castes', '/super-admin/masters/castes', showLoader);

export const createSuperAdminCaste = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('castes', '/super-admin/masters/castes', payload);

export const updateSuperAdminCaste = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('castes', '/super-admin/masters/castes', id, payload);

export const deleteSuperAdminCaste = (id: string) =>
  deleteSuperAdminMasterCategoryItem('castes', '/super-admin/masters/castes', id);

// ─── STATES ────────────────────────────────────────────────────────────────
export const fetchSuperAdminStates = (showLoader = true) =>
  fetchSuperAdminMasterCategoryData('states', '/super-admin/masters/states', showLoader);

export const createSuperAdminState = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('states', '/super-admin/masters/states', payload);

export const updateSuperAdminState = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('states', '/super-admin/masters/states', id, payload);

export const deleteSuperAdminState = (id: string) =>
  deleteSuperAdminMasterCategoryItem('states', '/super-admin/masters/states', id);

// ─── DISTRICTS ─────────────────────────────────────────────────────────────
export const fetchSuperAdminDistricts = (stateId?: string, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('districts', '/super-admin/masters/districts', showLoader, stateId ? { stateId } : undefined);

export const createSuperAdminDistrict = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('districts', '/super-admin/masters/districts', payload);

export const updateSuperAdminDistrict = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('districts', '/super-admin/masters/districts', id, payload);

export const deleteSuperAdminDistrict = (id: string) =>
  deleteSuperAdminMasterCategoryItem('districts', '/super-admin/masters/districts', id);

// ─── TALUKAS ───────────────────────────────────────────────────────────────
export const fetchSuperAdminTalukas = (params?: Record<string, any>, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('talukas', '/super-admin/masters/talukas', showLoader, params);

export const fetchSuperAdminTalukaById = (id: string) => async (dispatch: AppDispatch) => {
  dispatch(Loading(true));
  try {
    const res = await api.get(`/super-admin/masters/talukas/${id}`);
    return res.data?.data || res.data;
  } catch (err) {
    dispatch(errorHandler(err));
    throw err;
  } finally {
    dispatch(Loading(false));
  }
};

export const createSuperAdminTaluka = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('talukas', '/super-admin/masters/talukas', payload);

export const updateSuperAdminTaluka = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('talukas', '/super-admin/masters/talukas', id, payload);

export const deleteSuperAdminTaluka = (id: string) =>
  deleteSuperAdminMasterCategoryItem('talukas', '/super-admin/masters/talukas', id);

// ─── VILLAGES ──────────────────────────────────────────────────────────────
export const fetchSuperAdminVillages = (params?: Record<string, any>, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('villages', '/super-admin/masters/villages', showLoader, params);

export const fetchSuperAdminVillageById = (id: string) => async (dispatch: AppDispatch) => {
  dispatch(Loading(true));
  try {
    const res = await api.get(`/super-admin/masters/villages/${id}`);
    return res.data?.data || res.data;
  } catch (err) {
    dispatch(errorHandler(err));
    throw err;
  } finally {
    dispatch(Loading(false));
  }
};

export const createSuperAdminVillage = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('villages', '/super-admin/masters/villages', payload);

export const updateSuperAdminVillage = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('villages', '/super-admin/masters/villages', id, payload);

export const deleteSuperAdminVillage = (id: string) =>
  deleteSuperAdminMasterCategoryItem('villages', '/super-admin/masters/villages', id);

// ─── PARLIAMENTARY CONSTITUENCIES (PC) ────────────────────────────────────
export const fetchSuperAdminPcs = (stateId?: string, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('pcs', '/super-admin/masters/pcs', showLoader, stateId ? { stateId } : undefined);

export const createSuperAdminPc = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('pcs', '/super-admin/masters/pcs', payload);

export const updateSuperAdminPc = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('pcs', '/super-admin/masters/pcs', id, payload);

export const deleteSuperAdminPc = (id: string) =>
  deleteSuperAdminMasterCategoryItem('pcs', '/super-admin/masters/pcs', id);

// ─── ASSEMBLY CONSTITUENCIES (AC) ─────────────────────────────────────────
export const fetchSuperAdminAcs = (params?: Record<string, any>, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('acs', '/super-admin/masters/acs', showLoader, params);

export const createSuperAdminAc = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('acs', '/super-admin/masters/acs', payload);

export const updateSuperAdminAc = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('acs', '/super-admin/masters/acs', id, payload);

export const deleteSuperAdminAc = (id: string) =>
  deleteSuperAdminMasterCategoryItem('acs', '/super-admin/masters/acs', id);

// ─── WARDS ─────────────────────────────────────────────────────────────────
export const fetchSuperAdminWards = (acId?: string, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('wards', '/super-admin/masters/wards', showLoader, acId ? { acId } : undefined);

export const fetchSuperAdminWardById = (id: string) => async (dispatch: AppDispatch) => {
  dispatch(Loading(true));
  try {
    const res = await api.get(`/super-admin/masters/wards/${id}`);
    return res.data?.data || res.data;
  } catch (err) {
    dispatch(errorHandler(err));
    throw err;
  } finally {
    dispatch(Loading(false));
  }
};

export const createSuperAdminWard = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('wards', '/super-admin/masters/wards', payload);

export const updateSuperAdminWard = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('wards', '/super-admin/masters/wards', id, payload);

export const deleteSuperAdminWard = (id: string) =>
  deleteSuperAdminMasterCategoryItem('wards', '/super-admin/masters/wards', id);

// ─── PARTIES ───────────────────────────────────────────────────────────────
export const fetchSuperAdminParties = (showLoader = true) =>
  fetchSuperAdminMasterCategoryData('parties', '/super-admin/masters/parties', showLoader);

export const createSuperAdminParty = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('parties', '/super-admin/masters/parties', payload);

export const updateSuperAdminParty = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('parties', '/super-admin/masters/parties', id, payload);

export const deleteSuperAdminParty = (id: string) =>
  deleteSuperAdminMasterCategoryItem('parties', '/super-admin/masters/parties', id);

// ─── BOOTHS ────────────────────────────────────────────────────────────────
export const fetchSuperAdminBooths = (params?: Record<string, any>, showLoader = true) =>
  fetchSuperAdminMasterCategoryData('booths', '/super-admin/masters/booths', showLoader, params);

export const createSuperAdminBooth = (payload: Record<string, any>) =>
  createSuperAdminMasterCategoryItem('booths', '/super-admin/masters/booths', payload);

export const updateSuperAdminBooth = (id: string, payload: Record<string, any>) =>
  updateSuperAdminMasterCategoryItem('booths', '/super-admin/masters/booths', id, payload);

export const deleteSuperAdminBooth = (id: string) =>
  deleteSuperAdminMasterCategoryItem('booths', '/super-admin/masters/booths', id);

// ─── BULK UPLOAD DEMO SANDBOX ──────────────────────────────────────────────
export const fetchSuperAdminDemoRecords = (
  params?: { page?: number; limit?: number; search?: string; batchId?: string },
  showLoader = false
) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setMasterFetching('demoRecords', true));
    if (showLoader) {
      dispatch(setMasterLoading(true));
    }
    try {
      const res = await api.get('/super-admin/masters/bulk-import/demo/records', { params });
      const raw = res.data?.data || res.data;
      const pagination = raw?.pagination || res.data?.pagination;
      const items = parseMasterData(raw);
      dispatch(setMasterData('demoRecords', items, pagination));
      return { items, pagination };
    } catch (err) {
      if (showLoader) {
        dispatch(errorHandler(err));
      }
      throw err;
    } finally {
      dispatch(setMasterFetching('demoRecords', false));
      if (showLoader) {
        dispatch(setMasterLoading(false));
      }
    }
  };
};

export const purgeSuperAdminDemoRecords = (batchId?: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setMasterLoading(true));
    try {
      const res = await api.delete('/super-admin/masters/bulk-import/demo/purge', {
        params: batchId ? { batchId } : undefined,
      });
      // Refresh list
      const fetchRes = await api.get('/super-admin/masters/bulk-import/demo/records');
      const raw = fetchRes.data?.data || fetchRes.data;
      const pagination = raw?.pagination || fetchRes.data?.pagination;
      const items = parseMasterData(raw);
      dispatch(setMasterData('demoRecords', items, pagination));
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setMasterLoading(false));
    }
  };
};

export const downloadSuperAdminDemoBenchmarkFile = (count = 1000, includeInvalid = true) => {
  return async () => {
    const res = await api.get('/super-admin/masters/bulk-import/demo/benchmark-file', {
      params: { count, includeInvalid },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `demo_bulk_benchmark_${count}_rows.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return res;
  };
};
