import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export const SET_FAMILIES_DATA = 'SET_FAMILIES_DATA';
export const SET_FAMILIES_LOADING = 'SET_FAMILIES_LOADING';
export const SET_FAMILIES_PAGINATION = 'SET_FAMILIES_PAGINATION';
export const SET_SELECTED_FAMILY = 'SET_SELECTED_FAMILY';
export const SET_FAMILY_MAPPING_LOADING = 'SET_FAMILY_MAPPING_LOADING';

export const setFamiliesData = (families: any[]) => ({
  type: SET_FAMILIES_DATA,
  families,
});

export const setFamiliesLoading = (loading: boolean) => ({
  type: SET_FAMILIES_LOADING,
  loading,
});

export const setFamiliesPagination = (pagination: {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) => ({
  type: SET_FAMILIES_PAGINATION,
  pagination,
});

export const setSelectedFamily = (familyDetails: any) => ({
  type: SET_SELECTED_FAMILY,
  familyDetails,
});

export const setFamilyMappingLoading = (loading: boolean) => ({
  type: SET_FAMILY_MAPPING_LOADING,
  loading,
});

/**
 * Fetch paginated list of families with aggregated support summaries
 */
export const fetchFamiliesAction = (params: Record<string, any> = {}, showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) {
      dispatch(setFamiliesLoading(true));
    }
    try {
      const res = await api.get('/tenant/voters/family-mapping/families', { params });
      const payload = res.data?.data || res.data || {};
      const families = payload.families || [];
      const pagination = payload.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

      dispatch(setFamiliesData(families));
      dispatch(setFamiliesPagination(pagination));
      return payload;
    } catch (err) {
      if (showLoader) {
        dispatch(errorHandler(err));
      }
      throw err;
    } finally {
      if (showLoader) {
        dispatch(setFamiliesLoading(false));
      }
    }
  };
};

/**
 * Fetch all members of a family given the Head of Family ID
 */
export const fetchFamilyMembersAction = (headId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get(`/tenant/voters/family-mapping/families/${headId}`);
      const data = res.data?.data || res.data;
      dispatch(setSelectedFamily(data));
      return data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Run Auto-Mapping algorithm on a polling booth (dryRun or execution)
 */
export const autoMapFamiliesAction = (payload: { boothId: string; dryRun?: boolean }) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setFamilyMappingLoading(true));
    try {
      const res = await api.post('/tenant/voters/family-mapping/auto-group', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    } finally {
      dispatch(setFamilyMappingLoading(false));
    }
  };
};

/**
 * Transfer Head of Family role to another member
 */
export const setNewFamilyHeadAction = (payload: { currentHeadId: string; newHeadId: string }) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.post('/tenant/voters/family-mapping/set-head', payload);
      return res.data?.data || res.data;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
