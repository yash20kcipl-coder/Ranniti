import { Request, Response } from 'express';
import { attachFileUrls } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { mobileAuthService } from '../services/mobileAuth.service';

export class MobileAuthController {
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, mobile, emailOrMobile, password } = req.body;
    const identifier = emailOrMobile || email || mobile;

    if (!identifier || !password) {
      res.status(400).json(ApiResponse.error('Email or mobile number and password are required', 400).body);
      return;
    }

    const result = await mobileAuthService.mobileLogin(identifier, password);
    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token },
      'Mobile authentication successful'
    );
    res.status(response.statusCode).json(response.body);
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const user = await mobileAuthService.getMobileProfile(userId);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'Mobile user profile retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileAuthController = new MobileAuthController();
