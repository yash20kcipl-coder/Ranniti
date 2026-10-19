import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { electionQueries } from '../../queries/election.queries';

export class TenantElectionController {
  /**
   * GET /api/v1/tenant/elections
   * Retrieve paginated list of tenant elections with filters
   */
  getElections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const { search, status, electionType, page, limit } = req.query;

    const result = await electionQueries.getTenantElections(pool, {
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
      electionType: typeof electionType === 'string' ? electionType : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    const response = ApiResponse.success(result, 'Elections retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/elections/:id
   * Retrieve single election by ID
   */
  getElectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const id = req.params.id as string;
    if (!id) {
      throw ApiError.badRequest('Election ID is required');
    }

    const election = await electionQueries.getTenantElectionById(pool, id);
    if (!election) {
      throw ApiError.notFound(`Election with ID '${id}' not found`);
    }

    const response = ApiResponse.success(election, 'Election details retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/elections
   * Create a new election
   */
  createElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const { name, electionDate, electionType, electionCode, countingDate, stateId, pcId, acId, isDefault, isActive, status, totalVotersSnapshot, targetVotes, description } = req.body;

    if (!name || !name.trim()) {
      throw ApiError.badRequest('Election name is required');
    }
    if (!electionDate) {
      throw ApiError.badRequest('Election polling date is required');
    }

    const created = await electionQueries.createTenantElection(pool, {
      name,
      electionDate,
      electionType,
      electionCode,
      countingDate,
      stateId,
      pcId,
      acId,
      isDefault: Boolean(isDefault),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      status,
      totalVotersSnapshot: totalVotersSnapshot ? parseInt(totalVotersSnapshot, 10) : 0,
      targetVotes: targetVotes ? parseInt(targetVotes, 10) : 0,
      description,
    });

    const response = ApiResponse.success(created, 'Election created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/tenant/elections/:id
   * Update an existing election
   */
  updateElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const id = req.params.id as string;
    if (!id) {
      throw ApiError.badRequest('Election ID is required');
    }

    const existing = await electionQueries.getTenantElectionById(pool, id);
    if (!existing) {
      throw ApiError.notFound(`Election with ID '${id}' not found`);
    }

    const updated = await electionQueries.updateTenantElection(pool, id, req.body);
    const response = ApiResponse.success(updated, 'Election updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PATCH /api/v1/tenant/elections/:id/set-default
   * Set target election as the single default campaign election
   */
  setDefaultElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const id = req.params.id as string;
    if (!id) {
      throw ApiError.badRequest('Election ID is required');
    }

    const updated = await electionQueries.setDefaultTenantElection(pool, id);
    if (!updated) {
      throw ApiError.notFound(`Election with ID '${id}' not found`);
    }

    const response = ApiResponse.success(updated, 'Default campaign election updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/elections/default
   * Retrieve active default election resolved by date hierarchy
   */
  getDefaultElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const defaultElection = await electionQueries.resolveDateBasedDefaultElection(pool);
    const response = ApiResponse.success(defaultElection, 'Default election retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/elections/sync-default
   * Synchronize default election and statuses based on today's date hierarchy
   */
  syncDefaultElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const synced = await electionQueries.syncTenantDefaultElection(pool);
    const response = ApiResponse.success(synced, 'Default election synchronized based on date successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * DELETE /api/v1/tenant/elections/:id
   * Delete an election
   */
  deleteElection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const id = req.params.id as string;
    if (!id) {
      throw ApiError.badRequest('Election ID is required');
    }

    const deleted = await electionQueries.deleteTenantElection(pool, id);
    if (!deleted) {
      throw ApiError.notFound(`Election with ID '${id}' not found`);
    }

    const response = ApiResponse.success(null, 'Election deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/elections/:id/voter-status
   * Fast single-tap voter status toggle
   */
  recordVoterStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const electionId = req.params.id as string;
    const { voterId, boothId, hasVoted } = req.body;

    if (!electionId || !voterId) {
      throw ApiError.badRequest('electionId and voterId are required');
    }

    const result = await electionQueries.recordVoterStatus(pool, {
      electionId,
      voterId,
      boothId,
      hasVoted: Boolean(hasVoted),
      markedByUserId: req.user?.userId,
    });

    const response = ApiResponse.success(result, 'Voter election status recorded successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * POST /api/v1/tenant/elections/:id/voter-status/batch
   * High-throughput batch sync for mobile workers / offline queue
   */
  batchSyncVoterStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const electionId = req.params.id as string;
    const { items } = req.body;

    if (!electionId || !Array.isArray(items)) {
      throw ApiError.badRequest('electionId and items array are required');
    }

    const result = await electionQueries.batchSyncVoterStatus(pool, electionId, items, req.user?.userId);
    const response = ApiResponse.success(result, `Batch sync completed (${result.syncedCount} records processed)`);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/elections/:id/turnout
   * Live booth turnout metrics from cache
   */
  getBoothTurnout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const electionId = req.params.id as string;
    const boothId = req.query.boothId ? (req.query.boothId as string) : undefined;

    const stats = await electionQueries.getBoothTurnout(pool, electionId, boothId);
    const response = ApiResponse.success(stats, 'Booth turnout retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/elections/:id/analytics/hourly
   * Hourly turnout surge distribution
   */
  getHourlyTurnoutAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = req.tenantPool;
    if (!pool) {
      throw ApiError.badRequest('Tenant database connection pool not initialized');
    }

    const electionId = req.params.id as string;
    const hourlyData = await electionQueries.getHourlyTurnoutAnalytics(pool, electionId);
    const response = ApiResponse.success(hourlyData, 'Hourly turnout analytics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantElectionController = new TenantElectionController();

