import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, JwtPayload } from '../utils/jwt';
import { ApiError } from '../utils/apiError';

// Extend Express Request to include authenticated user details
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Express Middleware to authenticate incoming request JWT Bearer Token
 */
export const authenticateJwt = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyJwtToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};

/**
 * Middleware factory to enforce required user role(s)
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied: Required role [${allowedRoles.join(', ')}]`));
    }

    next();
  };
};

/**
 * Shortcut middleware requiring Super Admin role
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Shortcut middleware requiring Tenant Admin or Super Admin role
 */
export const requireAdmin = requireRole('super_admin', 'tenant_admin');

/**
 * Shortcut middleware requiring Leader or higher role
 */
export const requireLeader = requireRole('super_admin', 'tenant_admin', 'pc_leader', 'ac_leader', 'leader');

/**
 * Shortcut middleware requiring Sub-Leader or higher role
 */
export const requireSubLeader = requireRole('super_admin', 'tenant_admin', 'pc_leader', 'ac_leader', 'leader', 'sub_leader');

