import {
  SET_TEAM_MEMBERS,
  ADD_TEAM_MEMBER,
  UPDATE_TEAM_MEMBER,
  DELETE_TEAM_MEMBER,
  SET_TEAM_LOADING,
  SET_CREATABLE_ROLES,
  SET_CREATABLE_ROLES_LOADING,
  SET_TEAM_SUBMITTING,
  TeamMember,
} from "../reducers/team";
import { Dispatch } from "redux";
import toast from "../../utils/toast";
import apiClient from "../../api/apiClient";

export const fetchTeamMembersAction = (params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_TEAM_LOADING, payload: true });
    try {
      const response = await apiClient.get('/mobile/team', { params });
      const data = response.data?.data;
      dispatch({
        type: SET_TEAM_MEMBERS,
        payload: {
          members: data?.teamMembers || [],
          pagination: data?.pagination || {
            total: 0,
            page: 1,
            limit: 25,
            totalPages: 1,
          },
        },
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to load team members';
      toast.error(msg);
      dispatch({
        type: SET_TEAM_MEMBERS,
        payload: {
          members: [],
          pagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
        },
      });
    } finally {
      dispatch({ type: SET_TEAM_LOADING, payload: false });
    }
  };
};

export const fetchCreatableRolesAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_CREATABLE_ROLES_LOADING, payload: true });
    try {
      const response = await apiClient.get('/mobile/roles', {
        params: { creatableOnly: true },
      });
      const roles = response.data?.data || [];
      dispatch({ type: SET_CREATABLE_ROLES, payload: roles });
      return roles;
    } catch (error: any) {
      dispatch({ type: SET_CREATABLE_ROLES, payload: [] });
      return [];
    } finally {
      dispatch({ type: SET_CREATABLE_ROLES_LOADING, payload: false });
    }
  };
};

export const onboardTeamMemberAction = (
  memberData: {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    role: string;
    parentLeaderId?: string;
    assignedAcId?: string;
    assignedBoothIds?: string[];
    accessibleTabs?: any;
  },
  onSuccess?: (createdMember?: TeamMember) => void
) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_TEAM_SUBMITTING, payload: true });
    try {
      const response = await apiClient.post('/mobile/team', memberData);
      const createdMember: TeamMember = response.data?.data;
      dispatch({ type: ADD_TEAM_MEMBER, payload: createdMember });
      toast.success(`${createdMember.name || 'Member'} onboarded successfully!`);
      if (onSuccess) onSuccess(createdMember);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to onboard team member';
      toast.error(msg);
    } finally {
      dispatch({ type: SET_TEAM_SUBMITTING, payload: false });
    }
  };
};

export const updateTeamMemberAction = (
  memberId: string,
  memberData: {
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    role?: string;
    status?: string;
    parentLeaderId?: string;
    assignedAcId?: string;
    assignedBoothIds?: string[];
    accessibleTabs?: any;
  },
  onSuccess?: (updatedMember?: TeamMember) => void
) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_TEAM_SUBMITTING, payload: true });
    try {
      const response = await apiClient.put(`/mobile/team/${memberId}`, memberData);
      const updatedMember: TeamMember = response.data?.data;
      dispatch({ type: UPDATE_TEAM_MEMBER, payload: updatedMember });
      toast.success(`${updatedMember.name || 'Member'} updated successfully!`);
      if (onSuccess) onSuccess(updatedMember);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update team member';
      toast.error(msg);
    } finally {
      dispatch({ type: SET_TEAM_SUBMITTING, payload: false });
    }
  };
};

export const deleteTeamMemberAction = (
  memberId: string,
  onSuccess?: () => void
) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_TEAM_SUBMITTING, payload: true });
    try {
      await apiClient.delete(`/mobile/team/${memberId}`);
      dispatch({ type: DELETE_TEAM_MEMBER, payload: memberId });
      toast.success('Team member removed successfully!');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to remove team member';
      toast.error(msg);
    } finally {
      dispatch({ type: SET_TEAM_SUBMITTING, payload: false });
    }
  };
};

