import { ApiError } from '../utils/apiError';
import { verifyJwtToken } from '../utils/jwt';
import { Request, Response, NextFunction } from 'express';

/**
 * Super Admin Authentication & Privilege Enforcement Middleware
 * Ensures the request has a valid JWT token and the authenticated user is a Super Admin.
 * Blocks all tenant admins, leaders, volunteers, and unauthenticated users with 403 Forbidden.
 */
export const superAdminAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyJwtToken(token);
    req.user = payload;

    if (payload.role !== 'super_admin') {
      return next(ApiError.forbidden('Forbidden: Super Admin privilege required'));
    }

    next();
  } catch (error) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};
