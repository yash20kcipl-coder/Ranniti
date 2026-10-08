import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { VoterProvisionService } from '../services/voter.provision.service';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class VoterProvisionController {
  /**
   * POST /provisioning/:tenantId/voters/sync
   * Initiates voter sync/resync for the given tenant
   */
  sync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    const { truncate } = req.body;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    // Run async in background to prevent request timeout on large voter counts
    VoterProvisionService.syncForTenant(tenantId, Boolean(truncate)).catch(() => {});

    const response = ApiResponse.success(
      { tenantId, status: 'voter_sync_initiated' },
      'Voter sync process initiated in background',
      202
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /provisioning/:tenantId/voters/stats
   * Retrieves master vs tenant sync stats for voters
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const { resolvedAcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const stats = await VoterProvisionService.getStats(pool, resolvedAcIds);
      const response = ApiResponse.success(stats, 'Voters stats retrieved');
      res.status(response.statusCode).json(response.body);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

export const voterProvisionController = new VoterProvisionController();
