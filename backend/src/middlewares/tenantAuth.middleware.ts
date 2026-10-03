import { ApiError } from '../utils/apiError';
import { verifyJwtToken } from '../utils/jwt';
import { Request, Response, NextFunction } from 'express';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';

/**
 * Tenant Authentication & Pool Attachment Middleware
 * Enforces Tenant Admin/User role checks and attaches the cached tenant database connection pool.
 * Volunteers are explicitly forbidden from accessing tenant-level management APIs.
 */
export const tenantAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyJwtToken(token);
    req.user = payload;

    // Explicitly block volunteers from tenant management API
    if (payload.role === 'volunteer') {
      return next(ApiError.forbidden('Forbidden: Volunteers cannot access Tenant API endpoints'));
    }

    // Determine target tenant database name
    let tenantDbName = payload.tenantDbName;

    // If Super Admin is making tenant request, allow override via header or query
    if (payload.role === 'super_admin' && !tenantDbName) {
      tenantDbName = (req.headers['x-tenant-db'] as string) || (req.query.tenantDb as string);
    }

    if (!tenantDbName) {
      return next(ApiError.badRequest('Tenant database specification missing in token or headers'));
    }

    // Attach dynamic connection pool for tenant database
    req.tenantPool = TenantPoolManager.getPool(tenantDbName);
    req.tenantDbName = tenantDbName;

    next();
  } catch (error: any) {
    if (error.statusCode) return next(error);
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};
