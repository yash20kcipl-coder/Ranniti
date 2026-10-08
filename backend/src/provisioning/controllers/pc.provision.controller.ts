import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { PcProvisionService } from '../services/pc.provision.service';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class PcProvisionController {
  /**
   * POST /provisioning/:tenantId/parliamentary-constituencies/sync
   * Syncs parliamentary constituencies for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await PcProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'Parliamentary constituencies synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/parliamentary-constituencies/stats
   * Retrieves master vs tenant sync stats for parliamentary constituencies
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const { resolvedPcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await PcProvisionService.getStats(pool, resolvedPcIds);
      const response = ApiResponse.success(stats, 'Parliamentary constituencies stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const pcProvisionController = new PcProvisionController();
