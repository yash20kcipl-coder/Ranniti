import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantSyncService } from '../../services/superAdmin/tenantSync.service';
import { MasterVoterSyncQueueService } from '../../services/sync/masterVoterSyncQueue.service';

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

  /**
   * POST /super-admin/tenants/:id/reconcile-lookups
   * Reconciles all 13 master lookup tables in the tenant DB against Master DB
   */
  reconcileLookups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!id) {
      throw new ApiError(400, 'Tenant ID is required');
    }

    const syncStatus = await TenantSyncService.reconcileTenantLookups(id);
    const response = ApiResponse.success(syncStatus, 'Master lookup tables reconciled successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /super-admin/tenants/sync-queue
   * Returns paginated list of voter sync queue jobs
   */
  getSyncQueueJobs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status, tenantId, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const data = await MasterVoterSyncQueueService.getQueueJobs({
      status: status as string,
      tenantId: tenantId as string,
      limit: limitNum,
      offset,
    });

    const response = ApiResponse.success(
      {
        jobs: data.jobs,
        total: data.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(data.total / limitNum),
      },
      'Sync queue jobs retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /super-admin/tenants/sync-queue/:jobId/retry
   * Manually re-triggers a specific failed or retrying job
   */
  retrySyncQueueJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const jobId = req.params.jobId as string;
    if (!jobId) {
      throw new ApiError(400, 'Job ID is required');
    }

    const success = await MasterVoterSyncQueueService.retryJob(jobId);
    if (!success) {
      throw new ApiError(404, `Sync queue job '${jobId}' not found`);
    }

    const response = ApiResponse.success({ jobId, status: 'pending' }, 'Sync job queued for retry');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /super-admin/tenants/sync-queue/retry-all-failed
   * Bulk retries all failed sync queue jobs
   */
  retryAllFailedSyncQueueJobs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const count = await MasterVoterSyncQueueService.retryAllFailed();
    const response = ApiResponse.success({ retriedCount: count }, `${count} failed sync jobs queued for retry`);
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantSyncController = new TenantSyncController();
