import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileAccessService } from '../../services/mobile/mobileAccess.service';

export class MobileAccessController {
  getRoleAccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const accessConfig = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
    });

    const response = ApiResponse.success(accessConfig, 'Role and tab access configuration retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getAvailableRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const creatableOnly = req.query.creatableOnly === 'true';
    const roles = await mobileAccessService.getAvailableRoles({
      userRole: user.role,
      tenantDbName: user.tenantDbName,
      creatableOnly,
    });

    const response = ApiResponse.success(roles, 'Available mobile roles retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileAccessController = new MobileAccessController();
