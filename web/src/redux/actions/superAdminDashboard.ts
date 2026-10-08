import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export interface TenantOverviewMetrics {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  suspendedTenants: number;
  totalVotersCopied: number;
}

export interface ElectoralInfrastructureCounts {
  statesCount: number;
  pcsCount: number;
  acsCount: number;
  wardsCount: number;
  boothsCount: number;
  partiesCount: number;
  religionsCount: number;
  castesCount: number;
}

export interface VoterDemographicMetrics {
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  otherVoters: number;
}

export interface PlatformHealthMetrics {
  masterPoolTotal: number;
  masterPoolIdle: number;
  masterPoolWaiting: number;
  activeTenantPools: number;
  uptimeSeconds: number;
}

export interface RecentTenantRecord {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  organizationName: string;
  tenantDbName: string;
  status: string;
  currentStep: string | null;
  currentPhase: string | null;
  provisioningProgress: number;
  totalVotersCopied: number;
  createdAt: string;
  roleName: string | null;
}

export interface RecentAuditRecord {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export interface ImportJobItem {
  jobId: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  insertedCount: number;
  failedCount: number;
  progressPercent: number;
  recordsPerSecond: number;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface SuperAdminDashboardPayload {
  tenants: TenantOverviewMetrics;
  infrastructure: ElectoralInfrastructureCounts;
  voters: VoterDemographicMetrics;
  platformHealth: PlatformHealthMetrics;
  recentTenants: RecentTenantRecord[];
  activeImportsCount: number;
  recentAuditFeed: RecentAuditRecord[];
}

export const SET_SUPER_ADMIN_DASHBOARD_DATA = 'SET_SUPER_ADMIN_DASHBOARD_DATA';
export const SET_SUPER_ADMIN_DASHBOARD_LOADING = 'SET_SUPER_ADMIN_DASHBOARD_LOADING';
export const SET_DASHBOARD_IMPORT_JOBS = 'SET_DASHBOARD_IMPORT_JOBS';
export const SET_DASHBOARD_AUDIT_FEED = 'SET_DASHBOARD_AUDIT_FEED';

export const setDashboardData = (data: SuperAdminDashboardPayload) => ({
  type: SET_SUPER_ADMIN_DASHBOARD_DATA,
  payload: data,
});

export const setDashboardLoading = (loading: boolean) => ({
  type: SET_SUPER_ADMIN_DASHBOARD_LOADING,
  payload: loading,
});

export const setDashboardImportJobs = (jobs: ImportJobItem[]) => ({
  type: SET_DASHBOARD_IMPORT_JOBS,
  payload: jobs,
});

export const setDashboardAuditFeed = (feed: RecentAuditRecord[]) => ({
  type: SET_DASHBOARD_AUDIT_FEED,
  payload: feed,
});

/**
 * Fetch all platform KPI metrics for Super Admin Dashboard
 */
export const fetchSuperAdminDashboardMetrics = (showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setDashboardLoading(true));
    try {
      const res = await api.get('/super-admin/dashboard/metrics');
      const data = res.data?.data || res.data;
      if (data) {
        dispatch(setDashboardData(data));
      }
      return data;
    } catch (err) {
      if (showLoader) dispatch(errorHandler(err));
      throw err;
    } finally {
      if (showLoader) dispatch(setDashboardLoading(false));
    }
  };
};

/**
 * Fetch active bulk import jobs for real-time monitoring
 */
export const fetchDashboardImportJobs = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/super-admin/dashboard/imports');
      const jobs = res.data?.data || res.data || [];
      dispatch(setDashboardImportJobs(Array.isArray(jobs) ? jobs : []));
      return jobs;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};

/**
 * Fetch recent audit logs feed
 */
export const fetchDashboardAuditFeed = (limit = 20) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get('/super-admin/dashboard/audit-feed', { params: { limit } });
      const feed = res.data?.data || res.data || [];
      dispatch(setDashboardAuditFeed(Array.isArray(feed) ? feed : []));
      return feed;
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
