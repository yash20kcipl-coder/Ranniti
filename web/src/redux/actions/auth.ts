import api from '@/services/api';
import toast from 'react-hot-toast';
import { PageLoader } from './loader';
import { errorHandler } from '../apiUtils';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { AppDispatch } from '../store';

export const Log_Out = 'Log_Out';
export const MY_PROFILE = 'MY_PROFILE';
export const SET_TOKEN = 'SET_TOKEN';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName?: string | null;
  mobile?: string;
  avatar?: string;
  organizationId?: string | null;
  organizationName?: string | null;
  tenantDbName?: string | null;
  isImpersonated?: boolean;
  permissions?: Record<string, boolean>;
  /** Tenant-scoped master sub-tabs the user's Role Package allows (e.g. ['acs', 'wards', 'booths']) */
  allowedMasterSubTabs?: string[];
  /** Tenant web tabs the user's Role Package allows */
  allowedWebTabs?: string[];
  /** Flag indicating whether the tenant is permitted to create web portal login users */
  canCreateWebUsers?: boolean;
}


export const loginUser = (credentials: LoginCredentials) => {
  return async (dispatch: AppDispatch) => {
    dispatch(PageLoader(true));
    try {
      const res = await api.post('/auth/login', credentials);
      const resData = res.data?.data || res.data;
      const token = resData.token;
      const user = resData.user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({ type: SET_TOKEN, data: token });
      dispatch({ type: MY_PROFILE, data: user });

      toast.success('Welcome back to Ranniti Admin Portal!');
      return resData;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(PageLoader(false));
    }
  };
};

export const saveLogin = (token: string, user: UserProfile, message?: string) => {
  return async (dispatch: AppDispatch) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: SET_TOKEN, data: token });
    dispatch({ type: MY_PROFILE, data: user });
    if (message) {
      toast.success(message);
    }
  };
};

export const setUser = (user: UserProfile | null) => ({
  type: MY_PROFILE,
  data: user,
});

export const refreshMyProfile = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get(API_ENDPOINTS.AUTH.ME);
      const freshUser = res.data?.data || res.data;
      if (freshUser && freshUser.id) {
        const existingRaw = localStorage.getItem('user');
        let existingUser: Partial<UserProfile> | null = null;
        if (existingRaw) {
          try {
            existingUser = JSON.parse(existingRaw);
          } catch {
            existingUser = null;
          }
        }
        const mergedUser: UserProfile = {
          ...freshUser,
          ...(existingUser?.isImpersonated ? { isImpersonated: true } : {}),
        };
        localStorage.setItem('user', JSON.stringify(mergedUser));
        dispatch({ type: MY_PROFILE, data: mergedUser });
      }
    } catch {
      // Silent background sync; 401/auth errors are handled by the API interceptor
    }
  };
};

export const Logout = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(PageLoader(true));
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('super_admin_impersonator_token');
      localStorage.removeItem('super_admin_impersonator_user');
      dispatch({ type: Log_Out, data: true });
      dispatch({ type: MY_PROFILE, data: null });
      dispatch({ type: SET_TOKEN, data: null });
      toast.success('Signed out successfully');
    } catch (err) {
      dispatch(errorHandler(err));
    } finally {
      dispatch(PageLoader(false));
    }
  };
};

export const logout = Logout;

