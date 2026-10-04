import api from '@/services/api';
import { toFormDataOrJson } from '@/utils/formData';
import type { AppDispatch } from '../store';
import {
  SET_VOLUNTEERS,
  SET_VOLUNTEER_COVERAGE,
  ADD_VOLUNTEER,
  UPDATE_VOLUNTEER,
  DELETE_VOLUNTEER,
  SET_VOLUNTEER_LOADING,
  SET_LAST_CREATED_CREDENTIALS,
  CLEAR_LAST_CREATED_CREDENTIALS,
  type VolunteerRecord,
} from '../reducers/volunteer';

export const setVolunteerLoading = (loading: boolean) => ({
  type: SET_VOLUNTEER_LOADING,
  payload: loading,
});

export const clearLastCreatedCredentials = () => ({
  type: CLEAR_LAST_CREATED_CREDENTIALS,
});

export const fetchTenantVolunteers = (filters: {
  role?: string;
  search?: string;
  status?: string;
  acId?: string;
} = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setVolunteerLoading(true));
    try {
      const res = await api.get('/tenant/users/volunteers', { params: filters });
      const data = res.data?.data || [];
      dispatch({ type: SET_VOLUNTEERS, payload: data });
      return data;
    } catch (err: any) {
      dispatch({ type: SET_VOLUNTEERS, payload: [] });
      throw err;
    } finally {
      dispatch(setVolunteerLoading(false));
    }
  };
};

export const fetchVolunteerBoothCoverage = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/tenant/users/volunteers/coverage');
      const data = res.data?.data || null;
      if (data) {
        dispatch({ type: SET_VOLUNTEER_COVERAGE, payload: data });
      }
      return data;
    } catch {
      // Keep previous coverage on error
    }
  };
};

export const createTenantVolunteer = (data: {
  name: string;
  mobile: string;
  email?: string;
  password?: string;
  role: string;
  roleName?: string;
  avatar?: File | string | null;
  parentLeaderId?: string | null;
  assignedAcId?: string | null;
  assignedBoothIds?: string[];
}) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setVolunteerLoading(true));
    try {
      const res = await api.post('/tenant/users', toFormDataOrJson(data));
      const created: VolunteerRecord & { generatedDefaultPassword?: string } = res.data?.data || res.data;
      dispatch({ type: ADD_VOLUNTEER, payload: created });

      if (created.generatedDefaultPassword) {
        dispatch({
          type: SET_LAST_CREATED_CREDENTIALS,
          payload: {
            name: created.name,
            mobile: created.mobile || data.mobile,
            defaultPassword: created.generatedDefaultPassword,
          },
        });
      }

      // Refresh coverage stats
      dispatch(fetchVolunteerBoothCoverage());
      return created;
    } finally {
      dispatch(setVolunteerLoading(false));
    }
  };
};

export const updateTenantVolunteer = (
  id: string,
  data: Partial<VolunteerRecord> & { assignedBoothIds?: string[] }
) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setVolunteerLoading(true));
    try {
      const res = await api.put(`/tenant/users/${id}`, toFormDataOrJson(data));
      const updated = res.data?.data || res.data;
      dispatch({ type: UPDATE_VOLUNTEER, payload: updated });
      dispatch(fetchVolunteerBoothCoverage());
      return updated;
    } finally {
      dispatch(setVolunteerLoading(false));
    }
  };
};

export const deleteTenantVolunteer = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setVolunteerLoading(true));
    try {
      await api.delete(`/tenant/users/${id}`);
      dispatch({ type: DELETE_VOLUNTEER, payload: id });
      dispatch(fetchVolunteerBoothCoverage());
    } finally {
      dispatch(setVolunteerLoading(false));
    }
  };
};
