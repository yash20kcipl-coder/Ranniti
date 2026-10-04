import { Request, Response } from 'express';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authService } from '../../services/auth.service';
import { adminUserService } from '../../services/tenant/admin_user.service';
import { generateVolunteerDefaultPassword } from '../../utils/volunteerPassword';

export class AdminUserController {
  getAdminUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const users = await adminUserService.getAllAdminUsers();
    const formattedUsers = attachFileUrls(users, undefined, req);
    const response = ApiResponse.success(formattedUsers, 'Admin users retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getVolunteers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.user?.tenantDbName || (req.query.tenantDbName as string);
    if (!tenantDbName) {
      const response = ApiResponse.success([], 'No tenant database configured for user');
      res.status(response.statusCode).json(response.body);
      return;
    }

    const filters = {
      role: req.query.role as string,
      search: req.query.search as string,
      status: req.query.status as string,
      acId: req.query.acId as string,
    };

    const volunteers = await adminUserService.getTenantVolunteers(tenantDbName, filters);
    const formatted = attachFileUrls(volunteers, ['avatar'], req);
    const response = ApiResponse.success(formatted, 'Volunteers retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getVolunteerBoothCoverage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.user?.tenantDbName || (req.query.tenantDbName as string);
    if (!tenantDbName) {
      const response = ApiResponse.success({
        totalCadre: 0,
        pcLeadersCount: 0,
        acLeadersCount: 0,
        subLeadersCount: 0,
        supportersCount: 0,
        totalBooths: 0,
        coveredBooths: 0,
        coveragePercentage: 0,
      }, 'No tenant database configured');
      res.status(response.statusCode).json(response.body);
      return;
    }

    const coverage = await adminUserService.getVolunteerBoothCoverage(tenantDbName);
    const response = ApiResponse.success(coverage, 'Volunteer booth coverage statistics retrieved');
    res.status(response.statusCode).json(response.body);
  });

  getAdminUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const user = await adminUserService.getAdminUserById(id);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'Admin user retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getTeamMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parentId = (req.query.parentId as string) || req.user!.userId;
    const users = await adminUserService.getTeamMembersByParentId(parentId);
    const formattedUsers = attachFileUrls(users, undefined, req);
    const response = ApiResponse.success(formattedUsers, 'Team members retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createAdminUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const name = (req.body.name || '').trim();
    const mobile = (req.body.mobile || '').trim();

    // Auto-generate default password if not provided
    const rawPassword = req.body.password && req.body.password.trim().length >= 6
      ? req.body.password.trim()
      : generateVolunteerDefaultPassword(name, mobile);

    // Auto-generate internal email if not provided
    const cleanPhone = mobile.replace(/\D/g, '');
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = req.body.email && req.body.email.trim()
      ? req.body.email.trim().toLowerCase()
      : `${cleanPhone || cleanName || 'user'}@ranniti.internal`;

    const payload = {
      ...req.body,
      name,
      email,
      mobile,
      password: rawPassword,
      tenantDbName: req.user?.tenantDbName || req.body.tenantDbName,
      parentLeaderId: req.body.parentLeaderId || req.user?.userId,
      assignedBoothIds: req.body.assignedBoothIds || [],
    };

    const user = await authService.registerUser(payload);
    const formattedUser = attachFileUrls(user, ['avatar'], req);
    const response = ApiResponse.success(
      {
        ...formattedUser,
        generatedDefaultPassword: rawPassword,
      },
      'Volunteer user created successfully',
      201
    );
    res.status(response.statusCode).json(response.body);
  });

  updateAdminUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updatedUser = await adminUserService.updateAdminUser(id, req.body);
    const formattedUser = attachFileUrls(updatedUser, ['avatar'], req);
    const response = ApiResponse.success(formattedUser, 'Admin user updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteAdminUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminUserService.deleteAdminUser(id);
    const response = ApiResponse.success(null, 'Admin user deleted successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const adminUserController = new AdminUserController();
export const userController = adminUserController;
