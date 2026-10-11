import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_VERSIONS_KEY = '@RANNITI_DATASET_VERSIONS';

/**
 * Retrieve client stored dataset versions
 */
export const getLocalVersions = async (): Promise<Record<string, number>> => {
  try {
    const raw = await AsyncStorage.getItem(SYNC_VERSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Save updated version for a dataset key atomically
 */
export const saveLocalVersion = async (key: string, version: number): Promise<void> => {
  try {
    const versions = await getLocalVersions();
    versions[key] = version;
    await AsyncStorage.setItem(SYNC_VERSIONS_KEY, JSON.stringify(versions));
  } catch (error) {
    console.warn(`Failed to save dataset version for ${key}:`, error);
  }
};

/**
 * Clear dataset versions (e.g. on logout or tenant change)
 */
export const clearLocalVersions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SYNC_VERSIONS_KEY);
  } catch (error) {
    console.warn('Failed to clear dataset versions:', error);
  }
};
