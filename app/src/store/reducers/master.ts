export const SET_MASTER_ACS = "SET_MASTER_ACS";
export const SET_MASTER_WARDS = "SET_MASTER_WARDS";
export const SET_MASTER_CASTES = "SET_MASTER_CASTES";
export const SET_MASTER_BOOTHS = "SET_MASTER_BOOTHS";
export const SET_MASTER_PARTIES = "SET_MASTER_PARTIES";
export const SET_MASTER_LOADING = "SET_MASTER_LOADING";
export const SET_BOOTHS_LOADING = "SET_BOOTHS_LOADING";
export const SET_MASTER_RELIGIONS = "SET_MASTER_RELIGIONS";

export interface AcMasterItem {
  id: string;
  name: string;
  acNumber?: number;
  pcId?: string;
  pcName?: string;
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
}

export interface MasterState {
  acs: AcMasterItem[];
  wards: WardMasterItem[];
  booths: BoothMasterItem[];
  parties: PartyMasterItem[];
  religions: ReligionMasterItem[];
  castes: CasteMasterItem[];
  loading: boolean;
  boothsLoading: boolean;
}

const initialState: MasterState = {
  acs: [],
  wards: [],
  booths: [],
  parties: [],
  religions: [],
  castes: [],
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
    default:
      return state;
  }
};

export default masterReducer;
