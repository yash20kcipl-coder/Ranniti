import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileDashboardService } from '../../services/mobile/mobileDashboard.service';

export class MobileDashboardController {
  getMetrics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const metrics = await mobileDashboardService.getDashboardMetrics({
      userId: user.userId,
      role: user.role,
      tenantDbName: user.tenantDbName,
      assignedAcId: user.assignedAcId,
      assignedBoothIds: user.assignedBoothIds,
    });

    const response = ApiResponse.success(metrics, 'Mobile dashboard statistics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileDashboardController = new MobileDashboardController();
