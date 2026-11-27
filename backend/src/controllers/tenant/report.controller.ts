import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { tenantReportService } from '../../services/tenant/report.service';

export class TenantReportController {
  /**
   * GET /api/v1/tenant/reports/voter-sync
   * Retrieves paginated voter-to-volunteer contact sync report.
   */
  getVoterSyncReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { page, limit, search, role, boothId, startDate, endDate } = req.query;

    const result = await tenantReportService.getVoterSyncReport(tenantDbName, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      search: search ? String(search) : undefined,
      role: role ? String(role) : undefined,
      boothId: boothId ? String(boothId) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    });

    const formattedItems = result.items.map((item) =>
      attachFileUrls(item, ['volunteerAvatar', 'voterAvatar'], req)
    );

    const response = ApiResponse.success(
      { ...result, items: formattedItems },
      'Voter sync report retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/reports/voting
   * Retrieves election-wise voting report (booth summary or voter status).
   */
  getVotingReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { electionId, view, boothId, hasVoted, search, page, limit } = req.query;

    const result = await tenantReportService.getVotingReport(tenantDbName, {
      electionId: electionId ? String(electionId) : undefined,
      view: view === 'voter' ? 'voter' : 'booth',
      boothId: boothId ? String(boothId) : undefined,
      hasVoted: hasVoted === 'true' || hasVoted === 'false' ? hasVoted : 'all',
      search: search ? String(search) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
    });

    const formattedItems =
      result.view === 'voter'
        ? result.items.map((item: any) => attachFileUrls(item, ['voterAvatar'], req))
        : result.items;

    const response = ApiResponse.success(
      { ...result, items: formattedItems },
      'Voting report retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  /**
   * GET /api/v1/tenant/reports/volunteer-outreach-voters
   * Retrieves paginated voter details for a volunteer's outreach count (sync, call, whatsapp).
   */
  getVolunteerOutreachVoters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { volunteerId, type, timeRange, page, limit } = req.query;
    if (!volunteerId || !type) {
      res.status(400).json(ApiResponse.error('volunteerId and type are required', 400).body);
      return;
    }

    const validType = type === 'call' || type === 'whatsapp' ? type : 'sync';
    const validRange = timeRange === '7d' || timeRange === 'all' ? timeRange : '30d';

    const result = await tenantReportService.getVolunteerOutreachVoters(tenantDbName, {
      volunteerId: String(volunteerId),
      type: validType,
      timeRange: validRange,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
    });

    const formattedItems = result.items.map((item: any) =>
      attachFileUrls(item, ['voterAvatar'], req)
    );

    const response = ApiResponse.success(
      { ...result, items: formattedItems },
      'Volunteer outreach voter details retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  exportVoterSyncExcel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { search, role, boothId, startDate, endDate } = req.query;
    await tenantReportService.exportVoterSyncExcel(
      tenantDbName,
      {
        search: search ? String(search) : undefined,
        role: role ? String(role) : undefined,
        boothId: boothId ? String(boothId) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      },
      res
    );
  });

  exportVotingReportExcel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { electionId, view, boothId, hasVoted, search } = req.query;
    await tenantReportService.exportVotingReportExcel(
      tenantDbName,
      {
        electionId: electionId ? String(electionId) : undefined,
        view: view === 'voter' ? 'voter' : 'booth',
        boothId: boothId ? String(boothId) : undefined,
        hasVoted: hasVoted === 'true' || hasVoted === 'false' ? hasVoted : 'all',
        search: search ? String(search) : undefined,
      },
      res
    );
  });

  exportVolunteerOutreachExcel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = (req as any).tenantDbName || (req.user as any)?.tenantDbName;
    if (!tenantDbName) {
      res.status(400).json(ApiResponse.error('Tenant database context required', 400).body);
      return;
    }

    const { timeRange, role } = req.query;
    await tenantReportService.exportVolunteerOutreachExcel(
      tenantDbName,
      {
        timeRange: timeRange === '7d' || timeRange === 'all' ? timeRange : '30d',
        role: role ? String(role) : undefined,
      },
      res
    );
  });
}

export const tenantReportController = new TenantReportController();
