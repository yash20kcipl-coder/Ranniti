import { ApiError } from '../utils/apiError';
import { generateJwtToken } from '../utils/jwt';
import { SuperAdminAuthQueries } from '../queries/auth/superAdminAuth.queries';
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

    let isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      // Check common auto-generated password variants (e.g. Yash8388@ vs Yash@8388, casing)
      const variants: string[] = [];

      // If ends with @: e.g. Yash8388@ -> Yash@8388
      const endAtMatch = password.match(/^([a-zA-Z]+)(\d+)@$/);
      if (endAtMatch) {
        const letters = endAtMatch[1];
        const digits = endAtMatch[2];
        const capLetters = letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
        variants.push(`${letters}@${digits}`);
        variants.push(`${capLetters}@${digits}`);
        variants.push(`${letters.toLowerCase()}@${digits}`);
      }

      // If has @ in middle: e.g. Yash@8388 -> Yash8388@
      const midAtMatch = password.match(/^([a-zA-Z]+)@(\d+)$/);
      if (midAtMatch) {
        const letters = midAtMatch[1];
        const digits = midAtMatch[2];
        const capLetters = letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
        variants.push(`${letters}${digits}@`);
        variants.push(`${capLetters}${digits}@`);
        variants.push(`${letters.toLowerCase()}${digits}@`);
      }

      // First letter case variation
      const capFirst = password.charAt(0).toUpperCase() + password.slice(1);
      const lowFirst = password.charAt(0).toLowerCase() + password.slice(1);
      variants.push(capFirst, lowFirst);

      for (const variant of variants) {
        if (variant !== password) {
          const match = await comparePassword(variant, user.passwordHash);
          if (match) {
            isMatch = true;
            break;
          }
        }
      }
    }

    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const ALLOWED_WEB_ROLES = ['tenant_admin', 'super_admin', 'tenant_user'];
    if (!ALLOWED_WEB_ROLES.includes(user.role)) {
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
    const FIELD_ROLES = ['pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter'];
    const isFieldRole = data.role && FIELD_ROLES.includes(data.role);

    if (isFieldRole && data.tenantDbName) {
      const existing = await AuthQueries.findTenantUserByEmail(data.email, data.tenantDbName);
      if (existing) {
        throw ApiError.badRequest('Volunteer account with this email or mobile already exists in this tenant');
      }
      const passwordHash = await hashPassword(data.password);
      const user = await AuthQueries.createTenantUser(
        {
          ...data,
          role: data.role!,
          passwordHash,
        },
        data.tenantDbName
      );
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

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

  async exitImpersonation(impersonatedBy: string): Promise<LoginResult> {
    const superAdmin = await SuperAdminAuthQueries.findSuperAdminById(impersonatedBy);
    if (!superAdmin) {
      throw ApiError.notFound('Super Admin account not found');
    }

    if (superAdmin.status !== 'active') {
      throw ApiError.forbidden(`Super Admin account is ${superAdmin.status}`);
    }

    const token = generateJwtToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    const { passwordHash, ...userWithoutPassword } = superAdmin;
    return { user: userWithoutPassword as any, token };
  }
}


export const authService = new AuthService();
