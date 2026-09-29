import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { attachFileUrls } from '../utils/fileUrl';

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    const formattedUser = attachFileUrls(result.user, undefined, req);
    const response = ApiResponse.success(
      { user: formattedUser, token: result.token },
      'Login successful'
    );
    res.status(response.statusCode).json(response.body);
  });

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.registerUser(req.body);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'User registered successfully', 201);
    res.status(response.statusCode).json(response.body);
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const user = await authService.getUserProfile(userId);
    const formattedUser = attachFileUrls(user, undefined, req);
    const response = ApiResponse.success(formattedUser, 'User profile retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });

  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    const response = ApiResponse.success(null, 'Password updated successfully');
    res.status(response.statusCode).json(response.body);
  });
}


export const authController = new AuthController();
