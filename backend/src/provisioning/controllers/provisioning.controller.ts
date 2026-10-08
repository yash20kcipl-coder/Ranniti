import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { tenantProvisioningService } from '../services/tenantProvisioning.service';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class ProvisioningController {
  /**
   * GET /provisioning/:tenantId/status
   * Get real-time tenant provisioning status and progress
   */
  getStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) {
      throw new ApiError(400, 'Tenant ID is required');
    }

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    const statusData = {
      id: tenant.id,
      tenantDbName: tenant.tenantDbName,
      provisioningStatus: tenant.status,
      provisioningProgress: tenant.provisioningProgress,
      totalVotersCopied: tenant.totalVotersCopied,
      currentStep: tenant.currentStep,
      currentPhase: tenant.currentPhase || 'init',
      activeTable: tenant.activeTable || null,
      processedRecords: tenant.processedRecords || 0,
      totalRecords: tenant.totalRecords || 0,
      errorMessage: tenant.errorMessage || null,
      updatedAt: tenant.updatedAt,
    };

    const response = ApiResponse.success(statusData, 'Tenant provisioning status retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /provisioning/:tenantId/start
   * Triggers or re-triggers full tenant DB provisioning
   */
  startProvisioning = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    if (!tenantId) {
      throw new ApiError(400, 'Tenant ID is required');
    }

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    const { resolvedAcIds, resolvedPcIds } = await resolveConstituencyScope(
      tenant.acIds || [],
      tenant.pcIds || []
    );

    // Fire provisioning asynchronously
    tenantProvisioningService
      .provisionTenantDataAsync(tenant.id, tenant.tenantDbName, resolvedAcIds, resolvedPcIds)
      .catch((err) => {
        // error handling inside service updates tenant status
      });

    const response = ApiResponse.success(
      { tenantId: tenant.id, status: 'provisioning' },
      'Provisioning process initiated successfully',
      202
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /provisioning/:tenantId/sync-incremental
   * Syncs new ACs/PCs added to an existing tenant
   */
  syncIncremental = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    const { newAcIds, pcIds } = req.body;

    if (!tenantId) {
      throw new ApiError(400, 'Tenant ID is required');
    }
    if (!Array.isArray(newAcIds) || newAcIds.length === 0) {
      throw new ApiError(400, 'Array of newAcIds is required for incremental sync');
    }

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    tenantProvisioningService
      .syncNewAcVoters(tenant.id, tenant.tenantDbName, newAcIds, pcIds || [])
      .catch(() => {});

    const response = ApiResponse.success(
      { tenantId: tenant.id, newAcIds },
      'Incremental sync initiated successfully',
      202
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /provisioning/:tenantId/remove-constituencies
   * Removes de-scoped AC data from tenant DB
   */
  removeConstituencies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params.tenantId as string;
    const { removedAcIds } = req.body;

    if (!tenantId) {
      throw new ApiError(400, 'Tenant ID is required');
    }
    if (!Array.isArray(removedAcIds) || removedAcIds.length === 0) {
      throw new ApiError(400, 'Array of removedAcIds is required');
    }

    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    tenantProvisioningService
      .removeAcVoters(tenant.id, tenant.tenantDbName, removedAcIds)
      .catch(() => {});

    const response = ApiResponse.success(
      { tenantId: tenant.id, removedAcIds },
      'Constituency data removal initiated successfully',
      202
    );
    res.status(response.statusCode).json(response.body);
  });
}

export const provisioningController = new ProvisioningController();
