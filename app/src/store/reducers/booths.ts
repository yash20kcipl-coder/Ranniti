export const SET_BOOTHS_LIST = "SET_BOOTHS_LIST";
export const APPEND_BOOTHS_LIST = "APPEND_BOOTHS_LIST";
export const SET_BOOTHS_LOADING = "SET_BOOTHS_LOADING";
export const SET_BOOTHS_LOADING_MORE = "SET_BOOTHS_LOADING_MORE";
export const SET_BOOTHS_PAGINATION = "SET_BOOTHS_PAGINATION";
export const SET_BOOTHS_SEARCH = "SET_BOOTHS_SEARCH";
export const RESET_BOOTHS = "RESET_BOOTHS";

export interface BoothItem {
  id: string;
  boothNumber: number;
  name: string;
  locationBuilding: string | null;
  totalVoters: number;
  votedCount: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  acId: string | null;
  acName: string | null;
  wardId: string | null;
  wardName: string | null;
  wardNumber: number | null;
}

export interface BoothPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface BoothsState {
  booths: BoothItem[];
  loading: boolean;
  loadingMore: boolean;
  search: string;
  pagination: BoothPagination;
}

const initialState: BoothsState = {
  booths: [],
  loading: true,
  loadingMore: false,
  search: "",
  pagination: {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
    hasMore: false,
  },
};

export const boothsReducer = (state = initialState, action: any): BoothsState => {
  switch (action.type) {
    case SET_BOOTHS_LOADING:
      return { ...state, loading: action.payload };

    case SET_BOOTHS_LOADING_MORE:
      return { ...state, loadingMore: action.payload };

    case SET_BOOTHS_SEARCH:
      return { ...state, search: action.payload };

    case SET_BOOTHS_LIST:
      return {
        ...state,
        booths: action.payload.booths,
        pagination: action.payload.pagination,
        loading: false,
        loadingMore: false,
      };

    case APPEND_BOOTHS_LIST:
      return {
        ...state,
        booths: [...state.booths, ...action.payload.booths],
        pagination: action.payload.pagination,
        loadingMore: false,
      };

    case SET_BOOTHS_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case RESET_BOOTHS:
      return initialState;

    default:
      return state;
  }
};
