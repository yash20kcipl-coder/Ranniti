import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantSyncService } from '../../services/superAdmin/tenantSync.service';

export class TenantSyncController {
  /**
   * GET /super-admin/tenants/:id/db-sync-status
   * Returns a comprehensive sync health report for the given tenant's database:
   * - Schema completeness (missing tables, column drift)
   * - Voter count parity (master AC voters vs tenant DB voters)
   * - Lookup table row count parity (states, districts, castes, parties, etc.)
   */
  getDbSyncStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!id) {
      throw new ApiError(400, 'Tenant ID is required');
    }

    const syncStatus = await TenantSyncService.checkDbSyncStatus(id);
    const response = ApiResponse.success(syncStatus, 'Tenant DB sync status retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantSyncController = new TenantSyncController();
