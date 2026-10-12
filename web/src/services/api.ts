import axios from 'axios';
import { API_BASE_URL } from '@/utils/baseUrl';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token, prevent double /api/v1 & handle FormData boundary
api.interceptors.request.use((config) => {
  // Strip duplicate /api/v1 if a caller specifies it since baseURL already includes /api/v1
  if (config.url) {
    if (config.url.startsWith('/api/v1/')) {
      config.url = config.url.replace(/^\/api\/v1/, '');
    } else if (config.url.startsWith('api/v1/')) {
      config.url = config.url.replace(/^api\/v1/, '');
    }
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData, delete explicit Content-Type so browser sets boundary automatically
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      }
    }
  }

  return config;
});

export default api;
