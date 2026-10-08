import {
  SET_SUPER_ADMIN_DASHBOARD_DATA,
  SET_SUPER_ADMIN_DASHBOARD_LOADING,
  SET_DASHBOARD_IMPORT_JOBS,
  SET_DASHBOARD_AUDIT_FEED,
  type SuperAdminDashboardPayload,
  type ImportJobItem,
  type RecentAuditRecord,
} from '../actions/superAdminDashboard';

export interface DashboardState {
  data: SuperAdminDashboardPayload | null;
  importJobs: ImportJobItem[];
  auditFeed: RecentAuditRecord[];
  loading: boolean;
}

const initialState: DashboardState = {
  data: null,
  importJobs: [],
  auditFeed: [],
  loading: false,
};

export default function dashboardReducers(
  state: DashboardState = initialState,
  action: { type: string; payload?: any }
): DashboardState {
  switch (action.type) {
    case SET_SUPER_ADMIN_DASHBOARD_LOADING:
      return {
        ...state,
        loading: Boolean(action.payload),
      };

    case SET_SUPER_ADMIN_DASHBOARD_DATA:
      return {
        ...state,
        data: action.payload as SuperAdminDashboardPayload,
        auditFeed: action.payload?.recentAuditFeed || state.auditFeed,
      };

    case SET_DASHBOARD_IMPORT_JOBS:
      return {
        ...state,
        importJobs: Array.isArray(action.payload) ? action.payload : [],
      };

    case SET_DASHBOARD_AUDIT_FEED:
      return {
        ...state,
        auditFeed: Array.isArray(action.payload) ? action.payload : [],
      };

    default:
      return state;
  }
}
