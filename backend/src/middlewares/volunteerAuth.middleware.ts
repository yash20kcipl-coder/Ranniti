import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';

/**
 * Volunteer Authentication & Booth Scoping Middleware
 * Enforces Volunteer role check, attaches cached tenant DB pool, and scopes booth / AC permissions.
 */
export const volunteerAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyJwtToken(token);
    req.user = payload;

    const allowedRoles = ['volunteer', 'tenant_admin', 'super_admin'];
    if (!allowedRoles.includes(payload.role)) {
      return next(ApiError.forbidden('Forbidden: Access denied for Volunteer API'));
    }

    let tenantDbName = payload.tenantDbName;
    if (payload.role === 'super_admin' && !tenantDbName) {
      tenantDbName = (req.headers['x-tenant-db'] as string) || (req.query.tenantDb as string);
    }

    if (!tenantDbName) {
      return next(ApiError.badRequest('Tenant database specification missing'));
    }

    // Attach pool & booth assignment parameters to request context
    req.tenantPool = TenantPoolManager.getPool(tenantDbName);
    req.tenantDbName = tenantDbName;
    req.assignedAcId = payload.assignedAcId || null;
    req.assignedBoothIds = payload.assignedBoothIds || [];

    next();
  } catch (error: any) {
    if (error.statusCode) return next(error);
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};
