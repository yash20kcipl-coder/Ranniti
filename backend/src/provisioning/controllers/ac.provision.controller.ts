import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { AcProvisionService } from '../services/ac.provision.service';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class AcProvisionController {
  /**
   * POST /provisioning/:tenantId/assembly-constituencies/sync
   * Syncs assembly constituencies for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const result = await AcProvisionService.syncForTenant(tenantId);
    const response = ApiResponse.success(result, 'Assembly constituencies synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/assembly-constituencies/stats
   * Retrieves master vs tenant sync stats for assembly constituencies
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const { resolvedAcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await AcProvisionService.getStats(pool, resolvedAcIds);
      const response = ApiResponse.success(stats, 'Assembly constituencies stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const acProvisionController = new AcProvisionController();
