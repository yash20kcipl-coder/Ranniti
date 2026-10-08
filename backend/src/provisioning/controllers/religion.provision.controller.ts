import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { ReligionProvisionService } from '../services/religion.provision.service';

export class ReligionProvisionController {
  /**
   * POST /provisioning/:tenantId/religions/sync
   * Syncs religions table for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await ReligionProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'Religions table synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/religions/stats
   * Retrieves master vs tenant sync stats for religions table
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await ReligionProvisionService.getStats(pool);
      const response = ApiResponse.success(stats, 'Religions table stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const religionProvisionController = new ReligionProvisionController();
