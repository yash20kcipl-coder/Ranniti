import { ApiError } from '../utils/apiError';
import { generateJwtToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { AuthQueries, UserRecord } from '../queries/auth.queries';
import { mobileAccessService, MobileAccessConfig } from './mobile/mobileAccess.service';

export interface MobileLoginResult {
  user: Omit<UserRecord, 'passwordHash'>;
  token: string;
  access: MobileAccessConfig;
}

export class MobileAuthService {
  async mobileLogin(emailOrMobile: string, password: string, tenantDbName?: string): Promise<MobileLoginResult> {
    const user = await AuthQueries.findTenantUserByEmail(emailOrMobile, tenantDbName);
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact administrator.`);
    }

    const ALLOWED_MOBILE_ROLES = ['pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter'];
    if (!ALLOWED_MOBILE_ROLES.includes(user.role)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = generateJwtToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantDbName: user.tenantDbName,
      parentLeaderId: user.parentLeaderId,
      assignedAcId: user.assignedAcId,
      assignedBoothIds: user.assignedBoothIds,
    });

    const access = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token, access };
  }

  async getMobileProfile(userId: string, tenantDbName?: string | null): Promise<Omit<UserRecord, 'passwordHash'>> {
    const user = await AuthQueries.findTenantUserById(userId, tenantDbName);
    if (!user) {
      throw ApiError.notFound('Mobile user profile not found');
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateMobileProfile(
    userId: string,
    data: { name?: string; mobile?: string; avatar?: string },
    tenantDbName?: string | null
  ): Promise<Omit<UserRecord, 'passwordHash'>> {
    const user = await AuthQueries.findTenantUserById(userId, tenantDbName);
    if (!user) {
      throw ApiError.notFound('Mobile user profile not found');
    }
    const targetDbName = user.tenantDbName || tenantDbName;
    if (!targetDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }
    const updated = await AuthQueries.updateTenantUserProfile(userId, data, targetDbName);
    const { passwordHash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}

export const mobileAuthService = new MobileAuthService();
