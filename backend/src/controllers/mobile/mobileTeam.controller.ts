import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileAuthService } from '../../services/mobileAuth.service';
import { mobileTeamService } from '../../services/mobile/mobileTeam.service';

export class MobileTeamController {
  onboardTeamMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const currentUser = await mobileAuthService.getMobileProfile(userId);
    const { name, email, mobile, password, role, assignedAcId, assignedBoothIds } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json(
        ApiResponse.error('Name, email, password, and role are required fields', 400).body
      );
      return;
    }

    const createdMember = await mobileTeamService.onboardTeamMember(currentUser, {
      name,
      email,
      mobile,
      password,
      role,
      assignedAcId,
      assignedBoothIds,
    });
    const formattedMember = attachFileUrls(createdMember, undefined, req);

    const response = ApiResponse.success(formattedMember, 'Team member onboarded successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  getTeamMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const currentUser = await mobileAuthService.getMobileProfile(userId);
    const query = req.query;

    const result = await mobileTeamService.getTeamMembers(currentUser, {
      role: query.role as string,
      search: query.search as string,
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 25,
    });

    const formattedMembers = result.teamMembers.map(member => attachFileUrls(member, undefined, req));

    const response = ApiResponse.success(
      {
        teamMembers: formattedMembers,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      'Team members directory retrieved successfully'
    );
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileTeamController = new MobileTeamController();
