import { SET_INFLUENCERS_LIST, SET_INFLUENCERS_LOADING, SocialInfluencer } from "../reducers/influencers";
import { Dispatch } from "redux";
import apiClient from "../../api/apiClient";
import toast from "../../utils/toast";

export const fetchInfluencersAction = (params?: {
  search?: string;
  boothId?: string;
  boothIds?: string[];
  type?: 'all' | 'social' | 'family';
  page?: number;
  limit?: number;
}) => {
  return async (dispatch: Dispatch, getState: any) => {
    dispatch({ type: SET_INFLUENCERS_LOADING, payload: true });
    try {
      const state = getState();
      const userAssignedBoothIds = state?.auth?.user?.assignedBoothIds || [];
      const userRole = state?.auth?.user?.role;
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
        isInfluencer: true,
      };

      if (params?.search?.trim()) {
        queryParams.search = params.search.trim();
      }

      if (params?.type === 'social') {
        queryParams.isSocialInfluencer = true;
      } else if (params?.type === 'family') {
        queryParams.isFamilyInfluencer = true;
      }

      if (effectiveBoothIds && effectiveBoothIds.length > 0) {
        queryParams.boothIds = effectiveBoothIds.join(',');
      }

      const response = await apiClient.get('/mobile/voters', { params: queryParams });
      const rawVoters = response.data?.data?.voters || (Array.isArray(response.data?.data) ? response.data.data : []);
      const totalCount = Number(
        response.data?.data?.pagination?.total ?? response.data?.data?.total ?? rawVoters.length
      );

      const influencers: SocialInfluencer[] = (Array.isArray(rawVoters) ? rawVoters : []).map((v: any) => ({
        id: String(v.id),
        name: v.fullName || v.name || 'Unknown Influencer',
        profession: v.profession || v.professionType || 'Community Leader',
        mobile: v.mobileNumber || v.mobileNo || v.mobile || '',
        photo: v.photo || v.avatar || undefined,
        avatar: v.avatar || v.photo || undefined,
        supportingParty: v.partyName || v.supportingParty || 'Independent',
        influenceArea: v.socialInfluenceArea || v.address || v.boothName || `Booth #${v.boothNumber || '—'}`,
        isSocialInfluencer: Boolean(v.isSocialInfluencer),
        isFamilyInfluencer: Boolean(v.isFamilyInfluencer),
        influencedVotersCount: Number(v.influencedVoterCount || v.influencedVotersCount || (v.familyMembers ? v.familyMembers.length : 0)),
        influencedVoters: (v.familyMembers || v.influencedVoters || []).map((mem: any) => ({
          id: String(mem.id),
          name: mem.fullName || mem.name || 'Voter',
          epicNo: mem.epicNo || mem.epic_no || '—',
          mobile: mem.mobileNumber || mem.mobileNo || mem.mobile || '',
          boothNo: mem.boothNumber ? `Booth #${mem.boothNumber}` : (mem.boothNo || '—'),
          isVoted: Boolean(mem.isVoted || mem.voted),
        })),
      }));

      const socialCount = influencers.filter((i) => i.isSocialInfluencer).length;
      const familyCount = influencers.filter((i) => i.isFamilyInfluencer).length;

      dispatch({
        type: SET_INFLUENCERS_LIST,
        payload: {
          influencers,
          totalCount,
          socialCount,
          familyCount,
        },
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to fetch influencers';
      toast.error(msg);
      dispatch({
        type: SET_INFLUENCERS_LIST,
        payload: { influencers: [], totalCount: 0, socialCount: 0, familyCount: 0 },
      });
    } finally {
      dispatch({ type: SET_INFLUENCERS_LOADING, payload: false });
    }
  };
};
