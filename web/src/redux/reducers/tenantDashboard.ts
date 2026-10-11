import {
  SET_TENANT_DASHBOARD_DATA,
  SET_TENANT_DASHBOARD_LOADING,
  type TenantDashboardPayload,
} from '../actions/tenantDashboard';

export interface TenantDashboardState {
  data: TenantDashboardPayload | null;
  loading: boolean;
}

const initialState: TenantDashboardState = {
  data: null,
  loading: false,
};

export default function tenantDashboardReducer(
  state: TenantDashboardState = initialState,
  action: { type: string; payload?: any }
): TenantDashboardState {
  switch (action.type) {
    case SET_TENANT_DASHBOARD_LOADING:
      return {
        ...state,
        loading: Boolean(action.payload),
      };

    case SET_TENANT_DASHBOARD_DATA:
      return {
        ...state,
        data: action.payload as TenantDashboardPayload,
        loading: false,
      };

    default:
      return state;
  }
}
