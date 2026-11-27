import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';

export interface AgePartyCohortItem {
  ageGroup: string;
  label: string;
  total: number;
  parties: Array<{
    partyId: string | null;
    partyName: string;
    color: string;
    count: number;
  }>;
}

export interface FieldCompletenessItem {
  key: string;
  label: string;
  category: 'contact' | 'political' | 'demographic' | 'household';
  filledCount: number;
  totalCount: number;
  percentage: number;
  hint: string;
}

export interface FieldCompletenessStats {
  totalVoters: number;
  overallScore: number;
  fields: FieldCompletenessItem[];
}

export interface CadreSummaryStats {
  subLeaderCount: number;
  supporterCount: number;
  fullyStaffedBooths: number;
  partiallyStaffedBooths: number;
  unstaffedBooths: number;
  totalBooths: number;
  boothTeamMembers?: Array<{
    id: string;
    name: string;
    phone?: string;
    role: string;
  }>;
}

export interface AssignedConstituencyInfo {
  parliamentaryConstituencies: Array<{
    id: string;
    name: string;
    pcNumber?: number;
    stateName?: string;
  }>;
  assemblyConstituencies: Array<{
    id: string;
    name: string;
    acNumber?: number;
    pcName?: string;
    stateName?: string;
  }>;
}

export interface TenantDashboardOverviewPayload {
  tenantDbName: string;
  boothId: string | null;
  totalVoters: number;
  totalBooths: number;
  genderBreakdown: {
    male: number;
    female: number;
    other: number;
  };
  genderPhoneReach: {
    maleWithPhone: number;
    femaleWithPhone: number;
    otherWithPhone: number;
  };
  partyBreakdown: Array<{
    partyId: string | null;
    partyName: string;
    count: number;
    color?: string;
  }>;
  agePartyBreakdown: AgePartyCohortItem[];
  fieldCompleteness: FieldCompletenessStats;
  cadreSummary: CadreSummaryStats;
  profile?: {
    organizationName?: string;
    name?: string;
    email?: string;
    assignedPcIds?: string[];
    assignedAcIds?: string[];
  };
  constituencies?: AssignedConstituencyInfo;
  lastSyncedAt?: string;
}

export const SET_TENANT_OVERVIEW_DATA = 'SET_TENANT_OVERVIEW_DATA';
export const SET_TENANT_OVERVIEW_LOADING = 'SET_TENANT_OVERVIEW_LOADING';

export const setTenantOverviewData = (data: TenantDashboardOverviewPayload) => ({
  type: SET_TENANT_OVERVIEW_DATA,
  payload: data,
});

export const setTenantOverviewLoading = (loading: boolean) => ({
  type: SET_TENANT_OVERVIEW_LOADING,
  payload: loading,
});

/**
 * Fetch redesigned tenant campaign overview (optionally filtered by boothId)
 */
export const fetchTenantDashboardOverview = (
  forceRefresh = false,
  showLoader = true,
  boothId?: string
) => {
  return async (dispatch: AppDispatch) => {
    if (showLoader) dispatch(setTenantOverviewLoading(true));
    try {
      const params: Record<string, string> = {};
      if (forceRefresh) params.refresh = 'true';
      if (boothId && boothId.trim()) params.boothId = boothId.trim();

      const [overviewRes, profileRes, constituenciesRes] = await Promise.all([
        api.get('/tenant/data/overview', { params }),
        api.get('/tenant/data/profile').catch(() => ({ data: { data: null } })),
        api.get('/tenant/data/constituencies').catch(() => ({ data: { data: null } })),
      ]);

      const overview = overviewRes.data?.data || overviewRes.data || {};
      const profile = profileRes.data?.data || profileRes.data || {};
      const constituencies = constituenciesRes.data?.data || constituenciesRes.data || {
        parliamentaryConstituencies: [],
        assemblyConstituencies: [],
      };

      const payload: TenantDashboardOverviewPayload = {
        tenantDbName: overview.tenantDbName || '',
        boothId: overview.boothId || null,
        totalVoters: overview.totalVoters || 0,
        totalBooths: overview.totalBooths || 0,
        genderBreakdown: overview.genderBreakdown || { male: 0, female: 0, other: 0 },
        genderPhoneReach: overview.genderPhoneReach || {
          maleWithPhone: 0,
          femaleWithPhone: 0,
          otherWithPhone: 0,
        },
        partyBreakdown: Array.isArray(overview.partyBreakdown) ? overview.partyBreakdown : [],
        agePartyBreakdown: Array.isArray(overview.agePartyBreakdown) ? overview.agePartyBreakdown : [],
        fieldCompleteness: overview.fieldCompleteness || {
          totalVoters: overview.totalVoters || 0,
          overallScore: 0,
          fields: [],
        },
        cadreSummary: overview.cadreSummary || {
          subLeaderCount: 0,
          supporterCount: 0,
          fullyStaffedBooths: 0,
          partiallyStaffedBooths: 0,
          unstaffedBooths: 0,
          totalBooths: overview.totalBooths || 0,
        },
        profile: {
          organizationName: profile.organizationName || 'Campaign HQ',
          name: profile.name || '',
          email: profile.email || '',
          assignedPcIds: profile.assignedPcIds || [],
          assignedAcIds: profile.assignedAcIds || [],
        },
        constituencies: {
          parliamentaryConstituencies:
            Array.isArray(constituencies?.parliamentaryConstituencies) && constituencies.parliamentaryConstituencies.length > 0
              ? constituencies.parliamentaryConstituencies
              : Array.isArray(overview?.constituencies?.parliamentaryConstituencies)
                ? overview.constituencies.parliamentaryConstituencies
                : [],
          assemblyConstituencies:
            Array.isArray(constituencies?.assemblyConstituencies) && constituencies.assemblyConstituencies.length > 0
              ? constituencies.assemblyConstituencies
              : Array.isArray(overview?.constituencies?.assemblyConstituencies)
                ? overview.constituencies.assemblyConstituencies
                : [],
        },
        lastSyncedAt: overview.lastSyncedAt,
      };

      dispatch(setTenantOverviewData(payload));
      return payload;
    } catch (err) {
      if (showLoader) dispatch(errorHandler(err));
      throw err;
    } finally {
      if (showLoader) dispatch(setTenantOverviewLoading(false));
    }
  };
};
