import { query } from '../queries/dbPool';
import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/auth.service';
import { AuthQueries } from '../queries/auth.queries';
import { adminUserService } from '../services/tenant/admin_user.service';

export class VolunteerController {
  /**
   * Onboard a new field volunteer / leader (PC Leader, AC Leader, Sub Leader, Supporter)
   * Resolves cascading location selections down to user_booth_assignments
   */
  onboardVolunteer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role, roleName, mobile, avatar, parentLeaderId, boothIds } = req.body;

    if (!name || !email || !password || !role) {
      throw new ApiError(400, 'Name, email, password, and role are required');
    }

    const VALID_FIELD_ROLES = ['pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter'];
    if (!VALID_FIELD_ROLES.includes(role)) {
      throw new ApiError(400, `Role must be one of: ${VALID_FIELD_ROLES.join(', ')}`);
    }

    if (!boothIds || !Array.isArray(boothIds) || boothIds.length === 0) {
      throw new ApiError(400, 'At least one polling booth must be assigned');
    }

    if (role === 'supporter' && boothIds.length > 1) {
      throw new ApiError(400, 'Supporters can only be assigned to a single polling booth');
    }

    // Register user in admin_users
    const user = await authService.registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : undefined,
      password,
      role,
      roleName: roleName || undefined,
      avatar: avatar || null,
      parentLeaderId: parentLeaderId || req.user?.userId,
      tenantDbName: req.user?.tenantDbName,
      assignedBoothIds: boothIds,
    });

    const formattedUser = attachFileUrls(user, ['avatar'], req);
    const response = ApiResponse.success(formattedUser, 'Volunteer onboarded successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Get team members / field volunteers managed under current user
   */
  getVolunteers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parentId = (req.query.parentId as string) || req.user!.userId;
    const tenantDbName = req.user?.tenantDbName;
    const teamMembers = await adminUserService.getTeamMembersByParentId(parentId, tenantDbName);

    const formatted = attachFileUrls(teamMembers, ['avatar'], req);
    const response = ApiResponse.success(formatted, 'Volunteers retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Update booth assignments for a volunteer
   */
  updateVolunteerBooths = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { boothIds } = req.body;
    const tenantDbName = req.user?.tenantDbName;

    if (!boothIds || !Array.isArray(boothIds)) {
      throw new ApiError(400, 'boothIds array is required');
    }

    if (tenantDbName) {
      await AuthQueries.assignBoothsToTenantUser(id, boothIds, tenantDbName);
    } else {
      await AuthQueries.assignBoothsToUser(id, boothIds);
    }

    const response = ApiResponse.success({ id, boothIds }, 'Volunteer booth assignments updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const volunteerController = new VolunteerController();
