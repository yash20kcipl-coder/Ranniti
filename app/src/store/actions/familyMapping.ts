import { Dispatch } from "redux";
import toast from '../../utils/toast';
import apiClient from '../../api/apiClient';
import { SET_FAMILY_HEADS, SET_FAMILY_LOADING } from "../reducers/familyMapping";

export const fetchFamilyHeadsAction = (params?: {
  search?: string;
  boothId?: string;
  boothIds?: string[];
  page?: number;
  limit?: number;
}) => {
  return async (dispatch: Dispatch, getState: any) => {
    dispatch({ type: SET_FAMILY_LOADING, payload: true });
    try {
      const state = getState();
      const user = state?.auth?.user;
      const userAssignedBoothIds = user?.assignedBoothIds || [];
      const userRole = user?.role;
      const isVolunteer = userRole === 'supporter' || userRole === 'sub_leader' || userRole === 'volunteer';

      let effectiveBoothIds = params?.boothIds;
      if (!effectiveBoothIds && params?.boothId) {
        effectiveBoothIds = [params.boothId];
      }
      if (isVolunteer && userAssignedBoothIds.length > 0 && (!effectiveBoothIds || effectiveBoothIds.length === 0)) {
        effectiveBoothIds = userAssignedBoothIds;
      }

      const queryParams: any = {
        limit: params?.limit || 50,
        page: params?.page || 1,
      };

      if (params?.search?.trim()) {
        queryParams.search = params.search.trim();
      }

      if (effectiveBoothIds && effectiveBoothIds.length > 0) {
        queryParams.boothIds = effectiveBoothIds.join(',');
        if (effectiveBoothIds.length === 1) {
          queryParams.boothId = effectiveBoothIds[0];
        }
      }

      const response = await apiClient.get('/mobile/family-mapping/families', {
        params: queryParams,
      });

      const rawFamilies = response.data?.data?.families || (Array.isArray(response.data?.data) ? response.data.data : []);
      const pagination = response.data?.data?.pagination;
      const totalFamilies = Number(
        pagination?.total ?? response.data?.data?.total ?? rawFamilies.length
      );
      const totalMembers = pagination?.totalMembers !== undefined ? Number(pagination.totalMembers) : undefined;
      const votedMembers = pagination?.votedMembers !== undefined ? Number(pagination.votedMembers) : undefined;

      dispatch({
        type: SET_FAMILY_HEADS,
        payload: { families: rawFamilies, totalFamilies, totalMembers, votedMembers },
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to fetch family mapping data';
      toast.error(msg);
      dispatch({ type: SET_FAMILY_HEADS, payload: { families: [], totalFamilies: 0, totalMembers: 0, votedMembers: 0 } });
    } finally {
      dispatch({ type: SET_FAMILY_LOADING, payload: false });
    }
  };
};
