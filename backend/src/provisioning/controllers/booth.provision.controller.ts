import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';
import { BoothProvisionService } from '../services/booth.provision.service';

export class BoothProvisionController {
  /**
   * POST /provisioning/:tenantId/booths/sync
   * Syncs polling booths for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await BoothProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'Booths synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/booths/stats
   * Retrieves master vs tenant sync stats for booths
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const { resolvedAcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await BoothProvisionService.getStats(pool, resolvedAcIds);
      const response = ApiResponse.success(stats, 'Booths stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => { });
    }
  });
}

export const boothProvisionController = new BoothProvisionController();
