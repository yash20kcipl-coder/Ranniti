import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import apiClient from '../api/apiClient';
import appVersion, { isVersionLessThan } from '../utils/version';
import Storage, { STORAGE_KEYS } from '../utils/storage';
import { useState, useEffect, useCallback } from 'react';
import { SET_APP_VERSION } from '../store/reducers/appVersion';

export interface VersionStatus {
  status: 'loading' | 'allowed' | 'force-update' | 'recommended-update';
  storeUrl: string;
  latestVersion: string;
  /** The version of the currently installed app (from version.ts) */
  currentVersion: string;
}

/** Apply a version map to Redux, globalThis and AsyncStorage */
const applyVersionMap = async (
  versionMap: Record<string, any>,
  dispatch: (action: any) => void
) => {
  // 1. Redux
  dispatch({ type: SET_APP_VERSION, payload: versionMap });

  // 2. globalThis (instant access without Redux for Splash)
  (globalThis as any).appVersion = versionMap;

  // 3. AsyncStorage (persisted across launches)
  await Storage.save(STORAGE_KEYS.APP_VERSION, versionMap);
};

export const useVersionCheck = () => {
  const dispatch = useDispatch<any>();

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  // Current installed version from version.ts (the source of truth for this build)
  const currentVersion: string = appVersion[platform] ?? '0.0.1';

  const [versionStatus, setVersionStatus] = useState<VersionStatus>({
    status: 'loading',
    storeUrl: '',
    latestVersion: '',
    currentVersion,
  });

  const checkVersion = useCallback(async () => {
    try {
      // ── 1. Rehydrate from local storage first (so Splash shows a version immediately) ──
      const cached = await Storage.get(STORAGE_KEYS.APP_VERSION);
      if (cached && typeof cached === 'object') {
        dispatch({ type: SET_APP_VERSION, payload: cached });
        (globalThis as any).appVersion = cached;
      }

      // ── 2. Fetch fresh data from the API ──
      const response = await apiClient.get('/app-versions');

      if (response.data?.success && Array.isArray(response.data.data)) {
        const versionList: any[] = response.data.data;

        // Build platform-keyed map
        const versionMap: Record<string, any> = {};
        versionList.forEach((v) => {
          versionMap[v.platform] = {
            latestVersion: v.latestVersion,
            minVersion: v.minVersion,
            storeUrl: v.storeUrl,
            forceUpdate: v.forceUpdate,
          };
        });

        // Persist everywhere
        await applyVersionMap(versionMap, dispatch);

        const platformConfig = versionMap[platform];
        if (platformConfig) {
          const { minVersion, latestVersion, forceUpdate, storeUrl } = platformConfig;

          // Force update: installed version < minimum required version
          if (forceUpdate && isVersionLessThan(currentVersion, minVersion)) {
            setVersionStatus({ status: 'force-update', storeUrl, latestVersion, currentVersion });
            return;
          }

          // Recommended update: installed version < latest version
          if (isVersionLessThan(currentVersion, latestVersion)) {
            setVersionStatus({ status: 'recommended-update', storeUrl, latestVersion, currentVersion });
            return;
          }
        }
      }

      setVersionStatus({ status: 'allowed', storeUrl: '', latestVersion: '', currentVersion });
    } catch (error) {
      console.warn('⚠️ Version verification fetch failed:', error);
      // Fail open — network issues must not block the app
      setVersionStatus({ status: 'allowed', storeUrl: '', latestVersion: '', currentVersion });
    }
  }, [dispatch, currentVersion, platform]);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  return { ...versionStatus, checkVersion };
};
