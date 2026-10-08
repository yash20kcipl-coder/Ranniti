import {
  SET_MASTER_ACS,
  SET_MASTER_WARDS,
  SET_MASTER_BOOTHS,
  SET_MASTER_PARTIES,
  SET_MASTER_RELIGIONS,
  SET_MASTER_CASTES,
  SET_MASTER_LOADING,
  SET_BOOTHS_LOADING,
  AcMasterItem,
  WardMasterItem,
  BoothMasterItem,
  PartyMasterItem,
  ReligionMasterItem,
  CasteMasterItem,
} from "../reducers/master";
import { Dispatch } from "redux";
import apiClient from "../../api/apiClient";

export const fetchMasterAcsAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.get('/tenant/acs');
      const raw = res?.data?.data || res?.data || [];
      const list = Array.isArray(raw) ? raw : (raw.acs || []);
      const acs: AcMasterItem[] = list.map((item: any) => ({
        id: String(item.id),
        name: item.name || `AC #${item.acNumber}`,
        acNumber: item.acNumber,
        pcId: item.pcId ? String(item.pcId) : undefined,
        pcName: item.pcName,
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
      const booths: BoothMasterItem[] = list.map((b: any) => ({
        id: String(b.id),
        name: b.name || `Booth #${b.boothNumber}`,
        boothNumber: b.boothNumber,
        acId: b.acId ? String(b.acId) : undefined,
        wardId: b.wardId ? String(b.wardId) : undefined,
      }));
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
