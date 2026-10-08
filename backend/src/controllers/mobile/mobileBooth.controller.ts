import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileBoothService } from '../../services/mobile/mobileBooth.service';

export class MobileBoothController {
  getAssignedBooths = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const query = req.query;

    const options = {
      search: (query.search as string) || '',
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 25,
    };

    const result = await mobileBoothService.getAssignedBooths(user, options);
    const response = ApiResponse.success(result, 'Assigned booths retrieved successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileBoothController = new MobileBoothController();
