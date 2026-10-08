import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { VillageProvisionService } from '../services/village.provision.service';

export class VillageProvisionController {
  /**
   * POST /provisioning/:tenantId/villages/sync
   * Syncs villages table for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await VillageProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'Villages table synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/villages/stats
   * Retrieves master vs tenant sync stats for villages table
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await VillageProvisionService.getStats(pool);
      const response = ApiResponse.success(stats, 'Villages table stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const villageProvisionController = new VillageProvisionController();
