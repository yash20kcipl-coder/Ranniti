import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { attachFileUrls } from '../../utils/fileUrl';
import { mobileDashboardService } from '../../services/mobile/mobileDashboard.service';
import { SurveyScoringService } from '../../services/tenant/surveyScoring.service';

export class MobileDashboardController {
  getMetrics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const userId = user.id;
    const boothId = typeof req.query.boothId === 'string' && req.query.boothId.trim()
      ? req.query.boothId.trim()
      : undefined;
    const metrics = await mobileDashboardService.getDashboardMetrics({
      userId,
      role: user.role,
      tenantDbName: user.tenantDbName,
      assignedAcId: (user as any).assignedAcId,
      assignedPcId: (user as any).assignedPcId,
      assignedBoothIds: (user as any).assignedBoothIds,
      boothId,
    });

    const response = ApiResponse.success(metrics, 'Mobile dashboard statistics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getSurveyScore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const rawRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : '30d';
    const timeRange = (['today', '7d', '30d', 'all'].includes(rawRange) ? rawRange : '30d') as
      | 'today'
      | '7d'
      | '30d'
      | 'all';

    const result = await SurveyScoringService.getMobileSurveyDashboard(
      { userId: user.id, role: user.role, timeRange },
      user.tenantDbName
    );

    if (result.myStats?.volunteer) {
      result.myStats.volunteer = attachFileUrls(result.myStats.volunteer, ['avatar'], req);
    }
    result.teamScores = result.teamScores.map((m) => attachFileUrls(m, ['avatar'], req));

    const response = ApiResponse.success(result, 'Volunteer survey score retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileDashboardController = new MobileDashboardController();
