import { Request, Response } from 'express';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { mobileAuthService } from '../services/mobileAuth.service';

export class MobileAuthController {
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, mobile, emailOrMobile, password, tenantDbName } = req.body;
    const identifier = emailOrMobile || email || mobile;

    if (!identifier || !password) {
      res.status(400).json(ApiResponse.error('Email or mobile number and password are required', 400).body);
      return;
    }

    const result = await mobileAuthService.mobileLogin(identifier, password, tenantDbName);
    if (result.requiresTenantSelection) {
      const response = ApiResponse.success(result, 'Multiple campaign profiles found. Please select a profile.');
      res.status(response.statusCode).json(response.body);
      return;
    }

    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token, access: result.access, serverVersions: result.serverVersions },
      'Mobile authentication successful'
    );
    res.status(response.statusCode).json(response.body);
  });

  sendOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { mobile, isDemoMode } = req.body;
    const { OtpService } = await import('../services/otp.service');
    const result = await OtpService.sendOtp(mobile, isDemoMode !== undefined ? Boolean(isDemoMode) : false);
    const response = ApiResponse.success(result, result.message);
    res.status(response.statusCode).json(response.body);
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { mobile, otp, tenantDbName } = req.body;
    const { OtpService } = await import('../services/otp.service');
    const result = await OtpService.verifyOtp(mobile, otp, tenantDbName);
    if (result.requiresTenantSelection) {
      const response = ApiResponse.success(result, 'Multiple campaign profiles found. Please select a profile.');
      res.status(response.statusCode).json(response.body);
      return;
    }

    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token, access: result.access, serverVersions: result.serverVersions },
      'Mobile OTP authentication successful'
    );
    res.status(response.statusCode).json(response.body);
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const formattedUser = attachFileUrls(req.mobileUser!, undefined, req);
    const response = ApiResponse.success(formattedUser, 'Mobile user profile retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const tenantDbName = req.user?.tenantDbName;
    const { name, mobile, avatar } = req.body;
    const user = await mobileAuthService.updateMobileProfile(userId, { name, mobile, avatar }, tenantDbName);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'Mobile user profile updated successfully');
    res.status(response.statusCode).json(response.body);
  });

  setupMpin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const tenantDbName = req.user?.tenantDbName;
    const { mpin } = req.body;
    const result = await mobileAuthService.setupMpin(userId, mpin, tenantDbName);
    const response = ApiResponse.success(result, result.message);
    res.status(response.statusCode).json(response.body);
  });

  verifyMpin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { mobile, identifier, mpin, tenantDbName } = req.body;
    const targetMobile = mobile || identifier;
    const result = await mobileAuthService.verifyMpinLogin(targetMobile, mpin, tenantDbName);
    if (result.requiresTenantSelection) {
      const response = ApiResponse.success(result, 'Multiple campaign profiles found. Please select a profile.');
      res.status(response.statusCode).json(response.body);
      return;
    }

    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token, access: result.access, serverVersions: result.serverVersions },
      'Mobile MPIN authentication successful'
    );
    res.status(response.statusCode).json(response.body);
  });

  completeOtpSelection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { selectionToken, targetTenantDbName } = req.body;
    const result = await mobileAuthService.completeOtpSelection(selectionToken, targetTenantDbName);
    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token, access: result.access, serverVersions: result.serverVersions },
      'Profile selected successfully'
    );
    res.status(response.statusCode).json(response.body);
  });

  getProfiles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const identifier = req.mobileUser?.mobile || req.mobileUser?.email || req.user?.email;
    if (!identifier) {
      res.status(400).json(ApiResponse.error('User mobile or email not found', 400).body);
      return;
    }
    const profiles = await mobileAuthService.getLinkedProfiles(identifier, req.user?.tenantDbName);
    const formattedProfiles = profiles.map((p) => attachFileUrls(p, ['avatar'], req));
    const response = ApiResponse.success({ profiles: formattedProfiles }, 'Linked profiles retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  switchProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const identifier = req.mobileUser?.mobile || req.mobileUser?.email || req.user?.email;
    const { targetTenantDbName } = req.body;
    if (!identifier) {
      res.status(400).json(ApiResponse.error('User mobile or email not found', 400).body);
      return;
    }
    const result = await mobileAuthService.switchProfile(identifier, targetTenantDbName);
    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token, access: result.access, serverVersions: result.serverVersions },
      'Switched campaign profile successfully'
    );
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileAuthController = new MobileAuthController();

