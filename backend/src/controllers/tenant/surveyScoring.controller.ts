import fs from 'fs';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { attachFileUrls } from '../../utils/fileUrl';
import { SurveyScoringService } from '../../services/tenant/surveyScoring.service';

export class SurveyScoringController {
  /**
   * GET /api/tenant/surveys/leaderboard
   * Get volunteer survey leaderboard with score breakdowns
   */
  static getLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { timeRange, boothId, role, search } = req.query;

    const result = await SurveyScoringService.getLeaderboard(
      {
        timeRange: (timeRange as any) || '30d',
        boothId: boothId as string,
        role: role as string,
        search: search as string,
      },
      tenantDbName
    );

    const formattedLeaderboard = result.leaderboard.map((item) =>
      attachFileUrls(item, ['avatar'], req)
    );

    const response = ApiResponse.success(
      {
        leaderboard: formattedLeaderboard,
        totalCount: result.totalCount,
      },
      'Survey leaderboard retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/tenant/surveys/volunteers/:volunteerId
   * Get single volunteer survey metrics and breakdown
   */
  static getVolunteerStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { volunteerId } = req.params;

    const result = await SurveyScoringService.getVolunteerStats(volunteerId as string, tenantDbName);

    if (result.volunteer) {
      result.volunteer = attachFileUrls(result.volunteer, ['avatar'], req);
    }

    const response = ApiResponse.success(result, 'Volunteer survey statistics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/tenant/surveys/audit-feed
   * Get paginated audit feed of recent voter field updates
   */
  static getAuditFeed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { boothId, search, page, limit } = req.query;

    const result = await SurveyScoringService.getAuditFeed(
      {
        boothId: boothId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      },
      tenantDbName
    );

    const formattedItems = result.items.map((item) =>
      attachFileUrls(item, ['volunteerAvatar'], req)
    );

    const response = ApiResponse.success(
      {
        items: formattedItems,
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
      },
      'Survey audit feed retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/tenant/surveys/export
   * Export Volunteer Survey Leaderboard to .xlsx (Rule 22)
   */
  static exportLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || req.user?.tenantDbName;
    const { timeRange, boothId, role, search } = req.query;

    const filePath = await SurveyScoringService.exportSurveyLeaderboardToXlsx(
      {
        timeRange: (timeRange as any) || '30d',
        boothId: boothId as string,
        role: role as string,
        search: search as string,
      },
      tenantDbName
    );

    res.download(filePath, (err) => {
      if (err) {
        // Non-fatal error log
      }
      // Clean up exported file after response finishes
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        // Ignore
      }
    });
  });
}
