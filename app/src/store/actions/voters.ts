import {
  Voter,
  ADD_NEW_VOTER,
  SET_VOTERS_LIST,
  APPEND_VOTERS_LIST,
  SET_VOTER_FILTERS,
  UPDATE_VOTER_PARTY,
  SET_VOTERS_LOADING,
  SET_VOTERS_LOADING_MORE,
  SET_VOTERS_PAGINATION,
  TOGGLE_VOTED_STATUS,
  UPDATE_VOTER_DETAILS,
  VoterPagination,
} from "../reducers/voters";
import { Dispatch } from "redux";
import { RootState } from "../store";
import toast from "../../utils/toast";
import apiClient from "../../api/apiClient";

export interface FetchVotersOptions {
  page?: number;
  limit?: number;
  isLoadMore?: boolean;
}

export const fetchVotersAction = (
  pageOrOptions: number | FetchVotersOptions = 1,
  isLoadMore: boolean = false,
  customLimit?: number
) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const options: FetchVotersOptions =
      typeof pageOrOptions === 'object' && pageOrOptions !== null
        ? pageOrOptions
        : { page: pageOrOptions, isLoadMore, limit: customLimit };

    const targetPage = Math.max(1, options.page ?? 1);
    const loadMore = Boolean(options.isLoadMore);

    if (loadMore) {
      dispatch({ type: SET_VOTERS_LOADING_MORE, payload: true });
    } else {
      dispatch({ type: SET_VOTERS_LOADING, payload: true });
    }

    try {
      const { filters, pagination } = getState().voters;
      const targetLimit = options.limit || pagination?.limit || 25;

      const params: any = {
        page: targetPage,
        limit: targetLimit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.boothNo && filters.boothNo !== 'All') params.boothId = filters.boothNo;
      if (filters.acId && filters.acId !== 'All') params.acId = filters.acId;
      if (filters.supportingParty && filters.supportingParty !== 'All') params.partyId = filters.supportingParty;
      if (filters.voterType && filters.voterType !== 'All') params.voterType = filters.voterType;
      if (filters.isVoted && filters.isVoted !== 'all') {
        params.status = filters.isVoted;
        params.isVoted = filters.isVoted;
      }
      if (filters.gender && filters.gender !== 'all') params.gender = filters.gender;
      if (filters.ageGroup) params.ageGroup = filters.ageGroup;
      if (filters.isDead !== undefined && filters.isDead !== '' && filters.isDead !== 'all') params.isDead = filters.isDead;
      if (filters.influencerRole && filters.influencerRole !== 'all') {
        params.influencerRole = filters.influencerRole;
        if (filters.influencerRole === 'family') params.isFamilyInfluencer = true;
        if (filters.influencerRole === 'social') params.isSocialInfluencer = true;
      }

      const response = await apiClient.get('/mobile/voters', { params });
      const apiData = response?.data?.data?.voters || response?.data?.voters || [];
      const apiPagination = response?.data?.data?.pagination || response?.data?.pagination;

      const mappedVoters: Voter[] = apiData.map((item: any) => ({
        id: item.id,
        name: [item.firstName, item.middleName, item.surname].filter(Boolean).join(' ') || item.engFirstName || 'Voter',
        hindiName: [item.firstName, item.middleName, item.surname].filter(Boolean).join(' '),
        englishName: [item.engFirstName, item.engMiddleName, item.engSurname].filter(Boolean).join(' '),
        relativeName: item.relativeName || item.fatherName || item.husbandName || '',
        age: item.age || 0,
        gender: item.gender || 'Male',
        epicNo: item.epicNo || '',
        mobile: item.mobileNo || item.mobile || '',
        image: item.avatar || item.image || '',
        pcName: item.pcName || '',
        acName: item.acName || '',
        wardNo: item.wardNo || (item.sectionNo ? `Ward ${item.sectionNo}` : ''),
        boothNo: item.boothName || (item.boothNumber ? `Booth #${item.boothNumber}` : ''),
        serialNo: item.serialNo || 0,
        address: item.fullAddress || item.voterAddress || item.houseNo || '',
        supportingParty: item.partyName || item.partyAbbreviation || item.voterType || 'Undecided',
        politicalView: item.voterType || 'Pending',
        isVoted: item.status === 'Voted' || Boolean(item.isVoted),
        isFamilyHead: Boolean(item.isFamilyInfluencer),
        familyId: item.familyId || undefined,
      }));

      const total = apiPagination?.total ?? (loadMore ? (pagination?.total || 0) : mappedVoters.length);
      const totalPages = apiPagination?.totalPages !== undefined
        ? apiPagination.totalPages
        : (total === 0 ? 0 : Math.ceil(total / targetLimit));
      const currentPage = apiPagination?.page ?? targetPage;
      const hasMore = total > 0 && currentPage < totalPages;

      dispatch({
        type: SET_VOTERS_PAGINATION,
        payload: {
          page: currentPage,
          limit: targetLimit,
          total,
          totalPages,
          hasMore,
        },
      });

      if (loadMore) {
        dispatch({ type: APPEND_VOTERS_LIST, payload: mappedVoters });
      } else {
        dispatch({ type: SET_VOTERS_LIST, payload: mappedVoters });
      }
    } catch (e: any) {
      console.error('Fetch voters failed:', e);
      toast.error(e?.response?.data?.message || "Failed to load voters directory.");
      if (!loadMore) {
        dispatch({ type: SET_VOTERS_LIST, payload: [] });
      }
    } finally {
      if (loadMore) {
        dispatch({ type: SET_VOTERS_LOADING_MORE, payload: false });
      } else {
        dispatch({ type: SET_VOTERS_LOADING, payload: false });
      }
    }
  };
};

export const loadMoreVotersAction = () => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const { pagination, loading, loadingMore, voters } = getState().voters;
    if (
      loading ||
      loadingMore ||
      !pagination?.hasMore ||
      !voters ||
      voters.length === 0 ||
      pagination.total === 0 ||
      pagination.page >= pagination.totalPages
    ) {
      return;
    }
    (fetchVotersAction(pagination.page + 1, true) as any)(dispatch, getState);
  };
};

export const setVoterFiltersAction = (filters: any) => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    dispatch({
      type: SET_VOTER_FILTERS,
      payload: filters,
    });
    (fetchVotersAction(1, false) as any)(dispatch, getState);
  };
};

export const toggleVotedStatusAction = (voterId: string, currentIsVoted?: boolean) => {
  return async (dispatch: Dispatch) => {
    try {
      const newStatus = currentIsVoted !== undefined ? !currentIsVoted : true;
      await apiClient.put(`/mobile/voters/${voterId}`, {
        status: newStatus ? 'Voted' : 'Not Voted',
        isDead: false,
      });
      dispatch({ type: TOGGLE_VOTED_STATUS, payload: voterId });
      toast.success("Voted status updated");
    } catch (e: any) {
      console.error('Toggle voted status error:', e);
      toast.error(e?.response?.data?.message || "Failed to update voted status.");
    }
  };
};

export const updateVoterPartyAction = (voterId: string, party: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await apiClient.put(`/mobile/voters/${voterId}`, {
        voterType: party,
      });
      dispatch({ type: UPDATE_VOTER_PARTY, payload: { voterId, party } });
      toast.success(`Supporting party updated to ${party}`);
    } catch (e: any) {
      console.error('Update voter party error:', e);
      toast.error(e?.response?.data?.message || "Failed to update supporting party.");
    }
  };
};

export const addVoterAction = (newVoter: Partial<Voter>, onSuccess?: () => void) => {
  return async (dispatch: Dispatch) => {
    try {
      const payload: any = {
        firstName: newVoter.name || newVoter.hindiName,
        engFirstName: newVoter.englishName || newVoter.name,
        epicNo: newVoter.epicNo,
        mobileNo: newVoter.mobile,
        gender: newVoter.gender || 'Male',
        age: newVoter.age || 18,
        voterType: newVoter.supportingParty || 'Favorable',
      };
      const response = await apiClient.put(`/mobile/voters/new`, payload);
      dispatch({ type: ADD_NEW_VOTER, payload: response?.data?.data || newVoter });
      toast.success("Voter added successfully!");
      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.error('Add voter error:', e);
      toast.error(e?.response?.data?.message || "Failed to add voter.");
    }
  };
};

export const updateVoterAction = (voterData: Partial<Voter>, onSuccess?: () => void) => {
  return async (dispatch: Dispatch) => {
    try {
      if (!voterData.id) return;
      const payload: any = {};
      if (voterData.mobile) payload.mobileNo = voterData.mobile;
      if (voterData.supportingParty) payload.voterType = voterData.supportingParty;
      if (voterData.gender) payload.gender = voterData.gender;
      if (voterData.age) payload.age = voterData.age;
      if (voterData.isVoted !== undefined) payload.status = voterData.isVoted ? 'Voted' : 'Not Voted';

      await apiClient.put(`/mobile/voters/${voterData.id}`, payload);
      dispatch({ type: UPDATE_VOTER_DETAILS, payload: voterData });
      toast.success("Voter info updated successfully!");
      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.error('Update voter error:', e);
      toast.error(e?.response?.data?.message || "Failed to update voter info.");
    }
  };
};
