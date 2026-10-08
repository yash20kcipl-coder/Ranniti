import { Pool } from 'pg';
import { JwtPayload } from '../utils/jwt';
import { UserRecord } from '../queries/auth.queries';

export interface MobileUserProfile extends Omit<UserRecord, 'passwordHash'> {
  assignedAcName?: string | null;
  assignedAc?: string | null;
  assignedPcId?: string | null;
  assignedPcName?: string | null;
  assignedPc?: string | null;
  assignedBoothIds?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantPool?: Pool;
      tenantDbName?: string;
      assignedAcId?: string | null;
      assignedBoothIds?: string[];
      mobileUser?: MobileUserProfile;
    }
  }
}

