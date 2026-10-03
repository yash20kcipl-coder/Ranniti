import api from '@/services/api';
import toast from 'react-hot-toast';
import { PageLoader } from './loader';
import { errorHandler } from '../apiUtils';
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
  permissions?: Record<string, boolean>;
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

export const Logout = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(PageLoader(true));
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

