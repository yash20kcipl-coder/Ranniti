import {
  SET_BOOTHS_LIST,
  APPEND_BOOTHS_LIST,
  SET_BOOTHS_LOADING,
  SET_BOOTHS_LOADING_MORE,
  SET_BOOTHS_SEARCH,
  RESET_BOOTHS,
  BoothItem,
  BoothPagination,
} from "../reducers/booths";
import { Dispatch } from "redux";
import { RootState } from "../store";
import toast from "../../utils/toast";
import apiClient from "../../api/apiClient";

export const setBoothSearchAction = (search: string) => ({
  type: SET_BOOTHS_SEARCH,
  payload: search,
});

export const resetBoothsAction = () => ({
  type: RESET_BOOTHS,
});

export const fetchAssignedBoothsAction = (
  page: number = 1,
  isLoadMore: boolean = false,
  searchQuery?: string
) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState().booths;
    const targetPage = Math.max(1, page);
    const search = searchQuery !== undefined ? searchQuery : currentState.search;

    if (isLoadMore) {
      dispatch({ type: SET_BOOTHS_LOADING_MORE, payload: true });
    } else {
      dispatch({ type: SET_BOOTHS_LOADING, payload: true });
    }

    try {
      const params: any = {
        page: targetPage,
        limit: 25,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await apiClient.get('/mobile/booths', { params });
      const apiData = response?.data?.data?.booths || response?.data?.booths || [];
      const apiPagination = response?.data?.data?.pagination || response?.data?.pagination || {
        total: apiData.length,
        page: targetPage,
        limit: 25,
        totalPages: 1,
      };

      const mappedBooths: BoothItem[] = apiData.map((item: any) => ({
        id: item.id,
        boothNumber: Number(item.boothNumber),
        name: item.name,
        locationBuilding: item.locationBuilding || null,
        totalVoters: Number(item.totalVoters || 0),
        votedCount: Number(item.votedCount || 0),
        maleCount: Number(item.maleCount || 0),
        femaleCount: Number(item.femaleCount || 0),
        otherCount: Number(item.otherCount || 0),
        acId: item.acId || null,
        acName: item.acName || null,
        wardId: item.wardId || null,
        wardName: item.wardName || null,
        wardNumber: item.wardNumber !== null && item.wardNumber !== undefined ? Number(item.wardNumber) : null,
      }));

      const pagination: BoothPagination = {
        total: Number(apiPagination.total || 0),
        page: Number(apiPagination.page || targetPage),
        limit: Number(apiPagination.limit || 25),
        totalPages: Number(apiPagination.totalPages || 1),
        hasMore: Number(apiPagination.page || targetPage) < Number(apiPagination.totalPages || 1),
      };

      if (isLoadMore) {
        dispatch({
          type: APPEND_BOOTHS_LIST,
          payload: { booths: mappedBooths, pagination },
        });
      } else {
        dispatch({
          type: SET_BOOTHS_LIST,
          payload: { booths: mappedBooths, pagination },
        });
      }
    } catch (err: any) {
      console.error("[fetchAssignedBoothsAction] Failed to fetch booths:", err);
      dispatch({ type: SET_BOOTHS_LOADING, payload: false });
      dispatch({ type: SET_BOOTHS_LOADING_MORE, payload: false });
      toast.error(err?.response?.data?.message || "Failed to load assigned booths");
    }
  };
};

export const loadMoreAssignedBoothsAction = () => {
  return async (dispatch: any, getState: () => RootState) => {
    const { booths, loading, loadingMore, pagination, search } = getState().booths;
    if (loading || loadingMore || !pagination.hasMore || booths.length === 0) {
      return;
    }

    const nextPage = pagination.page + 1;
    dispatch(fetchAssignedBoothsAction(nextPage, true, search));
  };
};
