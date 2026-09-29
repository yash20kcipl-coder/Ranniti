import { Request, Response, NextFunction } from 'express';
import { getTenantDbPool } from '../queries/tenantDbPool';
import { logger } from '../utils/logger';
import { Pool } from 'pg';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantDbName?: string;
  tenantPool?: Pool;
}

/**
 * Middleware to resolve the tenant database pool for multi-tenant requests.
 * Expects 'x-tenant-id' header or falls back to 'default'.
 */
export const tenantResolverMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 'master';

    // If master, allow standard dbPool query execution
    if (tenantId === 'master') {
      req.tenantId = 'master';
      req.tenantDbName = process.env.DB_NAME || 'ranniti_db';
      return next();
    }

    // Format target tenant database name: ranniti_tenant_<tenantId>
    const tenantDbName = `ranniti_tenant_${tenantId.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    const pool = getTenantDbPool(tenantDbName);

    req.tenantId = tenantId;
    req.tenantDbName = tenantDbName;
    req.tenantPool = pool;

    next();
  } catch (error: any) {
    logger.error(`Failed to resolve tenant database pool: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Tenant Database Resolution Error',
      message: error.message,
    });
  }
};
