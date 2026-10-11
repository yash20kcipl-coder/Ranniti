import { ApiError } from '../utils/apiError';
import { verifyJwtToken } from '../utils/jwt';
import { CacheService } from '../services/cache.service';
import { Request, Response, NextFunction } from 'express';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';

/**
 * Tenant Authentication & Pool Attachment Middleware
 * Enforces Tenant Admin/User role checks and attaches the cached tenant database connection pool.
 * Volunteers and supporters are explicitly forbidden from accessing tenant-level management APIs.
 */
export const tenantAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyJwtToken(token);
    req.user = payload;

    // Enforce strict administrative role check: Only tenant admins and super admin can access tenant management APIs.
    // Mobile field roles (pc_leader, ac_leader, leader, sub_leader, supporter, volunteer) are forbidden from web tenant APIs.
    const ALLOWED_TENANT_ADMIN_ROLES = ['tenant_admin', 'super_admin'];
    if (!ALLOWED_TENANT_ADMIN_ROLES.includes(payload.role)) {
      return next(ApiError.forbidden('Forbidden: Field roles cannot access Tenant Web Portal endpoints. Please use the mobile application.'));
    }

    // Determine target tenant database name
    let tenantDbName = payload.tenantDbName;

    // Support override via header or query (e.g. for super_admin inspecting a tenant or client header)
    if (!tenantDbName || payload.role === 'super_admin') {
      const headerDb = (req.headers['x-tenant-db'] as string) || (req.query.tenantDb as string) || (req.query.tenantDbName as string);
      if (headerDb) {
        tenantDbName = headerDb.trim();
      }
    }

    // If still missing and userId is present, resolve with Redis caching (1 hour TTL)
    if (!tenantDbName && payload.userId) {
      tenantDbName = await CacheService.getOrSet(`ranniti:tenant:db:${payload.userId}`, 3600, async () => {
        const { query } = await import('../queries/dbPool');
        const tRes = await query(`SELECT tenant_db_name FROM tenants WHERE id = $1 LIMIT 1`, [payload.userId]);
        return tRes.rows[0]?.tenant_db_name || null;
      });
    }

    if (!tenantDbName) {
      return next(ApiError.badRequest('Tenant database specification missing in token or headers'));
    }

    // Attach dynamic connection pool and database name for tenant database
    req.tenantDbName = tenantDbName;
    req.tenantPool = TenantPoolManager.getPool(tenantDbName);
    if (req.user) {
      req.user.tenantDbName = tenantDbName;
    }

    next();
  } catch (error: any) {
    if (error.statusCode) return next(error);
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};
