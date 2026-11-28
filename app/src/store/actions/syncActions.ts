import {
  fetchMasterStatesAction,
  fetchMasterDistrictsAction,
  fetchMasterPcsAction,
  fetchMasterAcsAction,
  fetchMasterWardsAction,
  fetchMasterBoothsAction,
  fetchMasterPartiesAction,
  fetchMasterReligionsAction,
  fetchMasterCastesAction,
  fetchMasterTalukasAction,
  fetchMasterVillagesAction,
  fetchMasterProfessionCategoriesAction,
  fetchMasterProfessionsAction,
} from './master';
import { AppDispatch } from '../store';
import apiClient from '../../api/apiClient';
import { clearLocalVersions, getLocalVersions, saveLocalVersion } from '../../utils/syncManager';

export const checkAndSyncDatasetsAction = () => {
  return async (dispatch: AppDispatch) => {
      try {
        const clientVersions = await getLocalVersions();

        // Call Sync Manifest Endpoint
        const res = await apiClient.post('/sync/manifest', { clientVersions });
        const payload = res?.data?.data || res?.data || {};
        const { requiresSync, staleApis } = payload;

        if (!requiresSync || !Array.isArray(staleApis) || staleApis.length === 0) {
          return { syncedCount: 0, requiresSync: false };
        }

        let syncedCount = 0;

        // Dispatch thunks for stale datasets and update local storage atomically
        for (const item of staleApis) {
          let success = false;

          switch (item.key) {
            case 'states':
              await (fetchMasterStatesAction() as any)(dispatch);
              success = true;
              break;
            case 'districts':
              await (fetchMasterDistrictsAction() as any)(dispatch);
              success = true;
              break;
            case 'pcs':
              await (fetchMasterPcsAction() as any)(dispatch);
              success = true;
              break;
            case 'acs':
              await (fetchMasterAcsAction() as any)(dispatch);
              success = true;
              break;
            case 'wards':
              await (fetchMasterWardsAction() as any)(dispatch);
              success = true;
              break;
            case 'booths':
              await (fetchMasterBoothsAction() as any)(dispatch);
              success = true;
              break;
            case 'parties':
              await (fetchMasterPartiesAction() as any)(dispatch);
              success = true;
              break;
            case 'religions':
              await (fetchMasterReligionsAction() as any)(dispatch);
              success = true;
              break;
            case 'castes':
              await (fetchMasterCastesAction() as any)(dispatch);
              success = true;
              break;
            case 'talukas':
              await (fetchMasterTalukasAction() as any)(dispatch);
              success = true;
              break;
            case 'villages':
              await (fetchMasterVillagesAction() as any)(dispatch);
              success = true;
              break;
            case 'profession-categories':
            case 'professionCategories':
              await (fetchMasterProfessionCategoriesAction() as any)(dispatch);
              success = true;
              break;
            case 'professions':
              await (fetchMasterProfessionsAction() as any)(dispatch);
              success = true;
              break;
          }

          if (success && item.serverVersion) {
            await saveLocalVersion(item.key, item.serverVersion);
            syncedCount++;
          }
        }

        return { syncedCount, requiresSync: true };
      } catch (e) {
        console.warn('Sync manifest check degraded. Proceeding with standard flow.', e);
        return { syncedCount: 0, requiresSync: false, error: e };
      }
    };
  };

/**
 * Single-call Redis-backed bootstrap sync for profile switches and fresh tenant sessions.
 * Clears local dataset versions and hydrates fresh master data from Redis.
 */
export const bootstrapTenantSyncAction = () => {
  return async (dispatch: AppDispatch) => {
    try {
      await clearLocalVersions();
      const res = await apiClient.post('/sync/bootstrap', { clientVersions: {} });
      const payload = res?.data?.data || res?.data || {};
      const { syncedDatasets = [], serverVersions = {} } = payload;

      for (const key of syncedDatasets) {
        if (serverVersions[key]) {
          await saveLocalVersion(key, serverVersions[key]);
        }
      }

      // Also ensure Redux master stores are hydrated cleanly
      await (checkAndSyncDatasetsAction() as any)(dispatch);
      return { syncedDatasets, serverVersions };
    } catch (e) {
      console.warn('Bootstrap tenant sync degraded. Falling back to manifest sync.', e);
      return await (checkAndSyncDatasetsAction() as any)(dispatch);
    }
  };
};
