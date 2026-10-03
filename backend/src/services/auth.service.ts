import { ApiError } from '../utils/apiError';
import { generateJwtToken } from '../utils/jwt';
import { AuthQueries, UserRecord } from '../queries/auth.queries';
import { comparePassword, hashPassword } from '../utils/password';

export interface LoginResult {
  user: Omit<UserRecord, 'passwordHash'>;
  token: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await AuthQueries.findUserByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact system administrator.`);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const FIELD_ROLES = ['pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter'];
    if (FIELD_ROLES.includes(user.role)) {
      throw ApiError.forbidden(
        'Web access denied. Leaders, Sub-Leaders, and Supporters can only access the Ranniti Mobile Application.'
      );
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

  async registerUser(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    roleName?: string | null;
    mobile?: string;
    avatar?: string | null;
    tenantDbName?: string | null;
    parentLeaderId?: string | null;
    assignedAcId?: string | null;
    assignedBoothIds?: string[];
  }): Promise<Omit<UserRecord, 'passwordHash'>> {
    const existing = await AuthQueries.findUserByEmail(data.email);
    if (existing) {
      throw ApiError.badRequest('User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await AuthQueries.createUser({
      ...data,
      passwordHash,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserProfile(userId: string): Promise<Omit<UserRecord, 'passwordHash'>> {
    const user = await AuthQueries.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await AuthQueries.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect current password');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await AuthQueries.updatePassword(userId, newPasswordHash);
  }
}


export const authService = new AuthService();
