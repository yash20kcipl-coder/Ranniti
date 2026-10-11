import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export interface BoothCoverageByRoleItem {
  role: string;
  roleName: string;
  volunteerCount: number;
  coveredBoothsCount: number;
}

export interface TenantDashboardPayload {
  tenantDbName: string;
  totalVoters: number;
  totalBooths: number;
  totalVolunteers: number;
  assignedBoothsCount: number;
  genderBreakdown: {
    male: number;
    female: number;
    other: number;
  };
  partyBreakdown: Array<{
    partyId: string | null;
    partyName: string;
    count: number;
    color?: string;
  }>;
  ageCohorts?: {
    age_18_25: number;
    age_26_35: number;
    age_36_50: number;
    age_51_65: number;
    age_65_plus: number;
    age_unknown: number;
  };
  registrationVelocity?: Array<{
    date: string;
    count: number;
  }>;
  acBreakdown: Array<{
    acId: string;
    acName: string;
    voterCount: number;
  }>;
  boothCoverageByRole?: BoothCoverageByRoleItem[];
  recentVoters: Array<{
    id: string;
    epicNo: string;
    name: string;
    gender: string;
    age: number;
    partyId?: string;
    partyName?: string;
    createdAt: string;
  }>;
  profile?: {
    organizationName?: string;
    name?: string;
    email?: string;
    assignedPcIds?: string[];
    assignedAcIds?: string[];
  };
}

export const SET_TENANT_DASHBOARD_DATA = 'SET_TENANT_DASHBOARD_DATA';
export const SET_TENANT_DASHBOARD_LOADING = 'SET_TENANT_DASHBOARD_LOADING';

export const setTenantDashboardData = (data: TenantDashboardPayload) => ({
  type: SET_TENANT_DASHBOARD_DATA,
  payload: data,
});

export const setTenantDashboardLoading = (loading: boolean) => ({
  type: SET_TENANT_DASHBOARD_LOADING,
  payload: loading,
});

/**
 * Fetch real-time tenant campaign dashboard statistics
 */
export const fetchTenantDashboardMetrics = (forceRefresh = false, showLoader = true) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setTenantDashboardLoading(true));
    try {
      const statsEndpoint = forceRefresh ? '/tenant/data/stats?refresh=true' : '/tenant/data/stats';
      const [statsRes, profileRes] = await Promise.all([
        api.get(statsEndpoint),
        api.get('/tenant/data/profile').catch(() => ({ data: { data: null } })),
      ]);

      const stats = statsRes.data?.data || statsRes.data || {};
      const profile = profileRes.data?.data || profileRes.data || {};

      const combinedPayload: TenantDashboardPayload = {
        tenantDbName: stats.tenantDbName || '',
        totalVoters: stats.totalVoters || 0,
        totalBooths: stats.totalBooths || 0,
        totalVolunteers: stats.totalVolunteers || 0,
        assignedBoothsCount: stats.assignedBoothsCount || 0,
        genderBreakdown: stats.genderBreakdown || { male: 0, female: 0, other: 0 },
        partyBreakdown: Array.isArray(stats.partyBreakdown) ? stats.partyBreakdown : [],
        ageCohorts: stats.ageCohorts || {
          age_18_25: 0,
          age_26_35: 0,
          age_36_50: 0,
          age_51_65: 0,
          age_65_plus: 0,
          age_unknown: 0,
        },
        registrationVelocity: Array.isArray(stats.registrationVelocity) ? stats.registrationVelocity : [],
        acBreakdown: Array.isArray(stats.acBreakdown) ? stats.acBreakdown : [],
        boothCoverageByRole: Array.isArray(stats.boothCoverageByRole) ? stats.boothCoverageByRole : [],
        recentVoters: Array.isArray(stats.recentVoters) ? stats.recentVoters : [],
        profile: {
          organizationName: profile.organizationName || 'Campaign HQ',
          name: profile.name || '',
          email: profile.email || '',
          assignedPcIds: profile.assignedPcIds || [],
          assignedAcIds: profile.assignedAcIds || [],
        },
      };

      dispatch(setTenantDashboardData(combinedPayload));
      return combinedPayload;
    } catch (err) {
      if (showLoader) dispatch(errorHandler(err));
      throw err;
    } finally {
      if (showLoader) dispatch(setTenantDashboardLoading(false));
    }
  };
};
