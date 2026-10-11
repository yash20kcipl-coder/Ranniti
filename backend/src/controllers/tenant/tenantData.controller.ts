import { ApiError } from '../../utils/apiError';
import { Request, Response, NextFunction } from 'express';
import { tenantDataService } from '../../services/tenant/tenantData.service';
import { TenantDashboardService } from '../../services/tenant/tenantDashboard.service';

export class TenantDataController {
  /**
   * GET /api/tenant-data/profile
   * Retrieves profile details and assigned scope for the logged-in tenant
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const profile = await tenantDataService.getTenantProfile(req.user.userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tenant-data/stats
   * Retrieves campaign statistics from the tenant's isolated database pool (sub-5ms)
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const tenantDbName = req.tenantDbName || req.user.tenantDbName || null;
      if (!tenantDbName) {
        throw ApiError.badRequest('No tenant database is assigned to this user account');
      }

      const forceRefresh = req.query.refresh === 'true';
      const stats = await TenantDashboardService.getMetrics(tenantDbName, forceRefresh);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/tenant-data/stats/sync
   * Forces single-pass recalculation and updates the tenant_dashboard_stats rollup table
   */
  syncStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const tenantDbName = req.tenantDbName || req.user.tenantDbName || null;
      if (!tenantDbName) {
        throw ApiError.badRequest('No tenant database is assigned to this user account');
      }

      const stats = await TenantDashboardService.recalculateMetrics(tenantDbName);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tenant-data/constituencies
   * Retrieves assigned Parliamentary & Assembly Constituencies for the tenant
   */
  getConstituencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const tenantDbName = req.tenantDbName || req.user.tenantDbName || (req.headers['x-tenant-db'] as string);
      const constituencies = await tenantDataService.getTenantConstituencies(req.user.userId, tenantDbName);
      res.status(200).json({
        success: true,
        data: constituencies,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tenant-data/booths
   * Retrieves polling booths in the tenant's isolated database
   */
  getBooths = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const tenantDbName = req.tenantDbName || req.user.tenantDbName || null;
      const booths = await tenantDataService.getTenantBooths(tenantDbName);
      res.status(200).json({
        success: true,
        data: booths,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const tenantDataController = new TenantDataController();
