import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { roleService } from '../services/role.service';

export class TenantRoleController {
  getTenantRoles = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const roles = await roleService.getAllTenantRoles();
    const response = ApiResponse.success(roles, 'Tenant Role Packages retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getTenantRoleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const role = await roleService.getTenantRoleById(id);
    const response = ApiResponse.success(role, 'Tenant Role Package retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createTenantRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const role = await roleService.createTenantRole(req.body);
    const response = ApiResponse.success(role, 'Tenant Role Package created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateTenantRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const role = await roleService.updateTenantRole(id, req.body);
    const response = ApiResponse.success(role, 'Tenant Role Package updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteTenantRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await roleService.deleteTenantRole(id);
    const response = ApiResponse.success(null, 'Tenant Role Package deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  setDefaultTenantRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const role = await roleService.setDefaultTenantRole(id);
    const response = ApiResponse.success(role, 'Default Tenant Role Package updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const tenantRoleController = new TenantRoleController();
