import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMasterCategoryData } from '@/redux/actions/master';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import type { MasterState } from '@/redux/reducers/master';

export type MasterCategoryKey =
  | 'states'
  | 'districts'
  | 'talukas'
  | 'villages'
  | 'pcs'
  | 'acs'
  | 'booths'
  | 'religions'
  | 'castes'
  | 'parties';

export const MASTER_ENDPOINTS: Record<MasterCategoryKey, string> = {
  states: '/masters/states',
  districts: '/masters/districts',
  talukas: '/masters/talukas',
  villages: '/masters/villages',
  pcs: '/masters/pcs',
  acs: '/masters/acs',
  booths: '/masters/booths',
  religions: '/masters/religions',
  castes: '/masters/castes',
  parties: '/masters/parties',
};

export const DEFAULT_MASTER_CATEGORIES: MasterCategoryKey[] = [
  'states',
  'districts',
  'talukas',
  'villages',
  'pcs',
  'acs',
  'booths',
  'religions',
  'castes',
  'parties',
];

/**
 * Custom React hook to fetch and consume master category data from Redux store.
 * Automatically triggers debounced API requests (Rule 13) for any specified
 * master category that has not yet been loaded into the Redux store.
 *
 * @param categories Optional array of master categories to ensure loaded. Defaults to all standard categories.
 * @param delay Optional debounce delay in milliseconds. Defaults to 150ms.
 * @returns The master slice state from Redux store (`MasterState`).
 *
 * @example
 * const { states, districts, pcs, acs, booths, religions, castes } = useMasterData();
 *
 * @example
 * const { booths, religions, castes } = useMasterData(['booths', 'religions', 'castes']);
 */
export const useMasterData = (
  categories: MasterCategoryKey[] = DEFAULT_MASTER_CATEGORIES,
  delay: number = 150
): MasterState => {
  const dispatch = useAppDispatch();
  const master = useAppSelector((state) => state.master);
  const categoriesKey = categories.join(',');

  useDebouncedEffect(
    () => {
      categories.forEach((cat) => {
        const isLoaded = master.loadedCategories?.[cat];
        const isFetching = master.fetchingCategories?.[cat];
        if (!isLoaded && !isFetching) {
          const endpoint = MASTER_ENDPOINTS[cat];
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

export { useTenantMasterData } from './useTenantMasterData';

