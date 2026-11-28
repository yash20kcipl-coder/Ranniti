import { ApiError } from '../utils/apiError';
import { generateJwtToken, verifySelectionToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { AuthQueries, UserRecord } from '../queries/auth.queries';
import { VolunteerAuthQueries, VolunteerProfileSummary } from '../queries/auth/volunteerAuth.queries';
import { mobileAccessService, MobileAccessConfig } from './mobile/mobileAccess.service';
import { SyncManifestService } from './syncManifest.service';
import { query as masterQuery } from '../queries/dbPool';

export interface MobileLoginResult {
  requiresTenantSelection?: false;
  token: string;
  access: MobileAccessConfig;
  user: Omit<UserRecord, 'passwordHash'>;
  serverVersions?: Record<string, number>;
}

export interface MobileTenantSelectionResult {
  requiresTenantSelection: true;
  selectionToken?: string;
  profiles: VolunteerProfileSummary[];
}

export type MobileAuthResponse = MobileLoginResult | MobileTenantSelectionResult;

export const ALLOWED_MOBILE_ROLES = ['pc_leader', 'ac_leader', 'sub_leader', 'supporter'] as const;

export class MobileAuthService {
  private async isPasswordMatch(password: string, passwordHash: string): Promise<boolean> {
    let isMatch = await comparePassword(password, passwordHash);
    if (!isMatch) {
      const variants: string[] = [];

      const atMatch = password.match(/^([a-zA-Z]+)@(\d+)$/);
      if (atMatch) {
        variants.push(`${atMatch[1]}${atMatch[2]}#`);
        variants.push(`${atMatch[1]}${atMatch[2]}@`);
      }

      const hashMatch = password.match(/^([a-zA-Z]+)(\d+)#$/);
      if (hashMatch) {
        variants.push(`${hashMatch[1]}@${hashMatch[2]}`);
      }

      const endAtMatch = password.match(/^([a-zA-Z]+)(\d+)@$/);
      if (endAtMatch) {
        variants.push(`${endAtMatch[1]}@${endAtMatch[2]}`);
      }

      for (const variant of variants) {
        if (variant !== password) {
          const match = await comparePassword(variant, passwordHash);
          if (match) {
            isMatch = true;
            break;
          }
        }
      }
    }
    return isMatch;
  }

  private async buildLoginResult(user: UserRecord): Promise<MobileLoginResult> {
    const token = generateJwtToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      assignedAcId: user.assignedAcId,
      tenantDbName: user.tenantDbName,
      parentLeaderId: user.parentLeaderId,
    });

    const access = await mobileAccessService.getRoleAccessConfig({
      role: user.role,
      tenantDbName: user.tenantDbName,
      customAccessibleTabs: user.accessibleTabs,
    });

    let serverVersions: Record<string, number> | undefined;
    if (user.tenantDbName) {
      try {
        const tRes = await masterQuery(
          `SELECT id FROM tenants WHERE tenant_db_name = $1 LIMIT 1`,
          [user.tenantDbName]
        );
        const tenantId = tRes.rows[0]?.id;
        if (tenantId) {
          serverVersions = await SyncManifestService.getManifestVersions(tenantId);
        }
      } catch {
        // Non-blocking
      }
    }

    const { passwordHash, ...userWithoutPassword } = user;
    delete (userWithoutPassword as any).mpinHash;
    return { user: userWithoutPassword, token, access, serverVersions };
  }

  async mobileLogin(emailOrMobile: string, password: string, tenantDbName?: string): Promise<MobileAuthResponse> {
    if (!tenantDbName) {
      const allProfiles = await VolunteerAuthQueries.findAllVolunteersByIdentifier(emailOrMobile);
      if (allProfiles.length === 0) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      const activeMobileProfiles = allProfiles.filter(
        (p) => p.status === 'active' && ALLOWED_MOBILE_ROLES.includes(p.role as any)
      );

      if (activeMobileProfiles.length === 0) {
        const first = allProfiles[0];
        if (first.status !== 'active') {
          throw ApiError.forbidden(`Account is ${first.status}. Please contact administrator.`);
        }
        throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
      }

      if (activeMobileProfiles.length > 1) {
        const matchedUsers: { summary: VolunteerProfileSummary; user: UserRecord }[] = [];
        for (const summary of activeMobileProfiles) {
          const candidate = await AuthQueries.findTenantUserByEmail(emailOrMobile, summary.tenantDbName);
          if (candidate && (await this.isPasswordMatch(password, candidate.passwordHash))) {
            matchedUsers.push({ summary, user: candidate });
          }
        }

        if (matchedUsers.length === 0) {
          throw ApiError.unauthorized('Invalid credentials');
        }
        return this.buildLoginResult(matchedUsers[0].user);
      }

      tenantDbName = activeMobileProfiles[0].tenantDbName;
    }

    const user = await AuthQueries.findTenantUserByEmail(emailOrMobile, tenantDbName);
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact administrator.`);
    }

    if (!ALLOWED_MOBILE_ROLES.includes(user.role as any)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
    }

    const isMatch = await this.isPasswordMatch(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    return this.buildLoginResult(user);
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

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact administrator.`);
    }

    if (!ALLOWED_MOBILE_ROLES.includes(user.role as any)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
    }

    const targetDbName = user.tenantDbName || tenantDbName;
    if (!targetDbName) {
      throw ApiError.badRequest('Tenant database configuration missing');
    }

    const hashedMpin = await hashPassword(mpin.trim());
    await VolunteerAuthQueries.updateVolunteerMpin(userId, hashedMpin, targetDbName);
    return { message: 'MPIN created and saved successfully on server' };
  }

  async verifyMpinLogin(mobile: string, mpin: string, tenantDbName?: string | null): Promise<MobileAuthResponse> {
    const cleanMobile = mobile.trim();
    const cleanMpin = mpin.trim();

    if (!cleanMobile || !cleanMpin || cleanMpin.length !== 4) {
      throw ApiError.badRequest('Mobile number and 4-digit MPIN are required');
    }

    if (!tenantDbName) {
      const allProfiles = await VolunteerAuthQueries.findAllVolunteersByIdentifier(cleanMobile);
      if (allProfiles.length === 0) {
        throw ApiError.unauthorized('No registered account found for this mobile number');
      }

      const activeMobileProfiles = allProfiles.filter(
        (p) => p.status === 'active' && ALLOWED_MOBILE_ROLES.includes(p.role as any)
      );

      if (activeMobileProfiles.length === 0) {
        const first = allProfiles[0];
        if (first.status !== 'active') {
          throw ApiError.forbidden(`Account is ${first.status}. Please contact administrator.`);
        }
        throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
      }

      if (activeMobileProfiles.length > 1) {
        const withMpin = activeMobileProfiles.filter((p) => p.hasMpin);
        if (withMpin.length === 0) {
          throw ApiError.badRequest('MPIN is not set up for this account. Please log in using OTP to set up your MPIN.');
        }

        const matchedUsers: { summary: VolunteerProfileSummary; user: UserRecord }[] = [];
        for (const summary of withMpin) {
          const candidate = await VolunteerAuthQueries.findVolunteerByIdentifier(cleanMobile, summary.tenantDbName);
          if (candidate?.mpinHash && (await comparePassword(cleanMpin, candidate.mpinHash))) {
            matchedUsers.push({ summary, user: candidate as unknown as UserRecord });
          }
        }

        if (matchedUsers.length === 0) {
          throw ApiError.unauthorized('Invalid MPIN. Please try again.');
        }
        return this.buildLoginResult(matchedUsers[0].user);
      }

      tenantDbName = activeMobileProfiles[0].tenantDbName;
    }

    const user = await VolunteerAuthQueries.findVolunteerByIdentifier(cleanMobile, tenantDbName);
    if (!user) {
      throw ApiError.unauthorized('No registered account found for this mobile number');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact administrator.`);
    }

    if (!ALLOWED_MOBILE_ROLES.includes(user.role as any)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
    }

    if (!user.mpinHash) {
      throw ApiError.badRequest('MPIN is not set up for this account. Please log in using OTP to set up your MPIN.');
    }

    const isMatch = await comparePassword(cleanMpin, user.mpinHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid MPIN. Please try again.');
    }

    return this.buildLoginResult(user as unknown as UserRecord);
  }

  /**
   * List all active mobile-eligible tenant profiles linked to the user's mobile/email.
   */
  async getLinkedProfiles(
    identifier: string,
    currentTenantDbName?: string | null
  ): Promise<Array<VolunteerProfileSummary & { isCurrent: boolean }>> {
    const allProfiles = await VolunteerAuthQueries.findAllVolunteersByIdentifier(identifier);
    return allProfiles
      .filter((p) => p.status === 'active' && ALLOWED_MOBILE_ROLES.includes(p.role as any))
      .map((p) => ({
        ...p,
        isCurrent: p.tenantDbName === currentTenantDbName,
      }));
  }

  /**
   * Switch the authenticated mobile user to another tenant profile sharing the same mobile/email.
   */
  async switchProfile(identifier: string, targetTenantDbName: string): Promise<MobileLoginResult> {
    if (!targetTenantDbName || !targetTenantDbName.trim()) {
      throw ApiError.badRequest('Target tenant database is required');
    }
    const cleanTargetDb = targetTenantDbName.trim();

    const user = await AuthQueries.findTenantUserByEmail(identifier, cleanTargetDb);
    if (!user) {
      throw ApiError.forbidden('No profile found for your mobile number in the selected campaign.');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact administrator.`);
    }

    if (!ALLOWED_MOBILE_ROLES.includes(user.role as any)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
    }

    return this.buildLoginResult(user);
  }

  /**
   * Complete OTP login after multi-tenant selection using the short-lived selectionToken.
   */
  async completeOtpSelection(selectionToken: string, targetTenantDbName: string): Promise<MobileLoginResult> {
    if (!selectionToken || !targetTenantDbName) {
      throw ApiError.badRequest('selectionToken and targetTenantDbName are required');
    }

    let decoded;
    try {
      decoded = verifySelectionToken(selectionToken);
    } catch {
      throw ApiError.unauthorized('Profile selection session expired. Please verify OTP again.');
    }

    return this.switchProfile(decoded.mobile, targetTenantDbName);
  }
}

export const mobileAuthService = new MobileAuthService();
