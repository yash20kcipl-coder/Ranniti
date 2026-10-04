export const SET_VOTERS_DATA = 'SET_VOTERS_DATA';
export const SET_VOTER_STATS = 'SET_VOTER_STATS';
export const SET_VOTER_FILTERS = 'SET_VOTER_FILTERS';
export const SET_VOTERS_LOADING = 'SET_VOTERS_LOADING';
export const SET_VOTERS_PAGINATION = 'SET_VOTERS_PAGINATION';
export const SET_VOTER_BOOTH_OPTIONS = 'SET_VOTER_BOOTH_OPTIONS';
export const SET_VOTER_BOOTH_OPTIONS_LOADING = 'SET_VOTER_BOOTH_OPTIONS_LOADING';

export const setVotersData = (voters: any[]) => ({
  type: SET_VOTERS_DATA,
  voters,
});

export const setVotersLoading = (loading: boolean) => ({
  type: SET_VOTERS_LOADING,
  loading,
});

export const setVotersPagination = (pagination: {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) => ({
  type: SET_VOTERS_PAGINATION,
  pagination,
});

export const setVoterStats = (stats: any) => ({
  type: SET_VOTER_STATS,
  stats,
});

export const setVoterFilters = (filters: Record<string, any>) => ({
  type: SET_VOTER_FILTERS,
  filters,
});

export const setVoterBoothOptions = (options: any[]) => ({
  type: SET_VOTER_BOOTH_OPTIONS,
  options,
});

export const setVoterBoothOptionsLoading = (loading: boolean) => ({
  type: SET_VOTER_BOOTH_OPTIONS_LOADING,
  loading,
});

// Re-export specific Tenant & Super Admin Redux actions
export * from './voterTenant';
export * from './voterSuperAdmin';

// Default backward-compatible aliases mapping to tenant actions
export {
  fetchTenantVotersData as fetchVotersData,
  fetchTenantVoterStats as fetchVoterStats,
  fetchTenantVoterById as fetchVoterById,
  createTenantVoterItem as createVoterItem,
  updateTenantVoterItem as updateVoterItem,
  deleteTenantVoterItem as deleteVoterItem,
  importTenantVotersData as importVotersData,
  exportTenantVotersData as exportVotersData,
  fetchTenantInfluencerOptions as fetchInfluencerOptions,
  bulkAssignTenantInfluencerAction as bulkAssignInfluencerAction,
  fetchTenantBoothOptions as fetchBoothOptions,
} from './voterTenant';
