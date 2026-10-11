import {
  fetchMasterStatesAction,
  fetchMasterDistrictsAction,
  fetchMasterPcsAction,
  fetchMasterAcsAction,
  fetchMasterPartiesAction,
  fetchMasterReligionsAction,
  fetchMasterCastesAction,
} from './master';
import { Dispatch } from 'redux';
import apiClient from '../../api/apiClient';
import { getLocalVersions, saveLocalVersion } from '../../utils/syncManager';

export const checkAndSyncDatasetsAction = () => {
  return async (dispatch: Dispatch) => {
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
