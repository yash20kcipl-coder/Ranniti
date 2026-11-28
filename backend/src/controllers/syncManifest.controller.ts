import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { attachFileUrls } from '../utils/fileUrl';
import { SyncManifestService } from '../services/syncManifest.service';
import { tenantApiService } from '../services/tenant/tenantApi.service';
import { query as masterQuery } from '../queries/dbPool';

export interface SyncApiMetadata {
  endpoint: string;
  reduxAction: string;
}

export const REGISTERED_SYNC_APIS: Record<string, SyncApiMetadata> = {
  states: { endpoint: '/tenant/states', reduxAction: 'fetchMasterStates' },
  districts: { endpoint: '/tenant/districts', reduxAction: 'fetchMasterDistricts' },
  pcs: { endpoint: '/tenant/pcs', reduxAction: 'fetchMasterPcs' },
  acs: { endpoint: '/tenant/acs', reduxAction: 'fetchMasterAcs' },
  talukas: { endpoint: '/tenant/talukas', reduxAction: 'fetchMasterTalukas' },
  villages: { endpoint: '/tenant/villages', reduxAction: 'fetchMasterVillages' },
  wards: { endpoint: '/tenant/wards', reduxAction: 'fetchMasterWards' },
  booths: { endpoint: '/tenant/booths', reduxAction: 'fetchMasterBooths' },
  parties: { endpoint: '/tenant/parties', reduxAction: 'fetchMasterParties' },
  religions: { endpoint: '/tenant/religions', reduxAction: 'fetchMasterReligions' },
  castes: { endpoint: '/tenant/castes', reduxAction: 'fetchMasterCastes' },
  professionCategories: { endpoint: '/tenant/profession-categories', reduxAction: 'fetchMasterProfessionCategories' },
  professions: { endpoint: '/tenant/professions', reduxAction: 'fetchMasterProfessions' },
  tenantSettings: { endpoint: '/tenant/settings', reduxAction: 'fetchTenantSettings' },
  userRoles: { endpoint: '/tenant/user-roles', reduxAction: 'fetchUserRoles' },
};

export class SyncManifestController {
  private async resolveTenantContext(req: Request): Promise<{ tenantId?: string; tenantDbName?: string }> {
    let tenantId: string | undefined =
      (req as any).tenantId || (req as any).user?.tenantId || (req as any).mobileUser?.tenantId;
    const tenantDbName: string | undefined =
      (req as any).user?.tenantDbName || (req as any).mobileUser?.tenantDbName || (req as any).tenantDbName;

    if (!tenantId && tenantDbName) {
      try {
        const res = await masterQuery(
          `SELECT id FROM tenants WHERE tenant_db_name = $1 LIMIT 1`,
          [tenantDbName]
        );
        tenantId = res.rows[0]?.id;
      } catch {
        // Non-blocking
      }
    }

    return { tenantId, tenantDbName };
  }

  /**
   * Compare client dataset versions with central Redis versions in O(1)
   */
  getSyncManifest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tenantId } = await this.resolveTenantContext(req);
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

  /**
   * Single-call Redis-backed bootstrap sync for mobile profile switches & cold starts.
   * Fetches only stale datasets (or all requested datasets) for the active tenant.
   */
  bootstrapSync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tenantId, tenantDbName } = await this.resolveTenantContext(req);
    const userId: string = (req as any).user?.userId || (req as any).mobileUser?.id || '';
    const assignedAcId: string | undefined = (req as any).user?.assignedAcId || (req as any).mobileUser?.assignedAcId || undefined;
    const clientVersions: Record<string, number> = req.body.clientVersions || {};
    const requestedDatasets: string[] | undefined = Array.isArray(req.body.datasets) ? req.body.datasets : undefined;

    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant context is required for bootstrap sync', 400).body);
      return;
    }

    const serverVersions = await SyncManifestService.getManifestVersions(tenantId);

    const DEFAULT_MOBILE_DATASETS = [
      'acs',
      'wards',
      'booths',
      'parties',
      'religions',
      'castes',
      'professionCategories',
      'professions',
    ];

    const candidateKeys = requestedDatasets || DEFAULT_MOBILE_DATASETS;
    const staleKeys = candidateKeys.filter((key) => {
      const serverVer = serverVersions[key] || 1;
      const clientVer = clientVersions[key] || 0;
      return clientVer < serverVer;
    });

    const data: Record<string, any> = {};

    await Promise.allSettled(
      staleKeys.map(async (key) => {
        switch (key) {
          case 'acs': {
            const result = await tenantApiService.getTenantAcs(userId, {}, tenantDbName);
            data.acs = typeof result === 'object' && 'acs' in result ? (result as any).acs : result;
            break;
          }
          case 'wards': {
            const result = await tenantApiService.getTenantWards(userId, { acId: assignedAcId }, tenantDbName);
            data.wards = typeof result === 'object' && 'wards' in result ? (result as any).wards : result;
            break;
          }
          case 'booths': {
            data.booths = await tenantApiService.getTenantBoothOptions(userId, { acId: assignedAcId }, tenantDbName);
            break;
          }
          case 'parties': {
            const parties = await tenantApiService.getTenantParties(tenantDbName);
            data.parties = attachFileUrls(parties, ['symbolLogo'], req);
            break;
          }
          case 'religions': {
            data.religions = await tenantApiService.getTenantReligions(tenantDbName);
            break;
          }
          case 'castes': {
            data.castes = await tenantApiService.getTenantCastes(tenantDbName);
            break;
          }
          case 'professionCategories': {
            data.professionCategories = await tenantApiService.getTenantProfessionCategories(tenantDbName);
            break;
          }
          case 'professions': {
            data.professions = await tenantApiService.getTenantProfessions(tenantDbName);
            break;
          }
          default:
            break;
        }
      })
    );

    const response = ApiResponse.success(
      {
        tenantDbName,
        syncedDatasets: Object.keys(data),
        serverVersions,
        data,
      },
      'Bootstrap sync completed successfully'
    );
    res.status(response.statusCode).json(response.body);
  });
}

export const syncManifestController = new SyncManifestController();
