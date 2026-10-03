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
  assignedBoothIds?: string[];
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
