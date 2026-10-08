import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { StateProvisionService } from '../services/state.provision.service';

export class StateProvisionController {
  /**
   * POST /provisioning/:tenantId/states/sync
   * Syncs states table for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await StateProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'States table synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/states/stats
   * Retrieves master vs tenant sync stats for states table
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await StateProvisionService.getStats(pool);
      const response = ApiResponse.success(stats, 'States table stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const stateProvisionController = new StateProvisionController();
