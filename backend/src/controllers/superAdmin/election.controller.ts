import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ElectionSyncService } from '../../services/superAdmin/electionSync.service';
import { superAdminElectionQueries } from '../../queries/superAdminElection.queries';

export class SuperAdminElectionController {
  /**
   * GET /api/v1/super-admin/elections
   * Paginated list of master elections with search, filter, and tenant assignment metrics
   */
  getElections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, status, electionType, stateId, pcId, acId, page, limit } = req.query;

    const result = await superAdminElectionQueries.getSuperAdminElections({
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
      electionType: typeof electionType === 'string' ? electionType : undefined,
      stateId: typeof stateId === 'string' ? stateId : undefined,
      pcId: typeof pcId === 'string' ? pcId : undefined,
      acId: typeof acId === 'string' ? acId : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    const response = ApiResponse.success(result, 'Master elections retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/super-admin/elections/options
   * Lightweight election dropdown options
   */
  getElectionOptions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const options = await superAdminElectionQueries.getElectionOptions();
    const response = ApiResponse.success(options, 'Election options retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/super-admin/elections/:id
   * Single master election with detailed assigned tenants
   */
  getElectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!id) throw new ApiError(400, 'Election ID is required');

    const election = await superAdminElectionQueries.getSuperAdminElectionById(id);
    if (!election) throw new ApiError(404, 'Election not found');

    const response = ApiResponse.success(election, 'Election details retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/super-admin/elections
   * Create new Master Election and optionally sync to assigned tenants
   */
  createElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      name,
      electionCode,
      electionType,
      electionDate,
      countingDate,
      stateId,
      pcId,
      acId,
      isActive,
      status,
      totalVotersSnapshot,
      targetVotes,
      description,
      tenantIds,
    } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, 'Election name is required');
    }
    if (!electionDate) {
      throw new ApiError(400, 'Election polling date is required');
    }

    const assignedByUserId = (req as any).user?.id || (req as any).adminUser?.id;

    const created = await superAdminElectionQueries.createSuperAdminElection(
      {
        name,
        electionCode,
        electionType,
        electionDate,
        countingDate,
        stateId,
        pcId,
        acId,
        isActive,
        status,
        totalVotersSnapshot,
        targetVotes,
        description,
        tenantIds: Array.isArray(tenantIds) ? tenantIds : undefined,
      },
      assignedByUserId
    );

    // If assigned to tenants, replicate the new election to each assigned tenant DB
    if (created && Array.isArray(tenantIds) && tenantIds.length > 0) {
      ElectionSyncService.syncElectionToAllAssignedTenants(created.id).catch((err) => {
        console.error('[SuperAdminElectionController] Background sync error after create:', err);
      });
    }

    const response = ApiResponse.success(created, 'Master election created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/super-admin/elections/:id
   * Update Master Election and replicate changes to all assigned tenant DBs
   */
  updateElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!id) throw new ApiError(400, 'Election ID is required');

    const existing = await superAdminElectionQueries.getSuperAdminElectionById(id);
    if (!existing) throw new ApiError(404, 'Election not found');

    const assignedByUserId = (req as any).user?.id || (req as any).adminUser?.id;

    const updated = await superAdminElectionQueries.updateSuperAdminElection(
      id,
      req.body,
      assignedByUserId
    );
    if (!updated) throw new ApiError(500, 'Failed to update election');

    // Auto-sync changes to all assigned tenant databases in background
    ElectionSyncService.syncElectionToAllAssignedTenants(id).catch((err) => {
      console.error('[SuperAdminElectionController] Background sync error after update:', err);
    });

    const response = ApiResponse.success(updated, 'Master election updated and synced successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * DELETE /api/v1/super-admin/elections/:id
   * Delete Master Election
   */
  deleteElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!id) throw new ApiError(400, 'Election ID is required');

    // Get assigned tenants before deleting
    const assignedTenants = await superAdminElectionQueries.getAssignedTenantsForElection(id);

    const deleted = await superAdminElectionQueries.deleteSuperAdminElection(id);
    if (!deleted) throw new ApiError(404, 'Election not found or already deleted');

    // Remove or archive in all previously assigned tenant DBs
    for (const tenant of assignedTenants) {
      ElectionSyncService.removeElectionFromTenantDb(tenant.tenantDbName, id).catch((err) => {
        console.error(`[SuperAdminElectionController] Failed to remove election from '${tenant.tenantDbName}':`, err);
      });
    }

    const response = ApiResponse.success({ id }, 'Master election deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/super-admin/elections/:id/assign
   * Assign election to one or more tenants
   */
  assignToTenants = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { tenantIds } = req.body;

    if (!id) throw new ApiError(400, 'Election ID is required');
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      throw new ApiError(400, 'Array of tenant IDs is required');
    }

    const election = await superAdminElectionQueries.getSuperAdminElectionById(id);
    if (!election) throw new ApiError(404, 'Election not found');

    const assignedByUserId = (req as any).user?.id || (req as any).adminUser?.id;
    const count = await superAdminElectionQueries.assignElectionToTenants(id, tenantIds, assignedByUserId);

    // Sync to each newly assigned tenant database
    ElectionSyncService.syncElectionToAllAssignedTenants(id).catch((err) => {
      console.error('[SuperAdminElectionController] Sync error after tenant assignment:', err);
    });

    const updated = await superAdminElectionQueries.getSuperAdminElectionById(id);
    const response = ApiResponse.success(
      { assignedCount: count, election: updated },
      `Election assigned to ${count} tenant(s) successfully`
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/super-admin/elections/:id/unassign
   * Unassign election from a tenant
   */
  unassignTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { tenantId, tenantDbName } = req.body;

    if (!id) throw new ApiError(400, 'Election ID is required');
    if (!tenantId) throw new ApiError(400, 'Tenant ID is required');

    const unassigned = await superAdminElectionQueries.unassignElectionFromTenant(id, tenantId);
    if (!unassigned) {
      throw new ApiError(404, 'Assignment not found');
    }

    // Safely remove or archive in tenant DB
    if (tenantDbName) {
      ElectionSyncService.removeElectionFromTenantDb(tenantDbName, id).catch((err) => {
        console.error(`[SuperAdminElectionController] Unassign cleanup error:`, err);
      });
    }

    const updated = await superAdminElectionQueries.getSuperAdminElectionById(id);
    const response = ApiResponse.success(updated, 'Election unassigned from tenant successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const superAdminElectionController = new SuperAdminElectionController();
