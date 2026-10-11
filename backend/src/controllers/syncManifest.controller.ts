import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { SyncManifestService } from '../services/syncManifest.service';

export interface SyncApiMetadata {
  endpoint: string;
  reduxAction: string;
}

export const REGISTERED_SYNC_APIS: Record<string, SyncApiMetadata> = {
  religions: { endpoint: '/api/v1/tenant/religions', reduxAction: 'fetchMasterReligions' },
  castes: { endpoint: '/api/v1/tenant/castes', reduxAction: 'fetchMasterCastes' },
  states: { endpoint: '/api/v1/tenant/states', reduxAction: 'fetchMasterStates' },
  districts: { endpoint: '/api/v1/tenant/districts', reduxAction: 'fetchMasterDistricts' },
  acs: { endpoint: '/api/v1/tenant/acs', reduxAction: 'fetchMasterAcs' },
  pcs: { endpoint: '/api/v1/tenant/pcs', reduxAction: 'fetchMasterPcs' },
  tenantSettings: { endpoint: '/api/v1/tenant/settings', reduxAction: 'fetchTenantSettings' },
  userRoles: { endpoint: '/api/v1/tenant/user-roles', reduxAction: 'fetchUserRoles' },
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

    for (const [key, meta] of Object.entries(REGISTERED_SYNC_APIS)) {
      const serverVer = serverVersions[key] || 1;
      const clientVer = clientVersions[key] || 0;

      if (clientVer < serverVer) {
        staleApis.push({
          key,
          endpoint: meta.endpoint,
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
