import { Request, Response } from 'express';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/auth.service';
import { adminUserService } from '../services/admin_user.service';

export class AdminUserController {
  getAdminUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const users = await adminUserService.getAllAdminUsers();
    const formattedUsers = attachFileUrls(users, undefined, req);
    const response = ApiResponse.success(formattedUsers, 'Admin users retrieved successfully');
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
    const payload = {
      ...req.body,
      parentLeaderId: req.body.parentLeaderId || req.user?.userId,
    };
    const user = await authService.registerUser(payload);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'Admin user created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateAdminUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updatedUser = await adminUserService.updateAdminUser(id, req.body);
    const response = ApiResponse.success(updatedUser, 'Admin user updated successfully');
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
export const userController = adminUserController; // Backward-compatibility export

