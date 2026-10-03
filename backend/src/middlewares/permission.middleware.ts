import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { RoleQueries } from '../queries/role.queries';

/**
 * Middleware requiring specific Web or Master Tab Access
 */
export const requireTabAccess = (tabKey: string, isMasterSubTab = false) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super Admin has full bypass
    if (req.user.role === 'super_admin') {
      return next();
    }

    // If user has no specific custom tenant_user_role_id assigned, default to role-based access
    if (!req.user.tenantUserRoleId) {
      return next();
    }

    try {
      const userRole = await RoleQueries.getTenantUserRoleById(req.user.tenantUserRoleId);
      if (!userRole) {
        return next();
      }

      const allowedArray = isMasterSubTab
        ? userRole.accessibleTabs?.master_sub_tabs
        : userRole.accessibleTabs?.web_tabs;

      if (allowedArray && allowedArray.length > 0 && !allowedArray.includes(tabKey)) {
        return next(ApiError.forbidden(`Access denied: Required tab permission [${tabKey}]`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Middleware requiring specific Voter Data Editing Right
 */
export const requireVoterPermission = (permissionKey: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super Admin & Tenant Admin have full voter edit access by default
    if (['super_admin', 'tenant_admin', 'admin'].includes(req.user.role)) {
      return next();
    }

    if (!req.user.tenantUserRoleId) {
      return next();
    }

    try {
      const userRole = await RoleQueries.getTenantUserRoleById(req.user.tenantUserRoleId);
      if (!userRole || !userRole.voterPermissions) {
        return next();
      }

      const hasPerm = (userRole.voterPermissions as unknown as Record<string, boolean>)[permissionKey];
      if (hasPerm === false) {
        return next(ApiError.forbidden(`Access denied: Required voter permission [${permissionKey}]`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
