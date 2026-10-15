import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, JwtPayload } from '../utils/jwt';
import { mobileAuthService } from '../services/mobileAuth.service';

/**
 * Unified Mobile Authentication Middleware
 * 1. Validates JWT Bearer Token and attaches req.user
 * 2. Fetches the volunteer's assigned permissions/scopes directly from Tenant DB
 * 3. Attaches enriched profile to req.mobileUser
 */
export const authenticateMobileUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];

  let payload: JwtPayload;
  try {
    payload = verifyJwtToken(token);
    req.user = payload;
  } catch (error) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }

  const userId = payload.userId;
  const tenantDbName = payload.tenantDbName || (req as any).tenantDbName;

  if (!userId) {
    return next(ApiError.unauthorized('User identity missing'));
  }

  const ALLOWED_APP_ROLES = ['pc_leader', 'ac_leader', 'sub_leader', 'supporter'];
  if (!ALLOWED_APP_ROLES.includes(payload.role)) {
    return next(ApiError.forbidden('Forbidden: Web administrative accounts cannot access Mobile Application endpoints'));
  }

  try {
    req.mobileUser = await mobileAuthService.getMobileProfileFast(userId, tenantDbName);
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.message?.toLowerCase().includes('not found')) {
      return next(ApiError.unauthorized('Mobile user profile not found. Please log in again.'));
    }
    return next(error);
  }
  next();
});
