import { useState, useCallback, useRef } from 'react';

/**
 * Strips empty strings, null, and undefined values from a params object
 * so the API never receives blank query parameters.
 */
export function cleanParams<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ) as Partial<T>;
}

export interface UseFilterParamsOptions<F extends Record<string, any>> {
  /** Initial filter values (e.g. from Redux saved filters) */
  initialFilters: F;
  /** Initial page number */
  initialPage?: number;
  /** Initial page size */
  initialLimit?: number;
}

export interface UseFilterParamsReturn<F extends Record<string, any>> {
  /** Current filter values (may include empty strings) */
  filterParams: F;
  /** Update a single filter key */
  setFilter: (key: keyof F, val: any) => void;
  /** Bulk-update multiple filter keys at once */
  setFilters: (partial: Partial<F>) => void;
  /** Reset all filters to the provided defaults */
  resetFilters: (defaults?: Partial<F>) => void;
  /** Current page */
  page: number;
  setPage: (page: number) => void;
  /** Current page size */
  limit: number;
  setLimit: (limit: number) => void;
  /**
   * Returns the active (non-empty) filter params merged with current
   * pagination — ready to pass directly to an API action.
   */
  getApiParams: () => Partial<F> & { page: number; limit: number };
  /**
   * Checks if filters changed since last call.
   * If they have, resets page to 1 and returns activePage = 1.
   * Call this at the start of your fetch effect.
   */
  syncPage: () => { activePage: number };
}

/**
 * useFilterParams
 *
 * A reusable hook that consolidates all filter + pagination state into a
 * single clean API. Eliminates the need for dozens of individual useState
 * calls per page.
 *
 * @example
 * const { filterParams, setFilter, resetFilters, getApiParams } = useFilterParams({
 *   initialFilters: { search: '', stateId: '', gender: '' },
 * });
 *
 * // Update one filter
 * setFilter('gender', 'Male');
 *
 * // Get clean params for the API
 * dispatch(fetchVoters(getApiParams()));
 *
 * // Reset to defaults
 * resetFilters();
 */
export function useFilterParams<F extends Record<string, any>>(
  options: UseFilterParamsOptions<F>
): UseFilterParamsReturn<F> {
  const { initialFilters, initialPage = 1, initialLimit = 25 } = options;

  const [filterParams, setFilterParams] = useState<F>(() => ({ ...initialFilters }));
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

  // Snapshot of the previous filter values — used to detect changes for page reset
  const prevFiltersRef = useRef<F>({ ...initialFilters });

  /** Update a single filter key */
  const setFilter = useCallback((key: keyof F, val: any) => {
    setFilterParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  /** Bulk-update multiple filter keys at once */
  const setFilters = useCallback((partial: Partial<F>) => {
    setFilterParams((prev) => ({ ...prev, ...partial }));
  }, []);

  /** Reset all filters to defaults (or a custom override) */
  const resetFilters = useCallback((defaults?: Partial<F>) => {
    const next = { ...initialFilters, ...defaults } as F;
    setFilterParams(next);
    prevFiltersRef.current = next;
    setPage(initialPage);
  }, [initialFilters, initialPage]);

  /**
   * Checks whether filterParams changed since the last time syncPage was called.
   * If yes, resets page to 1 and returns activePage = 1.
   * If no, returns the current page as activePage.
   *
   * Intended to be called at the top of your fetch effect.
   */
  const syncPage = useCallback((): { activePage: number } => {
    const changed = Object.keys(filterParams).some(
      (k) => filterParams[k] !== prevFiltersRef.current[k]
    );
    if (changed) {
      prevFiltersRef.current = { ...filterParams };
      setPage(1);
      return { activePage: 1 };
    }
    return { activePage: page };
  }, [filterParams, page]);

  /** Returns non-empty filter params merged with current pagination */
  const getApiParams = useCallback((): Partial<F> & { page: number; limit: number } => {
    return { ...cleanParams(filterParams), page, limit } as Partial<F> & { page: number; limit: number };
  }, [filterParams, page, limit]);

  return {
    filterParams,
    setFilter,
    setFilters,
    resetFilters,
    page,
    setPage,
    limit,
    setLimit,
    getApiParams,
    syncPage,
  };
}
