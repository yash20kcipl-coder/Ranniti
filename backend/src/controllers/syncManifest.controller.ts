import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { SyncManifestService } from '../services/syncManifest.service';

export interface SyncApiMetadata {
  endpoint: string;
  reduxAction: string;
}

export const REGISTERED_SYNC_APIS: Record<string, SyncApiMetadata> = {
  religions: { endpoint: '/tenant/religions', reduxAction: 'fetchMasterReligions' },
  castes: { endpoint: '/tenant/castes', reduxAction: 'fetchMasterCastes' },
  states: { endpoint: '/tenant/states', reduxAction: 'fetchMasterStates' },
  districts: { endpoint: '/tenant/districts', reduxAction: 'fetchMasterDistricts' },
  acs: { endpoint: '/tenant/acs', reduxAction: 'fetchMasterAcs' },
  pcs: { endpoint: '/tenant/pcs', reduxAction: 'fetchMasterPcs' },
  tenantSettings: { endpoint: '/tenant/settings', reduxAction: 'fetchTenantSettings' },
  userRoles: { endpoint: '/tenant/user-roles', reduxAction: 'fetchUserRoles' },
};

export class SyncManifestController {
  /**
   * Compare client dataset versions with central Redis versions in O(1)
   */
  getSyncManifest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).mobileUser?.tenantId;
    const clientVersions: Record<string, number> = req.body.clientVersions || {};

    const serverVersions = await SyncManifestService.getManifestVersions(tenantId);

    const staleApis: Array<{
      key: string;
      endpoint: string;
      serverVersion: number;
      reduxAction: string;
    }> = [];

    const isMobileUser = !['tenant_admin', 'super_admin'].includes((req as any).user?.role);

    for (const [key, meta] of Object.entries(REGISTERED_SYNC_APIS)) {
      const serverVer = serverVersions[key] || 1;
      const clientVer = clientVersions[key] || 0;

      if (clientVer < serverVer) {
        // If mobile field role, point to mobile master endpoint
        const endpoint = isMobileUser ? meta.endpoint.replace('/tenant', '/mobile/masters') : meta.endpoint;
        staleApis.push({
          key,
          endpoint,
          serverVersion: serverVer,
          reduxAction: meta.reduxAction,
        });
      }
    }

    const response = ApiResponse.success(
      {
        requiresSync: staleApis.length > 0,
        staleCount: staleApis.length,
        staleApis,
        serverVersions,
      },
      'Sync manifest generated successfully'
    );

    res.status(response.statusCode).json(response.body);
  });
}

export const syncManifestController = new SyncManifestController();
