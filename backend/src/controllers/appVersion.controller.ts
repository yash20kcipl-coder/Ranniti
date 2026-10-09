import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { appVersionQueries } from '../queries/appVersion.queries';

export class AppVersionController {
  /**
   * GET /api/v1/app-versions
   * Public endpoint accessed by React Native mobile app on launch.
   */
  getPublicAppVersions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const versions = await appVersionQueries.getAppVersions();
    const response = ApiResponse.success(versions, 'App versions retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const appVersionController = new AppVersionController();
