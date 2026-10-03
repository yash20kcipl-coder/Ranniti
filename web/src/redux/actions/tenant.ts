import api from '@/services/api';
import { Loading } from './loader';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import { toFormDataOrJson } from '@/utils/formData';

export const ADD_TENANT_USER = 'ADD_TENANT_USER';
export const UPDATE_TENANT_USER = 'UPDATE_TENANT_USER';
export const UPDATE_TENANT_STATUS = 'UPDATE_TENANT_STATUS';
export const DELETE_TENANT_USER = 'DELETE_TENANT_USER';
export const SET_TENANTS_DATA = 'SET_TENANTS_DATA';
export const SET_TENANTS_LOADING = 'SET_TENANTS_LOADING';

export const setTenantsData = (tenants: any[]) => ({
  type: SET_TENANTS_DATA,
  payload: tenants,
});

export const setTenantsLoading = (loading: boolean) => ({
  type: SET_TENANTS_LOADING,
  payload: loading,
});

export const addTenantUser = (tenant: any) => ({
  type: ADD_TENANT_USER,
  payload: tenant,
});

export const updateTenantUserAction = (tenant: any) => ({
  type: UPDATE_TENANT_USER,
  payload: tenant,
});

export const updateTenantStatusAction = (id: string, status: string) => ({
  type: UPDATE_TENANT_STATUS,
  payload: { id, status },
});

export const deleteTenantUserAction = (id: string) => ({
  type: DELETE_TENANT_USER,
  payload: id,
});

/**
 * Fetch all tenant users from backend
 */
export const fetchTenantUsers = (showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setTenantsLoading(true));
    try {
      const res = await api.get('/super-admin/tenants');
      const data = res.data?.data || res.data || [];
      dispatch(setTenantsData(Array.isArray(data) ? data : []));
      return data;
    } catch (err) {
      if (showLoader) dispatch(errorHandler(err));
      throw err;
    } finally {
      if (showLoader) dispatch(setTenantsLoading(false));
    }
  };
};

/**
 * Fetch single tenant user by ID
 */
export const fetchTenantById = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.get(`/super-admin/tenants/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

/**
 * Provision a new tenant user account
 */
export const provisionTenantUser = (payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.post('/super-admin/tenants/provision', toFormDataOrJson(payload));
      const newTenant = res.data?.data || res.data;
      dispatch(addTenantUser(newTenant));
      dispatch(fetchTenantUsers(false));
      return newTenant;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

/**
 * Fetch real-time provisioning status & progress for a tenant
 */
export const fetchTenantProvisioningStatus = (id: string) => {
  return async () => {
    try {
      const res = await api.get(`/super-admin/tenants/${id}/provisioning-status`);
      return res.data?.data || res.data;
    } catch (err) {
      // Silent error handler for polling
      return null;
    }
  };
};

/**
 * Update tenant user account
 */
export const updateTenantUser = (id: string, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.put(`/super-admin/tenants/${id}`, toFormDataOrJson(payload));
      const updated = res.data?.data || res.data;
      dispatch(updateTenantUserAction(updated));
      dispatch(fetchTenantUsers(false));
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

/**
 * Toggle tenant account status (active, inactive, suspended)
 */
export const updateTenantStatus = (id: string, status: 'active' | 'inactive' | 'suspended') => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      const res = await api.patch(`/super-admin/tenants/${id}/status`, { status });
      const updated = res.data?.data || res.data;
      dispatch(updateTenantStatusAction(id, status));
      dispatch(fetchTenantUsers(false));
      return updated;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

/**
 * Delete tenant user account
 */
export const deleteTenantUser = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(Loading(true));
    try {
      await api.delete(`/super-admin/tenants/${id}`);
      dispatch(deleteTenantUserAction(id));
      return id;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(Loading(false));
    }
  };
};

/**
 * Fetch profile and assigned boundaries for logged-in tenant
 */
export const fetchTenantProfile = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant-data/profile');
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch campaign statistics directly from tenant's isolated database
 */
export const fetchTenantStats = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant-data/stats');
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch assigned constituencies (PCs & ACs) for tenant
 */
export const fetchTenantConstituencies = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant-data/constituencies');
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch polling booths in tenant's isolated database
 */
export const fetchTenantBooths = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant-data/booths');
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch tenant voters directly from dedicated tenant API endpoint (/tenant-api/voters)
 */
export const fetchTenantVotersData = (params: Record<string, any> = {}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant-api/voters', { params });
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};


