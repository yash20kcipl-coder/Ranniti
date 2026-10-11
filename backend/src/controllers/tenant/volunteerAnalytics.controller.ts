import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { volunteerAnalyticsService, VolunteerAnalyticsFilters } from '../../services/tenant/volunteerAnalytics.service';

export class VolunteerAnalyticsController {
  /**
   * Retrieves volunteer outreach metrics, role-based performance distribution, and leaderboard.
   */
  getVolunteerAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { timeRange, role, boothId } = req.query;

    const filters: VolunteerAnalyticsFilters = {
      timeRange: (timeRange as '7d' | '30d' | 'all') || '30d',
      role: role ? String(role) : undefined,
      boothId: boothId ? String(boothId) : undefined,
    };

    const analytics = await volunteerAnalyticsService.getVolunteerAnalytics(tenantDbName, filters);

    // Apply Rule 1: Attach file URLs to avatar properties
    const formattedLeaderboard = analytics.leaderboard.map((item) =>
      attachFileUrls(item, ['avatar'], req)
    );

    const payload = {
      ...analytics,
      leaderboard: formattedLeaderboard,
    };

    const response = ApiResponse.success(payload, 'Volunteer analytics retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const volunteerAnalyticsController = new VolunteerAnalyticsController();
