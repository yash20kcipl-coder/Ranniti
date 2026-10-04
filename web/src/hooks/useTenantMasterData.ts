import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { MasterCategoryKey } from './useMasterData';
import type { MasterState } from '@/redux/reducers/master';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchTenantMasterCategoryData as fetchMasterCategoryData } from '@/redux/actions/masterTenant';

export type TenantMasterCategoryKey = MasterCategoryKey | 'wards';

export const TENANT_MASTER_ENDPOINTS: Record<TenantMasterCategoryKey, string> = {
  states: API_ENDPOINTS.TENANT.MASTERS.STATES,
  districts: API_ENDPOINTS.TENANT.MASTERS.DISTRICTS,
  talukas: API_ENDPOINTS.TENANT.MASTERS.TALUKAS,
  villages: API_ENDPOINTS.TENANT.MASTERS.VILLAGES,
  pcs: API_ENDPOINTS.TENANT.MASTERS.PCS,
  acs: API_ENDPOINTS.TENANT.MASTERS.ACS,
  wards: API_ENDPOINTS.TENANT.MASTERS.WARDS,
  booths: API_ENDPOINTS.TENANT.MASTERS.BOOTHS,
  religions: API_ENDPOINTS.TENANT.MASTERS.RELIGIONS,
  castes: API_ENDPOINTS.TENANT.MASTERS.CASTES,
  parties: API_ENDPOINTS.TENANT.MASTERS.PARTIES,
};

export const DEFAULT_TENANT_MASTER_CATEGORIES: TenantMasterCategoryKey[] = [
  'states',
  'districts',
  'talukas',
  'villages',
  'pcs',
  'acs',
  'wards',
  'booths',
  'religions',
  'castes',
  'parties',
];

/**
 * Custom React hook for tenant features to fetch tenant-scoped master category data.
 * Automatically triggers debounced API requests (Rule 13) using tenant endpoints (`/tenant/*`).
 *
 * @param categories Optional array of master categories to ensure loaded.
 * @param delay Optional debounce delay in milliseconds. Defaults to 150ms.
 * @returns The master slice state from Redux store (`MasterState`).
 *
 * @example
 * const { acs, booths, religions, castes } = useTenantMasterData(['acs', 'booths', 'religions', 'castes']);
 */
export const useTenantMasterData = (
  categories: TenantMasterCategoryKey[] = DEFAULT_TENANT_MASTER_CATEGORIES,
  delay: number = 150
): MasterState => {
  const dispatch = useAppDispatch();
  const master = useAppSelector((state) => state.master);
  const categoriesKey = categories.join(',');

  useDebouncedEffect(
    () => {
      categories.forEach((cat) => {
        const isLoaded = (master.loadedCategories as any)?.[cat];
        const isFetching = (master.fetchingCategories as any)?.[cat];
        if (!isLoaded && !isFetching) {
          const endpoint = TENANT_MASTER_ENDPOINTS[cat];
          if (endpoint) {
            dispatch(fetchMasterCategoryData(cat, endpoint, false));
          }
        }
      });
    },
    delay,
    [dispatch, categoriesKey, master.loadedCategories, master.fetchingCategories]
  );

  return master;
};

export default useTenantMasterData;
