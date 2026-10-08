import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { TalukaProvisionService } from '../services/taluka.provision.service';

export class TalukaProvisionController {
  /**
   * POST /provisioning/:tenantId/talukas/sync
   * Syncs talukas table for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await TalukaProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'Talukas table synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/talukas/stats
   * Retrieves master vs tenant sync stats for talukas table
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await TalukaProvisionService.getStats(pool);
      const response = ApiResponse.success(stats, 'Talukas table stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const talukaProvisionController = new TalukaProvisionController();
