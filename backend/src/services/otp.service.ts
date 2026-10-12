import { ApiError } from '../utils/apiError';
import { generateJwtToken } from '../utils/jwt';
import { OtpQueries } from '../queries/otp.queries';
import { AuthQueries } from '../queries/auth.queries';
import { ALLOWED_MOBILE_ROLES } from './mobileAuth.service';
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

    // 0. Verify user exists and belongs to an authorized mobile role
    const user = await AuthQueries.findTenantUserByEmail(cleanMobile);
    if (!user) {
      throw ApiError.notFound('No registered volunteer account found for this mobile number.');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact your campaign administrator.`);
    }

    if (!ALLOWED_MOBILE_ROLES.includes(user.role as any)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
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
    // In Demo Mode: Always use '1234' or '123456'
    // In Real Mode: Generate random digits (configured by SMS_OTP_LENGTH, default 6)
    const otpLength = parseInt(process.env.SMS_OTP_LENGTH || '6', 10);
    const minVal = Math.pow(10, otpLength - 1);
    const maxVal = Math.pow(10, otpLength) - 1;
    const otpCode = isDemoMode
      ? (otpLength === 4 ? '1234' : '123456')
      : Math.floor(minVal + Math.random() * (maxVal - minVal + 1)).toString();

    if (isDemoMode) {
      await OtpQueries.saveOtp(cleanMobile, otpCode, 5);
      return {
        message: 'Demo OTP sent successfully',
        demoOtp: otpCode,
      };
    }

    // 4. Save to Database Table (otp_verifications)
    const savedOtp = await OtpQueries.saveOtp(cleanMobile, otpCode, 5);

    // 5. Dispatch SMS gateway API call
    const { SmsService } = await import('./sms.service');
    const smsResult = await SmsService.sendOtpSms(cleanMobile, otpCode);

    if (!smsResult.success) {
      // Invalidate the saved OTP so user is not locked out by cooldown/limits
      if (savedOtp?.id) {
        await OtpQueries.invalidateOtp(savedOtp.id);
      }
      throw ApiError.badGateway(smsResult.error || 'Failed to dispatch OTP SMS. Please try again.');
    }

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

    if (!ALLOWED_MOBILE_ROLES.includes(user.role as any)) {
      throw ApiError.forbidden('Admin and Super Admin accounts must log in via the Web Portal.');
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
