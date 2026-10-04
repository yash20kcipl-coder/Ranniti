import { ApiError } from '../../utils/apiError';
import { Request, Response, NextFunction } from 'express';
import { tenantDataService } from '../../services/tenant/tenantData.service';

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
   * Retrieves campaign statistics from the tenant's isolated database pool
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const stats = await tenantDataService.getTenantStats(req.user.userId, req.user.tenantDbName || null);
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

      const constituencies = await tenantDataService.getTenantConstituencies(req.user.userId);
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

      const booths = await tenantDataService.getTenantBooths(req.user.tenantDbName || null);
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
