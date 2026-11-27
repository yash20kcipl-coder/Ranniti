import api from '@/services/api';
import toast from 'react-hot-toast';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export const SET_TENANT_WEB_USERS = 'SET_TENANT_WEB_USERS';
export const SET_TENANT_WEB_USERS_LOADING = 'SET_TENANT_WEB_USERS_LOADING';
export const ADD_TENANT_WEB_USER = 'ADD_TENANT_WEB_USER';
export const UPDATE_TENANT_WEB_USER = 'UPDATE_TENANT_WEB_USER';
export const DELETE_TENANT_WEB_USER = 'DELETE_TENANT_WEB_USER';

export interface WebUserRecord {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  avatar?: string;
  role: string;
  roleName?: string;
  status: string;
  accessibleTabs?: any;
  createdAt: string;
  updatedAt: string;
}

const toFormDataOrJson = (data: Record<string, any>) => {
  const hasFile = Object.values(data).some((val) => val instanceof File);
  if (!hasFile) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  return formData;
};

export const fetchTenantWebUsers = () => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: SET_TENANT_WEB_USERS_LOADING, payload: true });
    try {
      const res = await api.get('/tenant/users/web-users');
      const users = res.data?.data || res.data || [];
      dispatch({ type: SET_TENANT_WEB_USERS, payload: users });
      return users;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch({ type: SET_TENANT_WEB_USERS_LOADING, payload: false });
    }
  };
};

export const createTenantWebUser = (payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/tenant/users/web-users', toFormDataOrJson(payload));
      const user = res.data?.data || res.data;
      dispatch({ type: ADD_TENANT_WEB_USER, payload: user });
      toast.success('Web user created successfully');
      return user;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const updateTenantWebUser = (id: string, payload: Record<string, any>) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.put(`/tenant/users/web-users/${id}`, toFormDataOrJson(payload));
      const user = res.data?.data || res.data;
      dispatch({ type: UPDATE_TENANT_WEB_USER, payload: user });
      toast.success('Web user updated successfully');
      return user;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const deleteTenantWebUser = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await api.delete(`/tenant/users/web-users/${id}`);
      dispatch({ type: DELETE_TENANT_WEB_USER, payload: id });
      toast.success('Web user deleted successfully');
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

export const toggleTenantWebUserStatus = (id: string, requestedStatus?: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.patch(
        `/tenant/users/web-users/${id}/status`,
        requestedStatus ? { status: requestedStatus } : {}
      );
      const user = res.data?.data || res.data;
      dispatch({ type: UPDATE_TENANT_WEB_USER, payload: user });
      toast.success('User status updated');
      return user;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
