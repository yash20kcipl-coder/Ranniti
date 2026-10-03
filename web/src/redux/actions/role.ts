import api from '@/services/api';
import type { AppDispatch } from '../store';
import {
  SET_TENANT_ROLES,
  ADD_TENANT_ROLE,
  UPDATE_TENANT_ROLE,
  DELETE_TENANT_ROLE,
  SET_DEFAULT_TENANT_ROLE,
  SET_TENANT_USER_ROLES,
  ADD_TENANT_USER_ROLE,
  UPDATE_TENANT_USER_ROLE,
  DELETE_TENANT_USER_ROLE,
  SET_ROLE_LOADING,
  type TenantRolePackage,
  type TenantUserRole,
} from '../reducers/role';

export const setRoleLoading = (loading: boolean) => ({
  type: SET_ROLE_LOADING,
  payload: loading,
});

/**
 * Super Admin: Fetch all Tenant Role Packages
 */
export const fetchTenantRolePackages = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      const res = await api.get('/super-admin/tenant-roles');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        dispatch({ type: SET_TENANT_ROLES, payload: data });
      }
      return data;
    } catch (err) {
      // In UI phase preview, retain default state if API is not yet live
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};

/**
 * Super Admin: Create or update Tenant Role Package
 */
export const saveTenantRolePackage = (payload: Partial<TenantRolePackage>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      if (payload.id && !payload.id.startsWith('tr-')) {
        const res = await api.put(`/super-admin/tenant-roles/${payload.id}`, payload);
        const updated = res.data?.data || res.data || payload;
        dispatch({ type: UPDATE_TENANT_ROLE, payload: updated });
        return updated;
      } else {
        const res = await api.post('/super-admin/tenant-roles', payload).catch(() => null);
        const saved = res?.data?.data || res?.data || {
          ...payload,
          id: payload.id || `tr-${Date.now()}`,
          isActive: payload.isActive ?? true,
          tenantCount: 0,
        };
        if (payload.id) {
          dispatch({ type: UPDATE_TENANT_ROLE, payload: saved });
        } else {
          dispatch({ type: ADD_TENANT_ROLE, payload: saved });
        }
        return saved;
      }
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};

/**
 * Super Admin: Set default Tenant Role Package
 */
export const setDefaultTenantRolePackage = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      if (!id.startsWith('tr-')) {
        await api.patch(`/super-admin/tenant-roles/${id}/set-default`);
      }
      dispatch({ type: SET_DEFAULT_TENANT_ROLE, payload: id });
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};

/**
 * Super Admin: Delete Tenant Role Package
 */
export const deleteTenantRolePackage = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      if (!id.startsWith('tr-')) {
        await api.delete(`/super-admin/tenant-roles/${id}`);
      }
      dispatch({ type: DELETE_TENANT_ROLE, payload: id });
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};

/**
 * Tenant Admin: Fetch custom user roles
 */
export const fetchTenantUserRoles = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      const res = await api.get('/tenant/user-roles');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        dispatch({ type: SET_TENANT_USER_ROLES, payload: data });
      }
      return data;
    } catch (err) {
      // In UI phase preview, retain default state if API is not yet live
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};

/**
 * Tenant Admin: Save or update custom user role
 */
export const saveTenantUserRole = (payload: Partial<TenantUserRole>) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      if (payload.id && !payload.id.startsWith('tur-')) {
        const res = await api.put(`/tenant/user-roles/${payload.id}`, payload);
        const updated = res.data?.data || res.data || payload;
        dispatch({ type: UPDATE_TENANT_USER_ROLE, payload: updated });
        return updated;
      } else {
        const res = await api.post('/tenant/user-roles', payload).catch(() => null);
        const saved = res?.data?.data || res?.data || {
          ...payload,
          id: payload.id || `tur-${Date.now()}`,
          isSystemDefault: payload.isSystemDefault ?? false,
        };
        if (payload.id) {
          dispatch({ type: UPDATE_TENANT_USER_ROLE, payload: saved });
        } else {
          dispatch({ type: ADD_TENANT_USER_ROLE, payload: saved });
        }
        return saved;
      }
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};

/**
 * Tenant Admin: Delete custom user role
 */
export const deleteTenantUserRole = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setRoleLoading(true));
    try {
      if (!id.startsWith('tur-')) {
        await api.delete(`/tenant/user-roles/${id}`);
      }
      dispatch({ type: DELETE_TENANT_USER_ROLE, payload: id });
    } finally {
      dispatch(setRoleLoading(false));
    }
  };
};
