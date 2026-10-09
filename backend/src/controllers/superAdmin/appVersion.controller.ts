import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { appVersionQueries } from '../../queries/appVersion.queries';

export class SuperAdminAppVersionController {
  /**
   * GET /api/v1/super-admin/app-versions
   * Retrieve version rules for Android and iOS
   */
  getAppVersions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const versions = await appVersionQueries.getAppVersions();
    const response = ApiResponse.success(versions, 'App version settings retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * PUT /api/v1/super-admin/app-versions/:id
   * Update app version settings for a specific platform or record ID
   */
  updateAppVersion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const data = req.body;

    if (!id) {
      throw ApiError.badRequest('Version ID or platform is required');
    }

    const updated = await appVersionQueries.updateAppVersion(id, data);
    if (!updated) {
      throw ApiError.notFound('App version configuration not found');
    }

    const response = ApiResponse.success(updated, 'App version settings updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const superAdminAppVersionController = new SuperAdminAppVersionController();
