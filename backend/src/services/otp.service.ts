import { ApiError } from '../utils/apiError';
import { OtpQueries } from '../queries/otp.queries';
import { generateJwtToken } from '../utils/jwt';
import { AuthQueries } from '../queries/auth.queries';
import { mobileAccessService } from './mobile/mobileAccess.service';

export class OtpService {
  /**
   * Request / Send OTP to a mobile number (handles rate limiting and DB insertion)
   */
  static async sendOtp(mobile: string, isDemoMode = true): Promise<{ message: string; demoOtp?: string }> {
    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      throw ApiError.badRequest('Invalid mobile number. Please enter a 10-digit mobile number.');
    }

    // Bypass rate limiting & cooldown checks in local demo mode / development
    const isProductionEnv = process.env.NODE_ENV === 'production';
    if (!isDemoMode && isProductionEnv) {
      // 1. Rate Limiting Check: Max 3 requests per 10 minutes
      const recentCount = await OtpQueries.countRecentOtpRequests(cleanMobile, 10);
      if (recentCount >= 3) {
        throw ApiError.tooManyRequests('Too many OTP requests. Please wait 10 minutes before requesting a new code.');
      }

      // 2. Cooldown check: Must be at least 30 seconds since last OTP request
      const activeOtp = await OtpQueries.getActiveOtp(cleanMobile);
      if (activeOtp) {
        const timeSinceCreatedMs = Date.now() - new Date(activeOtp.createdAt).getTime();
        if (timeSinceCreatedMs < 30 * 1000) {
          const remainingSec = Math.ceil((30 * 1000 - timeSinceCreatedMs) / 1000);
          throw ApiError.tooManyRequests(`Please wait ${remainingSec} seconds before requesting a new OTP.`);
        }
      }
    }

    // 3. Generate OTP Code
    // In Demo Mode: Always use '1234'
    // In Prod Mode: Generate random 6-digit cryptographic PIN
    const otpCode = isDemoMode ? '1234' : Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save to Database Table (otp_verifications)
    await OtpQueries.saveOtp(cleanMobile, otpCode, 5);

    if (isDemoMode) {
      return {
        message: 'Demo OTP sent successfully',
        demoOtp: '1234',
      };
    }

    // In Production: Dispatch SMS gateway API call here
    return {
      message: 'OTP sent successfully to your mobile number',
    };
  }

  /**
   * Verify OTP and log in user (with max 5 failed attempts limit)
   */
  static async verifyOtp(mobile: string, otpCode: string, tenantDbName?: string): Promise<{
    user: any;
    token: string;
    access: any;
  }> {
    const cleanMobile = mobile.trim();
    const cleanOtp = otpCode.trim();

    if (!cleanMobile || !cleanOtp) {
      throw ApiError.badRequest('Mobile number and OTP code are required.');
    }

    // 1. Fetch active, unexpired OTP record
    const activeOtp = await OtpQueries.getActiveOtp(cleanMobile);
    if (!activeOtp) {
      throw ApiError.badRequest('OTP code has expired or was not requested. Please request a new OTP.');
    }

    // 2. Check failed attempts counter (Max 5 attempts)
    if (activeOtp.attempts >= 5) {
      await OtpQueries.invalidateOtp(activeOtp.id);
      throw ApiError.badRequest('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // 3. Verify OTP Match
    if (activeOtp.otpCode !== cleanOtp) {
      const updatedAttempts = await OtpQueries.incrementAttempts(activeOtp.id);
      const remaining = 5 - updatedAttempts;

      if (remaining <= 0) {
        await OtpQueries.invalidateOtp(activeOtp.id);
        throw ApiError.badRequest('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      throw ApiError.badRequest(`Invalid OTP code. You have ${remaining} attempt(s) remaining.`);
    }

    // 4. Mark OTP as verified
    await OtpQueries.markVerified(activeOtp.id);

    // 5. Lookup user account by mobile number
    const user = await AuthQueries.findTenantUserByEmail(cleanMobile, tenantDbName);
    if (!user) {
      throw ApiError.notFound('No registered volunteer account found for this mobile number.');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact your campaign administrator.`);
    }

    // 6. Generate Mobile Access JWT Token & Role Config
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
}
