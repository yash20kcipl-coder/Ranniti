import {
  SET_VOTERS_LIST,
  SET_VOTER_FILTERS,
  TOGGLE_VOTED_STATUS,
  UPDATE_VOTER_PARTY,
  ADD_NEW_VOTER,
  UPDATE_VOTER_DETAILS,
  SET_VOTERS_LOADING,
  Voter,
} from "../reducers/voters";
import { Dispatch } from "redux";
import { RootState } from "../store";
import toast from "../../utils/toast";
import apiClient from "../../api/apiClient";

export const fetchVotersAction = () => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch({ type: SET_VOTERS_LOADING, payload: true });
    try {
      const { filters } = getState().voters;
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.boothNo && filters.boothNo !== 'All') params.boothId = filters.boothNo;
      if (filters.supportingParty && filters.supportingParty !== 'All') params.voterType = filters.supportingParty;
      if (filters.isVoted && filters.isVoted !== 'all') params.status = filters.isVoted;
      if (filters.gender && filters.gender !== 'all') params.gender = filters.gender;

      const response = await apiClient.get('/mobile/voters', { params });
      const apiData = response?.data?.data?.voters || response?.data?.voters || [];

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
        supportingParty: item.voterType || item.partyName || 'Undecided',
        politicalView: item.voterType || 'Pending',
        isVoted: item.status === 'Voted' || Boolean(item.isVoted),
        isFamilyHead: Boolean(item.isFamilyInfluencer),
        familyId: item.familyId || undefined,
      }));

      dispatch({ type: SET_VOTERS_LIST, payload: mappedVoters });
    } catch (e: any) {
      console.error('Fetch voters failed:', e);
      toast.error(e?.response?.data?.message || "Failed to load voters directory.");
      dispatch({ type: SET_VOTERS_LIST, payload: [] });
    } finally {
      dispatch({ type: SET_VOTERS_LOADING, payload: false });
    }
  };
};

export const setVoterFiltersAction = (filters: any) => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    dispatch({
      type: SET_VOTER_FILTERS,
      payload: filters,
    });
    (fetchVotersAction() as any)(dispatch, getState);
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
