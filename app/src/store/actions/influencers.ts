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
        queryParams.socialInfluencerScope = 'any';
        queryParams.influencerRole = 'social';
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

      const influencers: SocialInfluencer[] = (Array.isArray(rawVoters) ? rawVoters : []).map((v: any) => {
        const englishName = [v.engFirstName, v.engMiddleName, v.engSurname].filter(Boolean).join(' ') || v.englishName || v.engName || '';
        const hindiName = [v.firstName, v.middleName, v.surname].filter(Boolean).join(' ') || v.hindiName || v.name || '';
        return {
          id: String(v.id),
          name: englishName || hindiName || v.fullName || 'Unknown Influencer',
          englishName: englishName || undefined,
          hindiName: hindiName || undefined,
          profession: v.profession || v.professionType || 'Community Leader',
          mobile: v.mobileNumber || v.mobileNo || v.mobile || '',
          photo: v.photo || v.avatar || undefined,
          avatar: v.avatar || v.photo || undefined,
          supportingParty: v.partyName || v.supportingParty || 'Independent',
          influenceArea: v.socialInfluenceArea || v.address || v.boothName || `Booth #${v.boothNumber || '—'}`,
          socialInfluencerScope: v.socialInfluencerScope || null,
          isFamilyInfluencer: Boolean(v.isFamilyInfluencer),
          influencedVotersCount: Number(v.influencedVoterCount || v.influencedVotersCount || (v.familyMembers ? v.familyMembers.length : 0)),
          influencedVoters: (v.familyMembers || v.influencedVoters || []).map((mem: any) => {
            const mEng = [mem.engFirstName, mem.engMiddleName, mem.engSurname].filter(Boolean).join(' ') || mem.englishName || mem.engName || '';
            const mHindi = [mem.firstName, mem.middleName, mem.surname].filter(Boolean).join(' ') || mem.hindiName || mem.name || '';
            return {
              id: String(mem.id),
              name: mEng || mHindi || mem.fullName || 'Voter',
              englishName: mEng || undefined,
              hindiName: mHindi || undefined,
              epicNo: mem.epicNo || mem.epic_no || '—',
              mobile: mem.mobileNumber || mem.mobileNo || mem.mobile || '',
              boothNo: mem.boothNumber ? `Booth #${mem.boothNumber}` : (mem.boothNo || '—'),
              isVoted: Boolean(mem.isVoted || mem.voted),
            };
          }),
        };
      });

      const socialCount = influencers.filter((i) => Boolean(i.socialInfluencerScope)).length;
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
