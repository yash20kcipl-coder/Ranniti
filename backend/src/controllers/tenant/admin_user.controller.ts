import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { attachFileUrls } from '../../utils/fileUrl';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authService } from '../../services/auth.service';
import { adminUserService } from '../../services/tenant/admin_user.service';
import { generateVolunteerDefaultPassword } from '../../utils/volunteerPassword';

export class AdminUserController {
  getAdminUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || (req.query.tenantDbName as string);
    const users = await adminUserService.getAllAdminUsers(tenantDbName);
    const formattedUsers = attachFileUrls(users, undefined, req);
    const response = ApiResponse.success(formattedUsers, 'Admin users retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getVolunteers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || (req.query.tenantDbName as string);
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
    const tenantDbName = req.tenantDbName || (req.query.tenantDbName as string);
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
    const tenantDbName = req.tenantDbName;
    const user = await adminUserService.getAdminUserById(id, tenantDbName);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'Admin user retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  getTeamMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parentId = (req.query.parentId as string) || req.user!.userId;
    const tenantDbName = req.tenantDbName;
    const users = await adminUserService.getTeamMembersByParentId(parentId, tenantDbName);
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

    const tenantDbName = req.tenantDbName || req.body.tenantDbName;

    let parentLeaderId = req.body.parentLeaderId;
    if (!parentLeaderId || parentLeaderId === 'null' || parentLeaderId === req.user?.userId) {
      parentLeaderId = null;
    }

    const payload = {
      ...req.body,
      name,
      email,
      mobile,
      password: rawPassword,
      tenantDbName,
      parentLeaderId,
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
    const tenantDbName = req.tenantDbName;
    const updatedUser = await adminUserService.updateAdminUser(id, req.body, tenantDbName);
    const formattedUser = attachFileUrls(updatedUser, ['avatar'], req);
    const response = ApiResponse.success(formattedUser, 'Admin user updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteAdminUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.tenantDbName;
    await adminUserService.deleteAdminUser(id, tenantDbName);
    const response = ApiResponse.success(null, 'Admin user deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  toggleVolunteerStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const requestedStatus = req.body?.status;
    const tenantDbName = req.tenantDbName;
    const updatedUser = await adminUserService.toggleVolunteerStatus(id, requestedStatus, tenantDbName);
    const formattedUser = attachFileUrls(updatedUser, ['avatar'], req);
    const statusMsg = formattedUser.status === 'active' ? 'enabled' : 'disabled';
    const response = ApiResponse.success(
      formattedUser,
      `Volunteer account has been ${statusMsg} successfully`
    );
    res.status(response.statusCode).json(response.body);
  });

  // ─── Tenant Web Portal Users Controllers ───────────────────────────────────

  getTenantWebUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || (req.query.tenantDbName as string);
    if (!tenantDbName) {
      const response = ApiResponse.success([], 'No tenant database configured');
      res.status(response.statusCode).json(response.body);
      return;
    }
    const users = await adminUserService.getTenantWebUsers(tenantDbName);
    const formatted = attachFileUrls(users, ['avatar'], req);
    const response = ApiResponse.success(formatted, 'Tenant web users retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  createTenantWebUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenantDbName = req.tenantDbName || (req.body.tenantDbName as string);
    if (!tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    // Plan-level permission enforcement
    const isSuperAdmin = req.user?.role === 'super_admin';
    if (!isSuperAdmin) {
      const { query: masterQuery } = await import('../../queries/dbPool');
      const tRes = await masterQuery(
        `SELECT tr.allowed_tabs
         FROM tenants t
         LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
         WHERE t.tenant_db_name = $1 LIMIT 1`,
        [tenantDbName]
      );
      const allowedTabs = tRes.rows[0]?.allowed_tabs || {};
      const canCreate = Boolean(allowedTabs.canCreateWebUsers || allowedTabs.can_create_web_users);
      if (!canCreate) {
        throw ApiError.forbidden(
          'Your current subscription plan does not allow creating web portal users. Please contact Super Admin to upgrade your package.'
        );
      }
    }

    const { name, email, mobile, password, roleName, role, status } = req.body;
    let accessibleTabs = req.body.accessibleTabs;
    if (typeof accessibleTabs === 'string') {
      try {
        accessibleTabs = JSON.parse(accessibleTabs);
      } catch {
        // Fallback to raw string or empty object
      }
    }
    if (!name || !email) {
      throw ApiError.badRequest('Name and email are required to create a web user');
    }

    const newUser = await adminUserService.createTenantWebUser(tenantDbName, {
      name,
      email,
      mobile,
      password,
      role: role || 'tenant_user',
      roleName,
      status,
      accessibleTabs,
      avatar: (req as any).file?.filename || req.body.avatar,
    });

    const formatted = attachFileUrls(newUser, ['avatar'], req);
    const response = ApiResponse.success(formatted, 'Web user created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  updateTenantWebUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.tenantDbName;
    if (!tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    let accessibleTabs = req.body.accessibleTabs;
    if (typeof accessibleTabs === 'string') {
      try {
        accessibleTabs = JSON.parse(accessibleTabs);
      } catch {
        // Fallback
      }
    }

    const updated = await adminUserService.updateTenantWebUser(tenantDbName, id, {
      ...req.body,
      accessibleTabs: accessibleTabs !== undefined ? accessibleTabs : req.body.accessibleTabs,
      avatar: (req as any).file?.filename || req.body.avatar,
    });
    const formatted = attachFileUrls(updated, ['avatar'], req);
    const response = ApiResponse.success(formatted, 'Web user updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  deleteTenantWebUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.tenantDbName;
    if (!tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    await adminUserService.deleteTenantWebUser(tenantDbName, id);
    const response = ApiResponse.success(null, 'Web user deleted successfully');
    res.status(response.statusCode).json(response.body);
  });

  toggleTenantWebUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const tenantDbName = req.tenantDbName;
    const requestedStatus = req.body?.status;
    if (!tenantDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    const updated = await adminUserService.toggleTenantWebUserStatus(tenantDbName, id, requestedStatus);
    const formatted = attachFileUrls(updated, ['avatar'], req);
    const statusMsg = formatted.status === 'active' ? 'enabled' : 'disabled';
    const response = ApiResponse.success(
      formatted,
      `Web user account has been ${statusMsg} successfully`
    );
    res.status(response.statusCode).json(response.body);
  });
}

export const adminUserController = new AdminUserController();
export const userController = adminUserController;
