import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class HealthController {
  check = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const healthData = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
    const response = ApiResponse.success(healthData, 'System healthy');
    res.status(response.statusCode).json(response.body);
  });
}

export const healthController = new HealthController();
