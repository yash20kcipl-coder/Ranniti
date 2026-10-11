const SYNC_VERSIONS_KEY = 'RANNITI_DATASET_VERSIONS';

/**
 * Retrieve client stored dataset versions from localStorage
 */
export const getLocalVersions = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(SYNC_VERSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Save updated version for a dataset key atomically to localStorage
 */
export const saveLocalVersion = (key: string, version: number): void => {
  try {
    const versions = getLocalVersions();
    versions[key] = version;
    localStorage.setItem(SYNC_VERSIONS_KEY, JSON.stringify(versions));
  } catch (error) {
    console.warn(`Failed to save web dataset version for ${key}:`, error);
  }
};

/**
 * Clear stored versions (e.g. on logout or tenant change)
 */
export const clearLocalVersions = (): void => {
  try {
    localStorage.removeItem(SYNC_VERSIONS_KEY);
  } catch (error) {
    console.warn('Failed to clear web dataset versions:', error);
  }
};
