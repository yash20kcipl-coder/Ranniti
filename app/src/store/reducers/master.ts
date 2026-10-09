export const SET_MASTER_PCS = "SET_MASTER_PCS";
export const SET_MASTER_ACS = "SET_MASTER_ACS";
export const SET_MASTER_WARDS = "SET_MASTER_WARDS";
export const SET_MASTER_CASTES = "SET_MASTER_CASTES";
export const SET_MASTER_BOOTHS = "SET_MASTER_BOOTHS";
export const SET_MASTER_STATES = "SET_MASTER_STATES";
export const SET_MASTER_PARTIES = "SET_MASTER_PARTIES";
export const SET_MASTER_LOADING = "SET_MASTER_LOADING";
export const SET_BOOTHS_LOADING = "SET_BOOTHS_LOADING";
export const SET_MASTER_RELIGIONS = "SET_MASTER_RELIGIONS";
export const SET_MASTER_DISTRICTS = "SET_MASTER_DISTRICTS";
export const SET_MASTER_TALUKAS = "SET_MASTER_TALUKAS";
export const SET_MASTER_VILLAGES = "SET_MASTER_VILLAGES";

export interface StateMasterItem {
  id: string;
  name: string;
}

export interface DistrictMasterItem {
  id: string;
  name: string;
  stateId?: string;
}

export interface PcMasterItem {
  id: string;
  name: string;
  pcNumber?: number;
  stateId?: string;
}

export interface AcMasterItem {
  id: string;
  name: string;
  acNumber?: number;
  pcId?: string;
  pcName?: string;
  districtId?: string;
  stateId?: string;
}

export interface WardMasterItem {
  id: string;
  name: string;
  wardNumber?: number;
  acId?: string;
}

export interface BoothMasterItem {
  id: string;
  name: string;
  boothNumber?: number;
  acId?: string;
  wardId?: string;
}

export interface PartyMasterItem {
  id: string;
  name: string;
  abbreviation: string;
  symbolLogo?: string;
}

export interface ReligionMasterItem {
  id: string;
  name: string;
}

export interface CasteMasterItem {
  id: string;
  name: string;
  category: string;
  religionId?: string;
  parentCasteId?: string;
}

export interface TalukaMasterItem {
  id: string;
  name: string;
  districtId?: string;
}

export interface VillageMasterItem {
  id: string;
  name: string;
  talukaId?: string;
  districtId?: string;
}

export interface MasterState {
  states: StateMasterItem[];
  districts: DistrictMasterItem[];
  pcs: PcMasterItem[];
  acs: AcMasterItem[];
  wards: WardMasterItem[];
  booths: BoothMasterItem[];
  parties: PartyMasterItem[];
  religions: ReligionMasterItem[];
  castes: CasteMasterItem[];
  talukas: TalukaMasterItem[];
  villages: VillageMasterItem[];
  loading: boolean;
  boothsLoading: boolean;
}

const initialState: MasterState = {
  states: [],
  districts: [],
  pcs: [],
  acs: [],
  wards: [],
  booths: [],
  parties: [],
  religions: [],
  castes: [],
  talukas: [],
  villages: [],
  loading: false,
  boothsLoading: false,
};

const masterReducer = (state = initialState, action: any): MasterState => {
  switch (action.type) {
    case SET_MASTER_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_BOOTHS_LOADING:
      return {
        ...state,
        boothsLoading: action.payload,
      };
    case SET_MASTER_ACS:
      return {
        ...state,
        acs: action.payload,
      };
    case SET_MASTER_WARDS:
      return {
        ...state,
        wards: action.payload,
      };
    case SET_MASTER_BOOTHS:
      return {
        ...state,
        booths: action.payload,
        boothsLoading: false,
      };
    case SET_MASTER_PARTIES:
      return {
        ...state,
        parties: action.payload,
      };
    case SET_MASTER_RELIGIONS:
      return {
        ...state,
        religions: action.payload,
      };
    case SET_MASTER_CASTES:
      return {
        ...state,
        castes: action.payload,
      };
    case SET_MASTER_STATES:
      return {
        ...state,
        states: action.payload,
      };
    case SET_MASTER_DISTRICTS:
      return {
        ...state,
        districts: action.payload,
      };
    case SET_MASTER_PCS:
      return {
        ...state,
        pcs: action.payload,
      };
    case SET_MASTER_TALUKAS:
      return {
        ...state,
        talukas: action.payload,
      };
    case SET_MASTER_VILLAGES:
      return {
        ...state,
        villages: action.payload,
      };
    default:
      return state;
  }
};

export default masterReducer;
