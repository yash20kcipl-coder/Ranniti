import toast from 'react-hot-toast';
import { Log_Out } from './actions/auth';
import type { AppDispatch } from './store';
import { Loading, PageLoader } from './actions/loader';

export const commonTimeout = 20000;
export const uploadTimeout = 60000;

export const extractErrorMessage = (data: any, defaultMessage = 'Something went wrong...'): string => {
  try {
    if (!data) return defaultMessage;
    if (typeof data === 'string') return data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      return typeof first === 'string' ? first : (first?.message || first?.error || defaultMessage);
    }

    if (typeof data?.errors === 'string') return data.errors;

    if (data?.errors && typeof data.errors === 'object') {
      const keys = Object.keys(data.errors);
      if (keys.length > 0) {
        const firstVal = data.errors[keys[0]];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          return firstVal[0];
        }
        if (typeof firstVal === 'string') {
          return firstVal;
        }
      }
    }

    return data?.detail || data?.message || data?.msg || data?.errorMessage || data?.title || data?.error || defaultMessage;
  } catch {
    return defaultMessage;
  }
};

export const errorHandler = (error: any, params?: any) => {
  return async (dispatch?: AppDispatch) => {
    const data = error?.response?.data || error?.data || {};
    const status = error?.response?.status || error?.status;

    try {
      const config = error?.config || error?.response?.config;
      const fullUrl = (config?.baseURL && config?.url && !config?.url?.startsWith('http'))
        ? `${config.baseURL.replace(/\/$/, '')}/${config.url.replace(/^\//, '')}`
        : (config?.url || error?.request?.responseURL || error?.request?._url || '');

      let requestData = config?.data;
      if (typeof requestData === 'string') {
        try {
          requestData = JSON.parse(requestData);
        } catch {
          // keep as string
        }
      }

      const queryParams = config?.params || params?.queryParams;
      const resolvedRequestData = requestData || params?.params || params?.data;

      const isNonEmpty = (val: any) => {
        if (val === undefined || val === null || val === '') return false;
        if (typeof val === 'object' && Object.keys(val).length === 0) return false;
        return true;
      };

      console.error('API Error =>', {
        ...(isNonEmpty(fullUrl) ? { fullUrl } : {}),
        ...(status ? { status } : {}),
        ...(config?.method ? { method: config.method.toUpperCase() } : {}),
        ...(isNonEmpty(queryParams) ? { queryParams } : {}),
        ...(isNonEmpty(resolvedRequestData) ? { requestData: resolvedRequestData } : {}),
        ...(isNonEmpty(data) ? { responseData: data } : {}),
        ...(isNonEmpty(params) ? { params } : {}),
      });
      console.error(error);
    } catch {
      console.error(error);
    }

    const isTimeout = error?.isTimeout || (
      params?.startTime && (new Date().getTime() - params.startTime) > (params?.timeout || commonTimeout)
    );

    if (dispatch) {
      dispatch(Loading(false));
      dispatch(PageLoader(false));
    }

    if (isTimeout) {
      toast.error('Request timed out. Please check your internet connection and try again.');
      return;
    }

    if (status === 401) {
      toast.error('Session expired. Please sign in to continue.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (dispatch) {
        dispatch({ type: Log_Out, data: true });
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return;
    }

    if (status === 413) {
      const message = extractErrorMessage(data, 'File size is too large. Please upload a smaller file.');
      toast.error(message);
      return;
    }

    if (status === 500) {
      const message = extractErrorMessage(data, "We're experiencing server issues. Please try again later.");
      toast.error(message);
      return;
    }

    const message = extractErrorMessage(data, 'Something went wrong...');
    if (message) {
      toast.error(message);
    }
  };
};
