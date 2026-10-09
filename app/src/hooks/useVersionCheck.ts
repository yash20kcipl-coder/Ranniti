import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import apiClient from '../api/apiClient';
import Storage, { STORAGE_KEYS } from '../utils/storage';
import { useState, useEffect, useCallback } from 'react';
import { SET_APP_VERSION } from '../store/reducers/appVersion';
import appVersion, { isVersionLessThan } from '../utils/version';

export interface VersionStatus {
  status: 'loading' | 'allowed' | 'force-update' | 'recommended-update' | 'maintenance';
  storeUrl: string;
  latestVersion: string;
  minVersion: string;
  currentVersion: string;
  updateTitle?: string;
  updateMessage?: string;
  maintenanceMessage?: string;
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
  const currentVersion: string = appVersion[platform] ?? '1.0.0';

  const [versionStatus, setVersionStatus] = useState<VersionStatus>({
    status: 'loading',
    storeUrl: '',
    latestVersion: currentVersion,
    minVersion: currentVersion,
    currentVersion,
  });

  const checkVersion = useCallback(async () => {
    try {
      // ── 1. Rehydrate from local storage first ──
      const cached = await Storage.get(STORAGE_KEYS.APP_VERSION);
      if (cached && typeof cached === 'object') {
        dispatch({ type: SET_APP_VERSION, payload: cached });
        (globalThis as any).appVersion = cached;
      }

      // ── 2. Fetch fresh data from backend public API ──
      const response = await apiClient.get('/app-versions');

      if (response.data?.success && Array.isArray(response.data.data)) {
        const versionList: any[] = response.data.data;

        // Build platform-keyed map
        const versionMap: Record<string, any> = {};
        versionList.forEach((v) => {
          versionMap[v.platform] = {
            id: v.id,
            platform: v.platform,
            latestVersion: v.latestVersion,
            minVersion: v.minVersion,
            storeUrl: v.storeUrl,
            forceUpdate: v.forceUpdate,
            updateTitle: v.updateTitle,
            updateMessage: v.updateMessage,
            maintenanceMode: v.maintenanceMode,
            maintenanceMessage: v.maintenanceMessage,
          };
        });

        // Persist everywhere
        await applyVersionMap(versionMap, dispatch);

        const platformConfig = versionMap[platform];
        if (platformConfig) {
          const {
            minVersion,
            latestVersion,
            forceUpdate,
            storeUrl,
            updateTitle,
            updateMessage,
            maintenanceMode,
            maintenanceMessage,
          } = platformConfig;

          // 1. Maintenance Mode
          if (maintenanceMode) {
            setVersionStatus({
              status: 'maintenance',
              storeUrl,
              latestVersion,
              minVersion,
              currentVersion,
              updateTitle,
              updateMessage,
              maintenanceMessage: maintenanceMessage || 'Ranniti is currently undergoing scheduled maintenance.',
            });
            return;
          }

          // 2. Force Update (installed < minVersion OR global forceUpdate = true AND installed < latestVersion)
          const isBelowMin = isVersionLessThan(currentVersion, minVersion);
          const isBelowLatest = isVersionLessThan(currentVersion, latestVersion);

          if (isBelowMin || (forceUpdate && isBelowLatest)) {
            setVersionStatus({
              status: 'force-update',
              storeUrl,
              latestVersion,
              minVersion,
              currentVersion,
              updateTitle: updateTitle || 'App Update Required',
              updateMessage,
            });
            return;
          }

          // 3. Recommended / Soft Update
          if (isBelowLatest) {
            setVersionStatus({
              status: 'recommended-update',
              storeUrl,
              latestVersion,
              minVersion,
              currentVersion,
              updateTitle: updateTitle || 'New Version Available',
              updateMessage,
            });
            return;
          }
        }
      }

      setVersionStatus({
        status: 'allowed',
        storeUrl: '',
        latestVersion: currentVersion,
        minVersion: currentVersion,
        currentVersion,
      });
    } catch (error) {
      console.warn('⚠️ Version verification fetch failed:', error);
      // Fail open — network issues must not block app unless cached maintenance exists
      setVersionStatus({
        status: 'allowed',
        storeUrl: '',
        latestVersion: currentVersion,
        minVersion: currentVersion,
        currentVersion,
      });
    }
  }, [dispatch, currentVersion, platform]);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  return { ...versionStatus, checkVersion };
};
