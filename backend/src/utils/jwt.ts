import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantDbName?: string | null;
  tenantUserRoleId?: string | null;
  parentLeaderId?: string | null;
  assignedAcId?: string | null;
  assignedAcIds?: string[] | null;
  assignedBoothIds?: string[];
  isImpersonated?: boolean;
  impersonatedBy?: string;
}

export const generateJwtToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyJwtToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};

export interface SelectionTokenPayload {
  mobile: string;
  purpose: 'tenant_selection';
}

/**
 * Short-lived token issued after OTP verification when a mobile number
 * belongs to multiple tenants, allowing profile selection without re-verifying OTP.
 */
export const generateSelectionToken = (mobile: string): string => {
  return jwt.sign({ mobile, purpose: 'tenant_selection' }, config.jwtSecret, { expiresIn: '5m' });
};

export const verifySelectionToken = (token: string): SelectionTokenPayload => {
  const decoded = jwt.verify(token, config.jwtSecret) as SelectionTokenPayload;
  if (decoded.purpose !== 'tenant_selection' || !decoded.mobile) {
    throw new Error('Invalid selection token');
  }
  return decoded;
};
