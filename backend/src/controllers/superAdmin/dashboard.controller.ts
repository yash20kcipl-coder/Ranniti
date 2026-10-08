import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { SuperAdminDashboardService } from '../../services/superAdmin/superAdminDashboard.service';

export class SuperAdminDashboardController {
  /**
   * GET /api/v1/super-admin/dashboard/metrics
   * Retrieves platform KPIs, electoral metrics, pool health, recent tenants, and summary.
   */
  getPlatformMetrics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await SuperAdminDashboardService.getPlatformMetrics(req);
    const response = ApiResponse.success(data, 'Super Admin dashboard metrics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/super-admin/dashboard/imports
   * Retrieves active and completed background bulk import jobs.
   */
  getImportJobs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const jobs = SuperAdminDashboardService.getImportJobs();
    const response = ApiResponse.success(jobs, 'Active bulk import jobs retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/super-admin/dashboard/audit-feed
   * Retrieves recent administrative and platform audit events.
   */
  getAuditFeed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
    const feed = await SuperAdminDashboardService.getAuditFeed(limit);
    const response = ApiResponse.success(feed, 'Audit feed retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const superAdminDashboardController = new SuperAdminDashboardController();
