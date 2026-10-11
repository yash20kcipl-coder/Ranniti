import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { mobileInteractionService } from '../../services/mobile/mobileInteraction.service';

export class MobileInteractionController {
  /**
   * Logs a volunteer communication action (call, whatsapp, sms) with a voter.
   */
  logInteraction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.mobileUser!;
    const { voterId, boothId, activityType, metadata } = req.body;

    if (!activityType) {
      res.status(400).json(ApiResponse.error('activityType is required (call, whatsapp, or sms)', 400).body);
      return;
    }

    const result = await mobileInteractionService.logInteraction(user, {
      voterId,
      boothId,
      activityType,
      metadata,
    });

    const response = ApiResponse.success(result, 'Interaction logged successfully');
    res.status(response.statusCode).json(response.body);
  });
}

export const mobileInteractionController = new MobileInteractionController();
