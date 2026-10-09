import { ApiError } from '../utils/apiError';
import { generateJwtToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { AuthQueries, UserRecord } from '../queries/auth.queries';
import { mobileAccessService, MobileAccessConfig } from './mobile/mobileAccess.service';

export interface MobileLoginResult {
  token: string;
  access: MobileAccessConfig;
  user: Omit<UserRecord, 'passwordHash'>;
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
      role: user.role,
      email: user.email,
      assignedAcId: user.assignedAcId,
      tenantDbName: user.tenantDbName,
      parentLeaderId: user.parentLeaderId,
      assignedBoothIds: user.assignedBoothIds,
    });

    const access = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
      customAccessibleTabs: user.accessibleTabs,
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token, access };
  }

  async getMobileProfileFast(userId: string, tenantDbName?: string | null): Promise<Omit<UserRecord, 'passwordHash'>> {
    const { VolunteerAuthQueries } = await import('../queries/auth/volunteerAuth.queries');
    const user = await VolunteerAuthQueries.findVolunteerById(userId, tenantDbName);

    if (!user) {
      throw ApiError.notFound('Mobile user profile not found');
    }

    const { passwordHash, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  async updateMobileProfile(
    userId: string,
    data: { name?: string; mobile?: string; avatar?: string },
    tenantDbName?: string | null
  ): Promise<Omit<UserRecord, 'passwordHash'>> {
    const { VolunteerAuthQueries } = await import('../queries/auth/volunteerAuth.queries');
    const user = await VolunteerAuthQueries.findVolunteerById(userId, tenantDbName);
    if (!user) {
      throw ApiError.notFound('Mobile user profile not found');
    }
    const targetDbName = user.tenantDbName || tenantDbName;
    if (!targetDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }
    const updated = await VolunteerAuthQueries.updateVolunteerProfile(userId, data, targetDbName);
    const { passwordHash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async setupMpin(userId: string, mpin: string, tenantDbName?: string | null): Promise<{ message: string }> {
    if (!mpin || mpin.trim().length !== 4) {
      throw ApiError.badRequest('MPIN must be a 4-digit numeric code');
    }
    const { hashPassword } = await import('../utils/password');
    const { VolunteerAuthQueries } = await import('../queries/auth/volunteerAuth.queries');
    
    const user = await VolunteerAuthQueries.findVolunteerById(userId, tenantDbName);
    if (!user) {
      throw ApiError.notFound('Mobile user profile not found');
    }
    const targetDbName = user.tenantDbName || tenantDbName;
    if (!targetDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    const hashedMpin = await hashPassword(mpin.trim());
    await VolunteerAuthQueries.updateVolunteerMpin(userId, hashedMpin, targetDbName);
    return { message: 'MPIN created and saved successfully on server' };
  }

  async verifyMpinLogin(mobile: string, mpin: string, tenantDbName?: string | null): Promise<MobileLoginResult> {
    const cleanMobile = mobile.trim();
    const cleanMpin = mpin.trim();

    if (!cleanMobile || !cleanMpin || cleanMpin.length !== 4) {
      throw ApiError.badRequest('Mobile number and 4-digit MPIN are required');
    }

    const { VolunteerAuthQueries } = await import('../queries/auth/volunteerAuth.queries');
    const user = await VolunteerAuthQueries.findVolunteerByIdentifier(cleanMobile, tenantDbName);
    if (!user) {
      throw ApiError.unauthorized('No registered account found for this mobile number');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact administrator.`);
    }

    if (!user.mpinHash) {
      throw ApiError.badRequest('MPIN is not set up for this account. Please log in using OTP to set up your MPIN.');
    }

    const isMatch = await comparePassword(cleanMpin, user.mpinHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid MPIN. Please try again.');
    }

    const token = generateJwtToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      assignedAcId: user.assignedAcId,
      tenantDbName: user.tenantDbName,
      parentLeaderId: user.parentLeaderId,
      assignedBoothIds: user.assignedBoothIds,
    });

    const access = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
      customAccessibleTabs: user.accessibleTabs,
    });

    const { passwordHash, mpinHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token, access };
  }
}

export const mobileAuthService = new MobileAuthService();
