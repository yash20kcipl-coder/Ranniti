import {
  SET_TENANT_OVERVIEW_DATA,
  SET_TENANT_OVERVIEW_LOADING,
  type TenantDashboardOverviewPayload,
} from '../actions/tenantDashboardOverview';

export interface TenantDashboardOverviewState {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

const initialState: TenantDashboardOverviewState = {
  data: null,
  loading: false,
};

export default function tenantDashboardOverviewReducer(
  state: TenantDashboardOverviewState = initialState,
  action: { type: string; payload?: any }
): TenantDashboardOverviewState {
  switch (action.type) {
    case SET_TENANT_OVERVIEW_LOADING:
      return {
        ...state,
        loading: Boolean(action.payload),
      };

    case SET_TENANT_OVERVIEW_DATA:
      return {
        ...state,
        data: action.payload as TenantDashboardOverviewPayload,
        loading: false,
      };

    default:
      return state;
  }
}
