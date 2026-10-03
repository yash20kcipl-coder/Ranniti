import { ApiError } from '../utils/apiError';
import { generateJwtToken } from '../utils/jwt';
import { AuthQueries, UserRecord } from '../queries/auth.queries';
import { comparePassword } from '../utils/password';

export interface MobileLoginResult {
  user: Omit<UserRecord, 'passwordHash'>;
  token: string;
}

export class MobileAuthService {
  async mobileLogin(emailOrMobile: string, password: string): Promise<MobileLoginResult> {
    const user = await AuthQueries.findUserByEmail(emailOrMobile);
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

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getMobileProfile(userId: string): Promise<Omit<UserRecord, 'passwordHash'>> {
    const user = await AuthQueries.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('Mobile user profile not found');
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const mobileAuthService = new MobileAuthService();
