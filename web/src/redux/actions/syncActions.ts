import api from '@/services/api';
import type { AppDispatch } from '../store';
import { fetchTenantMasterCategoryData } from './masterTenant';
import { fetchTenantSettings } from './settings';
import { fetchTenantUserRoles } from './role';
import { TENANT_MASTER_ENDPOINTS } from '@/hooks/useTenantMasterData';
import { getLocalVersions, saveLocalVersion } from '@/utils/syncManager';

export const checkAndSyncTenantDatasets = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const clientVersions = getLocalVersions();

      // Query Sync Manifest Endpoint
      const response = await api.post('/sync/manifest', { clientVersions });
      const payload = response.data?.data || response.data || {};
      const { requiresSync, staleApis } = payload;

      if (!requiresSync || !Array.isArray(staleApis) || staleApis.length === 0) {
        return { syncedCount: 0, requiresSync: false };
      }

      let syncedCount = 0;

      // Dispatch thunks for stale datasets and update localStorage atomically
      for (const item of staleApis) {
        const catKey = item.key;

        if (catKey === 'tenantSettings') {
          await dispatch(fetchTenantSettings(false));
          if (item.serverVersion) {
            saveLocalVersion(catKey, item.serverVersion);
            syncedCount++;
          }
          continue;
        }

        if (catKey === 'userRoles') {
          await dispatch(fetchTenantUserRoles());
          if (item.serverVersion) {
            saveLocalVersion(catKey, item.serverVersion);
            syncedCount++;
          }
          continue;
        }

        const rawEndpoint = TENANT_MASTER_ENDPOINTS[catKey as keyof typeof TENANT_MASTER_ENDPOINTS] || item.endpoint;
        const endpoint = rawEndpoint ? rawEndpoint.replace(/^\/?api\/v1/, '') : rawEndpoint;

        if (endpoint) {
          await dispatch(fetchTenantMasterCategoryData(catKey, endpoint, false));
          if (item.serverVersion) {
            saveLocalVersion(catKey, item.serverVersion);
            syncedCount++;
          }
        }
      }

      return { syncedCount, requiresSync: true };
    } catch (error) {
      console.warn('Web sync manifest check degraded. Proceeding with standard flow.', error);
      return { syncedCount: 0, requiresSync: false, error };
    }
  };
};
