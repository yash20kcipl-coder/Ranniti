import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { roleService } from '../../services/superAdmin/role.service';

export class TenantUserRoleController {
  getTenantUserRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.user?.tenantDbName || (req.query.tenantDbName as string);
    const roles = await roleService.getAllTenantUserRoles(tenantDbName);
    const response = ApiResponse.success(roles, 'Tenant User Roles retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getTenantUserRoleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.user?.tenantDbName || (req.query.tenantDbName as string);
    const role = await roleService.getTenantUserRoleById(id, tenantDbName);
    const response = ApiResponse.success(role, 'Tenant User Role retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createTenantUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.user?.tenantDbName || req.body.tenantDbName;
    const payload = {
      ...req.body,
      tenantDbName,
      createdBy: req.user?.userId,
    };
    const role = await roleService.createTenantUserRole(payload);
    const response = ApiResponse.success(role, 'Tenant User Role created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateTenantUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.user?.tenantDbName || req.body.tenantDbName;
    const role = await roleService.updateTenantUserRole(id, req.body, tenantDbName);
    const response = ApiResponse.success(role, 'Tenant User Role updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteTenantUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.user?.tenantDbName || (req.query.tenantDbName as string);
    await roleService.deleteTenantUserRole(id, tenantDbName);
    const response = ApiResponse.success(null, 'Tenant User Role deleted successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantUserRoleController = new TenantUserRoleController();
