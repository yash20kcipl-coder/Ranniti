import { query } from '../queries/dbPool';
import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/auth.service';
import { AuthQueries } from '../queries/auth.queries';

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
    const resDb = await query(
      `SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
              u.parent_leader_id AS "parentLeaderId", u.created_at AS "createdAt",
              COALESCE(ARRAY_AGG(uba.booth_id) FILTER (WHERE uba.booth_id IS NOT NULL), '{}') AS "assignedBoothIds"
       FROM admin_users u
       LEFT JOIN user_booth_assignments uba ON u.id = uba.user_id
       WHERE u.parent_leader_id = $1 OR u.id = $1
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [parentId]
    );

    const formatted = attachFileUrls(resDb.rows, ['avatar'], req);
    const response = ApiResponse.success(formatted, 'Volunteers retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  /**
   * Update booth assignments for a volunteer
   */
  updateVolunteerBooths = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { boothIds } = req.body;

    if (!boothIds || !Array.isArray(boothIds)) {
      throw new ApiError(400, 'boothIds array is required');
    }

    await AuthQueries.assignBoothsToUser(id, boothIds);
    const response = ApiResponse.success({ id, boothIds }, 'Volunteer booth assignments updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const volunteerController = new VolunteerController();
