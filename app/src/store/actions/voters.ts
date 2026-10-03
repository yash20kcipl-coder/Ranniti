import {
  SET_VOTERS_LIST,
  SET_VOTER_FILTERS,
  TOGGLE_VOTED_STATUS,
  UPDATE_VOTER_PARTY,
  ADD_NEW_VOTER,
  UPDATE_VOTER_DETAILS,
  SET_VOTERS_LOADING,
  Voter,
  DEMO_VOTERS,
} from "../reducers/voters";
import toast from "../../utils/toast";
import { Dispatch } from "redux";

export const fetchVotersAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_VOTERS_LOADING, payload: true });
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
      dispatch({ type: SET_VOTERS_LIST, payload: DEMO_VOTERS });
    } catch (e) {
      toast.error("Failed to load voters directory.");
    } finally {
      dispatch({ type: SET_VOTERS_LOADING, payload: false });
    }
  };
};

export const setVoterFiltersAction = (filters: any) => {
  return {
    type: SET_VOTER_FILTERS,
    payload: filters,
  };
};

export const toggleVotedStatusAction = (voterId: string) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: TOGGLE_VOTED_STATUS, payload: voterId });
    toast.success("Voted status updated");
  };
};

export const updateVoterPartyAction = (voterId: string, party: string) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: UPDATE_VOTER_PARTY, payload: { voterId, party } });
    toast.success(`Supporting party updated to ${party}`);
  };
};

export const addVoterAction = (newVoter: Partial<Voter>, onSuccess?: () => void) => {
  return (dispatch: Dispatch) => {
    const voterRecord: Voter = {
      id: 'voter-' + Date.now(),
      name: newVoter.name || 'New Voter',
      relativeName: newVoter.relativeName || '',
      age: newVoter.age || 18,
      gender: newVoter.gender || 'Male',
      epicNo: newVoter.epicNo || 'RJ14' + Math.floor(100000 + Math.random() * 900000),
      mobile: newVoter.mobile || '+919829000000',
      image: newVoter.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      pcName: newVoter.pcName || 'Jaipur PC',
      acName: newVoter.acName || 'Hawa Mahal AC',
      wardNo: newVoter.wardNo || 'Ward 14',
      boothNo: newVoter.boothNo || 'Booth #12',
      serialNo: Math.floor(100 + Math.random() * 500),
      address: newVoter.address || 'Jaipur Central',
      supportingParty: newVoter.supportingParty || 'Undecided',
      politicalView: newVoter.politicalView || 'Pending',
      isVoted: false,
    };

    dispatch({ type: ADD_NEW_VOTER, payload: voterRecord });
    toast.success("Voter added successfully!");
    if (onSuccess) onSuccess();
  };
};

export const updateVoterAction = (voterData: Partial<Voter>, onSuccess?: () => void) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: UPDATE_VOTER_DETAILS, payload: voterData });
    toast.success("Voter info updated successfully!");
    if (onSuccess) onSuccess();
  };
};
