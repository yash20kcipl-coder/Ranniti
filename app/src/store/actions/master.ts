import {
  SET_MASTER_ACS,
  SET_MASTER_WARDS,
  SET_MASTER_BOOTHS,
  SET_MASTER_PARTIES,
  SET_MASTER_RELIGIONS,
  SET_MASTER_CASTES,
  SET_MASTER_STATES,
  SET_MASTER_DISTRICTS,
  SET_MASTER_PCS,
  SET_MASTER_LOADING,
  SET_BOOTHS_LOADING,
  SET_MASTER_TALUKAS,
  SET_MASTER_VILLAGES,
  AcMasterItem,
  WardMasterItem,
  BoothMasterItem,
  PartyMasterItem,
  ReligionMasterItem,
  CasteMasterItem,
  StateMasterItem,
  DistrictMasterItem,
  PcMasterItem,
  TalukaMasterItem,
  VillageMasterItem,
} from "../reducers/master";
import { Dispatch } from "redux";
import apiClient from "../../api/apiClient";

export const fetchMasterStatesAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.get('/tenant/geography/states');
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const states: StateMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.stateName || item.name || `State #${item.id}`,
      }));
      dispatch({ type: SET_MASTER_STATES, payload: states });
      return states;
    } catch (e) {
      console.error('Failed to fetch states master data:', e);
      return [];
    }
  };
};

export const fetchMasterDistrictsAction = (stateId?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const params = stateId ? { stateId } : {};
      const res = await apiClient.get('/tenant/geography/districts', { params });
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const districts: DistrictMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.districtName || item.name || `District #${item.id}`,
        stateId: item.stateId ? String(item.stateId) : undefined,
      }));
      dispatch({ type: SET_MASTER_DISTRICTS, payload: districts });
      return districts;
    } catch (e) {
      console.error('Failed to fetch districts master data:', e);
      return [];
    }
  };
};

export const fetchMasterPcsAction = (stateId?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const params = stateId ? { stateId } : {};
      const res = await apiClient.get('/tenant/geography/pcs', { params });
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const pcs: PcMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.pcName || item.name || `PC #${item.id}`,
        pcNumber: item.pcNo || item.pcNumber,
        stateId: item.stateId ? String(item.stateId) : undefined,
      }));
      dispatch({ type: SET_MASTER_PCS, payload: pcs });
      return pcs;
    } catch (e) {
      console.error('Failed to fetch PCs master data:', e);
      return [];
    }
  };
};

export const fetchMasterAcsAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.get('/tenant/acs');
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : (raw.acs || []);
      const acs: AcMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.name || item.acName || `AC #${item.acNumber || item.acNo}`,
        acNumber: item.acNumber || item.acNo,
        pcId: item.pcId ? String(item.pcId) : undefined,
        pcName: item.pcName,
        districtId: item.districtId ? String(item.districtId) : undefined,
        stateId: item.stateId ? String(item.stateId) : undefined,
      }));
      dispatch({ type: SET_MASTER_ACS, payload: acs });
      return acs;
    } catch (e) {
      console.error('Failed to fetch AC master data:', e);
      return [];
    }
  };
};

export const fetchMasterWardsAction = (acId?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const params = acId ? { acId } : {};
      const res = await apiClient.get('/tenant/geography/wards', { params });
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : (raw.wards || []);
      const wards: WardMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.name || `Ward #${item.wardNumber}`,
        wardNumber: item.wardNumber,
        acId: item.acId ? String(item.acId) : undefined,
      }));
      dispatch({ type: SET_MASTER_WARDS, payload: wards });
      return wards;
    } catch (e) {
      console.error('Failed to fetch ward master data:', e);
      return [];
    }
  };
};

export const fetchMasterBoothsAction = (acId?: string, wardId?: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_BOOTHS_LOADING, payload: true });
    try {
      const params: any = {};
      if (acId) params.acId = acId;
      if (wardId) params.wardId = wardId;
      const res = await apiClient.get('/tenant/geography/booths/options', { params });
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const booths: BoothMasterItem[] = list.map((b: any) => {
        const rawWardId = b.wardId ?? b.ward_id ?? b.ward?.id;
        return {
          id: String(b.id),
          name: b.name || `Booth #${b.boothNumber ?? b.booth_number}`,
          boothNumber: b.boothNumber ?? b.booth_number,
          acId: b.acId ?? b.ac_id ? String(b.acId ?? b.ac_id) : undefined,
          wardId: rawWardId !== undefined && rawWardId !== null ? String(rawWardId) : undefined,
        };
      });
      dispatch({ type: SET_MASTER_BOOTHS, payload: booths });
      return booths;
    } catch (e) {
      console.error('Failed to fetch booth options:', e);
      dispatch({ type: SET_MASTER_BOOTHS, payload: [] });
      return [];
    }
  };
};

export const fetchMasterPartiesAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.get('/tenant/parties');
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const parties: PartyMasterItem[] = list.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        abbreviation: p.abbreviation || p.name,
        symbolLogo: p.symbolLogo,
      }));
      dispatch({ type: SET_MASTER_PARTIES, payload: parties });
      return parties;
    } catch (e) {
      console.error('Failed to fetch parties master data:', e);
      return [];
    }
  };
};

export const fetchMasterReligionsAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.get('/tenant/religions');
      const raw = res?.data?.data || res?.data || [];
      const religions: ReligionMasterItem[] = (Array.isArray(raw) ? raw : []).map((r: any) => ({
        id: String(r.id),
        name: r.name,
      }));
      dispatch({ type: SET_MASTER_RELIGIONS, payload: religions });
      return religions;
    } catch (e) {
      console.error('Failed to fetch religions master data:', e);
      return [];
    }
  };
};

export const fetchMasterCastesAction = (religionId?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const params = religionId ? { religionId } : {};
      const res = await apiClient.get('/tenant/castes', { params });
      const raw = res?.data?.data || res?.data || [];
      const castes: CasteMasterItem[] = (Array.isArray(raw) ? raw : []).map((c: any) => ({
        id: String(c.id),
        name: c.name,
        category: c.category || 'General',
        religionId: c.religionId ? String(c.religionId) : undefined,
      }));
      dispatch({ type: SET_MASTER_CASTES, payload: castes });
      return castes;
    } catch (e) {
      console.error('Failed to fetch castes master data:', e);
      return [];
    }
  };
};

export const fetchFilterMasterDataAction = (acId?: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_MASTER_LOADING, payload: true });
    try {
      await Promise.allSettled([
        (fetchMasterAcsAction() as any)(dispatch),
        (fetchMasterPartiesAction() as any)(dispatch),
        (fetchMasterBoothsAction(acId) as any)(dispatch),
      ]);
    } finally {
      dispatch({ type: SET_MASTER_LOADING, payload: false });
    }
  };
};

export const fetchMasterInfluencerOptionsAction = (params: {
  search?: string;
  boothId?: string;
  excludeId?: string;
  type?: string;
}) => {
  return async () => {
    try {
      const res = await apiClient.get('/mobile/voters/influencer-options', { params });
      return res?.data?.data || res?.data || [];
    } catch (e) {
      console.error('Failed to fetch influencer options:', e);
      return [];
    }
  };
};

export const fetchMasterTalukasAction = (districtId?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const params = districtId ? { districtId } : {};
      const res = await apiClient.get('/tenant/geography/talukas', { params });
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : (raw.talukas || []);
      const talukas: TalukaMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.name || item.talukaName || `Taluka #${item.id}`,
        districtId: item.districtId ? String(item.districtId) : undefined,
      }));
      dispatch({ type: SET_MASTER_TALUKAS, payload: talukas });
      return talukas;
    } catch (e) {
      console.error('Failed to fetch talukas master data:', e);
      return [];
    }
  };
};

export const fetchMasterVillagesAction = (talukaId?: string, districtId?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const params: any = {};
      if (talukaId) params.talukaId = talukaId;
      if (districtId) params.districtId = districtId;
      const res = await apiClient.get('/tenant/geography/villages', { params });
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : (raw.villages || []);
      const villages: VillageMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.name || item.villageName || `Village #${item.id}`,
        talukaId: item.talukaId ? String(item.talukaId) : undefined,
        districtId: item.districtId ? String(item.districtId) : undefined,
      }));
      dispatch({ type: SET_MASTER_VILLAGES, payload: villages });
      return villages;
    } catch (e) {
      console.error('Failed to fetch villages master data:', e);
      return [];
    }
  };
};

