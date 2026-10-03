import { Pool } from 'pg';
import { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantPool?: Pool;
      tenantDbName?: string;
      assignedAcId?: string | null;
      assignedBoothIds?: string[];
    }
  }
}
