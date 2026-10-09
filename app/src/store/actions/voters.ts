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

export const mapApiVoterToVoter = (item: any): Voter => {
  const hindiName = [item.firstName, item.middleName, item.surname].filter(Boolean).join(' ') || item.name || '';
  const englishName = [item.engFirstName, item.engMiddleName, item.engSurname].filter(Boolean).join(' ') || item.englishName || '';
  const fullName = englishName || hindiName || item.name || 'Voter';

  return {
    id: item.id,
    name: fullName,
    hindiName: hindiName || fullName,
    englishName: englishName || fullName,
    firstName: item.firstName,
    middleName: item.middleName,
    surname: item.surname,
    engFirstName: item.engFirstName,
    engMiddleName: item.engMiddleName,
    engSurname: item.engSurname,
    relativeName: item.guardianName || item.relativeName || item.fatherName || item.husbandName || '',
    relation: item.relation || '',
    guardianName: item.guardianName || item.relativeName || '',
    age: Number(item.age) || 0,
    dob: item.dob || '',
    gender: item.gender || 'Male',
    epicNo: item.epicNo || '',
    mobile: item.mobileNo || item.mobile || '',
    mobileNo: item.mobileNo || item.mobile || '',
    email: item.email || '',
    image: item.avatar || item.image || '',
    avatar: item.avatar || item.image || '',
    aadhaarNo: item.aadhaarNo || '',
    panNo: item.panNo || '',

    // Electoral Details
    pcName: item.pcName || '',
    acName: item.acName || '',
    wardNo: item.wardNo || (item.sectionNo ? `Ward ${item.sectionNo}` : ''),
    boothNo: item.boothName || (item.boothNumber ? `Booth #${item.boothNumber}` : (item.boothNo || '')),
    boothName: item.boothName || '',
    boothNumber: item.boothNumber,
    boothId: item.boothId || '',
    acId: item.acId || '',
    pcId: item.pcId || '',
    serialNo: Number(item.serialNo) || 0,
    sectionNo: item.sectionNo || '',
    houseNo: item.houseNo || '',

    // Location
    address: item.fullAddress || item.voterAddress || item.address || item.houseNo || '',
    fullAddress: item.fullAddress || item.voterAddress || item.address || '',
    voterAddress: item.voterAddress || '',
    taluka: item.taluka || '',
    village: item.village || '',
    districtName: item.districtName || '',
    stateName: item.stateName || '',

    // Socio-demographics
    casteName: item.casteName || '',
    subcasteName: item.subcasteName || '',
    religionName: item.religionName || '',
    bloodGroup: item.bloodGroup || '',
    professionType: item.professionType || '',
    profession: item.profession || '',

    // Political & Status
    voterType: item.voterType || '',
    supportingParty: item.partyName || item.partyAbbreviation || item.supportingParty || item.voterType || 'Undecided',
    partyName: item.partyName || '',
    partyAbbreviation: item.partyAbbreviation || '',
    partySymbol: item.partySymbol || '',
    politicalView: (item.politicalView || item.voterType || 'Pending') as any,
    status: item.status || (item.isVoted ? 'Voted' : 'Not Voted'),
    isVoted: item.status === 'Voted' || Boolean(item.isVoted),
    isDead: Boolean(item.isDead),
    isShifted: Boolean(item.isShifted),

    // Influencers & Family
    familyId: item.familyId || undefined,
    isFamilyHead: Boolean(item.isFamilyInfluencer) || Boolean(item.isFamilyHead),
    isFamilyInfluencer: Boolean(item.isFamilyInfluencer),
    familyInfluencerId: item.familyInfluencerId || undefined,
    familyInfluencerName: item.familyInfluencerName || '',
    familyInfluencedCount: Number(item.familyInfluencedCount) || 0,
    isSocialInfluencer: Boolean(item.isSocialInfluencer),
    socialInfluencerId: item.socialInfluencerId || undefined,
    socialInfluencerName: item.socialInfluencerName || '',
    socialInfluencerEpic: item.socialInfluencerEpic || '',
    socialInfluencedCount: Number(item.socialInfluencedCount) || 0,
  };
};

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

      const mappedVoters: Voter[] = apiData.map(mapApiVoterToVoter);

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

export const updateVoterPartyAction = (
  voterId: string,
  partyId: string | null,
  partyName: string
) => {
  return async (dispatch: Dispatch) => {
    try {
      await apiClient.put(`/mobile/voters/${voterId}`, {
        partyId: partyId || null,
        voterType: partyName,
      });
      dispatch({
        type: UPDATE_VOTER_PARTY,
        payload: { voterId, party: partyName, partyId: partyId || null },
      });
      toast.success(`Supporting party updated to ${partyName}`);
    } catch (e: any) {
      console.error('Update voter party error:', e);
      toast.error(e?.response?.data?.message || "Failed to update supporting party.");
    }
  };
};

export const addVoterAction = (newVoter: Record<string, any>, onSuccess?: (created?: Voter) => void) => {
  return async (dispatch: Dispatch) => {
    try {
      const v = newVoter as any;
      const payload: Record<string, any> = {
        epicNo: (v.epicNo || '').toUpperCase().trim(),
        engFirstName: v.engFirstName?.trim() || v.name?.trim() || '',
        engMiddleName: v.engMiddleName?.trim() || null,
        engSurname: v.engSurname?.trim() || null,
        firstName: v.firstName?.trim() || v.hindiName?.trim() || null,
        middleName: v.middleName?.trim() || null,
        surname: v.surname?.trim() || null,
        guardianName: v.guardianName?.trim() || v.relativeName?.trim() || null,
        relativeName: v.relativeName?.trim() || v.guardianName?.trim() || null,
        relation: v.relation || null,
        gender: v.gender || 'Male',
        dob: v.dob || null,
        age: v.age ? Number(v.age) : null,
        bloodGroup: v.bloodGroup?.trim() || null,
        status: v.status || 'ACTIVE',
        isDead: Boolean(v.isDead),
        voterType: v.voterType || v.supportingParty || 'Voter',
        avatar: v.avatar || v.image || null,

        // Electoral Geography
        stateId: v.stateId || null,
        districtId: v.districtId || null,
        pcId: v.pcId || null,
        acId: v.acId || null,
        boothId: v.boothId || v.boothNo || null,
        serialNo: v.serialNo ? Number(v.serialNo) : null,
        sectionNo: v.sectionNo ? Number(v.sectionNo) : null,
        houseNo: v.houseNo?.trim() || null,
        village: v.village?.trim() || null,
        taluka: v.taluka?.trim() || null,
        fullAddress: v.fullAddress?.trim() || v.address?.trim() || null,
        voterAddress: v.voterAddress?.trim() || null,

        // Party & Influencers
        partyId: v.partyId || null,
        isFamilyInfluencer: Boolean(v.isFamilyInfluencer),
        isSocialInfluencer: Boolean(v.isSocialInfluencer),
        familyInfluencerId: v.isFamilyInfluencer ? null : (v.familyInfluencerId || null),
        socialInfluencerId: v.socialInfluencerId || null,

        // Demographics & Contact
        mobileNo: v.mobileNo?.trim() || v.mobile?.trim() || null,
        email: v.email?.trim() || null,
        aadhaarNo: v.aadhaarNo?.trim() || null,
        panNo: v.panNo?.trim() || null,
        religionId: v.religionId || null,
        religionName: v.religionName?.trim() || null,
        casteId: v.casteId || null,
        casteName: v.casteName?.trim() || null,
        subcasteName: v.subcasteName?.trim() || null,
        professionType: v.professionType?.trim() || null,
        profession: v.profession?.trim() || null,
      };

      const response = await apiClient.post('/mobile/voters', payload);
      const rawVoter = response?.data?.data || response?.data || payload;
      const mapped = mapApiVoterToVoter(rawVoter);
      dispatch({ type: ADD_NEW_VOTER, payload: mapped });
      toast.success("Voter registered successfully!");
      if (onSuccess) onSuccess(mapped);
      return mapped;
    } catch (e: any) {
      console.error('Add voter error:', e);
      toast.error(e?.response?.data?.message || "Failed to add voter.");
      throw e;
    }
  };
};

export const updateVoterAction = (voterData: Record<string, any>, onSuccess?: (updated?: Voter) => void) => {
  return async (dispatch: Dispatch) => {
    try {
      if (!voterData.id) return;
      const v = voterData as any;
      const payload: Record<string, any> = {
        ...(v.epicNo !== undefined && { epicNo: v.epicNo.toUpperCase().trim() }),
        ...(v.engFirstName !== undefined && { engFirstName: v.engFirstName?.trim() }),
        ...(v.engMiddleName !== undefined && { engMiddleName: v.engMiddleName?.trim() || null }),
        ...(v.engSurname !== undefined && { engSurname: v.engSurname?.trim() || null }),
        ...(v.firstName !== undefined && { firstName: v.firstName?.trim() || null }),
        ...(v.middleName !== undefined && { middleName: v.middleName?.trim() || null }),
        ...(v.surname !== undefined && { surname: v.surname?.trim() || null }),
        ...(v.guardianName !== undefined && { guardianName: v.guardianName?.trim() || null }),
        ...(v.relativeName !== undefined && { relativeName: v.relativeName?.trim() || null }),
        ...(v.relation !== undefined && { relation: v.relation || null }),
        ...(v.gender !== undefined && { gender: v.gender }),
        ...(v.dob !== undefined && { dob: v.dob || null }),
        ...(v.age !== undefined && { age: v.age ? Number(v.age) : null }),
        ...(v.bloodGroup !== undefined && { bloodGroup: v.bloodGroup?.trim() || null }),
        ...(v.status !== undefined && { status: v.status }),
        ...(v.isDead !== undefined && { isDead: Boolean(v.isDead) }),
        ...(v.voterType !== undefined && { voterType: v.voterType }),
        ...(v.avatar !== undefined && { avatar: v.avatar || null }),

        // Electoral Geography
        ...(v.stateId !== undefined && { stateId: v.stateId || null }),
        ...(v.districtId !== undefined && { districtId: v.districtId || null }),
        ...(v.pcId !== undefined && { pcId: v.pcId || null }),
        ...(v.acId !== undefined && { acId: v.acId || null }),
        ...(v.boothId !== undefined && { boothId: v.boothId || null }),
        ...(v.serialNo !== undefined && { serialNo: v.serialNo ? Number(v.serialNo) : null }),
        ...(v.sectionNo !== undefined && { sectionNo: v.sectionNo ? Number(v.sectionNo) : null }),
        ...(v.houseNo !== undefined && { houseNo: v.houseNo?.trim() || null }),
        ...(v.village !== undefined && { village: v.village?.trim() || null }),
        ...(v.taluka !== undefined && { taluka: v.taluka?.trim() || null }),
        ...(v.fullAddress !== undefined && { fullAddress: v.fullAddress?.trim() || null }),
        ...(v.voterAddress !== undefined && { voterAddress: v.voterAddress?.trim() || null }),

        // Party & Influencers
        ...(v.partyId !== undefined && { partyId: v.partyId || null }),
        ...(v.isFamilyInfluencer !== undefined && { isFamilyInfluencer: Boolean(v.isFamilyInfluencer) }),
        ...(v.isSocialInfluencer !== undefined && { isSocialInfluencer: Boolean(v.isSocialInfluencer) }),
        ...(v.familyInfluencerId !== undefined && {
          familyInfluencerId: v.isFamilyInfluencer ? null : (v.familyInfluencerId || null),
        }),
        ...(v.socialInfluencerId !== undefined && { socialInfluencerId: v.socialInfluencerId || null }),

        // Demographics & Contact
        ...((v.mobileNo !== undefined || v.mobile !== undefined) && {
          mobileNo: v.mobileNo?.trim() || v.mobile?.trim() || null,
        }),
        ...(v.email !== undefined && { email: v.email?.trim() || null }),
        ...(v.aadhaarNo !== undefined && { aadhaarNo: v.aadhaarNo?.trim() || null }),
        ...(v.panNo !== undefined && { panNo: v.panNo?.trim() || null }),
        ...(v.religionId !== undefined && { religionId: v.religionId || null }),
        ...(v.religionName !== undefined && { religionName: v.religionName?.trim() || null }),
        ...(v.casteId !== undefined && { casteId: v.casteId || null }),
        ...(v.casteName !== undefined && { casteName: v.casteName?.trim() || null }),
        ...(v.subcasteName !== undefined && { subcasteName: v.subcasteName?.trim() || null }),
        ...(v.professionType !== undefined && { professionType: v.professionType?.trim() || null }),
        ...(v.profession !== undefined && { profession: v.profession?.trim() || null }),
      };

      const response = await apiClient.put(`/mobile/voters/${v.id}`, payload);
      const rawVoter = response?.data?.data || response?.data || { ...v, ...payload };
      const mapped = mapApiVoterToVoter(rawVoter);
      dispatch({ type: UPDATE_VOTER_DETAILS, payload: mapped });
      toast.success("Voter profile updated successfully!");
      if (onSuccess) onSuccess(mapped);
      return mapped;
    } catch (e: any) {
      console.error('Update voter error:', e);
      toast.error(e?.response?.data?.message || "Failed to update voter profile.");
      throw e;
    }
  };
};

export const fetchVoterByIdAction = (voterId: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await apiClient.get(`/mobile/voters/${voterId}`);
      const rawVoter = response?.data?.data || response?.data;
      if (rawVoter) {
        const mapped = mapApiVoterToVoter(rawVoter);
        dispatch({ type: UPDATE_VOTER_DETAILS, payload: mapped });
        return mapped;
      }
    } catch (e: any) {
      console.error('Fetch voter by id error:', e);
    }
    return null;
  };
};

